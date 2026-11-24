
/** Geometrigymmet, modul 3.1 Prefix och enheter. Pure rules: content, generation, checking and progression. */
export const MASTERY_THRESHOLD = 8;
export const ROUND_LENGTH = 8;
/** Every REVIEW_EVERY:th finished round starts with a mastered skill as review. */
export const REVIEW_EVERY = 4;

/** Size of each unit in a shared base (mm, g, ml or cm³). */
export const UNITS = {
  km: 1_000_000, m: 1000, dm: 100, cm: 10, mm: 1,
  kg: 1000, hg: 100, g: 1,
  L: 1000, dl: 100, cl: 10, ml: 1,
  "m³": 1_000_000, "dm³": 1000, "cm³": 1,
} as const;
export type Unit = keyof typeof UNITS;
export type Pair = readonly [Unit, Unit];
export type Skill = { id: string; label: string; pairs: readonly Pair[]; category: string; decimals?: boolean; chooseUnit?: boolean };

const skill = (id: string, label: string, pairs: readonly Pair[], category: string): Skill => ({ id, label, pairs, category });

export const STAGES: { title: string; skills: Skill[] }[] = [
  { title: "De första stegen", skills: [skill("cm-dm", "Centimeter och decimeter", [["cm", "dm"]], "Längd"), skill("L-dl", "Liter och deciliter", [["L", "dl"]], "Rymd")] },
  { title: "Ett steg till", skills: [skill("mm-cm", "Millimeter och centimeter", [["mm", "cm"]], "Längd"), skill("dl-cl", "Deciliter och centiliter", [["dl", "cl"]], "Rymd")] },
  { title: "Från stort till smått", skills: [skill("m-dm", "Meter och decimeter", [["m", "dm"]], "Längd"), skill("cl-ml", "Centiliter och milliliter", [["cl", "ml"]], "Rymd")] },
  { title: "Väg och jämför", skills: [skill("kg-hg", "Kilogram och hektogram", [["kg", "hg"]], "Massa"), skill("hg-g", "Hektogram och gram", [["hg", "g"]], "Massa")] },
  { title: "Blanda dina kunskaper", skills: [skill("length", "Blandad längd", [["km", "m"], ["m", "cm"], ["dm", "mm"]], "Längd"), skill("mass", "Blandad massa", [["kg", "g"], ["hg", "g"]], "Massa"), skill("capacity", "Blandad rymd", [["L", "cl"], ["L", "ml"], ["dl", "ml"]], "Rymd")] },
  { title: "Upptäck volym", skills: [skill("volume", "Kubikcentimeter, kubikdecimeter och kubikmeter", [["cm³", "dm³"], ["dm³", "m³"]], "Volym")] },
  { title: "Volym möter rymd", skills: [skill("cm3-ml", "Kubikcentimeter och milliliter", [["cm³", "ml"]], "Volym och rymd"), skill("dm3-L", "Kubikdecimeter och liter", [["dm³", "L"]], "Volym och rymd"), skill("m3-L", "Kubikmeter och liter", [["m³", "L"]], "Volym och rymd")] },
  { title: "Tungviktspasset", skills: [{ ...skill("review", "Blandad repetition", [["m", "cm"], ["kg", "g"], ["L", "ml"], ["m³", "L"], ["dm³", "L"], ["cm³", "ml"]], "Alla enheter"), decimals: true, chooseUnit: true }] },
];
export const SKILLS = STAGES.flatMap((s) => s.skills);
export const LADDERS: Unit[][] = [["km", "m", "dm", "cm", "mm"], ["kg", "hg", "g"], ["L", "dl", "cl", "ml"], ["m³", "dm³", "cm³"]];

export type SkillProgress = { streak: number; correct: number; attempts: number; mastered: boolean };
export type Progress = { skills: Record<string, SkillProgress>; rounds: number; totalCorrect: number; points: number; bestRound: number; bestSeconds: Record<string, number>; timed: boolean };
export const emptyProgress = (): Progress => ({ skills: {}, rounds: 0, totalCorrect: 0, points: 0, bestRound: 0, bestSeconds: {}, timed: false });
const blankSkill = (): SkillProgress => ({ streak: 0, correct: 0, attempts: 0, mastered: false });

const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
/** Validates stored progress (database or this device); anything malformed becomes empty progress. */
export function parseProgress(raw: unknown): Progress {
  if (!raw || typeof raw !== "object") return emptyProgress();
  const r = raw as Record<string, unknown>;
  const skills: Record<string, SkillProgress> = {};
  if (r.skills && typeof r.skills === "object") {
    for (const s of SKILLS) {
      const v = (r.skills as Record<string, unknown>)[s.id] as Record<string, unknown> | undefined;
      if (v && isCount(v.streak) && isCount(v.correct) && isCount(v.attempts) && typeof v.mastered === "boolean") {
        skills[s.id] = { streak: v.streak, correct: v.correct, attempts: v.attempts, mastered: v.mastered };
      }
    }
  }
  const bestSeconds: Record<string, number> = {};
  if (r.bestSeconds && typeof r.bestSeconds === "object") {
    for (const s of SKILLS) {
      const v = (r.bestSeconds as Record<string, unknown>)[s.id];
      if (typeof v === "number" && Number.isFinite(v) && v > 0) bestSeconds[s.id] = v;
    }
  }
  return {
    skills, rounds: isCount(r.rounds) ? r.rounds : 0, totalCorrect: isCount(r.totalCorrect) ? r.totalCorrect : 0,
    points: isCount(r.points) ? r.points : 0, bestRound: isCount(r.bestRound) ? r.bestRound : 0, bestSeconds, timed: r.timed === true,
  };
}
export const masteredCount = (p: Progress) => SKILLS.filter((s) => p.skills[s.id]?.mastered).length;

/** Index of the first stage that still has an unmastered skill (the last stage when everything is done). */
export function unlockedStage(p: Progress) {
  const i = STAGES.findIndex((st) => st.skills.some((s) => !p.skills[s.id]?.mastered));
  return i < 0 ? STAGES.length - 1 : i;
}
export const availableSkills = (p: Progress) => STAGES.slice(0, unlockedStage(p) + 1).flatMap((st) => st.skills);

export function nextSkill(p: Progress): Skill {
  const available = availableSkills(p);
  const mastered = available.filter((s) => p.skills[s.id]?.mastered);
  if (p.rounds > 0 && p.rounds % REVIEW_EVERY === 0 && mastered.length) return mastered[(p.rounds / REVIEW_EVERY - 1) % mastered.length];
  return available.find((s) => !p.skills[s.id]?.mastered) ?? SKILLS[SKILLS.length - 1];
}

/** A wrong answer resets only this skill's streak; mastered skills and totals are kept. */
export function recordAnswer(p: Progress, id: string, correct: boolean): Progress {
  const prev = p.skills[id] ?? blankSkill();
  const streak = correct ? prev.streak + 1 : 0;
  return {
    ...p,
    totalCorrect: p.totalCorrect + Number(correct),
    skills: { ...p.skills, [id]: { streak, correct: prev.correct + Number(correct), attempts: prev.attempts + 1, mastered: prev.mastered || streak >= MASTERY_THRESHOLD } },
  };
}

export type Question = { skillId: string; from: Unit; to: Unit; value: number; answer: number; chooseUnit: boolean; choices: Unit[]; mission: string };

export const convert = (value: number, from: Unit, to: Unit) => Number(((value * UNITS[from]) / UNITS[to]).toPrecision(12));

const missionFor = (category: string) =>
  category === "Massa" ? "Lasta rätt vikt på stången."
    : category.includes("Volym") ? "Fyll vattentanken i gymmet."
      : category === "Rymd" ? "Blanda sportdrycken till passet."
        : category === "Längd" ? "Ställ in rätt längd på maskinen."
          : "Kontrollera utrustningen inför passet.";

export function generateQuestion(s: Skill, random = Math.random): Question {
  const pair = s.pairs[Math.floor(random() * s.pairs.length)] ?? s.pairs[0];
  const [from, to] = random() < 0.5 ? pair : ([pair[1], pair[0]] as const);
  const base = 1 + Math.floor(random() * 9);
  // Towards a bigger unit the start value is a whole multiple, so early answers stay whole numbers.
  const value = s.decimals ? base / 10 : UNITS[from] < UNITS[to] ? base * (UNITS[to] / UNITS[from]) : base;
  return { skillId: s.id, from, to, value, answer: convert(value, from, to), chooseUnit: Boolean(s.chooseUnit), choices: [...new Set(s.pairs.flatMap((p) => [...p]))], mission: missionFor(s.category) };
}

/** Next question for the same skill, never an exact repeat of the previous one. */
export function newQuestion(s: Skill, previous: Question, random = Math.random): Question {
  const next = generateQuestion(s, random);
  if (next.from !== previous.from || next.to !== previous.to || next.value !== previous.value) return next;
  const value = next.value * 2;
  return { ...next, value, answer: convert(value, next.from, next.to) };
}

export const isNumberInput = (input: string) => /^\d+(?:[.,]\d+)?$/.test(input.trim().replace(/\s/g, ""));

export function checkAnswer(q: Question, input: string, chosenUnit: string = q.to) {
  const n = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(n)) return false;
  // With a free unit choice, any listed unit is fine as long as the amount is the same.
  const unit = (q.chooseUnit ? chosenUnit : q.to) as Unit;
  if (!(unit in UNITS) || (q.chooseUnit && !q.choices.includes(unit))) return false;
  if (!q.chooseUnit && chosenUnit !== q.to) return false;
  const family = (u: Unit) => (["km","m","dm","cm","mm"].includes(u) ? 0 : ["kg","hg","g"].includes(u) ? 1 : 2);
  if (family(unit) !== family(q.to)) return false;
  const expected = convert(q.value, q.from, unit);
  return Math.abs(Number(n) - expected) < 1e-9 * Math.max(1, Math.abs(expected));
}

export const formatNumber = (v: number) => v.toLocaleString("sv-SE", { maximumFractionDigits: 8 });

export function explanation(q: Question) {
  const factor = UNITS[q.from] / UNITS[q.to];
  if (factor === 1) return `Enheterna är lika stora: 1 ${q.from} = 1 ${q.to}. Talet ändras inte.`;
  const big = factor > 1;
  const f = formatNumber(big ? factor : 1 / factor);
  return `1 ${big ? q.from : q.to} = ${f} ${big ? q.to : q.from}. ${big ? "Multiplicera" : "Dividera"} med ${f}. Talet blir ${big ? "större" : "mindre"}.`;
}

/** The part of a unit ladder between the two units, or null when they belong to different ladders (volume ↔ capacity). */
export function ladderFor(q: Pick<Question, "from" | "to">): Unit[] | null {
  const full = LADDERS.find((row) => row.includes(q.from) && row.includes(q.to));
  if (!full) return null;
  const a = full.indexOf(q.from), b = full.indexOf(q.to);
  return full.slice(Math.min(a, b), Math.max(a, b) + 1);
}

const PRAISE = ["Snyggt!", "Starkt jobbat!", "Där satt den!", "Grymt!", "Toppen!", "Bra jobbat!"];
const NAME_PRAISE = ["Bra {namn}!", "Toppen {namn}!", "Grymt, {namn}!", "Snyggt jobbat, {namn}!"];
const STREAK_PRAISE = ["Nu har du {n} rätt i rad, jättebra!", "{n} reps i rad!", "{n} rätt i rad! Du bygger styrka."];
export const NAME_GAP_MIN = 5;
export const NAME_GAP_MAX = 8;
/** Picks how many praises until the name is used again (5–8). */
export const nextNameGap = (random = Math.random) => NAME_GAP_MIN + Math.floor(random() * (NAME_GAP_MAX - NAME_GAP_MIN + 1));
/** Varied encouragement. The name is used only when `untilName` has counted down to 0; returns the new countdown. */
export function praise(name: string, streak: number, untilName: number, random = Math.random): { text: string; untilName: number } {
  const n = name.trim();
  if (n && untilName <= 0) {
    return { text: NAME_PRAISE[Math.floor(random() * NAME_PRAISE.length)].replace("{namn}", n), untilName: nextNameGap(random) };
  }
  const list = streak >= 3 && random() < 0.5 ? STREAK_PRAISE : PRAISE;
  return { text: list[Math.floor(random() * list.length)].replace("{n}", String(streak)), untilName: untilName - 1 };
}

/** Spreads: SPREAD_SIZE tasks answered together, then "Klar" grades them. */
export const SPREAD_SIZE = 4;
export const POINTS_RIGHT = 10;
export const POINTS_WRONG = -5;
export const TIME_BONUS_LIMIT = 40;
export const TIME_BONUS_MAX = 20;

/** SPREAD_SIZE questions of one skill, no two identical. */
export function spreadQuestions(s: Skill, random = Math.random): Question[] {
  const out: Question[] = [];
  let guard = 0;
  while (out.length < SPREAD_SIZE && guard++ < 200) {
    const q = generateQuestion(s, random);
    if (!out.some((o) => o.from === q.from && o.to === q.to && o.value === q.value)) out.push(q);
  }
  while (out.length < SPREAD_SIZE) out.push(newQuestion(s, out[out.length - 1], random));
  return out;
}

export function gradeSpread(qs: Question[], inputs: string[], units: string[] = []): boolean[] {
  return qs.map((q, i) => checkAnswer(q, inputs[i] ?? "", q.chooseUnit ? units[i] ?? "" : q.to));
}

/** +10 per right, −5 per wrong, never below 0; a fully right timed spread under 40 s gets +1 per second saved, max +20. */
export function scoreSpread(results: boolean[], seconds: number | null): number {
  const base = results.reduce((s, ok) => s + (ok ? POINTS_RIGHT : POINTS_WRONG), 0);
  const allRight = results.length > 0 && results.every(Boolean);
  const bonus = allRight && seconds !== null ? Math.min(TIME_BONUS_MAX, Math.max(0, Math.floor(TIME_BONUS_LIMIT - seconds))) : 0;
  return Math.max(0, base) + bonus;
}


/** Later modules in the book chapter; shown as "Kommer senare" until their exercises are built. */
export const FUTURE_MODULES = ["3.2 Längd och skala", "3.3 Vinklar", "3.4 Vinkelsumma", "3.5 Omkrets", "3.6 Area"];

/** Applies one graded spread to progress (same rules on the page and the server). */
export function applySpread(progress: Progress, qs: Question[], results: boolean[], seconds: number | null, lastOfRound: boolean, roundPointsBefore: number) {
  let p = progress;
  let newlyMastered = false;
  qs.forEach((q, i) => {
    const before = p.skills[q.skillId]?.mastered;
    p = recordAnswer(p, q.skillId, results[i]);
    if (!before && p.skills[q.skillId]?.mastered) newlyMastered = true;
  });
  const pts = scoreSpread(results, seconds);
  const sk = qs[0].skillId;
  const allRight = results.every(Boolean);
  const bestSeconds = seconds !== null && allRight && (!p.bestSeconds[sk] || seconds < p.bestSeconds[sk]) ? { ...p.bestSeconds, [sk]: Math.round(seconds * 10) / 10 } : p.bestSeconds;
  const roundPoints = roundPointsBefore + pts;
  p = { ...p, points: p.points + pts, bestSeconds, ...(lastOfRound ? { rounds: p.rounds + 1, bestRound: Math.max(p.bestRound, roundPoints) } : {}) };
  return { progress: p, points: pts, roundPoints, newlyMastered };
}
