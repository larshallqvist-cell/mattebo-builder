// Procent training: task generation and answer checking for the percent triangle and change factor.

export type Kind = "andel" | "delen" | "hela";
export type Support = 0 | 1 | 2; // 0 = triangel med markering, 1 = ledtråd på begäran, 2 = ingen triangel
export type TriangleTask = { kind: Kind; rate: number; part: number; whole: number; text: string; question: string; unit: string };
export type ChangeLevel = 0 | 1 | 2; // ökning, minskning, blandat
export type ChangeTask = { original: number; percent: number; factor: number; newValue: number; text: string; unit: string };
export type Check = { correct: boolean; message: string };

const pick = <T,>(xs: readonly T[], rnd = Math.random): T => xs[Math.floor(rnd() * xs.length)];
const round = (n: number) => Math.round(n * 1e6) / 1e6;

/** Svensk talformatering: decimalkomma, högst två decimaler, mellanslag som tusentalsavgränsare. */
export const fmt = (n: number) => round(n).toLocaleString("sv-SE", { maximumFractionDigits: 2 }).replace(/\u2212/g, "−");
export const fmtDec = (n: number) => round(n).toLocaleString("sv-SE", { maximumFractionDigits: 4, useGrouping: false });

/** Läser elevsvar: tål mellanslag, decimalkomma, %, enheter och typografiskt minus. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/[\s\u00a0\u202f]/g, "").replace(/[−–]/g, "-").replace(/,/g, ".")
    .replace(/(%|kr|st|g|kg|m|personer|invånare|elever)$/u, "");
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}
const same = (a: number, b: number) => Math.abs(a - b) < 0.005;

// ---------- Procenttriangeln ----------
const RATES = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 70, 75, 80, 90] as const;
const SCENES = [
  { unit: "elever", total: (w: string) => `I en skola går ${w} elever.`, part: (p: string) => `${p} av dem cyklar till skolan.`, rate: (r: string) => `${r} av eleverna cyklar till skolan.`, q: { andel: "Hur stor andel cyklar?", delen: "Hur många elever cyklar?", hela: "Hur många elever går i skolan?" } },
  { unit: "kr", total: (w: string) => `Sara har sparat ${w} kr.`, part: (p: string) => `Hon köper en hoodie för ${p} kr.`, rate: (r: string) => `Hon använder ${r} av pengarna till en hoodie.`, q: { andel: "Hur stor andel av pengarna kostar hoodien?", delen: "Hur mycket kostar hoodien?", hela: "Hur mycket hade Sara sparat?" } },
  { unit: "personer", total: (w: string) => `En konsert har ${w} besökare.`, part: (p: string) => `${p} av dem står längst fram.`, rate: (r: string) => `${r} av besökarna står längst fram.`, q: { andel: "Hur stor andel står längst fram?", delen: "Hur många står längst fram?", hela: "Hur många besökare har konserten?" } },
  { unit: "g", total: (w: string) => `En påse godis väger ${w} g.`, part: (p: string) => `${p} g av godiset är choklad.`, rate: (r: string) => `${r} av godiset är choklad.`, q: { andel: "Hur stor andel är choklad?", delen: "Hur många gram är choklad?", hela: "Hur mycket väger påsen?" } },
  { unit: "st", total: (w: string) => `Ett spel har ${w} banor.`, part: (p: string) => `Leo har klarat ${p} banor.`, rate: (r: string) => `Leo har klarat ${r} av banorna.`, q: { andel: "Hur stor andel av banorna har Leo klarat?", delen: "Hur många banor har Leo klarat?", hela: "Hur många banor har spelet?" } },
] as const;

export function generateTriangle(kind?: Kind, rnd = Math.random): TriangleTask {
  const k = kind ?? pick(["andel", "delen", "hela"] as const, rnd);
  for (;;) {
    const rate = pick(RATES, rnd);
    const whole = pick([20, 40, 50, 60, 80, 120, 150, 200, 240, 300, 400, 500, 600, 800, 1200], rnd);
    const part = (rate * whole) / 100;
    if (!Number.isInteger(part) || part === 0) continue;
    const s = pick(SCENES, rnd);
    const text = k === "andel" ? `${s.total(fmt(whole))} ${s.part(fmt(part))}`
      : k === "delen" ? `${s.total(fmt(whole))} ${s.rate(`${rate} %`)}`
      : `${s.rate(`${rate} %`)} Det motsvarar ${fmt(part)} ${s.unit}.`;
    return { kind: k, rate, part, whole, text, question: s.q[k], unit: s.unit };
  }
}

export const triangleAnswer = (t: TriangleTask) => (t.kind === "andel" ? t.rate : t.kind === "delen" ? t.part : t.whole);

export function explainTriangle(t: TriangleTask) {
  const r = fmtDec(t.rate / 100);
  if (t.kind === "andel") return `Andelen = Delen / Det hela = ${fmt(t.part)} / ${fmt(t.whole)} = ${r} = ${t.rate} %`;
  if (t.kind === "delen") return `Delen = Andelen · Det hela = ${r} · ${fmt(t.whole)} = ${fmt(t.part)}`;
  return `Det hela = Delen / Andelen = ${fmt(t.part)} / ${r} = ${fmt(t.whole)}`;
}

export function checkTriangle(t: TriangleTask, raw: string): Check {
  const v = parseNumber(raw);
  if (v === null) return { correct: false, message: "Skriv ett tal, t.ex. 25 eller 12,5." };
  const ans = triangleAnswer(t);
  if (same(v, ans)) return { correct: true, message: explainTriangle(t) };
  if (t.kind === "andel" && same(v, t.rate / 100)) return { correct: false, message: `Nästan! ${fmtDec(v)} är rätt som decimaltal – svara i procent.` };
  if (t.kind === "hela" && same(v, t.part * t.rate / 100)) return { correct: false, message: "Du multiplicerade. Det hela får du genom att dela Delen med Andelen." };
  if (t.kind === "delen" && same(v, t.whole / (t.rate / 100))) return { correct: false, message: "Du delade. Delen får du genom att multiplicera Andelen med Det hela." };
  return { correct: false, message: "Titta på vad som söks och vilka två värden du har." };
}

// ---------- Förändringsfaktor ----------
const UP = [5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75] as const;
const DOWN = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75] as const;
const CHANGE_SCENES = [
  { unit: "kr", up: (o: string, p: number) => `En jacka kostar ${o} kr. Priset höjs med ${p} %.`, down: (o: string, p: number) => `En jacka kostar ${o} kr. På rean sänks priset med ${p} %.` },
  { unit: "invånare", up: (o: string, p: number) => `En ort har ${o} invånare. Befolkningen ökar med ${p} %.`, down: (o: string, p: number) => `En ort har ${o} invånare. Befolkningen minskar med ${p} %.` },
  { unit: "kr", up: (o: string, p: number) => `Ett hyrkort kostar ${o} kr per månad. Hyran höjs med ${p} %.`, down: (o: string, p: number) => `En mobil kostar ${o} kr. Den får ${p} % rabatt.` },
  { unit: "st", up: (o: string, p: number) => `En kanal har ${o} följare. Antalet ökar med ${p} %.`, down: (o: string, p: number) => `En kanal har ${o} följare. Antalet minskar med ${p} %.` },
] as const;

export function generateChange(level: ChangeLevel, rnd = Math.random): ChangeTask {
  const up = level === 0 || (level === 2 && rnd() < 0.5);
  for (;;) {
    const p = pick(up ? UP : DOWN, rnd);
    const original = pick([40, 80, 120, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2400], rnd);
    const change = (original * p) / 100;
    if (!Number.isInteger(change)) continue;
    const percent = up ? p : -p;
    const factor = round(1 + percent / 100);
    const s = pick(CHANGE_SCENES, rnd);
    return { original, percent, factor, newValue: original + (up ? change : -change), text: up ? s.up(fmt(original), p) : s.down(fmt(original), p), unit: s.unit };
  }
}

export const explainFactor = (t: ChangeTask) =>
  `100 % ${t.percent > 0 ? "+" : "−"} ${Math.abs(t.percent)} % = ${100 + t.percent} % = ${fmtDec(t.factor)}`;
export const explainNewValue = (t: ChangeTask) => `${fmt(t.original)} · ${fmtDec(t.factor)} = ${fmt(t.newValue)} ${t.unit}`;

export function checkFactor(t: ChangeTask, raw: string): Check {
  const v = parseNumber(raw);
  if (v === null) return { correct: false, message: "Skriv faktorn som decimaltal, t.ex. 1,25." };
  if (same(v, t.factor)) return { correct: true, message: `Förändringsfaktorn är ${fmtDec(t.factor)}: ${explainFactor(t)}.` };
  if (same(v, 100 + t.percent)) return { correct: false, message: `Rätt procent! Skriv ${100 + t.percent} % som decimaltal.` };
  if (same(v, Math.abs(t.percent) / 100)) return { correct: false, message: `Det är bara förändringen. Utgå från 100 %: ${t.percent > 0 ? "lägg till" : "dra bort"} ${Math.abs(t.percent)} %.` };
  if (same(v, 1 - t.percent / 100)) return { correct: false, message: t.percent > 0 ? "Vid ökning blir faktorn större än 1." : "Vid minskning blir faktorn mindre än 1." };
  return { correct: false, message: "Hur många procent finns kvar efter förändringen? Skriv det som decimaltal." };
}

export function checkNewValue(t: ChangeTask, raw: string): Check {
  const v = parseNumber(raw);
  if (v === null) return { correct: false, message: "Skriv ett tal." };
  if (same(v, t.newValue)) return { correct: true, message: `${explainNewValue(t)}.` };
  if (same(v, Math.abs(t.newValue - t.original))) return { correct: false, message: "Det är förändringen. Vad blir det nya värdet?" };
  return { correct: false, message: `Multiplicera ursprungsvärdet med faktorn ${fmtDec(t.factor)}.` };
}
