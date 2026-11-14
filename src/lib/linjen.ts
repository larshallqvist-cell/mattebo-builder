// Räta linjen (Åk 9): läs av m, k och ekvationen y = kx + m ur en graf.
// Steg och svit följer samma regler som Procent (advance/tierOf i procent.ts).
// Bärande bild: trappsteget – gå 1 steg åt höger, räkna hur många steg linjen går upp (+) eller ner (−).

export type LinjeMode = "m" | "k" | "ekv";
export type LinjeError = "sign" | "swapped" | "inverted" | "xintercept" | "other";
export type LinjeTier = { ks: readonly number[]; m: readonly [number, number]; dots: boolean; name: string };
export type LinjeTask = { mode: LinjeMode; k: number; m: number; tier: number };
export type LinjeAnswer = { k?: number; m?: number };
export type LinjeCheck = { correct: boolean; error: LinjeError | null; message: string };

/** Rutnätet går från −6 till 6; linjen hålls inom ±5 så att trappsteget alltid syns. */
export const GRID_MAX = 6;
const VISIBLE = 5;

/** Sex steg: positiv lutning → negativt m → negativ lutning → vågrätt (k = 0) → brantare → allt blandat. */
export const LINJE_TIERS: readonly LinjeTier[] = [
  { ks: [1, 2, 3], m: [1, 4], dots: true, name: "Positiv lutning" },
  { ks: [1, 2, 3], m: [-4, 4], dots: true, name: "m kan vara negativt" },
  { ks: [-1, -2, -3], m: [-3, 4], dots: true, name: "Negativ lutning" },
  { ks: [-3, -2, -1, 0, 1, 2, 3], m: [-4, 4], dots: false, name: "Uppåt, nedåt eller vågrätt" },
  { ks: [-4, -3, -2, -1, 1, 2, 3, 4], m: [-5, 5], dots: false, name: "Brantare linjer" },
  { ks: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], m: [-5, 5], dots: false, name: "Allt blandat" },
];
export const MODE_LABEL: Record<LinjeMode, string> = { m: "Hitta m", k: "Hitta k", ekv: "Skriv ekvationen" };
export const MODE_INTRO: Record<LinjeMode, string> = {
  m: "m är talet där linjen korsar y-axeln.",
  k: "k är hur mycket linjen lutar: 1 steg åt höger – hur många upp eller ner?",
  ekv: "Skriv linjens ekvation y = kx + m.",
};

export const tierSpec = (tier: number) => LINJE_TIERS[Math.max(0, Math.min(LINJE_TIERS.length - 1, tier))];
const randInt = (lo: number, hi: number, rnd: () => number) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Startpunkten för trappsteget: skärningen med y-axeln, eller ett steg till vänster om steget annars hamnar utanför. */
export function stepStart(k: number, m: number): { x: number; y: number } {
  return Math.abs(m + k) <= VISIBLE ? { x: 0, y: m } : { x: -1, y: m - k };
}

/** Skapar en ny linje för steget. Samma linje kommer aldrig två gånger i rad. */
export function generateTask(mode: LinjeMode, tier: number, rnd: () => number = Math.random, prev?: LinjeTask): LinjeTask {
  const spec = tierSpec(tier);
  for (let tries = 0; ; tries++) {
    const k = spec.ks[Math.floor(rnd() * spec.ks.length)];
    const m = randInt(spec.m[0], spec.m[1], rnd);
    if (Math.abs(m + k) > VISIBLE && Math.abs(m - k) > VISIBLE) continue;
    if (prev && prev.k === k && prev.m === m && tries < 30) continue;
    return { mode, k, m, tier };
  }
}

/** Svensk skrivning med typografiskt minus. */
export const fmtNum = (n: number) => (n < 0 ? "−" : "") + String(Math.abs(n)).replace(".", ",");
/** y = 2x + 3, y = −x − 2, y = x, y = 3, y = −2x. */
export function fmtEq(k: number, m: number): string {
  if (k === 0) return `y = ${fmtNum(m)}`;
  const kx = k === 1 ? "x" : k === -1 ? "−x" : `${fmtNum(k)}x`;
  return m === 0 ? `y = ${kx}` : `y = ${kx} ${m < 0 ? "−" : "+"} ${fmtNum(Math.abs(m))}`;
}

const kSentence = (k: number) => k === 0
  ? "Linjen är vågrät: 1 steg åt höger och den går varken upp eller ner, så k = 0."
  : `1 steg åt höger går linjen ${fmtNum(Math.abs(k))} steg ${k > 0 ? "uppåt" : "nedåt"}, så k = ${fmtNum(k)}.`;
const mSentence = (m: number) => m === 0
  ? "Linjen går genom origo, så m = 0."
  : `Linjen korsar y-axeln i ${fmtNum(m)}, så m = ${fmtNum(m)}.`;

/** Förklaringen visar bara det som efterfrågades, och ekvationen när båda delarna behövs. */
export function explain(t: LinjeTask): string {
  if (t.mode === "m") return mSentence(t.m);
  if (t.mode === "k") return kSentence(t.k);
  return `${mSentence(t.m)} ${kSentence(t.k)} Ekvationen är ${fmtEq(t.k, t.m)}.`;
}

export function tip(t: LinjeTask): string {
  const m = "Följ y-axeln (den lodräta) tills du träffar linjen – talet där är m.";
  const k = "Ställ dig på en punkt på linjen. Gå 1 steg åt höger och räkna hur många steg du måste gå upp (+) eller ner (−) för att komma tillbaka till linjen – det är k.";
  if (t.mode === "m") return m;
  if (t.mode === "k") return k + (tierSpec(t.tier).ks.includes(0) ? " En vågrät linje har k = 0." : "");
  return `${m} ${k} Skriv sedan y = kx + m.`;
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const signK = (k: number) => k < 0
  ? "Linjen går nedåt när du går åt höger – då är k negativt."
  : "Linjen går uppåt när du går åt höger – då är k positivt.";
const signM = (m: number) => m < 0
  ? "Linjen korsar y-axeln under origo – då är m negativt."
  : "Linjen korsar y-axeln ovanför origo – då är m positivt.";
const INVERTED = "Du har räknat åt fel håll. Gå 1 steg åt höger och räkna hur många steg linjen går upp eller ner.";

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
  if (Math.abs(k) > 1 && (near(ans, 1 / k) || near(ans, -1 / k))) return { correct: false, error: "inverted", message: INVERTED };
  if (near(ans, m)) return { correct: false, error: "swapped", message: "Det där är m, där linjen korsar y-axeln. k är hur mycket linjen lutar." };
  if (k === 0) return { correct: false, error: "other", message: "Linjen är vågrät – den går varken upp eller ner. Då är k = 0." };
  return { correct: false, error: "other", message: "Gå 1 steg åt höger från en punkt på linjen. Hur många steg upp eller ner kommer du tillbaka till linjen?" };
}

function checkEkv(t: LinjeTask, a: { k: number; m: number }): LinjeCheck {
  const { k, m } = t;
  const okK = near(a.k, k), okM = near(a.m, m);
  if (okK && okM) return { correct: true, error: null, message: explain(t) };
  if (k !== m && near(a.k, m) && near(a.m, k)) return { correct: false, error: "swapped", message: "Du har bytt plats på k och m. k står framför x, m är talet som står för sig självt." };
  if (okM && k !== 0 && near(a.k, -k)) return { correct: false, error: "sign", message: `m stämmer. ${signK(k)}` };
  if (okK && m !== 0 && near(a.m, -m)) return { correct: false, error: "sign", message: `k stämmer. ${signM(m)}` };
  if (okM && Math.abs(k) > 1 && (near(a.k, 1 / k) || near(a.k, -1 / k))) return { correct: false, error: "inverted", message: `m stämmer. ${INVERTED}` };
  if (okK) return { correct: false, error: "other", message: "k stämmer – kolla m, där linjen korsar y-axeln." };
  if (okM) return { correct: false, error: "other", message: "m stämmer – kolla k: 1 steg åt höger, hur många upp eller ner?" };
  return { correct: false, error: "other", message: "Börja med m: var korsar linjen y-axeln? Sedan k: 1 steg åt höger, hur många upp eller ner?" };
}

/** Rättar ett svar och känner igen de vanligaste felen: k och m förväxlade, fel tecken, steget räknat åt fel håll. */
export function checkAnswer(t: LinjeTask, a: LinjeAnswer): LinjeCheck {
  if (t.mode === "m") return checkM(t, a.m ?? NaN);
  if (t.mode === "k") return checkK(t, a.k ?? NaN);
  return checkEkv(t, { k: a.k ?? NaN, m: a.m ?? NaN });
}
