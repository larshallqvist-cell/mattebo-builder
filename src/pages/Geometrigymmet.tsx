import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleCheck, Dumbbell, Flag, Flame, Lightbulb, Lock, Pause, Play, Timer, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { tone } from "@/lib/geometrigymmetSound";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import UnitLadder from "@/components/geometrigymmet/UnitLadder";
import { useGameVisibility } from "@/hooks/useGameVisibility";
import labAsset from "@/assets/geometrigymmet/measurement-lab.webp.asset.json";
import {
  emptyProgress, explanation, formatNumber, FUTURE_MODULES, geometrigymmetAvailable, gradeSpread, isNumberInput,
  MASTERY_THRESHOLD, masteredCount, nextNameGap, nextSkill, parseProgress, praise, recordAnswer, ROUND_LENGTH, scoreSpread, SKILLS, SPREAD_SIZE,
  spreadQuestions, STAGES, UNITS, unlockedStage, type Progress, type Question,
} from "@/lib/geometrigymmet";

const TITLE = "Geometrigymmet";

type Session = {
  questions: Question[]; inputs: string[]; units: string[]; results: boolean[] | null;
  active: boolean; paused: boolean; spreadIndex: number; roundCorrect: number; roundPoints: number;
  seconds: number | null; spreadPoints: number; newlyMastered: boolean; done: boolean;
};
const SPREADS = ROUND_LENGTH / SPREAD_SIZE;
const initialSession = (): Session => ({ questions: [], inputs: [], units: [], results: null, active: false, paused: false, spreadIndex: 0, roundCorrect: 0, roundPoints: 0, seconds: null, spreadPoints: 0, newlyMastered: false, done: false });
const sessionKey = (uid: string) => `geometrigymmet-session-v2:${uid}`;

const isUnit = (u: unknown): u is keyof typeof UNITS => typeof u === "string" && Object.prototype.hasOwnProperty.call(UNITS, u);
const isQuestion = (q: Question) => q && SKILLS.some((k) => k.id === q.skillId) && isUnit(q.from) && isUnit(q.to) && Number.isFinite(q.value) && Number.isFinite(q.answer) && Array.isArray(q.choices) && q.choices.every(isUnit);
/** Restores an unfinished round on this device; anything unexpected starts fresh. */
function parseSession(raw: string | null): Session {
  try {
    const s = JSON.parse(raw ?? "null");
    if (!s || typeof s !== "object" || !Array.isArray(s.questions) || !s.questions.every(isQuestion)) return initialSession();
    const base = { ...initialSession(), ...s } as Session;
    if (!Number.isInteger(base.spreadIndex) || base.spreadIndex < 0 || base.spreadIndex >= SPREADS) return initialSession();
    return { ...base, inputs: (s.inputs ?? []).map(String), units: (s.units ?? []).map(String), results: Array.isArray(s.results) ? s.results.map(Boolean) : null, paused: Boolean(s.paused) };
  } catch {
    return initialSession();
  }
}
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const fmtSec = (s: number) => `${s.toFixed(1).replace(".", ",")} s`;

const Geometrigymmet = () => {
  const { user, isAdmin } = useAuth();
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [session, setSession] = useState<Session>(initialSession);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [ownGrade, setOwnGrade] = useState<number | null | undefined>(undefined);
  const visibility = useGameVisibility(ownGrade && ownGrade >= 6 ? ownGrade : null);
  const [sound, setSound] = useState(() => localStorage.getItem("geometrigymmet-sound") !== "off");
  const [revealed, setRevealed] = useState(0);
  const [validation, setValidation] = useState("");
  const [cheer, setCheer] = useState("");
  const untilName = useRef(nextNameGap());
  const startedAt = useRef<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { document.title = `${TITLE} · Mattebo`; }, []);
  useEffect(() => {
    if (!user) return;
    setSession(parseSession(localStorage.getItem(sessionKey(user.id))));
    void supabase.from("geometrigymmet_progress").select("progress").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProgress(parseProgress(data?.progress));
      setReady(true);
    });
    void supabase.from("profiles").select("class_grade,full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setOwnGrade(data?.class_grade ?? null);
      setFirstName((data?.full_name ?? "").trim().split(/\s+/)[0] ?? "");
    });
  }, [user]);
  useEffect(() => {
    if (!user || !ready) return;
    try { localStorage.setItem(sessionKey(user.id), JSON.stringify(session)); } catch { /* not resumable */ }
  }, [session, user, ready]);
  useEffect(() => { localStorage.setItem("geometrigymmet-sound", sound ? "on" : "off"); }, [sound]);

  const saveProgress = (p: Progress) => {
    setProgress(p);
    if (!user) return;
    void supabase.from("geometrigymmet_progress")
      .upsert({ user_id: user.id, progress: p, mastered_count: masteredCount(p), updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .then(({ error }) => setSaveFailed(Boolean(error)));
  };

  const qs = session.questions;
  const grading = session.results !== null && revealed < qs.length;
  const timerRunning = progress.timed && session.active && !session.results && startedAt.current !== null && !session.paused;
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (session.active && !session.results && !session.paused) inputRefs.current[0]?.focus();
    startedAt.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, session.active]);

  useEffect(() => {
    if (!session.results) return;
    if (revealed >= session.results.length) { nextRef.current?.focus(); return; }
    const ok = session.results[revealed];
    let run = 0;
    for (let i = revealed - 1; i >= 0 && session.results[i]; i--) run++;
    const id = window.setTimeout(() => {
      if (sound) tone(ok, run);
      setRevealed((r) => r + 1);
    }, reducedMotion() ? 0 : revealed === 0 ? 150 : 350);
    return () => window.clearTimeout(id);
  }, [session.results, revealed, sound]);

  const newSpread = (p: Progress, base: Partial<Session>) => {
    const qsNew = spreadQuestions(nextSkill(p));
    setRevealed(0); setValidation("");
    setSession((s) => ({ ...s, ...base, questions: qsNew, inputs: qsNew.map(() => ""), units: qsNew.map(() => ""), results: null, seconds: null, spreadPoints: 0, newlyMastered: false, done: false }));
  };
  const start = () => newSpread(progress, { ...initialSession(), active: true });
  const setTimed = (timed: boolean) => saveProgress({ ...progress, timed });

  const touch = () => { if (startedAt.current === null) { startedAt.current = Date.now(); setNow(Date.now()); } };
  const setInput = (i: number, v: string) => { touch(); setSession((s) => ({ ...s, inputs: s.inputs.map((x, j) => (j === i ? v : x)) })); };
  const setUnit = (i: number, v: string) => { touch(); setSession((s) => ({ ...s, units: s.units.map((x, j) => (j === i ? v : x)) })); };

  const klar = () => {
    if (session.results || session.paused) return;
    const bad = qs.findIndex((q, i) => !isNumberInput(session.inputs[i] ?? "") || (q.chooseUnit && !session.units[i]));
    if (bad >= 0) { setValidation("Fyll i alla rutor med ett tal (och välj enhet där det behövs)."); inputRefs.current[bad]?.focus(); return; }
    setValidation("");
    const seconds = progress.timed && startedAt.current !== null ? (Date.now() - startedAt.current) / 1000 : progress.timed ? 0 : null;
    const results = gradeSpread(qs, session.inputs, session.units);
    let p = progress;
    let newlyMastered = false;
    qs.forEach((q, i) => {
      const before = p.skills[q.skillId]?.mastered;
      p = recordAnswer(p, q.skillId, results[i]);
      if (!before && p.skills[q.skillId]?.mastered) newlyMastered = true;
    });
    const pts = scoreSpread(results, seconds);
    const sk = qs[0].skillId;
    const allRight = results.every(Boolean);
    const bestSeconds = seconds !== null && allRight && (!p.bestSeconds[sk] || seconds < p.bestSeconds[sk]) ? { ...p.bestSeconds, [sk]: Math.round(seconds * 10) / 10 } : p.bestSeconds;
    const roundPoints = session.roundPoints + pts;
    const last = session.spreadIndex + 1 >= SPREADS;
    p = { ...p, points: p.points + pts, bestSeconds, ...(last ? { rounds: p.rounds + 1, bestRound: Math.max(p.bestRound, roundPoints) } : {}) };
    saveProgress(p);
    if (allRight) {
      const r = praise(firstName, p.skills[sk]?.streak ?? 0, untilName.current);
      untilName.current = r.untilName; setCheer(r.text);
    } else setCheer("");
    setRevealed(0);
    setSession({ ...session, results, seconds, spreadPoints: pts, roundPoints, roundCorrect: session.roundCorrect + results.filter(Boolean).length, newlyMastered });
  };
  const next = () => {
    if (!session.results || grading) return;
    if (session.spreadIndex + 1 >= SPREADS) { setSession({ ...session, done: true }); return; }
    newSpread(progress, { spreadIndex: session.spreadIndex + 1 });
  };
  const onKey = (i: number) => (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (session.results) return next();
    if (i + 1 < qs.length) inputRefs.current[i + 1]?.focus(); else klar();
  };

  if (!isAdmin && user && (ownGrade === undefined || !visibility.loaded)) {
    return <ExerciseShell title={TITLE}><p className="py-16 text-center text-sm text-muted-foreground">Laddar …</p></ExerciseShell>;
  }
  if (!geometrigymmetAvailable(ownGrade, isAdmin, visibility.rows)) {
    return (
      <ExerciseShell title={TITLE}>
        <section className="exercise-card mt-6 rounded-3xl p-6 text-center">
          <p className="font-semibold">Geometrigymmet är inte öppet för din klass just nu.</p>
          <p className="mt-1 text-sm text-muted-foreground">Din lärare öppnar det när ni arbetar med prefix och enheter.</p>
        </section>
      </ExerciseShell>
    );
  }

  const currentSkill = qs[0] ? SKILLS.find((k) => k.id === qs[0].skillId) ?? nextSkill(progress) : nextSkill(progress);
  const skillProgress = progress.skills[currentSkill.id];
  const stageIndex = unlockedStage(progress);
  const completedAll = masteredCount(progress) === SKILLS.length;
  const streak = Math.min(skillProgress?.streak ?? 0, MASTERY_THRESHOLD);
  const nextUnlock = STAGES[stageIndex + 1]?.title;
  const liveSeconds = session.results ? session.seconds : startedAt.current !== null ? (now - startedAt.current) / 1000 : 0;
  const best = progress.bestSeconds[currentSkill.id];
  const gradedAll = session.results !== null && revealed >= qs.length;

  return (
    <ExerciseShell title={TITLE} progress={{ value: masteredCount(progress), total: SKILLS.length, showLabel: false }} sound={{ on: sound, toggle: () => setSound((v) => !v) }}>
      <section className="exercise-card relative overflow-hidden rounded-3xl">
        <img src={labAsset.url} alt="Måttband, linjal, kuber och en mätbägare" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-90 [mask-image:linear-gradient(to_right,transparent,black_45%)]" />
        <div className="relative max-w-[62%] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">3.1 Prefix och enheter</p>
          <h1 className="mt-1 font-playful text-2xl font-bold sm:text-3xl">Träna enheterna starka</h1>
          <p className="mt-1 text-sm text-muted-foreground">{progress.points} poäng totalt · bästa pass {progress.bestRound} poäng</p>
        </div>
      </section>

      <section className="exercise-card overflow-hidden rounded-3xl" aria-label="Aktuellt pass">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 text-sm font-bold">
            <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Pass {progress.rounds + (session.done ? 0 : 1)} · {currentSkill.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {progress.timed && session.active && !session.done && (
              <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-bold tabular-nums" aria-label="Tid"><Timer className="h-4 w-4" />{fmtSec(liveSeconds ?? 0)}</span>
            )}
            <Button variant="ghost" size="sm" disabled={!session.active || session.done || !!session.results} onClick={() => setSession({ ...session, paused: true })}>
              <Pause className="h-4 w-4" />Pausa
            </Button>
          </div>
        </header>

        <div className="space-y-4 p-4 sm:p-6">
          {!ready ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Hämtar dina framsteg …</p>
          ) : session.done ? (
            <div className="exercise-rise py-6 text-center">
              <Flag className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-2 font-playful text-2xl font-bold">Passet klart!</h2>
              <p className="mt-1 text-lg font-bold">{session.roundPoints} poäng</p>
              <p className="text-muted-foreground">{session.roundCorrect} av {ROUND_LENGTH} rätt.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {completedAll ? "Alla nivåer är klarade. Håll formen med repetition!" : `${streak} rätt i rad på ${currentSkill.label.toLowerCase()}.`}
              </p>
              <Button size="lg" className="mt-5 h-12 rounded-full px-7 font-bold" onClick={start}>Nästa pass<ArrowRight /></Button>
            </div>
          ) : !session.active || !qs.length ? (
            <div className="exercise-rise py-4 text-center">
              <h2 className="font-playful text-2xl font-bold">Redo att köra?</h2>
              <p className="mt-1 text-muted-foreground">Nästa övning: {nextSkill(progress).label.toLowerCase()}.</p>
              <p className="mt-1 text-sm text-muted-foreground">{SPREAD_SIZE} uppgifter per uppslag · tryck Klar för rättning · {MASTERY_THRESHOLD} rätt i rad låser upp nästa nivå</p>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-3 rounded-full border border-border px-4 py-2 text-sm font-semibold">
                <Switch checked={progress.timed} onCheckedChange={setTimed} aria-label="Spela på tid" />Spela på tid
              </label>
              <div><Button size="lg" className="mt-5 h-12 rounded-full px-7 font-bold" onClick={start}><Play />Starta passet</Button></div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (session.results) next(); else klar(); }} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                  {skillProgress?.mastered ? "Repetition" : currentSkill.category} · Uppslag {session.spreadIndex + 1} av {SPREADS}
                </span>
                <span className="text-sm text-muted-foreground">{qs[0].mission}{progress.timed && best ? ` · Bästa: ${fmtSec(best)}` : ""}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {qs.map((q, i) => {
                  const shown = session.results !== null && i < revealed;
                  const ok = session.results?.[i];
                  return (
                    <div key={i} data-testid="gg-box" className={cn("rounded-2xl border-2 p-3 transition-colors duration-200",
                      shown ? (ok ? "gg-box-ok" : "gg-box-bad") : "border-border bg-card")}>
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">{q.chooseUnit ? "Vilket mått motsvarar mängden?" : `Hur många ${q.to}?`}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xl font-bold sm:text-2xl">
                        <span data-testid="gg-q">{formatNumber(q.value)} {q.from}</span><span className="text-muted-foreground">=</span>
                        <input ref={(el) => (inputRefs.current[i] = el)} aria-label={`Svar uppgift ${i + 1}`} type="text" inputMode="decimal" autoComplete="off" placeholder="?"
                          value={session.inputs[i] ?? ""} disabled={!!session.results || session.paused} onChange={(e) => setInput(i, e.target.value)} onKeyDown={onKey(i)}
                          className="h-12 w-28 rounded-xl border-2 border-input bg-card text-center text-xl font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
                        {q.chooseUnit ? (
                          <select aria-label={`Enhet uppgift ${i + 1}`} value={session.units[i] ?? ""} disabled={!!session.results} onChange={(e) => setUnit(i, e.target.value)}
                            className="h-12 rounded-xl border-2 border-input bg-card px-2 text-lg font-bold">
                            <option value="">Enhet</option>
                            {q.choices.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : <span data-testid="gg-to">{q.to}</span>}
                      </div>
                      {shown && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold">
                          {ok ? <><CircleCheck className="h-4 w-4" />Rätt</> : <><X className="h-4 w-4" />Rätt svar: {formatNumber(q.answer)} {q.to}</>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {validation && <p role="alert" className="text-sm font-semibold text-destructive">{validation}</p>}

              {gradedAll && session.results && (
                <div role="status" className="exercise-rise space-y-3">
                  <div className={cn("rounded-2xl px-4 py-3", session.results.every(Boolean) ? "gg-ok" : "gg-tip")}>
                    <p className="text-lg font-bold" data-testid="gg-summary">
                      {session.newlyMastered ? "Ny nivå upplåst!" : session.results.every(Boolean) ? cheer || "Snyggt!" : `${session.results.filter(Boolean).length} av ${qs.length} rätt`}
                      {" "}· {session.spreadPoints} poäng{session.seconds !== null ? ` · ${fmtSec(session.seconds)}` : ""}
                    </p>
                    {session.newlyMastered && <p className="text-sm">{MASTERY_THRESHOLD} rätt i rad – nu klarar du tyngre vikter!</p>}
                  </div>
                  {qs.map((q, i) => session.results![i] ? null : (
                    <div key={i} className="rounded-2xl bg-secondary px-4 py-3 text-sm">
                      <p className="font-bold">{formatNumber(q.value)} {q.from} = {formatNumber(q.answer)} {q.to}</p>
                      <p className="text-muted-foreground">{explanation(q)}</p>
                      <UnitLadder question={q} />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                {session.results ? (
                  <Button key="next" ref={nextRef} type="submit" size="lg" disabled={grading} className="h-12 rounded-full px-7 font-bold">
                    {session.spreadIndex + 1 >= SPREADS ? "Avsluta passet" : "Nästa uppslag"}<ArrowRight />
                  </Button>
                ) : (
                  <Button key="klar" type="submit" size="lg" className="h-12 rounded-full px-8 text-lg font-bold"><Check />Klar</Button>
                )}
              </div>
            </form>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted px-4 py-3 text-sm sm:px-5">
          <span className="flex items-center gap-2"><Flame className="h-4 w-4 text-coral" /><strong>{streak} / {MASTERY_THRESHOLD}</strong> rätt i rad</span>
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: MASTERY_THRESHOLD }, (_, i) => <span key={i} className={cn("h-2 w-2 rounded-full", i < streak ? "bg-coral" : "bg-border")} />)}
          </span>
          <span className="text-muted-foreground">{nextUnlock ? `Nästa upplåsning: ${nextUnlock}` : "Sista nivån"}</span>
        </footer>
      </section>
      {saveFailed && <p role="alert" className="text-center text-sm font-semibold text-destructive">Framstegen kunde inte sparas just nu. Kontrollera uppkopplingen.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="exercise-card rounded-3xl p-4 sm:p-5">
          <h3 className="mb-2 flex items-center gap-2 font-bold"><Flag className="h-4 w-4 text-primary" />Dina nivåer</h3>
          <ol className="space-y-1">
            {STAGES.map((st, i) => (
              <li key={st.title} className={cn("flex items-center gap-3 py-1 text-sm", i > stageIndex && "text-muted-foreground")}>
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                  i < stageIndex || completedAll ? "border-primary bg-primary text-primary-foreground" : i === stageIndex ? "border-primary bg-primary/10 text-primary" : "border-border")}>
                  {i < stageIndex || completedAll ? <Check className="h-3.5 w-3.5" /> : i > stageIndex ? <Lock className="h-3 w-3" aria-label="Låst" /> : i + 1}
                </span>
                <span>
                  <span className="font-semibold">{st.title}</span>
                  {i === stageIndex && !completedAll && <span className="block text-xs text-primary">{st.skills.filter((s) => progress.skills[s.id]?.mastered).length} / {st.skills.length} övningar klara</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="exercise-card space-y-3 rounded-3xl p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-bold"><Lightbulb className="h-4 w-4 text-coral" />Tränarens tips</h3>
          <UnitLadder question={qs[0] ?? { from: "m", to: "mm" }} />
          <p className="text-sm text-muted-foreground">Samma mängd, olika enheter. Mot en mindre enhet blir talet större, mot en större enhet blir talet mindre.</p>
          <div className="border-t border-border pt-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Kommer senare</p>
            <ul className="flex flex-wrap gap-1.5">
              {FUTURE_MODULES.map((m) => <li key={m} className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />{m}</li>)}
            </ul>
          </div>
        </section>
      </div>

      <Dialog open={session.paused} onOpenChange={(open) => setSession({ ...session, paused: open })}>
        <DialogContent className="exercise-light">
          <DialogTitle>Passet är pausat</DialogTitle>
          <DialogDescription>Vattenpaus! Dina framsteg och din fråga finns kvar.</DialogDescription>
          <Button className="mt-2 h-12 rounded-full font-bold" onClick={() => setSession({ ...session, paused: false })}><Play />Fortsätt passet</Button>
        </DialogContent>
      </Dialog>
    </ExerciseShell>
  );
};

export default Geometrigymmet;
