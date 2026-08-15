import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["app/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: ["app/three/particles/quality.ts", "app/server/security-headers.ts"],
		},
	},
});
