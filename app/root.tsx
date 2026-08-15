import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { IntroOverlay } from "./features/intro/intro-overlay";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#050505" />
				<Meta />
				<Links />
			</head>
			<body>
				{/* Sin JavaScript la intro no puede retirarse sola, así que ni se pinta. */}
				<noscript>
					<style>{".intro{display:none!important}"}</style>
				</noscript>
				<a className="skip-link" href="#contenido">
					Saltar al contenido
				</a>
				<IntroOverlay />
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const is404 = isRouteErrorResponse(error) && error.status === 404;
	return (
		<main className="error-page">
			<p className="eyebrow">SYS / {is404 ? "404" : "ERROR"}</p>
			<h1>{is404 ? "Esta ruta no existe." : "Algo interrumpió la señal."}</h1>
			<p>Regresa al inicio para continuar.</p>
			<a className="button button--primary" href="/">
				Volver al inicio
			</a>
		</main>
	);
}
