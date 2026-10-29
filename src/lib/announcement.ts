/** Rules for the per-grade announcement flash. */

/** The flash has no timed auto-hide: it stays open until the user closes it. */
export const autoClosesAfterMs: number | null = null;

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
