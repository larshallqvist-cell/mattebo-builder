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
  if (t.kind === "andel") return `Andelen = Delen / Det hela = ${fmt(t.part)} / ${fmt(t.whole)} = ${r} = ${fmt(t.rate)} %`;
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

// ---------- Mängdträning med procenttriangeln ----------
/** Vad eleven tränar på: en ruta i triangeln, eller MIX (blandat). */
export type Focus = Kind | "mix";
/** xp styr svårighetssteget, streak är antal rätt i rad. */
export type DrillProgress = { xp: number; streak: number };
export const DRILL_TIERS = 6;
/** Antal rätt som behövs för att gå upp ett steg. */
export const TIER_STEP = 6;
/** Ett fel backar så här mycket, så att svårigheten följer eleven försiktigt. */
export const WRONG_PENALTY = 2;
export const XP_MAX = DRILL_TIERS * TIER_STEP;
export const DRILL_START: DrillProgress = { xp: 0, streak: 0 };

export const tierOf = (xp: number) => Math.max(0, Math.min(DRILL_TIERS - 1, Math.floor(xp / TIER_STEP)));
export const advance = (p: DrillProgress, correct: boolean): DrillProgress => correct
  ? { xp: Math.min(XP_MAX, p.xp + 1), streak: p.streak + 1 }
  : { xp: Math.max(0, p.xp - WRONG_PENALTY), streak: 0 };
/** Räknesättet markeras i triangeln på de första stegen, decimalformen av andelen visas lite längre. */
export const drillMarked = (tier: number) => tier < 2;
export const drillShowsDecimal = (tier: number) => tier < 3;

const range = (a: number, b: number, s = 1) => Array.from({ length: Math.floor((b - a) / s) + 1 }, (_, i) => a + i * s);
/** Svårighetssteg: snälla procentsatser och jämna tal först, sedan alla procent, decimaler och över 100 %. */
export const DRILL_LEVELS: { rates: readonly number[]; wholes: readonly number[]; decimals: number }[] = [
  { rates: [10, 50], wholes: [20, 40, 60, 80, 100, 200, 300, 400, 500, 600], decimals: 0 },
  { rates: [10, 20, 25, 50, 75], wholes: [20, 40, 60, 80, 100, 120, 160, 200, 400, 800], decimals: 0 },
  { rates: range(5, 95, 5), wholes: [20, 40, 60, 80, 100, 120, 140, 160, 200, 240, 300, 400, 500, 600, 800, 1000], decimals: 0 },
  { rates: range(1, 99), wholes: range(100, 2000, 50), decimals: 0 },
  { rates: [...range(1, 99), 110, 120, 125, 150, 200], wholes: range(10, 990, 10), decimals: 1 },
  { rates: [...range(1, 99), 0.5, 2.5, 7.5, 12.5, 37.5, 62.5, 110, 120, 125, 150, 175, 200, 250], wholes: range(4, 2000, 4), decimals: 2 },
];
const KINDS = ["andel", "delen", "hela"] as const;
const decimalsOk = (n: number, d: number) => Math.abs(n * 10 ** d - Math.round(n * 10 ** d)) < 1e-6;

export function drillQuestion(kind: Kind, rate: number, part: number, whole: number) {
  if (kind === "delen") return `Hur mycket är ${fmt(rate)} % av ${fmt(whole)}?`;
  if (kind === "andel") return `Hur många procent är ${fmt(part)} av ${fmt(whole)}?`;
  return `${fmt(rate)} % är ${fmt(part)}. Hur mycket är det hela?`;
}

/** En snabb uppgift utan textsammanhang. Upprepar inte exakt samma uppgift två gånger i rad. */
export function generateDrill(focus: Focus, tier: number, rnd = Math.random, prev?: TriangleTask): TriangleTask {
  const lv = DRILL_LEVELS[tierOf(tier * TIER_STEP)];
  for (let i = 0; i < 1000; i++) {
    const kind = focus === "mix" ? pick(KINDS, rnd) : focus;
    const rate = pick(lv.rates, rnd);
    const whole = pick(lv.wholes, rnd);
    const part = round((rate * whole) / 100);
    if (part <= 0 || !decimalsOk(part, lv.decimals)) continue;
    if (prev && i < 50 && prev.kind === kind && prev.rate === rate && prev.whole === whole) continue;
    return { kind, rate, part, whole, unit: "", text: "", question: drillQuestion(kind, rate, part, whole) };
  }
  const kind = focus === "mix" ? "delen" : focus;
  return { kind, rate: 10, part: 4, whole: 40, unit: "", text: "", question: drillQuestion(kind, 10, 4, 40) };
}

export const drillTip = (t: TriangleTask) => t.kind === "andel"
  ? "Andelen = Delen ÷ Det hela. Skriv svaret i procent."
  : t.kind === "delen" ? `${fmt(t.rate)} % = ${fmtDec(t.rate / 100)}. Multiplicera med det hela.`
  : `${fmt(t.rate)} % = ${fmtDec(t.rate / 100)}. Dela delen med ${fmtDec(t.rate / 100)}.`;

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
  `100 % ${t.percent > 0 ? "+" : "−"} ${fmt(Math.abs(t.percent))} % = ${fmt(100 + t.percent)} % = ${fmtDec(t.factor)}`;
export const explainNewValue = (t: ChangeTask) => `${fmt(t.original)} · ${fmtDec(t.factor)} = ${fmt(t.newValue)} ${t.unit}`.trim();

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

// ---------- Mängdträning med förändringsfaktor ----------
/** faktor = hitta faktorn, nytt = räkna nya värdet, procent = från faktor tillbaka till förändringen i procent. */
export type FactorKind = "faktor" | "nytt" | "procent";
export type FactorFocus = FactorKind | "mix";
export type FactorTask = ChangeTask & { kind: FactorKind; question: string };
const FACTOR_KINDS = ["faktor", "nytt", "procent"] as const;
const EASY_ORIGINALS = [100, 200, 300, 400, 500, 600, 800, 1000] as const;

/** Svårighetssteg: först bara ökning, sedan bara minskning, sedan blandat med allt fler procentsatser, decimaler och över 100 %. */
export const FACTOR_LEVELS: { up: readonly number[]; down: readonly number[]; originals: readonly number[]; decimals: number }[] = [
  { up: [10, 20, 25, 50], down: [], originals: EASY_ORIGINALS, decimals: 0 },
  { up: [], down: [10, 20, 25, 50], originals: EASY_ORIGINALS, decimals: 0 },
  { up: range(5, 95, 5), down: range(5, 95, 5), originals: [20, 40, 60, 80, 100, 120, 160, 200, 240, 300, 400, 500, 600, 800, 1000, 1200, 2000], decimals: 0 },
  { up: range(1, 99), down: range(1, 99), originals: range(100, 2000, 100), decimals: 0 },
  { up: [...range(1, 99), 2.5, 12.5, 110, 120, 125, 150, 200], down: [...range(1, 99), 2.5, 12.5, 37.5], originals: range(40, 2000, 40), decimals: 1 },
  { up: [...range(1, 99), 2.5, 7.5, 12.5, 17.5, 110, 125, 150, 175, 200, 250, 300], down: [...range(1, 99), 2.5, 7.5, 12.5, 17.5, 37.5, 62.5], originals: range(10, 2500, 10), decimals: 2 },
];

export function factorQuestion(t: Pick<FactorTask, "kind" | "percent" | "factor" | "original">) {
  const up = t.percent > 0, p = fmt(Math.abs(t.percent));
  if (t.kind === "faktor") return `${up ? "Ökning" : "Minskning"} med ${p} %. Vilken är förändringsfaktorn?`;
  if (t.kind === "nytt") return `${fmt(t.original)} ${up ? "ökar" : "minskar"} med ${p} %. Vad blir det nya värdet?`;
  return `Förändringsfaktorn är ${fmtDec(t.factor)}. Med hur många procent ${up ? "ökar" : "minskar"} värdet?`;
}

/** En snabb uppgift med förändringsfaktor. Upprepar inte exakt samma uppgift två gånger i rad. */
export function generateFactorDrill(focus: FactorFocus, tier: number, rnd = Math.random, prev?: FactorTask): FactorTask {
  const lv = FACTOR_LEVELS[tierOf(tier * TIER_STEP)];
  for (let i = 0; i < 1000; i++) {
    const kind = focus === "mix" ? pick(FACTOR_KINDS, rnd) : focus;
    const up = lv.down.length === 0 || (lv.up.length > 0 && rnd() < 0.5);
    const p = pick(up ? lv.up : lv.down, rnd);
    const original = pick(lv.originals, rnd);
    const percent = up ? p : -p;
    const factor = round(1 + percent / 100);
    const newValue = round(original * factor);
    if (newValue <= 0 || !decimalsOk(newValue, lv.decimals)) continue;
    if (prev && i < 50 && prev.kind === kind && prev.percent === percent && (kind !== "nytt" || prev.original === original)) continue;
    const t = { kind, percent, factor, original, newValue, text: "", unit: "" };
    return { ...t, question: factorQuestion(t) };
  }
  const t = { kind: focus === "mix" ? "faktor" as const : focus, percent: 10, factor: 1.1, original: 100, newValue: 110, text: "", unit: "" };
  return { ...t, question: factorQuestion(t) };
}

export const factorAnswer = (t: FactorTask) => (t.kind === "faktor" ? t.factor : t.kind === "nytt" ? t.newValue : Math.abs(t.percent));
/** Faktorer och procent jämförs exakt (t.ex. 0,975 ≠ 0,97), nya värden med två decimalers noggrannhet. */
const exact = (a: number, b: number) => Math.abs(a - b) < 1e-6;

export function explainFactorDrill(t: FactorTask) {
  if (t.kind === "faktor") return explainFactor(t);
  if (t.kind === "nytt") return `${explainFactor(t)}, så ${explainNewValue(t)}`;
  return `${fmtDec(t.factor)} = ${fmt(100 + t.percent)} %. Det är ${fmt(Math.abs(t.percent))} % ${t.percent > 0 ? "mer" : "mindre"} än 100 %.`;
}

export function checkFactorDrill(t: FactorTask, raw: string): Check {
  const v = parseNumber(raw);
  if (v === null) return { correct: false, message: t.kind === "faktor" ? "Skriv faktorn som decimaltal, t.ex. 1,25." : "Skriv ett tal, t.ex. 25 eller 12,5." };
  const ch = Math.abs(t.percent), up = t.percent > 0;
  if (t.kind === "faktor") {
    if (exact(v, t.factor)) return { correct: true, message: explainFactor(t) };
    if (exact(v, 100 + t.percent)) return { correct: false, message: `Rätt procent! Skriv ${fmt(100 + t.percent)} % som decimaltal.` };
    if (exact(v, ch / 100)) return { correct: false, message: `Det är bara förändringen. Utgå från 100 % och ${up ? "lägg till" : "dra bort"} ${fmt(ch)} %.` };
    if (exact(v, 1 - t.percent / 100)) return { correct: false, message: up ? "Vid ökning blir faktorn större än 1." : "Vid minskning blir faktorn mindre än 1." };
    return { correct: false, message: "Hur många procent finns efter förändringen? Skriv det som decimaltal." };
  }
  if (t.kind === "nytt") {
    if (same(v, t.newValue)) return { correct: true, message: explainNewValue(t) };
    if (same(v, Math.abs(t.newValue - t.original))) return { correct: false, message: "Det är förändringen. Vad blir det nya värdet?" };
    if (same(v, t.original * (1 - t.percent / 100))) return { correct: false, message: up ? "Värdet ökar – det nya värdet ska bli större." : "Värdet minskar – det nya värdet ska bli mindre." };
    return { correct: false, message: `Multiplicera ${fmt(t.original)} med förändringsfaktorn ${fmtDec(t.factor)}.` };
  }
  if (exact(v, ch)) return { correct: true, message: explainFactorDrill(t) };
  if (exact(v, 100 + t.percent)) return { correct: false, message: up ? `${fmt(v)} % är hela det nya värdet. Hur mycket mer än 100 % är det?` : `${fmt(v)} % finns kvar. Hur mycket fattas till 100 %?` };
  if (exact(v, t.factor) || exact(v, ch / 100)) return { correct: false, message: "Svara i procent, inte som decimaltal." };
  return { correct: false, message: `Skriv ${fmtDec(t.factor)} i procent och jämför med 100 %.` };
}

export const factorTip = (t: FactorTask) => t.kind === "faktor"
  ? `Utgå från 100 %. ${t.percent > 0 ? "Lägg till ökningen" : "Dra bort minskningen"} och skriv svaret som decimaltal.`
  : t.kind === "nytt" ? `Förändringsfaktorn är ${fmtDec(t.factor)}. Multiplicera ${fmt(t.original)} med den.`
  : `${fmtDec(t.factor)} = ${fmt(100 + t.percent)} %. Hur långt är det från 100 %?`;
