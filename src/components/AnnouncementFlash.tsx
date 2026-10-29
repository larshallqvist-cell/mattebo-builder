import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Megaphone } from "lucide-react";
import { useAnnouncement } from "@/hooks/useAnnouncement";
import { flashDurationMs, localDay, seenKey, shouldShow } from "@/lib/announcement";
import { parseLessonContent, sanitizeLessonText } from "@/lib/lessonContent";
import "@/styles/announcement-flash.css";

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

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => setVisible(false)}
      role="dialog"
      aria-label="Anslag"
    >
      <div
        className="flash-card relative flex flex-col overflow-hidden rounded-[1.75rem] border border-accent/40 bg-card px-5 pb-5 pt-4 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setVisible(false)}
          aria-label="Stäng"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 pr-10 text-accent">
          <Megaphone className="h-6 w-6 shrink-0" />
          <span className="font-body text-base font-semibold uppercase tracking-widest">Åk {grade}</span>
        </div>
        <div className="flash-body flex flex-1 items-center justify-center py-4 text-center font-bold text-card-foreground">
          {parseLessonContent(sanitizeLessonText(announcement.content))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AnnouncementFlash;
