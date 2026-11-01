/** Sub-chapters ("delkapitel") per grade and chapter, entered by the teacher one per line. */
export const MAX_SECTIONS = 12;
export const MAX_SECTION_LENGTH = 60;

/** Turns the teacher's text (one sub-chapter per line) into a clean list. */
export const parseSections = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim().slice(0, MAX_SECTION_LENGTH))
    .filter((line) => line.length > 0)
    .slice(0, MAX_SECTIONS);

/** The highlighted sub-chapter index, or null when it no longer points at a sub-chapter. */
export const clampCurrent = (index: number | null | undefined, count: number): number | null =>
  index == null || !Number.isInteger(index) || index < 0 || index >= count ? null : index;

/** Keeps the same sub-chapter highlighted after the list is edited, matched by name. */
export const carryCurrent = (oldSections: string[], oldIndex: number | null, next: string[]): number | null => {
  if (oldIndex == null) return null;
  const name = oldSections[oldIndex];
  const found = name == null ? -1 : next.indexOf(name);
  return found >= 0 ? found : null;
};
