import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lightbulb, Lock, RotateCcw, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { useGameVisibility } from "@/hooks/useGameVisibility";
import { Rich, SceneView } from "@/components/sannolikhet/Scenes";
import {
  answerText, checkAnswer, fr, isUnlocked, LEVELS, LEVELS_PER_WORLD, makeRound, mergeBest, nextLevel, simplify,
  starsFor, TASKS_PER_LEVEL, WORLD_NAMES, type Check, type Frac, type Input, type Level, type ProgressMap, type Task,
} from "@/lib/sannolikhet";
import { sannolikhetAvailable } from "@/lib/sannolikhetAccess";
import { answerTask, issueTask } from "@/lib/exerciseTasks";

// Svar skickas i ordning; nästa nivå begärs först när förra nivåns svar sparats, så servern hinner låsa upp den.
let pendingAnswers: Promise<unknown> = Promise.resolve();

const TITLE = "Sannolikhetslabbet";
const WORLD_ICONS = ["🎡", "🔮", "🃏", "🪙"];
const WORLD_TEXT = [
  "Olikfärgade fält, stora och små tårtbitar.",
  "Kulor i en påse – med och utan återläggning.",
  "52 kort, fyra färger och klädda kort.",
  "Flera kast, träddiagram och kombinationer.",
];

const Stars = ({ n, size = "h-4 w-4" }: { n: number; size?: string }) => (
  <span className="flex" aria-label={`${n} av 3 stjärnor`}>
    {[0, 1, 2].map((i) => <Star key={i} className={cn(size, i < n ? "sl-gold fill-current" : "opacity-35")} />)}
  </span>
);

const LevelPicker = ({ progress, all, onPick }: { progress: ProgressMap; all: boolean; onPick: (id: string) => void }) => (
  <section className="sl-board space-y-5 rounded-[1.75rem] p-4 sm:p-6">
    <div className="text-center">
      <p className="text-4xl drop-shadow">🎲</p>
      <h1 className="font-playful text-3xl font-bold drop-shadow sm:text-4xl">{TITLE}</h1>
      <p className="mx-auto mt-1 max-w-md text-sm opacity-90">Hur stor är chansen? Klara fem uppgifter per nivå och samla stjärnor.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {WORLD_NAMES.map((name, w) => {
        const levels = LEVELS.filter((l) => l.world === w + 1);
        const got = levels.reduce((s, l) => s + (progress[l.id]?.stars ?? 0), 0);
        return (
          <div key={name} className="sl-world-card rounded-3xl p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-4xl drop-shadow" aria-hidden>{WORLD_ICONS[w]}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-playful text-xl font-bold">{w + 1}. {name}</h2>
                <p className="text-xs opacity-80">{WORLD_TEXT[w]}</p>
              </div>
              <span className="sl-badge shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">{got}/{LEVELS_PER_WORLD * 3} ★</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {levels.map((l) => {
                const open = isUnlocked(l.id, progress, all);
                return open ? (
                  <button key={l.id} type="button" onClick={() => onPick(l.id)} aria-label={`Nivå ${l.id}: ${l.title}`} title={l.title}
                    className="sl-tile flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-xl font-bold transition-transform hover:scale-105 active:scale-95">
                    {l.id.split("-")[1]}
                    <Stars n={progress[l.id]?.stars ?? 0} size="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                ) : (
                  <div key={l.id} className="sl-tile grid aspect-square place-items-center rounded-xl opacity-45" title={l.title}>
                    <Lock aria-label="Låst" className="h-4 w-4" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

const FORMAT_LABEL = { frac: "Svara i bråkform", pct: "Svara i procent", int: "Svara med ett tal" } as const;

const Play = ({ level, onBack, onNext, onDone }: {
  level: Level; onBack: () => void; onNext: (id: string) => void; onDone: (stars: number, correct: number) => void;
}) => {
  const [round, setRound] = useState<Task[]>([]);
  const roundId = useRef<string | null>(null);
  const sessionId = useRef(crypto.randomUUID());
  const load = () => {
    setRound([]);
    void pendingAnswers.then(() => issueTask<Task[]>({ game: "sannolikhet", levelId: level.id, sessionId: sessionId.current }, () => makeRound(level)))
      .then((r) => { roundId.current = r.id; setRound(r.task); });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState<Input>({});
  const [result, setResult] = useState<Check | null>(null);
  const [correct, setCorrect] = useState(0);
  const [hint, setHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const task = round[idx];

  useEffect(() => { if (!result) first.current?.focus(); else nextBtn.current?.focus(); }, [idx, result]);

  const submit = () => {
    if (result) return;
    const r = checkAnswer(task, input);
    if (!r) return toast(task.format === "frac" ? "Fyll i både täljare och nämnare." : "Skriv ett tal.");
    setResult(r);
    if (r.ok) setCorrect((c) => c + 1);
    const id = roundId.current, index = idx;
    pendingAnswers = pendingAnswers.then(() => answerTask("sannolikhet", id, { index, ...input }, hint));
  };
  const next = () => {
    if (idx + 1 >= round.length) {
      setFinished(true);
      onDone(starsFor(correct), correct);
      return;
    }
    setIdx((i) => i + 1); setInput({}); setResult(null); setHint(false);
  };
  const restart = () => { load(); setIdx(0); setInput({}); setResult(null); setCorrect(0); setHint(false); setFinished(false); };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); submit(); } };
  const earned = starsFor(correct);
  const nxt = nextLevel(level.id);
  const sameWorldNext = nxt && nxt.world === level.world ? nxt : undefined;
  const simple = task && task.format !== "int" ? simplify(task.answer as Frac) : null;

  return (
    <section className="sl-board relative overflow-hidden rounded-[1.75rem]">
      <div className="flex items-center justify-between gap-2 p-3">
        <Button variant="secondary" size="icon" aria-label="Alla nivåer" onClick={onBack} className="h-11 w-11 rounded-full"><ArrowLeft /></Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-xs font-semibold uppercase tracking-widest opacity-80">{WORLD_NAMES[level.world - 1]} · nivå {level.id.split("-")[1]}</p>
          <p className="truncate font-playful text-lg font-bold">{level.title}</p>
        </div>
        <Button variant="secondary" size="icon" aria-label="Börja om nivån" onClick={restart} className="h-11 w-11 rounded-full"><RotateCcw /></Button>
      </div>
      <div className="flex justify-center gap-1.5 pb-1" aria-label={`Uppgift ${idx + 1} av ${TASKS_PER_LEVEL}`}>
        {round.map((_, i) => <span key={i} className={cn("h-2 w-8 rounded-full", i < idx || (i === idx && result) ? "bg-current" : i === idx ? "sl-badge" : "opacity-30 bg-current")} />)}
      </div>

      {task && (
        <div className="space-y-4 p-3 sm:p-5">
          <div key={idx} className="sl-felt-inset rounded-3xl p-3 sm:p-4">
            <SceneView scene={task.scene} match={task.match} reveal={!!result} />
          </div>

          <div className="sl-panel space-y-3 rounded-3xl p-4 sm:p-5">
            <p className="text-lg font-semibold leading-snug sm:text-xl"><Rich text={task.question} /></p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="sl-badge rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide">{FORMAT_LABEL[task.format]}</span>
              {!result && (
                <button type="button" onClick={() => setHint((h) => !h)} className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-2 hover:underline">
                  <Lightbulb className="h-4 w-4" />Tips
                </button>
              )}
            </div>
            {hint && !result && <p className="rounded-2xl bg-secondary px-3 py-2 text-sm"><Rich text={task.hint} /></p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {task.format === "frac" ? (
                <div className="flex flex-col items-center gap-1 self-start sm:self-auto">
                  <input ref={first} aria-label="Täljare" inputMode="numeric" value={input.n ?? ""} disabled={!!result} onKeyDown={onKey}
                    onChange={(e) => setInput((s) => ({ ...s, n: e.target.value }))} className="sl-input h-12 w-20 rounded-xl text-center text-2xl font-bold" />
                  <span className="h-1 w-24 rounded bg-foreground" />
                  <input aria-label="Nämnare" inputMode="numeric" value={input.d ?? ""} disabled={!!result} onKeyDown={onKey}
                    onChange={(e) => setInput((s) => ({ ...s, d: e.target.value }))} className="sl-input h-12 w-20 rounded-xl text-center text-2xl font-bold" />
                </div>
              ) : (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <input ref={first} aria-label="Svar" inputMode="decimal" value={input.v ?? ""} disabled={!!result} onKeyDown={onKey}
                    onChange={(e) => setInput({ v: e.target.value })} className="sl-input h-14 w-32 rounded-xl text-center text-2xl font-bold" />
                  {task.format === "pct" && <span className="text-2xl font-bold">%</span>}
                </div>
              )}
              {result && (
                <div role="status" className={cn("kistan-pop w-full min-w-0 space-y-1 rounded-2xl px-4 py-3 sm:w-auto sm:flex-1", result.ok ? "sl-ok" : "sl-bad")}>
                  <p className="text-lg font-bold">
                    {result.ok ? (result.simplified || task.format !== "frac" ? "Rätt!" : "Rätt! Det går att förkorta.")
                      : <>Inte riktigt. Svaret är <Rich text={answerText(task)} /></>}
                  </p>
                  {result.ok && !result.simplified && task.format === "frac" && simple && (
                    <p className="text-sm">Förkortat blir det <Rich text={fr(simple.n, simple.d)} />.</p>
                  )}
                  <ul className="space-y-0.5 text-sm">{task.steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ul>
                </div>
              )}
              <div className="sm:ml-auto">
                {!result ? (
                  <Button size="lg" onClick={submit} className="h-12 rounded-full px-7 text-lg font-bold">Svara</Button>
                ) : (
                  <Button ref={nextBtn} size="lg" onClick={next} className="h-12 rounded-full px-7 text-lg font-bold">
                    {idx + 1 >= round.length ? "Se resultat" : "Nästa"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {finished && (
        <div className="absolute inset-0 grid place-items-center bg-foreground/45 p-4">
          <div role="dialog" aria-modal="true" aria-label="Nivåresultat" className="kistan-pop exercise-card w-full max-w-sm rounded-3xl p-6 text-center text-foreground">
            <h2 className="font-playful text-3xl font-bold">{earned ? "Nivån klar!" : "Nästan!"}</h2>
            <div className="my-3 flex justify-center"><Stars n={earned} size="h-11 w-11" /></div>
            <p className="mb-5 text-sm">
              {correct} av {round.length} rätt på första försöket.
              {!earned && " Du behöver minst 3 rätt för att klara nivån."}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="lg" onClick={restart} className="rounded-full font-bold">Igen</Button>
              {earned && sameWorldNext ? (
                <Button size="lg" onClick={() => onNext(sameWorldNext.id)} className="rounded-full font-bold">Nästa nivå</Button>
              ) : (
                <Button size="lg" onClick={onBack} className="rounded-full font-bold">Alla nivåer</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/** Sannolikhetslabbet: fyra världar med fasta nivåer och stjärnor, svar i bråkform eller procent. */
const Sannolikhet = () => {
  const { user, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [ownGrade, setOwnGrade] = useState<number | null | undefined>(undefined);
  const visibility = useGameVisibility(ownGrade && ownGrade >= 6 ? ownGrade : null);
  const levelId = params.get("niva");
  const level = useMemo(() => LEVELS.find((l) => l.id === levelId && isUnlocked(l.id, progress, isAdmin)), [levelId, progress, isAdmin]);

  useEffect(() => { document.title = `${TITLE} · Mattebo`; }, []);
  useEffect(() => {
    if (!user) return;
    void supabase.from("sannolikhet_progress").select("level_id,stars,best_correct").eq("user_id", user.id).then(({ data }) => {
      setProgress(Object.fromEntries((data ?? []).map((r) => [r.level_id, { stars: r.stars, best_correct: r.best_correct }])));
    });
    void supabase.from("profiles").select("class_grade").eq("id", user.id).maybeSingle().then(({ data }) => setOwnGrade(data?.class_grade ?? null));
  }, [user]);

  const goTo = (id: string | null) => setParams(id ? { niva: id } : {}, { replace: false });

  const saveDone = (lvl: Level) => (stars: number, correct: number) => {
    const best = mergeBest(progress[lvl.id], stars, correct);
    if (!best) return;
    setProgress((p) => ({ ...p, [lvl.id]: best }));
    // Servern rättar och sparar stjärnorna; här visas bara samma resultat direkt.
  };

  const done = Object.keys(progress).length;

  if (!isAdmin && user && (ownGrade === undefined || !visibility.loaded)) {
    return <ExerciseShell title={TITLE}><p className="py-16 text-center text-sm text-muted-foreground">Laddar …</p></ExerciseShell>;
  }
  if (!sannolikhetAvailable(ownGrade, isAdmin, visibility.rows)) {
    return (
      <ExerciseShell title={TITLE}>
        <section className="sl-board mt-6 rounded-[1.75rem] p-6 text-center">
          <p className="text-4xl">🎲</p>
          <h1 className="mt-2 font-playful text-2xl font-bold">{TITLE} är inte öppet för din klass just nu</h1>
          <Link to="/" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">Till Mattebo</Link>
        </section>
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell title={TITLE} progress={{ value: done, total: LEVELS.length, showLabel: false }}>
      {level ? (
        <Play key={level.id} level={level} onBack={() => goTo(null)} onNext={goTo} onDone={saveDone(level)} />
      ) : (
        <>
          <LevelPicker progress={progress} all={isAdmin} onPick={goTo} />
          <p className="text-center text-sm text-muted-foreground">
            {done} av {LEVELS.length} nivåer klarade · {Object.values(progress).reduce((s, p) => s + p.stars, 0)} stjärnor
          </p>
        </>
      )}
    </ExerciseShell>
  );
};

export default Sannolikhet;
