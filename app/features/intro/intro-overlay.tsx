import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const EXIT_MS = 2500;
const SKIP_MS = 300;
// Si el vídeo nunca llega a emitir `ended` (autoplay bloqueado, decodificación
// fallida, pestaña en segundo plano), la intro no puede quedarse encallada.
const SAFETY_MS = 11_000;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type Phase = "enter" | "leaving" | "done";

function subscribeToMotion(onChange: () => void) {
	const query = window.matchMedia(REDUCED_MOTION);
	query.addEventListener("change", onChange);
	return () => {
		query.removeEventListener("change", onChange);
	};
}

const readMotion = () => window.matchMedia(REDUCED_MOTION).matches;
// En el servidor no hay preferencia que leer; el CSS ya oculta la cortina antes
// de que hidrate, así que asumir "sin reducir" no llega a verse.
const readMotionOnServer = () => false;

/**
 * Cortina de bienvenida. Se renderiza también en el servidor para que no haya
 * un parpadeo de la landing antes de aparecer; el CSS la retira sola cuando el
 * visitante pide movimiento reducido y el <noscript> la retira si no hay JS,
 * de modo que nunca puede dejar la página tapada.
 */
export function IntroOverlay() {
	const reducedMotion = useSyncExternalStore(subscribeToMotion, readMotion, readMotionOnServer);
	const [phase, setPhase] = useState<Phase>("enter");
	const [exitMs, setExitMs] = useState(EXIT_MS);
	const videoRef = useRef<HTMLVideoElement>(null);
	const skipRef = useRef<HTMLButtonElement>(null);
	const timers = useRef<number[]>([]);

	const dismiss = useCallback((duration: number) => {
		setPhase((current) => {
			if (current !== "enter") return current;
			setExitMs(duration);
			timers.current.push(
				window.setTimeout(() => {
					setPhase("done");
				}, duration),
			);
			return "leaving";
		});
	}, []);

	useEffect(() => {
		// La preferencia se conoce después de hidratar, así que este efecto ya
		// pudo haber bloqueado el scroll en la primera pasada: hay que soltarlo.
		if (reducedMotion) {
			document.body.style.overflow = "";
			return;
		}

		document.body.style.overflow = "hidden";
		skipRef.current?.focus({ preventScroll: true });
		// Autoplay silenciado: si aun así lo rechazan, no bloqueamos la entrada.
		void videoRef.current?.play().catch(() => {
			dismiss(SKIP_MS);
		});

		const skip = () => {
			dismiss(SKIP_MS);
		};
		window.addEventListener("pointerdown", skip);
		window.addEventListener("keydown", skip);
		timers.current.push(
			window.setTimeout(() => {
				dismiss(EXIT_MS);
			}, SAFETY_MS),
		);

		return () => {
			window.removeEventListener("pointerdown", skip);
			window.removeEventListener("keydown", skip);
		};
	}, [dismiss, reducedMotion]);

	useEffect(() => {
		if (phase !== "done") return;
		document.body.style.overflow = "";
	}, [phase]);

	useEffect(() => {
		const pending = timers.current;
		return () => {
			for (const id of pending) window.clearTimeout(id);
			document.body.style.overflow = "";
		};
	}, []);

	if (reducedMotion || phase === "done") return null;

	return (
		<div
			className="intro"
			data-phase={phase}
			style={{ "--intro-exit": `${String(exitMs)}ms` } as React.CSSProperties}
		>
			<video
				ref={videoRef}
				className="intro__video"
				src={`${import.meta.env.BASE_URL}assets/intro.v1.mp4`}
				autoPlay
				muted
				playsInline
				preload="auto"
				aria-hidden="true"
				onEnded={() => {
					dismiss(EXIT_MS);
				}}
				onError={() => {
					dismiss(SKIP_MS);
				}}
			/>
			<button
				ref={skipRef}
				className="intro__skip"
				type="button"
				onClick={() => {
					dismiss(SKIP_MS);
				}}
			>
				Saltar intro
			</button>
		</div>
	);
}
