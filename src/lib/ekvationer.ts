// Ekvationspusslet: figurer med okända värden, en ny figur per rad, frågan på sista raden.

/**
 * coef · (produkten av figurerna i syms). syms har en eller två figurer (index); tom = konstant.
 * Nivå 5: inner = parentes (multipliceras med coef och syms, after = figurerna skrivs efter parentesen)
 * och div = bråkstreck under hela termen. Generatorn väljer alltid nämnare som går jämnt ut.
 */
export type Term = { coef: number; syms: number[]; inner?: Term[]; div?: number; after?: boolean };
export type Line = { terms: Term[]; result: number };
export type Puzzle = {
  level: number;
  /** Figur-id per index: emoji, profil-id eller variabelnamn. */
  symbols: string[];
  values: number[];
  /** I logisk ordning: rad i introducerar figur i. */
  lines: Line[];
  /** Visningsordning: order[plats] = index i lines. Nivå 1 i ordning, från nivå 2 blandad. */
  order: number[];
  question: Term[];
  answer: number;
  /** Vanligaste felsvaret: vänster → höger på nivå 3–4, parentesen ignorerad på nivå 5. */
  leftToRight: number;
};
export type Rng = () => number;

export const LEVELS = [
  { name: "Två figurer", blurb: "Bara addition. Rad 1 avslöjar en figur direkt." },
  { name: "Tre figurer", blurb: "Gånger smyger sig in – och raderna är blandade." },
  { name: "Gånger först", blurb: "Sista raden kräver prioriteringsregeln." },
  { name: "x, y och z", blurb: "Figurerna blir bokstäver – riktiga ekvationer." },
  { name: "Bråk och parenteser", blurb: "x, y och z med bråk och parenteser – parentesen först." },
] as const;
/** Nivån (index) där bråk och parenteser kommer in. */
export const PAREN_LEVEL = 4;

export const ANIMALS = ["🐮", "🍌", "🍕", "🍦", "🐷", "🍎", "🐸", "🍓", "🐔", "🍉", "🐶", "🍩"];
export const PROFILES = [
  { id: "zlatan", name: "Zlatan", icon: "⚽" },
  { id: "kungen", name: "Carl XVI Gustaf", short: "Kungen", icon: "👑" },
  { id: "carola", name: "Carola", icon: "🎤" },
  { id: "taylor", name: "Taylor Swift", short: "Taylor", icon: "🎸" },
  { id: "magdalena", name: "Magdalena", icon: "🏫" },
  { id: "ronaldo", name: "Cristiano Ronaldo", short: "Ronaldo", icon: "⚽" },
  { id: "messi", name: "Lionel Messi", short: "Messi", icon: "⚽" },
  { id: "pernilla", name: "Pernilla Wahlgren", short: "Pernilla", icon: "🎤" },
  { id: "benjamin", name: "Benjamin Ingrosso", short: "Benjamin", icon: "🎤" },
  { id: "mrbeast", name: "MrBeast", icon: "📹" },
  { id: "therock", name: "Dwayne Johnson", short: "The Rock", icon: "💪" },
  { id: "bieber", name: "Justin Bieber", short: "Bieber", icon: "🎤" },
] as const;
export const VARIABLES = ["x", "y", "z"];

const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = <T,>(rng: Rng, a: readonly T[]): T => a[Math.floor(rng() * a.length)];
function pickDistinct<T>(rng: Rng, a: readonly T[], n: number): T[] {
  const pool = [...a]; const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
const one = (s: number): Term => ({ coef: 1, syms: [s] });
const rep = (s: number, k: number): Term[] => Array.from({ length: k }, () => one(s));

export const termValue = (t: Term, v: number[]): number =>
  (t.syms.reduce((p, s) => p * v[s], t.coef) * (t.inner ? evaluate(t.inner, v) : 1)) / (t.div ?? 1);
export function evaluate(terms: Term[], v: number[]): number { return terms.reduce((sum, t) => sum + termValue(t, v), 0); }

/** Som om parentesen inte fanns: faktorn tar bara närmaste term och nämnaren bara den sista. */
export function evaluateWithoutParens(terms: Term[], v: number[]) {
  return terms.reduce((sum, t) => {
    if (!t.inner) return sum + termValue(t, v);
    const m = t.syms.reduce((p, s) => p * v[s], t.coef);
    const parts = t.inner.map((x) => termValue(x, v));
    parts[t.after ? parts.length - 1 : 0] *= m;
    parts[parts.length - 1] /= t.div ?? 1;
    return sum + parts.reduce((a, b) => a + b, 0);
  }, 0);
}

/** Räknar strikt från vänster till höger, som om + och · vore lika starka. */
export function evaluateLeftToRight(terms: Term[], v: number[]) {
  let acc: number | null = null;
  for (const t of terms) {
    const parts = [...t.syms.map((s) => v[s]), ...(t.coef !== 1 ? [t.coef] : [])];
    parts.forEach((p, i) => { acc = acc === null ? p : i === 0 ? acc + p : acc * p; });
  }
  return acc ?? 0;
}

/**
 * Hur kändisar smyger in per nivå (inget temaval):
 * nivå 1 – ibland (≈28 % av pusslen) en kändis bland emojis, nivå 2 – varje figur 50 % kändis,
 * nivå 3 – oftast bara kändisar (85 %), annars två kändisar och en emoji. Nivå 4 använder x, y, z.
 */
export const CELEBRITY_MIX = { level1Puzzle: 0.28, level2Figure: 0.5, level3AllCelebrities: 0.85 } as const;

export function pickFigures(lv: number, n: number, rng: Rng = Math.random): string[] {
  if (lv >= 3) return VARIABLES.slice(0, n);
  let celeb: boolean[];
  if (lv === 0) {
    const slot = rng() < CELEBRITY_MIX.level1Puzzle ? Math.floor(rng() * n) : -1;
    celeb = Array.from({ length: n }, (_, i) => i === slot);
  } else if (lv === 1) {
    celeb = Array.from({ length: n }, () => rng() < CELEBRITY_MIX.level2Figure);
  } else {
    const emojiSlot = rng() < CELEBRITY_MIX.level3AllCelebrities ? -1 : Math.floor(rng() * n);
    celeb = Array.from({ length: n }, (_, i) => i !== emojiSlot);
  }
  const people = pickDistinct(rng, PROFILES.map((p) => p.id), n);
  const emojis = pickDistinct(rng, ANIMALS, n);
  return celeb.map((c, i) => (c ? people[i] : emojis[i]));
}

/** Nivå 1 i ordning. Från nivå 2 alltid blandad (aldrig startnyckeln först i ordning). */
export function rowOrder(lv: number, n: number, rng: Rng = Math.random): number[] {
  const id = Array.from({ length: n }, (_, i) => i);
  if (lv === 0 || n < 2) return id;
  for (let tries = 0; tries < 20; tries++) {
    const o = pickDistinct(rng, id, n);
    if (o.some((v, i) => v !== i)) return o;
  }
  return [...id.slice(1), id[0]];
}

/** Radnummer som eleven ser för den logiska raden i. */
export const shownRow = (p: Puzzle, i: number) => p.order.indexOf(i) + 1;

const konst = (c: number): Term => ({ coef: c, syms: [] });
const divisors = (n: number) => [2, 3, 4, 5].filter((k) => n % k === 0);

/** Nivå 5: en ny variabel per rad, med bråk och parenteser. Null om värdena inte gav jämna nämnare. */
function parenPuzzle(rng: Rng): { values: number[]; rows: Term[][]; question: Term[] } | null {
  const values = pickDistinct(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3);
  const [A, B, C] = [0, 1, 2];
  const v = (i: number) => values[i];
  const opts = <T,>(...xs: (T | null)[]) => xs.filter((x): x is T => x !== null);

  const c1 = int(rng, 1, 6);
  const row1 = pick(rng, opts<Term[]>(
    divisors(v(A)).length ? [{ coef: 1, syms: [A], div: pick(rng, divisors(v(A))) }] : null,
    divisors(v(A) + c1).length ? [{ coef: 1, syms: [], inner: [one(A), konst(c1)], div: pick(rng, divisors(v(A) + c1)) }] : null,
    [{ coef: int(rng, 2, 4), syms: [], inner: [one(A), konst(c1)] }],
  ));
  /** Rad där N är ny och K redan känd. */
  const withKnown = (K: number, N: number) => opts<Term[]>(
    [{ coef: int(rng, 2, 3), syms: [], inner: [one(K), one(N)] }],
    divisors(v(K) + v(N)).length ? [{ coef: 1, syms: [], inner: [one(K), one(N)], div: pick(rng, divisors(v(K) + v(N))) }] : null,
    divisors(v(N)).length ? pick(rng, [[{ coef: 1, syms: [N], div: pick(rng, divisors(v(N))) }, one(K)], [one(K), { coef: 1, syms: [N], div: pick(rng, divisors(v(N))) }]]) : null,
  );
  const row2 = pick(rng, withKnown(A, B));
  const row3 = pick(rng, withKnown(pick(rng, [A, B]), C));

  const [x, y, z] = pickDistinct(rng, [A, B, C], 3);
  const question = pick(rng, opts<Term[]>(
    [{ coef: 1, syms: [x], inner: [one(y), one(z)] }],
    [{ coef: 1, syms: [z], inner: [one(x), one(y)], after: true }],
    divisors(v(x) + v(y)).length ? [{ coef: 1, syms: [], inner: [one(x), one(y)], div: pick(rng, divisors(v(x) + v(y))) }, one(z)] : null,
  ));
  return { values, rows: [row1, row2, row3], question };
}

export function generatePuzzle(level: number, rng: Rng = Math.random, tries = 0): Puzzle {
  const lv = Math.max(0, Math.min(PAREN_LEVEL, level));
  const n = lv === 0 ? 2 : 3;
  let values = pickDistinct(rng, lv === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10], n);
  const [A, B, C] = [0, 1, 2];
  let rows: Term[][];
  let question: Term[];

  if (lv === PAREN_LEVEL) {
    let made = parenPuzzle(rng);
    for (let k = 0; !made && k < 100; k++) made = parenPuzzle(rng);
    if (!made) made = { values: [6, 4, 10], rows: [[{ coef: 1, syms: [A], div: 2 }], [{ coef: 2, syms: [], inner: [one(A), one(B)] }], [{ coef: 1, syms: [], inner: [one(B), one(C)], div: 2 }]], question: [{ coef: 1, syms: [A], inner: [one(B), one(C)] }] };
    ({ values, rows, question } = made);
  } else if (lv === 0) {
    rows = [rep(A, int(rng, 2, 3)), pick(rng, [[one(A), one(B)], [one(A), one(B), one(B)], [one(B), one(A), one(B)]])];
    question = pick(rng, [[one(A), one(B)], [one(A), one(A), one(B)], [one(B), one(B), one(A)]]);
  } else if (lv === 3) {
    rows = [
      [{ coef: int(rng, 2, 5), syms: [A] }],
      [{ coef: int(rng, 2, 4), syms: [A] }, one(B)],
      pick(rng, [[one(B), { coef: int(rng, 2, 3), syms: [C] }], [{ coef: int(rng, 2, 3), syms: [C] }, one(A)]]),
    ];
    const [x, y, z] = pickDistinct(rng, [A, B, C], 3);
    question = [one(x), { coef: 1, syms: [y, z] }];
  } else {
    rows = [
      rep(A, int(rng, 2, 3)),
      pick(rng, [[{ coef: int(rng, 2, 3), syms: [A] }, one(B)], [one(B), one(B), one(A)]]),
      pick(rng, [[{ coef: int(rng, 2, 3), syms: [C] }, one(B)], [one(A), one(C), one(C)], [one(B), { coef: 2, syms: [C] }]]),
    ];
    if (lv === 1) question = pick(rng, [[one(A), one(B), one(C)], [one(C), one(C), one(A)], [one(B), one(C), one(A), one(C)]]);
    else {
      const [x, y, z] = pickDistinct(rng, [A, B, C], 3);
      question = [one(x), { coef: 1, syms: [y, z] }];
    }
  }

  // Slutfrågan får aldrig vara en befintlig rad i annan ordning (då står svaret redan där).
  const sig = (t: Term[]): string => t.map((x) => `${x.coef}*${[...x.syms].sort().join(".")}${x.inner ? `(${sig(x.inner)})` : ""}/${x.div ?? 1}`).sort().join("+");
  const asked = sig(question);
  if (tries < 50 && rows.some((r) => sig(r) === asked)) return generatePuzzle(level, rng, tries + 1);

  const symbols = pickFigures(lv, n, rng);
  return {
    level: lv, symbols, values,
    lines: rows.map((terms) => ({ terms, result: evaluate(terms, values) })),
    order: rowOrder(lv, rows.length, rng),
    question, answer: evaluate(question, values),
    leftToRight: lv === PAREN_LEVEL ? evaluateWithoutParens(question, values) : evaluateLeftToRight(question, values),
  };
}

/** Text för en term, t.ex. "🐮 · 2", "2x" eller "y · z". */
export function termText(t: Term, name: (s: number) => string, variables: boolean) {
  const prod = t.syms.map(name).join(" · ");
  if (t.coef === 1) return prod;
  return variables ? `${t.coef}${prod}` : `${prod} · ${t.coef}`;
}

/**
 * Text för ett uttryck med parenteser och bråk, t.ex. "2(x + 3)", "(x + y)/4" eller "z/3".
 * numeric = siffror insatta, då skrivs gånger ut: "2 · (5 + 3)".
 */
export function exprText(terms: Term[], name: (s: number) => string, numeric = false): string {
  return terms.map((t) => {
    const showCoef = t.coef !== 1 || (!t.syms.length && !t.inner);
    const factors = [...(showCoef ? [String(t.coef)] : []), ...t.syms.map(name)];
    const group = t.inner ? `(${exprText(t.inner, name, numeric)})` : "";
    const glue = numeric || t.syms.length > 1 ? " · " : "";
    const head = numeric ? factors.join(" · ") : showCoef ? `${t.coef}${t.syms.map(name).join(" · ")}` : t.syms.map(name).join(" · ");
    const body = !group ? head : !head ? group : t.after ? `${group}${glue}${head}` : `${head}${glue}${group}`;
    void factors;
    return t.div ? `${body}/${t.div}` : body;
  }).join(" + ");
}

function explainParens(p: Puzzle, name: (s: number) => string): string[] {
  const val = (k: number) => String(p.values[k]);
  const steps = p.lines.map((line, i) => {
    const N = name(i);
    const row = shownRow(p, i);
    let s = i === 0
      ? `Börja med rad ${row} – det är den enda raden med bara ${N}. `
      : `Leta sedan upp rad ${row}, där bara ${N} är okänd. `;
    s += `Där står ${exprText(line.terms, name)} = ${line.result}. `;
    const group = line.terms.find((t) => t.inner?.some((x) => x.syms.includes(i)));
    if (group?.inner) {
      const m = group.syms.reduce((acc, k) => acc * p.values[k], group.coef);
      const d = group.div ?? 1;
      const innerTxt = `${exprText(group.inner, name)}`;
      let cur = line.result;
      if (d > 1) { cur *= d; s += `Gör dig av med bråket – multiplicera båda sidor med ${d}: ${m > 1 ? `${m}(${innerTxt})` : innerTxt} = ${line.result} · ${d} = ${cur}. `; }
      if (m > 1) { const before = cur; cur /= m; s += `Dela båda sidor med ${m}: ${innerTxt} = ${before} / ${m} = ${cur}. `; }
      const known = group.inner.filter((x) => !x.syms.includes(i));
      const ks = evaluate(known, p.values);
      if (!known.length) s += `Alltså är ${N} = ${p.values[i]}.`;
      else if (known.every((x) => !x.syms.length)) s += `Då är ${N} = ${cur} − ${ks} = ${p.values[i]}.`;
      else s += `Du vet redan att ${exprText(known, name)} = ${ks}, så ${N} = ${cur} − ${ks} = ${p.values[i]}.`;
      return s;
    }
    const frac = line.terms.find((t) => t.syms.includes(i));
    const known = line.terms.filter((t) => t !== frac);
    const ks = evaluate(known, p.values);
    const d = frac?.div ?? 1;
    const coef = frac?.coef ?? 1;
    let rest = line.result;
    if (known.length) { rest = line.result - ks; s += `Du vet redan att ${exprText(known, name)} = ${known.length === 1 && !known[0].div && known[0].coef === 1 ? ks : `${exprText(known, val, true)} = ${ks}`}, så ${frac ? exprText([frac], name) : N} = ${line.result} − ${ks} = ${rest}. `; }
    if (d > 1) s += `Multiplicera med ${d}: ${coef > 1 ? `${coef}${N}` : N} = ${rest} · ${d} = ${rest * d}`;
    else s += `${coef > 1 ? `${coef}${N}` : N} = ${rest}`;
    s += coef > 1 ? `, så ${N} = ${rest * d} / ${coef} = ${p.values[i]}.` : d > 1 ? "." : `, så ${N} = ${p.values[i]}.`;
    return s;
  });

  const subs = exprText(p.question, val, true);
  const group = p.question.find((t) => t.inner);
  if (!group?.inner) { steps.push(`Sista raden: ${subs} = ${p.answer}.`); return steps; }
  const inner = evaluate(group.inner, p.values);
  let s = `Sista raden: ${subs}. Parentesen först: ${exprText(group.inner, val, true)} = ${inner}. `;
  const factors = [...(group.coef !== 1 ? [group.coef] : []), ...group.syms.map((k) => p.values[k])];
  let cur = inner;
  if (factors.length) { cur = factors.reduce((a, b) => a * b, inner); s += `Sedan gånger: ${group.after ? [inner, ...factors].join(" · ") : [...factors, inner].join(" · ")} = ${cur}. `; }
  if (group.div) { const before = cur; cur /= group.div; s += `Sedan bråket: ${before} / ${group.div} = ${cur}. `; }
  const others = p.question.filter((t) => t !== group).map((t) => termValue(t, p.values));
  if (others.length) s += `Sist ${[cur, ...others].join(" + ")} = ${p.answer}.`;
  steps.push(s.trim());
  return steps;
}

/** Lösningen steg för steg, en rad per figur och sist frågan. */
export function explain(p: Puzzle, name: (s: number) => string): string[] {
  if (p.level === PAREN_LEVEL) return explainParens(p, name);
  const variables = p.level === 3;
  const steps = p.lines.map((line, i) => {
    const newSym = i;
    const known = line.terms.filter((t) => !t.syms.includes(newSym));
    const count = line.terms.filter((t) => t.syms.includes(newSym)).reduce((c, t) => c + t.coef, 0);
    const knownSum = evaluate(known, p.values);
    const rest = line.result - knownSum;
    const N = name(newSym);
    const lhs = count > 1 ? (variables ? `${count}${N}` : `${count} · ${N}`) : N;
    const row = shownRow(p, i);
    let s = i === 0
      ? `Börja med rad ${row} – det är den enda raden med bara en sorts figur. `
      : `Leta sedan upp rad ${row}, där bara en ny figur är okänd. `;
    if (known.length) {
      const named = known.map((t) => termText(t, name, variables)).join(" + ");
      const nums = known.map((t) => termText(t, (k) => String(p.values[k]), false)).join(" + ");
      const simple = known.length === 1 && known[0].coef === 1 && known[0].syms.length === 1;
      s += `Du vet redan att ${named} = ${simple ? knownSum : `${nums} = ${knownSum}`}. Då är ${lhs} = ${line.result} − ${knownSum} = ${rest}`;
    } else {
      s += `${lhs} = ${line.result}`;
    }
    s += count > 1 ? `, så ${N} = ${rest} / ${count} = ${p.values[newSym]}.` : known.length ? "." : `, så ${N} = ${p.values[newSym]}.`;
    return s;
  });
  const subs = p.question.map((t) => termText(t, (k) => String(p.values[k]), false)).join(" + ");
  const product = p.question.find((t) => t.syms.length > 1);
  if (product) {
    const pv = termValue(product, p.values);
    const others = p.question.filter((t) => t !== product).map((t) => termValue(t, p.values));
    steps.push(`Sista raden: ${subs}. Gånger först: ${product.syms.map((k) => p.values[k]).join(" · ")} = ${pv}. Sedan ${[...others, pv].join(" + ")} = ${p.answer}.`);
  } else {
    steps.push(`Sista raden: ${subs} = ${p.answer}.`);
  }
  return steps;
}

export type Result = { correct: boolean; message: string; showSolution: boolean; priorityError?: boolean; parenError?: boolean };

export function checkAnswer(p: Puzzle, raw: string): Result {
  const cleaned = raw.replace(/[\s\u00a0]/g, "").replace(/[−–]/g, "-");
  if (!/^-?\d+$/.test(cleaned)) return { correct: false, message: "Skriv svaret som ett heltal, t.ex. 27.", showSolution: false };
  const v = Number(cleaned);
  if (v === p.answer) return { correct: true, message: `${p.answer} är rätt.`, showSolution: false };
  if (p.level === PAREN_LEVEL && v === p.leftToRight) {
    return { correct: false, message: "Du räknade som om parentesen inte fanns. Räkna alltid ut det som står inom parentes först!", showSolution: true, parenError: true };
  }
  if (p.level >= 2 && v === p.leftToRight) {
    return { correct: false, message: "Du räknade från vänster till höger. Kom ihåg: gånger går före plus!", showSolution: true, priorityError: true };
  }
  if (p.level === PAREN_LEVEL) return { correct: false, message: "Lös ut en variabel i taget – börja med raden som bara har x. Så här går det till:", showSolution: true };
  return { correct: false, message: "Lös ut en figur i taget – börja med raden som bara har en sorts figur. Så här går det till:", showSolution: true };
}
