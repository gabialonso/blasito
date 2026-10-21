// Draggable divider between the snippet list and the editor.
// Works with the mouse (drag) and the keyboard (← → Home End), and remembers the width.
import { t } from "../shared/i18n";

const STORAGE_KEY = "blasito.editorWidth";
const MIN_WIDTH = 320;
const MAX_SHARE = 0.6; // the editor never takes more than 60% of the layout
const KEY_STEP = 32;

/** Returns a function that refreshes the spoken width, for when the language changes. */
export function setupEditorResizer(layout: HTMLElement, resizer: HTMLElement): () => void {
  setWidth(readSavedWidth() ?? currentWidth());

  resizer.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    resizer.setPointerCapture(event.pointerId);
    resizer.classList.add("is-dragging");
  });

  resizer.addEventListener("pointermove", (event) => {
    if (!resizer.hasPointerCapture(event.pointerId)) return;
    // The editor is on the right, so its width is the distance from the pointer to the right edge.
    const right = layout.getBoundingClientRect().right - parseFloat(getComputedStyle(layout).paddingRight);
    setWidth(right - event.clientX - resizer.offsetWidth / 2);
  });

  resizer.addEventListener("pointerup", (event) => {
    resizer.releasePointerCapture(event.pointerId);
    resizer.classList.remove("is-dragging");
    saveWidth();
  });

  resizer.addEventListener("keydown", (event) => {
    // ← moves the divider left, which makes the editor wider.
    const changes: Record<string, number> = {
      ArrowLeft: currentWidth() + KEY_STEP,
      ArrowRight: currentWidth() - KEY_STEP,
      Home: MIN_WIDTH,
      End: maxWidth(),
    };
    if (!(event.key in changes)) return;
    event.preventDefault();
    setWidth(changes[event.key]);
    saveWidth();
  });

  // Keep the width valid when the window gets smaller.
  window.addEventListener("resize", () => setWidth(currentWidth()));

  return () => setWidth(currentWidth());

  function setWidth(width: number): void {
    const clamped = Math.round(Math.min(Math.max(width, MIN_WIDTH), maxWidth()));
    layout.style.setProperty("--editor-width", `${clamped}px`);
    resizer.setAttribute("aria-valuemin", String(MIN_WIDTH));
    resizer.setAttribute("aria-valuemax", String(Math.round(maxWidth())));
    resizer.setAttribute("aria-valuenow", String(clamped));
    resizer.setAttribute("aria-valuetext", t().editorWidthValue(clamped));
  }

  function currentWidth(): number {
    return parseFloat(layout.style.getPropertyValue("--editor-width")) || 416;
  }

  function maxWidth(): number {
    return Math.max(MIN_WIDTH, layout.clientWidth * MAX_SHARE);
  }

  function saveWidth(): void {
    // Only a visual preference: if storage is blocked, the width just isn't remembered.
    try {
      localStorage.setItem(STORAGE_KEY, String(currentWidth()));
    } catch {
      /* ignore */
    }
  }
}

function readSavedWidth(): number | undefined {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return saved > 0 ? saved : undefined;
  } catch {
    return undefined;
  }
}
