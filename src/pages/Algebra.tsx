import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, Option, OptionGroup, ROUND, useExerciseSound } from "@/components/exercise/ExerciseParts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { checkSimplified, checkValue, fmtValues, generateExercise, LEVELS, MODES, type Check as Result, type Mode } from "@/lib/algebra";
import { nextFastStreak, shouldSuggestNextLevel } from "@/lib/algebraEncouragement";

const PRAISE = ["Snyggt!", "Klockrent!", "Grymt jobbat!", "Helt rätt!", "Stabilt!"];

const Algebra = () => {
  const [mode, setMode] = useState<Mode>("simplify");
  const [level, setLevel] = useState(0);
  const [ex, setEx] = useState(() => generateExercise("simplify", 0));
  const [step, setStep] = useState<"simplify" | "value">("simplify");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const [completed, setCompleted] = useState(0);
  const sound = useExerciseSound();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const sessionId = useRef(crypto.randomUUID()); // ett pass = ett sidbesök
  const startedAt = useRef(performance.now());
  const firstTry = useRef(true);
  const fastStreak = useRef(0);
  const suggested = useRef(new Set<string>());
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [profileName, setProfileName] = useState("");
  const displayName = user?.user_metadata?.given_name || user?.user_metadata?.full_name || user?.user_metadata?.name;
  const metadataName = typeof displayName === "string" ? displayName.trim() : "";
  const firstName = (metadataName || profileName).split(/\s+/)[0];

  useEffect(() => {
    let active = true;
    setProfileName("");
    if (user && !metadataName) {
      void supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (active) setProfileName(data?.full_name?.trim() ?? "");
      });
    }
    return () => { active = false; };
  }, [user?.id, metadataName]);

  useEffect(() => { document.title = "Algebra · Mattebo"; }, []);
  useEffect(() => {
    const onHidden = () => { if (document.hidden) { firstTry.current = false; fastStreak.current = 0; } };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  const fresh = (m = mode, l = level) => {
    startedAt.current = performance.now();
    firstTry.current = true;
    setShowSuggestion(false);
    setEx(generateExercise(m, l));
    setStep("simplify");
    setAnswer(""); setResult(null);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };
  const choose = (m: Mode, l: number) => { fastStreak.current = 0; setCompleted(0); setMode(m); setLevel(l); fresh(m, l); };

  const done = result?.correct && (mode !== "both" || step === "value");
  const check = () => {
    if (!answer.trim() || result?.correct) return;
    const r = step === "simplify" ? checkSimplified(ex, answer) : checkValue(ex, answer);
    if (r.correct) r.message = `${PRAISE[Math.floor(Math.random() * PRAISE.length)]} ${r.message}`;
    setResult(r);
    sound.play(r.correct);
    const finished = r.correct && (mode !== "both" || step === "value");
    if (!r.correct) { firstTry.current = false; fastStreak.current = 0; }
    if (finished) {
      fastStreak.current = nextFastStreak(fastStreak.current, firstTry.current, performance.now() - startedAt.current, mode, level);
      const key = `${mode}:${level}`;
      if (shouldSuggestNextLevel(fastStreak.current, mode, level, suggested.current.has(key))) {
        suggested.current.add(key);
        setShowSuggestion(true);
      }
    }
    if (finished || !r.correct) {
      setScore((s) => ({ right: s.right + (finished ? 1 : 0), total: s.total + 1, streak: finished ? s.streak + 1 : 0 }));
      // Logga tyst för lärarens statistik; fel stör aldrig övningen.
      if (user) void supabase.from("algebra_attempts").insert({ user_id: user.id, session_id: sessionId.current, mode, level, is_correct: finished }).then(() => {});
    }
  };
  const next = () => {
    if (mode === "both" && step === "simplify" && result?.correct) { setStep("value"); setAnswer(""); setResult(null); setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0); return; }
    if (!done) fastStreak.current = 0;
    setCompleted((c) => c + 1);
    fresh();
  };

  const prompt = useMemo(() => {
    if (mode === "simplify") return "Förenkla uttrycket";
    return step === "simplify" ? "Steg 1 · Förenkla uttrycket" : "Steg 2 · Beräkna värdet";
  }, [mode, step]);

  const settings = (
    <>
      <OptionGroup label="Övning">
        {MODES.map((m) => (
          <Option key={m.id} active={mode === m.id} onClick={() => choose(m.id, level)}>
            <span className="block font-semibold">{m.title}</span>
            <span className="block text-xs opacity-80">{m.blurb}</span>
          </Option>
        ))}
      </OptionGroup>
      <OptionGroup label="Nivå · rekommenderad ordning 1 → 7, välj fritt">
        {LEVELS[mode].map((l, i) => (
          <Option key={i} active={level === i} onClick={() => choose(mode, i)} title={l.example}>
            <span className="font-bold">{i + 1}</span> {l.name}
          </Option>
        ))}
      </OptionGroup>
    </>
  );

  return (
    <ExerciseShell title="Algebra" current={`${MODES.find((m) => m.id === mode)?.title} · Nivå ${level + 1}`}
      progress={{ value: completed % ROUND, total: ROUND }} sound={sound} settings={settings}>
      <section className="exercise-card rounded-[1.75rem] p-5 sm:p-8">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <span className="uppercase tracking-widest">{prompt}</span>
          <span className="flex items-center gap-3">
            <span>{score.right} rätt av {score.total}</span>
            {score.streak > 1 && <span className="flex items-center gap-1 text-coral"><Flame className="h-4 w-4" />{score.streak}</span>}
          </span>
        </div>

        <div key={ex.expr + step} className="exercise-rise my-6 text-center">
          <div className="break-words font-orbitron text-3xl font-bold text-foreground sm:text-4xl">{ex.expr}</div>
          {mode !== "simplify" && <div className="mt-3 text-lg font-semibold text-coral">när {fmtValues(ex.values)}</div>}
        </div>

        {showSuggestion && (
          <div role="status" className="exercise-rise mb-6 rounded-2xl border-l-4 border-primary bg-primary/10 px-4 py-4">
            <p className="break-words font-orbitron text-lg font-semibold text-foreground">
              {firstName ? `Du ${firstName}, du` : "Du"} verkar ha riktigt bra koll på detta – dags att testa nästa nivå?
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => choose(mode, level + 1)}>
                Nästa nivå <ArrowRight className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={() => fresh()}>Öva vidare</Button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); done ? next() : check(); }} className="space-y-3">
          <label htmlFor="algebra-answer" className="block text-sm font-bold text-foreground">
            {step === "simplify" ? "Förenklat uttryck" : "Värde"}
          </label>
          <input id="algebra-answer" ref={inputRef} value={answer} onChange={(e) => { setAnswer(e.target.value); if (result && !result.correct) setResult(null); }}
            autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode="text" enterKeyHint="done"
            placeholder={step === "simplify" ? "t.ex. 4x + 3y − 2" : "t.ex. 14 eller 5/2"}
            className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 font-orbitron text-2xl text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" />
          <Button type="submit" size="lg" disabled={!answer.trim() && !done} className="h-12 w-full gap-2 rounded-2xl text-base font-bold">
            {done ? <>Nästa uppgift <ArrowRight className="h-5 w-5" /></> : <>Kontrollera svar <Check className="h-5 w-5" /></>}
          </Button>

          {result && (
            <Feedback key={result.message} correct={result.correct}>
              <p>{result.message}{mode === "both" && step === "simplify" && result.correct && " Räkna nu ut värdet."}</p>
            </Feedback>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground">Bråk skrivs som 3/4x. Tecknet − kan skrivas som vanligt minus.</p>
            {!done && (
              <button type="button" onClick={next} className="rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                {mode === "both" && step === "simplify" && result?.correct ? "Fortsätt till steg 2 →" : "Hoppa över →"}
              </button>
            )}
          </div>
        </form>
      </section>
    </ExerciseShell>
  );
};

export default Algebra;
