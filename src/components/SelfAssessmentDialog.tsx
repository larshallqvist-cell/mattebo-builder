import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { INSTRUCTION, NEED_TO_TRY, NEED_TO_TRY_LABEL, SCALE, defaultQuestions, resolveQuestions } from "@/lib/selfAssessment";
import { cn } from "@/lib/utils";

interface Props {
  grade: number;
  chapter: number;
  sectionIndex: number;
  sectionName: string;
}

/** One sub-chapter at a time: "Jag kan …" statements rated on the formative scale. */
const SelfAssessmentDialog = ({ grade, chapter, sectionIndex, sectionName }: Props) => {
  const { user, accessStatus } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [ratings, setRatings] = useState<(number | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

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
        return i >= 0 ? r!.ratings[i] : null;
      }));
      setDone(false);
    })();
    return () => { alive = false; };
  }, [open, user, grade, chapter, sectionIndex]);

  if (!user || accessStatus !== "approved") return null;

  const complete = questions.length > 0 && ratings.every((v) => v != null);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("self_assessment_responses").upsert(
      { user_id: user.id, grade, chapter, section_index: sectionIndex, questions, ratings: ratings as number[], updated_at: new Date().toISOString() },
      { onConflict: "user_id,grade,chapter,section_index" },
    );
    setSaving(false);
    if (error) toast({ title: "Kunde inte spara", description: "Försök igen om en stund.", variant: "destructive" });
    else setDone(true);
  };

  const set = (i: number, v: number) => setRatings((prev) => prev.map((x, j) => (j === i ? v : x)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Självskattning för delkapitlet"
          className="inline-flex items-center gap-1 rounded-full border border-accent/60 px-2 py-0.5 font-manrope text-[10px] text-accent hover:bg-accent/15 sm:text-[11px]"
        >
          <ClipboardCheck className="h-3 w-3" /> Hur går det?
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sora">{sectionName}</DialogTitle>
          <DialogDescription className="font-manrope">{INSTRUCTION}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-3 py-4 text-center font-manrope">
            <p className="text-lg font-semibold">Tack! Dina svar är sparade.</p>
            <p className="text-sm text-muted-foreground">Du kan göra om skattningen när du har övat mer.</p>
            <Button onClick={() => setOpen(false)}>Stäng</Button>
          </div>
        ) : questions.length === 0 ? (
          <p className="py-4 font-manrope text-sm text-muted-foreground">Det finns inga frågor för det här delkapitlet än.</p>
        ) : (
          <div className="space-y-4">
            <p className="font-sora text-sm font-bold">Hur bra kan du det här just nu?</p>
            {questions.map((q, i) => (
              <fieldset key={q} className="space-y-2 rounded-lg border border-border/60 p-3">
                <legend className="px-1 font-manrope text-sm font-semibold">{q}</legend>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {SCALE.map((s) => (
                    <button key={s.value} type="button" aria-pressed={ratings[i] === s.value} onClick={() => set(i, s.value)}
                      className={cn("rounded-md border px-2 py-1.5 font-manrope text-xs leading-tight transition-colors",
                        ratings[i] === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-primary/15")}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <button type="button" aria-pressed={ratings[i] === NEED_TO_TRY} onClick={() => set(i, NEED_TO_TRY)}
                  className={cn("w-full rounded-md border border-dashed px-2 py-1 font-manrope text-xs",
                    ratings[i] === NEED_TO_TRY ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:bg-accent/15")}>
                  {NEED_TO_TRY_LABEL}
                </button>
              </fieldset>
            ))}
            <Button className="w-full" disabled={!complete || saving} onClick={submit}>
              {complete ? "Spara mina svar" : "Svara på alla rader först"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelfAssessmentDialog;
