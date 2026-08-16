import { useState } from "react";
import { transformations } from "./content";

const base = import.meta.env.BASE_URL;

/**
 * Cinta de antes/después en bucle. La secuencia se duplica para que el salto
 * del bucle no tenga costura; la copia queda fuera del árbol de accesibilidad
 * para no anunciar cada caso dos veces.
 */
export function TransformationRail() {
	const [paused, setPaused] = useState(false);
	const secuencia = [...transformations, ...transformations];

	return (
		<div className={`rail-shell${paused ? " rail-shell--paused" : ""}`}>
			<div className="rail__chrome">
				<p>
					<span className="rail__status" aria-hidden="true" />
					ARCHIVO / TRANSFORMACIONES
				</p>
				<span aria-hidden="true">AUTO SCAN · 01—04</span>
				<button
					type="button"
					className="rail__control"
					aria-pressed={paused}
					onClick={() => {
						setPaused((value) => !value);
					}}
				>
					{paused ? "Reanudar" : "Pausar"}
				</button>
			</div>

			{/* Enfocable para que teclado y movimiento reducido puedan explorar la cinta. */}
			<div className="rail" tabIndex={0} role="group" aria-label="Antes y después de seguidores">
				<span className="rail__scanner" aria-hidden="true" />
				<ul className="rail__track">
					{secuencia.map((caso, index) => {
						const duplicado = index >= transformations.length;
						return (
							<li className="pair" key={`${caso.id}-${String(index)}`} aria-hidden={duplicado}>
								<figure className="pair__shot">
									<img
										src={`${base}assets/resultados/antes-${caso.id}.svg`}
										alt={duplicado ? "" : `Caso ${caso.id}, antes`}
										width={600}
										height={800}
										loading="lazy"
										draggable={false}
									/>
									<figcaption>Antes</figcaption>
								</figure>
								<figure className="pair__shot pair__shot--after">
									<img
										src={`${base}assets/resultados/despues-${caso.id}.svg`}
										alt={duplicado ? "" : `Caso ${caso.id}, después`}
										width={600}
										height={800}
										loading="lazy"
										draggable={false}
									/>
									<figcaption>Después</figcaption>
								</figure>
								<p className="pair__meta">
									<strong>{caso.id}</strong>
									<span>{caso.meses}</span>
									<span>{caso.foco}</span>
								</p>
							</li>
						);
					})}
				</ul>
			</div>

			<div className="rail__legend" aria-hidden="true">
				<span>HOVER / PAUSA</span>
				<i />
				<span>SECUENCIA 04</span>
			</div>
		</div>
	);
}
