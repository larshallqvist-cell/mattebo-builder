/** Short Web Audio tones for grading: rising "pling" for right, low "tuuut" for wrong. No audio files. */
let ctx: AudioContext | null = null;
export function tone(ok: boolean, step = 0) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = ok ? "sine" : "square";
    o.frequency.value = ok ? 660 * Math.pow(2, (step * 3) / 12) : 150;
    const len = ok ? 0.22 : 0.45;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(ok ? 0.25 : 0.12, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + len + 0.02);
  } catch { /* no audio available */ }
}
