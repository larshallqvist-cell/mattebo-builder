import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useLessonPlans, lessonPlanKey, getLessonPlan, getLessonTitle } from "@/hooks/useLessonPlans";
import { SUPPORTED_GRADES } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bold, List, Link2, Save, Loader2, Heading } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const MAX_CONTENT_LENGTH = 4000;

const formatLesson = (date: Date, end: Date, location?: string) =>
  `${date.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })} ${date.toLocaleTimeString(
    "sv-SE",
    { hour: "2-digit", minute: "2-digit" },
  )}–${end.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}${location ? ` · ${location}` : ""}`;

const LessonPlanEditor = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState<number>(SUPPORTED_GRADES[0]);
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

  const upcoming = useMemo(() => {
    const now = new Date();
    return events.filter((e) => e.endDate > now).slice(0, 60);
  }, [events]);

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

  const insertBullet = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = draft.lastIndexOf("\n", start - 1) + 1;
    const prefix = draft.slice(lineStart, start).trim().length === 0 ? "- " : "\n- ";
    insertAtCursor(prefix, "", "punkt");
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
      await savePlan(selectedEvent, draft.slice(0, MAX_CONTENT_LENGTH), draftTitle.trim().slice(0, 120));
      toast({ title: "Sparat!", description: "Lektionsplaneringen är uppdaterad." });
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-nunito">Lektionsplanering</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                return (
                  <button
                    key={e.id}
                    onClick={() => selectLesson(key)}
                    className={`flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm transition-colors hover:bg-muted ${
                      key === selectedKey ? "bg-muted font-semibold" : ""
                    }`}
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
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => insertAtCursor("**", "**", "rubrik")}>
                    <Bold className="mr-1 h-4 w-4" /> Fet
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertAtCursor("\n", ":", "Rubrik")}>
                    <Heading className="mr-1 h-4 w-4" /> Rubrik
                  </Button>
                  <Button size="sm" variant="outline" onClick={insertBullet}>
                    <List className="mr-1 h-4 w-4" /> Punkt
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
                    <Link2 className="mr-1 h-4 w-4" /> Länk
                  </Button>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  maxLength={MAX_CONTENT_LENGTH}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={14}
                  placeholder={"Dagens mål:\n- Repetera bråk\n- [Matteboken](https://www.matteboken.se)"}
                  className="font-body text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {draft.length}/{MAX_CONTENT_LENGTH} tecken
                  </span>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Spara
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Välj en lektion i listan för att skriva planeringen.</p>
            )}
          </div>
        </div>
      </CardContent>

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
    </Card>
  );
};

export default LessonPlanEditor;
