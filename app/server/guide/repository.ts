// Acceso al contenido de la guía. Solo servidor.
//
// Regla de oro: no existe ninguna consulta que devuelva la guía completa. El
// índice trae títulos, y el detalle trae un capítulo. Vaciar el producto exige
// recorrer capítulo a capítulo dejando rastro en reading_log.

export type Bloque = { kind: "heading" | "paragraph" | "list"; text: string };
export type ResumenCapitulo = { slug: string; position: number; title: string; blocks: number };

export async function listarCapitulos(db: D1Database, sku: string) {
	const { results } = await db
		.prepare(
			`SELECT c.slug, c.position, c.title, COUNT(b.id) AS blocks
			 FROM chapters c
			 LEFT JOIN chapter_blocks b ON b.chapter_slug = c.slug
			 WHERE c.product_sku = ?
			 GROUP BY c.slug
			 ORDER BY c.position`,
		)
		.bind(sku)
		.all<ResumenCapitulo>();
	return results;
}

/** El sku va en la consulta: pedir un capítulo de otro producto no devuelve nada. */
export async function leerCapitulo(db: D1Database, sku: string, slug: string) {
	const capitulo = await db
		.prepare("SELECT slug, position, title FROM chapters WHERE slug = ? AND product_sku = ?")
		.bind(slug, sku)
		.first<{ slug: string; position: number; title: string }>();
	if (capitulo === null) return null;

	const { results } = await db
		.prepare("SELECT kind, text FROM chapter_blocks WHERE chapter_slug = ? ORDER BY position")
		.bind(slug)
		.all<Bloque>();

	const vecinos = await db
		.prepare(
			`SELECT
			   (SELECT slug FROM chapters WHERE product_sku = ?2 AND position < ?1
			      ORDER BY position DESC LIMIT 1) AS anterior,
			   (SELECT slug FROM chapters WHERE product_sku = ?2 AND position > ?1
			      ORDER BY position ASC LIMIT 1) AS siguiente`,
		)
		.bind(capitulo.position, sku)
		.first<{ anterior: string | null; siguiente: string | null }>();

	return { ...capitulo, blocks: results, ...(vecinos ?? { anterior: null, siguiente: null }) };
}

const LIMITE_POR_HORA = 40;

/**
 * Anota la lectura y dice si la cuenta se ha pasado de vueltas. Una persona no
 * abre cuarenta capítulos en una hora; un raspador sí.
 */
export async function registrarLectura(db: D1Database, customerId: string, slug: string) {
	await db
		.prepare("INSERT INTO reading_log (customer_id, chapter_slug) VALUES (?, ?)")
		.bind(customerId, slug)
		.run();

	const fila = await db
		.prepare(
			`SELECT COUNT(*) AS total FROM reading_log
			 WHERE customer_id = ? AND read_at > datetime('now', '-1 hour')`,
		)
		.bind(customerId)
		.first<{ total: number }>();

	return { excedido: (fila?.total ?? 0) > LIMITE_POR_HORA };
}
