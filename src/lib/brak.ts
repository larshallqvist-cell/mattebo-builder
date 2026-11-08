/** Bråkträning: oändliga uppgifter i sex banor, exakt rättning och poängregler. */

export type Frac = { n: number; d: number };
export type Focus = "form" | "forlang" | "mgn" | "addsub" | "mult" | "div" | "mix";
export type Bana = Exclude<Focus, "mix">;
export const BANOR: Bana[] = ["form", "forlang", "mgn", "addsub", "mult", "div"];
export const FOCUS_LABEL: Record<Focus, string> = {
  mix: "MIX", form: "Bråkform & blandad form", forlang: "Förläng & förkorta", mgn: "MGN",
  addsub: "Addition & subtraktion", mult: "Multiplikation", div: "Division",
};

/** Del av en uppgiftstext: vanlig text, ett bråk eller ett tal i blandad form. */
export type Token = string | { frac: Frac; mixed?: boolean };
/** Svarsformen som krävs: valfri (bråk/blandad/heltal), bara bråkform, bara blandad form, ett heltal (MGN) eller given nämnare. */
export type Expect = { kind: "any" } | { kind: "improper" } | { kind: "mixed" } | { kind: "integer" } | { kind: "denominator"; d: number } | { kind: "lowest" };
export type BrakTask = {
  bana: Bana;
  kind: string;
  question: string;
  tokens: Token[];
  answer: Frac;
  expect: Expect;
  /** Bråken som visas som bilder på låga steg. */
  pictures: Frac[];
};

export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
export const reduce = (f: Frac): Frac => { const g = gcd(f.n, f.d); const s = f.d < 0 ? -1 : 1; return { n: (s * f.n) / g, d: (s * f.d) / g }; };
export const add = (a: Frac, b: Frac) => reduce({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
export const sub = (a: Frac, b: Frac) => reduce({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
export const mul = (a: Frac, b: Frac) => reduce({ n: a.n * b.n, d: a.d * b.d });
export const div = (a: Frac, b: Frac) => reduce({ n: a.n * b.d, d: a.d * b.n });
export const equal = (a: Frac, b: Frac) => a.n * b.d === b.n * a.d;

/** Skriver ett bråk som text: 3/4, 1 3/4 (blandad), 2 eller −1/2. */
export function fmtFrac(f: Frac, mixed = false): string {
  const neg = f.n * f.d < 0; const n = Math.abs(f.n); const d = Math.abs(f.d);
  const sign = neg ? "−" : "";
  if (n % d === 0) return `${sign}${n / d}`;
  if (mixed && n > d) return `${sign}${Math.floor(n / d)} ${n % d}/${d}`;
  return `${sign}${n}/${d}`;
}

export type Parsed = { value: Frac; form: "integer" | "fraction" | "mixed"; raw: Frac };
/** Läser svar som 3/4, -3/4, 1 3/4, 7 eller 1 3/4 med typografiskt minus. Nämnaren får inte vara 0. */
export function parseAnswer(raw: string): Parsed | null {
  const s = raw.trim().replace(/[−–]/g, "-").replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/");
  let m = /^(-?)(\d+)$/.exec(s);
  if (m) { const v = Number(m[2]) * (m[1] ? -1 : 1); return { value: { n: v, d: 1 }, form: "integer", raw: { n: v, d: 1 } }; }
  m = /^(-?)(\d+)\/(\d+)$/.exec(s);
  if (m) {
    const d = Number(m[3]); if (!d) return null;
    const n = Number(m[2]) * (m[1] ? -1 : 1);
    return { value: { n, d }, form: "fraction", raw: { n, d } };
  }
  m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(s);
  if (m) {
    const w = Number(m[2]); const n = Number(m[3]); const d = Number(m[4]);
    if (!d || n >= d || n === 0) return null;
    const sign = m[1] ? -1 : 1;
    return { value: { n: sign * (w * d + n), d }, form: "mixed", raw: { n: sign * n, d } };
  }
  return null;
}

/** Är svaret skrivet i enklaste form? Bråkdelen ska vara förkortad och ett heltalsvärde ska skrivas som heltal. */
export function isSimplified(p: Parsed): boolean {
  if (p.form === "integer") return true;
  if (Math.abs(p.raw.n) % p.raw.d === 0) return false;
  return gcd(p.raw.n, p.raw.d) === 1;
}

export type CheckResult = { correct: boolean; unsimplified: boolean; message: string };
export function checkBrak(t: BrakTask, raw: string): CheckResult | null {
  const p = parseAnswer(raw);
  if (!p) return null;
  const wrong = (message: string): CheckResult => ({ correct: false, unsimplified: false, message });
  if (!equal(p.value, t.answer)) return wrong(`Rätt svar är ${fmtFrac(t.answer, t.expect.kind === "mixed")}.`);
  const e = t.expect;
  if (e.kind === "integer" && p.form !== "integer") return wrong("Svaret ska vara ett heltal.");
  if (e.kind === "improper" && p.form !== "fraction" && p.form !== "integer") return wrong(`Rätt värde, men skriv det i bråkform: ${fmtFrac(t.answer)}.`);
  if (e.kind === "mixed" && p.form === "fraction" && Math.abs(p.value.n) > p.value.d) return wrong(`Rätt värde, men skriv det i blandad form: ${fmtFrac(t.answer, true)}.`);
  if (e.kind === "denominator" && (p.form !== "fraction" || p.raw.d !== e.d)) return wrong(`Nämnaren ska vara ${e.d}: ${t.answer.n * (e.d / t.answer.d)}/${e.d}.`);
  if (e.kind === "lowest" && !isSimplified(p)) return wrong(`Det går att förkorta mer: ${fmtFrac(reduce(t.answer))}.`);
  const unsimplified = (e.kind === "any" || e.kind === "mixed") && !isSimplified(p);
  return { correct: true, unsimplified, message: unsimplified ? `Rätt! Men förkorta gärna: ${fmtFrac(reduce(t.answer), p.form === "mixed")}.` : "Rätt!" };
}

// ---------- Poäng ----------
export const FREE_WARNINGS = 5;
/** Poäng för ett rätt svar.
 * Steg 1 (tier 0): oförkortat ger full poäng och ett tips.
 * Steg 2–3: oförkortat ger en varning (högst 5), sedan halv poäng.
 * Steg 4–6: oförkortat ger halv poäng.
 * Miniräknare på steg 1–3 halverar poängen; från steg 4 ger den full poäng. */
export function scoreAnswer(tier: number, unsimplified: boolean, warningsUsed: number, calculatorUsed: boolean) {
  let points = 1; let warning = false;
  if (unsimplified) {
    if (tier === 0) points = 1;
    else if (tier <= 2 && warningsUsed < FREE_WARNINGS) warning = true;
    else points = 0.5;
  }
  if (calculatorUsed && tier <= 2) points /= 2;
  return { points, warning };
}

// ---------- Progression (samma takt som Procent) ----------
export const TIERS = 6;
export const TIER_STEP = 6;
export type Progress = { xp: number; streak: number; streakPoints: number };
export const START: Progress = { xp: 0, streak: 0, streakPoints: 0 };
export const tierOf = (xp: number) => Math.max(0, Math.min(TIERS - 1, Math.floor(xp / TIER_STEP)));
export const advance = (p: Progress, correct: boolean, points: number): Progress => correct
  ? { xp: Math.min(TIERS * TIER_STEP, p.xp + 1), streak: p.streak + 1, streakPoints: p.streakPoints + points }
  : { xp: Math.max(0, p.xp - 2), streak: 0, streakPoints: 0 };
export const showPictures = (tier: number) => tier < 2;

// ---------- Generatorer ----------
type Rnd = () => number;
const int = (rnd: Rnd, lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = <T,>(rnd: Rnd, xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];
const DENOMS = [[2, 3, 4], [2, 3, 4, 5, 6], [3, 4, 5, 6, 8], [4, 5, 6, 8, 9, 10], [6, 7, 8, 9, 10, 12], [8, 9, 10, 12, 14, 15]];
const properFrac = (rnd: Rnd, d: number): Frac => { let n = int(rnd, 1, d - 1); while (gcd(n, d) !== 1 && d > 2) n = int(rnd, 1, d - 1); return { n, d }; };
const F = (f: Frac, mixed = false): Token => ({ frac: f, mixed });
const textOf = (tokens: Token[]) => tokens.map((t) => (typeof t === "string" ? t : fmtFrac(t.frac, t.mixed))).join("");
const task = (bana: Bana, kind: string, tokens: Token[], answer: Frac, expect: Expect, pictures: Frac[] = []): BrakTask =>
  ({ bana, kind, tokens, question: textOf(tokens), answer, expect, pictures });

function genForm(tier: number, rnd: Rnd): BrakTask {
  const d = pick(rnd, DENOMS[tier]); const whole = int(rnd, 1, tier < 2 ? 2 : tier < 4 ? 5 : 9);
  const part = properFrac(rnd, d); const value: Frac = { n: whole * d + part.n, d };
  if (rnd() < 0.5) return task("form", "till-blandad", ["Skriv ", F(value), " i blandad form."], value, { kind: "mixed" }, [value]);
  return task("form", "till-brakform", ["Skriv ", F(value, true), " i bråkform."], value, { kind: "improper" }, [value]);
}

function genForlang(tier: number, rnd: Rnd): BrakTask {
  const base = properFrac(rnd, pick(rnd, DENOMS[Math.min(tier, 3)]));
  const k = int(rnd, 2, tier < 2 ? 3 : tier < 4 ? 5 : 8);
  const big: Frac = { n: base.n * k, d: base.d * k };
  if (rnd() < 0.5) return task("forlang", "forlang", ["Förläng ", F(base), ` så att nämnaren blir ${big.d}.`], big, { kind: "denominator", d: big.d }, [base]);
  return task("forlang", "forkorta", ["Förkorta ", F(big), " så långt det går."], base, { kind: "lowest" }, [big]);
}

function genMgn(tier: number, rnd: Rnd): BrakTask {
  const pool = DENOMS[tier];
  let a = pick(rnd, pool); let b = pick(rnd, pool);
  while (b === a) b = pick(rnd, pool);
  const fr = [properFrac(rnd, a), properFrac(rnd, b)];
  if (tier >= 4) { const c = pick(rnd, [2, 3, 4, 5, 6].filter((x) => x !== a && x !== b)); fr.push(properFrac(rnd, c)); }
  const m = fr.reduce((acc, f) => lcm(acc, f.d), 1);
  const tokens: Token[] = ["Vilken är MGN (minsta gemensamma nämnare) för "];
  fr.forEach((f, i) => { if (i) tokens.push(i === fr.length - 1 ? " och " : ", "); tokens.push(F(f)); });
  tokens.push("?");
  return task("mgn", fr.length === 3 ? "mgn3" : "mgn2", tokens, { n: m, d: 1 }, { kind: "integer" }, fr);
}

function twoFracs(tier: number, rnd: Rnd): [Frac, Frac] {
  const pool = DENOMS[tier];
  if (tier === 0) { const d = pick(rnd, [3, 4, 5, 6, 7, 8]); return [{ n: int(rnd, 1, d - 1), d }, { n: int(rnd, 1, d - 1), d }]; }
  if (tier === 1) { const d = pick(rnd, [2, 3, 4]); const k = pick(rnd, [2, 3]); return [properFrac(rnd, d * k), properFrac(rnd, d)]; }
  let a = pick(rnd, pool); let b = pick(rnd, pool); while (b === a) b = pick(rnd, pool);
  return [properFrac(rnd, a), properFrac(rnd, b)];
}
const withWhole = (rnd: Rnd, f: Frac, max: number): Frac => ({ n: f.n + int(rnd, 1, max) * f.d, d: f.d });

function genAddSub(tier: number, rnd: Rnd): BrakTask {
  let [a, b] = twoFracs(tier, rnd);
  const mixed = tier >= 3;
  if (mixed) { a = withWhole(rnd, a, tier >= 5 ? 5 : 3); if (rnd() < 0.6) b = withWhole(rnd, b, 2); }
  let plus = rnd() < 0.5;
  // Före steg 5 blir subtraktionen aldrig negativ.
  if (!plus && tier < 4 && a.n * b.d < b.n * a.d) [a, b] = [b, a];
  if (!plus && equal(a, b)) plus = true;
  const ans = plus ? add(a, b) : sub(a, b);
  return task("addsub", plus ? "add" : "sub", ["Beräkna ", F(a, mixed), plus ? " + " : " − ", F(b, mixed), "."], ans, { kind: mixed ? "mixed" : "any" }, [a, b]);
}

function genMult(tier: number, rnd: Rnd): BrakTask {
  if (tier === 0) { const f = properFrac(rnd, pick(rnd, [2, 3, 4, 5, 6])); const k = int(rnd, 2, 5); return task("mult", "heltal-ggr", [`Beräkna ${k} · `, F(f), "."], mul({ n: k, d: 1 }, f), { kind: "any" }, [f]); }
  let [a, b] = twoFracs(Math.min(tier, 2) + (tier >= 4 ? 2 : 0), rnd);
  if (tier === 2) b = reduce({ n: a.d, d: a.d + int(rnd, 1, 4) }); // går att kryssförkorta
  const mixed = tier >= 3;
  if (mixed) a = withWhole(rnd, a, 2);
  if (tier >= 5 && rnd() < 0.5) b = withWhole(rnd, b, 2);
  return task("mult", mixed ? "blandad-ggr" : "brak-ggr", ["Beräkna ", F(a, mixed), " · ", F(b, mixed), "."], mul(a, b), { kind: mixed ? "mixed" : "any" }, [a, b]);
}

function genDiv(tier: number, rnd: Rnd): BrakTask {
  if (tier === 0) { const f = properFrac(rnd, pick(rnd, [2, 3, 4, 5])); const k = int(rnd, 2, 4); return task("div", "brak-delat-heltal", ["Beräkna ", F(f), ` / ${k}.`], div(f, { n: k, d: 1 }), { kind: "any" }, [f]); }
  if (tier === 1) { const f = { n: 1, d: pick(rnd, [2, 3, 4, 5]) }; const k = int(rnd, 1, 4); return task("div", "heltal-delat-brak", [`Beräkna ${k} / `, F(f), "."], div({ n: k, d: 1 }, f), { kind: "any" }, [f]); }
  let [a, b] = twoFracs(tier >= 4 ? 4 : 2, rnd);
  const mixed = tier >= 3;
  if (mixed) a = withWhole(rnd, a, tier >= 5 ? 4 : 2);
  if (tier >= 5 && rnd() < 0.5) b = withWhole(rnd, b, 1);
  return task("div", mixed ? "blandad-delat" : "brak-delat-brak", ["Beräkna ", F(a, mixed), " / ", F(b, mixed), "."], div(a, b), { kind: mixed ? "mixed" : "any" }, [a, b]);
}

const GEN: Record<Bana, (tier: number, rnd: Rnd) => BrakTask> = { form: genForm, forlang: genForlang, mgn: genMgn, addsub: genAddSub, mult: genMult, div: genDiv };

/** Ny uppgift för vald bana och steg; samma fråga två gånger i rad undviks. */
export function generateBrak(focus: Focus, tier: number, rnd: Rnd = Math.random, prev?: BrakTask): BrakTask {
  const t = Math.max(0, Math.min(TIERS - 1, tier));
  for (let i = 0; i < 20; i++) {
    const bana = focus === "mix" ? pick(rnd, BANOR) : focus;
    const next = GEN[bana](t, rnd);
    if (next.question !== prev?.question) return next;
  }
  return GEN[focus === "mix" ? "form" : focus](t, rnd);
}

/** Svarsrutorna (heltal, täljare, nämnare) som text som checkBrak förstår; null om rutorna är ofullständiga. */
export function composeBrakAnswer(whole: string, num: string, den: string): string | null {
  const w = whole.trim(), n = num.trim(), d = den.trim();
  if (!n && !d) return w || null;
  if (!n || !d) return null;
  return w ? `${w} ${n}/${d}` : `${n}/${d}`;
}

/** Steg för addition/subtraktion: MGN, förlängning, räkna täljarna, förkorta. */
export function addSubSteps(t: BrakTask): string[] {
  const [a, b] = t.pictures;
  if (!a || !b) return [];
  const m = lcm(a.d, b.d), plus = t.kind === "add";
  const an = a.n * (m / a.d), bn = b.n * (m / b.d), r = plus ? an + bn : an - bn;
  const steps = [
    `MGN för ${a.d} och ${b.d} är ${m}.`,
    `Förläng: ${a.n}/${a.d} = ${an}/${m} och ${b.n}/${b.d} = ${bn}/${m}.`,
    `${plus ? "Addera" : "Subtrahera"} täljarna: (${an} ${plus ? "+" : "−"} ${bn})/${m} = ${r}/${m}.`,
  ];
  const final = fmtFrac(t.answer, t.expect.kind === "mixed");
  if (final !== `${r}/${m}`) steps.push(`Förkorta${t.expect.kind === "mixed" ? " och skriv i blandad form" : ""} → ${final}.`);
  return steps;
}

export function explainBrak(t: BrakTask): string {
  const a = t.answer;
  if ((t.kind === "add" || t.kind === "sub") && t.pictures.length === 2) return addSubSteps(t).join(" ");
  switch (t.kind) {
    case "till-blandad": return `${Math.abs(a.n)} / ${a.d} = ${Math.floor(Math.abs(a.n) / a.d)} hela och ${Math.abs(a.n) % a.d} kvar → ${fmtFrac(a, true)}.`;
    case "till-brakform": return `Hela · nämnaren + täljaren: ${Math.floor(a.n / a.d)} · ${a.d} + ${a.n % a.d} = ${a.n} → ${fmtFrac(a)}.`;
    case "forlang": return `Multiplicera täljare och nämnare med samma tal → ${fmtFrac(a)}.`;
    case "forkorta": return `Dela täljare och nämnare med största gemensamma delaren → ${fmtFrac(a)}.`;
    case "mgn2": case "mgn3": return `Minsta tal som alla nämnarna går jämnt upp i är ${a.n}.`;
    case "add": case "sub": return `Gör liknämnigt, räkna med täljarna och förkorta → ${fmtFrac(a, t.expect.kind === "mixed")}.`;
    case "heltal-ggr": case "brak-ggr": case "blandad-ggr": return `Täljare · täljare och nämnare · nämnare (blandad form görs om till bråkform först) → ${fmtFrac(a, t.expect.kind === "mixed")}.`;
    default: return `Dela = multiplicera med det inverterade talet → ${fmtFrac(a, t.expect.kind === "mixed")}.`;
  }
}

export function tipBrak(t: BrakTask): string {
  switch (t.bana) {
    case "form": return t.kind === "till-blandad" ? "Hur många hela ryms? Dela täljaren med nämnaren – resten blir den nya täljaren." : "Gör om de hela till bråk med samma nämnare och lägg till täljaren.";
    case "forlang": return t.kind === "forlang" ? "Vad ska nämnaren multipliceras med? Gör samma sak med täljaren." : "Hitta ett tal som delar både täljaren och nämnaren.";
    case "mgn": return "Räkna upp multiplikationstabellen för den största nämnaren tills du hittar ett tal som de andra också går jämnt upp i.";
    case "addsub": return "Samma nämnare först (MGN). Sedan adderar eller subtraherar du bara täljarna.";
    case "mult": return "Gör om blandad form till bråkform. Täljare gånger täljare, nämnare gånger nämnare.";
    default: return "Vänd på bråket du delar med och multiplicera i stället.";
  }
}

export const placeholderBrak = (t: BrakTask) =>
  t.expect.kind === "integer" ? "t.ex. 12" : t.expect.kind === "mixed" ? "t.ex. 2 3/4" : "t.ex. 3/4";
