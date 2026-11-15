/** Autosave rules for the teacher's lesson-plan editor. */

/** Save this long after the last keystroke. */
export const AUTOSAVE_DELAY_MS = 3000;

/** Unsaved local copies older than this are ignored (and cleared). */
export const DRAFT_BACKUP_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface LessonDraft {
  content: string;
  title: string;
}

export interface DraftBackup extends LessonDraft {
  savedAt: number;
}

export const draftBackupKey = (grade: number, uid: string) => `mattebo_lesson_draft:${grade}:${uid}`;

export const isSameDraft = (a: LessonDraft, b: LessonDraft) =>
  a.content === b.content && a.title.trim() === b.title.trim();

/**
 * A local copy is only left behind when a save never finished. Restore it when
 * it is recent and actually differs from what Mattebo/the calendar shows.
 */
export const pickRestoredDraft = (
  backup: DraftBackup | null,
  current: LessonDraft,
  now: number,
): LessonDraft | null => {
  if (!backup || typeof backup.content !== "string" || typeof backup.title !== "string") return null;
  if (!Number.isFinite(backup.savedAt) || now - backup.savedAt > DRAFT_BACKUP_MAX_AGE_MS) return null;
  if (isSameDraft(backup, current)) return null;
  return { content: backup.content, title: backup.title };
};

export const readDraftBackup = (key: string): DraftBackup | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DraftBackup) : null;
  } catch {
    return null;
  }
};

export const writeDraftBackup = (key: string, draft: LessonDraft) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* storage full or blocked – the server save still runs */
  }
};

export const clearDraftBackup = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};
