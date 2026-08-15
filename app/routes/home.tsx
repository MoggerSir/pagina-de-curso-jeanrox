import { Footer } from "../components/layout/footer";
import { SiteHeader } from "../components/layout/site-header";
import { LandingPage } from "../features/landing/landing-page";

export function meta() {
	return [
		{ title: "Método Jean — conocimiento convertido en sistema" },
		{
			name: "description",
			content:
				"Explora el método, descarga la guía gratuita y accede al contenido premium desde cualquier dispositivo.",
		},
		{ property: "og:title", content: "Método Jean" },
		{
			property: "og:description",
			content: "Una experiencia de aprendizaje directa, organizada y protegida.",
		},
		{ property: "og:type", content: "website" },
		{ name: "twitter:card", content: "summary_large_image" },
	];
}

export default function Home() {
	return (
		<>
			<SiteHeader />
			<LandingPage />
			<Footer />
		</>
	);
}
