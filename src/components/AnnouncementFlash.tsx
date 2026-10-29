import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import { useAnnouncement } from "@/hooks/useAnnouncement";
import { flashDurationMs, localDay, seenKey, shouldShow } from "@/lib/announcement";
import { parseLessonContent, sanitizeLessonText } from "@/lib/lessonContent";

const STORAGE = (grade: number) => `mattebo-flash-seen-${grade}`;

/** Shows the grade's announcement once per day, auto-hides after a few seconds. */
const AnnouncementFlash = ({ grade }: { grade: number }) => {
  const { announcement } = useAnnouncement(grade);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    const today = localDay();
    let lastSeen: string | null = null;
    try { lastSeen = localStorage.getItem(STORAGE(grade)); } catch { /* ignore */ }
    if (!shouldShow({ ...announcement, grade, today, lastSeen })) return;
    try { localStorage.setItem(STORAGE(grade), seenKey(grade, announcement.updatedAt, today)); } catch { /* ignore */ }
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), flashDurationMs(announcement.content));
    return () => window.clearTimeout(t);
  }, [announcement, grade]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setVisible(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible || !announcement) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => setVisible(false)}
      role="dialog"
      aria-label="Anslag"
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-accent/40 bg-card p-6 pr-12 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setVisible(false)}
          aria-label="Stäng"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-3 flex items-center gap-2 text-accent">
          <Megaphone className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Åk {grade}</span>
        </div>
        <div className="text-lg text-card-foreground">
          {parseLessonContent(sanitizeLessonText(announcement.content))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementFlash;
