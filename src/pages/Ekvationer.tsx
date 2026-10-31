import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Flame, PartyPopper, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, HintToggle, Option, OptionGroup, ROUND, useExerciseSound } from "@/components/exercise/ExerciseParts";
import { PuzzleLine, symbolName } from "@/components/ekvationer/PuzzleFigure";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { checkAnswer, explain, generatePuzzle, LEVELS, shownRow, type Puzzle, type Result } from "@/lib/ekvationer";
import { justMastered, recommendedNext, summarize, type EkvationRow } from "@/lib/ekvationStats";
import EkvationProgress, { LevelStatusLine, Stars } from "@/components/ekvationer/EkvationProgress";

const PRAISE = ["Snyggt löst!", "Pusselmästare!", "Klockrent!", "Grymt!", "Helt rätt!"];
const BEST_KEY = "mattebo:ekvationer-best";

const Ekvationer = () => {
  const [level, setLevel] = useState(0);
  const [p, setP] = useState<Puzzle>(() => generatePuzzle(0));
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [tip, setTip] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } });
  const [completed, setCompleted] = useState(0);
  const [history, setHistory] = useState<EkvationRow[]>([]);
  const [celebrate, setCelebrate] = useState<{ level: number; next: number | null } | null>(null);
  const puzzleId = useRef(crypto.randomUUID());
  const lastMark = useRef(Date.now());
  const missed = useRef(false);
  const usedHint = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(crypto.randomUUID());
  const sound = useExerciseSound();
  const { user } = useAuth();

  useEffect(() => { document.title = "Ekvationspusslet · Mattebo"; }, []);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const all: EkvationRow[] = [];
      for (let from = 0; ; from += 1000) {
        const r = await supabase.from("ekvation_attempts").select("session_id,level,is_correct,hint_used,created_at,puzzle_id,error_kind,seconds_spent")
          .eq("user_id", user.id).order("created_at", { ascending: true }).range(from, from + 999);
        if (r.error || cancelled) return;
        all.push(...(r.data ?? []));
        if ((r.data?.length ?? 0) < 1000) break;
      }
      if (!cancelled) setHistory((local) => [...all, ...local.filter((l) => !all.some((a) => a.created_at === l.created_at && a.puzzle_id === l.puzzle_id))]);
    })();
    return () => { cancelled = true; };
  }, [user]);
  const summary = useMemo(() => summarize(history), [history]);
  const record = Math.max(best, summary.bestStreak);

  const fresh = (l = level) => {
    setP(generatePuzzle(l));
    setAnswer(""); setResult(null); setTip(false); missed.current = false; usedHint.current = false;
    puzzleId.current = crypto.randomUUID(); lastMark.current = Date.now();
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };
  const choose = (l: number) => { setLevel(l); setCompleted(0); setCelebrate(null); fresh(l); };

  const log = (r: Result) => {
    const now = Date.now();
    const row: EkvationRow = {
      session_id: sessionId.current, level, hint_used: usedHint.current, is_correct: r.correct, created_at: new Date(now).toISOString(),
      puzzle_id: puzzleId.current, error_kind: r.correct ? null : r.priorityError ? "priority" : "other",
      seconds_spent: Math.min(300, Math.max(0, Math.round((now - lastMark.current) / 1000))),
    };
    lastMark.current = now;
    const after = summarize([...history, row]);
    if (r.correct && justMastered(summary, after, level)) setCelebrate({ level, next: recommendedNext(after, level) });
    setHistory((h) => [...h, row]);
    if (user) void supabase.from("ekvation_attempts").insert({
      user_id: user.id, session_id: row.session_id, level, hint_used: row.hint_used, is_correct: row.is_correct,
      puzzle_id: row.puzzle_id, error_kind: row.error_kind, seconds_spent: row.seconds_spent,
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
    log(r);
  };
  const next = () => { setCompleted((c) => c + 1); fresh(); };

  const variables = level === 3;
  const name = (s: number) => symbolName(p.symbols[s]);
  const first = p.symbols[0];

  const settings = (
    <>
      <OptionGroup label="Nivå · rekommenderad ordning 1 → 4">
        {LEVELS.map((l, i) => (
          <Option key={i} active={level === i} onClick={() => choose(i)} title={l.blurb}>
            <span className="font-bold">{i + 1}</span> {l.name}
            <Stars n={summary.levels[i].stars} className="ml-1.5 align-middle" />
          </Option>
        ))}
      </OptionGroup>
      <LevelStatusLine l={summary.levels[level]} level={level} />
      {variables && <p className="text-xs text-muted-foreground">Kändisar smyger in allt oftare ju högre nivå. På nivå 4 byts figurerna mot x, y och z.</p>}
    </>
  );

  return (
    <ExerciseShell title="Ekvationspusslet" current={`Nivå ${level + 1} · ${LEVELS[level].name}`}
      progress={{ value: completed % ROUND, total: ROUND }} sound={sound} settings={settings}>
      <section className="exercise-card rounded-[1.75rem] p-4 sm:p-8">
        {celebrate && (
          <div className="exercise-rise mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-accent bg-accent/15 p-4" role="status">
            <PartyPopper className="h-7 w-7 shrink-0 text-coral" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">Nivå {celebrate.level + 1} bemästrad!</p>
              <p className="text-sm text-muted-foreground">{celebrate.next !== null ? `Du har full koll. Vi rekommenderar nivå ${celebrate.next + 1}: ${LEVELS[celebrate.next].name}.` : "Du har bemästrat alla nivåer – starkt jobbat!"}</p>
            </div>
            <div className="flex gap-2">
              {celebrate.next !== null && <Button size="sm" className="rounded-full" onClick={() => choose(celebrate.next!)}>Till nivå {celebrate.next + 1}</Button>}
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setCelebrate(null)}>Öva vidare</Button>
            </div>
          </div>
        )}
        <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="shrink-0">Nivå {level + 1}</span>
          <div className="flex-1"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${summary.levels[level].mastery}%` }} /></div></div>
          <Stars n={summary.levels[level].stars} />
        </div>
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <span className="uppercase tracking-widest">Vad är värdet på sista raden?</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-coral" aria-label={`${score.streak} rätt i rad`}><Flame className="h-4 w-4" />{score.streak} i rad</span>
            {record > 0 && <span className="hidden items-center gap-1 sm:flex" title="Ditt rekord"><Trophy className="h-3.5 w-3.5" />{record}</span>}
          </span>
        </div>

        <div key={p.lines.map((l) => l.result).join("-") + p.symbols.join()} className="exercise-rise my-6 space-y-3">
          {p.order.map((i, pos) => <PuzzleLine key={i} terms={p.lines[i].terms} result={p.lines[i].result} p={p} row={pos + 1} />)}
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
                {p.level === 0 ? "Börja med rad 1" : `Leta upp raden med bara en sorts figur (rad ${shownRow(p, 0)})`} – där finns bara {variables ? first : symbolName(first)}. {variables ? "Vad måste x vara?" : "Hur mycket är en av dem värd?"}
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
      <p className="px-1 text-center text-xs text-muted-foreground">Det här passet: {score.right} rätt på första försöket av {score.total} lösta pussel.</p>
      <EkvationProgress s={summary} current={level} onPick={(l) => choose(l)} />
    </ExerciseShell>
  );
};

export default Ekvationer;
