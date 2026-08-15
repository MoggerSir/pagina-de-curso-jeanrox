import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	timeout: 60_000,
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: "http://127.0.0.1:4173",
		trace: "on-first-retry",
	},
	webServer: {
		command: "npm run dev -- --host 127.0.0.1 --port 4173",
		url: "http://127.0.0.1:4173",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
	// A single local workerd avoids cold SSR compilation races on constrained CI hosts.
	workers: 1,
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
	],
});
