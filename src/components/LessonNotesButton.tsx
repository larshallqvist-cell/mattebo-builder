import { useMemo, useState } from "react";
import { NotebookPen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useLessonNote, noteStatusLabel } from "@/hooks/useLessonNotes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const fmt = (d: Date) =>
  d.toLocaleString("sv-SE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });

/** Admin-only notebook for the current lesson (ongoing, else last ended today, else next today). */
const LessonNotesButton = ({ grade }: { grade: number }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return <Inner grade={grade} />;
};

const Inner = ({ grade }: { grade: number }) => {
  const [open, setOpen] = useState(false);
  const { events } = useCalendarEvents(grade);
  const target = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const ongoing = events.find((e) => e.date <= now && e.endDate > now);
    if (ongoing) return ongoing;
    const todays = events.filter((e) => e.date.toDateString() === today);
    const ended = todays.filter((e) => e.endDate <= now).sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
    return ended ?? todays.find((e) => e.date > now) ?? events.find((e) => e.date > now) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, open]);
  const { content, update, loading, status } = useLessonNote(grade, target);
  const hasNote = content.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Lektionsanteckningar"
        title="Lektionsanteckningar"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-foreground hover:bg-accent/30 transition-colors flex-shrink-0"
      >
        <NotebookPen className="h-4 w-4" />
        {hasNote && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent" />}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mina anteckningar</DialogTitle>
            <DialogDescription>
              {target ? `Åk ${grade} · ${fmt(target.date)}` : "Ingen lektion hittades idag"} — bara du ser detta.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            disabled={!target || loading}
            value={content}
            onChange={(e) => update(e.target.value.slice(0, 8000))}
            rows={14}
            placeholder="Idéer, tankar och känslan efter lektionen…"
            className="font-body text-base"
          />
          <p className="text-xs text-muted-foreground h-4">{noteStatusLabel(status)}</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LessonNotesButton;
