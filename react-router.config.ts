import type { Config } from "@react-router/dev/config";

// GitHub Pages solo sirve archivos estáticos y desde una subruta. Cuando
// PAGES_BASE está definido (workflow de Pages) la misma app se prerenderiza a
// HTML plano bajo ese prefijo; sin la variable, el build sigue siendo el SSR
// sobre Workers que decidió el ADR 001. Ver docs/adr/001.
const pagesBase = process.env.PAGES_BASE;

export default {
	ssr: true,
	basename: pagesBase ?? "/",
	prerender: pagesBase ? ["/"] : undefined,
	future: {
		v8_viteEnvironmentApi: true,
	},
} satisfies Config;
