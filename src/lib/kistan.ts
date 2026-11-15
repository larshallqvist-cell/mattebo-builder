import { isGameOpenForGrade, type VisibilityRow } from "./gameVisibility";
/** Kistan – "Gör kistan ensam": samma sak på båda sidor tills kistan (x) står ensam; i värld 3–4 även dela hela sidan. Rena regler, testade i tests/kistan.test.ts. */
export type Side = "left" | "right";
/** En bricka. Kistan (x) kan ha koefficient coef/den, en parentes (GROUP) har coef framför och inner-termer. */
export type Term = { id: string; kind: string; neg: boolean; coef?: number; den?: number; inner?: Term[] };
export type OpKind = "div" | "mul";
/** Hela sidan delas med eller multipliceras med n (n får vara negativt). */
export type Op = { op: OpKind; n: number };
export type Pending = { kind: string; neg: boolean; side: Side; op?: OpKind } | null;
export type GameState = { left: Term[]; right: Term[]; pending: Pending; moves: number; wrap?: Partial<Record<Side, Op>> };
export type Result = { ok: true; state: GameState } | { ok: false; reason: string };

let counter = 0;
export const makeTerm = (kind: string, neg = false, extra: Partial<Term> = {}): Term => ({ id: `t${++counter}`, kind, neg, ...extra });

export const BOX = "box";
export const GROUP = "group";
const other = (s: Side): Side => (s === "left" ? "right" : "left");
const numeric = (t: Term) => /^\d+$/.test(t.kind);
const holdsBox = (t: Term) => t.kind === BOX || t.kind === GROUP;
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
/** Samma sorts bricka (samma koefficient), oavsett tecken. Parenteser räknas aldrig som lika. */
const sameTile = (a: Term, b: Term) => a.kind === b.kind && a.kind !== GROUP && (a.coef ?? 1) === (b.coef ?? 1) && (a.den ?? 1) === (b.den ?? 1);
export const wrapOf = (s: GameState, side: Side): Op | undefined => s.wrap?.[side];
const WRAP_FIRST = "Räkna ut divisionen först – tryck på den.";
const SAME_OTHER = "Gör samma sak på andra sidan först!";

/** Läser en term: "3x", "x/3", "2(x+3)", "5", "fish" eller "x"/"box" för kistan. */
function parseTerm(tok: string, neg: boolean): Term {
  const g = tok.match(/^(\d*)\((.*)\)$/);
  if (g) return makeTerm(GROUP, neg, { coef: g[1] ? Number(g[1]) : 1, inner: parseSide(g[2]) });
  const x = tok.match(/^(\d*)x(?:\/(\d+))?$/);
  if (x) return makeTerm(BOX, neg, { coef: x[1] ? Number(x[1]) : 1, den: x[2] ? Number(x[2]) : 1 });
  return makeTerm(tok, neg);
}

/** Delar en sida på + och − utanför parenteser. */
function parseSide(str: string): Term[] {
  const s = str.replace(/\s/g, "");
  const terms: Term[] = [];
  let i = 0;
  while (i < s.length) {
    let neg = false;
    if (s[i] === "+" || s[i] === "-") { neg = s[i] === "-"; i++; }
    let j = i;
    let depth = 0;
    while (j < s.length && !(depth === 0 && j > i && (s[j] === "+" || s[j] === "-"))) {
      if (s[j] === "(") depth++;
      if (s[j] === ")") depth--;
      j++;
    }
    if (j > i) terms.push(parseTerm(s.slice(i, j), neg));
    i = j;
  }
  return terms;
}

/** "box+fish+3=5-fish" eller "3(x+2)+4=25" blir ett spelläge; "x" betyder kistan. */
export function parseEquation(eq: string): GameState {
  const [l = "", r = ""] = eq.split("=");
  return { left: parseSide(l), right: parseSide(r), pending: null, moves: 0 };
}

/** Lägg en bricka på en sida. Samma bricka måste sedan läggas på andra sidan innan något annat. */
export function placeTile(s: GameState, kind: string, neg: boolean, side: Side): Result {
  if (kind === BOX || kind === GROUP) return { ok: false, reason: "Kistan kan du inte lägga till." };
  if (s.pending?.op) return { ok: false, reason: SAME_OTHER };
  if (wrapOf(s, side)) return { ok: false, reason: WRAP_FIRST };
  const term = makeTerm(kind, neg);
  if (!s.pending) {
    return { ok: true, state: { ...s, [side]: [...s[side], term], pending: { kind, neg, side: other(side) } } };
  }
  if (s.pending.side !== side) return { ok: false, reason: "Lägg samma bricka på andra sidan först!" };
  if (s.pending.kind !== kind || s.pending.neg !== neg) return { ok: false, reason: "Det måste vara samma bricka på båda sidor!" };
  return { ok: true, state: { ...s, [side]: [...s[side], term], pending: null, moves: s.moves + 1 } };
}

/** Dela (eller multiplicera) hela sidan med n. Samma sak måste sedan göras med andra sidan. */
export function placeOp(s: GameState, op: OpKind, n: number, side: Side): Result {
  if (!Number.isInteger(n) || n === 0) return { ok: false, reason: "Man kan inte dela med noll." };
  if (wrapOf(s, side)) return { ok: false, reason: WRAP_FIRST };
  const kind = String(Math.abs(n));
  const neg = n < 0;
  const wrap = { ...s.wrap, [side]: { op, n } };
  if (!s.pending) return { ok: true, state: { ...s, wrap, pending: { kind, neg, side: other(side), op } } };
  if (!s.pending.op) return { ok: false, reason: "Lägg samma bricka på andra sidan först!" };
  if (s.pending.side !== side) return { ok: false, reason: SAME_OTHER };
  if (s.pending.op !== op || s.pending.kind !== kind || s.pending.neg !== neg) {
    return { ok: false, reason: "Du måste dela båda sidor med samma tal!" };
  }
  return { ok: true, state: { ...s, wrap, pending: null, moves: s.moves + 1 } };
}

/** Räknar ut divisionen/multiplikationen på en sida, term för term. Talen måste gå jämnt ut. */
export function applyWrap(s: GameState, side: Side): Result {
  if (s.pending) return { ok: false, reason: SAME_OTHER };
  const w = wrapOf(s, side);
  if (!w) return { ok: false, reason: "Den sidan är inte delad." };
  const out: Term[] = [];
  for (const t of s[side]) {
    const sign = t.neg ? -1 : 1;
    if (numeric(t)) {
      const v = Number(t.kind) * sign;
      if (w.op === "div" && v % w.n !== 0) return { ok: false, reason: `${Math.abs(v)} går inte att dela jämnt med ${Math.abs(w.n)}.` };
      const r = w.op === "div" ? v / w.n : v * w.n;
      if (r !== 0) out.push(makeTerm(String(Math.abs(r)), r < 0));
    } else if (t.kind === BOX) {
      let c = (t.coef ?? 1) * sign;
      let d = t.den ?? 1;
      if (w.op === "div") { d *= Math.abs(w.n); c *= Math.sign(w.n); } else c *= w.n;
      const g = gcd(c, d);
      c /= g; d /= g;
      out.push({ ...t, neg: c < 0, coef: Math.abs(c), den: d });
    } else if (t.kind === GROUP) {
      const k = (t.coef ?? 1) * sign;
      if (w.op === "div" && k % w.n !== 0) return { ok: false, reason: `${Math.abs(k)} går inte att dela jämnt med ${Math.abs(w.n)}.` };
      const r = w.op === "div" ? k / w.n : k * w.n;
      if (r === 1) out.push(...(t.inner ?? []));
      else out.push({ ...t, neg: r < 0, coef: Math.abs(r) });
    } else {
      return { ok: false, reason: "Den här brickan går inte att dela." };
    }
  }
  const wrap = { ...s.wrap };
  delete wrap[side];
  return { ok: true, state: { ...s, [side]: out, wrap, moves: s.moves + 1 } };
}

/** En bricka och dess motsats tar ut varandra. */
export function cancelPair(s: GameState, side: Side, idA: string, idB: string): Result {
  if (s.pending) return { ok: false, reason: "Lägg samma bricka på andra sidan först!" };
  if (wrapOf(s, side)) return { ok: false, reason: WRAP_FIRST };
  const a = s[side].find((t) => t.id === idA);
  const b = s[side].find((t) => t.id === idB);
  if (!a || !b || a.id === b.id) return { ok: false, reason: "Välj två brickor på samma sida." };
  if (!sameTile(a, b) || a.neg === b.neg) return { ok: false, reason: "Bara en bricka och dess motsats kan ta ut varandra." };
  return { ok: true, state: { ...s, [side]: s[side].filter((t) => t.id !== idA && t.id !== idB), moves: s.moves + 1 } };
}

/** Motsatser tas bort; två tal slås ihop till ett (summan noll försvinner). */
export function simplifyPair(s: GameState, side: Side, idA: string, idB: string): Result {
  const cancelled = cancelPair(s, side, idA, idB);
  if (cancelled.ok || s.pending || wrapOf(s, side)) return cancelled;
  const a = s[side].find((t) => t.id === idA);
  const b = s[side].find((t) => t.id === idB);
  if (!a || !b || a.id === b.id || !numeric(a) || !numeric(b)) return cancelled;
  const value = Number(a.kind) * (a.neg ? -1 : 1) + Number(b.kind) * (b.neg ? -1 : 1);
  const terms = s[side].filter((t) => t.id !== idA && t.id !== idB);
  if (value !== 0) terms.push(makeTerm(String(Math.abs(value)), value < 0));
  return { ok: true, state: { ...s, [side]: terms, moves: s.moves + 1 } };
}

export function isSimplified(terms: Term[]): boolean {
  return terms.filter(numeric).length <= 1 && !terms.some((a) => terms.some((b) => sameTile(a, b) && a.neg !== b.neg));
}

/** Klart när kistan (positiv, utan koefficient) står ensam och båda sidor är färdigförenklade. */
export function isSolved(s: GameState): boolean {
  if (s.pending || wrapOf(s, "left") || wrapOf(s, "right")) return false;
  const alone = (ts: Term[]) => ts.length === 1 && ts[0]?.kind === BOX && !ts[0]?.neg && (ts[0].coef ?? 1) === 1 && (ts[0].den ?? 1) === 1;
  const hasBox = (ts: Term[]) => ts.some(holdsBox);
  return ((alone(s.left) && !hasBox(s.right)) || (alone(s.right) && !hasBox(s.left))) && isSimplified(s.left) && isSimplified(s.right);
}

/** En kort lösning i moment: förenkla, flytta bort det som står bredvid, dela bort koefficienten, upprepa. */
export function solve(start: GameState): GameState {
  const side: Side = start.left.some(holdsBox) ? "left" : "right";
  let state: GameState = { ...start, pending: null, moves: 0, wrap: {} };
  const step = (r: Result) => { if (r.ok) state = r.state; return r.ok; };
  const reduce = (target: Side) => {
    for (;;) {
      const terms = state[target];
      const a = terms.find((t) => terms.some((u) => sameTile(t, u) && t.neg !== u.neg));
      const b = a && terms.find((t) => sameTile(t, a) && t.neg !== a.neg);
      const nums = terms.filter(numeric);
      const first = a ?? nums[0];
      const second = b ?? nums[1];
      if (!first || !second || !step(simplifyPair(state, target, first.id, second.id))) break;
    }
  };
  for (let guard = 0; guard < 12; guard++) {
    reduce(side);
    for (const term of state[side].filter((t) => !holdsBox(t))) {
      const a = placeTile(state, term.kind, !term.neg, side);
      if (!a.ok) continue;
      const b = placeTile(a.state, term.kind, !term.neg, other(side));
      if (!b.ok) continue;
      const opposite = b.state[side].find((t) => sameTile(t, term) && t.neg !== term.neg);
      if (!opposite) continue;
      const c = cancelPair(b.state, side, term.id, opposite.id);
      if (c.ok) state = c.state;
    }
    reduce(other(side));
    const main = state[side].length === 1 ? state[side][0] : undefined;
    if (!main) break;
    const k = (main.coef ?? 1) * (main.neg ? -1 : 1);
    let op: Op | null = null;
    if (main.kind === BOX && (main.den ?? 1) > 1) op = { op: "mul", n: main.den ?? 1 };
    else if (k !== 1) op = { op: "div", n: k };
    if (!op) break;
    const ok = step(placeOp(state, op.op, op.n, side)) && step(placeOp(state, op.op, op.n, other(side)))
      && step(applyWrap(state, side)) && step(applyWrap(state, other(side)));
    if (!ok) break;
  }
  return state;
}

export const minMoves = (s: GameState) => solve(s).moves;

/** 3 stjärnor på bästa antal drag, 2 inom två extra drag, annars 1. */
export function stars(moves: number, min: number): number {
  if (moves <= min) return 3;
  if (moves <= min + 2) return 2;
  return 1;
}

/** Brickor att välja: alla sorter på planen (utom kistan och parenteser) i plus- och minusform. */
export function trayTiles(s: GameState): { kind: string; neg: boolean }[] {
  const kinds = Array.from(new Set([...s.left, ...s.right].filter((t) => !holdsBox(t)).map((t) => t.kind)));
  return kinds.flatMap((kind) => [{ kind, neg: false }, { kind, neg: true }]);
}

/** Räkneverktyg: ÷ med varje koefficient som syns (både plus och minus), · med varje nämnare. */
export function opTiles(s: GameState): Op[] {
  const ops: Op[] = [];
  const add = (o: Op) => { if (!ops.some((p) => p.op === o.op && p.n === o.n)) ops.push(o); };
  for (const t of [...s.left, ...s.right]) {
    if (!holdsBox(t)) continue;
    if ((t.den ?? 1) > 1) add({ op: "mul", n: t.den ?? 1 });
    const c = t.coef ?? 1;
    if (c > 1 || t.neg) { add({ op: "div", n: c }); add({ op: "div", n: -c }); }
  }
  return ops.sort((a, b) => (a.op === b.op ? Math.abs(a.n) - Math.abs(b.n) || b.n - a.n : a.op === "mul" ? 1 : -1));
}

export type Level = { id: string; world: number; eq: string };
const WORLDS: string[][] = [
  // Värld 1: bilder
  ["box+fish=bfly", "fish+box=bfly", "box+bfly=fish+fish", "box+fish+bfly=fish", "bfly=box+fish", "box-fish=bfly", "fish+bfly+box=bfly+bfly", "-fish+box=bfly", "bfly+box-bfly=fish", "fish=bfly+box+fish"],
  // Värld 2: bilder och siffror, fler termer och minus på båda sidor
  ["box+2=fish", "box+2+3=fish+6", "8=box+3-fish", "box-4+fish=bfly-2", "fish+box+1=7+fish", "6-bfly=box+fish-3", "box+5-fish=4+bfly-1", "-3+box+bfly=2-fish+7", "5+box+fish=fish+9-bfly+2", "bfly-2+box-fish+6=3+fish-bfly"],
  // Värld 3: koefficienter och division, två moment
  ["2x=10", "x/3=4", "3x+2=14", "5x-3=22", "4+2x=18", "x/2+3=8", "-2x=14", "7=2x-5", "-3x+4=19", "3x+4-6=13"],
  // Värld 4: parenteser, tre moment eller fler
  ["2(x+3)=14", "3(x-2)=12", "3(x+2)+4=25", "2(x-1)-3=9", "5+4(x+1)=29", "-2(x+3)=-10", "30=5(x-2)+10", "3(x+4)-7=2", "-4(x-5)+3=11", "2(3x-1)+4=26"],
];
export const LEVELS: Level[] = WORLDS.flatMap((eqs, w) => eqs.map((eq, i) => ({ id: `${w + 1}-${i + 1}`, world: w + 1, eq })));
export const WORLD_NAMES = ["Djungeln", "Floden", "Bergen", "Toppen"];
export const nextLevel = (id: string): Level | undefined => LEVELS[LEVELS.findIndex((l) => l.id === id) + 1];

export type ProgressMap = Record<string, { stars: number; best_moves: number }>;

/** Första nivån är öppen; varje nästa öppnas när den förra är klarad. Läraren ser allt. */
export function isUnlocked(levelId: string, progress: ProgressMap, all = false): boolean {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  if (i < 0) return false;
  return all || i === 0 || !!progress[LEVELS[i - 1].id];
}

/** Sparas bara när resultatet blir bättre: flest stjärnor och färst drag behålls var för sig. */
export function mergeBest(prev: { stars: number; best_moves: number } | undefined, stars: number, moves: number) {
  if (prev && prev.stars >= stars && prev.best_moves <= moves) return null;
  return { stars: Math.max(stars, prev?.stars ?? 0), best_moves: prev ? Math.min(moves, prev.best_moves) : moves };
}

/** Elever ser Kistan bara när läraren har spelet påslaget i minst ett kapitel för deras klass
 *  (från början Åk 6 och 7, se src/lib/gameVisibility.ts). Lärare, vårdnadshavare (0) och
 *  elever utan registrerad klass (null) släpps igenom. */
export function kistanAvailable(grade: number | null | undefined, isAdmin = false, rows: readonly VisibilityRow[] = []): boolean {
  if (isAdmin) return true;
  if (grade === null || grade === undefined || grade < 6 || grade > 9) return true;
  return isGameOpenForGrade(rows, "kistan", grade);
}
