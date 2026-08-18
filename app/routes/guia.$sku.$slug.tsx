import { Link } from "react-router";
import type { Route } from "./+types/guia.$sku.$slug";
import { cabecerasPrivadas, exigirAcceso } from "../server/guide/guard";
import { leerCapitulo, registrarLectura } from "../server/guide/repository";
import {
	MarcaEnTexto,
	PieDeCopia,
	useContentGuard,
	Watermark,
} from "../features/guia/content-guard";
import { ReaderField } from "../three/reader/reader-field";

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: `${loaderData.title} — Método Jean` },
		{ name: "robots", content: "noindex, nofollow" },
	];
}

export const headers = () => cabecerasPrivadas;

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const { sesion, db } = await exigirAcceso(request, context, params.sku);

	const capitulo = await leerCapitulo(db, params.sku, params.slug);
	if (capitulo === null) throw new Response("Capítulo no encontrado", { status: 404 });

	const { excedido } = await registrarLectura(db, sesion.customerId, params.slug);
	if (excedido) {
		// Ritmo imposible para una lectura humana: se corta antes de entregar más.
		throw new Response("Demasiadas lecturas seguidas. Espera un momento.", { status: 429 });
	}

	return { ...capitulo, sku: params.sku, email: sesion.email };
}

export default function Capitulo({ loaderData }: Route.ComponentProps) {
	const { title, position, blocks, anterior, siguiente, sku, email } = loaderData;
	useContentGuard();

	return (
		<main className="reader reader--chapter" id="contenido">
			{/* Cada capítulo estrena figura: al pasar de uno a otro, la nube se
			    recompone en otra cosa. */}
			<ReaderField />
			<Watermark email={email} />
			<nav className="reader__crumbs">
				<Link to={`/guia/${sku}`} reloadDocument>
					← Índice
				</Link>
				<span>{String(position).padStart(2, "0")}</span>
			</nav>

			<article className="prose">
				<h1 data-respiro>{title}</h1>
				{blocks.map((bloque, indice) => {
					// La firma vuelve a aparecer cada pocos bloques: así ningún
					// recorte razonable del capítulo sale sin ella dentro.
					// Cada seis bloques, y siempre una tras el arranque: los capítulos
					// cortos también tienen que salir firmados.
					const firma =
						indice > 0 && (indice % 6 === 0 || indice === 3) ? (
							<MarcaEnTexto key={`m${String(indice)}`} email={email} />
						) : null;
					if (bloque.kind === "heading") return [firma, <h2 key={indice}>{bloque.text}</h2>];
					if (bloque.kind === "list")
						return [
							firma,
							<p key={indice} className="prose__item">
								{bloque.text}
							</p>,
						];
					return [firma, <p key={indice}>{bloque.text}</p>];
				})}
				<PieDeCopia email={email} />
			</article>

			<nav className="reader__pager" data-respiro>
				{anterior === null ? (
					<span />
				) : (
					<Link className="button" to={`/guia/${sku}/${anterior}`} reloadDocument>
						← Anterior
					</Link>
				)}
				{siguiente === null ? (
					<span />
				) : (
					<Link className="button button--primary" to={`/guia/${sku}/${siguiente}`} reloadDocument>
						Siguiente →
					</Link>
				)}
			</nav>
		</main>
	);
}
