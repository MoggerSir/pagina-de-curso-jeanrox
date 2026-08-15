import { expect, test } from "@playwright/test";

// El resto de la suite navega con movimiento reducido, donde la cortina no
// existe; aquí se prueba justo el caso contrario.
test.use({ reducedMotion: "no-preference" });

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
	await page.evaluate(() => {
		window.scrollTo(0, 500);
	});
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
});

test("con movimiento reducido no se muestra la intro", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(page.locator(".intro")).toHaveCount(0);
});
