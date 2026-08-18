// Inicio de sesión por confirmación de correo. Solo servidor.
//
// No hay contraseñas: nada que filtrar, nada que reutilizar de otra web. Se
// envía un enlace de un solo uso y quien lo abre demuestra que controla el
// buzón. El token viaja en el correo y en la base solo queda su SHA-256.

import { crearMailer, plantillaAcceso } from "./mailer";

const VIGENCIA_MINUTOS = 15;
const MAX_POR_HORA = 5;
const MAX_INTENTOS = 5;

const codificador = new TextEncoder();

async function hash(valor: string) {
	const digest = await crypto.subtle.digest("SHA-256", codificador.encode(valor));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Token de 256 bits en base64url: suficiente para que no se adivine. */
function nuevoToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
}

export const normalizarCorreo = (valor: string) => valor.trim().toLowerCase();

export function correoValido(valor: string) {
	// Comprobación deliberadamente sencilla: la validación de verdad es que el
	// mensaje llegue y alguien abra el enlace.
	return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor) && valor.length <= 254;
}

async function limiteSuperado(db: D1Database, direccionHash: string) {
	const fila = await db
		.prepare(
			`SELECT COUNT(*) AS total FROM login_requests
			 WHERE address_hash = ? AND requested_at > datetime('now', '-1 hour')`,
		)
		.bind(direccionHash)
		.first<{ total: number }>();
	return (fila?.total ?? 0) >= MAX_POR_HORA;
}

/**
 * Registra la petición, crea el token y manda el correo.
 *
 * Devuelve siempre lo mismo exista o no la cuenta: si la respuesta cambiara,
 * cualquiera podría usar este formulario para averiguar quién está registrado.
 */
export async function solicitarAcceso(env: Env, origen: string, direccion: string) {
	const db = env.DB;
	const correo = normalizarCorreo(direccion);
	const direccionHash = await hash(correo);

	if (await limiteSuperado(db, direccionHash)) return null;
	await db
		.prepare("INSERT INTO login_requests (address_hash) VALUES (?)")
		.bind(direccionHash)
		.run();

	// Alta implícita: pedir el enlace crea la cuenta si no existía. El acceso a
	// la guía de pago sigue dependiendo de access_grants, así que esto no regala
	// nada; solo evita un formulario de registro aparte.
	let email = await db
		.prepare("SELECT id, customer_id FROM customer_emails WHERE address = ?")
		.bind(correo)
		.first<{ id: string; customer_id: string }>();

	if (email === null) {
		const customerId = crypto.randomUUID();
		const emailId = crypto.randomUUID();
		await db.batch([
			db.prepare("INSERT INTO customers (id) VALUES (?)").bind(customerId),
			db
				.prepare(
					"INSERT INTO customer_emails (id, customer_id, address, is_primary) VALUES (?, ?, ?, 1)",
				)
				.bind(emailId, customerId, correo),
		]);
		email = { id: emailId, customer_id: customerId };
	}

	const token = nuevoToken();
	await db
		.prepare(
			`INSERT INTO login_tokens (id, email_id, token_hash, expires_at)
			 VALUES (?, ?, ?, datetime('now', '+${String(VIGENCIA_MINUTOS)} minutes'))`,
		)
		.bind(crypto.randomUUID(), email.id, await hash(token))
		.run();

	const enlace = `${origen}/acceso/confirmar?t=${encodeURIComponent(token)}`;
	const { texto, html } = plantillaAcceso(enlace, VIGENCIA_MINUTOS);
	await crearMailer(env)({
		para: correo,
		asunto: "Entra a tu guía",
		texto,
		html,
	});

	// Quien llama decide si puede enseñarlo; en producción no se muestra nunca.
	return enlace;
}

export type ResultadoConfirmacion =
	| { ok: true; customerId: string }
	| { ok: false; motivo: "invalido" | "caducado" | "usado" };

/** Canjea el token. Un solo uso: al consumirlo queda marcado. */
export async function confirmarAcceso(
	db: D1Database,
	token: string,
): Promise<ResultadoConfirmacion> {
	const tokenHash = await hash(token);

	const fila = await db
		.prepare(
			`SELECT t.id, t.consumed_at, t.attempts, e.customer_id, e.id AS email_id,
			        (t.expires_at <= datetime('now')) AS caducado
			 FROM login_tokens t
			 JOIN customer_emails e ON e.id = t.email_id
			 WHERE t.token_hash = ?`,
		)
		.bind(tokenHash)
		.first<{
			id: string;
			consumed_at: string | null;
			attempts: number;
			customer_id: string;
			email_id: string;
			caducado: number;
		}>();

	if (fila === null) return { ok: false, motivo: "invalido" };
	if (fila.consumed_at !== null) return { ok: false, motivo: "usado" };
	if (fila.caducado === 1 || fila.attempts >= MAX_INTENTOS) {
		return { ok: false, motivo: "caducado" };
	}

	await db.batch([
		db.prepare("UPDATE login_tokens SET consumed_at = datetime('now') WHERE id = ?").bind(fila.id),
		// Queda verificado: a partir de aquí ese buzón está demostrado.
		db
			.prepare("UPDATE customer_emails SET verified_at = datetime('now') WHERE id = ?")
			.bind(fila.email_id),
		// El resto de enlaces vivos de esa cuenta dejan de servir.
		db
			.prepare(
				"UPDATE login_tokens SET consumed_at = datetime('now') WHERE email_id = ? AND consumed_at IS NULL",
			)
			.bind(fila.email_id),
	]);

	return { ok: true, customerId: fila.customer_id };
}
