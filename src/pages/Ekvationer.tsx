import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, HintToggle, Option, OptionGroup, ROUND, useExerciseSound } from "@/components/exercise/ExerciseParts";
import { PuzzleLine, symbolName } from "@/components/ekvationer/PuzzleFigure";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { checkAnswer, explain, generatePuzzle, LEVELS, type Puzzle, type Result, type Theme } from "@/lib/ekvationer";

const PRAISE = ["Snyggt löst!", "Pusselmästare!", "Klockrent!", "Grymt!", "Helt rätt!"];
const THEMES: { id: Theme; title: string; blurb: string }[] = [
  { id: "djur", title: "Djur & Frukt", blurb: "🐮 🍌 🍕 🍦" },
  { id: "profiler", title: "Profiler & Kändisar", blurb: "Zlatan, Kungen, Carola, Taylor – och Magdalena" },
];
const BEST_KEY = "mattebo:ekvationer-best";

const Ekvationer = () => {
  const [theme, setTheme] = useState<Theme>("djur");
  const [level, setLevel] = useState(0);
  const [p, setP] = useState<Puzzle>(() => generatePuzzle(0, "djur"));
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [tip, setTip] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } });
  const [completed, setCompleted] = useState(0);
  const missed = useRef(false);
  const usedHint = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(crypto.randomUUID());
  const sound = useExerciseSound();
  const { user } = useAuth();

  useEffect(() => { document.title = "Ekvationspusslet · Mattebo"; }, []);

  const fresh = (l = level, t = theme) => {
    setP(generatePuzzle(l, t));
    setAnswer(""); setResult(null); setTip(false); missed.current = false; usedHint.current = false;
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };
  const choose = (l: number, t: Theme) => { setLevel(l); setTheme(t); setCompleted(0); fresh(l, t); };

  const log = (isCorrect: boolean) => {
    if (user) void supabase.from("ekvation_attempts").insert({
      user_id: user.id, session_id: sessionId.current, theme, level, hint_used: usedHint.current, is_correct: isCorrect,
    }).then(() => {});
  };

  const done = !!result?.correct;
  const check = () => {
    if (!answer.trim() || done) return;
    const r = checkAnswer(p, answer);
    if (r.correct) r.message = `${PRAISE[Math.floor(Math.random() * PRAISE.length)]} ${r.message}`;
    setResult(r);
    if (!/\d/.test(answer)) return; // bara formatfel – räknas inte
    sound.play(r.correct);
    if (r.correct) {
      const firstTry = !missed.current;
      setScore((s) => {
        const streak = firstTry ? s.streak + 1 : 0;
        if (streak > best) { setBest(streak); try { localStorage.setItem(BEST_KEY, String(streak)); } catch { /* privat läge */ } }
        return { right: s.right + (firstTry ? 1 : 0), total: s.total + 1, streak };
      });
    } else {
      if (!missed.current) setScore((s) => ({ ...s, streak: 0 }));
      missed.current = true;
    }
    log(r.correct);
  };
  const next = () => { setCompleted((c) => c + 1); fresh(); };

  const variables = level === 3;
  const name = (s: number) => symbolName(p.symbols[s]);
  const first = p.symbols[0];

  const settings = (
    <>
      <OptionGroup label="Tema">
        {THEMES.map((t) => (
          <Option key={t.id} active={theme === t.id} onClick={() => choose(level, t.id)}>
            <span className="block font-semibold">{t.title}</span>
            <span className="block text-xs opacity-80">{t.blurb}</span>
          </Option>
        ))}
      </OptionGroup>
      <OptionGroup label="Nivå · rekommenderad ordning 1 → 4">
        {LEVELS.map((l, i) => (
          <Option key={i} active={level === i} onClick={() => choose(i, theme)} title={l.blurb}>
            <span className="font-bold">{i + 1}</span> {l.name}
          </Option>
        ))}
      </OptionGroup>
      {variables && <p className="text-xs text-muted-foreground">På nivå 4 byts figurerna mot x, y och z, oavsett tema.</p>}
    </>
  );

  return (
    <ExerciseShell title="Ekvationspusslet" current={`${variables ? "x, y och z" : THEMES.find((t) => t.id === theme)?.title} · Nivå ${level + 1}`}
      progress={{ value: completed % ROUND, total: ROUND }} sound={sound} settings={settings}>
      <section className="exercise-card rounded-[1.75rem] p-4 sm:p-8">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <span className="uppercase tracking-widest">Vad är värdet på sista raden?</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-coral" aria-label={`${score.streak} rätt i rad`}><Flame className="h-4 w-4" />{score.streak} i rad</span>
            {best > 0 && <span className="hidden items-center gap-1 sm:flex" title="Ditt rekord på den här enheten"><Trophy className="h-3.5 w-3.5" />{best}</span>}
          </span>
        </div>

        <div key={p.lines.map((l) => l.result).join("-") + p.symbols.join()} className="exercise-rise my-6 space-y-3">
          {p.lines.map((l, i) => <PuzzleLine key={i} terms={l.terms} result={l.result} p={p} />)}
          <PuzzleLine terms={p.question} p={p} question />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); done ? next() : check(); }} className="space-y-3">
          <label htmlFor="ekvation-answer" className="block text-sm font-bold text-foreground">Ditt svar</label>
          <input id="ekvation-answer" ref={inputRef} value={answer} onChange={(e) => { setAnswer(e.target.value); if (result && !result.correct) setResult(null); }}
            autoComplete="off" inputMode="numeric" enterKeyHint="done" placeholder="t.ex. 27"
            className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 font-orbitron text-2xl text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" />
          <Button type="submit" size="lg" disabled={!answer.trim() && !done} className="h-12 w-full gap-2 rounded-2xl text-base font-bold">
            {done ? <>Nästa pussel <ArrowRight className="h-5 w-5" /></> : <>Kontrollera svar <Check className="h-5 w-5" /></>}
          </Button>

          {result && (
            <Feedback key={result.message} correct={result.correct}>
              <p>{result.message}</p>
              {result.showSolution && (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  {explain(p, name).map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
              {result.showSolution && <p className="mt-2 text-sm font-semibold">Prova att skriva rätt svar – eller ta nästa pussel.</p>}
            </Feedback>
          )}

          <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
            {!done && (
              <HintToggle open={tip} onToggle={() => { setTip(!tip); usedHint.current = true; }}>
                Börja med rad 1 – där finns bara {variables ? first : symbolName(first)}. {variables ? "Vad måste x vara?" : "Hur mycket är en av dem värd?"}
              </HintToggle>
            )}
            {!done && (
              <button type="button" onClick={next} className="ml-auto rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                Hoppa över →
              </button>
            )}
          </div>
        </form>
      </section>
      <p className="px-1 text-center text-xs text-muted-foreground">{score.right} rätt på första försöket av {score.total} lösta pussel.</p>
    </ExerciseShell>
  );
};

export default Ekvationer;
