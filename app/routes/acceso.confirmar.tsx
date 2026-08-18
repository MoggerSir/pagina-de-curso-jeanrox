import { Link } from "react-router";
import type { Route } from "./+types/acceso.confirmar";
import { confirmarAcceso } from "../server/auth/login";
import { crearSesion } from "../server/auth/session";
import { cabecerasPrivadas } from "../server/guide/guard";

export function meta() {
	return [
		{ title: "Confirmando tu correo — Método Jean" },
		{ name: "robots", content: "noindex, nofollow" },
	];
}

export const headers = () => cabecerasPrivadas;

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const token = new URL(request.url).searchParams.get("t");
	if (token === null || token === "") return { motivo: "invalido" as const };

	const resultado = await confirmarAcceso(env.DB, token);
	if (!resultado.ok) return { motivo: resultado.motivo };

	const { cookie } = await crearSesion(env.DB, resultado.customerId, env.SESSION_SECRET);
	// Redirección con la sesión ya puesta: así el token deja de estar en la
	// barra de direcciones, en el historial y en la cabecera Referer.
	throw new Response(null, {
		status: 303,
		headers: { Location: "/guia", "Set-Cookie": cookie },
	});
}

const MENSAJES = {
	invalido: {
		titulo: "Este enlace no vale",
		texto: "Puede que se haya cortado al copiarlo. Pide uno nuevo y ábrelo desde el correo.",
	},
	caducado: {
		titulo: "El enlace caducó",
		texto: "Los enlaces duran 15 minutos por seguridad. Pide otro y tendrás uno recién hecho.",
	},
	usado: {
		titulo: "Este enlace ya se usó",
		texto: "Cada enlace funciona una sola vez. Si ya no tienes la sesión abierta, pide otro.",
	},
};

export default function Confirmar({ loaderData }: Route.ComponentProps) {
	const { titulo, texto } = MENSAJES[loaderData.motivo];

	return (
		<main className="gate" id="contenido">
			<p className="eyebrow">Confirmación de correo</p>
			<h1>{titulo}</h1>
			<div className="gate__panel">
				<p>{texto}</p>
				<Link className="button button--primary button--wide" to="/acceso">
					Pedir un enlace nuevo
				</Link>
			</div>
		</main>
	);
}
