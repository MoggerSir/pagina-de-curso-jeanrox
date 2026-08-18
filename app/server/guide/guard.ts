import { redirect } from "react-router";
import { leerSesion, tieneAcceso, type Sesion } from "../auth/session";

export type EntornoCloudflare = { cloudflare: { env: Env } };

/**
 * Puerta de la guía. Dos condiciones, en este orden: correo confirmado (que es
 * lo que significa tener sesión) y derecho sobre el producto. La gratuita se
 * queda en la primera; la de pago exige además la concesión.
 */
export async function exigirAcceso(
	request: Request,
	context: EntornoCloudflare,
	sku: string,
): Promise<{ sesion: Sesion; db: D1Database }> {
	const db = context.cloudflare.env.DB;
	const secreto = context.cloudflare.env.SESSION_SECRET;
	if (secreto === "") {
		// Sin secreto no se pueden validar firmas: es preferible caerse a servir
		// el producto a cualquiera que llegue.
		throw new Response("Falta configurar SESSION_SECRET", { status: 500 });
	}

	const sesion = await leerSesion(request, db, secreto);
	if (sesion === null) {
		const destino = new URL(request.url).pathname;
		throw redirect(`/acceso?volver=${encodeURIComponent(destino)}`);
	}

	if (!(await tieneAcceso(db, sesion.customerId, sku))) {
		// Con sesión pero sin derecho: al listado, donde se ve el estado de cada
		// producto. Mandarlo a /acceso solo provocaría un rebote de vuelta.
		throw redirect(`/guia?sin-acceso=${encodeURIComponent(sku)}`);
	}

	return { sesion, db };
}

/** El contenido no se guarda en ninguna caché, ni del navegador ni intermedia. */
export const cabecerasPrivadas = {
	"Cache-Control": "private, no-store, max-age=0, must-revalidate",
	"X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
	Pragma: "no-cache",
};
