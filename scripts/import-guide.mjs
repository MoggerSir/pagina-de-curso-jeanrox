// Convierte el PDF de la guía en filas para D1.
//
//   pdftotext -layout -enc UTF-8 "Guía.pdf" content/guia/guia-raw.txt
//   node scripts/import-guide.mjs
//
// El texto de la guía es el producto que se vende: no entra en el repositorio.
// Este script vive en git, pero su entrada y su salida quedan en content/,
// que está ignorado, y el contenido solo existe dentro de D1.

import { readFileSync, writeFileSync } from "node:fs";

const ENTRADA = "content/guia/guia-raw.txt";
const SALIDA_JSON = "content/guia/guia.json";
const SALIDA_SQL = "content/guia/seed.sql";

// Rangos tomados del índice del propio PDF (páginas 1 y 2 son portada e índice).
const CAPITULOS = [
	{ slug: "el-comienzo", titulo: "El comienzo del camino", desde: 3, hasta: 4 },
	{ slug: "conceptos", titulo: "Conceptos", desde: 5, hasta: 6 },
	{ slug: "base-de-la-belleza", titulo: "La base de la belleza", desde: 7, hasta: 8 },
	{ slug: "armonia", titulo: "Armonía", desde: 9, hasta: 10 },
	{ slug: "salud-y-hormonas", titulo: "Salud y hormonas", desde: 11, hasta: 27 },
	{ slug: "los-huesos", titulo: "Los huesos", desde: 28, hasta: 38 },
	{ slug: "rasgos", titulo: "Rasgos", desde: 39, hasta: 61 },
	{ slug: "rutina", titulo: "Rutina", desde: 62, hasta: 65 },
	{ slug: "agradecimiento", titulo: "Agradecimiento", desde: 66, hasta: 67 },
];

const PIE = /^@?jeanrondon\d*$/i;
const sangria = (linea) => linea.length - linea.trimStart().length;
const limpiar = (texto) =>
	texto
		.replace(/\s+/g, " ")
		.replace(/([a-záéíóúñ])- ([a-záéíóúñ])/gi, "$1$2")
		.trim();

/**
 * Canva parte los títulos largos en varias líneas. Una línea que empieza en
 * minúscula (o tras una anterior sin cierre) continúa la de arriba: se unen
 * antes de clasificar nada, o cada trozo acabaría siendo un encabezado suelto.
 */
function reflujo(lineas) {
	const unidades = [];
	for (const linea of lineas) {
		const texto = linea.trim();
		if (texto === "") continue;
		const anterior = unidades.at(-1);
		const continua =
			anterior !== undefined &&
			(/^[a-záéíóúüñ¿¡(]/.test(texto) || /[,:;(]$/.test(anterior.texto)) &&
			!/[.!?]$/.test(anterior.texto);
		if (continua) {
			anterior.texto = `${anterior.texto} ${texto}`;
		} else {
			unidades.push({ texto, sangria: sangria(linea) });
		}
	}
	return unidades;
}

function clasificar(unidades) {
	if (unidades.length === 0) return [];

	const cortas = unidades.every((u) => u.texto.length < 65);
	const sinPuntoFinal = unidades.every((u) => !/[.;]$/.test(u.texto));
	const mismaSangria = unidades.every((u) => Math.abs(u.sangria - unidades[0].sangria) <= 2);

	// Varias entradas cortas, alineadas y sin puntuación final: enumeración.
	if (unidades.length > 1 && cortas && sinPuntoFinal && mismaSangria) {
		return unidades.map((u) => ({ kind: "list", text: limpiar(u.texto) }));
	}
	return unidades.map((u) => ({
		kind: u.texto.length < 70 && !/[.;]$/.test(u.texto) ? "heading" : "paragraph",
		text: limpiar(u.texto),
	}));
}

const bruto = readFileSync(ENTRADA, "utf8");
const paginas = bruto.split("\f");

const capitulos = CAPITULOS.map((cap, indice) => {
	const bloques = [];
	for (let p = cap.desde; p <= cap.hasta; p += 1) {
		const pagina = paginas[p - 1];
		if (pagina === undefined) continue;
		const lineas = pagina.split("\n").filter((l) => !PIE.test(l.trim()));

		// Los párrafos se separan por líneas en blanco en la exportación de Canva.
		let acumulado = [];
		const cerrar = () => {
			if (acumulado.length === 0) return;
			bloques.push(...clasificar(reflujo(acumulado)));
			acumulado = [];
		};
		for (const linea of lineas) {
			if (linea.trim() === "") cerrar();
			else acumulado.push(linea);
		}
		cerrar();
	}

	// El primer encabezado repite el título del capítulo; sobra.
	if (bloques[0]?.kind === "heading") bloques.shift();

	return { ...cap, position: indice + 1, bloques: bloques.filter((b) => b.text.length > 1) };
});

writeFileSync(SALIDA_JSON, JSON.stringify(capitulos, null, 2), "utf8");

const escapar = (valor) => `'${valor.replaceAll("'", "''")}'`;
// Todo el PDF entregado es la guía de pago. La gratuita se cargará aparte
// cuando Jean entregue su archivo.
const SKU = "guia-premium";

const sql = [
	"-- Generado por scripts/import-guide.mjs. Contiene el producto: no versionar.",
	`DELETE FROM chapter_blocks WHERE chapter_slug IN (SELECT slug FROM chapters WHERE product_sku = '${SKU}');`,
	`DELETE FROM chapters WHERE product_sku = '${SKU}';`,
];
for (const cap of capitulos) {
	sql.push(
		`INSERT INTO chapters (slug, product_sku, position, title) VALUES (${escapar(cap.slug)}, ${escapar(SKU)}, ${String(cap.position)}, ${escapar(cap.titulo)});`,
	);
	cap.bloques.forEach((bloque, indice) => {
		sql.push(
			`INSERT INTO chapter_blocks (chapter_slug, position, kind, text) VALUES (${escapar(cap.slug)}, ${String(indice + 1)}, ${escapar(bloque.kind)}, ${escapar(bloque.text)});`,
		);
	});
}
writeFileSync(SALIDA_SQL, sql.join("\n") + "\n", "utf8");

const total = capitulos.reduce((suma, c) => suma + c.bloques.length, 0);
console.log(`${String(capitulos.length)} capítulos, ${String(total)} bloques`);
for (const c of capitulos) {
	const palabras = c.bloques.reduce((s, b) => s + b.text.split(" ").length, 0);
	console.log(
		`  ${c.slug.padEnd(22)} ${String(c.bloques.length).padStart(3)} bloques  ${String(palabras).padStart(5)} palabras`,
	);
}
