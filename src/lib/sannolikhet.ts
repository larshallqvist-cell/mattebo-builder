/** Sannolikhetslabbet: fasta nivåer med stjärnor i fyra världar (hjul, urna, kortlek, mynt/träddiagram).
 *  Varje nivå slumpar fem uppgifter; svaret ges i bråkform, procent eller som heltal. */
import { isGameOpenForGrade, type VisibilityRow } from "./gameVisibility";

export type Frac = { n: number; d: number };
export type Format = "frac" | "pct" | "int";
export type ColorKey = "rod" | "bla" | "gron" | "gul" | "lila" | "orange";

export const COLORS: Record<ColorKey, { en: string; ett: string; pl: string }> = {
  rod: { en: "röd", ett: "rött", pl: "röda" },
  bla: { en: "blå", ett: "blått", pl: "blå" },
  gron: { en: "grön", ett: "grönt", pl: "gröna" },
  gul: { en: "gul", ett: "gult", pl: "gula" },
  lila: { en: "lila", ett: "lila", pl: "lila" },
  orange: { en: "orange", ett: "orange", pl: "orange" },
};
const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

// ---------- Små hjälpare ----------
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const simplify = (f: Frac): Frac => { const g = gcd(f.n, f.d) || 1; return { n: f.n / g, d: f.d / g }; };
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
export const shuffle = <T,>(xs: readonly T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
/** Delar total i k positiva delar. */
function split(total: number, k: number): number[] {
  const cuts = shuffle(Array.from({ length: total - 1 }, (_, i) => i + 1)).slice(0, k - 1).sort((a, b) => a - b);
  return [...cuts, total].map((c, i, arr) => c - (i ? arr[i - 1] : 0));
}
const pctValue = (f: Frac) => (100 * f.n) / f.d;
/** Procenten går att skriva exakt med högst en decimal (12,5 % men inte 33,33… %). */
export const pctOk = (f: Frac) => Math.abs(Math.round(pctValue(f) * 10) - pctValue(f) * 10) < 1e-9;
export const fmtPct = (f: Frac) => `${String(Math.round(pctValue(f) * 10) / 10).replace(".", ",")} %`;
/** Bråk skrivs [n/d] i texterna; sidan ritar dem som staplade bråk. */
export const fr = (n: number, d: number) => `[${n}/${d}]`;

/** "P = [3/12] = [1/4] = 25 %" – förkortning och procent bara när de behövs. */
export function pLine(f: Frac, format: Format, label = "P"): string {
  const s = simplify(f);
  let out = `${label} = ${fr(f.n, f.d)}`;
  if (s.d !== f.d) out += ` = ${fr(s.n, s.d)}`;
  if (format === "pct") out += ` = ${fmtPct(f)}`;
  return out;
}
function chooseFormat(f: Frac, mode: "frac" | "pct" | "mix"): Format {
  if (mode === "frac" || !pctOk(f)) return "frac";
  if (mode === "pct") return "pct";
  return Math.random() < 0.5 ? "pct" : "frac";
}

// ---------- Scener ----------
export type Slice = { color: ColorKey; size: number };
export type Card = { suit: Suit; rank: number };
export type Suit = "S" | "H" | "D" | "C";
export type TreeNode = { label: string; p?: string; children?: TreeNode[] };
export type Scene =
  | { kind: "wheel"; slices: Slice[]; deg?: boolean }
  | { kind: "urn"; balls: ColorKey[]; aside?: ColorKey[] }
  | { kind: "deck"; aside?: Card[] }
  | { kind: "coins"; count: number }
  | { kind: "die" }
  | { kind: "tree"; root: TreeNode[]; legend?: string }
  | { kind: "combo"; groups: { name: string; items: string[] }[] };

export type Task = {
  scene: Scene;
  question: string;
  format: Format;
  /** Bråk för frac/pct, heltal för int. */
  answer: Frac | number;
  hint: string;
  steps: string[];
  /** Kort (id) eller löv (index) som lyses upp efter svaret. */
  match?: string[];
};

// ---------- Rättning ----------
export type Input = { n?: string; d?: string; v?: string };
export const parseNum = (s: string | undefined): number | null => {
  const t = (s ?? "").trim().replace(/\s|%/g, "").replace(",", ".").replace("−", "-");
  if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
};
export type Check = { ok: boolean; simplified: boolean };
/** null = svaret är inte ifyllt. Bråk godkänns oförkortade, procent med högst 0,05 procentenheters avvikelse. */
export function checkAnswer(task: Task, input: Input): Check | null {
  if (task.format === "frac") {
    const n = parseNum(input.n), d = parseNum(input.d);
    if (n === null || d === null || d === 0 || !Number.isInteger(n) || !Number.isInteger(d)) return null;
    const a = task.answer as Frac;
    return { ok: n * a.d === a.n * d, simplified: gcd(n, d) === 1 };
  }
  const v = parseNum(input.v);
  if (v === null) return null;
  if (task.format === "pct") return { ok: Math.abs(v - pctValue(task.answer as Frac)) < 0.051, simplified: true };
  return { ok: v === task.answer, simplified: true };
}
export function answerText(task: Task): string {
  if (task.format === "int") return String(task.answer);
  const f = task.answer as Frac; const s = simplify(f);
  return task.format === "pct" ? fmtPct(f) : s.d !== f.d ? `${fr(f.n, f.d)} = ${fr(s.n, s.d)}` : fr(f.n, f.d);
}

// ---------- Generatorer: värld 1, Lyckohjulet ----------
function colorCounts(total: number, k: number): { color: ColorKey; count: number }[] {
  const colors = shuffle(COLOR_KEYS).slice(0, k);
  return split(total, k).map((count, i) => ({ color: colors[i], count }));
}
const unitWheel = (groups: { color: ColorKey; count: number }[]): Slice[] =>
  shuffle(groups.flatMap((g) => Array.from({ length: g.count }, () => ({ color: g.color, size: 1 }))));
const chanceTask = (scene: Scene, question: string, f: Frac, format: Format, hint: string, fav: string, all: string, match?: string[]): Task => ({
  scene, question, format, answer: f, hint, match,
  steps: [`Gynnsamma utfall: ${fav}`, `Möjliga utfall: ${all}`, pLine(f, format)],
});

function wheelEqual(mode: "frac" | "pct"): Task {
  const total = pick(mode === "pct" ? [4, 5, 8, 10] : [4, 6, 8]);
  const groups = colorCounts(total, rnd(2, total >= 6 ? 3 : 2));
  const t = pick(groups); const f = { n: t.count, d: total };
  return chanceTask({ kind: "wheel", slices: unitWheel(groups) }, `Hjulet har ${total} lika stora fält. Hur stor är chansen att visaren stannar på ett ${COLORS[t.color].ett} fält?`,
    f, mode, `Räkna de ${COLORS[t.color].pl} fälten och jämför med alla ${total} fält.`, `${t.count} ${COLORS[t.color].pl} fält`, `${total} fält`);
}
function wheelSizes(): Task {
  const [total, sizes] = pick([[8, [4, 2, 2]], [8, [4, 3, 1]], [4, [2, 1, 1]], [10, [5, 3, 2]], [10, [4, 4, 2]], [12, [6, 4, 2]], [6, [3, 2, 1]]] as const);
  const colors = shuffle(COLOR_KEYS);
  const slices = sizes.map((size, i) => ({ color: colors[i], size }));
  const t = pick(slices); const f = { n: t.size, d: total };
  return chanceTask({ kind: "wheel", slices }, `Fälten är olika stora. Hur stor är chansen att visaren stannar på ${COLORS[t.color].ett}?`,
    f, chooseFormat(f, "mix"), `Hjulet är delat i ${total} lika stora bitar med tunna streck. Hur många bitar är ${COLORS[t.color].ett}?`,
    `${t.size} bitar är ${COLORS[t.color].ett}`, `${total} lika stora bitar`);
}
function wheelCombined(): Task {
  const total = pick([8, 10]);
  const groups = colorCounts(total, rnd(3, 4));
  const slices = unitWheel(groups);
  if (Math.random() < 0.5) {
    const t = pick(groups); const f = { n: total - t.count, d: total };
    return chanceTask({ kind: "wheel", slices }, `Hur stor är chansen att visaren INTE stannar på ${COLORS[t.color].ett}?`, f, chooseFormat(f, "mix"),
      `Räkna alla fält som inte är ${COLORS[t.color].ett}. Eller: ta bort de ${COLORS[t.color].pl} från alla.`, `${total} − ${t.count} = ${total - t.count} fält`, `${total} fält`);
  }
  const [a, b] = shuffle(groups); const f = { n: a.count + b.count, d: total };
  return chanceTask({ kind: "wheel", slices }, `Hur stor är chansen att visaren stannar på ${COLORS[a.color].ett} ELLER ${COLORS[b.color].ett}?`, f, chooseFormat(f, "mix"),
    "Båda färgerna är gynnsamma. Lägg ihop dem.", `${a.count} + ${b.count} = ${a.count + b.count} fält`, `${total} fält`);
}
function wheelExpected(): Task {
  const total = pick([4, 5, 8, 10]);
  const groups = colorCounts(total, rnd(2, 3));
  const t = pick(groups);
  const spins = pick([40, 80, 100, 120, 200, 400, 500, 1000].filter((x) => x % total === 0));
  const ans = (spins * t.count) / total; const p = simplify({ n: t.count, d: total });
  return {
    scene: { kind: "wheel", slices: unitWheel(groups) },
    question: `Hjulet snurras ${spins} gånger. Hur många gånger kan du förvänta dig att det stannar på ${COLORS[t.color].ett}?`,
    format: "int", answer: ans,
    hint: `Chansen för ${COLORS[t.color].ett} är ${fr(t.count, total)}. Hur mycket är det av ${spins}?`,
    steps: [`Chansen för ${COLORS[t.color].ett}: ${fr(t.count, total)}${p.d !== total ? ` = ${fr(p.n, p.d)}` : ""}`, `Förväntat antal = ${fr(p.n, p.d)} · ${spins} = ${ans}`],
  };
}
function wheelDegrees(): Task {
  const total = pick([8, 10, 12, 6]);
  const unit = 360 / total;
  const sizes = split(total, rnd(3, 4));
  const colors = shuffle(COLOR_KEYS);
  const slices = sizes.map((size, i) => ({ color: colors[i], size }));
  const t = pick(slices); const deg = t.size * unit; const f = { n: deg, d: 360 };
  const format = chooseFormat(f, "pct");
  return {
    scene: { kind: "wheel", slices, deg: true }, format, answer: f,
    question: `Det ${COLORS[t.color].ett} fältet har vinkeln ${deg}°. Hur stor är chansen att visaren stannar på ${COLORS[t.color].ett}?`,
    hint: "Ett helt varv är 360°. Hur stor del av 360° är fältet?",
    steps: ["Ett helt varv är 360°.", `Fältet är ${deg}° av 360°.`, pLine(f, format)],
  };
}

// ---------- Värld 2, Urnan ----------
const urnBalls = (groups: { color: ColorKey; count: number }[]) => shuffle(groups.flatMap((g) => Array.from({ length: g.count }, () => g.color)));
const listBalls = (groups: { color: ColorKey; count: number }[]) =>
  groups.map((g) => `${g.count} ${g.count === 1 ? COLORS[g.color].en : COLORS[g.color].pl}`).join(", ").replace(/, ([^,]*)$/, " och $1");

function urnSimple(mode: "frac" | "pct"): Task {
  const total = mode === "pct" ? pick([4, 5, 8, 10, 20]) : rnd(5, 12);
  const groups = colorCounts(total, rnd(2, 3));
  const t = pick(groups); const f = { n: t.count, d: total };
  return chanceTask({ kind: "urn", balls: urnBalls(groups) }, `I påsen finns ${listBalls(groups)} kulor. Du drar en kula utan att titta. Hur stor är chansen att den är ${COLORS[t.color].en}?`,
    f, mode, `Hur många ${COLORS[t.color].pl} kulor finns det, och hur många kulor finns det totalt?`, `${t.count} ${COLORS[t.color].pl} kulor`, `${total} kulor`);
}
function urnNot(): Task {
  const total = pick([5, 8, 10, 6, 12, 20]);
  const groups = colorCounts(total, 3);
  const t = pick(groups); const f = { n: total - t.count, d: total };
  return chanceTask({ kind: "urn", balls: urnBalls(groups) }, `Hur stor är chansen att du INTE drar en ${COLORS[t.color].en} kula?`, f, chooseFormat(f, "mix"),
    `Räkna alla kulor som inte är ${COLORS[t.color].pl}.`, `${total} − ${t.count} = ${total - t.count} kulor`, `${total} kulor`);
}
function urnOr(): Task {
  const total = pick([8, 10, 12, 20]);
  const groups = colorCounts(total, rnd(3, 4));
  const [a, b] = shuffle(groups); const f = { n: a.count + b.count, d: total };
  return chanceTask({ kind: "urn", balls: urnBalls(groups) }, `Hur stor är chansen att du drar en ${COLORS[a.color].en} ELLER en ${COLORS[b.color].en} kula?`, f, chooseFormat(f, "mix"),
    "Båda färgerna är gynnsamma. Lägg ihop antalen.", `${a.count} + ${b.count} = ${a.count + b.count} kulor`, `${total} kulor`);
}
function urnAdd(): Task {
  const pct = pick([50, 25, 20, 10]);
  const red = pct === 10 ? rnd(1, 3) : pct === 50 ? rnd(2, 6) : rnd(2, 4);
  const total = (red * 100) / pct;
  const blue = rnd(0, Math.min(total - red - 1, 6));
  const ans = total - red - blue;
  const groups = [{ color: "rod" as ColorKey, count: red }, ...(blue ? [{ color: "bla" as ColorKey, count: blue }] : [])];
  return {
    scene: { kind: "urn", balls: urnBalls(groups) }, format: "int", answer: ans,
    question: `I påsen finns ${listBalls(groups)} kulor. Hur många blå kulor måste du lägga i för att chansen att dra en röd ska bli ${pct} %?`,
    hint: `${pct} % betyder att de röda ska vara ${fr(pct, 100)} = ${fr(simplify({ n: pct, d: 100 }).n, simplify({ n: pct, d: 100 }).d)} av alla kulor. Hur många kulor ska det då vara totalt?`,
    steps: [`${pct} % = ${fr(simplify({ n: pct, d: 100 }).n, simplify({ n: pct, d: 100 }).d)}, så ${red} röda ska vara ${fr(simplify({ n: pct, d: 100 }).n, simplify({ n: pct, d: 100 }).d)} av alla.`,
      `Totalt behövs ${red} · ${100 / pct} = ${total} kulor.`, `Nu finns ${red + blue}. Lägg i ${total} − ${red + blue} = ${ans} blå.`],
  };
}
function urnNoReplace(): Task {
  const total = rnd(6, 10);
  const groups = colorCounts(total, rnd(2, 3)).filter(() => true);
  const first = pick(groups);
  const target = pick(groups.filter((g) => g.color !== first.color || g.count >= 2));
  const left = target.count - (target.color === first.color ? 1 : 0);
  const f = { n: left, d: total - 1 };
  const remaining = groups.map((g) => ({ ...g, count: g.count - (g.color === first.color ? 1 : 0) }));
  return {
    scene: { kind: "urn", balls: urnBalls(remaining), aside: [first.color] }, format: "frac", answer: f,
    question: `I påsen fanns ${listBalls(groups)} kulor. Du drog en ${COLORS[first.color].en} och lade den åt sidan. Hur stor är chansen att nästa kula blir ${COLORS[target.color].en}?`,
    hint: "Kulan du drog är borta. Hur många kulor finns kvar, och hur många av dem har rätt färg?",
    steps: [`Kvar i påsen: ${total} − 1 = ${total - 1} kulor.`, `${COLORS[target.color].pl[0].toUpperCase() + COLORS[target.color].pl.slice(1)} kvar: ${left}`, pLine(f, "frac")],
  };
}

// ---------- Värld 3, Kortleken ----------
export const SUITS: { key: Suit; name: string; sym: string; red: boolean }[] = [
  { key: "S", name: "spader", sym: "♠", red: false }, { key: "H", name: "hjärter", sym: "♥", red: true },
  { key: "D", name: "ruter", sym: "♦", red: true }, { key: "C", name: "klöver", sym: "♣", red: false },
];
export const RANK_LABEL = (r: number) => (r === 1 ? "E" : r === 11 ? "Kn" : r === 12 ? "D" : r === 13 ? "K" : String(r));
const RANK_NAME = ["", "ett ess", "en tvåa", "en trea", "en fyra", "en femma", "en sexa", "en sjua", "en åtta", "en nia", "en tia", "en knekt", "en dam", "en kung"];
export const cardId = (c: Card) => `${c.suit}${c.rank}`;
export const DECK: Card[] = SUITS.flatMap((s) => Array.from({ length: 13 }, (_, i) => ({ suit: s.key, rank: i + 1 })));
const isRed = (c: Card) => c.suit === "H" || c.suit === "D";
const isFace = (c: Card) => c.rank >= 11;
type Cond = { text: string; pred: (c: Card) => boolean; hint: string };
const suitCond = (s = pick(SUITS)): Cond => ({ text: `ett ${s.name}`, pred: (c) => c.suit === s.key, hint: "Det finns fyra färger med lika många kort i varje." });
const colorCond = (): Cond => { const red = Math.random() < 0.5; return { text: `ett ${red ? "rött" : "svart"} kort`, pred: (c) => isRed(c) === red, hint: red ? "Hjärter och ruter är röda." : "Spader och klöver är svarta." }; };
const rankCond = (r = rnd(1, 13)): Cond => ({ text: RANK_NAME[r], pred: (c) => c.rank === r, hint: "Det finns en av varje valör i varje färg." });

function deckTask(cond: Cond, mode: "frac" | "pct" | "mix", deck: Card[] = DECK, aside?: Card[]): Task {
  const fav = deck.filter(cond.pred);
  const f = { n: fav.length, d: deck.length };
  const format = chooseFormat(f, mode);
  const intro = aside?.length ? `Du har dragit ${aside.map((c) => `${SUITS.find((s) => s.key === c.suit)!.name} ${RANK_LABEL(c.rank)}`).join(" och ")} och lagt det åt sidan. ` : "";
  return chanceTask({ kind: "deck", aside }, `${intro}Du drar ${aside?.length ? "ett nytt" : "ett"} kort. Hur stor är chansen att det är ${cond.text}?`, f, format,
    cond.hint, `${fav.length} kort`, `${deck.length} kort${aside?.length ? " kvar" : ""}`, fav.map(cardId));
}
const deckSuits = () => deckTask(Math.random() < 0.6 ? suitCond() : colorCond(), "frac");
const deckRanks = () => deckTask(rankCond(), "frac");
function deckPct(): Task {
  const s = pick(SUITS);
  const c: Cond = pick([suitCond(s), colorCond(), { text: `inte ett ${s.name}`, pred: (x: Card) => x.suit !== s.key, hint: "Räkna korten i de tre andra färgerna." }]);
  return deckTask(c, "pct");
}
function deckFaces(): Task {
  const s = pick(SUITS); const [a, b] = shuffle([1, 11, 12, 13]).slice(0, 2);
  return deckTask(pick<Cond>([
    { text: "ett klätt kort (knekt, dam eller kung)", pred: isFace, hint: "Varje färg har tre klädda kort." },
    { text: `ett klätt ${s.name}`, pred: (c) => isFace(c) && c.suit === s.key, hint: `Hur många klädda kort finns i ${s.name}?` },
    { text: `${RANK_NAME[a]} eller ${RANK_NAME[b]}`, pred: (c) => c.rank === a || c.rank === b, hint: "Fyra av varje valör. Lägg ihop." },
  ]), "frac");
}
function deckCombined(): Task {
  const s = pick(SUITS); const r = pick([1, 11, 12, 13]);
  return deckTask(pick<Cond>([
    { text: "ett rött ess", pred: (c) => isRed(c) && c.rank === 1, hint: "Vilka färger är röda, och hur många ess har de?" },
    { text: "ett ess eller ett klätt kort", pred: (c) => c.rank === 1 || isFace(c), hint: "Fyra ess och tolv klädda kort." },
    { text: `${RANK_NAME[r]} eller ett ${s.name}`, pred: (c) => c.rank === r || c.suit === s.key, hint: `Se upp! ${RANK_NAME[r][0].toUpperCase() + RANK_NAME[r].slice(1)} i ${s.name} får bara räknas en gång.` },
    { text: "ett svart kort med en siffra (2–10)", pred: (c) => !isRed(c) && c.rank >= 2 && c.rank <= 10, hint: "Siffrorna 2–10 är nio kort per färg." },
  ]), "mix");
}
function deckNoReplace(): Task {
  const drawn = pick(DECK); const rest = DECK.filter((c) => cardId(c) !== cardId(drawn));
  const s = SUITS.find((x) => x.key === drawn.suit)!;
  const other = pick(SUITS.filter((x) => x.key !== drawn.suit));
  const cond = pick<Cond>([
    { text: `${RANK_NAME[drawn.rank]} till`, pred: (c) => c.rank === drawn.rank, hint: "Ett av de fyra korten med den valören är redan borta." },
    { text: `ett ${s.name} till`, pred: (c) => c.suit === drawn.suit, hint: `Ett ${s.name} är redan borta, och det finns 51 kort kvar.` },
    { text: `ett ${other.name}`, pred: (c) => c.suit === other.key, hint: `Inget ${other.name} är draget, men det finns bara 51 kort kvar.` },
  ]);
  return deckTask(cond, "frac", rest, [drawn]);
}

// ---------- Värld 4, Mynt, tärning och träddiagram ----------
const KR = "Kr", KL = "Kl";
function coinTree(n: number): TreeNode[] {
  if (n === 0) return [];
  const sub = coinTree(n - 1);
  return [KR, KL].map((label) => ({ label, p: fr(1, 2), children: sub.length ? sub : undefined }));
}
const sequences = (n: number): string[][] => (n === 0 ? [[]] : sequences(n - 1).flatMap((s) => [[...s, KR], [...s, KL]]));
function coinCondTask(n: number, mode: "mix" | "pct", conds: { text: string; pred: (s: string[]) => boolean }[]): Task {
  const c = pick(conds); const seqs = sequences(n);
  const match = seqs.map((s, i) => (c.pred(s) ? String(i) : "")).filter(Boolean);
  const f = { n: match.length, d: seqs.length }; const format = chooseFormat(f, mode);
  return {
    scene: { kind: "tree", root: coinTree(n), legend: "Kr = krona, Kl = klave" }, format, answer: f, match,
    question: `Du singlar ett mynt ${n === 2 ? "två" : "tre"} gånger. Hur stor är chansen att du får ${c.text}?`,
    hint: "Följ varje gren till slutet. Varje utfall längst till höger är lika troligt.",
    steps: [`Möjliga utfall: ${seqs.length} (${n === 2 ? "2 · 2" : "2 · 2 · 2"})`, `Gynnsamma utfall: ${match.length}`, pLine(f, format)],
  };
}
const krCount = (s: string[]) => s.filter((x) => x === KR).length;
function coinOrDie(): Task {
  if (Math.random() < 0.3) {
    const side = pick(["krona", "klave"]); const f = { n: 1, d: 2 }; const format = chooseFormat(f, "mix");
    return chanceTask({ kind: "coins", count: 1 }, `Du singlar ett mynt. Hur stor är chansen att det blir ${side}?`, f, format, "Ett mynt har två sidor.", `1 (${side})`, "2 (krona, klave)");
  }
  const c = pick([
    { text: "en sexa", n: 1, fav: "6" }, { text: "ett jämnt tal", n: 3, fav: "2, 4, 6" }, { text: "mer än 4", n: 2, fav: "5, 6" },
    { text: "minst 3", n: 4, fav: "3, 4, 5, 6" }, { text: "en etta eller en sexa", n: 2, fav: "1, 6" }, { text: "ett udda tal", n: 3, fav: "1, 3, 5" },
  ]);
  const f = { n: c.n, d: 6 };
  return chanceTask({ kind: "die" }, `Du slår en vanlig tärning. Hur stor är chansen att du får ${c.text}?`, f, chooseFormat(f, "mix"), "En tärning har sex sidor: 1, 2, 3, 4, 5 och 6.", `${c.n} (${c.fav})`, "6");
}
const twoCoins = () => coinCondTask(2, "mix", [
  { text: "två kronor", pred: (s) => krCount(s) === 2 }, { text: "två klavar", pred: (s) => krCount(s) === 0 },
  { text: "först krona och sedan klave", pred: (s) => s[0] === KR && s[1] === KL },
  { text: "en krona och en klave (i vilken ordning som helst)", pred: (s) => krCount(s) === 1 },
]);
const atLeast = () => coinCondTask(2, "mix", [
  { text: "minst en krona", pred: (s) => krCount(s) >= 1 }, { text: "exakt en krona", pred: (s) => krCount(s) === 1 },
  { text: "ingen krona", pred: (s) => krCount(s) === 0 }, { text: "minst en klave", pred: (s) => krCount(s) <= 1 },
]);
const threeCoins = () => coinCondTask(3, "pct", [
  { text: "tre kronor", pred: (s) => krCount(s) === 3 }, { text: "exakt två kronor", pred: (s) => krCount(s) === 2 },
  { text: "exakt en krona", pred: (s) => krCount(s) === 1 }, { text: "minst en klave", pred: (s) => krCount(s) < 3 },
  { text: "minst två kronor", pred: (s) => krCount(s) >= 2 }, { text: "högst en krona", pred: (s) => krCount(s) <= 1 },
]);
function ballTree(): Task {
  const red = rnd(2, 4), blue = rnd(1, 3), T = red + blue;
  const back = Math.random() < 0.5;
  const d2 = back ? T : T - 1;
  const second = (firstRed: boolean): TreeNode[] => [
    { label: "R", p: fr(back || !firstRed ? red : red - 1, d2) },
    { label: "B", p: fr(back || firstRed ? blue : blue - 1, d2) },
  ];
  const root: TreeNode[] = [{ label: "R", p: fr(red, T), children: second(true) }, { label: "B", p: fr(blue, T), children: second(false) }];
  const pr = (a: boolean, b: boolean) => {
    const n1 = a ? red : blue;
    const n2 = back ? (b ? red : blue) : (b ? red : blue) - (a === b ? 1 : 0);
    return { n: n1 * n2, d: T * d2, txt: `${fr(n1, T)} · ${fr(n2, d2)}` };
  };
  const c = pick([
    { text: "två röda", paths: [[true, true]], leaves: ["0"] }, { text: "två blå", paths: [[false, false]], leaves: ["3"] },
    { text: "först röd och sedan blå", paths: [[true, false]], leaves: ["1"] },
    { text: "en röd och en blå (i vilken ordning som helst)", paths: [[true, false], [false, true]], leaves: ["1", "2"] },
  ].filter((x) => x.paths.every(([a, b]) => pr(a, b).n > 0)));
  const parts = c.paths.map(([a, b]) => pr(a, b));
  const f = { n: parts.reduce((s, p) => s + p.n, 0), d: T * d2 };
  return {
    scene: { kind: "tree", root, legend: "R = röd, B = blå" }, format: "frac", answer: f, match: c.leaves,
    question: `I påsen finns ${red} röda och ${blue} blå kulor. Du drar två kulor ${back ? "MED återläggning (kulan läggs tillbaka)" : "UTAN återläggning (kulan läggs åt sidan)"}. Hur stor är chansen att du får ${c.text}?`,
    hint: "Multiplicera längs grenen. Gäller flera grenar lägger du ihop dem.",
    steps: [...parts.map((p) => `Grenen: ${p.txt} = ${fr(p.n, T * d2)}`), ...(parts.length > 1 ? [`Lägg ihop: ${parts.map((p) => fr(p.n, T * d2)).join(" + ")}`] : []), pLine(f, "frac")],
  };
}
function combos(): Task {
  const k = pick([0, 1, 2, 3, 4]);
  if (k === 0) {
    const a = rnd(2, 4), b = rnd(2, 4);
    return comboTask(`Du har ${a} tröjor och ${b} byxor. Hur många olika sätt kan du klä dig på?`, [{ name: "Tröjor", items: Array(a).fill("👕") }, { name: "Byxor", items: Array(b).fill("👖") }]);
  }
  if (k === 1) {
    const a = rnd(2, 3), b = rnd(2, 4), c = rnd(2, 3);
    return comboTask(`En meny har ${a} förrätter, ${b} varmrätter och ${c} efterrätter. Hur många olika tre-rätters-middagar kan du välja?`,
      [{ name: "Förrätt", items: Array(a).fill("🥗") }, { name: "Varmrätt", items: Array(b).fill("🍝") }, { name: "Efterrätt", items: Array(c).fill("🍨") }]);
  }
  if (k === 2) {
    const wheels = rnd(2, 3), digits = pick([4, 5, 10]);
    const d = digits === 10 ? "0–9" : `1–${digits}`;
    return comboTask(`Ett kodlås har ${wheels} hjul med siffrorna ${d}. Hur många olika koder finns det?`,
      Array.from({ length: wheels }, (_, i) => ({ name: `Hjul ${i + 1}`, items: [`${digits} siffror`] })));
  }
  if (k === 3) return comboTask("Du singlar ett mynt och slår en tärning. Hur många olika utfall finns det?", [{ name: "Mynt", items: ["Kr", "Kl"] }, { name: "Tärning", items: ["1", "2", "3", "4", "5", "6"] }]);
  return comboTask("Du slår två tärningar, en röd och en blå. Hur många olika utfall finns det?", [{ name: "Röd", items: ["1", "2", "3", "4", "5", "6"] }, { name: "Blå", items: ["1", "2", "3", "4", "5", "6"] }]);
}
function comboTask(question: string, groups: { name: string; items: string[] }[]): Task {
  const counts = groups.map((g) => (g.items.length === 1 ? Number(g.items[0].split(" ")[0]) : g.items.length));
  const ans = counts.reduce((a, b) => a * b, 1);
  return {
    scene: { kind: "combo", groups }, question, format: "int", answer: ans,
    hint: "Multiplikationsprincipen: multiplicera antalet val i varje steg.",
    steps: ["Varje val i första steget kan kombineras med varje val i nästa.", `${counts.join(" · ")} = ${ans}`],
  };
}

// ---------- Nivåer ----------
export type Level = { id: string; world: number; title: string; gen: () => Task };
export const WORLD_NAMES = ["Lyckohjulet", "Urnan", "Kortleken", "Mynt & träddiagram"];
const WORLDS: { title: string; gen: () => Task }[][] = [
  [
    { title: "Lika stora fält", gen: () => wheelEqual("frac") }, { title: "Svara i procent", gen: () => wheelEqual("pct") },
    { title: "Olika stora fält", gen: wheelSizes }, { title: "Inte och eller", gen: wheelCombined },
    { title: "Hur många gånger?", gen: wheelExpected }, { title: "Vinklar", gen: wheelDegrees },
  ],
  [
    { title: "Dra en kula", gen: () => urnSimple("frac") }, { title: "Svara i procent", gen: () => urnSimple("pct") },
    { title: "INTE den färgen", gen: urnNot }, { title: "Den ena ELLER andra", gen: urnOr },
    { title: "Lägg i kulor", gen: urnAdd }, { title: "Utan återläggning", gen: urnNoReplace },
  ],
  [
    { title: "Färgerna", gen: deckSuits }, { title: "Valörerna", gen: deckRanks },
    { title: "Svara i procent", gen: deckPct }, { title: "Klädda kort", gen: deckFaces },
    { title: "Kombinera", gen: deckCombined }, { title: "Utan återläggning", gen: deckNoReplace },
  ],
  [
    { title: "Mynt och tärning", gen: coinOrDie }, { title: "Två mynt", gen: twoCoins },
    { title: "Minst och exakt", gen: atLeast }, { title: "Tre mynt", gen: threeCoins },
    { title: "Kulor i träd", gen: ballTree }, { title: "Kombinationer", gen: combos },
  ],
];
export const LEVELS: Level[] = WORLDS.flatMap((ls, w) => ls.map((l, i) => ({ id: `${w + 1}-${i + 1}`, world: w + 1, ...l })));
export const LEVELS_PER_WORLD = 6;
export const TASKS_PER_LEVEL = 5;
export const nextLevel = (id: string): Level | undefined => LEVELS[LEVELS.findIndex((l) => l.id === id) + 1];

/** Fem olika uppgifter (samma fråga och svar får inte komma två gånger). */
export function makeRound(level: Level, count = TASKS_PER_LEVEL): Task[] {
  const out: Task[] = []; const seen = new Set<string>();
  for (let tries = 0; out.length < count && tries < 200; tries++) {
    const t = level.gen(); const key = `${t.question}|${JSON.stringify(t.answer)}`;
    if (seen.has(key) && tries < 150) continue;
    seen.add(key); out.push(t);
  }
  return out;
}

// ---------- Stjärnor och upplåsning ----------
/** Rätt på första försöket av fem: 5 → 3 stjärnor, 4 → 2, 3 → 1, annars ingen (försök igen). */
export function starsFor(correct: number): number {
  if (correct >= 5) return 3;
  if (correct === 4) return 2;
  if (correct === 3) return 1;
  return 0;
}
export type ProgressMap = Record<string, { stars: number; best_correct: number }>;
/** Första nivån i varje värld är öppen; nästa nivå öppnas när den förra i samma värld är klarad. Läraren ser allt. */
export function isUnlocked(levelId: string, progress: ProgressMap, all = false): boolean {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  if (i < 0) return false;
  const l = LEVELS[i];
  return all || l.id.endsWith("-1") || !!progress[LEVELS[i - 1].id];
}
/** Sparas bara när resultatet blir bättre. */
export function mergeBest(prev: { stars: number; best_correct: number } | undefined, stars: number, correct: number) {
  if (stars < 1) return null;
  if (prev && prev.stars >= stars && prev.best_correct >= correct) return null;
  return { stars: Math.max(stars, prev?.stars ?? 0), best_correct: Math.max(correct, prev?.best_correct ?? 0) };
}
/** Samma regel som Kistan: spelmatrisen styr elever; lärare, vårdnadshavare och elever utan klass släpps in. */
export function sannolikhetAvailable(grade: number | null | undefined, isAdmin = false, rows: readonly VisibilityRow[] = []): boolean {
  if (isAdmin) return true;
  if (grade === null || grade === undefined || grade < 6 || grade > 9) return true;
  return isGameOpenForGrade(rows, "sannolikhet", grade);
}
