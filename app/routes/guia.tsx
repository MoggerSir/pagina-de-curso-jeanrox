import { Link, redirect } from "react-router";
import type { Route } from "./+types/guia";
import { cabecerasPrivadas } from "../server/guide/guard";
import { leerSesion, tieneAcceso } from "../server/auth/session";
import { PieDeCopia, Watermark } from "../features/guia/content-guard";
import { ReaderField } from "../three/reader/reader-field";

export function meta() {
	return [{ title: "Tus guías — Método Jean" }, { name: "robots", content: "noindex, nofollow" }];
}

export const headers = () => cabecerasPrivadas;

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const sesion = await leerSesion(request, env.DB, env.SESSION_SECRET);
	if (sesion === null) throw redirect("/acceso");

	const { results } = await env.DB.prepare(
		`SELECT p.sku, p.name, p.requires_purchase, COUNT(c.slug) AS chapters
		 FROM products p
		 LEFT JOIN chapters c ON c.product_sku = p.sku
		 GROUP BY p.sku
		 ORDER BY p.requires_purchase, p.sku`,
	).all<{ sku: string; name: string; requires_purchase: number; chapters: number }>();

	// El derecho se resuelve aquí y no en la plantilla: la vista solo pinta.
	const productos = await Promise.all(
		results.map(async (producto) => ({
			...producto,
			abierto: await tieneAcceso(env.DB, sesion.customerId, producto.sku),
		})),
	);

	return { productos, email: sesion.email };
}

export default function Guia({ loaderData }: Route.ComponentProps) {
	const { productos, email } = loaderData;

	return (
		<main className="reader" id="contenido">
			<ReaderField />
			<Watermark email={email} />
			<header className="reader__head" data-respiro>
				<p className="eyebrow">Acceso privado</p>
				<h1>Tus guías</h1>
				<p className="reader__lead">Tu copia está vinculada a {email}.</p>
			</header>

			<ul className="product-list">
				{productos.map((producto) => (
					<li key={producto.sku} data-abierto={producto.abierto}>
						<div>
							<h2>{producto.name}</h2>
							<p>
								{producto.chapters === 0
									? "Pendiente de publicar"
									: `${String(producto.chapters)} capítulos`}
								{producto.requires_purchase === 1 ? " · Requiere compra" : " · Gratuita"}
							</p>
						</div>
						{producto.abierto && producto.chapters > 0 ? (
							<Link className="button button--primary" to={`/guia/${producto.sku}`} reloadDocument>
								Abrir
							</Link>
						) : (
							<span className="product-list__estado">
								{producto.abierto ? "Sin contenido aún" : "Sin acceso"}
							</span>
						)}
					</li>
				))}
			</ul>

			<form className="reader__exit" method="post" action="/acceso/salir">
				<button className="button" type="submit">
					Cerrar sesión
				</button>
			</form>
			<PieDeCopia email={email} />
		</main>
	);
}
