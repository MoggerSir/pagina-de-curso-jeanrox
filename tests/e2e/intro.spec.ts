import { expect, test } from "@playwright/test";

// landing.spec.ts navega con movimiento reducido, donde la cortina no existe.
// Aquí se deja la preferencia por defecto ("no-preference") para probarla.

test("la intro se puede saltar de inmediato con un clic", async ({ page }) => {
	await page.goto("/");
	const intro = page.locator(".intro");
	await expect(intro).toBeVisible();
	await expect(page.getByRole("button", { name: "Saltar intro" })).toBeFocused();

	await page.mouse.click(200, 200);
	await expect(intro).toHaveCount(0, { timeout: 2_000 });
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(page.locator("body")).toHaveCSS("overflow", "visible");
});

test("la intro se retira sola y libera el scroll", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator(".intro")).toBeVisible();
	// Entrada + vídeo + salida de 2,5 s; el salvavidas del componente actúa a los 11 s.
	await expect(page.locator(".intro")).toHaveCount(0, { timeout: 20_000 });
	// Si la cortina se dejara el scroll bloqueado, la rueda no movería nada.
	await page.mouse.wheel(0, 1_200);
	await expect(page.locator("#metodo")).toBeInViewport({ timeout: 5_000 });
});

test("con movimiento reducido no se muestra la intro", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(page.locator(".intro")).toHaveCount(0);
});
