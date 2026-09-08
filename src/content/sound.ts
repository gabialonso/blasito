export function playExpansionSound(createContext: () => AudioContext = () => new AudioContext()): void {
  try {
    const context = createContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const end = context.currentTime + 0.08;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.addEventListener("ended", () => void context.close());
    oscillator.start(context.currentTime);
    oscillator.stop(end);
  } catch {
    // El sonido es opcional: una restricción del navegador no debe afectar el reemplazo.
  }
}
