import { useEffect, useRef, useState } from "react";
import { QUALITY_PROFILES, selectParticleQuality, type ParticleQuality } from "./particles/quality";

type NavigatorWithHints = Navigator & {
	deviceMemory?: number;
	connection?: { saveData?: boolean };
};

export function ParticleCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [quality, setQuality] = useState<ParticleQuality>("static");

	useEffect(() => {
		const hints = navigator as NavigatorWithHints;
		const selected = selectParticleQuality({
			reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
			saveData: hints.connection?.saveData ?? false,
			width: window.innerWidth,
			deviceMemory: hints.deviceMemory,
			hardwareConcurrency: hints.hardwareConcurrency,
		});
		setQuality(selected);
		if (selected === "static" || canvasRef.current === null) return;

		let dispose: (() => void) | undefined;
		const lifecycle = { cancelled: false };
		const retainDispose = (nextDispose: () => void) => {
			if (lifecycle.cancelled) nextDispose();
			else dispose = nextDispose;
		};
		const launch = () => {
			void import("./particles/particle-engine")
				.then(async ({ createParticleEngine }) => {
					if (lifecycle.cancelled || canvasRef.current === null) return;
					const nextDispose = await createParticleEngine({
						canvas: canvasRef.current,
						profile: QUALITY_PROFILES[selected],
					});
					retainDispose(nextDispose);
				})
				.catch(() => {
					if (!lifecycle.cancelled) setQuality("static");
				});
		};
		const idleId = window.setTimeout(launch, 80);

		return () => {
			lifecycle.cancelled = true;
			window.clearTimeout(idleId);
			dispose?.();
		};
	}, []);

	return (
		<div className="particle-stage" data-quality={quality} aria-hidden="true">
			<div className="particle-fallback" />
			<canvas ref={canvasRef} className="particle-canvas" />
			<div className="particle-stage__hud">
				<span>FORMATION / ASCENT</span>
				<span>Q:{quality.toUpperCase()}</span>
			</div>
		</div>
	);
}
