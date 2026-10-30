import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PercentTriangle from "@/components/procent/PercentTriangle";
import BarModel from "@/components/procent/BarModel";
import ChangeBar from "@/components/procent/ChangeBar";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, HintToggle, highlightNumbers, Option, OptionGroup, ROUND, useExerciseSound } from "@/components/exercise/ExerciseParts";
import {
  checkFactor, checkNewValue, checkTriangle, fmt, fmtDec, generateChange, generateTriangle,
  type ChangeLevel, type ChangeTask, type Check as Result, type Support, type TriangleTask,
} from "@/lib/procent";

type Mode = "triangel" | "faktor";
const MODES: { id: Mode; title: string; blurb: string }[] = [
  { id: "triangel", title: "Andelen, Delen och Det hela", blurb: "Sök andelen, delen eller det hela." },
  { id: "faktor", title: "Förändringsfaktor", blurb: "Ökning och minskning – faktor och nytt värde." },
];
const LEVELS: Record<Mode, { name: string; example: string }[]> = {
  triangel: [
    { name: "Modellerna visar vägen", example: "Triangeln och stapeln visas, rätt räknesätt markeras" },
    { name: "Modeller som ledtråd", example: "Visa triangeln och stapeln när du vill" },
    { name: "Utan modeller", example: "Räkna helt på egen hand" },
  ],
  faktor: [
    { name: "Ökning", example: "t.ex. +25 % → 1,25" },
    { name: "Minskning", example: "t.ex. −25 % → 0,75" },
    { name: "Blandat", example: "Både ökning och minskning" },
  ],
};

/** Rätt-meningen i elevens språk, t.ex. "70 % av 50 g är 35 g." */
const rightLine = (t: TriangleTask) => {
  const u = (n: number) => `${fmt(n)} ${t.unit}`;
  if (t.kind === "delen") return `${t.rate} % av ${u(t.whole)} är ${u(t.part)}.`;
  if (t.kind === "andel") return `${u(t.part)} av ${u(t.whole)} är ${t.rate} %.`;
  return `${t.rate} % är ${u(t.part)}, så det hela är ${u(t.whole)}.`;
};
const triangleTip = (t: TriangleTask) => t.kind === "andel"
  ? "Tips: Andelen = Delen ÷ Det hela"
  : t.kind === "delen" ? `Tips: ${t.rate} % = ${fmtDec(t.rate / 100)}`
  : `Tips: ${t.rate} % = ${fmtDec(t.rate / 100)}. Dela ${fmt(t.part)} med ${fmtDec(t.rate / 100)}.`;
const changeTip = (c: ChangeTask, step: "factor" | "value") => step === "factor"
  ? `Tips: 100 % ${c.percent > 0 ? "+" : "−"} ${Math.abs(c.percent)} % = ${100 + c.percent} % = ?`
  : `Tips: Nytt värde = ${fmt(c.original)} · förändringsfaktorn`;

const Procent = () => {
  const [mode, setMode] = useState<Mode>("triangel");
  const [level, setLevel] = useState(0);
  const [tri, setTri] = useState<TriangleTask>(() => generateTriangle());
  const [chg, setChg] = useState<ChangeTask>(() => generateChange(0));
  const [step, setStep] = useState<"factor" | "value">("factor");
  const [models, setModels] = useState(false);
  const [tip, setTip] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const [completed, setCompleted] = useState(0);
  const missed = useRef(false);
  const usedHint = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const sound = useExerciseSound();
  const sessionId = useRef(crypto.randomUUID()); // ett pass = ett sidbesök

  useEffect(() => { document.title = "Procent · Mattebo"; }, []);

  const focus = () => setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  const fresh = (m = mode, l = level) => {
    if (m === "triangel") setTri((prev) => { let t = generateTriangle(); for (let i = 0; i < 5 && t.text === prev.text; i++) t = generateTriangle(); return t; });
    else setChg(generateChange(l as ChangeLevel));
    setStep("factor"); setModels(false); setTip(false); setAnswer(""); setResult(null); missed.current = false; usedHint.current = false; focus();
  };
  const choose = (m: Mode, l: number) => { setMode(m); setLevel(l); setCompleted(0); fresh(m, l); };

  const done = !!result?.correct && (mode === "triangel" || step === "value");
  const check = () => {
    if (!answer.trim() || result?.correct) return;
    const r = mode === "triangel" ? checkTriangle(tri, answer) : step === "factor" ? checkFactor(chg, answer) : checkNewValue(chg, answer);
    setResult(r);
    sound.play(r.correct);
    const finished = r.correct && (mode === "triangel" || step === "value");
    // Logga tyst för lärarens statistik: varje fel svar och varje färdig uppgift. Fel stör aldrig övningen.
    if (user && (finished || !r.correct)) {
      void supabase.from("procent_attempts").insert({
        user_id: user.id, session_id: sessionId.current, mode, level,
        task_kind: mode === "triangel" ? tri.kind : chg.percent > 0 ? "okning" : "minskning",
        hint_used: mode === "triangel" && usedHint.current, is_correct: finished,
      }).then(() => {});
    }
    if (!r.correct) { missed.current = true; setScore((s) => ({ ...s, total: s.total + 1, streak: 0 })); return; }
    if (finished) {
      setScore((s) => ({ right: s.right + (missed.current ? 0 : 1), total: s.total + (missed.current ? 0 : 1), streak: missed.current ? 0 : s.streak + 1 }));
    }
  };
  const next = () => {
    if (mode === "faktor" && step === "factor" && result?.correct) { setStep("value"); setAnswer(""); setResult(null); setTip(false); focus(); return; }
    if (!done) setScore((s) => ({ ...s, streak: 0 }));
    setCompleted((c) => c + 1);
    fresh();
  };

  const support = level as Support;
  const showModels = mode === "triangel" && (support === 0 || (support === 1 && models));
  const prompt = mode === "triangel"
    ? tri.kind === "andel" ? "Sök andelen" : tri.kind === "delen" ? "Sök delen" : "Sök det hela"
    : step === "factor" ? "Steg 1 · Förändringsfaktorn" : "Steg 2 · Det nya värdet";
  const label = mode === "triangel" ? (tri.kind === "andel" ? "Svar (%)" : `Svar (${tri.unit})`) : step === "factor" ? "Förändringsfaktor" : `Nytt värde (${chg.unit})`;
  const placeholder = mode === "triangel"
    ? (tri.kind === "andel" ? "t.ex. 35" : `t.ex. ${fmt(Math.round(tri.whole * 0.7) || 35)}`)
    : step === "factor" ? "t.ex. 1,25 eller 0,8" : "t.ex. 960";
  const question = mode === "triangel" ? tri.question : step === "factor" ? "Vilken är förändringsfaktorn?" : "Vad blir det nya värdet?";
  const roundPos = completed % ROUND;
  const toggleTip = () => { if (!tip && mode === "triangel") usedHint.current = true; setTip(!tip); };

  const settings = (
    <>
      <OptionGroup label="Övning">
        {MODES.map((m) => (
          <Option key={m.id} active={mode === m.id} onClick={() => choose(m.id, 0)}>
            <span className="block font-semibold">{m.title}</span>
            <span className="block text-xs opacity-80">{m.blurb}</span>
          </Option>
        ))}
      </OptionGroup>
      <OptionGroup label="Nivå · välj fritt">
        {LEVELS[mode].map((l, i) => (
          <Option key={i} active={level === i} onClick={() => choose(mode, i)} title={l.example}>
            <span className="font-bold">{i + 1}</span> {l.name}
          </Option>
        ))}
      </OptionGroup>
    </>
  );

  return (
    <ExerciseShell title="Procent" current={`${MODES.find((m) => m.id === mode)!.title} · Nivå ${level + 1}`}
      progress={{ value: roundPos, total: ROUND }} sound={sound} settings={settings} showRobot={!tip}>
      <section className="exercise-card rounded-[1.75rem] p-5 sm:p-8">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <span className="uppercase tracking-widest">{prompt}</span>
          <span className="flex items-center gap-3">
            <span>{score.right} rätt</span>
            {score.streak > 1 && <span className="flex items-center gap-1 text-coral"><Flame className="h-4 w-4" />{score.streak}</span>}
          </span>
        </div>

        <div key={mode === "triangel" ? tri.text : chg.text + step} className="exercise-rise mt-4 space-y-2">
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">{highlightNumbers(mode === "triangel" ? tri.text : chg.text)}</p>
          <p className="font-orbitron text-2xl font-bold leading-tight text-foreground sm:text-3xl">{question}</p>
        </div>

        {mode === "triangel" && support === 1 && (
          <Button type="button" variant="outline" size="sm" className="mt-4 gap-2"
            onClick={() => { if (!models) usedHint.current = true; setModels(!models); }}>
            {models ? <><EyeOff className="h-4 w-4" /> Dölj modellerna</> : <><Eye className="h-4 w-4" /> Visa stapel och triangel</>}
          </Button>
        )}
        {showModels && (
          <div className="exercise-rise mt-5 grid items-center gap-4 sm:grid-cols-2">
            <BarModel task={tri} solved={!!result?.correct} />
            <PercentTriangle task={tri} marked={support === 0} solved={!!result?.correct} />
          </div>
        )}
        {mode === "faktor" && <div className="mt-5"><ChangeBar task={chg} factorKnown={step === "value"} valueKnown={done} /></div>}

        <form onSubmit={(e) => { e.preventDefault(); if (result?.correct) next(); else check(); }} className="mt-6 space-y-3">
          <label htmlFor="procent-answer" className="block text-sm font-bold text-foreground">{label}</label>
          <input id="procent-answer" ref={inputRef} value={answer}
            onChange={(e) => { setAnswer(e.target.value); if (result && !result.correct) setResult(null); }}
            autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode="decimal" enterKeyHint="done" placeholder={placeholder}
            readOnly={!!result?.correct}
            className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 font-orbitron text-2xl text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" />
          <Button type="submit" size="lg" disabled={!answer.trim() && !result?.correct} className="h-12 w-full gap-2 rounded-2xl text-base font-bold">
            {done ? <>Nästa uppgift <ArrowRight className="h-5 w-5" /></>
              : result?.correct ? <>Fortsätt till steg 2 <ArrowRight className="h-5 w-5" /></>
              : <>Kontrollera svar <Check className="h-5 w-5" /></>}
          </Button>

          {result && (
            <Feedback key={result.message} correct={result.correct}>
              {result.correct ? (
                mode === "triangel" ? <><p className="font-semibold">{rightLine(tri)}</p><p className="mt-1 text-sm text-muted-foreground">{result.message}</p></>
                  : <p>{result.message}{step === "factor" && " Räkna nu ut det nya värdet."}</p>
              ) : <p>{result.message} {!tip && "Ta gärna hjälp av tipset nedan."}</p>}
            </Feedback>
          )}

          <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
            <HintToggle open={tip} onToggle={toggleTip}>{mode === "triangel" ? triangleTip(tri) : changeTip(chg, step)}</HintToggle>
            {!result?.correct && (
              <button type="button" onClick={next} className="rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                Hoppa över →
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Decimaltal kan skrivas med komma eller punkt.</p>
        </form>
      </section>
    </ExerciseShell>
  );
};

export default Procent;
