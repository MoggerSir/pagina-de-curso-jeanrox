export const heroFeatures = [
	{
		icon: "target",
		title: "Método probado",
		copy: "Resultados reales",
	},
	{
		icon: "shield",
		title: "Comunidad privada",
		copy: "Blackpill community",
	},
	{
		icon: "metrics",
		title: "Progreso real",
		copy: "Métricas y seguimiento",
	},
] as const;

export type CommunityLink = {
	id: "discord" | "instagram" | "youtube" | "twitter";
	label: string;
	href: string | null;
};

// `href: null` hasta que Jean entregue sus perfiles definitivos: sin URL se
// renderizan como marcador visual, no como enlace muerto.
export const communityLinks: readonly CommunityLink[] = [
	{ id: "discord", label: "Discord", href: null },
	{ id: "instagram", label: "Instagram", href: null },
	{ id: "youtube", label: "YouTube", href: null },
	{ id: "twitter", label: "X (Twitter)", href: null },
];

export const stages = [
	{
		index: "01",
		title: "Entender",
		copy: "Ideas directas, ordenadas por capítulos para que sepas qué estás aplicando y por qué.",
	},
	{
		index: "02",
		title: "Ejecutar",
		copy: "Una ruta diseñada para pasar de leer a actuar sin perderte entre información dispersa.",
	},
	{
		index: "03",
		title: "Medir",
		copy: "Revisa tu avance, identifica fricción y vuelve al punto exacto que necesitas reforzar.",
	},
] as const;

export const faqs = [
	{
		question: "¿Necesito registrarme para explorar la página?",
		answer: "No. Puedes conocer el programa y descargar la guía gratuita sin crear una cuenta.",
	},
	{
		question: "¿Cómo recibiré el contenido premium?",
		answer:
			"Después de confirmar el pago, accedes con tu cuenta de Google y estudias por capítulos dentro de la plataforma.",
	},
	{
		question: "¿Puedo usarlo en celular?",
		answer: "Sí. La experiencia está diseñada primero para móvil y también funciona en computador.",
	},
	{
		question: "¿El curso se descarga como PDF?",
		answer:
			"No. El contenido premium vive dentro de la plataforma para mantenerlo actualizado, organizado y vinculado a tu acceso.",
	},
] as const;
