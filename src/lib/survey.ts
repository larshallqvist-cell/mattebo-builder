/** Shared configuration and helpers for the weekly student check-in. */

export type SurveyQuestionKey = "q_learning" | "q_effort" | "q_calm" | "q_teacher";

export interface SurveyQuestion {
  key: SurveyQuestionKey;
  /** Short label used in charts and tables. */
  label: string;
  /** Full question shown to the student. */
  question: string;
  /** Design-token hue used for the question card. */
  tone: "grade-6" | "grade-7" | "grade-8" | "grade-9";
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    key: "q_learning",
    label: "Lärande",
    question: "Har jag lärt mig något nytt den här veckan?",
    tone: "grade-6",
  },
  {
    key: "q_effort",
    label: "Egen insats",
    question: "Har jag gjort mitt bästa på lektionerna?",
    tone: "grade-7",
  },
  {
    key: "q_calm",
    label: "Arbetsro",
    question: "Har jag bidragit till lugn i klassrummet?",
    tone: "grade-8",
  },
  {
    key: "q_teacher",
    label: "Lärarens insats",
    question: "Har jag fått den hjälp och de förklaringar jag behövde?",
    tone: "grade-9",
  },
];

/** 3 = positive, 2 = neutral, 1 = negative. */
export const SURVEY_SCALE = [
  { value: 3, label: "Ja", face: "🙂", token: "--survey-good" },
  { value: 2, label: "Ibland", face: "😐", token: "--survey-mid" },
  { value: 1, label: "Nej", face: "🙁", token: "--survey-bad" },
] as const;

export const LEARNED_PROMPT = "En sak jag lärde mig den här veckan:";
export const WISH_PROMPT = "Något jag önskar att vi ändrar på:";

export const MAX_TEXT_LENGTH = 500;

/** Monday (local time) of the week containing `date`, as an ISO date string. */
export const weekStartOf = (date: Date = new Date()): string => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOffset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dayOffset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** ISO week number for a `YYYY-MM-DD` week start. */
export const isoWeekNumber = (weekStart: string): number => {
  const [y, m, d] = weekStart.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
};

export const formatWeekLabel = (weekStart: string): string =>
  `v${isoWeekNumber(weekStart)} (${new Date(weekStart).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  })})`;
