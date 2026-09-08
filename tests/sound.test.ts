import { describe, expect, it, vi } from "vitest";

import { playExpansionSound } from "../src/content/sound";

describe("playExpansionSound", () => {
  it("programa un tono breve y cierra el contexto al terminar", () => {
    const ended: { listener?: () => void } = {};
    const oscillator = {
      type: "",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      addEventListener: vi.fn((_event: string, listener: () => void) => {
        ended.listener = listener;
      }),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    const close = vi.fn();
    const context = {
      currentTime: 4,
      destination: "output",
      createOscillator: () => oscillator,
      createGain: () => gain,
      close,
    } as unknown as AudioContext;

    playExpansionSound(() => context);

    expect(oscillator.type).toBe("sine");
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880, 4);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 4.08);
    expect(oscillator.stop).toHaveBeenCalledWith(4.08);
    ended.listener?.();
    expect(close).toHaveBeenCalledOnce();
  });

  it("no interrumpe la expansión si el navegador no permite reproducir el tono", () => {
    expect(() => playExpansionSound(() => { throw new Error("blocked"); })).not.toThrow();
  });
});
