export const IDLE_MS = 60_000;
export const VISIT_GAP_MS = 30 * 60_000;
export const PAGE_LABELS: Record<string, string> = {
  "/": "Startsidan", "/ak6": "Åk 6", "/ak7": "Åk 7", "/ak8": "Åk 8", "/ak9": "Åk 9",
  "/algebra": "Algebra", "/tabelltestet": "Tabelltestet", "/braklabbet": "Bråklabbet",
};
export type Visit = { id: string; visit_id: string; user_id: string; path: string; started_at: string; last_seen_at: string; active_seconds: number };
export type ActivityEvent = { id: string; userId: string; at: string; label: string; url?: string };
export type Student = { user_id: string; full_name: string; last_sign_in_at: string | null };

export function resumeVisit(saved: { userId: string; visitId: string; lastSeen: number } | null, userId: string, now: number, newId: string) {
  return saved?.userId === userId && now - saved.lastSeen >= 0 && now - saved.lastSeen < VISIT_GAP_MS ? saved.visitId : newId;
}

/** Count only foreground time up to the inactivity boundary, never the time a hidden tab spent asleep. */
export function activeElapsed(previous: number, now: number, lastInput: number, foreground: boolean) {
  if (!foreground || now <= previous) return 0;
  return Math.max(0, Math.min(now, lastInput + IDLE_MS) - previous);
}

export function summarizeStudents(students: Student[], visits: Visit[], events: ActivityEvent[], since: number) {
  return students.map((student) => {
    const ownVisits = visits.filter((v) => v.user_id === student.user_id && Date.parse(v.last_seen_at) >= since);
    const ownEvents = events.filter((e) => e.userId === student.user_id && Date.parse(e.at) >= since);
    const timestamps = [...ownVisits.map((v) => v.last_seen_at), ...ownEvents.map((e) => e.at)].sort((a, b) => Date.parse(b) - Date.parse(a));
    return {
      ...student, visits: new Set(ownVisits.map((v) => v.visit_id)).size,
      activeSeconds: ownVisits.reduce((sum, v) => sum + v.active_seconds, 0),
      lastAt: timestamps[0] ?? null,
      activities: [...new Set([...ownVisits.map((v) => PAGE_LABELS[v.path]), ...ownEvents.map((e) => e.label.split(" – ")[0])].filter(Boolean))],
    };
  }).sort((a, b) => Date.parse(b.lastAt ?? b.last_sign_in_at ?? "1970-01-01") - Date.parse(a.lastAt ?? a.last_sign_in_at ?? "1970-01-01"));
}

export function formatActiveTime(seconds: number) {
  if (seconds <= 0) return "—";
  if (seconds < 60) return "< 1 min";
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}