/** Rules for matching slideshow files ("genomgångar") to grade, chapter and sub-chapter. */

export interface SectionKey {
  chapter: number;
  section: number;
}

export type FileMatch = SectionKey | { error: "no-section" | "wrong-grade" };

/**
 * Reads chapter and sub-chapter from a file name such as
 * "ak6_kap2_5_procent.html" or "Åk6 2.5 Procent.html". A file naming another
 * grade is refused so Åk 7's slides never land on Åk 6.
 */
export const parsePresentationFileName = (fileName: string, grade: number): FileMatch => {
  const name = fileName.toLowerCase().normalize("NFC");
  const gradeMatch = name.match(/(?:^|[^a-zåäö])[aå]k\s*[_-]?\s*([6-9])(?!\d)/);
  if (gradeMatch && Number(gradeMatch[1]) !== grade) return { error: "wrong-grade" };

  const kap = name.match(/kap(?:itel)?\s*[_-]?\s*(\d{1,2})\s*[_.\-\s]\s*(\d{1,2})(?!\d)/);
  const dotted = kap ? null : name.match(/(?:^|[^\d])(\d)\.(\d{1,2})(?!\d)(?!\s*html?$)/);
  const m = kap ?? dotted;
  if (!m) return { error: "no-section" };
  const chapter = Number(m[1]);
  const section = Number(m[2]);
  if (chapter < 1 || chapter > 9 || section < 1 || section > 20) return { error: "no-section" };
  return { chapter, section };
};

/**
 * The sub-chapter number shown to students ("2.5" → 5): the book's own number
 * written in the name when it belongs to this chapter, else its place in the list.
 */
export const sectionNumber = (name: string, index: number, chapter: number): number => {
  const written = name.match(/^\s*(\d+)\.(\d+)/);
  if (written && Number(written[1]) === chapter) return Number(written[2]);
  return index + 1;
};
