import { Link } from "react-router";
import type { Route } from "./+types/guia.$sku";
import { cabecerasPrivadas, exigirAcceso } from "../server/guide/guard";
import { listarCapitulos } from "../server/guide/repository";
import { PieDeCopia, Watermark } from "../features/guia/content-guard";
import { ReaderField } from "../three/reader/reader-field";

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: `${loaderData.nombre} — Método Jean` },
		{ name: "robots", content: "noindex, nofollow" },
	];
}

export const headers = () => cabecerasPrivadas;

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const { sesion, db } = await exigirAcceso(request, context, params.sku);

	const producto = await db
		.prepare("SELECT name FROM products WHERE sku = ?")
		.bind(params.sku)
		.first<{ name: string }>();
	if (producto === null) throw new Response("No encontrado", { status: 404 });

	// Solo títulos: el texto se pide capítulo a capítulo.
	return {
		capitulos: await listarCapitulos(db, params.sku),
		nombre: producto.name,
		sku: params.sku,
		email: sesion.email,
	};
}

export default function IndiceProducto({ loaderData }: Route.ComponentProps) {
	const { capitulos, nombre, sku, email } = loaderData;

	return (
		<main className="reader" id="contenido">
			<ReaderField />
			<Watermark email={email} />
			<nav className="reader__crumbs">
				<Link to="/guia" reloadDocument>
					← Tus guías
				</Link>
			</nav>
			<header className="reader__head" data-respiro>
				<h1>{nombre}</h1>
				<p className="reader__lead">Tu copia está vinculada a {email}.</p>
			</header>

			{capitulos.length === 0 ? (
				<p className="gate__aviso">Esta guía todavía no tiene capítulos publicados.</p>
			) : (
				<ol className="chapter-list">
					{capitulos.map((capitulo) => (
						<li key={capitulo.slug}>
							{/* reloadDocument: cada capítulo llega como documento del servidor
							    y nunca como respuesta JSON de navegación. */}
							<Link to={`/guia/${sku}/${capitulo.slug}`} reloadDocument>
								<span className="chapter-list__index">
									{String(capitulo.position).padStart(2, "0")}
								</span>
								<span className="chapter-list__title">{capitulo.title}</span>
								<span className="chapter-list__meta">{capitulo.blocks} bloques</span>
							</Link>
						</li>
					))}
				</ol>
			)}
			<PieDeCopia email={email} />
		</main>
	);
}
