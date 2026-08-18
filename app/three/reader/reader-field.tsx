import { useEffect, useRef } from "react";
import type { ControlLector } from "./reader-engine";

type NavegadorConPistas = Navigator & {
	deviceMemory?: number;
	connection?: { saveData?: boolean };
};

function elegirPerfil() {
	const pistas = navigator as NavegadorConPistas;
	if (
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		(pistas.connection?.saveData ?? false)
	) {
		return "apagado" as const;
	}
	if (window.innerWidth < 520 || (pistas.deviceMemory ?? 8) <= 2) return "bajo" as const;
	if (window.innerWidth < 1100 || pistas.hardwareConcurrency <= 4) return "medio" as const;
	return "alto" as const;
}

/**
 * Fondo animado del lector.
 *
 * La página decide cuánto se agrupan las partículas: junto a un descanso de
 * lectura —el título del capítulo o un apartado nuevo— se condensan en la
 * figura; en mitad de un bloque de texto se abren hacia los lados y dejan la
 * red de enlaces al fondo, para no competir con lo que se está leyendo.
 */
export function ReaderField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const controlRef = useRef<ControlLector | null>(null);

	useEffect(() => {
		const perfil = elegirPerfil();
		if (perfil === "apagado" || canvasRef.current === null) return;

		const corte = new AbortController();
		const { signal } = corte;
		// Se consulta a través de una función: entre el import y la creación del
		// motor hay dos await, y el análisis de flujo daría el valor por fijo.
		const cancelado = () => signal.aborted;
		let soltar: (() => void) | undefined;

		void import("./reader-engine")
			.then(({ crearCampoLector, PERFILES_LECTOR }) => {
				if (cancelado() || canvasRef.current === null) return;
				const control = crearCampoLector({
					canvas: canvasRef.current,
					perfil: PERFILES_LECTOR[perfil],
				});
				if (cancelado()) {
					control.dispose();
					return;
				}
				controlRef.current = control;

				let ultimoY = window.scrollY;
				let recorrido = 0;
				let pendiente = false;

				const medir = () => {
					pendiente = false;
					const alto = window.innerHeight;
					// Distancia a la que queda el respiro más cercano *fuera* de la
					// pantalla. Con el título a la vista vale cero y la figura se
					// monta entera; a medio texto no hay ninguno cerca y se deshace.
					let mejor = Number.POSITIVE_INFINITY;
					for (const marca of document.querySelectorAll<HTMLElement>("[data-respiro]")) {
						const caja = marca.getBoundingClientRect();
						const fuera = Math.max(0, caja.top - alto, -caja.bottom);
						mejor = Math.min(mejor, fuera);
					}
					const cohesion = mejor === Number.POSITIVE_INFINITY ? 1 : 1 - Math.min(1, mejor / 520);
					control.setCohesion(cohesion);
				};

				const alDesplazar = () => {
					const y = window.scrollY;
					const avance = ultimoY - y;
					control.empujar(avance * 0.0016);
					// Recorrido acumulado en unidades de la escena: el campo se desplaza
					// tanto como la lectura, no solo un tirón al mover la rueda.
					recorrido += avance * 0.0075;
					control.setScroll(recorrido);
					ultimoY = y;
					if (!pendiente) {
						pendiente = true;
						requestAnimationFrame(medir);
					}
				};

				medir();
				window.addEventListener("scroll", alDesplazar, { passive: true, signal });
				window.addEventListener("resize", medir, { passive: true, signal });
				soltar = () => {
					control.dispose();
					controlRef.current = null;
				};
			})
			.catch(() => {
				// Sin fondo animado la guía se lee igual: no se avisa de nada.
			});

		return () => {
			corte.abort();
			soltar?.();
		};
	}, []);

	return (
		<div className="reader-field" aria-hidden="true">
			<canvas ref={canvasRef} />
		</div>
	);
}
