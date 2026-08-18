import { useEffect } from "react";

/**
 * Estorbos para la copia casual: menú contextual, copiado, arrastre de texto y
 * los atajos de guardar/imprimir.
 *
 * Esto disuade, no impide. Cualquiera con las herramientas de desarrollo abiertas
 * puede leer el HTML, y ningún sitio web puede bloquear una captura de pantalla:
 * la defensa que de verdad sostiene el producto es que el contenido exige sesión
 * con compra, va marcado con el correo de quien lo abre y deja rastro en el
 * registro de lecturas.
 */
export function useContentGuard() {
	useEffect(() => {
		const frenar = (evento: Event) => {
			evento.preventDefault();
		};
		const atajos = (evento: KeyboardEvent) => {
			const combinado = evento.ctrlKey || evento.metaKey;
			if (combinado && ["s", "p", "u"].includes(evento.key.toLowerCase())) {
				evento.preventDefault();
			}
		};

		document.addEventListener("contextmenu", frenar);
		document.addEventListener("copy", frenar);
		document.addEventListener("cut", frenar);
		document.addEventListener("dragstart", frenar);
		document.addEventListener("keydown", atajos);

		return () => {
			document.removeEventListener("contextmenu", frenar);
			document.removeEventListener("copy", frenar);
			document.removeEventListener("cut", frenar);
			document.removeEventListener("dragstart", frenar);
			document.removeEventListener("keydown", atajos);
		};
	}, []);
}

/**
 * Firma intercalada en la propia lectura. A diferencia de la capa de fondo,
 * esta va dentro del texto: sobrevive a un recorte, a una captura parcial y
 * hasta a copiar y pegar el párrafo suelto en otro sitio.
 */
export function MarcaEnTexto({ email }: { email: string }) {
	return <p className="prose__marca">(comprado por &ldquo;{email}&rdquo;)</p>;
}

/** Cierre del documento: quién compró esta copia, escrito con todas las letras. */
export function PieDeCopia({ email }: { email: string }) {
	return (
		<p className="copia-pie">
			Copia comprada por <strong>{email}</strong> · {new Date().toISOString().slice(0, 10)}
		</p>
	);
}

/**
 * Marca de agua con el correo de quien lee. No impide la captura: hace que la
 * captura señale a su origen, que es lo que frena el reenvío en un grupo.
 *
 * Cubre la página entera en dos capas cruzadas y acompaña al scroll, de modo que
 * cualquier recorte —de pantalla completa o de un párrafo suelto— se lleva la
 * marca dentro.
 */
export function Watermark({ email }: { email: string }) {
	const sello = `${email} · ${new Date().toISOString().slice(0, 10)}`;
	const fila = Array.from({ length: 260 }, (_, indice) => <span key={indice}>{sello}</span>);
	return (
		<div className="watermark" aria-hidden="true">
			<div className="watermark__capa watermark__capa--a">{fila}</div>
			<div className="watermark__capa watermark__capa--b">{fila}</div>
		</div>
	);
}
