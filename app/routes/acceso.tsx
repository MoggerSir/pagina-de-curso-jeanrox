import { Form, redirect, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/acceso";
import { leerSesion } from "../server/auth/session";
import { correoValido, normalizarCorreo, solicitarAcceso } from "../server/auth/login";
import { cabecerasPrivadas } from "../server/guide/guard";

export function meta() {
	return [{ title: "Acceso — Método Jean" }, { name: "robots", content: "noindex, nofollow" }];
}

export const headers = () => cabecerasPrivadas;

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	if (env.SESSION_SECRET !== "") {
		const sesion = await leerSesion(request, env.DB, env.SESSION_SECRET);
		if (sesion !== null) throw redirect("/guia");
	}
	return null;
}

export async function action({ request, context }: Route.ActionArgs) {
	const datos = await request.formData();
	const enviado = datos.get("email");
	const correo = typeof enviado === "string" ? normalizarCorreo(enviado) : "";

	if (!correoValido(correo)) {
		return { enviado: false as const, error: "Revisa la dirección: no parece un correo." };
	}

	const origen = new URL(request.url).origin;
	const enlace = await solicitarAcceso(context.cloudflare.env, origen, correo);

	// Misma respuesta exista o no la cuenta: este formulario no sirve para
	// averiguar quién está registrado. El enlace solo se devuelve en desarrollo,
	// donde no hay proveedor de correo configurado; Vite borra esta rama del
	// paquete de producción.
	return {
		enviado: true as const,
		error: null,
		enlaceDeDesarrollo: import.meta.env.DEV ? enlace : null,
	};
}

export default function Acceso({ actionData }: Route.ComponentProps) {
	const [params] = useSearchParams();
	const navegacion = useNavigation();
	const enviando = navegacion.state === "submitting";
	const sinAcceso = params.get("estado") === "sin-acceso";

	if (actionData?.enviado === true) {
		return (
			<main className="gate" id="contenido">
				<p className="eyebrow">Paso 2 de 2</p>
				<h1>Revisa tu correo</h1>
				<div className="gate__panel">
					<p>
						Si esa dirección está bien escrita, acabas de recibir un enlace para entrar. Caduca en
						15 minutos y solo funciona una vez.
					</p>
					<p className="gate__nota">
						¿No lo ves? Mira en spam o promociones antes de volver a pedirlo.
					</p>
					{actionData.enlaceDeDesarrollo == null ? null : (
						<p className="gate__dev-link">
							<span>Solo en desarrollo:</span>{" "}
							<a href={actionData.enlaceDeDesarrollo}>abrir el enlace directamente</a>
						</p>
					)}
				</div>
			</main>
		);
	}

	return (
		<main className="gate" id="contenido">
			<p className="eyebrow">Acceso privado</p>
			<h1>Entra con tu correo</h1>
			<p className="gate__intro">
				Sin contraseñas. Escribe tu correo y te mandamos un enlace de un solo uso.
			</p>

			{sinAcceso ? (
				<p className="gate__aviso">
					Tu cuenta está confirmada pero todavía no tiene la guía completa asociada. Si ya pagaste y
					ves este mensaje, escríbenos y lo revisamos.
				</p>
			) : null}

			<Form className="gate__form" method="post">
				<label htmlFor="email">Tu correo</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					placeholder="tu@correo.com"
				/>
				<button className="button button--primary button--wide" type="submit" disabled={enviando}>
					{enviando ? "Enviando…" : "Enviarme el enlace"}
				</button>
				{actionData?.error == null ? null : <p className="gate__error">{actionData.error}</p>}
			</Form>

			<p className="gate__nota">Usamos tu correo para darte acceso a la guía y nada más.</p>
		</main>
	);
}
