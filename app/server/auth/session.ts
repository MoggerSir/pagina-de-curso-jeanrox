// Sesiones de la guía premium. Solo servidor: nada de esto puede importarse
// desde un componente de cliente.
//
// La cookie guarda un identificador opaco firmado con HMAC. El identificador no
// dice nada por sí solo: la sesión real vive en D1, así que revocar el acceso a
// alguien es borrar una fila, no esperar a que caduque un token.

const COOKIE = "__Host-jgs";
const DURACION_HORAS = 12;

const codificador = new TextEncoder();

async function clave(secreto: string) {
	return crypto.subtle.importKey(
		"raw",
		codificador.encode(secreto),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

const aBase64Url = (datos: ArrayBuffer) =>
	btoa(String.fromCharCode(...new Uint8Array(datos)))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");

async function firmar(valor: string, secreto: string) {
	const firma = await crypto.subtle.sign("HMAC", await clave(secreto), codificador.encode(valor));
	return `${valor}.${aBase64Url(firma)}`;
}

async function verificar(firmado: string, secreto: string) {
	const corte = firmado.lastIndexOf(".");
	if (corte < 1) return null;
	const valor = firmado.slice(0, corte);
	// Se vuelve a firmar y se compara el resultado completo: no hay comparación
	// carácter a carácter que pueda medirse con un cronómetro.
	const esperado = await firmar(valor, secreto);
	if (esperado.length !== firmado.length) return null;
	let diferencia = 0;
	for (let i = 0; i < esperado.length; i += 1) {
		diferencia |= esperado.charCodeAt(i) ^ firmado.charCodeAt(i);
	}
	return diferencia === 0 ? valor : null;
}

export function leerCookieSesion(request: Request) {
	const cabecera = request.headers.get("Cookie");
	if (cabecera === null) return null;
	for (const parte of cabecera.split(";")) {
		const [nombre, ...resto] = parte.trim().split("=");
		if (nombre === COOKIE) return resto.join("=");
	}
	return null;
}

export function cookieDeSesion(firmado: string, maxAgeSegundos: number) {
	// __Host- exige Secure y path=/, y prohíbe Domain: la cookie no puede
	// filtrarse a un subdominio que no controlemos.
	return `${COOKIE}=${firmado}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${String(maxAgeSegundos)}`;
}

export const cookieBorrada = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export type Sesion = {
	id: string;
	customerId: string;
	email: string;
	name: string | null;
};

export async function crearSesion(db: D1Database, customerId: string, secreto: string) {
	const id = crypto.randomUUID();
	const expira = new Date(Date.now() + DURACION_HORAS * 3_600_000).toISOString();
	await db
		.prepare("INSERT INTO sessions (id, customer_id, expires_at) VALUES (?, ?, ?)")
		.bind(id, customerId, expira)
		.run();
	return {
		cookie: cookieDeSesion(await firmar(id, secreto), DURACION_HORAS * 3_600),
	};
}

export async function leerSesion(
	request: Request,
	db: D1Database,
	secreto: string,
): Promise<Sesion | null> {
	const firmado = leerCookieSesion(request);
	if (firmado === null) return null;
	const id = await verificar(decodeURIComponent(firmado), secreto);
	if (id === null) return null;

	const fila = await db
		.prepare(
			`SELECT s.id, s.customer_id, c.display_name, e.address
			 FROM sessions s
			 JOIN customers c ON c.id = s.customer_id
			 JOIN customer_emails e ON e.customer_id = c.id AND e.is_primary = 1
			 WHERE s.id = ? AND s.expires_at > datetime('now')`,
		)
		.bind(id)
		.first<{ id: string; customer_id: string; display_name: string | null; address: string }>();

	if (fila === null) return null;
	return {
		id: fila.id,
		customerId: fila.customer_id,
		email: fila.address,
		name: fila.display_name,
	};
}

export async function cerrarSesion(db: D1Database, id: string) {
	await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}

/**
 * ¿Puede esta persona abrir este producto?
 *
 * Los productos gratuitos solo piden el correo confirmado, que ya está probado
 * por tener sesión. Los de pago exigen además una concesión viva, y esa fila
 * solo la escribe el webhook del cobro o Jean a mano.
 */
export async function tieneAcceso(db: D1Database, customerId: string, sku: string) {
	const producto = await db
		.prepare("SELECT requires_purchase FROM products WHERE sku = ?")
		.bind(sku)
		.first<{ requires_purchase: number }>();
	if (producto === null) return false;
	if (producto.requires_purchase === 0) return true;

	const concesion = await db
		.prepare(
			`SELECT 1 AS ok FROM access_grants
			 WHERE customer_id = ? AND product_sku = ? AND revoked_at IS NULL`,
		)
		.bind(customerId, sku)
		.first<{ ok: number }>();
	return concesion !== null;
}
