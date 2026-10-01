import { useLessonNote, usePreviousLessonNote, noteStatusLabel } from "@/hooks/useLessonNotes";
import { Textarea } from "@/components/ui/textarea";

const fmt = (d: Date) =>
  d.toLocaleString("sv-SE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });

/** Shows previous lesson's notes (read-only) and this lesson's own notes in the planning editor. */
const LessonNotesPanel = ({ grade, event }: { grade: number; event: { uid: string; date: Date } }) => {
  const prev = usePreviousLessonNote(grade, event.date);
  const { content, update, status } = useLessonNote(grade, event);
  return (
    <div className="space-y-2">
      <div className="rounded-lg border-l-4 border-accent bg-accent/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Tankar från förra lektionen{prev ? ` · ${fmt(prev.startsAt)}` : ""}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
          {prev ? prev.content : "Inga anteckningar från förra lektionen."}
        </p>
      </div>
      <details className="rounded-lg border border-border/60 p-2">
        <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
          Mina anteckningar för den här lektionen {content.trim() ? "•" : ""}
        </summary>
        <Textarea
          value={content}
          onChange={(e) => update(e.target.value.slice(0, 8000))}
          rows={4}
          placeholder="Bara du ser detta"
          className="mt-2 text-sm"
        />
        <p className="text-xs text-muted-foreground h-4">{noteStatusLabel(status)}</p>
      </details>
    </div>
  );
};

export default LessonNotesPanel;
