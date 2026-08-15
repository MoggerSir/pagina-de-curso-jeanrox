import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
});

test("renders the commercial narrative and working navigation", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Guía by Jeanrox");
	await page.getByRole("link", { name: /Explorar el método/i }).click();
	await expect(page.locator("#programa")).toBeInViewport();
	await expect(page.getByRole("heading", { name: "Una estructura para avanzar." })).toBeVisible();
});

test("has no automatically detectable WCAG A/AA violations", async ({ page }) => {
	await page.goto("/");
	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag22aa"])
		.analyze();
	expect(results.violations).toEqual([]);
});

test("mobile menu is keyboard-operable", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");
	const menu = page.getByRole("button", { name: "Menú" });
	await expect(menu).toBeVisible();
	// The button exists in SSR HTML before React attaches its event handler.
	await page.waitForTimeout(300);
	await menu.press("Enter");
	await expect(page.getByRole("button", { name: "Cerrar" })).toHaveAttribute(
		"aria-expanded",
		"true",
	);
	await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
});
