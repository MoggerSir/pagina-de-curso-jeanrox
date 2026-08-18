# Plan técnico de Fase 1

- [x] F1.1 Inventario y contexto del producto.
- [x] F1.2 Investigación de Cloudflare, frameworks, Three.js y QA.
- [x] F1.3 ADR y límites arquitectónicos.
- [x] F1.4 Design system y dirección visual.
- [x] F1.5 Storytelling y landing SSR.
- [x] F1.6 Motor de partículas nivel 1–4 con calidad adaptativa inicial.
- [x] F1.7 Responsive y reducción de movimiento.
- [x] F1.8 Metadata, robots y sitemap iniciales.
- [x] F1.9 Typecheck, lint, unit tests y build.
- [x] F1.9a Caché inmutable para assets versionados y headers de assets.
- [ ] F1.10 Sustituir copy provisional por contenido real de Jean.
- [ ] F1.11 Conectar el archivo final de la guía gratuita.
- [ ] F1.12 Incorporar precio, moneda, política y pasarela confirmados.
- [ ] F1.13 Incorporar testimonios reales autorizados.
- [ ] F1.13a Conectar las URLs de comunidad del hero (`communityLinks`): hoy
      renderizan como marcador visual porque `href` sigue en `null`.
- [ ] F1.14 Sustituir `cursos.example.com` por el dominio comprado.
- [ ] F1.15 Perfilar WebGL en dispositivos físicos y ajustar presupuestos.
- [ ] F1.16 Aprobar regresión visual después del contenido y branding definitivos.

## Fase 2 — Guía premium

- [x] F2.1 Extraer el texto del PDF y estructurarlo en capítulos y bloques.
- [x] F2.2 Esquema en D1: contenido, usuarios, compras, sesiones y lecturas.
- [x] F2.3 Lector privado con índice y navegación por capítulos.
- [x] F2.4 Protección: sesión obligatoria, marca de agua, sin caché, límite de ritmo.
- [x] F2.5 Acceso propio por confirmación de correo (Google descartado por su
      proceso de verificación).
- [x] F2.5a Esquema normalizado a 3FN y catálogo de productos.
- [x] F2.5b Herramienta para conceder y revocar accesos a mano.
- [ ] F2.5c Contratar el proveedor de correo y poner `RESEND_API_KEY` y
      `MAIL_FROM`: sin eso nadie recibe el enlace de acceso en producción.
- [ ] F2.6 Webhook de pago que escriba la fila de `entitlements` tras verificar el cobro.
- [ ] F2.7 Crear la base D1 real y volcar el contenido con `db:seed:remote`.
- [ ] F2.8 Panel de Jean para revocar accesos y revisar el registro de lecturas.
- [ ] F2.8a Cargar la guía gratuita cuando Jean entregue su archivo: el producto
      ya existe en el catálogo, solo le faltan capítulos.
- [ ] F2.9 Repasar el texto importado: el PDF trae saltos de línea de diseño que
      a veces unen un subtítulo con el párrafo siguiente.

No se incluyen todavía el panel administrativo ni la mensajería; pertenecen a iteraciones posteriores.
