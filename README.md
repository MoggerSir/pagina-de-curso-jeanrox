# Método Jean — Fase 1

Landing SSR dark-only para la futura plataforma del curso de Jean. Incluye sistema visual editorial, narrativa comercial honesta, experiencia Three.js adaptativa, fundamentos de Cloudflare Workers y quality gates.

## Requisitos

- Node.js 22
- npm 10 o posterior recomendado

El equipo local actual trae Node 20. Puede ejecutar cualquier gate sin modificar el sistema:

```bash
npx -p node@22 -c 'npm run typecheck'
```

## Comandos

```bash
npm install
npm run dev
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run check
```

Para E2E, instala Chromium una vez con `npx playwright install chromium`.

## Arquitectura

- React Router framework con SSR.
- React 19 + TypeScript strict.
- Vite + plugin oficial de Cloudflare.
- Worker único para SSR, assets y futuras rutas server-side.
- Three.js dinámico, separado del bundle crítico.
- GSAP dinámico reservado para coreografías que CSS no resuelva mejor.
- D1 para la guía premium; el resto de la landing no toca base de datos.

## Guía premium

El texto de la guía **no está en el repositorio**: vive en D1. Para levantarla en local:

```bash
pdftotext -layout -enc UTF-8 "Guía.pdf" content/guia/guia-raw.txt
node scripts/import-guide.mjs
npm run db:migrate
npm run db:seed
echo 'SESSION_SECRET="una-cadena-larga"' > .dev.vars
```

Con `npm run dev`, `/acceso` pide un correo y, al no haber proveedor
configurado, muestra el enlace en pantalla y lo escribe en la terminal. Para dar
acceso a la guía de pago:

```bash
node scripts/grant-access.mjs correo@ejemplo.com guia-premium
node scripts/grant-access.mjs correo@ejemplo.com guia-premium --revocar
```

En producción hace falta crear la base, el secreto y el envío de correo:

```bash
wrangler d1 create jean-guia        # copia el id a wrangler.json
npm run db:migrate:remote
npm run db:seed:remote
wrangler secret put SESSION_SECRET
wrangler secret put RESEND_API_KEY   # o el proveedor que se elija
wrangler secret put MAIL_FROM        # remitente verificado del dominio
```

Un Worker no puede enviar correo por su cuenta: hace falta un proveedor externo.
Sin `RESEND_API_KEY` y `MAIL_FROM` no se envía nada y el enlace solo aparece en
la terminal, lo que en producción significa que nadie podrá entrar.

Los límites reales de la protección están escritos en el
[ADR 002](./docs/adr/002-guia-premium.md); léelos antes de prometer nada al
cliente.

Consulta [ADR 001](./docs/adr/001-application-architecture.md), [dirección de diseño](./docs/design-direction.md), [plan](./docs/implementation-plan.md) y [quality gates](./docs/testing-strategy.md).

## Configuración pendiente

Antes de publicar hay que reemplazar:

- el dominio provisional de `public/robots.txt` y `public/sitemap.xml`;
- copy provisional por el contenido real del curso;
- archivo de guía gratuita;
- precio, moneda y pasarela;
- política legal y de reembolsos;
- testimonios autorizados;
- favicon y metadata social definitivos.

No guardes credenciales en `.env` versionado ni variables `VITE_*`. Los secretos futuros se administrarán con `wrangler secret put`.
