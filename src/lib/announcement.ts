/** Rules for the per-grade announcement flash. */

/** Visible time: 3 s for short text, +1 s per 40 characters beyond 60, max 8 s. */
export const flashDurationMs = (text: string): number => {
  const extra = Math.max(0, Math.ceil((text.trim().length - 60) / 40));
  return Math.min(8000, 3000 + extra * 1000);
};

/** Local date as YYYY-MM-DD (Stockholm-time for users in Sweden). */
export const localDay = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Expired when an end date exists and today is after it (end date itself still shows). */
export const isExpired = (expiresOn: string | null | undefined, today: string): boolean =>
  !!expiresOn && today > expiresOn;

/** Key stored once shown: same day + same version → don't show again. */
export const seenKey = (grade: number, updatedAt: string, today: string) =>
  `${grade}|${updatedAt}|${today}`;

export const shouldShow = (opts: {
  content: string;
  expiresOn: string | null;
  updatedAt: string;
  grade: number;
  today: string;
  lastSeen: string | null;
}): boolean => {
  if (!opts.content.trim()) return false;
  if (isExpired(opts.expiresOn, opts.today)) return false;
  return opts.lastSeen !== seenKey(opts.grade, opts.updatedAt, opts.today);
};
