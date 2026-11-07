import { useEffect, useState } from "react";
import { Pencil, Check, X, ChevronDown } from "lucide-react";
import { getChapterSubtitle, setChapterCookie } from "@/components/ChapterSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChapterSections } from "@/hooks/useChapterSections";
import { hapticFeedback } from "@/hooks/useHaptic";
import { carryCurrent, parseSections } from "@/lib/chapterSections";
import { MIN_CHAPTER, MAX_CHAPTER } from "@/config/app";
import { cn } from "@/lib/utils";
import SelfAssessmentDialog from "@/components/SelfAssessmentDialog";

const EDIT_SECTIONS_EVENT = "mattebo:edit-chapter-sections";

interface ChapterProps {
  grade: number;
  chapter: number;
}

/** Chapter title under "Matte Åk X" in the header; tapping it opens the chapter picker. */
export const ChapterTitle = ({ grade, chapter, onChapterChange }: ChapterProps & { onChapterChange: (chapter: number) => void }) => {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const { sections, current } = useChapterSections(grade, chapter);
  // Show the current sub-chapter ("Kapitel 2.1 – Uttryck") when one is marked; the picker still switches whole chapters.
  const rawSub = current != null ? sections[current] : undefined;
  const subName = rawSub?.replace(/^\s*\d+(\.\d+)*\s*[:.\-–]?\s*/, "") || undefined;
  // Prefer the book's own number written in the name ("2.5 Ränta"), else the position in the list.
  const written = rawSub?.match(/^\s*(\d+\.\d+)/)?.[1];
  const number = subName ? (written && written.startsWith(`${chapter}.`) ? written : `${chapter}.${current! + 1}`) : `${chapter}`;
  const subtitle = subName ?? getChapterSubtitle(grade, chapter);
  const sep = subName ? " – " : ": ";
  const chapters = Array.from({ length: MAX_CHAPTER - MIN_CHAPTER + 1 }, (_, i) => MIN_CHAPTER + i);

  const pick = (n: number) => {
    hapticFeedback("light");
    setChapterCookie(grade, n);
    onChapterChange(n);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Byt kapitel"
          className="group mx-auto mt-1 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 font-sora text-xs font-bold leading-tight text-foreground transition-colors hover:bg-primary/20 sm:mt-1.5 sm:gap-1.5 sm:px-3 sm:text-base lg:text-lg"
        >
          <span className="truncate">
            <span className="sm:hidden">Kap {number}</span>
            <span className="hidden sm:inline">Kapitel {number}</span>
            {subtitle && <span className="text-accent">{sep}{subtitle}</span>}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 sm:h-4 sm:w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-72 p-2">
        <p className="px-2 pb-1 font-sora text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Välj kapitel</p>
        <div className="flex flex-col" role="group" aria-label="Välj kapitel">
          {chapters.map((n) => {
            const active = n === chapter;
            const sub = getChapterSubtitle(grade, n);
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                onClick={() => pick(n)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-left font-manrope text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-primary/15",
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current font-sora text-sm font-bold">{n}</span>
                <span className="truncate font-semibold">{sub || `Kapitel ${n}`}</span>
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event(EDIT_SECTIONS_EVENT));
            }}
            className="mt-1 flex w-full items-center gap-2 border-t border-border/60 px-2 pt-2 pb-1 text-left font-manrope text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" /> Ändra delkapitel för kapitel {chapter}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

/** Sub-chapters of the current chapter as a slim row of chips, the current one lit. */
const ChapterSections = ({ grade, chapter }: ChapterProps) => {
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

  const saveDraft = async () => {
    const next = parseSections(draft);
    if (await persist(next, carryCurrent(sections, current, next))) setEditing(false);
  };

  // The chapter picker in the header opens editing, so no extra button takes room here.
  useEffect(() => {
    if (!isAdmin) return;
    const open = () => {
      setDraft(sections.join("\n"));
      setEditing(true);
    };
    window.addEventListener(EDIT_SECTIONS_EVENT, open);
    return () => window.removeEventListener(EDIT_SECTIONS_EVENT, open);
  }, [isAdmin, sections]);

  if (!sections.length && !editing) return null;

  if (editing) {
    return (
      <div className="w-full space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
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
    );
  }

  return (
    <div id="chapter" className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
      {sections.map((name, i) => {
        const active = i === current;
        const chip = cn(
          "rounded-full border px-2 py-0.5 font-manrope text-[10px] font-normal leading-tight transition-colors sm:text-[11px]",
          active
            ? "border-accent bg-accent text-accent-foreground"
            : "border-transparent bg-transparent text-foreground/35 hover:text-foreground/70",
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
      {current != null && sections[current] && (
        <SelfAssessmentDialog grade={grade} chapter={chapter} sectionIndex={current} sectionName={sections[current]} />
      )}
    </div>
  );
};

export default ChapterSections;
