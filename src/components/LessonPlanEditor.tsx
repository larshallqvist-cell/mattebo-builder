import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCalendarEvents, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { useLessonPlans, lessonPlanKey, getLessonPlan, getLessonTitle } from "@/hooks/useLessonPlans";
import { useAllGradeLessons } from "@/hooks/useAllGradeLessons";
import { SUPPORTED_GRADES, DEFAULT_GRADE } from "@/config/app";

import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bold, List, Link2, Save, Loader2, Heading, ChevronLeft, ChevronRight } from "lucide-react";
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

const formatTimeRange = (date: Date, end: Date) =>
  `${date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

const GRADE_STORAGE_KEY = "mattebo_admin_grade";
const TAB_STORAGE_KEY = "mattebo_admin_plan_tab";

const isSupportedGrade = (value: number) =>
  (SUPPORTED_GRADES as readonly number[]).includes(value);

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

type SaveResult = { calendarSynced: boolean } | void;

interface EditorPaneProps {
  event: CalendarEvent;
  grade: number;
  initialContent: string;
  initialTitle: string;
  savePlan: (event: CalendarEvent, content: string, title?: string) => Promise<SaveResult>;
}

/** Shared editor used by both the per-class view and the per-day view. */
const LessonEditorPane = ({ event, grade, initialContent, initialTitle, savePlan }: EditorPaneProps) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState(initialContent);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keeps the live preview from re-parsing on every keystroke of a large paste.
  const preview = useDeferredValue(draft);

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
    setSaving(true);
    try {
      const result = await savePlan(event, draft.slice(0, MAX_CONTENT_LENGTH), draftTitle.trim().slice(0, 120));
      toast(
        result && result.calendarSynced
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
          (err as { message?: string })?.message ?? (typeof err === "string" ? err : "Okänt fel"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <p className="text-sm font-semibold text-foreground">
        Åk {grade} · {formatLesson(event.date, event.endDate, event.location)}
      </p>
      <Input
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        maxLength={120}
        placeholder={`Rubrik, t.ex. Matte Åk ${grade} – Bråk`}
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
        <code>## Rubrik</code> = rubrik (versal, med linje över) · <code>**fet**</code> = fetstil i löpande text ·{" "}
        <code>- punkt</code> = punktlista · <code>---</code> = linje · <code>[text](https://…)</code> = länk
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
              <p className="text-sm italic text-[hsl(var(--postit-text))/70]">Kunde inte förhandsvisa just nu.</p>
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
    </>
  );
};

/* ------------------------------ Per klass ------------------------------ */

const GradeView = () => {
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
  const [showPast, setShowPast] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

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
  }, [grade]);

  const selectLesson = (key: string) => {
    setSelectedKey(key);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_GRADES.map((g) => (
          <Button key={g} size="sm" variant={g === grade ? "default" : "outline"} onClick={() => setGrade(g)}>
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
                  className={`flex w-full items-center justify-between gap-2 border-l-4 p-2.5 text-left text-sm transition-colors hover:bg-muted ${
                    key === selectedKey
                      ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.18)] font-semibold text-foreground"
                      : "border-transparent"
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
            <LessonEditorPane
              key={`${grade}:${selectedEvent.uid}`}
              grade={grade}
              event={selectedEvent}
              initialContent={getLessonPlan(plans, selectedEvent) ?? selectedEvent.description ?? ""}
              initialTitle={getLessonTitle(titles, selectedEvent) ?? selectedEvent.title ?? ""}
              savePlan={savePlan}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Välj en lektion i listan för att skriva planeringen.</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------- Per dag ------------------------------- */

const DayView = () => {
  const { byGrade, loading } = useAllGradeLessons();
  const [day, setDay] = useState<Date>(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<{ grade: number; uid: string } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const lessons = useMemo(() => {
    const rows: { grade: number; event: CalendarEvent }[] = [];
    SUPPORTED_GRADES.forEach((g) => {
      byGrade[g]?.events.forEach((event) => {
        if (isSameDay(event.date, day)) rows.push({ grade: g, event });
      });
    });
    return rows.sort((a, b) => a.event.date.getTime() - b.event.date.getTime() || a.grade - b.grade);
  }, [byGrade, day]);

  useEffect(() => {
    setSelected(null);
  }, [day]);

  const selectedRow = useMemo(
    () => lessons.find((l) => l.grade === selected?.grade && l.event.uid === selected?.uid) || null,
    [lessons, selected],
  );

  const selectLesson = (grade: number, uid: string) => {
    setSelected({ grade, uid });
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const isToday = isSameDay(day, new Date());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" aria-label="Föregående dag" onClick={() => setDay((d) => addDays(d, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[12rem] text-center text-sm font-semibold capitalize text-foreground">
          {day.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
        </span>
        <Button size="icon" variant="outline" aria-label="Nästa dag" onClick={() => setDay((d) => addDays(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={isToday ? "secondary" : "ghost"}
          onClick={() => setDay(startOfDay(new Date()))}
        >
          Idag
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="max-h-[14rem] md:max-h-[26rem] overflow-y-auto rounded-md border border-border divide-y divide-border">
          {loading ? (
            <p className="p-3 text-sm text-muted-foreground">Laddar lektioner…</p>
          ) : lessons.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Inga lektioner den här dagen.</p>
          ) : (
            lessons.map(({ grade, event }) => {
              const hasPlan = Boolean((getLessonPlan(byGrade[grade].plans, event) ?? "").trim());
              const active = selected?.grade === grade && selected?.uid === event.uid;
              return (
                <button
                  key={`${grade}:${event.id}`}
                  onClick={() => selectLesson(grade, event.uid)}
                  className={`flex w-full items-center justify-between gap-2 border-l-4 p-2.5 text-left text-sm transition-colors hover:bg-muted ${
                    active
                      ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.18)] font-semibold text-foreground"
                      : "border-transparent"
                  }`}
                >
                  <span>
                    {formatTimeRange(event.date, event.endDate)} · Åk {grade}
                    {event.location ? ` · ${event.location}` : ""}
                  </span>
                  {hasPlan && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })
          )}
        </div>

        <div ref={editorRef} className="space-y-3 scroll-mt-24">
          {selectedRow ? (
            <LessonEditorPane
              key={`${selectedRow.grade}:${selectedRow.event.uid}`}
              grade={selectedRow.grade}
              event={selectedRow.event}
              initialContent={
                getLessonPlan(byGrade[selectedRow.grade].plans, selectedRow.event) ??
                selectedRow.event.description ??
                ""
              }
              initialTitle={
                getLessonTitle(byGrade[selectedRow.grade].titles, selectedRow.event) ??
                selectedRow.event.title ??
                ""
              }
              savePlan={byGrade[selectedRow.grade].savePlan}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Välj en lektion i dagens lista för att skriva planeringen.</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* --------------------------------- Root -------------------------------- */

const LessonPlanEditor = () => {
  const [tab, setTab] = useState<string>(() => localStorage.getItem(TAB_STORAGE_KEY) || "class");

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  }, [tab]);

  return (
    <div className="p-5">
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="class">Per klass</TabsTrigger>
          <TabsTrigger value="day">Per dag</TabsTrigger>
        </TabsList>
        <TabsContent value="class" className="mt-0">
          <GradeView />
        </TabsContent>
        <TabsContent value="day" className="mt-0">
          <DayView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LessonPlanEditor;
