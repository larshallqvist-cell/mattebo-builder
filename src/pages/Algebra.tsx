import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Flame, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkSimplified, checkValue, fmtValues, generateExercise, LEVELS, MODES, type Check as Result, type Mode } from "@/lib/algebra";

const PRAISE = ["Snyggt!", "Klockrent!", "Grymt jobbat!", "Helt rätt!", "Stabilt!"];

const Algebra = () => {
  const [mode, setMode] = useState<Mode>("simplify");
  const [level, setLevel] = useState(0);
  const [ex, setEx] = useState(() => generateExercise("simplify", 0));
  const [step, setStep] = useState<"simplify" | "value">("simplify");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Algebra · Mattebo"; }, []);

  const fresh = (m = mode, l = level) => {
    setEx(generateExercise(m, l));
    setStep(m === "evaluate" ? "value" : "simplify");
    setAnswer(""); setResult(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const choose = (m: Mode, l: number) => { setMode(m); setLevel(l); fresh(m, l); };

  const done = result?.correct && (mode !== "both" || step === "value");
  const check = () => {
    if (!answer.trim() || done) return;
    const r = step === "simplify" ? checkSimplified(ex, answer) : checkValue(ex, answer);
    if (r.correct) r.message = `${PRAISE[Math.floor(Math.random() * PRAISE.length)]} ${r.message}`;
    setResult(r);
    const finished = r.correct && (mode !== "both" || step === "value");
    if (finished || !r.correct) setScore((s) => ({ right: s.right + (finished ? 1 : 0), total: s.total + 1, streak: finished ? s.streak + 1 : 0 }));
  };
  const next = () => {
    if (mode === "both" && step === "simplify" && result?.correct) { setStep("value"); setAnswer(""); setResult(null); setTimeout(() => inputRef.current?.focus(), 0); return; }
    fresh();
  };

  const prompt = useMemo(() => {
    if (mode === "simplify") return "Förenkla uttrycket";
    if (mode === "evaluate") return "Beräkna uttryckets värde";
    return step === "simplify" ? "Steg 1 · Förenkla uttrycket" : "Steg 2 · Beräkna värdet";
  }, [mode, step]);

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
          <h1 className="font-orbitron text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Algebra<span className="text-accent">.</span></h1>
          <p className="font-nunito text-muted-foreground">Välj övning och nivå. Nya uppgifter skapas hela tiden.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => choose(m.id, level)} aria-pressed={mode === m.id}
              className={cn("rounded-2xl border p-4 text-left transition-all",
                mode === m.id ? "border-accent bg-accent/15 shadow-lg" : "border-primary/20 bg-secondary/40 hover:border-primary/50")}>
              <div className="font-orbitron text-sm font-semibold text-foreground">{m.title}</div>
              <div className="mt-1 font-nunito text-xs text-muted-foreground">{m.blurb}</div>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 font-nunito text-xs text-muted-foreground">Nivå · rekommenderad ordning 1 → 7, välj fritt</p>
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

          <div className="my-6 text-center">
            <div className="font-orbitron text-3xl font-semibold text-foreground sm:text-4xl break-words">{ex.expr}</div>
            {mode !== "simplify" && <div className="mt-3 font-nunito text-lg text-accent">när {fmtValues(ex.values)}</div>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); done ? next() : check(); }} className="space-y-3">
            <label htmlFor="algebra-answer" className="font-nunito text-sm text-muted-foreground">
              {step === "simplify" ? "Förenklat uttryck" : "Värde"}
            </label>
            <input id="algebra-answer" ref={inputRef} value={answer} onChange={(e) => { setAnswer(e.target.value); if (result && !result.correct) setResult(null); }}
              autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode={step === "value" ? "text" : "text"}
              placeholder={step === "simplify" ? "t.ex. 4x + 3y − 2" : "t.ex. 14 eller 5/2"}
              className="w-full rounded-xl border border-primary/30 bg-background/60 px-4 py-3 font-orbitron text-xl text-foreground outline-none focus:border-accent" />
            <p className="font-nunito text-xs text-muted-foreground">Bråk skrivs som 3/4x. Tecknet − kan skrivas som vanligt minus.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!answer.trim() && !done} className="gap-2" >
                {done ? <>Nästa uppgift <ArrowRight className="h-4 w-4" /></> : <>Kontrollera svar <Check className="h-4 w-4" /></>}
              </Button>
              {!done && (
                <Button type="button" variant="outline" onClick={next} className="gap-2">
                  {mode === "both" && step === "simplify" && result?.correct ? "Fortsätt till steg 2" : "Nästa uppgift"} <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {result && (
            <div role="status" className={cn("mt-5 flex items-start gap-3 rounded-xl border p-4 font-nunito",
              result.correct ? "border-accent/50 bg-accent/15 text-foreground" : "border-destructive/50 bg-destructive/10 text-foreground")}>
              {result.correct ? <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> : <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
              <p>{result.message}{mode === "both" && step === "simplify" && result.correct && " Räkna nu ut värdet."}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Algebra;
