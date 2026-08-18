// Envío de correo. Solo servidor.
//
// Un Worker de Cloudflare no puede entregar correo por su cuenta: Email Routing
// sirve para recibir, no para enviar, y el envío gratuito por MailChannels dejó
// de estar disponible. Hace falta un proveedor con API HTTP. Aquí está resuelto
// con Resend por su plan gratuito, detrás de una interfaz para poder cambiarlo
// sin tocar el flujo de acceso.

export type Correo = {
	para: string;
	asunto: string;
	texto: string;
	html: string;
};

export type Mailer = (correo: Correo) => Promise<void>;

/** En desarrollo no se manda nada: el enlace se escribe en la terminal. */
const mailerDeConsola: Mailer = (correo) => {
	const enlace = /https?:\/\/\S+/.exec(correo.texto)?.[0] ?? "(sin enlace)";
	console.log("\n─── correo simulado ───────────────────────────────");
	console.log(`para:   ${correo.para}`);
	console.log(`asunto: ${correo.asunto}`);
	console.log(`enlace: ${enlace}`);
	console.log("───────────────────────────────────────────────────\n");
	return Promise.resolve();
};

function mailerResend(apiKey: string, remitente: string): Mailer {
	return async (correo) => {
		const respuesta = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: remitente,
				to: [correo.para],
				subject: correo.asunto,
				text: correo.texto,
				html: correo.html,
			}),
		});
		if (!respuesta.ok) {
			// El detalle se queda en el registro del Worker; a la persona que
			// espera el correo se le responde siempre igual.
			console.error("resend", respuesta.status, await respuesta.text());
			throw new Error("No se pudo enviar el correo");
		}
	};
}

export function crearMailer(env: Env): Mailer {
	const apiKey = env.RESEND_API_KEY;
	const remitente = env.MAIL_FROM;
	// Sin credenciales no se intenta enviar nada: en local el enlace sale por
	// la terminal, que es lo que permite probar el flujo completo sin proveedor.
	if (apiKey === "" || remitente === "") return mailerDeConsola;
	return mailerResend(apiKey, remitente);
}

export function plantillaAcceso(enlace: string, minutos: number) {
	const texto = [
		"Has pedido entrar a tu guía.",
		"",
		`Abre este enlace para confirmar tu correo: ${enlace}`,
		"",
		`Caduca en ${String(minutos)} minutos y solo funciona una vez.`,
		"Si no has sido tú, ignora este mensaje: sin abrir el enlace no ocurre nada.",
	].join("\n");

	const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#050505;color:#f0f1ed;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;border:1px solid #25282b;background:#0a0b0c">
<tr><td style="padding:32px">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#92979b">Método Jean</p>
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.2">Confirma tu correo</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#c0c3c4">Pulsa el botón para entrar a tu guía. El enlace caduca en ${String(minutos)} minutos y solo puede usarse una vez.</p>
<a href="${enlace}" style="display:inline-block;padding:14px 22px;background:#f0f1ed;color:#050505;font-size:13px;letter-spacing:.05em;text-transform:uppercase;text-decoration:none">Entrar a mi guía</a>
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#7d8286">Si el botón no funciona, copia esta dirección:<br><span style="color:#92979b;word-break:break-all">${enlace}</span></p>
<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#7d8286">Si no has pedido esto, ignora el mensaje: sin abrir el enlace no ocurre nada.</p>
</td></tr></table></td></tr></table></body></html>`;

	return { texto, html };
}
