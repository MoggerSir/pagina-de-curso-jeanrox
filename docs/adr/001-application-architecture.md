# ADR 001 — Arquitectura de la aplicación

- Estado: aceptado
- Fecha: 2026-08-15

## Problema

La primera entrega es una landing con una experiencia WebGL importante, pero el mismo producto deberá crecer hacia autenticación, pagos, curso privado, administración y D1. La base necesita HTML inicial útil para SEO sin crear dos aplicaciones ni depender de un servidor tradicional.

## Alternativas evaluadas

1. React + Vite SPA y API Worker: mínimo peso conceptual, pero renderiza el contenido principal en cliente y obliga a construir manualmente varias fronteras full-stack futuras.
2. Astro + islas React: rendimiento excelente para una landing aislada, pero añade un segundo paradigma cuando el producto evolucione hacia una aplicación React autenticada.
3. Next.js + OpenNext: dispone de SSR/SSG/RSC, aunque el adaptador, caché y superficie del framework son innecesarios para este alcance.
4. React Router framework + plugin Vite de Cloudflare: SSR, rutas/loaders/actions tipados y acceso directo a bindings dentro de un único Worker.

## Decisión

Usar React Router en modo framework y SSR, React 19, TypeScript estricto, Vite y el plugin oficial de Cloudflare. El Worker delega el render a React Router y aplica políticas HTTP comunes. Three.js y GSAP se cargan exclusivamente en cliente y en chunks diferidos. Tailwind está disponible para utilidades, mientras los tokens y composiciones editoriales viven en una hoja global deliberadamente pequeña.

La plantilla oficial compatible instalada actualmente usa React Router 7.18.2. Migrar a v8 será una tarea controlada cuando el runtime local y la plantilla oficial estabilicen su requisito Node 22; no cambia los límites arquitectónicos elegidos.

D1 no se enlaza todavía: una landing no necesita base de datos. Cuando exista una feature persistente se añadirá mediante binding, migraciones SQL versionadas y repositorios server-only.

## Razones

- SSR entrega copy y metadata sin esperar JavaScript.
- El runtime local reproduce Workers mediante el plugin oficial.
- Las futuras rutas de pago, curso y administración no requieren migración de framework.
- Three.js conserva acceso directo al DOM/canvas únicamente después de hidratar.
- Un solo Worker reduce despliegues, CORS y coordinación operacional.

## Trade-offs

- Cada documento SSR ejecuta el Worker; una landing Astro estática sería más barata.
- WebGL y SSR exigen límites client-only claros.
- React Router añade convenciones que una SPA de una sola ruta no necesita hoy.
- La versión actual de Wrangler requiere Node 22 para desarrollo y CI.

## Consecuencias

- `app/features` contiene experiencias de producto.
- `app/three` aísla render, targets y perfiles de calidad.
- `app/server` no puede importarse desde componentes cliente.
- La base de datos se incorporará solo cuando exista un caso de uso inmediato.
- Los módulos Three.js y GSAP no deben entrar al bundle crítico del documento.
