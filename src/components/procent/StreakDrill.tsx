import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, HintToggle, useExerciseSound } from "@/components/exercise/ExerciseParts";
import { advance, DRILL_START, DRILL_TIERS, parseNumber, TIER_STEP, tierOf, type Check as Result, type DrillProgress } from "@/lib/procent";

/** Beskriver en mängdträning: hur uppgifter skapas, rättas och visas. */
export type DrillConfig<T extends { kind: string; question: string }, F extends string> = {
  mode: "mangd" | "faktormangd";
  initialFocus: F;
  focusLabel: Record<F, string>;
  generate: (focus: F, tier: number, prev?: T) => T;
  check: (task: T, raw: string) => Result;
  explain: (task: T) => string;
  tip: (task: T) => string;
  placeholder: (task: T) => string;
  /** Bilden till vänster (triangeln eller stapeln) med val av vad man tränar på. */
  visual: (p: { task: T; tier: number; solved: boolean; focus: F; choose: (f: F) => void }) => ReactNode;
};

const NEXT_DELAY = 900; // rätt svar går vidare av sig självt
const storageKey = (mode: string) => `procent-drill-${mode}`;
const loadProgress = (mode: string): DrillProgress => {
  try {
    const p = JSON.parse(sessionStorage.getItem(storageKey(mode)) ?? "null");
    if (p && Number.isFinite(p.xp) && Number.isFinite(p.streak)) return { xp: p.xp, streak: p.streak };
  } catch { /* ignoreras */ }
  return DRILL_START;
};

/** Mängdträning: oändligt många snabba uppgifter, sakta ökande svårighet och svit. Steget sparas i fliken vid byte av träning. */
export default function StreakDrill<T extends { kind: string; question: string }, F extends string>({ config: c, switcher }: { config: DrillConfig<T, F>; switcher: ReactNode }) {
  const [focus, setFocus] = useState<F>(c.initialFocus);
  const [prog, setProg] = useState(() => loadProgress(c.mode));
  const tier = tierOf(prog.xp);
  const [task, setTask] = useState(() => c.generate(c.initialFocus, tierOf(prog.xp)));
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [lost, setLost] = useState(0); // sviten som bröts vid senaste felet
  const [tip, setTip] = useState(false);
  const [record, setRecord] = useState(0);
  const [newRecord, setNewRecord] = useState(false);
  const startRecord = useRef(0);
  const usedHint = useRef(false);
  const timer = useRef<number>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const sound = useExerciseSound();
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { try { sessionStorage.setItem(storageKey(c.mode), JSON.stringify(prog)); } catch { /* ignoreras */ } }, [prog, c.mode]);
  // Elevens rekord: längsta svit i tidigare träning av samma slag.
  useEffect(() => {
    if (!user) return;
    void supabase.from("procent_attempts").select("streak").eq("user_id", user.id).eq("mode", c.mode)
      .not("streak", "is", null).order("streak", { ascending: false }).limit(1)
      .then(({ data }) => {
        const best = data?.[0]?.streak ?? 0;
        startRecord.current = Math.max(startRecord.current, best);
        setRecord((r) => Math.max(r, best));
      });
  }, [user, c.mode]);

  const focusInput = () => setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  const fresh = (f: F, t: number) => {
    window.clearTimeout(timer.current);
    setTask((prev) => c.generate(f, t, prev));
    setAnswer(""); setResult(null); setNotice(""); setTip(false); usedHint.current = false; focusInput();
  };
  const choose = (f: F) => { setFocus(f); fresh(f, tier); };

  const check = () => {
    if (!answer.trim() || result) return;
    if (parseNumber(answer) === null) { setNotice("Skriv ett tal, t.ex. 25 eller 12,5."); return; }
    const r = c.check(task, answer);
    const p = advance(prog, r.correct);
    setResult(r); setProg(p); setLost(r.correct ? 0 : prog.streak);
    sound.play(r.correct);
    if (p.streak > record) setRecord(p.streak);
    if (p.streak > startRecord.current && p.streak >= 3) setNewRecord(true);
    if (!r.correct) setNewRecord(false);
    if (user) {
      void supabase.from("procent_attempts").insert({
        user_id: user.id, session_id: sessionId.current, mode: c.mode, level: tier,
        task_kind: task.kind, hint_used: usedHint.current, is_correct: r.correct, streak: p.streak,
      }).then(() => {});
    }
    if (r.correct) { const t = tierOf(p.xp); timer.current = window.setTimeout(() => fresh(focus, t), NEXT_DELAY); }
  };

  const top = tier === DRILL_TIERS - 1;
  const stepValue = top ? TIER_STEP : prog.xp % TIER_STEP;
  const placeholder = c.placeholder(task);

  return (
    <ExerciseShell title="Procent · Mängdträning" progress={{ value: stepValue, total: TIER_STEP, showLabel: false }} sound={sound} showRobot={!tip}>
      <section className="exercise-card rounded-[1.75rem] p-4 sm:p-6">
        {switcher}
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <span className="uppercase tracking-widest">Steg {tier + 1} av {DRILL_TIERS} · {c.focusLabel[focus]}</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-coral" title="Rätt i rad"><Flame className="h-4 w-4" />{prog.streak} i rad</span>
            <span className="flex items-center gap-1" title="Ditt rekord"><Trophy className="h-4 w-4" />{record}</span>
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 items-center gap-4 sm:grid-cols-2 sm:gap-6">
          {c.visual({ task, tier, solved: !!result, focus, choose })}

          <div className="min-w-0 space-y-3">
            <p key={task.question} className="exercise-rise font-orbitron text-2xl font-bold leading-tight text-foreground sm:text-3xl">{task.question}</p>

            <form onSubmit={(e) => { e.preventDefault(); if (result) fresh(focus, tier); else check(); }} className="space-y-2">
              {result && (result.correct ? (
                <div role="status" className="exercise-rise flex items-center gap-3 rounded-2xl border-2 border-[hsl(var(--survey-good))] bg-[hsl(var(--survey-good)/0.12)] px-4 py-2 shadow-lg">
                  <span className="animate-answer-correct flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--survey-good))] text-background"><Check className="h-6 w-6" strokeWidth={3} /></span>
                  <div className="min-w-0">
                    <p className="animate-answer-correct font-orbitron text-2xl font-black leading-none tracking-wide text-[hsl(var(--survey-good))]">RÄTT!</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {newRecord ? `Nytt rekord – ${prog.streak} i rad!` : prog.streak > 1 ? `${prog.streak} i rad` : "Bra!"}
                    </p>
                  </div>
                </div>
              ) : (
                <Feedback key={result.message} correct={false} title={lost >= 2 ? `Sviten stannade på ${lost}` : undefined}>
                  <p className="text-sm">{result.message}</p>
                  <p className="mt-1 text-sm font-semibold">{c.explain(task)}</p>
                </Feedback>
              ))}
              {notice && !result && <p role="status" className="text-sm font-semibold text-coral">{notice}</p>}
              <div className="flex items-stretch gap-2">
                <input id="procent-answer" ref={inputRef} value={answer} autoFocus
                  onChange={(e) => { setAnswer(e.target.value); setNotice(""); }}
                  autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode="decimal" enterKeyHint="done"
                  placeholder={placeholder} readOnly={!!result} aria-label="Svar"
                  className="min-w-0 flex-1 rounded-2xl border-2 border-input bg-background px-3 py-1.5 font-orbitron text-xl text-foreground outline-none transition-colors placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-primary" />
                <Button type="submit" disabled={!answer.trim() && !result} className="h-11 shrink-0 gap-1.5 rounded-2xl px-4 text-sm font-bold">
                  {result ? <>Nästa <ArrowRight className="h-4 w-4" /></> : <>Svara <Check className="h-4 w-4" /></>}
                </Button>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <HintToggle open={tip} onToggle={() => { if (!tip) usedHint.current = true; setTip(!tip); }}>{c.tip(task)}</HintToggle>
                <span className="pt-1 text-xs text-muted-foreground">Komma eller punkt går bra.</span>
              </div>
            </form>
          </div>
        </div>
      </section>
    </ExerciseShell>
  );
}
