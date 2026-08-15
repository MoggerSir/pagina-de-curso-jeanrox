import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"build",
			"node_modules",
			".react-router",
			"worker-configuration.d.ts",
			"eslint.config.js",
		],
	},
	js.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
		},
		plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
		rules: {
			...reactHooks.configs.recommended.rules,
			// React Router route modules intentionally export metadata and loaders beside components.
			"react-refresh/only-export-components": "off",
			"@typescript-eslint/consistent-type-definitions": "off",
		},
	},
);
