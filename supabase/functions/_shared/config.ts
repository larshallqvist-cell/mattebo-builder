// Shared backend configuration for Supabase Edge Functions.
// Keep in sync with src/config/app.ts where concepts overlap (grades).

export const SUPPORTED_GRADES = [6, 7, 8, 9] as const;
export type Grade = (typeof SUPPORTED_GRADES)[number];

export const VALID_GRADES_STRINGS = SUPPORTED_GRADES.map(String);

export const DEFAULT_GRADE = 9;

export const MIN_CHAPTER = 1;
export const MAX_CHAPTER = 50;

export const SHEET_ID_MIN_LENGTH = 20;
export const SHEET_ID_MAX_LENGTH = 100;
export const SHEET_RANGE = "A2:F5000";
export const SHEET_TAB_NAME = (grade: Grade | string) => `Åk${grade}`;

export const SHEET_ID_PATTERN = new RegExp(
  `^[a-zA-Z0-9-_]{${SHEET_ID_MIN_LENGTH},${SHEET_ID_MAX_LENGTH}}$`
);

export const RESOURCE_CATEGORY_MAPPING: Record<string, string> = {
  Extrauppgifter: "Övningsuppgifter",
};

export const normalizeCategory = (category: string): string =>
  RESOURCE_CATEGORY_MAPPING[category] || category;

// Calendar fetching configuration
export const CALENDAR_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const CALENDAR_STALE_TTL_MS = 24 * 60 * 60 * 1000; // serve stale up to 24h if upstream fails
export const FETCH_RETRY_ATTEMPTS = 3;
export const FETCH_RETRY_BASE_MS = 800;
export const FETCH_RETRY_MULTIPLIER = 2;

export const CALENDAR_ENV_URL_KEYS: Record<Grade, string> = {
  6: "CALENDAR_URL_GRADE_6",
  7: "CALENDAR_URL_GRADE_7",
  8: "CALENDAR_URL_GRADE_8",
  9: "CALENDAR_URL_GRADE_9",
};
