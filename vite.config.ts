import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Ver react-router.config.ts: PAGES_BASE solo lo define el workflow de Pages,
// que necesita que los assets cuelguen de la subruta del repositorio.
const base = process.env.PAGES_BASE ?? "/";

export default defineConfig({
	base,
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
	],
});
