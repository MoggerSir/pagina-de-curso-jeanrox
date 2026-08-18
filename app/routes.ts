import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("acceso", "routes/acceso.tsx"),
	route("acceso/confirmar", "routes/acceso.confirmar.tsx"),
	route("acceso/salir", "routes/acceso.salir.tsx"),
	route("guia", "routes/guia.tsx"),
	route("guia/:sku", "routes/guia.$sku.tsx"),
	route("guia/:sku/:slug", "routes/guia.$sku.$slug.tsx"),
] satisfies RouteConfig;
