import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Flame, Medal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import { Feedback, HintToggle, useExerciseSound } from "@/components/exercise/ExerciseParts";
import Leaderboard from "@/components/procent/Leaderboard";
import LineGrid from "@/components/linjen/LineGrid";
import { advance, DRILL_START, DRILL_TIERS, TIER_STEP, tierOf, type DrillProgress } from "@/lib/procent";
import { parseCoord } from "@/lib/koordinater";
import {
  checkAnswer, explain, fmtEq, generateTask, MODE_INTRO, MODE_LABEL, tierSpec, tip,
  type LinjeCheck, type LinjeMode,
} from "@/lib/linjen";

const NEXT_DELAY = 1800; // rätt svar visar trappsteget en stund och går sedan vidare
const MODES: LinjeMode[] = ["m", "k", "ekv"];
const isMode = (v: string | null): v is LinjeMode => v === "m" || v === "k" || v === "ekv";
const progKey = (m: LinjeMode) => `linjen-drill-${m}`;
const loadProgress = (m: LinjeMode): DrillProgress => {
  try {
    const p = JSON.parse(sessionStorage.getItem(progKey(m)) ?? "null");
    if (p && Number.isFinite(p.xp) && Number.isFinite(p.streak)) return { xp: p.xp, streak: p.streak };
  } catch { /* ignoreras */ }
  return DRILL_START;
};

/** Sifferruta med ±-knapp, eftersom minustecken saknas på många platt- och mobiltangentbord. */
const NumInput = ({ id, label, value, onChange, disabled, inputRef, onEnter }: {
  id: string; label: string; value: string; onChange: (v: string) => void; disabled: boolean;
  inputRef?: React.Ref<HTMLInputElement>; onEnter?: () => boolean;
}) => (
  <span className="flex items-center gap-1">
    <button type="button" disabled={disabled} aria-label={`Byt tecken på ${label}`} title="Plus/minus"
      onClick={() => onChange(value.trim().startsWith("-") || value.trim().startsWith("−") ? value.trim().slice(1) : `-${value.trim()}`)}
      className="flex h-11 w-8 shrink-0 items-center justify-center rounded-xl border border-input bg-secondary/60 font-orbitron text-base font-bold text-foreground transition-colors hover:border-primary disabled:opacity-40">±</button>
    <input id={id} ref={inputRef} value={value} disabled={disabled} aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && onEnter?.()) e.preventDefault(); }}
      autoComplete="off" spellCheck={false} inputMode="decimal" enterKeyHint="next" placeholder={label}
      className="h-11 w-16 rounded-2xl border-2 border-input bg-background px-2 text-center font-orbitron text-xl text-foreground outline-none transition-colors placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-primary disabled:opacity-100 sm:w-20" />
  </span>
);

/** Räta linjen som mängdträning: hitta m, hitta k eller skriv hela ekvationen, sakta ökande svårighet och svit. */
const Linjen = () => {
  const [mode, setMode] = useState<LinjeMode>(() => { const s = sessionStorage.getItem("linjen-mode"); return isMode(s) ? s : "m"; });
  const [prog, setProg] = useState(() => loadProgress(mode));
  const tier = tierOf(prog.xp);
  const [task, setTask] = useState(() => generateTask(mode, tierOf(prog.xp)));
  const [ks, setKs] = useState("");
  const [ms, setMs] = useState("");
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

  const focusFirst = (m: LinjeMode) => setTimeout(() => (m === "m" ? mRef : kRef).current?.focus({ preventScroll: true }), 0);
  const fresh = (m: LinjeMode, t: number) => {
    window.clearTimeout(timer.current);
    setTask((prev) => generateTask(m, t, Math.random, prev));
    setKs(""); setMs(""); setResult(null); setNotice(""); setShowTip(false); usedHint.current = false;
    focusFirst(m);
  };
  const switchMode = (m: LinjeMode) => {
    if (m === mode) return;
    const p = loadProgress(m);
    setMode(m); setProg(p); setNewRecord(false); setLost(0); fresh(m, tierOf(p.xp));
  };

  const needK = mode !== "m", needM = mode !== "k";
  const canSubmit = (!needK || !!ks.trim()) && (!needM || !!ms.trim());

  const submit = () => {
    if (result) return;
    const k = needK ? parseCoord(ks) : 0, m = needM ? parseCoord(ms) : 0;
    if (k === null || m === null) { setNotice("Skriv ett tal, t.ex. 2 eller −3."); return; }
    const r = checkAnswer(task, { k, m });
    const p = advance(prog, r.correct);
    setResult(r); setProg(p); setLost(r.correct ? 0 : prog.streak);
    sound.play(r.correct);
    if (p.streak > record) setRecord(p.streak);
    if (p.streak > startRecord.current && p.streak >= 3) setNewRecord(true);
    if (!r.correct) setNewRecord(false);
    if (user) {
      void supabase.from("linje_attempts").insert({
        user_id: user.id, session_id: sessionId.current, mode, level: tier,
        hint_used: usedHint.current, is_correct: r.correct, error_kind: r.error, streak: p.streak,
      }).then(() => {});
    }
    if (r.correct) { const t = tierOf(p.xp); timer.current = window.setTimeout(() => fresh(mode, t), NEXT_DELAY); }
  };

  const top = tier === DRILL_TIERS - 1;
  const spec = tierSpec(tier);
  const question = mode === "m" ? "Var korsar linjen y-axeln?" : mode === "k" ? "Hur mycket lutar linjen?" : "Vilken ekvation har linjen?";

  return (
    <ExerciseShell title="Räta linjen · Mängdträning" progress={{ value: top ? TIER_STEP : prog.xp % TIER_STEP, total: TIER_STEP, showLabel: false }} sound={sound} showRobot={!showTip}>
      <section className="exercise-card rounded-[1.75rem] p-4 sm:p-6">
        <div role="tablist" aria-label="Välj träning" className="mx-auto flex w-fit rounded-full bg-secondary p-1">
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
          <LineGrid task={task} result={result} />

          <div className="min-w-0 space-y-3">
            <p key={`${task.k}${task.m}${task.mode}`} className="exercise-rise font-orbitron text-2xl font-bold leading-tight text-foreground sm:text-3xl">{question}</p>

            <form onSubmit={(e) => { e.preventDefault(); if (result) fresh(mode, tier); else submit(); }} className="space-y-2">
              {result && (result.correct ? (
                <div role="status" className="exercise-rise flex items-center gap-3 rounded-2xl border-2 border-[hsl(var(--survey-good))] bg-[hsl(var(--survey-good)/0.12)] px-4 py-2 shadow-lg">
                  <span className="animate-answer-correct flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--survey-good))] text-background"><Check className="h-6 w-6" strokeWidth={3} /></span>
                  <div className="min-w-0">
                    <p className="animate-answer-correct font-orbitron text-2xl font-black leading-none tracking-wide text-[hsl(var(--survey-good))]">RÄTT!</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {newRecord ? `Nytt rekord – ${prog.streak} i rad!` : prog.streak > 1 ? `${prog.streak} i rad` : "Bra!"} · {fmtEq(task.k, task.m)}
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

              <div className="flex flex-wrap items-center gap-2">
                <span className="flex flex-wrap items-center gap-1 font-orbitron text-2xl font-bold text-foreground">
                  {mode === "m" && (<><span className="mr-1">m =</span>
                    <NumInput id="linje-m" label="m" value={ms} onChange={(v) => { setMs(v); setNotice(""); }} disabled={!!result} inputRef={mRef} /></>)}
                  {mode === "k" && (<><span className="mr-1">k =</span>
                    <NumInput id="linje-k" label="k" value={ks} onChange={(v) => { setKs(v); setNotice(""); }} disabled={!!result} inputRef={kRef} /></>)}
                  {mode === "ekv" && (<><span className="mr-1">y =</span>
                    <NumInput id="linje-k" label="k" value={ks} onChange={(v) => { setKs(v); setNotice(""); }} disabled={!!result} inputRef={kRef}
                      onEnter={() => { if (!ms.trim()) { mRef.current?.focus(); return true; } return false; }} />
                    <span className="mx-1">x +</span>
                    <NumInput id="linje-m" label="m" value={ms} onChange={(v) => { setMs(v); setNotice(""); }} disabled={!!result} inputRef={mRef} /></>)}
                </span>
                <Button type="submit" disabled={!canSubmit && !result} className="ml-auto h-11 shrink-0 gap-1.5 rounded-2xl px-4 text-sm font-bold">
                  {result ? <>Nästa <ArrowRight className="h-4 w-4" /></> : <>Svara <Check className="h-4 w-4" /></>}
                </Button>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <HintToggle open={showTip} onToggle={() => { if (!showTip) usedHint.current = true; setShowTip(!showTip); }}>{tip(task)}</HintToggle>
                <span className="pt-1 text-xs text-muted-foreground">
                  {mode === "ekv" ? "Är m negativt? Skriv −3 i m-rutan." : "Uppåt är plus, nedåt är minus."}
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
