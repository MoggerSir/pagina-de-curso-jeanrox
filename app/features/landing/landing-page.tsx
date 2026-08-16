import { ParticleCanvas } from "../../three/particle-canvas";
import { useRevealMotion } from "../../hooks/use-reveal-motion";
import { communityLinks, faqs, heroFeatures, stages } from "./content";
import { TransformationRail } from "./transformation-rail";
import {
	DiscordIcon,
	InstagramIcon,
	MetricsIcon,
	ShieldIcon,
	TargetIcon,
	TwitterIcon,
	YoutubeIcon,
} from "./hero-icons";

const featureIcons = {
	target: TargetIcon,
	shield: ShieldIcon,
	metrics: MetricsIcon,
};

const communityIcons = {
	discord: DiscordIcon,
	instagram: InstagramIcon,
	youtube: YoutubeIcon,
	twitter: TwitterIcon,
};

// Instrumentación de marca: acompaña al canvas sin describir datos reales, por
// eso queda fuera del árbol de accesibilidad y no intercepta el puntero.
function HeroInstruments() {
	return (
		<div className="hero__hud" aria-hidden="true">
			<div className="hud-frame" />
			<div className="hud-scale">
				<span>02</span>
				<span>04</span>
				<span>05</span>
			</div>
			<div className="hud-panel hud-panel--progress">
				<p className="hud-panel__label">// Progreso</p>
				<div className="hud-bars">
					{Array.from({ length: 14 }, (_, index) => (
						<i key={index} style={{ height: `${String(28 + ((index * 37) % 62))}%` }} />
					))}
				</div>
				<strong>87%</strong>
				<ul>
					<li>Disciplina</li>
					<li>Consistencia</li>
					<li>Mejora</li>
				</ul>
			</div>
			<div className="hud-panel hud-panel--state">
				<p className="hud-panel__label">// Estado</p>
				<ul>
					{["Chad Lite", "Chad", "Adam"].map((axis) => (
						<li key={axis}>
							<span>{axis}</span>
							<i />
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

function SectionHeading({ index, title, copy }: { index: string; title: string; copy: string }) {
	return (
		<header className="section-heading">
			<p className="eyebrow">{index} / SIGNAL</p>
			<h2>{title}</h2>
			<p>{copy}</p>
		</header>
	);
}

export function LandingPage() {
	useRevealMotion();

	return (
		<main id="contenido">
			<section id="inicio" className="hero section-grid" aria-labelledby="hero-title">
				<div className="hero__copy">
					<p className="eyebrow">
						LOOKSMAXXING PROTOCOL / <span className="eyebrow__accent">JEANROX</span>
					</p>
					<h1 id="hero-title">
						Guía <small>by</small>
						<br /> <span>Jeanrox</span>
						<i className="hero__terminator" aria-hidden="true" />
					</h1>
					<p className="hero__lead">
						¿Quieres pasar de un SUB 5 a un Chad Lite? Estás en el lugar adecuado. Una guía de
						looksmaxxing creada para ayudarte a entender y mejorar tu apariencia con el mejor
						método.
					</p>
					<div className="button-row">
						<a className="button button--primary" href="#programa">
							Explorar el método <span aria-hidden="true">↘</span>
						</a>
						<a className="button button--ghost" href="#guia">
							Guía gratuita
						</a>
					</div>
					<ul className="hero__features" aria-label="Características principales">
						{heroFeatures.map((feature) => {
							const Icon = featureIcons[feature.icon];
							return (
								<li key={feature.title}>
									<Icon className="hero__feature-icon" />
									<span className="hero__feature-text">
										<strong>{feature.title}</strong>
										<small>{feature.copy}</small>
									</span>
								</li>
							);
						})}
					</ul>

					<div className="hero__community">
						<p className="eyebrow">Únete a la comunidad</p>
						<ul>
							{communityLinks.map((link) => {
								const Icon = communityIcons[link.id];
								return (
									<li key={link.id}>
										{link.href === null ? (
											<span className="social-dot" title={`${link.label}: enlace pendiente`}>
												<Icon />
											</span>
										) : (
											<a className="social-dot" href={link.href} aria-label={link.label}>
												<Icon />
											</a>
										)}
									</li>
								);
							})}
						</ul>
					</div>
				</div>
				<div className="hero__visual">
					<ParticleCanvas />
				</div>
				<HeroInstruments />
				<a className="hero__scroll" href="#resultados">
					Desliza para explorar <span aria-hidden="true" />
				</a>
			</section>

			<section id="resultados" className="results" data-reveal>
				<div className="results__head">
					<p className="eyebrow">01 / ANTES · DESPUÉS</p>
					<h2>
						Cambios físicos
						<br />
						generados por la guía.
					</h2>
					<p>Transformaciones reales de seguidores que aplicaron el método.</p>
				</div>
				<TransformationRail />
			</section>

			<section id="programa" className="method section-shell" data-reveal>
				<SectionHeading
					index="02"
					title="Una estructura para avanzar."
					copy="El programa organiza el contenido en una progresión legible. Cada etapa responde una pregunta y prepara la siguiente."
				/>
				<div className="stage-list">
					{stages.map((stage) => (
						<article className="stage-card" key={stage.index}>
							<p className="stage-card__index">{stage.index}</p>
							<h3>{stage.title}</h3>
							<p>{stage.copy}</p>
							<span aria-hidden="true">↗</span>
						</article>
					))}
				</div>
			</section>

			<section className="platform section-grid" data-reveal>
				<div>
					<SectionHeading
						index="03"
						title="El curso vive contigo. No en otro PDF perdido."
						copy="Accede por capítulos desde celular o computador. Tu sesión, progreso y contenido se mantienen en un solo lugar."
					/>
					<ul className="check-list">
						<li>Inicio de sesión simple con Google</li>
						<li>Acceso automático después del pago</li>
						<li>Contenido organizado y actualizado</li>
						<li>Marca de agua vinculada a cada acceso</li>
					</ul>
				</div>
				<div className="device-frame" aria-label="Vista conceptual del lector del curso">
					<div className="device-frame__top">
						<span>READER / 01</span>
						<span>67%</span>
					</div>
					<div className="device-frame__content">
						<p>CAPÍTULO 04</p>
						<h3>De la intención al sistema.</h3>
						<div className="content-lines">
							<i />
							<i />
							<i />
							<i />
							<i />
						</div>
					</div>
					<div className="device-frame__progress">
						<span />
					</div>
				</div>
			</section>

			<section id="guia" className="guide section-shell" data-reveal>
				<div className="guide__visual" aria-hidden="true">
					<div className="guide__cover">
						<span>FREE / 00</span>
						<strong>
							GUÍA
							<br />
							INICIAL
						</strong>
						<small>MÉTODO JEAN</small>
					</div>
				</div>
				<div className="guide__copy">
					<p className="eyebrow">04 / PUNTO DE ENTRADA</p>
					<h2>Empieza sin pagar. Evalúa el método por ti mismo.</h2>
					<p>
						La guía gratuita será una pieza útil por sí sola, no un archivo vacío diseñado
						únicamente para venderte algo.
					</p>
					<button
						className="button button--primary"
						type="button"
						disabled
						title="Disponible cuando Jean entregue el archivo"
					>
						Próximamente disponible
					</button>
					<p className="microcopy">El archivo definitivo aún está pendiente de entrega.</p>
				</div>
			</section>

			<section className="proof section-shell" data-reveal>
				<SectionHeading
					index="05"
					title="Confianza sin fabricar señales."
					copy="Aquí aparecerán únicamente opiniones reales y autorizadas de personas que hayan accedido al contenido."
				/>
				<div className="proof__empty">
					<span aria-hidden="true">[ ··· ]</span>
					<p>Reseñas verificadas en preparación.</p>
					<small>No publicamos testimonios inventados.</small>
				</div>
			</section>

			<section id="acceso" className="offer section-grid" data-reveal>
				<div>
					<p className="eyebrow">06 / ACCESO</p>
					<h2>
						Todo el método.
						<br />
						Una sola ruta.
					</h2>
				</div>
				<div className="offer__panel">
					<p className="offer__status">CONFIGURACIÓN COMERCIAL PENDIENTE</p>
					<div className="offer__price">
						<span>PRECIO</span>
						<strong>POR CONFIRMAR</strong>
					</div>
					<ul>
						<li>Curso completo por capítulos</li>
						<li>Acceso móvil y escritorio</li>
						<li>Actualizaciones dentro de la plataforma</li>
						<li>Soporte filtrado por preguntas frecuentes</li>
					</ul>
					<button className="button button--primary button--wide" type="button" disabled>
						Pago aún no habilitado
					</button>
					<small>Se activará cuando Jean confirme precio, moneda y pasarela.</small>
				</div>
			</section>

			<section id="faq" className="faq section-shell" data-reveal>
				<SectionHeading
					index="07"
					title="Antes de escribir, probablemente está aquí."
					copy="Respuestas directas a las dudas más comunes sobre acceso y funcionamiento."
				/>
				<div className="faq__list">
					{faqs.map((faq, index) => (
						<details key={faq.question}>
							<summary>
								<span>{String(index + 1).padStart(2, "0")}</span>
								{faq.question}
							</summary>
							<p>{faq.answer}</p>
						</details>
					))}
				</div>
			</section>

			<section className="final-cta section-shell">
				<p className="eyebrow">08 / NEXT SIGNAL</p>
				<h2>
					Del ruido
					<br />a una dirección.
				</h2>
				<p>Conoce el programa. Prueba la guía. Decide con información clara.</p>
				<a className="button button--primary" href="#programa">
					Revisar el método <span aria-hidden="true">↑</span>
				</a>
			</section>
		</main>
	);
}
