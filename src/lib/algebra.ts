// Algebra training: rule-based generation, exact rational arithmetic and answer checking.

export type Frac = { n: number; d: number };
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const fr = (n: number, d = 1): Frac => { if (d === 0) throw new Error("div0"); const g = gcd(n, d); const s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: Math.abs(d) / g }; };
const add = (a: Frac, b: Frac) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
const mul = (a: Frac, b: Frac) => fr(a.n * b.n, a.d * b.d);
const isZero = (a: Frac) => a.n === 0;
const eq = (a: Frac, b: Frac) => a.n === b.n && a.d === b.d;

/** Linear expression: constant + sum of coefficient·variable. */
export type Lin = { c: Frac; v: Record<string, Frac> };
const linConst = (c: Frac): Lin => ({ c, v: {} });
const linAdd = (a: Lin, b: Lin, sign = 1): Lin => {
  const v: Record<string, Frac> = { ...a.v };
  for (const [k, x] of Object.entries(b.v)) v[k] = add(v[k] ?? fr(0), mul(x, fr(sign)));
  for (const k of Object.keys(v)) if (isZero(v[k])) delete v[k];
  return { c: add(a.c, mul(b.c, fr(sign))), v };
};
const isConst = (a: Lin) => Object.keys(a.v).length === 0;
const linScale = (a: Lin, k: Frac): Lin => { const v: Record<string, Frac> = {}; for (const [x, c] of Object.entries(a.v)) if (!isZero(mul(c, k))) v[x] = mul(c, k); return { c: mul(a.c, k), v }; };
export const linEq = (a: Lin, b: Lin) => { const ka = Object.keys(a.v).sort(), kb = Object.keys(b.v).sort(); return eq(a.c, b.c) && ka.join() === kb.join() && ka.every((k) => eq(a.v[k], b.v[k])); };
export const evalLin = (a: Lin, vals: Record<string, number>) => Object.entries(a.v).reduce((s, [k, c]) => add(s, mul(c, fr(vals[k]))), a.c);

// ---------- formatting ----------
const UNI: Record<string, string> = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "1/6": "⅙", "5/6": "⅚", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞" };
export const fmtFrac = (f: Frac) => { const a = Math.abs(f.n); const s = f.d === 1 ? String(a) : UNI[`${a}/${f.d}`] ?? `${a}/${f.d}`; return (f.n < 0 ? "−" : "") + s; };
const coefStr = (k: Frac, hasVar: boolean) => { const a = fr(Math.abs(k.n), k.d); if (hasVar && a.n === 1 && a.d === 1) return ""; return fmtFrac(a); };
const joinTerms = (terms: { k: Frac; body: string }[]) => terms.map((t, i) => (t.k.n < 0 ? (i === 0 ? "−" : " − ") : i === 0 ? "" : " + ") + t.body).join("") || "0";
export const fmtLin = (a: Lin) => {
  const terms = Object.keys(a.v).sort().map((k) => ({ k: a.v[k], body: coefStr(a.v[k], true) + k }));
  if (!isZero(a.c)) terms.push({ k: a.c, body: fmtFrac(fr(Math.abs(a.c.n), a.c.d)) });
  return joinTerms(terms);
};

// ---------- expression structure ----------
type Term = { k: Frac; v: string | null };
type Part = Term | { k: Frac; group: Term[] };
const termLin = (t: Term): Lin => (t.v ? { c: fr(0), v: { [t.v]: t.k } } : linConst(t.k));
const partLin = (p: Part): Lin => ("group" in p ? linScale(p.group.reduce((s, t) => linAdd(s, termLin(t)), linConst(fr(0))), p.k) : termLin(p));
const termBody = (t: Term) => coefStr(t.k, !!t.v) + (t.v ?? "");
const fmtParts = (parts: Part[]) => joinTerms(parts.map((p) => ("group" in p ? { k: p.k, body: coefStr(p.k, true) + "(" + joinTerms(p.group.map((t) => ({ k: t.k, body: termBody(t) }))) + ")" } : { k: p.k, body: termBody(p) })));

// ---------- random helpers ----------
type Rng = () => number;
const ri = (r: Rng, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const nz = (r: Rng, a: number, b: number) => { let x = 0; while (x === 0) x = ri(r, a, b); return x; };
const pick = <T,>(r: Rng, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const sgn = (r: Rng) => (r() < 0.5 ? -1 : 1);
const shuffleTail = <T,>(r: Rng, xs: T[]) => { const [h, ...t] = xs; for (let i = t.length - 1; i > 0; i--) { const j = ri(r, 0, i); [t[i], t[j]] = [t[j], t[i]]; } return [h, ...t]; };
const T = (n: number, v: string | null, d = 1): Term => ({ k: fr(n, d), v });
const FRAC_SETS = [[2, 4], [3, 6], [2, 3, 6], [4, 8]] as const;
const fracTerm = (r: Rng, dens: readonly number[], v: string | null, sign = 1): Term => { const d = pick(r, dens); return T(sign * ri(r, 1, d - 1 || 1), v, d); };

const STRUCTURES: ((r: Rng) => Part[])[] = [
  (r) => [T(ri(r, 2, 9), "x"), ...Array.from({ length: ri(r, 2, 3) }, () => T(sgn(r) * ri(r, 1, 8), "x"))],
  (r) => shuffleTail(r, [T(ri(r, 2, 8), "x"), T(sgn(r) * ri(r, 1, 8), "y"), T(sgn(r) * ri(r, 1, 8), "x"), T(sgn(r) * ri(r, 1, 8), "y")]),
  (r) => shuffleTail(r, [T(ri(r, 2, 8), "x"), T(sgn(r) * ri(r, 1, 8), "y"), T(sgn(r) * ri(r, 1, 9), null), T(sgn(r) * ri(r, 1, 8), "x"), T(sgn(r) * ri(r, 1, 9), null)]),
  (r) => [{ k: fr(ri(r, 2, 6)), group: [T(ri(r, 1, 4), "x"), T(sgn(r) * ri(r, 1, 9), null)] }, T(sgn(r) * ri(r, 1, 7), "x"), ...(r() < 0.5 ? [T(sgn(r) * ri(r, 1, 9), null)] : [])],
  (r) => shuffleTail(r, [T(ri(r, 1, 7), "x"), { k: fr(-ri(r, 1, 6)), group: [T(ri(r, 1, 4), "x"), T(sgn(r) * ri(r, 1, 9), null)] }, ...(r() < 0.5 ? [T(sgn(r) * ri(r, 1, 9), null)] : [])]).reverse(),
  (r) => { const dens = pick(r, FRAC_SETS); return [fracTerm(r, dens, "x"), fracTerm(r, dens, "x", sgn(r)), ...(r() < 0.5 ? [fracTerm(r, dens, "x", sgn(r))] : [T(sgn(r) * ri(r, 1, 5), null)])]; },
  (r) => { const d = pick(r, [2, 3, 4]); return shuffleTail(r, [{ k: fr(sgn(r), d), group: [T(d * ri(r, 1, 3), "x"), T(sgn(r) * d * ri(r, 1, 4), null)] }, fracTerm(r, [2, 4, 3, 6], "x", sgn(r)), { k: fr(sgn(r) * ri(r, 2, 4)), group: [T(1, r() < 0.5 ? "x" : "y"), T(sgn(r) * ri(r, 1, 6), null)] }]); },
];

export type Mode = "simplify" | "both";
export const MODES: { id: Mode; title: string; blurb: string }[] = [
  { id: "simplify", title: "Förenkla uttryck", blurb: "Slå ihop termer av samma slag." },
  { id: "both", title: "Förenkla och beräkna", blurb: "Förenkla först, räkna sedan." },
];
export const LEVELS: Record<Mode, { name: string; example: string }[]> = {
  simplify: [
    { name: "En variabel", example: "3x + 2x − x" }, { name: "Två variabler", example: "3x + 2y − x + y" },
    { name: "Variabler och konstanter", example: "3x + 2y − 4 + x + 7" }, { name: "Parenteser", example: "2(x + 3) − x" },
    { name: "Minus framför parentes", example: "−2(x − 3) + x" }, { name: "Bråkkoefficienter", example: "½x + ¼x" },
    { name: "Blandat", example: "½(4x + 6) − ¼x" },
  ],
  both: [
    { name: "En variabel", example: "3x + 2x − x, x = 3" }, { name: "Två variabler", example: "3x + 2y − x + y" },
    { name: "Konstanter och minus", example: "3x − 4 + x + 7, x = −2" }, { name: "Parenteser", example: "2(x + 3) − x" },
    { name: "Minus framför parentes", example: "−2(x − 3) + x, x = −1" }, { name: "Bråk", example: "½x + ¼x, x = 8" },
    { name: "Blandat", example: "½(4x + 6) − ¼x" },
  ],
};
const EVAL_STRUCT = [(r: Rng): Part[] => [T(ri(r, 2, 9), "x"), T(sgn(r) * ri(r, 1, 9), null)], (r: Rng): Part[] => [T(ri(r, 2, 6), "x"), T(sgn(r) * ri(r, 1, 6), "y"), ...(r() < 0.5 ? [T(sgn(r) * ri(r, 1, 9), null)] : [])], STRUCTURES[2], STRUCTURES[3], STRUCTURES[4], STRUCTURES[5], STRUCTURES[6]];
const NEG_VALUES: Record<Mode, boolean[]> = {
  simplify: [], evaluate: [false, false, true, false, true, false, true], both: [false, false, true, false, true, false, true],
};

export type Exercise = { id: string; mode: Mode; level: number; expr: string; simplified: Lin; values: Record<string, number>; value: Frac };
const lcmDens = (parts: Part[]) => parts.flatMap((p) => ("group" in p ? [p.k.d, ...p.group.map((t) => t.k.d)] : [p.k.d])).reduce((a, b) => (a * b) / gcd(a, b), 1);

export function generateExercise(mode: Mode, level: number, r: Rng = Math.random): Exercise {
  for (;;) {
    const parts = (mode === "evaluate" ? EVAL_STRUCT : STRUCTURES)[level](r);
    const simplified = parts.reduce((s, p) => linAdd(s, partLin(p)), linConst(fr(0)));
    if (isConst(simplified)) continue; // must keep a variable so the task is meaningful
    if (mode !== "evaluate" && parts.length < 2) continue;
    const vars = [...new Set(parts.flatMap((p) => ("group" in p ? p.group.map((t) => t.v) : [p.v])).filter(Boolean) as string[])].sort();
    const L = lcmDens(parts), neg = NEG_VALUES[mode][level];
    const values = mode === "simplify" ? {} : Object.fromEntries(vars.map((v) => [v, (L > 1 ? L * ri(r, 1, 2) : ri(r, 1, 7)) * (neg && r() < 0.6 ? -1 : 1)]));
    const value = evalLin(simplified, values);
    if (mode !== "simplify" && Math.abs(value.n) > 300) continue;
    return { id: Math.random().toString(36).slice(2), mode, level, expr: fmtParts(parts), simplified, values, value };
  }
}
export const fmtValues = (vals: Record<string, number>) => Object.entries(vals).map(([k, v]) => `${k} = ${v < 0 ? "−" + -v : v}`).join(", ");

// ---------- parsing student answers ----------
const normalize = (s: string) => {
  let t = s.toLowerCase().replace(/[−–—]/g, "-").replace(/,/g, ".").replace(/[·×]/g, "*").replace(/\s+/g, "");
  for (const [k, u] of Object.entries(UNI)) t = t.split(u).join(`(${k})`);
  return t;
};
export function parseExpression(input: string): Lin | null {
  const s = normalize(input); let i = 0;
  if (!s || /[^0-9a-z.+\-*/()]/.test(s)) return null;
  const peek = () => s[i];
  const expr = (): Lin => { let a = term(); while (peek() === "+" || peek() === "-") { const op = s[i++]; a = linAdd(a, term(), op === "+" ? 1 : -1); } return a; };
  const term = (): Lin => {
    let a = unary();
    for (;;) {
      const c = peek();
      if (c === "*" || c === "/") { i++; const b = unary(); if (c === "*") a = times(a, b); else { if (!isConst(b) || isZero(b.c)) throw 0; a = linScale(a, fr(b.c.d, b.c.n)); } }
      else if (c && /[a-z0-9.(]/.test(c)) a = times(a, atom());
      else return a;
    }
  };
  const times = (a: Lin, b: Lin) => { if (isConst(a)) return linScale(b, a.c); if (isConst(b)) return linScale(a, b.c); throw 0; };
  const unary = (): Lin => { if (peek() === "-") { i++; return linScale(unary(), fr(-1)); } if (peek() === "+") { i++; return unary(); } return atom(); };
  const atom = (): Lin => {
    const c = peek();
    if (c === "(") { i++; const a = expr(); if (s[i++] !== ")") throw 0; return a; }
    if (c && /[a-z]/.test(c)) { i++; return { c: fr(0), v: { [c]: fr(1) } }; }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length;
    const [w, f = ""] = m[0].split("."); return linConst(fr(Number((w || "0") + f), 10 ** f.length));
  };
  try { const a = expr(); return i === s.length ? a : null; } catch { return null; }
}
/** Simplified = no parentheses, each variable at most once, at most one constant term. */
export function isSimplifiedForm(input: string) {
  const s = normalize(input).replace(/\((\d+\/\d+)\)/g, "$1");
  if (/[()]/.test(s)) return false;
  const letters = s.match(/[a-z]/g) ?? [];
  if (new Set(letters).size !== letters.length) return false;
  return s.split(/[+-]/).filter((p) => p && !/[a-z]/.test(p)).length <= 1;
}

export type Check = { correct: boolean; message: string };
export function checkSimplified(ex: Exercise, input: string): Check {
  const a = parseExpression(input);
  const right = fmtLin(ex.simplified);
  if (!a) return { correct: false, message: "Svaret gick inte att läsa. Skriv till exempel 5x + 3y − 2." };
  if (!linEq(a, ex.simplified)) return { correct: false, message: `Rätt svar är ${right}. ${tip(ex)}` };
  if (!isSimplifiedForm(input)) return { correct: false, message: `Uttrycket stämmer, men kan förenklas mer: ${right}.` };
  return { correct: true, message: `${right} — snyggt förenklat!` };
}
export function checkValue(ex: Exercise, input: string): Check {
  const a = parseExpression(input);
  if (!a || !isConst(a)) return { correct: false, message: "Skriv ett tal, till exempel 14, −3 eller 5/2." };
  if (eq(a.c, ex.value)) return { correct: true, message: `Ja, värdet är ${fmtFrac(ex.value)}!` };
  return { correct: false, message: `Värdet är ${fmtFrac(ex.value)}. Sätt in ${fmtValues(ex.values)} i ${fmtLin(ex.simplified)} och räkna steg för steg. Tänk på att minus gånger minus blir plus.` };
}
function tip(ex: Exercise) {
  if (ex.mode === "simplify" || ex.mode === "both") {
    return [
      "Räkna ihop alla x-termer, minus betyder att du tar bort.",
      "Håll x och y för sig – de kan inte slås ihop med varandra.",
      "Samla x för sig, y för sig och vanliga tal för sig.",
      "Multiplicera talet framför parentesen med varje term inuti.",
      "Minus framför parentesen byter tecken på alla termer inuti.",
      "Gör liknämnigt innan du lägger ihop bråken.",
      "Ta parenteserna först, gör sedan liknämnigt och slå ihop.",
    ][ex.level];
  }
  return "";
}
