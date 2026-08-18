import { redirect } from "react-router";
import type { Route } from "./+types/acceso.salir";
import { cerrarSesion, cookieBorrada, leerSesion } from "../server/auth/session";

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const sesion = await leerSesion(request, env.DB, env.SESSION_SECRET);
	// La sesión se borra de la base, no solo del navegador: la cookie robada de
	// una sesión cerrada tampoco sirve.
	if (sesion !== null) await cerrarSesion(env.DB, sesion.id);
	return redirect("/", { headers: { "Set-Cookie": cookieBorrada } });
}

export function loader() {
	return redirect("/");
}
