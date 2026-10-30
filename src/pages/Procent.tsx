import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PercentTriangle from "@/components/procent/PercentTriangle";
import ChangeBar from "@/components/procent/ChangeBar";
import {
  checkFactor, checkNewValue, checkTriangle, generateChange, generateTriangle,
  type ChangeLevel, type ChangeTask, type Check as Result, type Support, type TriangleTask,
} from "@/lib/procent";

type Mode = "triangel" | "faktor";
const MODES: { id: Mode; title: string; blurb: string }[] = [
  { id: "triangel", title: "Andelen, Delen och Det hela", blurb: "Procenttriangeln – sök andelen, delen eller det hela." },
  { id: "faktor", title: "Förändringsfaktor", blurb: "Ökning och minskning – faktor och nytt värde." },
];
const LEVELS: Record<Mode, { name: string; example: string }[]> = {
  triangel: [
    { name: "Triangeln visar vägen", example: "Triangeln och rätt räknesätt markeras" },
    { name: "Triangel som ledtråd", example: "Visa triangeln när du vill" },
    { name: "Utan triangel", example: "Räkna helt på egen hand" },
  ],
  faktor: [
    { name: "Ökning", example: "t.ex. +25 % → 1,25" },
    { name: "Minskning", example: "t.ex. −25 % → 0,75" },
    { name: "Blandat", example: "Både ökning och minskning" },
  ],
};
const PRAISE = ["Snyggt!", "Klockrent!", "Grymt jobbat!", "Helt rätt!", "Stabilt!"];
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

const Procent = () => {
  const [mode, setMode] = useState<Mode>("triangel");
  const [level, setLevel] = useState(0);
  const [tri, setTri] = useState<TriangleTask>(() => generateTriangle());
  const [chg, setChg] = useState<ChangeTask>(() => generateChange(0));
  const [step, setStep] = useState<"factor" | "value">("factor");
  const [hint, setHint] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const missed = useRef(false);
  const usedHint = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const sessionId = useRef(crypto.randomUUID()); // ett pass = ett sidbesök

  useEffect(() => { document.title = "Procent · Mattebo"; }, []);

  const focus = () => setTimeout(() => inputRef.current?.focus(), 0);
  const fresh = (m = mode, l = level) => {
    if (m === "triangel") setTri((prev) => { let t = generateTriangle(); for (let i = 0; i < 5 && t.text === prev.text; i++) t = generateTriangle(); return t; });
    else setChg(generateChange(l as ChangeLevel));
    setStep("factor"); setHint(false); setAnswer(""); setResult(null); missed.current = false; usedHint.current = false; focus();
  };
  const choose = (m: Mode, l: number) => { setMode(m); setLevel(l); fresh(m, l); };

  const done = !!result?.correct && (mode === "triangel" || step === "value");
  const check = () => {
    if (!answer.trim() || result?.correct) return;
    const r = mode === "triangel" ? checkTriangle(tri, answer) : step === "factor" ? checkFactor(chg, answer) : checkNewValue(chg, answer);
    if (r.correct) r.message = `${praise()} ${r.message}`;
    setResult(r);
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
    if (mode === "triangel" || step === "value") {
      setScore((s) => ({ right: s.right + (missed.current ? 0 : 1), total: s.total + (missed.current ? 0 : 1), streak: missed.current ? 0 : s.streak + 1 }));
    }
  };
  const next = () => {
    if (mode === "faktor" && step === "factor" && result?.correct) { setStep("value"); setAnswer(""); setResult(null); focus(); return; }
    if (!done) setScore((s) => ({ ...s, streak: 0 }));
    fresh();
  };

  const support = level as Support;
  const showTriangle = mode === "triangel" && (support === 0 || (support === 1 && hint));
  const prompt = mode === "triangel"
    ? tri.kind === "andel" ? "Sök andelen" : tri.kind === "delen" ? "Sök delen" : "Sök det hela"
    : step === "factor" ? "Steg 1 · Förändringsfaktorn" : "Steg 2 · Det nya värdet";
  const label = mode === "triangel" ? (tri.kind === "andel" ? "Andelen i procent" : `Svar (${tri.unit})`) : step === "factor" ? "Förändringsfaktor" : `Nytt värde (${chg.unit})`;
  const placeholder = mode === "triangel" ? (tri.kind === "andel" ? "t.ex. 35 %" : "t.ex. 120") : step === "factor" ? "t.ex. 1,25 eller 0,8" : "t.ex. 960";

  return (
    <div className="min-h-screen px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 font-nunito text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Mattebo
          </Link>
          <span className="rounded-full border border-accent/40 px-3 py-1 font-nunito text-xs tracking-widest text-accent">ÅK 7–9</span>
        </header>

        <div className="space-y-1">
          <h1 className="font-orbitron text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Procent<span className="text-accent">.</span></h1>
          <p className="font-nunito text-muted-foreground">Välj övning och nivå. Nya uppgifter skapas hela tiden.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => choose(m.id, 0)} aria-pressed={mode === m.id}
              className={cn("rounded-2xl border p-4 text-left transition-all",
                mode === m.id ? "border-accent bg-accent/15 shadow-lg" : "border-primary/20 bg-secondary/40 hover:border-primary/50")}>
              <div className="font-orbitron text-sm font-semibold text-foreground">{m.title}</div>
              <div className="mt-1 font-nunito text-xs text-muted-foreground">{m.blurb}</div>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 font-nunito text-xs text-muted-foreground">Nivå · välj fritt</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LEVELS[mode].map((l, i) => (
              <button key={i} onClick={() => choose(mode, i)} aria-pressed={level === i} title={l.example}
                className={cn("shrink-0 rounded-xl border px-3 py-2 text-left font-nunito text-xs transition-colors",
                  level === i ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-secondary/40 text-foreground hover:border-primary/50")}>
                <span className="font-bold">{i + 1}</span> {l.name}
              </button>
            ))}
          </div>
        </div>

        <section className="rounded-[2rem] border border-primary/25 bg-secondary/50 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <div className="flex items-center justify-between font-nunito text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">{prompt}</span>
            <span className="flex items-center gap-3">
              <span>{score.right} rätt av {score.total}</span>
              {score.streak > 1 && <span className="flex items-center gap-1 text-accent"><Flame className="h-4 w-4" />{score.streak}</span>}
            </span>
          </div>

          <div className="my-6 space-y-5 text-center">
            <p className="font-nunito text-lg text-foreground sm:text-xl">{mode === "triangel" ? tri.text : chg.text}</p>
            <p className="font-orbitron text-2xl font-semibold text-foreground sm:text-3xl">
              {mode === "triangel" ? tri.question : step === "factor" ? "Vilken är förändringsfaktorn?" : "Vad blir det nya värdet?"}
            </p>

            {mode === "triangel" && support === 1 && (
              <Button type="button" variant="outline" size="sm" onClick={() => { if (!hint) usedHint.current = true; setHint(!hint); }} className="gap-2">
                {hint ? <><EyeOff className="h-4 w-4" /> Dölj triangeln</> : <><Eye className="h-4 w-4" /> Visa triangeln som ledtråd</>}
              </Button>
            )}
            {showTriangle && <PercentTriangle task={tri} marked solved={!!result?.correct} />}
            {mode === "faktor" && <ChangeBar task={chg} factorKnown={step === "value"} valueKnown={done} />}

            {result && (
              <div key={result.message} role="status">
                <div className={cn("font-orbitron text-4xl font-bold sm:text-5xl", result.correct ? "animate-answer-correct text-[hsl(var(--survey-good))]" : "text-destructive")}>
                  {result.correct ? "RÄTT!" : "Inte riktigt"}
                </div>
                <p className="mt-2 font-nunito text-base text-foreground">{result.message}{mode === "faktor" && step === "factor" && result.correct && " Räkna nu ut det nya värdet."}</p>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (done) next(); else if (result?.correct) next(); else check(); }} className="space-y-3">
            <label htmlFor="procent-answer" className="font-nunito text-sm text-muted-foreground">{label}</label>
            <input id="procent-answer" ref={inputRef} value={answer}
              onChange={(e) => { setAnswer(e.target.value); if (result && !result.correct) setResult(null); }}
              autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode="decimal" placeholder={placeholder}
              readOnly={!!result?.correct}
              className="w-full rounded-xl border border-primary/30 bg-background/60 px-4 py-3 font-orbitron text-xl text-foreground outline-none focus:border-accent" />
            <p className="font-nunito text-xs text-muted-foreground">Decimaltal kan skrivas med komma eller punkt.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!answer.trim() && !result?.correct} className="gap-2">
                {done ? <>Nästa uppgift <ArrowRight className="h-4 w-4" /></>
                  : result?.correct ? <>Fortsätt till steg 2 <ArrowRight className="h-4 w-4" /></>
                  : <>Kontrollera svar <Check className="h-4 w-4" /></>}
              </Button>
              {!result?.correct && (
                <Button type="button" variant="outline" onClick={next} className="gap-2">Nästa uppgift <ArrowRight className="h-4 w-4" /></Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Procent;
