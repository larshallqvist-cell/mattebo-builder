// Koordinater: mängdträning där eleven läser av eller sätter ut en punkt i ett koordinatsystem.
// Steg och svit följer samma regler som Procent (advance/tierOf i procent.ts).

export type KoordMode = "las" | "mix";
export type TaskKind = "read" | "place";
export type Point = { x: number; y: number };
export type ErrorKind = "swapped" | "sign" | "other";
export type TierSpec = { min: number; max: number; step: 1 | 0.5; axes: boolean; name: string };
export type KoordTask = { kind: TaskKind; point: Point; label: string; tier: number };
export type KoordCheck = { correct: boolean; error: ErrorKind | null; message: string };

/** Sex steg: första kvadranten → alla fyra → punkter på axlarna → halva steg (t.ex. 1,5). */
export const KOORD_TIERS: readonly TierSpec[] = [
  { min: 0, max: 6, step: 1, axes: false, name: "Första kvadranten" },
  { min: 0, max: 10, step: 1, axes: true, name: "Första kvadranten, större" },
  { min: -6, max: 6, step: 1, axes: false, name: "Alla fyra kvadranter" },
  { min: -8, max: 8, step: 1, axes: true, name: "Fyra kvadranter och axlarna" },
  { min: 0, max: 6, step: 0.5, axes: false, name: "Halva steg" },
  { min: -6, max: 6, step: 0.5, axes: true, name: "Halva steg, alla kvadranter" },
];
export const MODE_LABEL: Record<KoordMode, string> = { las: "Läs av punkten", mix: "MIX" };
const LABELS = ["A", "B", "C", "D", "E", "P", "Q", "R"] as const;

export const tierSpec = (tier: number) => KOORD_TIERS[Math.max(0, Math.min(KOORD_TIERS.length - 1, tier))];
const randInt = (lo: number, hi: number, rnd: () => number) => lo + Math.floor(rnd() * (hi - lo + 1));
const isHalf = (n: number) => !Number.isInteger(n);

function randomCoord(spec: TierSpec, rnd: () => number): number {
  // Heltal: undvik 0 (axlarna hanteras separat). Halva steg: alla värden min..max i steg om 0,5.
  const units = spec.step === 1 ? 1 : 2;
  const lo = spec.min === 0 ? 1 : spec.min * units;
  const hi = (spec.max - (spec.step === 0.5 ? 0.5 : 0)) * units;
  for (;;) { const v = randInt(lo, hi, rnd) / units; if (v !== 0) return v; }
}

/** Skapar en ny uppgift för steget. Punkten är aldrig samma som förra gången. */
export function generateTask(mode: KoordMode, tier: number, rnd: () => number = Math.random, prev?: KoordTask): KoordTask {
  const spec = tierSpec(tier);
  for (let tries = 0; ; tries++) {
    let x = randomCoord(spec, rnd), y = randomCoord(spec, rnd);
    if (spec.axes && rnd() < 0.2) { if (rnd() < 0.5) x = 0; else y = 0; }
    if (spec.step === 0.5 && !isHalf(x) && !isHalf(y)) { if (rnd() < 0.5) x = x > 0 ? x - 0.5 : x + 0.5; else y = y > 0 ? y - 0.5 : y + 0.5; }
    if (x === 0 && y === 0) continue;
    if (prev && prev.point.x === x && prev.point.y === y && tries < 20) continue;
    const kind: TaskKind = mode === "las" ? "read" : rnd() < 0.5 ? "read" : "place";
    let label = LABELS[Math.floor(rnd() * LABELS.length)];
    if (prev && label === prev.label) label = LABELS[(LABELS.indexOf(label) + 1) % LABELS.length];
    return { kind, point: { x, y }, label, tier };
  }
}

/** Svensk skrivning: decimalkomma och typografiskt minus. */
export const fmtCoord = (n: number) => (n < 0 ? "−" : "") + String(Math.abs(n)).replace(".", ",");
/** (3, 2) med heltal, (1,5; 2) när någon koordinat har decimal – så att decimalkommat inte förväxlas. */
export const fmtPoint = (p: Point) => `(${fmtCoord(p.x)}${isHalf(p.x) || isHalf(p.y) ? "; " : ", "}${fmtCoord(p.y)})`;
export const usesSemicolon = (tier: number) => tierSpec(tier).step === 0.5;

/** Läser en koordinat: tål mellanslag, decimalkomma/punkt och olika minustecken. */
export function parseCoord(raw: string): number | null {
  const s = raw.trim().replace(/[\s\u00a0\u202f]/g, "").replace(/[−–—]/g, "-").replace(",", ".");
  return /^[-+]?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

/** Klick i rutnätet hamnar på närmaste tillåtna punkt för steget. */
export function snapPoint(p: Point, tier: number): Point {
  const spec = tierSpec(tier);
  const snap = (v: number) => Math.max(spec.min, Math.min(spec.max, Math.round(v / spec.step) * spec.step)) || 0;
  return { x: snap(p.x), y: snap(p.y) };
}

const steps = (n: number, pos: string, neg: string) => `${fmtCoord(Math.abs(n))} steg ${n > 0 ? pos : neg}`;
/** Vägen från origo till punkten: först åt sidan (x), sedan upp eller ner (y). */
export function explain(t: KoordTask): string {
  const { x, y } = t.point;
  const sx = x === 0 ? "Inga steg åt sidan (x = 0, punkten ligger på y-axeln)" : `${steps(x, "åt höger", "åt vänster")}`;
  const sy = y === 0 ? "inga steg upp eller ner (y = 0, punkten ligger på x-axeln)" : steps(y, "uppåt", "nedåt");
  return `Från origo: ${sx}, sedan ${sy}. ${t.label} = ${fmtPoint(t.point)}`;
}

export function tip(t: KoordTask): string {
  const base = t.kind === "read"
    ? "Börja i origo (0, 0). Gå först åt sidan till punkten – det är x. Gå sedan upp eller ner – det är y."
    : "Börja i origo (0, 0). Gå först x steg åt sidan, sedan y steg upp eller ner, och tryck där.";
  const signs = tierSpec(t.tier).min < 0 ? " Höger och upp är plus, vänster och ner är minus." : "";
  const half = tierSpec(t.tier).step === 0.5 ? " Mitt emellan två linjer är ett halvt steg, t.ex. 1,5." : "";
  return base + signs + half;
}

/** Rättar ett svar och känner igen de vanligaste felen: bytt plats på x och y, eller fel tecken. */
export function checkAnswer(t: KoordTask, ans: Point): KoordCheck {
  const { x, y } = t.point;
  if (ans.x === x && ans.y === y) return { correct: true, error: null, message: explain(t) };
  if (ans.x === y && ans.y === x)
    return { correct: false, error: "swapped", message: "Du har bytt plats på x och y. x kommer först – gå åt sidan innan du går upp eller ner." };
  if (Math.abs(ans.x) === Math.abs(x) && Math.abs(ans.y) === Math.abs(y)) {
    const which = ans.x !== x ? `x (${t.kind === "read" ? (x < 0 ? "punkten ligger till vänster om y-axeln" : "punkten ligger till höger om y-axeln") : (x < 0 ? "minus betyder åt vänster" : "plus betyder åt höger")})`
      : `y (${t.kind === "read" ? (y < 0 ? "punkten ligger under x-axeln" : "punkten ligger ovanför x-axeln") : (y < 0 ? "minus betyder nedåt" : "plus betyder uppåt")})`;
    return { correct: false, error: "sign", message: `Rätt antal steg, men kolla tecknet på ${which}.` };
  }
  const hint = ans.x === x ? "x stämmer – kolla y." : ans.y === y ? "y stämmer – kolla x." : "Räkna stegen från origo igen.";
  return { correct: false, error: "other", message: hint };
}
