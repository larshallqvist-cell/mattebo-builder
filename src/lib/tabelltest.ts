// Tabelltestet: multiplikationstabellerna 2-9, 20 slumpvisa uppgifter.
// Godkänt = minst 18 rätt OCH högst 2,0 s i snitt per uppgift.

export const TABLE_MIN = 2;
export const TABLE_MAX = 9;
export const FACTOR_MAX = 10;
export const QUESTION_COUNT = 20;
export const PASS_SCORE = 18;
export const PASS_AVG_MS = 2000;

export interface TabellQuestion {
  a: number;
  b: number;
  answer: number;
}

/** Slumpar 20 uppgifter ur alla kombinationer 2-9 × 1-10 utan upprepning. */
export function generateQuestions(rand: () => number = Math.random): TabellQuestion[] {
  const all: TabellQuestion[] = [];
  for (let a = TABLE_MIN; a <= TABLE_MAX; a++) {
    for (let b = 1; b <= FACTOR_MAX; b++) {
      all.push({ a, b, answer: a * b });
    }
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, QUESTION_COUNT);
}

/** Godkänt kräver både tillräckligt många rätt och tillräckligt snabba svar. */
export function isPassed(score: number, avgTimeMs: number): boolean {
  return score >= PASS_SCORE && avgTimeMs <= PASS_AVG_MS;
}

const ONES: Record<string, number> = {
  noll: 0, ett: 1, en: 1, två: 2, tva: 2, tre: 3, fyra: 4, fem: 5,
  sex: 6, sju: 7, åtta: 8, atta: 8, nio: 9, tio: 10,
  elva: 11, tolv: 12, tretton: 13, fjorton: 14, femton: 15,
  sexton: 16, sjutton: 17, arton: 18, nitton: 19,
};
const TENS: Record<string, number> = {
  tjugo: 20, trettio: 30, fyrtio: 40, femtio: 50,
  sextio: 60, sjuttio: 70, åttio: 80, attio: 80, nittio: 90,
};

/**
 * Tolkar ett tal ur svensk röstinmatning: siffror ("42") eller ord
 * ("fyrtiotvå", "fyrtio två", "åtta"). Returnerar null om inget tal hittas.
 */
export function parseSpokenNumber(text: string): number | null {
  const cleaned = text.toLowerCase().trim();
  const digits = cleaned.match(/\d{1,3}/);
  if (digits) {
    const n = parseInt(digits[0], 10);
    return n >= 0 && n <= 100 ? n : null;
  }
  const compact = cleaned.replace(/[^a-zåäö]/g, "");
  if (!compact) return null;
  if (ONES[compact] != null) return ONES[compact];
  if (TENS[compact] != null) return TENS[compact];
  for (const [tenWord, tenValue] of Object.entries(TENS)) {
    if (compact.startsWith(tenWord)) {
      const rest = compact.slice(tenWord.length);
      if (rest && ONES[rest] != null && ONES[rest] < 10) return tenValue + ONES[rest];
    }
  }
  return null;
}
