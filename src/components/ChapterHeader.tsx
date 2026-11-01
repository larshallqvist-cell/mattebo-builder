import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import ChapterSelector, { getChapterSubtitle } from "@/components/ChapterSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChapterSections } from "@/hooks/useChapterSections";
import { carryCurrent, parseSections } from "@/lib/chapterSections";
import { cn } from "@/lib/utils";

interface ChapterHeaderProps {
  grade: number;
  chapter: number;
  onChapterChange: (chapter: number) => void;
}

/** "Det vi gör nu": chapter picker, big chapter title and its sub-chapters with the current one lit. */
const ChapterHeader = ({ grade, chapter, onChapterChange }: ChapterHeaderProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { sections, current, save } = useChapterSections(grade, chapter);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (next: string[], nextCurrent: number | null) => {
    setSaving(true);
    try {
      await save(next, nextCurrent);
      return true;
    } catch {
      toast({ title: "Kunde inte spara delkapitlen", description: "Försök igen om en stund.", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setDraft(sections.join("\n"));
    setEditing(true);
  };

  const saveDraft = async () => {
    const next = parseSections(draft);
    if (await persist(next, carryCurrent(sections, current, next))) setEditing(false);
  };

  const subtitle = getChapterSubtitle(grade, chapter);

  return (
    <section id="chapter" className="scroll-mt-4 rounded-3xl border border-accent/40 bg-secondary/60 px-4 py-5 shadow-[0_18px_40px_-24px_hsl(var(--accent)/0.6)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sora text-xs font-bold uppercase tracking-[0.18em] text-accent">Matte Åk {grade} · Nu jobbar vi med</p>
        <ChapterSelector grade={grade} onChapterChange={onChapterChange} variant="title" />
      </div>

      <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
        Kapitel {chapter}
        {subtitle && <span className="text-accent">: {subtitle}</span>}
      </h2>

      {editing ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder={"Ett delkapitel per rad, t.ex.\nUttryck\nEkvationer\nMönster"}
            className="font-manrope"
            aria-label="Delkapitel, ett per rad"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveDraft} disabled={saving}>
              <Check className="mr-1 h-4 w-4" /> Spara
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              <X className="mr-1 h-4 w-4" /> Avbryt
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {sections.map((name, i) => {
            const active = i === current;
            const chip = cn(
              "rounded-full border-2 px-3 py-1.5 font-sora text-sm font-semibold transition-colors sm:text-base",
              active
                ? "border-accent bg-accent text-accent-foreground shadow-md"
                : "border-primary/30 bg-background/30 text-foreground/80",
            );
            return isAdmin ? (
              <button
                key={`${i}-${name}`}
                type="button"
                className={cn(chip, !active && "hover:border-accent/70")}
                aria-pressed={active}
                disabled={saving}
                onClick={() => persist(sections, active ? null : i)}
                title={active ? "Ta bort markeringen" : "Markera som aktuellt"}
              >
                {name}
              </button>
            ) : (
              <span key={`${i}-${name}`} className={chip} aria-current={active ? "step" : undefined}>
                {name}
              </span>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-manrope text-xs text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              {sections.length ? "Ändra delkapitel" : "Lägg till delkapitel"}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default ChapterHeader;
