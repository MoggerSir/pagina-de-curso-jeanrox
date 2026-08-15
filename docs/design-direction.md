# Dirección de diseño — SIGNAL / ASCENT

## Interpretación de las referencias

La nube topográfica aporta el gesto de marca: ruido que se atrae, forma una estructura y se estabiliza. Las pantallas móviles aportan retícula, hairlines, números monoespaciados y densidad controlada. No se copian velas, activos, métricas financieras ni el patrón completo de dashboard; harían parecer que el curso es un producto de trading.

## Sistema visual

- Fondo `#050505`, paneles `#0a0b0c` y `#101214`, texto `#f0f1ed`, secundarios `#92979b`.
- Space Grotesk para display y lectura; IBM Plex Mono para etiquetas y estados.
- Grid editorial de 12 columnas en escritorio y composición lineal en móvil.
- Bordes rectos, hairlines de bajo contraste y textura de ruido muy tenue.
- Botones de al menos 52 px de alto; foco blanco visible.
- Movimiento de marca: dispersar → atraer → formar → estabilizar.

## Narrativa

1. Hero: explica qué es y ofrece programa/guía.
2. Problema: información abundante, falta de secuencia.
3. Método: entender, ejecutar y medir.
4. Plataforma: acceso por capítulos y multidispositivo.
5. Guía gratuita: prueba de valor sin riesgo.
6. Prueba social: estado vacío honesto hasta recibir testimonios.
7. Oferta: contenido y dependencias comerciales pendientes.
8. FAQ: reduce soporte repetitivo.
9. CTA final: devuelve al programa sin urgencia artificial.

## Sistema de partículas

Un solo `THREE.Points` y `BufferGeometry`, sin luces, texturas ni postprocesado. La primera coreografía transforma caos tridimensional en una cresta ascendente. Los perfiles `static`, `low`, `medium` y `high` controlan partículas, DPR y frecuencia. `prefers-reduced-motion` y Save-Data reciben fallback estático. El loop se suspende fuera del viewport o con la pestaña oculta, y todos los recursos GPU se liberan al desmontar.
