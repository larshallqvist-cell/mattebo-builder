import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useLessonPlans, lessonPlanKey, getLessonPlan, getLessonTitle } from "@/hooks/useLessonPlans";
import { SUPPORTED_GRADES, DEFAULT_GRADE } from "@/config/app";

import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bold, List, Link2, Save, Loader2, Heading } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseLessonContent, sanitizeLessonText } from "@/lib/lessonContent";
import ErrorBoundary from "@/components/ErrorBoundary";

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const MAX_CONTENT_LENGTH = 4000;

const formatLesson = (date: Date, end: Date, location?: string) =>
  `${date.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })} ${date.toLocaleTimeString(
    "sv-SE",
    { hour: "2-digit", minute: "2-digit" },
  )}–${end.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}${location ? ` · ${location}` : ""}`;

const GRADE_STORAGE_KEY = "mattebo_admin_grade";

const isSupportedGrade = (value: number) =>
  (SUPPORTED_GRADES as readonly number[]).includes(value);

const LessonPlanEditor = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [grade, setGrade] = useState<number>(() => {
    const fromUrl = Number(searchParams.get("grade"));
    if (isSupportedGrade(fromUrl)) return fromUrl;
    const stored = Number(localStorage.getItem(GRADE_STORAGE_KEY));
    if (isSupportedGrade(stored)) return stored;
    return DEFAULT_GRADE;
  });

  useEffect(() => {
    localStorage.setItem(GRADE_STORAGE_KEY, String(grade));
  }, [grade]);

  const { events, loading: eventsLoading } = useCalendarEvents(grade);
  const { plans, titles, savePlan } = useLessonPlans(grade);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Keeps the live preview from re-parsing on every keystroke of a large paste.
  const preview = useDeferredValue(draft);

  const [showPast, setShowPast] = useState(false);


  const upcoming = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const future = events.filter((e) => e.endDate > now).slice(0, 60);
    if (!showPast) return future;
    const past = events.filter((e) => e.endDate <= now && e.endDate >= cutoff).slice(-20);
    return [...past, ...future];
  }, [events, showPast]);

  const selectedEvent = useMemo(
    () => upcoming.find((e) => lessonPlanKey(e) === selectedKey) || null,
    [upcoming, selectedKey],
  );

  useEffect(() => {
    setSelectedKey(null);
    setDraft("");
    setDraftTitle("");
  }, [grade]);

  const selectLesson = (key: string) => {
    setSelectedKey(key);
    const event = upcoming.find((e) => lessonPlanKey(e) === key);
    setDraft((event ? getLessonPlan(plans, event) : undefined) ?? event?.description ?? "");
    setDraftTitle((event ? getLessonTitle(titles, event) : undefined) ?? event?.title ?? "");
    // On narrow screens the editor sits below the list — bring it into view.
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      textareaRef.current?.focus();
    });
  };

  const insertAtCursor = (before: string, after = "", placeholder = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = draft.slice(start, end) || placeholder;
    const next = draft.slice(0, start) + before + selected + after + draft.slice(end);
    setDraft(next.slice(0, MAX_CONTENT_LENGTH));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const insertLinePrefix = (marker: string, placeholder: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = draft.lastIndexOf("\n", start - 1) + 1;
    const atLineStart = draft.slice(lineStart, start).trim().length === 0;
    insertAtCursor(atLineStart ? marker : `\n${marker}`, "", placeholder);
  };

  const insertBullet = () => insertLinePrefix("- ", "punkt");
  const insertHeading = () => insertLinePrefix("## ", "Rubrik");

  /** Clean pasted content (invisible chars, CRLF, smart quotes) before it enters the draft. */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;
    const pasted = sanitizeLessonText(e.clipboardData.getData("text/plain"));
    if (!pasted) return;
    e.preventDefault();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = (draft.slice(0, start) + pasted + draft.slice(end)).slice(0, MAX_CONTENT_LENGTH);
    setDraft(next);
    const caret = Math.min(start + pasted.length, MAX_CONTENT_LENGTH);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };




  const confirmLink = () => {
    const url = linkUrl.trim();
    if (!/^(https?:\/\/|www\.|mailto:)/i.test(url)) {
      toast({ title: "Ogiltig länk", description: "Använd https://, www. eller mailto:", variant: "destructive" });
      return;
    }
    insertAtCursor(`[${linkText.trim() || url}](${url})`);
    setLinkOpen(false);
    setLinkText("");
    setLinkUrl("");
  };

  const handleSave = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const result = await savePlan(
        selectedEvent,
        draft.slice(0, MAX_CONTENT_LENGTH),
        draftTitle.trim().slice(0, 120),
      );
      toast(
        result?.calendarSynced
          ? { title: "Sparat!", description: "Planeringen är uppdaterad och synkad till Google Kalender." }
          : {
              title: "Sparat i appen",
              description: "Kunde inte skriva till Google Kalender just nu.",
              variant: "destructive" as const,
            },
      );
    } catch (err) {
      toast({
        title: "Kunde inte spara",
        description:
          (err as { message?: string })?.message ??
          (typeof err === "string" ? err : "Okänt fel"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_GRADES.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={g === grade ? "default" : "outline"}
              onClick={() => setGrade(g)}
            >
              Åk {g}
            </Button>
          ))}
        </div>

        <Button size="sm" variant={showPast ? "secondary" : "ghost"} onClick={() => setShowPast((v) => !v)}>
          {showPast ? "Dölj tidigare lektioner" : "Visa tidigare lektioner"}
        </Button>

        <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="max-h-[14rem] md:max-h-[26rem] overflow-y-auto rounded-md border border-border divide-y divide-border">
            {eventsLoading ? (
              <p className="p-3 text-sm text-muted-foreground">Laddar lektioner…</p>
            ) : upcoming.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Inga kommande lektioner.</p>
            ) : (
              upcoming.map((e) => {
                const key = lessonPlanKey(e);
                const hasPlan = Boolean((getLessonPlan(plans, e) ?? "").trim());
                const isPast = e.endDate <= new Date();
                return (
                  <button
                    key={e.id}
                    onClick={() => selectLesson(key)}
                    className={`flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm transition-colors hover:bg-muted ${
                      key === selectedKey ? "bg-muted font-semibold" : ""
                    } ${isPast ? "text-muted-foreground italic" : ""}`}
                  >
                    <span>{formatLesson(e.date, e.endDate, e.location)}</span>
                    {hasPlan && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })
            )}
          </div>

          <div ref={editorRef} className="space-y-3 scroll-mt-24">
            {selectedEvent ? (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {formatLesson(selectedEvent.date, selectedEvent.endDate, selectedEvent.location)}
                </p>
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Rubrik, t.ex. Matte Åk 6 – Bråk"
                  className="font-body text-sm"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => insertAtCursor("**", "**", "fet text")}>
                      <Bold className="mr-1 h-4 w-4" /> Fet
                    </Button>
                    <Button size="sm" variant="outline" onClick={insertHeading}>
                      <Heading className="mr-1 h-4 w-4" /> Rubrik
                    </Button>
                    <Button size="sm" variant="outline" onClick={insertBullet}>
                      <List className="mr-1 h-4 w-4" /> Punkt
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
                      <Link2 className="mr-1 h-4 w-4" /> Länk
                    </Button>
                  </div>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Spara
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <code>## Rubrik</code> = rubrik (versal, med linje över) · <code>**fet**</code> = fetstil i löpande
                  text · <code>- punkt</code> = punktlista · <code>---</code> = linje · <code>[text](https://…)</code> =
                  länk
                </p>
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  maxLength={MAX_CONTENT_LENGTH}
                  onChange={(e) => setDraft(e.target.value)}
                  onPaste={handlePaste}
                  rows={14}
                  placeholder={"## Dagens mål\nVi repeterar **bråk**.\n- Uppgift 1–5\n- [Matteboken](https://www.matteboken.se)"}
                  className="font-body text-sm"
                />
                <div className="rounded-md border border-border bg-[hsl(var(--postit-light))] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--postit-text))/70]">
                    Förhandsvisning
                  </p>
                  <div className="space-y-0.5 font-nunito text-black">
                    <ErrorBoundary
                      fallback={
                        <p className="text-sm italic text-[hsl(var(--postit-text))/70]">
                          Kunde inte förhandsvisa just nu.
                        </p>
                      }
                    >
                      {preview.trim() ? (
                        parseLessonContent(preview)
                      ) : (
                        <p className="text-sm italic text-[hsl(var(--postit-text))/70]">Inget innehåll än.</p>
                      )}
                    </ErrorBoundary>
                  </div>
                </div>


                <span className="block text-xs text-muted-foreground">
                  {draft.length}/{MAX_CONTENT_LENGTH} tecken
                </span>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Välj en lektion i listan för att skriva planeringen.</p>
            )}
          </div>
        </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till länk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Länktext" value={linkText} onChange={(e) => setLinkText(e.target.value)} />
            <Input placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>Avbryt</Button>
            <Button onClick={confirmLink}>Infoga</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonPlanEditor;
