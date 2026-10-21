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

Conviene que el atajo empiece con un símbolo, como `/hola` o `;firma`. Un atajo que es una palabra común, como `ok`, también se reemplaza cuando escribís esa palabra en una frase; Blasito te avisa antes de guardarlo.

Desde el popup podés buscar un atajo y elegirlo para copiar su texto, o escribir parte del nombre y apretar Enter para copiar el primer resultado. Las flechas ↑ y ↓ recorren los resultados.

### Atajos de teclado en «Administrar atajos»

- **Tab** al entrar: aparece «Ir al editor».
- **↑ / ↓** desde la búsqueda: recorren los atajos de la lista; **Enter** abre el elegido.
- **Esc** en el editor: deja de editar. Si hay cambios sin guardar, primero pregunta.
- El divisor entre la lista y el editor se arrastra para cambiar el ancho, o se mueve con **← / →** cuando tiene foco. El ancho elegido se recuerda.

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
npm install
npm run typecheck   # revisa los tipos
npm test            # pruebas de la lógica
npm run build       # genera dist/
```

El proyecto usa TypeScript y Vite, sin frameworks de interfaz: cada pantalla es un HTML con un script que arma la lista con funciones del DOM.

```text
public/manifest.json   permisos y puntos de entrada de la extensión
src/snippets/          lógica sin Chrome ni DOM: validar, buscar, importar, expandir
  types.ts             forma de un atajo
  model.ts             validación, búsqueda e importación
  expansion.ts         encuentra un atajo justo antes del cursor
  storage.ts           guarda y lee en chrome.storage.local
src/content/           script que corre en cada página
  index.ts             escucha lo que se escribe y decide si hay que expandir
  target.ts            qué campos se aceptan y filtro rápido por tecla
  expand.ts            reemplaza el texto en input/textarea y en contenteditable
  sound.ts             tono breve al insertar
src/options/           pantalla «Administrar atajos»
  index.ts             lista, editor, importar/exportar y diálogos
  resize.ts            divisor arrastrable entre lista y editor
src/popup/             búsqueda y copia rápida
src/ui.ts              funciones de DOM compartidas por popup y configuración
src/styles.css         estilos; los colores y espacios están en variables al principio
tests/                 pruebas con Vitest
```

### Cómo fluye un atajo

1. En **Administrar atajos**, `options/index.ts` llama a `storage.ts`, que valida con `model.ts` y guarda la lista en `chrome.storage.local`.
2. `content/index.ts` carga la lista al abrir la página y se entera de cada cambio con `watchSnippets`.
3. Con cada tecla, `mightCompleteShortcut` descarta rápido lo que no puede terminar un atajo. Si puede, `expand.ts` busca el atajo antes del cursor con `findExpansion` y lo reemplaza.

Lo que está en `src/snippets/` no depende de Chrome, así que se prueba directamente. Para cambiar la lógica, empezá por ahí y su prueba en `tests/`.

### Estilo visual

La interfaz es brutalista y por ahora solo tiene tema claro. Las variables de `:root` en `src/styles.css` concentran colores, tipografías, bordes, sombras y espacios; el amarillo (`--mark`) marca hover y foco. Las animaciones son breves y solo confirman acciones (presionar, copiar, guardar, abrir un atajo); sus duraciones están en `--speed-fast` y `--speed`, y se desactivan si el sistema pide reducir el movimiento.

## Tipografía

La interfaz usa [Asap](https://github.com/Omnibus-Type/Asap), en su versión variable: un solo archivo con todos los pesos y el alfabeto latino, que incluye los caracteres del español.

Los atajos y el campo para escribirlos usan [Hack](https://github.com/source-foundry/Hack), una fuente monoespaciada que distingue con claridad `0/O`, `1/l/I` y los símbolos. Se incluyen los subconjuntos web de Regular y Bold, que cubren los caracteres del español.

Asap tiene licencia SIL Open Font License 1.1 y Hack, licencias MIT y Bitstream Vera. Las fuentes se sirven desde la extensión, sin pedidos externos, y sus archivos y licencias están en `src/assets/fonts/`.
