import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { INSTRUCTION, SCALE, defaultQuestions, isScaleValue, resolveQuestions } from "@/lib/selfAssessment";
import { cn } from "@/lib/utils";

interface Props {
  grade: number;
  chapter: number;
  /** All sub-chapters of the chapter; the student may rate any of them. */
  sections: string[];
  /** The sub-chapter the teacher has marked: the dialog opens on it and the glow follows it. */
  markedIndex: number;
  /** Teacher has asked for attention: the button glows softly until the student has answered. */
  pulse?: boolean;
}

/** One sub-chapter at a time, one "Jag kan …" statement per card; the last answer saves. */
const OPTION_TONES = ["--pastel-4", "--pastel-5", "--pastel-1"];

const SelfAssessmentDialog = ({ grade, chapter, sections, markedIndex, pulse = false }: Props) => {
  const { user, accessStatus, isAdmin } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(markedIndex);
  const sectionName = sections[sectionIndex] ?? sections[markedIndex] ?? "";

  // Every time the dialog opens it starts on the teacher's marked sub-chapter.
  useEffect(() => {
    if (open) setSectionIndex(markedIndex);
  }, [open, markedIndex]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [ratings, setRatings] = useState<(number | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);

  // Students who already answered this sub-chapter are not nagged by the glow.
  useEffect(() => {
    setAnswered(false);
    if (!pulse || !user || isAdmin) return;
    let alive = true;
    supabase.from("self_assessment_responses").select("user_id")
      .eq("user_id", user.id).eq("grade", grade).eq("chapter", chapter).eq("section_index", markedIndex).maybeSingle()
      .then(({ data }) => { if (alive) setAnswered(!!data); });
    return () => { alive = false; };
  }, [pulse, user, isAdmin, grade, chapter, markedIndex]);

  useEffect(() => {
    if (!open || !user) return;
    let alive = true;
    (async () => {
      const [{ data: q }, { data: r }] = await Promise.all([
        supabase.from("self_assessment_questions").select("questions")
          .eq("grade", grade).eq("chapter", chapter).eq("section_index", sectionIndex).maybeSingle(),
        supabase.from("self_assessment_responses").select("questions, ratings")
          .eq("user_id", user.id).eq("grade", grade).eq("chapter", chapter).eq("section_index", sectionIndex).maybeSingle(),
      ]);
      if (!alive) return;
      const list = resolveQuestions(q?.questions, defaultQuestions(grade, chapter, sectionIndex));
      setQuestions(list);
      setRatings(list.map((text) => {
        const i = r?.questions.indexOf(text) ?? -1;
        const v = i >= 0 ? r!.ratings[i] : null;
        return isScaleValue(v) ? v : null;
      }));
      setDone(false);
      setStep(0);
    })();
    return () => { alive = false; };
  }, [open, user, grade, chapter, sectionIndex]);

  if (!user || accessStatus !== "approved") return null;

  const submit = async (final: number[]) => {
    setSaving(true);
    const { error } = await supabase.from("self_assessment_responses").upsert(
      { user_id: user.id, grade, chapter, section_index: sectionIndex, questions, ratings: final, updated_at: new Date().toISOString() },
      { onConflict: "user_id,grade,chapter,section_index" },
    );
    setSaving(false);
    if (error) toast({ title: "Kunde inte spara", description: "Försök igen om en stund.", variant: "destructive" });
    else { setDone(true); if (sectionIndex === markedIndex) setAnswered(true); }
  };

  const choose = (v: number) => {
    if (saving) return;
    const next = ratings.map((x, j) => (j === step ? v : x));
    setRatings(next);
    if (step < questions.length - 1) setTimeout(() => setStep((s) => s + 1), 280);
    else if (next.every((x) => x != null)) submit(next as number[]);
    else setStep(next.findIndex((x) => x == null));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Självskattning för delkapitlet"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-accent/60 px-2 py-0.5 font-manrope text-[10px] text-accent hover:bg-accent/15 sm:text-[11px]",
            pulse && !answered && "assessment-pulse",
          )}
        >
          <ClipboardCheck className="h-3 w-3" /> Hur går det?
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playful text-xl">{sectionName}</DialogTitle>
          <DialogDescription className="font-manrope">{INSTRUCTION}</DialogDescription>
        </DialogHeader>
        {sections.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Välj delkapitel">
            {sections.map((name, i) => {
              const active = i === sectionIndex;
              return (
                <button key={`${i}-${name}`} type="button" aria-pressed={active} disabled={saving}
                  onClick={() => setSectionIndex(i)}
                  className={cn("rounded-full border px-3 py-1 font-manrope text-xs transition-colors",
                    active ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-accent/70 hover:text-foreground")}>
                  {name}
                </button>
              );
            })}
          </div>
        )}
        {done ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-4xl" aria-hidden>🎉</p>
            <p className="font-playful text-2xl font-bold">Tack! Dina svar är sparade.</p>
            <p className="font-manrope text-sm text-muted-foreground">Du kan göra om det här när du har övat mer.</p>
            <Button onClick={() => setOpen(false)}>Stäng</Button>
          </div>
        ) : questions.length === 0 ? (
          <p className="py-4 font-manrope text-sm text-muted-foreground">Det finns inga frågor för det här delkapitlet än.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                aria-label="Föregående fråga"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted disabled:invisible">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex flex-1 gap-1.5" aria-hidden>
                {questions.map((_, i) => (
                  <span key={i} className={cn("h-2 flex-1 rounded-full transition-colors",
                    i === step ? "bg-accent" : ratings[i] != null ? "bg-primary" : "bg-muted")} />
                ))}
              </div>
              <span className="font-manrope text-xs text-muted-foreground">Fråga {step + 1} av {questions.length}</span>
            </div>

            <div key={step} className="animate-fade-in rounded-2xl border border-accent/40 bg-accent/10 px-5 py-6 shadow-lg">
              <p className="font-playful text-xl font-bold leading-snug sm:text-2xl">{questions[step]}</p>
            </div>

            <div className="grid gap-2.5" role="group" aria-label="Hur säker känner du dig?">
              {SCALE.map((s, i) => {
                const picked = ratings[step] === s.value;
                return (
                  <button key={s.value} type="button" aria-pressed={picked} onClick={() => choose(s.value)} disabled={saving}
                    style={{ backgroundColor: `hsl(var(${OPTION_TONES[i]}))` }}
                    className={cn("min-h-[52px] rounded-full border-2 px-5 py-3 text-left font-manrope text-base font-semibold text-background shadow-md transition-transform hover:-translate-y-0.5",
                      picked ? "border-foreground ring-2 ring-foreground/60" : "border-transparent")}>
                    {s.label}
                  </button>
                );
              })}
            </div>
            {saving && <p className="text-center font-manrope text-xs text-muted-foreground">Sparar …</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelfAssessmentDialog;
