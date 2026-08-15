# Quality gates

1. Static: Prettier, ESLint tipado y TypeScript strict.
2. Unit: perfiles de calidad WebGL y políticas HTTP.
3. Integration: se añadirá Workers Vitest junto con la primera ruta API/D1; hoy no existe integración persistente que probar.
4. E2E: Playwright verifica render, navegación, menú móvil y axe A/AA.
5. Visual: los snapshots se activarán con copy/branding estables; el canvas deberá enmascararse o fijarse para evitar ruido.
6. Accessibility: axe más revisión manual de teclado, foco, zoom y reduced-motion.
7. Performance: presupuesto inicial de LCP ≤2.5 s, CLS ≤0.1, TBT ≤200 ms; Three.js en chunk diferido, un draw call y sin texturas.
8. Production: build SSR y `wrangler deploy --dry-run`.

Comando agregado: `npm run check`. Desarrollo y CI requieren Node 22.
