import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Check, FlaskConical, Flame, Medal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CalculatorModal from "@/components/CalculatorModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, HintToggle, useExerciseSound } from "@/components/exercise/ExerciseParts";
import Leaderboard from "@/components/procent/Leaderboard";
import BrakIntro from "@/components/brak/BrakIntro";
import { FracBars, QuestionText } from "@/components/brak/FracView";
import {
  advance, BANOR, checkBrak, explainBrak, FOCUS_LABEL, FREE_WARNINGS, generateBrak, placeholderBrak, scoreAnswer,
  showPictures, START, TIER_STEP, TIERS, tierOf, tipBrak, type CheckResult, type Focus, type Progress,
} from "@/lib/brak";

const FOCUSES: Focus[] = [...BANOR, "mix"];
const NEXT_DELAY = 1100;
const progKey = (f: Focus) => `brak-drill-${f}`;
const loadProg = (f: Focus): Progress => {
  try { const p = JSON.parse(sessionStorage.getItem(progKey(f)) ?? "null"); if (p && Number.isFinite(p.xp)) return { ...START, ...p }; } catch { /* */ }
  return START;
};
const warnKey = (uid?: string) => `brak-warnings-${uid ?? "anon"}`;

/** Bråkträning: oändliga uppgifter i sex banor med svit, poäng och topplista. */
const BrakTraning = () => {
  const { user, isAdmin } = useAuth();
  const [focus, setFocus] = useState<Focus>(() => (sessionStorage.getItem("brak-focus") as Focus) || "mix");
  const [prog, setProg] = useState(() => loadProg(focus));
  const tier = tierOf(prog.xp);
  const [task, setTask] = useState(() => generateBrak(focus, tier));
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<(CheckResult & { points: number; warning: boolean }) | null>(null);
  const [lost, setLost] = useState(0);
  const [tip, setTip] = useState(false);
  const [record, setRecord] = useState(0);
  const [calcOpen, setCalcOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [warnings, setWarnings] = useState(() => { try { return Number(localStorage.getItem(warnKey(user?.id)) ?? 0) || 0; } catch { return 0; } });
  const usedHint = useRef(false);
  const usedCalc = useRef(false);
  const timer = useRef<number>();
  const inputRef = useRef<HTMLInputElement>(null);
  const sound = useExerciseSound();
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => { document.title = "Bråkträning · Mattebo"; return () => window.clearTimeout(timer.current); }, []);
  useEffect(() => { try { sessionStorage.setItem(progKey(focus), JSON.stringify(prog)); sessionStorage.setItem("brak-focus", focus); } catch { /* */ } }, [prog, focus]);
  useEffect(() => { try { localStorage.setItem(warnKey(user?.id), String(warnings)); } catch { /* */ } }, [warnings, user?.id]);
  useEffect(() => {
    if (!user) return;
    void supabase.from("brak_attempts").select("streak_points").eq("user_id", user.id).order("streak_points", { ascending: false }).limit(1)
      .then(({ data }) => setRecord((r) => Math.max(r, Number(data?.[0]?.streak_points ?? 0))));
  }, [user]);

  const focusInput = () => setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  const fresh = (f: Focus, t: number) => {
    window.clearTimeout(timer.current);
    setTask((prev) => generateBrak(f, t, Math.random, prev));
    setAnswer(""); setResult(null); setNotice(""); setTip(false); usedHint.current = false; usedCalc.current = false; focusInput();
  };
  const choose = (f: Focus) => { const p = loadProg(f); setFocus(f); setProg(p); fresh(f, tierOf(p.xp)); };

  const check = () => {
    if (!answer.trim() || result) return;
    const r = checkBrak(task, answer);
    if (!r) { setNotice("Skriv t.ex. 3/4, 1 3/4 eller 12."); return; }
    const s = r.correct ? scoreAnswer(tier, r.unsimplified, warnings, usedCalc.current) : { points: 0, warning: false };
    if (s.warning) setWarnings((w) => w + 1);
    const p = advance(prog, r.correct, s.points);
    setResult({ ...r, ...s }); setProg(p); setLost(r.correct ? 0 : prog.streak);
    sound.play(r.correct);
    if (p.streakPoints > record) setRecord(p.streakPoints);
    if (user) {
      void supabase.from("brak_attempts").insert({
        user_id: user.id, session_id: sessionId.current, mode: focus, level: tier, task_kind: task.kind, is_correct: r.correct,
        points: s.points, unsimplified: r.unsimplified, calculator_used: usedCalc.current, hint_used: usedHint.current,
        streak: p.streak, streak_points: p.streakPoints,
      }).then(() => {});
    }
    if (r.correct && !r.unsimplified) timer.current = window.setTimeout(() => fresh(focus, tierOf(p.xp)), NEXT_DELAY);
  };

  const top = tier === TIERS - 1;
  const pics = showPictures(tier) && task.pictures.length > 0;
  const fmtP = (n: number) => n.toLocaleString("sv-SE");
  const correctLine = result?.correct
    ? result.points < 1 ? `${fmtP(result.points)} poäng${usedCalc.current && tier <= 2 ? " (miniräknare)" : ""}`
    : result.warning ? `Varning ${warnings} av ${FREE_WARNINGS}: förkorta ditt svar!` : prog.streak > 1 ? `${prog.streak} i rad · ${fmtP(prog.streakPoints)} p` : "Bra!"
    : "";

  return (
    <>
      <BrakIntro />
      <ExerciseShell title="Bråkträning" progress={{ value: top ? TIER_STEP : prog.xp % TIER_STEP, total: TIER_STEP, showLabel: false }} sound={sound} showRobot={!tip}>
        <section className="exercise-card rounded-[1.75rem] p-4 sm:p-6">
          <div role="tablist" aria-label="Välj bana" className="flex flex-wrap justify-center gap-1.5">
            {FOCUSES.map((f) => (
              <button key={f} type="button" role="tab" aria-selected={focus === f} onClick={() => choose(f)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-colors sm:text-sm",
                  focus === f ? "bg-primary text-primary-foreground shadow" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                {FOCUS_LABEL[f]}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-widest">Steg {tier + 1} av {TIERS}</span>
            <span className="flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => { usedCalc.current = true; setCalcOpen(true); }} aria-label="Miniräknare"
                title={tier <= 2 ? "Miniräknare – halverar poängen på steg 1–3" : "Miniräknare"}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-input bg-background text-foreground transition-colors hover:border-primary hover:text-primary">
                <Calculator className="h-4 w-4" />
              </button>
              <span className="flex items-center gap-1 text-coral" title="Rätt i rad"><Flame className="h-4 w-4" />{prog.streak} i rad</span>
              <span className="flex items-center gap-1" title="Ditt rekord (poäng i en svit)"><Trophy className="h-4 w-4" />{fmtP(record)}</span>
              <button type="button" onClick={() => setBoardOpen(true)} aria-label="Topplista"
                className="flex h-7 shrink-0 items-center gap-1 rounded-full border border-input bg-background px-2 text-foreground transition-colors hover:border-primary hover:text-primary">
                <Medal className="h-4 w-4" /><span className="hidden sm:inline">Topplista</span>
              </button>
            </span>
          </div>

          <div className={cn("mt-4 grid grid-cols-1 items-center gap-4", pics && "sm:grid-cols-2 sm:gap-6")}>
            {pics && (
              <div className="space-y-3" aria-hidden="true">
                {task.pictures.map((f, i) => <FracBars key={i} f={f} tone={i % 2} />)}
              </div>
            )}
            <div className="min-w-0 space-y-3">
              <p key={task.question} className="exercise-rise font-orbitron text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                <QuestionText tokens={task.tokens} />
              </p>
              <form onSubmit={(e) => { e.preventDefault(); if (result) fresh(focus, tier); else check(); }} className="space-y-2">
                {result && (result.correct ? (
                  <div role="status" className="exercise-rise flex items-center gap-3 rounded-2xl border-2 border-[hsl(var(--survey-good))] bg-[hsl(var(--survey-good)/0.12)] px-4 py-2 shadow-lg">
                    <span className="animate-answer-correct flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--survey-good))] text-background"><Check className="h-6 w-6" strokeWidth={3} /></span>
                    <div className="min-w-0">
                      <p className="animate-answer-correct font-orbitron text-2xl font-black leading-none tracking-wide text-[hsl(var(--survey-good))]">RÄTT!</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{correctLine}</p>
                      {result.unsimplified && <p className="text-xs text-muted-foreground">{result.message.replace(/^Rätt! /, "")}</p>}
                    </div>
                  </div>
                ) : (
                  <Feedback key={result.message} correct={false} title={lost >= 2 ? `Sviten stannade på ${lost}` : undefined}>
                    <p className="text-sm">{result.message}</p>
                    <p className="mt-1 text-sm font-semibold">{explainBrak(task)}</p>
                  </Feedback>
                ))}
                {notice && !result && <p role="status" className="text-sm font-semibold text-coral">{notice}</p>}
                <div className="flex items-stretch gap-2">
                  <input ref={inputRef} value={answer} autoFocus onChange={(e) => { setAnswer(e.target.value); setNotice(""); }}
                    autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode="text" enterKeyHint="done"
                    placeholder={placeholderBrak(task)} readOnly={!!result} aria-label="Svar"
                    className="min-w-0 flex-1 rounded-2xl border-2 border-input bg-background px-3 py-1.5 font-orbitron text-xl text-foreground outline-none transition-colors placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-primary" />
                  <Button type="submit" disabled={!answer.trim() && !result} className="h-11 shrink-0 gap-1.5 rounded-2xl px-4 text-sm font-bold">
                    {result ? <>Nästa <ArrowRight className="h-4 w-4" /></> : <>Svara <Check className="h-4 w-4" /></>}
                  </Button>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <HintToggle open={tip} onToggle={() => { if (!tip) usedHint.current = true; setTip(!tip); }}>{tipBrak(task)}</HintToggle>
                  <span className="pt-1 text-xs text-muted-foreground">Skriv bråk med snedstreck: 3/4. Blandad form: 1 3/4.</span>
                </div>
              </form>
            </div>
          </div>
          {isAdmin && (
            <div className="mt-4 text-right">
              <Link to="/braklabbet?lab=1" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <FlaskConical className="h-3.5 w-3.5" />Gamla Bråklabbet (bara du)
              </Link>
            </div>
          )}
        </section>
        <CalculatorModal open={calcOpen} onOpenChange={setCalcOpen} />
        <Leaderboard rpc="brak_leaderboard" title="Bråkträning" description="Poäng i längsta sviten." open={boardOpen} onOpenChange={setBoardOpen} />
      </ExerciseShell>
    </>
  );
};

export default BrakTraning;
