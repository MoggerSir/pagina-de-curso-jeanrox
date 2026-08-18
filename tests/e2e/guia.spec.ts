import { expect, test, type Page } from "@playwright/test";

// Lo que se prueba aquí no es la maquetación: es que el producto que se vende
// no se entregue a quien no ha pagado, y que el acceso por correo no tenga
// puertas laterales.

/**
 * Correo nuevo en cada ejecución: el límite de cinco peticiones por hora y
 * dirección es real y, con direcciones fijas, la quinta pasada de la suite se
 * quedaría sin enlace.
 */
const correoNuevo = (etiqueta: string) =>
	`${etiqueta}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}@jeanrox.com`;

/** Recorre el flujo real: pedir enlace, abrirlo y quedar con la sesión puesta. */
async function entrarCon(page: Page, correo: string) {
	await page.goto("/acceso");
	await page.fill("#email", correo);
	await page.click("button[type=submit]");
	const enlace = page.locator(".gate__dev-link a");
	await expect(enlace).toBeVisible();
	await enlace.click();
	await page.waitForURL("**/guia");
}

test.describe("puerta de la guía", () => {
	test("sin sesión el listado redirige y no filtra nada", async ({ page }) => {
		const respuesta = await page.goto("/guia");
		expect(page.url()).toContain("/acceso");
		expect(await respuesta?.text()).not.toContain("Salud y hormonas");
	});

	test("sin sesión un capítulo no devuelve una sola línea del texto", async ({ page }) => {
		const respuesta = await page.goto("/guia/guia-premium/salud-y-hormonas");
		expect(page.url()).toContain("/acceso");
		const cuerpo = (await respuesta?.text()) ?? "";
		expect(cuerpo).not.toContain("cortisol");
		expect(cuerpo).not.toContain("jardineros");
	});

	test("el formulario no revela si un correo está registrado", async ({ page }) => {
		await page.goto("/acceso");
		await page.fill("#email", correoNuevo("desconocido"));
		await page.click("button[type=submit]");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Revisa tu correo");
	});

	test("un enlace manipulado no abre nada", async ({ page }) => {
		await page.goto("/acceso/confirmar?t=token-inventado");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Este enlace no vale");
	});
});

test.describe("acceso por correo", () => {
	test("el enlace deja entrar y solo funciona una vez", async ({ page }) => {
		await page.goto("/acceso");
		await page.fill("#email", correoNuevo("unico"));
		await page.click("button[type=submit]");
		const enlace = await page.locator(".gate__dev-link a").getAttribute("href");
		expect(enlace).not.toBeNull();

		await page.goto(enlace ?? "");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tus guías");

		// Segundo intento con el mismo enlace: ya está consumido.
		await page.goto(enlace ?? "");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Este enlace ya se usó");
	});

	test("con la sesión abierta la guía de pago sigue cerrada sin compra", async ({ page }) => {
		await entrarCon(page, correoNuevo("sin-compra"));
		await expect(page.locator(".product-list li")).toHaveCount(2);
		await page.goto("/guia/guia-premium");
		// Rebota al listado, donde se ve el estado de cada producto.
		expect(page.url()).toContain("/guia");
		await expect(page.locator(".prose")).toHaveCount(0);
	});

	test("al cerrar sesión el contenido vuelve a quedar cerrado", async ({ page }) => {
		await entrarCon(page, correoNuevo("cierra"));
		await page.click(".reader__exit button");
		await page.waitForURL("**/");
		await page.goto("/guia");
		expect(page.url()).toContain("/acceso");
	});

	test("la marca de agua lleva el correo de quien lee", async ({ page }) => {
		const correo = correoNuevo("marcada");
		await entrarCon(page, correo);
		await expect(page.locator(".watermark span").first()).toContainText(correo);
	});
});
