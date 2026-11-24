import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Flame, Medal, MousePointerClick, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, HintToggle, useExerciseSound } from "@/components/exercise/ExerciseParts";
import Leaderboard from "@/components/procent/Leaderboard";
import LineGrid, { type GridLine, type GridPoint, type Tone } from "@/components/linjen/LineGrid";
import Eq from "@/components/linjen/Eq";
import { advance, DRILL_START, DRILL_TIERS, TIER_STEP, tierOf, type DrillProgress } from "@/lib/procent";
import {
  checkAnswer, explain, fmtPoint, generateTask, hasFractions, lineThrough, MODE_INTRO, MODE_LABEL, parseNum, tierSpec, tip,
  type LinjeCheck, type LinjeMode, type Point,
} from "@/lib/linjen";
import { answerTask, issueTask } from "@/lib/exerciseTasks";

const NEXT_DELAY = 1800; // rätt svar visar trappsteget en stund och går sedan vidare
const MODES: LinjeMode[] = ["m", "k", "ekv", "rita", "parallell"];
const isMode = (v: string | null): v is LinjeMode => !!v && (MODES as string[]).includes(v);
const progKey = (m: LinjeMode) => `linjen-drill-${m}`;
const loadProgress = (m: LinjeMode): DrillProgress => {
  try {
    const p = JSON.parse(sessionStorage.getItem(progKey(m)) ?? "null");
    if (p && Number.isFinite(p.xp) && Number.isFinite(p.streak)) return { xp: p.xp, streak: p.streak };
  } catch { /* ignoreras */ }
  return DRILL_START;
};

/** Sifferruta med ±-knapp, eftersom minustecken saknas på många platt- och mobiltangentbord. */
const NumInput = ({ id, label, value, onChange, disabled, inputRef, onEnter, fractions }: {
  id: string; label: string; value: string; onChange: (v: string) => void; disabled: boolean;
  inputRef?: React.Ref<HTMLInputElement>; onEnter?: () => boolean; fractions?: boolean;
}) => (
  <span className="flex items-center gap-1">
    <button type="button" disabled={disabled} aria-label={`Byt tecken på ${label}`} title="Plus/minus"
      onClick={() => onChange(value.trim().startsWith("-") || value.trim().startsWith("−") ? value.trim().slice(1) : `-${value.trim()}`)}
      className="flex h-11 w-8 shrink-0 items-center justify-center rounded-xl border border-input bg-secondary/60 font-orbitron text-base font-bold text-foreground transition-colors hover:border-primary disabled:opacity-40">±</button>
    <input id={id} ref={inputRef} value={value} disabled={disabled} aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && onEnter?.()) e.preventDefault(); }}
      autoComplete="off" spellCheck={false} inputMode={fractions ? "text" : "decimal"} enterKeyHint="next" placeholder={fractions ? `${label}, t.ex. 2/3` : label}
      className={cn("h-11 rounded-2xl border-2 border-input bg-background px-2 text-center font-orbitron text-xl text-foreground outline-none transition-colors placeholder:text-xs placeholder:text-muted-foreground/60 focus:border-primary disabled:opacity-100",
        fractions ? "w-24" : "w-16 sm:w-20")} />
  </span>
);

/** Räta linjen som mängdträning: hitta m och k, skriv ekvationen, rita linjen och hitta parallella linjer. */
const Linjen = () => {
  const [mode, setMode] = useState<LinjeMode>(() => { const s = sessionStorage.getItem("linjen-mode"); return isMode(s) ? s : "m"; });
  const [prog, setProg] = useState(() => loadProgress(mode));
  const tier = tierOf(prog.xp);
  const [task, setTask] = useState(() => generateTask(mode, tierOf(prog.xp)));
  const [ks, setKs] = useState("");
  const [ms, setMs] = useState("");
  const [placed, setPlaced] = useState<Point[]>([]);
  const [picks, setPicks] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<LinjeCheck | null>(null);
  const [lost, setLost] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [record, setRecord] = useState(0);
  const [newRecord, setNewRecord] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const startRecord = useRef(0);
  const usedHint = useRef(false);
  const timer = useRef<number>();
  const kRef = useRef<HTMLInputElement>(null);
  const mRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const sound = useExerciseSound();
  const sessionId = useRef(crypto.randomUUID());
  const [loading, setLoading] = useState(true);
  const taskId = useRef<string | null>(null);
  const taskRef = useRef(task);
  const issueSeq = useRef(0);
  // Första uppgiften hämtas från servern, som rättar och sparar svaren.
  useEffect(() => { fresh(mode, tier); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => { document.title = "Räta linjen · Mattebo"; }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { sessionStorage.setItem("linjen-mode", mode); }, [mode]);
  useEffect(() => { try { sessionStorage.setItem(progKey(mode), JSON.stringify(prog)); } catch { /* ignoreras */ } }, [prog, mode]);
  useEffect(() => {
    startRecord.current = 0; setRecord(0);
    if (!user) return;
    void supabase.from("linje_attempts").select("streak").eq("user_id", user.id).eq("mode", mode)
      .order("streak", { ascending: false }).limit(1)
      .then(({ data }) => {
        const best = data?.[0]?.streak ?? 0;
        startRecord.current = Math.max(startRecord.current, best);
        setRecord((r) => Math.max(r, best));
      });
  }, [user, mode]);

  const focusFirst = (m: LinjeMode) => {
    if (m === "rita") return;
    setTimeout(() => (m === "m" ? mRef : kRef).current?.focus({ preventScroll: true }), 0);
  };
  const fresh = (m: LinjeMode, t: number) => {
    window.clearTimeout(timer.current);
    const req = ++issueSeq.current; setLoading(true);
    void issueTask({ game: "linje", mode: m, tier: t, sessionId: sessionId.current }, () => generateTask(m, t, Math.random, taskRef.current))
      .then((r) => { if (req !== issueSeq.current) return; taskId.current = r.id; taskRef.current = r.task; setTask(r.task); setLoading(false); focusFirst(m); });
    setKs(""); setMs(""); setPlaced([]); setPicks([]); setResult(null); setNotice(""); setShowTip(false); usedHint.current = false;
    focusFirst(m);
  };
  const switchMode = (m: LinjeMode) => {
    if (m === mode) return;
    const p = loadProgress(m);
    setMode(m); setProg(p); setNewRecord(false); setLost(0); fresh(m, tierOf(p.xp));
  };

  const kind = task.kind;
  const needK = kind === "through" || (kind === "read" && mode !== "m");
  const needM = kind === "through" || (kind === "read" && mode !== "k");
  const canSubmit = !loading && (kind === "draw" ? placed.length === 2 : kind === "pair" ? picks.length === 2 : (!needK || !!ks.trim()) && (!needM || !!ms.trim()));
  const fractions = hasFractions(task.tier);

  const place = (p: Point) => {
    setNotice("");
    setPlaced((cur) => cur.length >= 2 ? [p] : cur.some((c) => c.x === p.x && c.y === p.y) ? cur.filter((c) => c.x !== p.x || c.y !== p.y) : [...cur, p]);
  };
  const togglePick = (i: number) => setPicks((cur) => cur.includes(i) ? cur.filter((c) => c !== i) : cur.length >= 2 ? [cur[1], i] : [...cur, i]);

  const submit = () => {
    if (result || loading) return;
    let ans = {};
    if (kind === "draw") {
      if (placed.length < 2) { setNotice("Sätt ut två punkter på linjen."); return; }
      ans = { points: placed };
    } else if (kind === "pair") {
      if (picks.length < 2) { setNotice("Välj två linjer."); return; }
      ans = { pick: picks };
    } else {
      const k = needK ? parseNum(ks) : 0, m = needM ? parseNum(ms) : 0;
      if (k === null || m === null) { setNotice(fractions ? "Skriv ett tal eller ett bråk, t.ex. 2 eller −2/3." : "Skriv ett tal, t.ex. 2 eller −3."); return; }
      ans = { k, m };
    }
    const r = checkAnswer(task, ans);
    const p = advance(prog, r.correct);
    setResult(r); setProg(p); setLost(r.correct ? 0 : prog.streak);
    sound.play(r.correct);
    if (p.streak > record) setRecord(p.streak);
    if (p.streak > startRecord.current && p.streak >= 3) setNewRecord(true);
    if (!r.correct) setNewRecord(false);
    if (user) {
      void answerTask("linje", taskId.current, ans, usedHint.current);
    }
    if (r.correct) { const t = tierOf(p.xp); timer.current = window.setTimeout(() => fresh(mode, t), NEXT_DELAY); }
  };

  // Vad rutnätet visar för varje sorts uppgift.
  const tone: Tone = result ? (result.correct ? "good" : "bad") : "primary";
  const lines: GridLine[] = [];
  const points: GridPoint[] = [];
  let step: { line: typeof task; tone: Tone } | undefined;
  let mMark: { m: number; tone: Tone } | undefined;
  let overlay: string | undefined;
  if (kind === "read") {
    lines.push({ line: task, tone: "primary" });
    if (result && mode !== "m") step = { line: task, tone };
    if (result && mode !== "k") mMark = { m: task.m, tone };
  } else if (kind === "draw") {
    const mine = placed.length === 2 ? lineThrough(placed[0], placed[1]) : null;
    if (mine && !(result?.correct)) lines.push({ line: mine, tone: result ? "muted" : "primary", dashed: true });
    if (result) { lines.push({ line: task, tone: "good" }); step = { line: task, tone: "good" }; mMark = { m: task.m, tone: "good" }; }
    points.push(...placed.map((p) => ({ ...p, tone: (result ? (result.correct ? "good" : "muted") : "primary") as Tone })));
  } else if (kind === "pair") {
    if (result) task.options!.forEach((l, i) => lines.push({ line: l, tone: task.pair!.includes(i) ? "good" : picks.includes(i) ? "bad" : "muted", width: task.pair!.includes(i) ? 4 : 2.5 }));
    else overlay = "Linjerna ritas när du har svarat.";
  } else {
    lines.push({ line: task.base!, tone: "muted" });
    if (result) { lines.push({ line: task, tone: "good" }); mMark = { m: task.m, tone: "good" }; }
    points.push({ ...task.point!, tone: "primary", label: "P" });
  }

  const top = tier === DRILL_TIERS - 1;
  const spec = tierSpec(tier);
  const question = kind === "draw" ? <>Rita linjen <Eq line={task} /></>
    : kind === "pair" ? "Vilka två linjer är parallella?"
    : kind === "through" ? <>Vilken linje är parallell med <Eq line={task.base!} /> och går genom P = {fmtPoint(task.point!)}?</>
    : mode === "m" ? "Var korsar linjen y-axeln?" : mode === "k" ? "Hur mycket lutar linjen?" : "Vilken ekvation har linjen?";

  const kInput = <NumInput id="linje-k" label="k" value={ks} onChange={(v) => { setKs(v); setNotice(""); }} disabled={!!result} inputRef={kRef} fractions={fractions}
    onEnter={needM ? () => { if (!ms.trim()) { mRef.current?.focus(); return true; } return false; } : undefined} />;
  const mInput = <NumInput id="linje-m" label="m" value={ms} onChange={(v) => { setMs(v); setNotice(""); }} disabled={!!result} inputRef={mRef} />;

  return (
    <ExerciseShell title="Räta linjen · Mängdträning" progress={{ value: top ? TIER_STEP : prog.xp % TIER_STEP, total: TIER_STEP, showLabel: false }} sound={sound} showRobot={!showTip}>
      <section className="exercise-card rounded-[1.75rem] p-4 sm:p-6">
        <div role="tablist" aria-label="Välj träning" className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-y-1 rounded-3xl bg-secondary p-1">
          {MODES.map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-colors sm:px-4 sm:text-sm",
                mode === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">{MODE_INTRO[mode]}</p>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <span className="uppercase tracking-widest">Steg {tier + 1} av {DRILL_TIERS} · {spec.name}</span>
          <span className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 text-coral" title="Rätt i rad"><Flame className="h-4 w-4" />{prog.streak} i rad</span>
            <span className="flex items-center gap-1" title="Ditt rekord"><Trophy className="h-4 w-4" />{record}</span>
            <button type="button" onClick={() => setBoardOpen(true)} aria-label="Topplista" title="Topplista"
              className="flex h-7 shrink-0 items-center gap-1 rounded-full border border-input bg-background px-2 text-foreground transition-colors hover:border-primary hover:text-primary">
              <Medal className="h-4 w-4" /><span className="hidden sm:inline">Topplista</span>
            </button>
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 items-center gap-4 sm:grid-cols-2 sm:gap-6">
          <LineGrid lines={lines} points={points} step={step} mMark={mMark} overlay={overlay}
            dots={kind === "read" && spec.dots ? task : null}
            onPick={kind === "draw" && !result ? place : undefined}
            label={kind === "draw" ? "Koordinatsystem – tryck ut två punkter på linjen" : "Koordinatsystem med räta linjer"} />

          <div className="min-w-0 space-y-3">
            <p key={`${task.kp}/${task.kq}${task.m}${task.kind}`} className="exercise-rise font-orbitron text-2xl font-bold leading-tight text-foreground sm:text-3xl">{question}</p>

            <form onSubmit={(e) => { e.preventDefault(); if (result) fresh(mode, tier); else submit(); }} className="space-y-2">
              {result && (result.correct ? (
                <div role="status" className="exercise-rise flex items-center gap-3 rounded-2xl border-2 border-[hsl(var(--survey-good))] bg-[hsl(var(--survey-good)/0.12)] px-4 py-2 shadow-lg">
                  <span className="animate-answer-correct flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--survey-good))] text-background"><Check className="h-6 w-6" strokeWidth={3} /></span>
                  <div className="min-w-0">
                    <p className="animate-answer-correct font-orbitron text-2xl font-black leading-none tracking-wide text-[hsl(var(--survey-good))]">RÄTT!</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {newRecord ? `Nytt rekord – ${prog.streak} i rad!` : prog.streak > 1 ? `${prog.streak} i rad` : "Bra!"}
                      {kind !== "pair" && <> · <Eq line={task} /></>}
                    </p>
                  </div>
                </div>
              ) : (
                <Feedback key={result.message} correct={false} title={lost >= 2 ? `Sviten stannade på ${lost}` : undefined}>
                  <p className="text-sm">{result.message}</p>
                  <p className="mt-1 text-sm font-semibold">{explain(task)}</p>
                </Feedback>
              ))}
              {notice && !result && <p role="status" className="text-sm font-semibold text-coral">{notice}</p>}

              {kind === "pair" && (
                <div className="grid grid-cols-2 gap-2">
                  {task.options!.map((l, i) => {
                    const chosen = picks.includes(i), right = task.pair!.includes(i);
                    return (
                      <button key={i} type="button" disabled={!!result} aria-pressed={chosen} onClick={() => { togglePick(i); setNotice(""); }}
                        className={cn("flex min-h-[3.25rem] items-center justify-center rounded-2xl border-2 px-2 py-2 text-lg font-bold text-foreground transition-colors",
                          result ? (right ? "border-[hsl(var(--survey-good))] bg-[hsl(var(--survey-good)/0.12)]" : chosen ? "border-coral bg-coral/10" : "border-input opacity-60")
                            : chosen ? "border-primary bg-primary/10" : "border-input bg-background hover:border-primary")}>
                        <Eq line={l} />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {kind === "draw" ? (
                  <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <MousePointerClick className="h-4 w-4 shrink-0" />
                    {placed.length === 0 ? "Tryck ut två punkter på linjen." : placed.length === 1 ? "Bra – en punkt till." : "Tryck igen för att börja om."}
                    {placed.length > 0 && !result && (
                      <button type="button" onClick={() => setPlaced([])} className="flex items-center gap-1 rounded-full border border-input px-2 py-0.5 text-xs text-foreground hover:border-primary">
                        <RotateCcw className="h-3 w-3" /> Börja om
                      </button>
                    )}
                  </span>
                ) : kind === "pair" ? (
                  <span className="text-sm font-semibold text-muted-foreground">{picks.length}/2 valda</span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1 font-orbitron text-2xl font-bold text-foreground">
                    {mode === "m" && kind === "read" && <><span className="mr-1">m =</span>{mInput}</>}
                    {mode === "k" && <><span className="mr-1">k =</span>{kInput}</>}
                    {needK && needM && <><span className="mr-1">y =</span>{kInput}<span className="mx-1">x +</span>{mInput}</>}
                  </span>
                )}
                <Button type="submit" disabled={!canSubmit && !result} className="ml-auto h-11 shrink-0 gap-1.5 rounded-2xl px-4 text-sm font-bold">
                  {result ? <>Nästa <ArrowRight className="h-4 w-4" /></> : <>Svara <Check className="h-4 w-4" /></>}
                </Button>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <HintToggle open={showTip} onToggle={() => { if (!showTip) usedHint.current = true; setShowTip(!showTip); }}>{tip(task)}</HintToggle>
                <span className="pt-1 text-xs text-muted-foreground">
                  {needK && needM ? "Är m negativt? Skriv −3 i m-rutan." : kind === "read" ? "Uppåt är plus, nedåt är minus." : ""}
                  {fractions && needK && " Bråk skrivs 2/3."}
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Leaderboard rpc="linje_leaderboard" mode={mode} title={`Räta linjen · ${MODE_LABEL[mode]}`} open={boardOpen} onOpenChange={setBoardOpen} />
    </ExerciseShell>
  );
};

export default Linjen;
