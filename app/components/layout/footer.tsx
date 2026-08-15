export function Footer() {
	return (
		<footer className="footer">
			<div>
				<a className="brand" href="#inicio" aria-label="Método Jean, volver al inicio">
					<span aria-hidden="true">J/01</span>
					<span>MÉTODO JEAN</span>
				</a>
				<p>Conocimiento organizado para avanzar con intención.</p>
			</div>
			<nav aria-label="Legal">
				<a href="/terminos">Términos</a>
				<a href="/privacidad">Privacidad</a>
				<a href="/reembolsos">Reembolsos</a>
			</nav>
			<p className="footer__status">SYS / ONLINE · © {new Date().getFullYear()}</p>
		</footer>
	);
}
