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
- D1 diferido hasta que exista una feature persistente.

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
