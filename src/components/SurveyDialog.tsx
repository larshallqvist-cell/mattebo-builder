import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SURVEY_QUESTIONS,
  SURVEY_SCALE,
  LEARNED_PROMPT,
  WISH_PROMPT,
  MAX_TEXT_LENGTH,
  formatWeekLabel,
} from "@/lib/survey";
import { emptyAnswers, type SurveyAnswers, type WeeklySurvey } from "@/hooks/useWeeklySurvey";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: WeeklySurvey;
  existing: SurveyAnswers | null;
  onSubmit: (answers: SurveyAnswers) => Promise<void>;
}

const SurveyDialog = ({ open, onOpenChange, survey, existing, onSubmit }: Props) => {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<SurveyAnswers>(existing ?? emptyAnswers());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setAnswers(existing ?? emptyAnswers());
  }, [open, existing]);

  const complete = SURVEY_QUESTIONS.every((q) => answers[q.key] !== null);

  const handleSubmit = async () => {
    if (!complete) return;
    setSaving(true);
    try {
      await onSubmit(answers);
      toast({ title: "Tack för ditt svar!", description: "Din avstämning är sparad." });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Kunde inte spara",
        description: err instanceof Error ? err.message : "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--postit-light))] text-[hsl(var(--postit-text))] border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl text-[hsl(var(--postit-text))]">
            Lektionsavstämning — Åk {survey.grade}
          </DialogTitle>
          <p className="font-nunito text-sm text-[hsl(var(--postit-text))/70]">
            {formatWeekLabel(survey.week_start)} · snabbt och ärligt
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {SURVEY_QUESTIONS.map((q) => (
            <div
              key={q.key}
              className="rounded-2xl p-4"
              style={{
                background: `hsl(var(--${q.tone}) / 0.28)`,
                border: `1px solid hsl(var(--${q.tone}) / 0.6)`,
                boxShadow: "0 8px 20px -14px hsl(211 69% 8% / 0.6)",
              }}
            >
              <p className="font-nunito font-semibold mb-3">{q.question}</p>
              <div className="flex gap-3">
                {SURVEY_SCALE.map((s) => {
                  const selected = answers[q.key] === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: s.value }))}
                      className={`flex-1 rounded-xl py-2 px-2 font-nunito text-sm transition-all ${
                        selected ? "scale-[1.03]" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{
                        background: selected
                          ? `hsl(var(${s.token}) / 0.9)`
                          : "hsl(0 0% 100% / 0.55)",
                        border: `2px solid hsl(var(${s.token}) / ${selected ? 1 : 0.45})`,
                      }}
                      aria-pressed={selected}
                    >
                      <span className="block text-2xl leading-none" aria-hidden>
                        {s.face}
                      </span>
                      <span className="block mt-1">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="rounded-2xl bg-white/60 p-4 border border-primary/20 space-y-3">
            <label className="block">
              <span className="font-nunito font-semibold text-sm">{LEARNED_PROMPT}</span>
              <Textarea
                value={answers.learned_text}
                maxLength={MAX_TEXT_LENGTH}
                onChange={(e) => setAnswers((a) => ({ ...a, learned_text: e.target.value }))}
                rows={2}
                className="mt-1 bg-white text-[hsl(var(--postit-text))] font-nunito"
              />
            </label>
            <label className="block">
              <span className="font-nunito font-semibold text-sm">{WISH_PROMPT}</span>
              <Textarea
                value={answers.wish_text}
                maxLength={MAX_TEXT_LENGTH}
                onChange={(e) => setAnswers((a) => ({ ...a, wish_text: e.target.value }))}
                rows={2}
                className="mt-1 bg-white text-[hsl(var(--postit-text))] font-nunito"
              />
            </label>
          </div>

          <Button onClick={handleSubmit} disabled={!complete || saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {existing ? "Uppdatera mitt svar" : "Skicka in"}
          </Button>
          {!complete && (
            <p className="text-center text-xs font-nunito text-[hsl(var(--postit-text))/70]">
              Svara på alla fyra frågorna först.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SurveyDialog;
