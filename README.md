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

## Crear el archivo para subir

```bash
npm run package
```

Esto genera `blasito.zip` en la carpeta del proyecto. El archivo ya contiene únicamente la extensión compilada y se puede subir directamente a Chrome Web Store.

## Cómo se usa

1. Abrí Blasito y elegí **Crear o editar atajos**.
2. Guardá un atajo, por ejemplo `/hola`, junto con el texto que querés insertar.
3. Escribí `/hola` en un `input` o `textarea` de una página normal.
4. Presioná Espacio, Enter o Tab.

Blasito reemplaza el atajo y deja el cursor al final del texto insertado. La tecla que dispara el reemplazo no se agrega al resultado.

## Importar varios atajos

En **Crear o editar atajos**, elegí un archivo JSON. Podés armarlo a mano como una lista:

```json
[
  {
    "name": "Saludo",
    "shortcut": "/hola",
    "content": "Hola, ¿cómo estás?"
  },
  {
    "shortcut": "/firma",
    "content": "Saludos."
  }
]
```

También se acepta el mismo arreglo dentro de una propiedad `snippets`. El nombre es opcional; `shortcut` y `content` son obligatorios. Si un archivo no es válido, Blasito no cambia lo que ya tenías. Los atajos repetidos se saltean y la pantalla te informa el resultado.

## Qué incluye este MVP

- Crear, editar, eliminar y buscar atajos.
- Buscar los textos guardados desde el popup.
- Evitar atajos vacíos o repetidos.
- Importar varios atajos desde JSON.
- Expandir atajos en `input[type="text"]` y `textarea`.
- Reproducir un tono breve al insertar un atajo.
- Conservar los datos al cerrar el navegador.

Todavía no incluye `contenteditable`, exportación, ni integración especial con editores como Monaco o CodeMirror.

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

La fuente de la interfaz está incluida dentro del build. Su licencia está junto al archivo en `src/assets/`.
