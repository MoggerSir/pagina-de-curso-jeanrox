import { useState } from "react";

const links = [
	{ href: "#resultados", label: "Resultados" },
	{ href: "#programa", label: "Programa" },
	{ href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
	const [open, setOpen] = useState(false);

	return (
		<header className="site-header">
			<a className="brand" href="#inicio" aria-label="Método Jean, inicio">
				<span aria-hidden="true">JX</span>
				<span>MÉTODO JEAN</span>
			</a>
			<button
				className="menu-button"
				type="button"
				aria-expanded={open}
				aria-controls="main-navigation"
				onClick={() => {
					setOpen((value) => !value);
				}}
			>
				{open ? "Cerrar" : "Menú"}
			</button>
			<nav id="main-navigation" className={open ? "nav nav--open" : "nav"} aria-label="Principal">
				{links.map((link) => (
					<a
						key={link.href}
						href={link.href}
						onClick={() => {
							setOpen(false);
						}}
					>
						{link.label}
					</a>
				))}
				<a
					className="nav__cta"
					href="/acceso"
					onClick={() => {
						setOpen(false);
					}}
				>
					Acceder
				</a>
			</nav>
		</header>
	);
}
