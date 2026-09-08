# Blasito

Blasito guarda textos que usás seguido y los inserta cuando escribís un atajo. Por ejemplo, podés guardar una respuesta con el atajo `/hola` y usarla en cualquier campo de texto sin volver a escribirla completa.

Todo se guarda en el navegador con `chrome.storage.local`. No hay cuentas, servidor ni telemetría.

## Probarlo en Chrome

Necesitás Node.js y npm. Desde la carpeta del proyecto ejecutá:

```bash
npm install
npm run build
```

Después:

1. Abrí `chrome://extensions`.
2. Activá **Modo de desarrollador**.
3. Elegí **Cargar extensión sin empaquetar**.
4. Seleccioná la carpeta `dist/`.

Si modificás el código, volvé a ejecutar `npm run build` y recargá Blasito desde `chrome://extensions`.

## Cómo se usa

1. Abrí Blasito y elegí **Crear o editar atajos**.
2. Guardá un atajo, por ejemplo `/hola`, junto con el texto que querés insertar.
3. Escribí `/hola` en un `input` o `textarea` de una página normal.
4. Presioná Espacio, Enter o Tab.

Blasito reemplaza el atajo y deja el cursor al final del texto insertado. La tecla que dispara el reemplazo no se agrega al resultado.

## Qué incluye este MVP

- Crear, editar, eliminar y buscar atajos.
- Buscar los textos guardados desde el popup.
- Evitar atajos vacíos o repetidos.
- Expandir atajos en `input[type="text"]` y `textarea`.
- Conservar los datos al cerrar el navegador.

Todavía no incluye `contenteditable`, importación y exportación, ni integración especial con editores como Monaco o CodeMirror.

## Desarrollo

```bash
npm run typecheck
npm test
npm run build
```

La lógica de validación y reemplazo vive en `src/snippets/` y no depende de Chrome, por eso se puede probar por separado.

```text
public/              manifest.json
src/content/         integración con los campos de las páginas
src/options/         pantalla para administrar atajos
src/popup/           búsqueda rápida
src/snippets/        modelo, expansión y almacenamiento
tests/               pruebas de la lógica
```

La interfaz usa Raleway, distribuida bajo la SIL Open Font License. La licencia está junto al archivo de la fuente en `src/assets/`.
