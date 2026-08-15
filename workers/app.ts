import { createRequestHandler } from "react-router";
import { withSecurityHeaders } from "../app/server/security-headers";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	fetch(request, env, ctx) {
		const response = requestHandler(request, {
			cloudflare: { env, ctx },
		});
		return response.then(withSecurityHeaders);
	},
} satisfies ExportedHandler<Env>;
