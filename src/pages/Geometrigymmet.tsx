import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, CircleCheck, Dumbbell, Flag, Flame, Lightbulb, Lock, Pause, Play } from "lucide-react";
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
  checkAnswer, emptyProgress, explanation, formatNumber, FUTURE_MODULES, generateQuestion, geometrigymmetAvailable, isNumberInput,
  MASTERY_THRESHOLD, masteredCount, newQuestion, nextSkill, parseProgress, praise, recordAnswer, ROUND_LENGTH, SKILLS, STAGES,
  UNITS, unlockedStage, type Progress, type Question,
} from "@/lib/geometrigymmet";

const TITLE = "Geometrigymmet";

type Session = { question: Question | null; active: boolean; paused: boolean; roundIndex: number; roundCorrect: number; feedback: "correct" | "incorrect" | null; newlyMastered: boolean };
const initialSession = (): Session => ({ question: null, active: false, paused: false, roundIndex: 0, roundCorrect: 0, feedback: null, newlyMastered: false });
const sessionKey = (uid: string) => `geometrigymmet-session-v1:${uid}`;

const isUnit = (u: unknown): u is keyof typeof UNITS => typeof u === "string" && Object.prototype.hasOwnProperty.call(UNITS, u);
/** Restores a paused/unfinished round on this device; anything unexpected starts fresh. */
function parseSession(raw: string | null): Session {
  try {
    const s = JSON.parse(raw ?? "null");
    if (!s || typeof s !== "object") return initialSession();
    const q = s.question;
    const okQ = q === null || (q && SKILLS.some((k) => k.id === q.skillId) && isUnit(q.from) && isUnit(q.to) && Number.isFinite(q.value) && Number.isFinite(q.answer) && Array.isArray(q.choices) && q.choices.every(isUnit));
    const idx = Number(s.roundIndex), cor = Number(s.roundCorrect);
    if (!okQ || !Number.isInteger(idx) || idx < 0 || idx > ROUND_LENGTH || !Number.isInteger(cor) || cor < 0 || cor > ROUND_LENGTH) return initialSession();
    return { question: q, active: Boolean(s.active), paused: Boolean(s.paused), roundIndex: idx, roundCorrect: cor, feedback: s.feedback === "correct" || s.feedback === "incorrect" ? s.feedback : null, newlyMastered: Boolean(s.newlyMastered) };
  } catch {
    return initialSession();
  }
}

const Geometrigymmet = () => {
  const { user, isAdmin } = useAuth();
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [session, setSession] = useState<Session>(initialSession);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [ownGrade, setOwnGrade] = useState<number | null | undefined>(undefined);
  const visibility = useGameVisibility(ownGrade && ownGrade >= 6 ? ownGrade : null);

  const [input, setInput] = useState("");
  const [unit, setUnit] = useState("");
  const [hint, setHint] = useState(false);
  const [validation, setValidation] = useState("");
  const [cheer, setCheer] = useState("");
  const answerRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

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
    try { localStorage.setItem(sessionKey(user.id), JSON.stringify(session)); } catch { /* private mode: round just isn't resumable */ }
  }, [session, user, ready]);

  const saveProgress = (p: Progress) => {
    setProgress(p);
    if (!user) return;
    void supabase.from("geometrigymmet_progress")
      .upsert({ user_id: user.id, progress: p, mastered_count: masteredCount(p), updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .then(({ error }) => setSaveFailed(Boolean(error)));
  };

  const q = session.question;
  useEffect(() => { setInput(""); setUnit(""); setHint(false); setValidation(""); if (session.active && !session.paused) answerRef.current?.focus(); }, [q, session.active, session.paused]);
  useEffect(() => {
    if (session.feedback) continueRef.current?.focus();
    if (session.feedback === "correct") setCheer(praise(firstName, progress.skills[q?.skillId ?? ""]?.streak ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.feedback]);

  const start = () => setSession({ ...initialSession(), active: true, question: generateQuestion(nextSkill(progress)) });
  const answer = (correct: boolean) => {
    if (!q || session.feedback || session.paused || !session.active) return;
    const updated = recordAnswer(progress, q.skillId, correct);
    const newlyMastered = !progress.skills[q.skillId]?.mastered && Boolean(updated.skills[q.skillId]?.mastered);
    saveProgress(updated);
    setSession({ ...session, feedback: correct ? "correct" : "incorrect", roundCorrect: session.roundCorrect + Number(correct), newlyMastered });
  };
  const advance = () => {
    if (!q || !session.feedback) return;
    if (session.roundIndex + 1 >= ROUND_LENGTH) {
      saveProgress({ ...progress, rounds: progress.rounds + 1 });
      setSession({ ...session, roundIndex: ROUND_LENGTH, feedback: null });
      return;
    }
    const s = SKILLS.find((k) => k.id === q.skillId) ?? nextSkill(progress);
    setSession({ ...session, roundIndex: session.roundIndex + 1, question: newQuestion(s, q), feedback: null, newlyMastered: false });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q) return;
    if (session.feedback) return advance();
    if (!isNumberInput(input)) return setValidation("Skriv ett tal, till exempel 12 eller 1,5.");
    if (q.chooseUnit && !unit) return setValidation("Välj också en enhet.");
    setValidation("");
    answer(checkAnswer(q, input, q.chooseUnit ? unit : q.to));
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

  const currentSkill = q ? SKILLS.find((s) => s.id === q.skillId) ?? nextSkill(progress) : nextSkill(progress);
  const skillProgress = progress.skills[currentSkill.id];
  const stageIndex = unlockedStage(progress);
  const completedRound = session.active && session.roundIndex === ROUND_LENGTH;
  const completedAll = masteredCount(progress) === SKILLS.length;
  const streak = Math.min(skillProgress?.streak ?? 0, MASTERY_THRESHOLD);
  const nextUnlock = STAGES[stageIndex + 1]?.title;

  return (
    <ExerciseShell title={TITLE} progress={{ value: masteredCount(progress), total: SKILLS.length, showLabel: false }}>
      <section className="exercise-card relative overflow-hidden rounded-3xl">
        <img src={labAsset.url} alt="Måttband, linjal, kuber och en mätbägare" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-90 [mask-image:linear-gradient(to_right,transparent,black_45%)]" />
        <div className="relative max-w-[62%] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">3.1 Prefix och enheter</p>
          <h1 className="mt-1 font-playful text-2xl font-bold sm:text-3xl">{firstName ? `Välkommen, ${firstName}` : "Träna enheterna starka"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Varje fråga är en rep. Klara {MASTERY_THRESHOLD} i rad så går du upp en nivå.</p>
        </div>
      </section>

      <section className="exercise-card overflow-hidden rounded-3xl" aria-label="Aktuellt pass">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 text-sm font-bold">
            <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Pass {progress.rounds + 1} · {currentSkill.label}</span>
          </div>
          <Button variant="ghost" size="sm" disabled={!session.active || completedRound || !q} onClick={() => setSession({ ...session, paused: true })}>
            <Pause className="h-4 w-4" />Pausa
          </Button>
        </header>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex gap-1.5" aria-label={`${session.roundIndex} av ${ROUND_LENGTH} reps klara`}>
            {Array.from({ length: ROUND_LENGTH }, (_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full",
                i < session.roundIndex || (i === session.roundIndex && session.feedback) ? "bg-primary" : i === session.roundIndex && session.active ? "bg-primary/30" : "bg-secondary")} />
            ))}
          </div>

          {!ready ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Hämtar dina framsteg …</p>
          ) : completedRound ? (
            <div className="exercise-rise py-6 text-center">
              <Flag className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-2 font-playful text-2xl font-bold">{firstName ? `Bra jobbat, ${firstName}!` : "Bra jobbat!"}</h2>
              <p className="mt-1 text-muted-foreground">{session.roundCorrect} av {ROUND_LENGTH} rätt under passet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {completedAll ? "Alla nivåer är klarade. Håll formen med repetition!" : skillProgress?.mastered ? "Ny nivå upplåst – dags att lägga på mer vikt!" : `${streak} rätt i rad. Nästa pass bygger vidare.`}
              </p>
              <Button size="lg" className="mt-5 h-12 rounded-full px-7 font-bold" onClick={start}>Nästa pass<ArrowRight /></Button>
            </div>
          ) : !session.active || !q ? (
            <div className="exercise-rise py-4 text-center">
              <h2 className="font-playful text-2xl font-bold">{firstName ? `Redo att köra, ${firstName}?` : "Redo att köra?"}</h2>
              <p className="mt-1 text-muted-foreground">Nästa övning: {nextSkill(progress).label.toLowerCase()}.</p>
              <p className="mt-1 text-sm text-muted-foreground">{ROUND_LENGTH} reps per pass · {MASTERY_THRESHOLD} rätt i rad låser upp nästa nivå</p>
              <Button size="lg" className="mt-5 h-12 rounded-full px-7 font-bold" onClick={start}><Play />Starta passet</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                  {skillProgress?.mastered ? "Repetition" : currentSkill.category} · Rep {session.roundIndex + 1} av {ROUND_LENGTH}
                </span>
                <h2 className="mt-3 text-xl font-bold sm:text-2xl">{q.chooseUnit ? "Vilket mått motsvarar mängden?" : `Hur många ${q.to} är ${formatNumber(q.value)} ${q.from}?`}</h2>
                <p className="text-sm text-muted-foreground">{q.mission}{q.chooseUnit && " Välj rätt enhet själv."}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-2xl font-bold sm:text-3xl">
                <span>{formatNumber(q.value)} {q.from}</span>
                <span className="text-muted-foreground">=</span>
                <label className="sr-only" htmlFor="gg-answer">Ditt svar</label>
                <input ref={answerRef} id="gg-answer" type="text" inputMode="decimal" autoComplete="off" placeholder="?" value={input}
                  disabled={Boolean(session.feedback) || session.paused} onChange={(e) => setInput(e.target.value)}
                  aria-invalid={Boolean(validation)} aria-describedby={validation ? "gg-error" : undefined}
                  className="h-14 w-36 rounded-xl border-2 border-input bg-card text-center text-2xl font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
                {q.chooseUnit ? (
                  <select aria-label="Välj enhet" value={unit} disabled={Boolean(session.feedback)} onChange={(e) => setUnit(e.target.value)}
                    className="h-14 rounded-xl border-2 border-input bg-card px-3 text-xl font-bold">
                    <option value="">Enhet</option>
                    {q.choices.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : <span>{q.to}</span>}
              </div>
              {validation && <p id="gg-error" role="alert" className="text-sm font-semibold text-destructive">{validation}</p>}

              {session.feedback === "correct" && (
                <div role="status" className="gg-ok exercise-rise rounded-2xl px-4 py-3">
                  <p className="flex items-center gap-2 text-lg font-bold"><CircleCheck className="h-5 w-5" />
                    {session.newlyMastered ? (firstName ? `Ny nivå, ${firstName}!` : "Ny nivå upplåst!") : cheer || "Snyggt!"}
                  </p>
                  <p className="text-sm">{session.newlyMastered ? `${MASTERY_THRESHOLD} rätt i rad – nu klarar du tyngre vikter!` : `${formatNumber(q.value)} ${q.from} = ${formatNumber(q.answer)} ${q.to}.`}</p>
                </div>
              )}
              {session.feedback === "incorrect" && (
                <div role="status" className="gg-tip exercise-rise space-y-1 rounded-2xl px-4 py-3 text-sm">
                  <p className="flex items-center gap-2 text-base font-bold"><Lightbulb className="h-5 w-5" />{firstName ? `Nästan, ${firstName} – så här funkar det:` : "Nästan – så här funkar det:"}</p>
                  <p>{explanation(q)}</p>
                  <UnitLadder question={q} />
                  <p className="font-bold">{formatNumber(q.value)} {q.from} = {formatNumber(q.answer)} {q.to}</p>
                  <p className="text-muted-foreground">Sviten börjar om, men alla klarade nivåer finns kvar. Nästa rep!</p>
                </div>
              )}
              {hint && !session.feedback && (
                <div className="rounded-2xl bg-secondary px-4 py-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4" />Tänk i enhetssteg</p>
                  <UnitLadder question={q} />
                  <p className="text-muted-foreground">Mot en mindre enhet blir talet större. Mot en större enhet blir talet mindre.</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" type="button" disabled={Boolean(session.feedback)} onClick={() => setHint(!hint)} className="text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />{hint ? "Dölj ledtråd" : "Visa ledtråd"}
                </Button>
                {session.feedback ? (
                  <Button key="next" ref={continueRef} type="button" size="lg" onClick={advance} className="h-12 rounded-full px-7 font-bold">
                    {session.roundIndex + 1 === ROUND_LENGTH ? "Avsluta passet" : "Nästa fråga"}<ArrowRight />
                  </Button>
                ) : (
                  <Button key="check" type="submit" size="lg" className="h-12 rounded-full px-7 font-bold">Kontrollera<ArrowRight /></Button>
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
          <UnitLadder question={q ?? { from: "m", to: "mm" }} />
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
