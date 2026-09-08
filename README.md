# Blasito

Blasito es una extensión para Chromium que reemplaza shortcuts por textos guardados. Los snippets se almacenan con `chrome.storage.local`: no hay servidor, cuenta ni telemetría.

## Qué funciona

- Crear, editar, borrar y buscar snippets.
- Ver y buscar snippets desde el popup.
- Expandir shortcuts en `input[type="text"]` y `textarea`.
- Usar Espacio, Enter o Tab para disparar la expansión.
- Conservar los snippets al cerrar y volver a abrir el navegador.

`contenteditable`, importación/exportación y editores como Monaco o CodeMirror todavía no están incluidos.

## Preparar el proyecto

Necesitás Node.js y npm.

```bash
npm install
npm run build
```

El build queda en `dist/`.

## Cargar la extensión

1. Abrí `chrome://extensions`.
2. Activá el modo desarrollador.
3. Elegí **Cargar extensión sin empaquetar**.
4. Seleccioná la carpeta `dist/`.

Después de modificar el código, ejecutá nuevamente `npm run build` y recargá la extensión desde `chrome://extensions`.

## Probar el flujo principal

1. Abrí Blasito y entrá en **Administrar snippets**.
2. Creá un snippet con shortcut `/hello` y el contenido que quieras.
3. En una página normal, escribí `/hello` dentro de un textarea.
4. Presioná Espacio, Enter o Tab. El shortcut se reemplaza por el contenido.

El delimitador se usa para disparar la acción y no se agrega al resultado.

## Comprobaciones

```bash
npm run typecheck
npm test
npm run build
```

La lógica de validación y expansión está separada de Chrome y se prueba en `tests/`.

## Estructura

```text
public/              manifest.json
src/content/         detección y expansión en páginas
src/options/         administración de snippets
src/popup/           buscador rápido
src/snippets/        tipos y reglas puras
src/storage/         acceso a chrome.storage.local
tests/               tests de lógica
```

El diseño y los planes de implementación están en `docs/superpowers/`.
