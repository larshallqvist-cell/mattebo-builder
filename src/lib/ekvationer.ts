// Ekvationspusslet: figurer med okända värden, en ny figur per rad, frågan på sista raden.

/** coef · (produkten av figurerna i syms). syms har en eller två figurer (index). */
export type Term = { coef: number; syms: number[] };
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
  /** Svaret om man räknar sista raden från vänster till höger (vanligt fel på nivå 3–4). */
  leftToRight: number;
};
export type Rng = () => number;

export const LEVELS = [
  { name: "Två figurer", blurb: "Bara addition. Rad 1 avslöjar en figur direkt." },
  { name: "Tre figurer", blurb: "Gånger smyger sig in – och raderna är blandade." },
  { name: "Gånger först", blurb: "Sista raden kräver prioriteringsregeln." },
  { name: "x, y och z", blurb: "Figurerna blir bokstäver – riktiga ekvationer." },
] as const;

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

export const termValue = (t: Term, v: number[]) => t.syms.reduce((p, s) => p * v[s], t.coef);
export const evaluate = (terms: Term[], v: number[]) => terms.reduce((sum, t) => sum + termValue(t, v), 0);

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

export function generatePuzzle(level: number, rng: Rng = Math.random): Puzzle {
  const lv = Math.max(0, Math.min(3, level));
  const n = lv === 0 ? 2 : 3;
  const values = pickDistinct(rng, lv === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10], n);
  const [A, B, C] = [0, 1, 2];
  let rows: Term[][];
  let question: Term[];

  if (lv === 0) {
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

  const symbols = pickFigures(lv, n, rng);
  return {
    level: lv, symbols, values,
    lines: rows.map((terms) => ({ terms, result: evaluate(terms, values) })),
    order: rowOrder(lv, rows.length, rng),
    question, answer: evaluate(question, values), leftToRight: evaluateLeftToRight(question, values),
  };
}

/** Text för en term, t.ex. "🐮 · 2", "2x" eller "y · z". */
export function termText(t: Term, name: (s: number) => string, variables: boolean) {
  const prod = t.syms.map(name).join(" · ");
  if (t.coef === 1) return prod;
  return variables ? `${t.coef}${prod}` : `${prod} · ${t.coef}`;
}

/** Lösningen steg för steg, en rad per figur och sist frågan. */
export function explain(p: Puzzle, name: (s: number) => string): string[] {
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

export type Result = { correct: boolean; message: string; showSolution: boolean; priorityError?: boolean };

export function checkAnswer(p: Puzzle, raw: string): Result {
  const cleaned = raw.replace(/[\s\u00a0]/g, "").replace(/[−–]/g, "-");
  if (!/^-?\d+$/.test(cleaned)) return { correct: false, message: "Skriv svaret som ett heltal, t.ex. 27.", showSolution: false };
  const v = Number(cleaned);
  if (v === p.answer) return { correct: true, message: `${p.answer} är rätt.`, showSolution: false };
  if (p.level >= 2 && v === p.leftToRight) {
    return { correct: false, message: "Du räknade från vänster till höger. Kom ihåg: gånger går före plus!", showSolution: true, priorityError: true };
  }
  return { correct: false, message: "Lös ut en figur i taget – börja med raden som bara har en sorts figur. Så här går det till:", showSolution: true };
}
