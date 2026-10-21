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

Esto genera `blasito.zip` en la carpeta del proyecto. El archivo contiene la extensión compilada y las licencias de las fuentes, y se puede subir directamente a Chrome Web Store.

## Cómo se usa

1. Abrí Blasito y elegí **Administrar atajos**.
2. Tocá **Nuevo atajo** y guardá un atajo, por ejemplo `/hola`, junto con el texto que querés insertar. Para cambiar o eliminar uno, elegilo en la lista y se abre en el editor.
3. Escribí `/hola` en un campo de texto o editor web.
4. Al terminar de escribir el atajo, Blasito lo reemplaza automáticamente.

Blasito deja el cursor al final del texto insertado. Funciona en `textarea`, en campos `input` de tipo texto, búsqueda, email, URL y teléfono, y en editores `contenteditable`. Nunca actúa en campos de contraseña.

Desde el popup podés buscar un atajo y elegirlo para copiar su texto. Las flechas ↑ y ↓ recorren los resultados.

## Importar y exportar

En **Administrar atajos**, **Exportar** (arriba a la derecha) descarga todos tus atajos e **Importar** agrega los de un archivo JSON. Podés armarlo a mano como una lista:

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

También se acepta el mismo arreglo dentro de una propiedad `snippets`, y el archivo que genera **Exportar**. El nombre es opcional; `shortcut` y `content` son obligatorios y no pueden estar vacíos. Si un archivo no es válido, Blasito no cambia lo que ya tenías. Los atajos repetidos se saltean y la pantalla te informa el resultado.

## Qué incluye

- Crear, editar, buscar y eliminar atajos, de a uno o seleccionando varios.
- Buscar y copiar los textos guardados desde el popup.
- Evitar atajos vacíos o repetidos.
- Importar y exportar atajos en JSON.
- Expandir atajos en campos de texto y editores `contenteditable`.
- Reproducir un tono breve al insertar un atajo.
- Conservar los datos al cerrar el navegador.

Todavía no incluye integración especial con editores como Monaco o CodeMirror.

## Privacidad

El script de contenido se ejecuta en todas las páginas porque tiene que detectar los atajos mientras escribís. Solo lee el campo activo cuando el último carácter escrito puede completar un atajo, no envía nada a ningún servidor y el único permiso que pide es `storage`.

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
src/ui.ts            utilidades compartidas por popup y configuración
src/styles.css       estilos y variables visuales
tests/               pruebas de la lógica
```

## Tipografía

La interfaz usa [Asap](https://github.com/Omnibus-Type/Asap), en su versión variable: un solo archivo con todos los pesos y el alfabeto latino, que incluye los caracteres del español.

Los atajos y el campo para escribirlos usan [Hack](https://github.com/source-foundry/Hack), una fuente monoespaciada que distingue con claridad `0/O`, `1/l/I` y los símbolos. Se incluyen los subconjuntos web de Regular y Bold, que cubren los caracteres del español.

Asap tiene licencia SIL Open Font License 1.1 y Hack, licencias MIT y Bitstream Vera. Las fuentes se sirven desde la extensión, sin pedidos externos, y sus archivos y licencias están en `src/assets/fonts/`.
