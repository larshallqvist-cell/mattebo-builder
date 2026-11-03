import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChapterSections } from "@/hooks/useChapterSections";
import { SCALE, defaultQuestions, parseQuestions, resolveQuestions, summarize, type QuestionSummary } from "@/lib/selfAssessment";
import { cn } from "@/lib/utils";

const GRADES = [6, 7, 8, 9];
const CHAPTERS = [1, 2, 3, 4, 5];

/** Class overview per sub-chapter plus the question editor (teacher edits override the default bank). */
const SelfAssessmentAdmin = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState(6);
  const [chapter, setChapter] = useState(1);
  const [section, setSection] = useState(0);
  const { sections } = useChapterSections(grade, chapter);
  const [draft, setDraft] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [summary, setSummary] = useState<QuestionSummary[]>([]);
  const [students, setStudents] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => { setSection(0); }, [grade, chapter]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: q }, { data: r }] = await Promise.all([
        supabase.from("self_assessment_questions").select("questions")
          .eq("grade", grade).eq("chapter", chapter).eq("section_index", section).maybeSingle(),
        supabase.from("self_assessment_responses").select("questions, ratings")
          .eq("grade", grade).eq("chapter", chapter).eq("section_index", section),
      ]);
      if (!alive) return;
      const list = resolveQuestions(q?.questions, defaultQuestions(grade, chapter, section));
      setQuestions(list);
      setDraft(list.join("\n"));
      setStudents(r?.length ?? 0);
      setSummary(summarize(list, r ?? []));
    })();
    return () => { alive = false; };
  }, [grade, chapter, section, reload]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("self_assessment_questions").upsert(
      { grade, chapter, section_index: section, questions: parseQuestions(draft), updated_at: new Date().toISOString() },
      { onConflict: "grade,chapter,section_index" },
    );
    setSaving(false);
    if (error) toast({ title: "Kunde inte spara frågorna", variant: "destructive" });
    else { toast({ title: "Frågorna sparade" }); setReload((n) => n + 1); }
  };

  const pill = (active: boolean) => cn("rounded-full border px-3 py-1 text-sm", active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-primary/15");

  return (
    <div className="space-y-4 font-manrope">
      <div className="flex flex-wrap gap-1.5">
        {GRADES.map((g) => <button key={g} className={pill(g === grade)} onClick={() => setGrade(g)}>Åk {g}</button>)}
        <span className="mx-1" />
        {CHAPTERS.map((c) => <button key={c} className={pill(c === chapter)} onClick={() => setChapter(c)}>Kap {c}</button>)}
      </div>
      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kapitlet har inga delkapitel än.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s, i) => <button key={i} className={cn(pill(i === section), "text-xs")} onClick={() => setSection(i)}>{s}</button>)}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Klassens svar ({students} elever)</p>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga frågor än – skriv in dem nedan.</p>
            ) : (
              <div className="space-y-2">
                {summary.map((s) => (
                  <div key={s.question} className="rounded-lg border border-border/60 p-2">
                    <p className="text-sm">{s.question}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {SCALE.map((l) => <span key={l.value}>{l.label}: <b className="text-foreground">{s.counts[l.value - 1]}</b></span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Frågor (ett ”Jag kan …” per rad)</p>
            <Textarea rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <p className="text-xs text-muted-foreground">Ändrade frågor räknas som nya; tidigare svar på samma text finns kvar.</p>
            <Button size="sm" onClick={save} disabled={saving}>Spara frågor</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SelfAssessmentAdmin;
