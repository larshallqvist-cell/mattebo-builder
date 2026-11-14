// Räta linjen (Åk 9): läs av m, k och y = kx + m, rita linjen och hitta parallella linjer.
// Steg och svit följer samma regler som Procent (advance/tierOf i procent.ts).
// Bärande bild: trappsteget – gå åt höger, räkna hur många steg linjen går upp (+) eller ner (−).
// k lagras exakt som bråket kp/kq (kq > 0, förkortat) så att t.ex. 2/3 aldrig avrundas.

export type LinjeMode = "m" | "k" | "ekv" | "rita" | "parallell";
export type LinjeError = "sign" | "swapped" | "inverted" | "xintercept" | "rise" | "same_m" | "other";
export type TaskKind = "read" | "draw" | "pair" | "through";
export type Point = { x: number; y: number };
export type Line = { kp: number; kq: number; k: number; m: number };
export type LinjeTier = { ks: readonly (readonly [number, number])[]; m: readonly [number, number]; dots: boolean; name: string };
export type LinjeTask = Line & {
  mode: LinjeMode; tier: number; kind: TaskKind;
  /** Parallella, välj par: fyra linjer där exakt två har samma k. */
  options?: Line[]; pair?: [number, number];
  /** Parallella, genom punkt: den givna linjen och punkten som den nya linjen ska gå genom. */
  base?: Line; point?: Point;
};
export type LinjeAnswer = { k?: number; m?: number; points?: Point[]; pick?: number[] };
export type LinjeCheck = { correct: boolean; error: LinjeError | null; message: string };

/** Rutnätet går från −6 till 6; linjen hålls inom ±5 så att trappsteget alltid syns. */
export const GRID_MAX = 6;
const VISIBLE = 5;

const I = (n: number) => [n, 1] as const;
/** Sex steg: positiv lutning → negativt m → negativ lutning → vågrätt (k = 0) → brantare → k som bråk. */
export const LINJE_TIERS: readonly LinjeTier[] = [
  { ks: [1, 2, 3].map(I), m: [1, 4], dots: true, name: "Positiv lutning" },
  { ks: [1, 2, 3].map(I), m: [-4, 4], dots: true, name: "m kan vara negativt" },
  { ks: [-1, -2, -3].map(I), m: [-3, 4], dots: true, name: "Negativ lutning" },
  { ks: [-3, -2, -1, 0, 1, 2, 3].map(I), m: [-4, 4], dots: false, name: "Uppåt, nedåt eller vågrätt" },
  { ks: [-4, -3, -2, -1, 1, 2, 3, 4].map(I), m: [-5, 5], dots: false, name: "Brantare linjer" },
  { ks: [[1, 2], [-1, 2], [1, 3], [-1, 3], [2, 3], [-2, 3], [3, 2], [-3, 2]], m: [-4, 4], dots: false, name: "k som bråk" },
];
export const MODE_LABEL: Record<LinjeMode, string> = { m: "Hitta m", k: "Hitta k", ekv: "Skriv ekvationen", rita: "Rita linjen", parallell: "Parallella" };
export const MODE_INTRO: Record<LinjeMode, string> = {
  m: "m är talet där linjen korsar y-axeln.",
  k: "k är hur mycket linjen lutar: gå åt höger – hur många steg upp eller ner?",
  ekv: "Skriv linjens ekvation y = kx + m.",
  rita: "Sätt ut två punkter som ligger på linjen.",
  parallell: "Parallella linjer har samma k men olika m.",
};

export const tierSpec = (tier: number) => LINJE_TIERS[Math.max(0, Math.min(LINJE_TIERS.length - 1, tier))];
export const hasFractions = (tier: number) => tierSpec(tier).ks.some(([, q]) => q > 1);
const randInt = (lo: number, hi: number, rnd: () => number) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = <T,>(xs: readonly T[], rnd: () => number) => xs[Math.floor(rnd() * xs.length)];
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** k = kp/kq, förkortat och med nämnaren positiv. */
export function makeLine(kp: number, kq: number, m: number): Line {
  if (kq < 0) { kp = -kp; kq = -kq; }
  const g = gcd(kp, kq) || 1;
  return { kp: kp / g, kq: kq / g, k: kp / kq, m };
}
const sameLine = (a: Line, b: Line) => a.kp === b.kp && a.kq === b.kq && a.m === b.m;

/** Startpunkten för trappsteget: skärningen med y-axeln, eller ett trappsteg till vänster om steget annars hamnar utanför. */
export function stepStart(l: Line): Point {
  return Math.abs(l.m + l.kp) <= VISIBLE ? { x: 0, y: l.m } : { x: -l.kq, y: l.m - l.kp };
}
const visible = (l: Line) => l.kq <= VISIBLE && (Math.abs(l.m + l.kp) <= VISIBLE || Math.abs(l.m - l.kp) <= VISIBLE);

function genLine(spec: LinjeTier, rnd: () => number, ks = spec.ks): Line {
  for (;;) {
    const [p, q] = pick(ks, rnd);
    const l = makeLine(p, q, randInt(spec.m[0], spec.m[1], rnd));
    if (visible(l)) return l;
  }
}

function genPair(spec: LinjeTier, tier: number, rnd: () => number): Pick<LinjeTask, "options" | "pair"> & Line {
  const ks = spec.ks.filter(([p]) => p !== 0);
  for (;;) {
    const [p0, q0] = pick(ks, rnd);
    const m1 = randInt(spec.m[0], spec.m[1], rnd), m2 = randInt(spec.m[0], spec.m[1], rnd);
    if (m1 === m2) continue;
    const k0 = p0 / q0;
    const others = ks.filter(([p, q]) => !near(p / q, k0));
    // Lockbete 1: samma lutning åt andra hållet (från steg 3). Lockbete 2: samma m som en av de parallella.
    const kB = tier >= 2 ? ([-p0, q0] as const) : pick(others, rnd);
    const restA = others.filter(([p, q]) => !near(p / q, kB[0] / kB[1]));
    if (!restA.length) continue;
    const kA = pick(restA, rnd);
    const lines = [makeLine(p0, q0, m1), makeLine(p0, q0, m2), makeLine(kA[0], kA[1], m1), makeLine(kB[0], kB[1], randInt(spec.m[0], spec.m[1], rnd))];
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const options = order.map((i) => lines[i]);
    return { ...lines[0], options, pair: [order.indexOf(0), order.indexOf(1)].sort() as [number, number] };
  }
}

function genThrough(spec: LinjeTier, tier: number, rnd: () => number): Pick<LinjeTask, "base" | "point"> & Line {
  for (;;) {
    const base = genLine(spec, rnd);
    const m1 = randInt(spec.m[0], spec.m[1], rnd);
    if (m1 === base.m) continue;
    let point: Point = { x: 0, y: m1 };
    if (tier >= 3) {
      const x = pick([-2, -1, 1, 2], rnd) * base.kq;
      const y = base.k * x + m1;
      if (Math.abs(x) > 4 || Math.abs(y) > VISIBLE || !Number.isInteger(y)) continue;
      point = { x, y };
    }
    return { ...makeLine(base.kp, base.kq, m1), base, point };
  }
}

const KIND: Record<Exclude<LinjeMode, "parallell">, TaskKind> = { m: "read", k: "read", ekv: "read", rita: "draw" };

/** Skapar en ny uppgift för steget. Samma linje kommer aldrig två gånger i rad; Parallella växlar mellan att välja par och gå genom en punkt. */
export function generateTask(mode: LinjeMode, tier: number, rnd: () => number = Math.random, prev?: LinjeTask): LinjeTask {
  const spec = tierSpec(tier);
  for (let tries = 0; ; tries++) {
    let t: LinjeTask;
    if (mode === "parallell") {
      const kind: TaskKind = prev?.kind === "pair" ? "through" : "pair";
      t = { mode, tier, kind, ...(kind === "pair" ? genPair(spec, tier, rnd) : genThrough(spec, tier, rnd)) };
    } else {
      t = { mode, tier, kind: KIND[mode], ...genLine(spec, rnd) };
    }
    if (prev && sameLine(prev, t) && tries < 30) continue;
    return t;
  }
}

/** Svensk skrivning med typografiskt minus. */
export const fmtNum = (n: number) => (n < 0 ? "−" : "") + String(Math.abs(n)).replace(".", ",");
export const fmtK = (l: Pick<Line, "kp" | "kq">) => (l.kq === 1 ? fmtNum(l.kp) : `${l.kp < 0 ? "−" : ""}${Math.abs(l.kp)}/${l.kq}`);
export const fmtPoint = (p: Point) => `(${fmtNum(p.x)}, ${fmtNum(p.y)})`;
/** y = 2x + 3, y = −x − 2, y = x, y = 3, y = −2x, y = (2/3)x + 1. */
export function fmtEq(l: Line): string {
  if (l.kp === 0) return `y = ${fmtNum(l.m)}`;
  const kx = l.kq !== 1 ? `(${fmtK(l)})x` : l.kp === 1 ? "x" : l.kp === -1 ? "−x" : `${fmtNum(l.kp)}x`;
  return l.m === 0 ? `y = ${kx}` : `y = ${kx} ${l.m < 0 ? "−" : "+"} ${fmtNum(Math.abs(l.m))}`;
}

const kSentence = (l: Line) => l.kp === 0
  ? "Linjen är vågrät: den går varken upp eller ner, så k = 0."
  : `${l.kq === 1 ? "1 steg" : `${l.kq} steg`} åt höger går linjen ${Math.abs(l.kp)} steg ${l.kp > 0 ? "uppåt" : "nedåt"}, så k = ${fmtK(l)}.`;
const mSentence = (m: number) => m === 0 ? "Linjen går genom origo, så m = 0." : `Linjen korsar y-axeln i ${fmtNum(m)}, så m = ${fmtNum(m)}.`;
const drawSentence = (l: Line) => `Börja i m = ${fmtNum(l.m)} på y-axeln. ` + (l.kp === 0
  ? "k = 0, så linjen går rakt åt sidan."
  : `Gå sedan ${l.kq} steg åt höger och ${Math.abs(l.kp)} steg ${l.kp > 0 ? "uppåt" : "nedåt"} – där ligger nästa punkt.`);

/** Förklaringen visar bara det som efterfrågades, och ekvationen när båda delarna behövs. */
export function explain(t: LinjeTask): string {
  if (t.kind === "draw") return drawSentence(t);
  if (t.kind === "pair") {
    const [a, b] = t.pair!.map((i) => t.options![i]);
    return `${fmtEq(a)} och ${fmtEq(b)} har samma k (${fmtK(a)}) – därför är de parallella.`;
  }
  if (t.kind === "through") {
    const p = t.point!;
    const mPart = p.x === 0 ? `Linjen ska gå genom ${fmtPoint(p)} på y-axeln, så m = ${fmtNum(t.m)}.`
      : `Sätt in punkten ${fmtPoint(p)} i y = kx + m: ${fmtNum(p.y)} = ${fmtK(t)} · ${fmtNum(p.x)} + m ger m = ${fmtNum(t.m)}.`;
    return `Parallell med ${fmtEq(t.base!)} betyder samma k = ${fmtK(t)}. ${mPart} Ekvationen är ${fmtEq(t)}.`;
  }
  if (t.mode === "m") return mSentence(t.m);
  if (t.mode === "k") return kSentence(t);
  return `${mSentence(t.m)} ${kSentence(t)} Ekvationen är ${fmtEq(t)}.`;
}

const FRACTION_TIP = " Träffar linjen inget rutnätshörn efter 1 steg? Gå fler steg åt höger tills den gör det. k = steg upp ÷ steg åt höger, t.ex. 2/3.";
export function tip(t: LinjeTask): string {
  const m = "Följ y-axeln (den lodräta) tills du träffar linjen – talet där är m.";
  const k = "Ställ dig på en punkt på linjen. Gå åt höger och räkna hur många steg du måste gå upp (+) eller ner (−) för att komma tillbaka till linjen – det är k.";
  const frac = hasFractions(t.tier) ? FRACTION_TIP : "";
  if (t.kind === "draw") return "Sätt första punkten på y-axeln där y = m. Använd sedan k: täljaren är steg upp (eller ner om k är negativt), nämnaren är steg åt höger. Ett heltal k betyder 1 steg åt höger.";
  if (t.kind === "pair") return "Titta bara på talet framför x – det är k. Två linjer med samma k lutar exakt lika mycket och möts aldrig.";
  if (t.kind === "through") return "Den nya linjen ska ha samma k som den givna. m får du genom att sätta in punktens x och y i y = kx + m.";
  if (t.mode === "m") return m;
  if (t.mode === "k") return k + (tierSpec(t.tier).ks.some(([p]) => p === 0) ? " En vågrät linje har k = 0." : "") + frac;
  return `${m} ${k}${frac} Skriv sedan y = kx + m.`;
}

const signK = (k: number) => k < 0 ? "Linjen går nedåt när du går åt höger – då är k negativt." : "Linjen går uppåt när du går åt höger – då är k positivt.";
const signM = (m: number) => m < 0 ? "Linjen korsar y-axeln under origo – då är m negativt." : "Linjen korsar y-axeln ovanför origo – då är m positivt.";
const INVERTED = "Du har räknat åt fel håll. k = steg upp eller ner ÷ steg åt höger.";
const isInverted = (l: Line, a: number) => l.kp !== 0 && !near(Math.abs(l.k), 1) && (near(a, 1 / l.k) || near(a, -1 / l.k));
const rise = (l: Line) => `Linjen går ${Math.abs(l.kp)} steg ${l.kp > 0 ? "uppåt" : "nedåt"} på ${l.kq} steg åt höger. Dela: k = ${fmtK(l)}.`;

function checkM(t: LinjeTask, ans: number): LinjeCheck {
  const { k, m } = t;
  if (near(ans, m)) return { correct: true, error: null, message: explain(t) };
  if (k !== 0 && near(ans, k)) return { correct: false, error: "swapped", message: "Det där är k, alltså lutningen. m är talet där linjen korsar y-axeln." };
  if (m !== 0 && near(ans, -m)) return { correct: false, error: "sign", message: signM(m) };
  if (k !== 0 && near(ans, -m / k)) return { correct: false, error: "xintercept", message: "Där korsar linjen x-axeln. m läser du av på y-axeln – den lodräta." };
  return { correct: false, error: "other", message: "Följ y-axeln, den lodräta, tills du når linjen." };
}

function checkK(t: LinjeTask, ans: number): LinjeCheck {
  const { k, m } = t;
  if (near(ans, k)) return { correct: true, error: null, message: explain(t) };
  if (k !== 0 && near(ans, -k)) return { correct: false, error: "sign", message: signK(k) };
  if (t.kq > 1 && near(Math.abs(ans), Math.abs(t.kp))) return { correct: false, error: "rise", message: rise(t) };
  if (isInverted(t, ans)) return { correct: false, error: "inverted", message: INVERTED };
  if (near(ans, m)) return { correct: false, error: "swapped", message: "Det där är m, där linjen korsar y-axeln. k är hur mycket linjen lutar." };
  if (k === 0) return { correct: false, error: "other", message: "Linjen är vågrät – den går varken upp eller ner. Då är k = 0." };
  return { correct: false, error: "other", message: "Gå åt höger från en punkt på linjen. Hur många steg upp eller ner kommer du tillbaka till linjen?" };
}

function checkKM(t: LinjeTask, a: { k: number; m: number }, okMsg: string): LinjeCheck {
  const { k, m } = t;
  const okK = near(a.k, k), okM = near(a.m, m);
  if (okK && okM) return { correct: true, error: null, message: okMsg };
  if (!near(k, m) && near(a.k, m) && near(a.m, k)) return { correct: false, error: "swapped", message: "Du har bytt plats på k och m. k står framför x, m är talet som står för sig självt." };
  if (okM && k !== 0 && near(a.k, -k)) return { correct: false, error: "sign", message: `m stämmer. ${signK(k)}` };
  if (okK && m !== 0 && near(a.m, -m)) return { correct: false, error: "sign", message: `k stämmer. ${signM(m)}` };
  if (okM && t.kq > 1 && near(Math.abs(a.k), Math.abs(t.kp))) return { correct: false, error: "rise", message: `m stämmer. ${rise(t)}` };
  if (okM && isInverted(t, a.k)) return { correct: false, error: "inverted", message: `m stämmer. ${INVERTED}` };
  return { correct: false, error: "other", message: okK ? "k stämmer – kolla m, där linjen korsar y-axeln." : okM ? "m stämmer – kolla k: gå åt höger, hur många steg upp eller ner?" : "Börja med m: var korsar linjen y-axeln? Sedan k: gå åt höger, hur många steg upp eller ner?" };
}

function checkThrough(t: LinjeTask, a: { k: number; m: number }): LinjeCheck {
  const base = t.base!, p = t.point!;
  const okK = near(a.k, t.k), okM = near(a.m, t.m);
  if (okK && okM) return { correct: true, error: null, message: explain(t) };
  if (okK && near(a.m, base.m)) return { correct: false, error: "same_m", message: "Det är samma linje som den givna! Parallella linjer har samma k men olika m." };
  if (!okK && t.k !== 0 && near(a.k, -t.k)) return { correct: false, error: "sign", message: "Parallella linjer har samma k – även tecknet. Annars lutar de åt olika håll." };
  if (!okK) return { correct: false, error: "other", message: `Parallella linjer har samma k som den givna linjen, alltså k = ${fmtK(t)}.` };
  if (p.x !== 0 && near(a.m, p.y)) return { correct: false, error: "other", message: "Punkten ligger inte på y-axeln, så m är inte punktens y. Sätt in punkten i y = kx + m och lös ut m." };
  return { correct: false, error: "other", message: "k stämmer – kolla m. Sätt in punktens x och y i y = kx + m." };
}

function checkPair(t: LinjeTask, pick: number[]): LinjeCheck {
  const [a, b] = pick.map((i) => t.options![i]);
  if (!a || !b || pick[0] === pick[1]) return { correct: false, error: "other", message: "Välj två linjer." };
  if (near(a.k, b.k)) return { correct: true, error: null, message: explain(t) };
  if (a.m === b.m) return { correct: false, error: "same_m", message: "De två har samma m – de korsar y-axeln på samma ställe och skär alltså varandra. Parallella linjer har samma k." };
  if (near(a.k, -b.k)) return { correct: false, error: "sign", message: "De lutar lika mycket men åt olika håll, en uppåt och en nedåt. Parallella linjer har exakt samma k, även tecknet." };
  return { correct: false, error: "other", message: "Parallella linjer har samma k – titta på talet framför x." };
}

/** Linjen genom två klickade punkter, eller null om de är samma punkt eller ligger lodrätt över varandra. */
export function lineThrough(a: Point, b: Point): Line | null {
  if (a.x === b.x) return null;
  const kp = b.y - a.y, kq = b.x - a.x;
  return makeLine(kp, kq, a.y - (kp / kq) * a.x);
}

function checkDraw(t: LinjeTask, pts: Point[]): LinjeCheck {
  const [a, b] = pts;
  const l = a && b ? lineThrough(a, b) : null;
  if (!l) return { correct: false, error: "other", message: a && b && a.x === b.x && a.y !== b.y ? "Punkterna ligger rakt ovanför varandra – då blir linjen lodrät. Gå åt höger till nästa punkt." : "Sätt ut två olika punkter." };
  const okK = near(l.k, t.k), okM = near(l.m, t.m);
  if (okK && okM) return { correct: true, error: null, message: explain(t) };
  if (!near(t.k, t.m) && near(l.k, t.m) && near(l.m, t.k)) return { correct: false, error: "swapped", message: "Du har bytt plats på k och m. m är där linjen korsar y-axeln, k är lutningen." };
  if (!okM && t.m !== 0 && pts.some((p) => p.y === 0 && p.x === t.m)) return { correct: false, error: "xintercept", message: "Du satte m på x-axeln. m sätts ut på y-axeln – den lodräta." };
  if (okM && t.k !== 0 && near(l.k, -t.k)) return { correct: false, error: "sign", message: t.k < 0 ? "k är negativt, så linjen ska gå nedåt när du går åt höger." : "k är positivt, så linjen ska gå uppåt när du går åt höger." };
  if (okK && t.m !== 0 && near(l.m, -t.m)) return { correct: false, error: "sign", message: `Lutningen stämmer. ${t.m < 0 ? "m är negativt – linjen ska korsa y-axeln under origo." : "m är positivt – linjen ska korsa y-axeln ovanför origo."}` };
  if (okM && t.kq > 1 && near(Math.abs(l.k), Math.abs(t.kp))) return { correct: false, error: "rise", message: `m stämmer. k = ${fmtK(t)} betyder ${Math.abs(t.kp)} steg ${t.kp > 0 ? "upp" : "ner"} på ${t.kq} steg åt höger.` };
  if (okM && isInverted(t, l.k)) return { correct: false, error: "inverted", message: "m stämmer. Du har gått åt fel håll: steg upp eller ner står i täljaren, steg åt höger i nämnaren." };
  return { correct: false, error: "other", message: okK ? "Lutningen stämmer – kolla var linjen korsar y-axeln (m)." : okM ? "m stämmer – kolla lutningen k." : "Börja i m på y-axeln och använd sedan k för att hitta nästa punkt." };
}

/** Rättar ett svar och känner igen de vanligaste felen: k och m förväxlade, fel tecken, steget räknat åt fel håll, glömt att dela, samma m i stället för samma k. */
export function checkAnswer(t: LinjeTask, a: LinjeAnswer): LinjeCheck {
  if (t.kind === "draw") return checkDraw(t, a.points ?? []);
  if (t.kind === "pair") return checkPair(t, a.pick ?? []);
  const km = { k: a.k ?? NaN, m: a.m ?? NaN };
  if (t.kind === "through") return checkThrough(t, km);
  if (t.mode === "m") return checkM(t, a.m ?? NaN);
  if (t.mode === "k") return checkK(t, a.k ?? NaN);
  return checkKM(t, km, explain(t));
}

/** Läser ett tal: heltal, decimal (komma eller punkt) eller bråk som 2/3, med olika minustecken. */
export function parseNum(raw: string): number | null {
  const s = raw.trim().replace(/[\s\u00a0\u202f]/g, "").replace(/[−–—]/g, "-").replace(",", ".");
  const f = /^([-+]?)(\d+)\/(\d+)$/.exec(s);
  if (f) { const d = Number(f[3]); return d === 0 ? null : (f[1] === "-" ? -1 : 1) * Number(f[2]) / d; }
  return /^[-+]?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

/** Klick i rutnätet hamnar på närmaste rutnätshörn. */
export const snapGrid = (p: Point): Point => {
  const s = (v: number) => Math.max(-GRID_MAX, Math.min(GRID_MAX, Math.round(v))) || 0;
  return { x: s(p.x), y: s(p.y) };
};
