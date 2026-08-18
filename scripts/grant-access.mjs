// Concede o retira el acceso a un producto a mano.
//
//   node scripts/grant-access.mjs correo@ejemplo.com guia-premium
//   node scripts/grant-access.mjs correo@ejemplo.com guia-premium --revocar
//   node scripts/grant-access.mjs correo@ejemplo.com guia-premium --remoto
//
// Sirve para reponer un acceso, regalar una copia o cortarle el acceso a quien
// ha filtrado el contenido, sin inventar un pago que no existió: la fila queda
// marcada como 'manual'.

import { execFileSync } from "node:child_process";

const [, , correoBruto, sku = "guia-premium", ...banderas] = process.argv;

if (correoBruto === undefined) {
	console.error("Uso: node scripts/grant-access.mjs <correo> [sku] [--revocar] [--remoto]");
	process.exit(1);
}

const correo = correoBruto.trim().toLowerCase();
const revocar = banderas.includes("--revocar");
const remoto = banderas.includes("--remoto");

// Comillas simples duplicadas: el correo llega de la línea de comandos.
const esc = (valor) => `'${valor.replaceAll("'", "''")}'`;

const sql = revocar
	? `UPDATE access_grants SET revoked_at = datetime('now')
	   WHERE product_sku = ${esc(sku)} AND customer_id = (
	     SELECT customer_id FROM customer_emails WHERE address = ${esc(correo)}
	   );`
	: `INSERT INTO access_grants (id, customer_id, product_sku, source)
	   SELECT lower(hex(randomblob(16))), customer_id, ${esc(sku)}, 'manual'
	   FROM customer_emails WHERE address = ${esc(correo)}
	   ON CONFLICT (customer_id, product_sku)
	   DO UPDATE SET revoked_at = NULL, granted_at = datetime('now');`;

// Binario local en vez de `npx`: este script suele ejecutarse dentro de otro
// `npx -p node@22`, y anidarlos rompe la resolución de npm.
const wrangler = new URL("../node_modules/.bin/wrangler", import.meta.url).pathname;

const ejecutar = (consulta) =>
	execFileSync(
		wrangler,
		["d1", "execute", "jean-guia", remoto ? "--remote" : "--local", "--command", consulta],
		{ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
	);

ejecutar(sql);

// Se comprueba el estado resultante en vez de interpretar el informe de la
// escritura, que cambia de forma según el tipo de sentencia.
const comprobacion = ejecutar(
	`SELECT COUNT(*) AS vivos FROM access_grants g
	 JOIN customer_emails e ON e.customer_id = g.customer_id
	 WHERE e.address = ${esc(correo)} AND g.product_sku = ${esc(sku)} AND g.revoked_at IS NULL;`,
);
const vivos = /"vivos":\s*(\d+)/.exec(comprobacion)?.[1] ?? "0";
const esperado = revocar ? "0" : "1";

if (vivos !== esperado) {
	console.error(
		`No se pudo ${revocar ? "revocar" : "conceder"}: ¿existe ${correo}? Tiene que haber pedido acceso al menos una vez.`,
	);
	process.exit(1);
}
console.log(`${revocar ? "Revocado" : "Concedido"} ${sku} a ${correo}`);
