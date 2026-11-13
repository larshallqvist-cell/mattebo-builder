/** Kistan – "Gör kistan ensam": samma sak på båda sidor tills kistan (x) står ensam. Rena regler, testade i tests/kistan.test.ts. */
export type Side = "left" | "right";
export type Term = { id: string; kind: string; neg: boolean };
export type Pending = { kind: string; neg: boolean; side: Side } | null;
export type GameState = { left: Term[]; right: Term[]; pending: Pending; moves: number };
export type Result = { ok: true; state: GameState } | { ok: false; reason: string };

let counter = 0;
export const makeTerm = (kind: string, neg = false): Term => ({ id: `t${++counter}`, kind, neg });

export const BOX = "box";
const other = (s: Side): Side => (s === "left" ? "right" : "left");
const numeric = (t: Term) => /^\d+$/.test(t.kind);

/** "box+fish+3=5-fish" blir ett spelläge; "x" betyder kistan. */
export function parseEquation(eq: string): GameState {
  const [l = "", r = ""] = eq.split("=");
  const side = (str: string): Term[] =>
    (str.match(/[+-]?[^+-]+/g) ?? []).map((tok) => {
      const neg = tok.startsWith("-");
      const kind = tok.replace(/^[+-]/, "").trim();
      return makeTerm(kind === "x" ? BOX : kind, neg);
    });
  return { left: side(l), right: side(r), pending: null, moves: 0 };
}

/** Lägg en bricka på en sida. Samma bricka måste sedan läggas på andra sidan innan något annat. */
export function placeTile(s: GameState, kind: string, neg: boolean, side: Side): Result {
  if (kind === BOX) return { ok: false, reason: "Kistan kan du inte lägga till." };
  const term = makeTerm(kind, neg);
  if (!s.pending) {
    return { ok: true, state: { ...s, [side]: [...s[side], term], pending: { kind, neg, side: other(side) } } };
  }
  if (s.pending.side !== side) return { ok: false, reason: "Lägg samma bricka på andra sidan först!" };
  if (s.pending.kind !== kind || s.pending.neg !== neg) return { ok: false, reason: "Det måste vara samma bricka på båda sidor!" };
  return { ok: true, state: { ...s, [side]: [...s[side], term], pending: null, moves: s.moves + 1 } };
}

/** En bricka och dess motsats tar ut varandra. */
export function cancelPair(s: GameState, side: Side, idA: string, idB: string): Result {
  if (s.pending) return { ok: false, reason: "Lägg samma bricka på andra sidan först!" };
  const a = s[side].find((t) => t.id === idA);
  const b = s[side].find((t) => t.id === idB);
  if (!a || !b || a.id === b.id) return { ok: false, reason: "Välj två brickor på samma sida." };
  if (a.kind !== b.kind || a.neg === b.neg) return { ok: false, reason: "Bara en bricka och dess motsats kan ta ut varandra." };
  return { ok: true, state: { ...s, [side]: s[side].filter((t) => t.id !== idA && t.id !== idB), moves: s.moves + 1 } };
}

/** Motsatser tas bort; två tal slås ihop till ett (summan noll försvinner). */
export function simplifyPair(s: GameState, side: Side, idA: string, idB: string): Result {
  const cancelled = cancelPair(s, side, idA, idB);
  if (cancelled.ok || s.pending) return cancelled;
  const a = s[side].find((t) => t.id === idA);
  const b = s[side].find((t) => t.id === idB);
  if (!a || !b || a.id === b.id || !numeric(a) || !numeric(b)) return cancelled;
  const value = Number(a.kind) * (a.neg ? -1 : 1) + Number(b.kind) * (b.neg ? -1 : 1);
  const terms = s[side].filter((t) => t.id !== idA && t.id !== idB);
  if (value !== 0) terms.push(makeTerm(String(Math.abs(value)), value < 0));
  return { ok: true, state: { ...s, [side]: terms, moves: s.moves + 1 } };
}

export function isSimplified(terms: Term[]): boolean {
  return terms.filter(numeric).length <= 1 && !terms.some((a) => terms.some((b) => a.kind === b.kind && a.neg !== b.neg));
}

/** Klart när kistan (positiv) står ensam och båda sidor är färdigförenklade. */
export function isSolved(s: GameState): boolean {
  if (s.pending) return false;
  const alone = (ts: Term[]) => ts.length === 1 && ts[0]?.kind === BOX && !ts[0]?.neg;
  const hasBox = (ts: Term[]) => ts.some((t) => t.kind === BOX);
  return ((alone(s.left) && !hasBox(s.right)) || (alone(s.right) && !hasBox(s.left))) && isSimplified(s.left) && isSimplified(s.right);
}

/** En kortaste lösning: förenkla kistans sida, flytta bort varje bricka, förenkla andra sidan. */
export function solve(start: GameState): GameState {
  const side: Side = start.left.some((t) => t.kind === BOX) ? "left" : "right";
  let state: GameState = { ...start, pending: null, moves: 0 };
  const reduce = (target: Side) => {
    for (;;) {
      const terms = state[target];
      const a = terms.find((t) => terms.some((u) => t.kind === u.kind && t.neg !== u.neg));
      const b = a && terms.find((t) => t.kind === a.kind && t.neg !== a.neg);
      const nums = terms.filter(numeric);
      const first = a ?? nums[0];
      const second = b ?? nums[1];
      if (!first || !second) break;
      const r = simplifyPair(state, target, first.id, second.id);
      if (!r.ok) break;
      state = r.state;
    }
  };
  reduce(side);
  for (const term of state[side].filter((t) => t.kind !== BOX)) {
    const a = placeTile(state, term.kind, !term.neg, side);
    if (!a.ok) continue;
    const b = placeTile(a.state, term.kind, !term.neg, other(side));
    if (!b.ok) continue;
    const opposite = b.state[side].find((t) => t.kind === term.kind && t.neg !== term.neg);
    if (!opposite) continue;
    const c = cancelPair(b.state, side, term.id, opposite.id);
    if (c.ok) state = c.state;
  }
  reduce(other(side));
  return state;
}

export const minMoves = (s: GameState) => solve(s).moves;

/** 3 stjärnor på bästa antal drag, 2 inom två extra drag, annars 1. */
export function stars(moves: number, min: number): number {
  if (moves <= min) return 3;
  if (moves <= min + 2) return 2;
  return 1;
}

/** Brickor att välja: alla sorter på planen (utom kistan) i plus- och minusform. */
export function trayTiles(s: GameState): { kind: string; neg: boolean }[] {
  const kinds = Array.from(new Set([...s.left, ...s.right].map((t) => t.kind))).filter((k) => k !== BOX);
  return kinds.flatMap((kind) => [{ kind, neg: false }, { kind, neg: true }]);
}

export type Level = { id: string; world: number; eq: string };
const WORLDS: string[][] = [
  // Värld 1: bilder
  ["box+fish=bfly", "fish+box=bfly", "box+bfly=fish+fish", "box+fish+bfly=fish", "bfly=box+fish", "box-fish=bfly", "fish+bfly+box=bfly+bfly", "-fish+box=bfly", "bfly+box-bfly=fish", "fish=bfly+box+fish"],
  // Värld 2: bilder och siffror
  ["box+2=fish", "box+2+3=fish+6", "3+box=5", "box-4=bfly", "fish+box+1=7", "6=box+fish", "box+2-fish=4", "-3+box+bfly=2", "5+box+fish=fish+9", "box-2-fish+bfly=3"],
  // Värld 3: bokstäver
  ["x+3=e", "x+a=b", "x-5=a", "4+x=b+7", "a+x+2=e", "x-a-3=b", "c=x+a", "2+x-b=a+6", "x+a+b+c=e", "-a+x-4+b=c+1"],
];
export const LEVELS: Level[] = WORLDS.flatMap((eqs, w) => eqs.map((eq, i) => ({ id: `${w + 1}-${i + 1}`, world: w + 1, eq })));
export const WORLD_NAMES = ["Djungeln", "Floden", "Bergen"];
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
