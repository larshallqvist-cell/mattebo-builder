// Shared backend configuration for Supabase Edge Functions.
// Keep in sync with src/config/app.ts where concepts overlap (grades).

export const SUPPORTED_GRADES = [6, 7, 8, 9] as const;
export type Grade = (typeof SUPPORTED_GRADES)[number];

export const VALID_GRADES_STRINGS = SUPPORTED_GRADES.map(String);

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
