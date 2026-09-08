# Blasito

Blasito es una extensión para Chromium que expande snippets de texto. Guarda todo en el navegador y no usa un servidor.

El proyecto está recién iniciado. El popup y la página de opciones ya se pueden cargar; la creación y expansión de snippets son el próximo paso.

## Desarrollo

Necesitás Node.js y npm.

```bash
npm install
npm run build
```

Para trabajar con rebuild automático:

```bash
npm run dev
```

## Cargar en Chromium

1. Abrí `chrome://extensions`.
2. Activá el modo desarrollador.
3. Elegí **Cargar extensión sin empaquetar**.
4. Seleccioná la carpeta `dist/`.

Después de cada cambio, volvé a cargar la extensión desde esa página.

## Comprobaciones

```bash
npm run typecheck
npm test
npm run build
```

Los tests van en `tests/`. La lógica de snippets se mantendrá separada de las APIs de Chrome para poder probarla sin abrir el navegador.

## Estado

- [x] Proyecto Manifest V3 compilable.
- [x] Popup y página de opciones mínimos.
- [ ] Crear y guardar snippets.
- [ ] Expandir `/hello` en inputs y textareas.
- [ ] Importar y exportar JSON.

El diseño acordado está en `docs/superpowers/specs/2026-09-08-blasito-design.md`.
