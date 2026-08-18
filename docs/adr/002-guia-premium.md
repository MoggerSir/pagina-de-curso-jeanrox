# ADR 002 — Guía premium: almacenamiento y protección

- Estado: aceptado
- Fecha: 2026-08-17

## Problema

La guía se vendía como PDF por WhatsApp. Un PDF se reenvía en segundos y, una
vez fuera, no hay forma de saber quién lo repartió ni de cortar el acceso. Hay
que servir el mismo contenido desde la web de manera que el acceso dependa de
una compra verificada y que una filtración deje rastro.

## Decisión: identidad propia, sin Google

Se descartó "Iniciar sesión con Google": la verificación de OAuth para una
aplicación en producción es un trámite largo e incierto, y no se le puede
prometer al cliente una fecha que depende de un tercero.

En su lugar, acceso por confirmación de correo. No hay contraseñas: no hay nada
que filtrar en una brecha, nada que el usuario reutilice de otra web y ningún
formulario de recuperación que atacar. Se envía un enlace de un solo uso; quien
lo abre demuestra que controla el buzón, que es exactamente lo que hace falta
para entregarle su compra.

Detalles que sostienen el flujo:

- El token es de 256 bits y en la base solo queda su SHA-256: quien lea la base
  de datos no puede entrar con lo que encuentre.
- Caduca a los 15 minutos, sirve una sola vez y al usarse invalida los demás
  enlaces vivos de esa cuenta.
- Máximo cinco peticiones por hora y dirección, contadas por hash, para no
  guardar en claro correos de gente que quizá ni existe.
- La respuesta es idéntica exista o no la cuenta: el formulario no sirve para
  averiguar quién está registrado.
- Al confirmar se redirige con 303, así el token no se queda en la barra de
  direcciones, ni en el historial, ni en la cabecera `Referer`.

Enviar correo desde un Worker exige un proveedor externo: Email Routing de
Cloudflare solo recibe, y el envío gratuito por MailChannels dejó de existir.
El envío está detrás de una interfaz con un adaptador para Resend; sin
credenciales configuradas, el enlace se escribe en la terminal.

## Decisión: almacenamiento

El texto vive en D1 y en ningún otro sitio: no está en el repositorio, no viaja
en el paquete de JavaScript y no existe un endpoint que lo devuelva entero.
`content/` y los PDF están en `.gitignore`, porque el repositorio es público.

El esquema está normalizado hasta 3FN. Lo que explica su forma: el correo es
una entidad aparte del cliente, porque una persona puede cambiarlo sin que se
rompa su histórico de compras; el pago y la concesión de acceso son tablas
distintas, para poder regalar o reponer un acceso sin inventar un cobro que no
existió; y el producto es catálogo, no un literal repetido en cada fila.

El acceso se decide en el servidor en cada petición: sesión firmada con HMAC
(el identificador es opaco y la sesión real está en D1, así que revocar es
borrar una fila) más, para los productos de pago, una fila viva en
`access_grants`. Los productos gratuitos solo exigen el correo confirmado, de
modo que la guía gratuita y la de pago comparten exactamente el mismo portal.
Cada capítulo se pide por separado, queda anotado en `reading_log` y por encima
de cuarenta lecturas en una hora se corta con un 429.

Cada página se marca con el correo de quien la abre, se sirve con
`no-store` y `noindex`, y se bloquean selección, copiado, menú contextual,
arrastre e impresión.

## Lo que esto no protege

Conviene que quede escrito para no vender una garantía que no existe:

- **No impide capturas de pantalla.** Ningún sitio web puede hacerlo, ni en
  móvil ni en escritorio. No hay API de navegador para eso.
- **No oculta el texto de quien ya entró.** Si el contenido se ve, está en el
  documento y las herramientas de desarrollo lo muestran. El cifrado en el
  cliente no cambia esto: la clave tendría que viajar con la página.
- **Los bloqueos de copiar e imprimir son disuasorios.** Frenan el reenvío
  cómodo, no a quien se lo propone.

Lo que sí sostiene el producto es la combinación de acceso verificado, marca de
agua nominativa y registro de lecturas: convierte filtrar en algo atribuible y
raspar en algo detectable.

## Consecuencias

- D1 deja de estar diferido; el ADR 001 lo condicionaba a la primera función
  persistente, y esta lo es.
- Las migraciones viven en `migrations/` y se aplican con `npm run db:migrate`.
- `SESSION_SECRET` es obligatorio: sin él las rutas privadas devuelven 500 en
  lugar de servir el contenido.
- Falta el webhook de la pasarela, que será quien escriba la fila de
  `access_grants` tras verificar el cobro. Mientras tanto, `scripts/grant-access.mjs`
  concede y revoca a mano, que es además la herramienta que Jean necesitará para
  reponer accesos y cortar los de quien filtre.
- En desarrollo el enlace de acceso se muestra en pantalla porque no hay
  proveedor de correo; en el paquete de producción ese campo queda plegado a
  `null` y el enlace no sale nunca del servidor.
