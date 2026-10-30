import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogIn, Mic, MicOff, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import MicrophoneMeter from "@/components/MicrophoneMeter";
import { createVoiceAnswerHandler } from "@/lib/tabelltestVoice";
import {
  generateQuestions, isPassed, passAvgMs,
  INPUT_MODE_LABELS, QUESTION_COUNT, PASS_SCORE,
  type InputMode, type TabellQuestion,
} from "@/lib/tabelltest";

type Phase = "idle" | "running" | "done";

interface ResultRow {
  score: number;
  total: number;
  avg_time_ms: number;
  passed: boolean;
  input_mode: InputMode;
  created_at: string;
}

const formatTime = (ms: number) => (ms / 1000).toFixed(1).replace(".", ",") + " s";

const Tabelltest = () => {
  const { user, loading, accessStatus, isAdmin, signInWithGoogle } = useAuth();
  const allowed = !!user && (isAdmin || accessStatus === "approved");

  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<InputMode>("voice");
  const [questions, setQuestions] = useState<TabellQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [avgMs, setAvgMs] = useState(0);
  const [best, setBest] = useState<ResultRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [listening, setListening] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [micRequestKey, setMicRequestKey] = useState(0);
  const [heard, setHeard] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; key: number } | null>(null);

  const timesRef = useRef<number[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const questionStartRef = useRef(0);
  const scoreRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceHandlerRef = useRef<ReturnType<typeof createVoiceAnswerHandler> | null>(null);
  const voiceHandlersRef = useRef(new Set<ReturnType<typeof createVoiceAnswerHandler>>());
  const voiceWantedRef = useRef(false);
  const voiceHistoryRef = useRef<string[]>([]);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const updateMicReady = useCallback((ready: boolean, unavailable: boolean) => {
    setMicReady(ready);
    setMicDenied(unavailable);
  }, []);

  const retryMicPermission = () => {
    setMicReady(false);
    setMicDenied(false);
    setMicRequestKey((k) => k + 1);
  };

  const loadBest = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tabelltest_results")
      .select("score,total,avg_time_ms,passed,input_mode,created_at")
      .eq("user_id", user.id)
      .order("passed", { ascending: false })
      .order("avg_time_ms", { ascending: true })
      .limit(1);
    setBest((data?.[0] as ResultRow | undefined) ?? null);
  }, [user]);

  useEffect(() => {
    document.title = "Tabelltestet – Mattebo";
  }, []);

  useEffect(() => {
    if (!user) return;
    loadBest();
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user, loadBest]);

  const stopListening = useCallback(() => {
    voiceWantedRef.current = false;
    clearTimeout(restartTimerRef.current);
    voiceHandlersRef.current.forEach((handler) => handler.stop());
    voiceHandlersRef.current.clear();
    voiceHandlerRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  const showFeedback = useCallback((correct: boolean) => {
    clearTimeout(feedbackTimerRef.current);
    setFeedback({ correct, key: Date.now() });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1100);
  }, []);

  const clearFeedback = useCallback(() => {
    clearTimeout(feedbackTimerRef.current);
    setFeedback(null);
  }, []);

  const startTest = () => {
    const qs = generateQuestions();
    setQuestions(qs);
    setIndex(0);
    setAnswer("");
    setScore(0);
    scoreRef.current = 0;
    timesRef.current = [];
    voiceHistoryRef.current.length = 0;
    setSaveError(false);
    setHeard("");
    setVoiceStatus("");
    clearFeedback();
    setPhase("running");
    questionStartRef.current = performance.now();
    if (mode === "voice" && speechSupported && !listening) toggleListening();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const finish = useCallback(
    async (finalScore: number, times: number[]) => {
      stopListening();
      clearFeedback();
      const avg = times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : 0;
      setScore(finalScore);
      setAvgMs(avg);
      setPhase("done");
      if (!user) return;
      const passed = isPassed(finalScore, avg, mode);
      const { error } = await supabase.from("tabelltest_results").insert({
        user_id: user.id,
        score: finalScore,
        total: QUESTION_COUNT,
        avg_time_ms: avg,
        passed,
        input_mode: mode,
      });
      if (error) setSaveError(true);
      else loadBest();
    },
    [user, mode, stopListening, loadBest, clearFeedback],
  );

  const submitAnswer = useCallback(
    (raw: string) => {
      if (phase !== "running") return;
      const value = parseInt(raw.trim(), 10);
      if (Number.isNaN(value)) return;
      const elapsed = performance.now() - questionStartRef.current;
      timesRef.current.push(elapsed);
      const q = questions[index];
      const correct = value === q.answer;
      const newScore = scoreRef.current + (correct ? 1 : 0);
      scoreRef.current = newScore;
      setScore(newScore);
      showFeedback(correct);
      const next = index + 1;
      if (next >= questions.length) {
        void finish(newScore, timesRef.current);
      } else {
        setIndex(next);
        setAnswer("");
        questionStartRef.current = performance.now();
        setTimeout(() => inputRef.current?.focus(), 30);
      }
    },
    [phase, questions, index, finish, showFeedback],
  );

  // Continuous recognition outlives each question's callback.
  const submitAnswerRef = useRef(submitAnswer);
  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
  }, [submitAnswer]);

  const toggleListening = () => {
    if (voiceWantedRef.current) {
      stopListening();
      return;
    }
    const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    voiceWantedRef.current = true;
    let restarts = 0;
    const connect = () => {
    if (!voiceWantedRef.current) return;
    const rec = new Ctor();
    rec.lang = "sv-SE";
    rec.continuous = true;
    rec.interimResults = true;
    const handler = createVoiceAnswerHandler((number) => {
      setAnswer(String(number));
      submitAnswerRef.current(String(number));
    }, setHeard, voiceHistoryRef.current);
    voiceHandlerRef.current = handler;
    voiceHandlersRef.current.add(handler);
    rec.onresult = (event: Parameters<typeof handler.handle>[0]) => {
      restarts = 0;
      handler.handle(event);
    };
    rec.onstart = () => setVoiceStatus("");
    rec.onerror = (event: { error: string }) => {
      if (event.error === "no-speech") return;
      stopListening();
      setVoiceStatus(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Röstinmatningen saknar tillstånd. Tillåt mikrofonen och tryck på mikrofonknappen."
        : "Röstinmatningen avbröts. Tryck på mikrofonknappen för att försöka igen.");
    };
    rec.onend = () => {
      handler.end();
      if (!voiceWantedRef.current) return;
      if (restarts >= 3) {
        stopListening();
        setVoiceStatus("Röstinmatningen kunde inte återansluta. Tryck på mikrofonknappen för att försöka igen.");
        return;
      }
      setVoiceStatus("Återansluter röstinmatningen…");
      restartTimerRef.current = setTimeout(connect, 300 * 2 ** restarts++);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      stopListening();
      setVoiceStatus("Röstinmatningen kunde inte starta. Tryck på mikrofonknappen för att försöka igen.");
    }
    };
    connect();
  };

  const passed = isPassed(score, avgMs, mode);
  const displayName = fullName || user?.email || "";

  if (loading) {
    return (
      <div className="exercise-light flex h-screen items-center justify-center">
        <p className="text-muted-foreground font-nunito">Laddar…</p>
      </div>
    );
  }

  if (!user || !allowed) {
    return (
      <div className="exercise-light flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-orbitron text-3xl font-bold text-foreground">Tabelltestet</h1>
        <p className="max-w-md font-nunito text-muted-foreground">
          {!user
            ? "Logga in med ditt skolkonto för att göra tabelltestet. Ditt namn hämtas från din profil."
            : "Ditt konto väntar på godkännande. Prata med din lärare."}
        </p>
        {!user && (
          <Button onClick={() => signInWithGoogle("/tabelltestet")} className="gap-2">
            <LogIn className="h-4 w-4" /> Logga in med Google
          </Button>
        )}
        <Link to="/" className="nav-link inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till Mattebo
        </Link>
      </div>
    );
  }

  const q = questions[index];

  return (
    <ExerciseShell title="Tabelltestet"
      progress={phase === "running" && questions.length ? { value: index, total: questions.length, showLabel: false } : phase === "done" ? { value: 1, total: 1, showLabel: false } : undefined}>
      <div className="flex justify-center pt-2 sm:pt-6">
        <div className="exercise-card w-full max-w-lg rounded-[1.75rem] p-6 text-center sm:p-8">
          {displayName && <p className="mb-1 text-xs font-semibold text-muted-foreground">{displayName}</p>}
          <h1 className="font-orbitron text-2xl font-bold text-foreground sm:text-3xl">
            Tabelltestet
          </h1>

          {mode === "voice" && speechSupported && phase !== "done" && (
            <div className="mt-5 flex flex-col items-center gap-2 font-nunito">
              <MicrophoneMeter key={micRequestKey} active={phase === "idle" || listening} onReadyChange={updateMicReady} />
              <p className={`text-sm ${micDenied ? "text-destructive" : "text-accent"}`} role="status">
                {micDenied ? "Mikrofonen är blockerad eller inte tillgänglig. Tillåt mikrofonen i webbläsaren."
                  : micReady ? "Mikrofonen är på – ljudnivån visas ovan."
                  : phase === "running" && !listening ? "Mikrofonen är avstängd."
                  : "Ansluter mikrofonen… tillåt den om webbläsaren frågar."}
              </p>
              {micDenied && <Button type="button" variant="outline" onClick={retryMicPermission}>Försök igen</Button>}
            </div>
          )}

          {phase === "idle" && (
            <div className="mt-6 space-y-5 font-nunito">
              <p className="text-muted-foreground">
                {QUESTION_COUNT} slumpvisa uppgifter ur tabellerna 2–9. Godkänt: minst{" "}
                {PASS_SCORE} rätt på högst {formatTime(passAvgMs(mode))} i snitt per uppgift.
              </p>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Välj hur du vill svara:</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant={mode === "voice" ? "default" : "outline"}
                    onClick={() => setMode("voice")}
                    disabled={!speechSupported}
                    className="gap-2 font-nunito"
                  >
                    <Mic className="h-4 w-4" /> Röst ({formatTime(passAvgMs("voice"))})
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "keyboard" ? "default" : "outline"}
                    onClick={() => setMode("keyboard")}
                    className="font-nunito"
                  >
                    Tangentbord ({formatTime(passAvgMs("keyboard"))})
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {mode === "voice"
                    ? speechSupported
                      ? "Säg svaren i mikrofonen. Tangentbordet fungerar som backup."
                      : "Röstinmatning stöds inte i den här webbläsaren – välj tangentbord."
                    : "Skriv svaren med siffrorna på tangentbordet."}
                </p>
              </div>
              {best && (
                <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-sm text-accent">
                  <Trophy className="h-4 w-4" />
                  Personbästa: {best.score}/{best.total} rätt · {formatTime(best.avg_time_ms)}
                  {best.passed ? " · Godkänt" : ""}
                </p>
              )}
              <div>
                <Button size="lg" onClick={startTest} disabled={mode === "voice" && (!speechSupported || !micReady || micDenied)} className="font-nunito text-base">
                  Starta testet
                </Button>
              </div>
            </div>
          )}

          {phase === "running" && q && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-center gap-5">
                <div className="text-center">
                  <p className="font-orbitron text-4xl font-bold leading-none text-accent">{score}</p>
                  <p className="mt-1 font-nunito text-xs uppercase tracking-wider text-muted-foreground">rätt</p>
                </div>
                <p className="font-nunito text-sm text-muted-foreground">
                  Uppgift {index + 1} av {questions.length} · {INPUT_MODE_LABELS[mode]} · gräns{" "}
                  {formatTime(passAvgMs(mode))}
                </p>
              </div>
              <p className="font-orbitron text-5xl font-bold text-foreground sm:text-6xl">
                {q.a} × {q.b}
              </p>
              <div aria-live="assertive" className="flex min-h-12 items-center justify-center">
                {feedback && (
                  <p
                    key={feedback.key}
                    className={`font-orbitron text-3xl font-bold ${
                      feedback.correct
                        ? "animate-answer-correct text-[hsl(var(--survey-good))]"
                        : "text-destructive"
                    }`}
                  >
                    {feedback.correct ? "Rätt!" : "Fel"}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center gap-3">
                <input
                  ref={inputRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submitAnswer(answer)}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Ditt svar"
                  className="w-32 rounded-2xl border border-primary/30 bg-background px-4 py-3 text-center font-orbitron text-3xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {speechSupported && mode === "voice" && (
                  <div className="flex w-16 flex-shrink-0 flex-col items-center gap-1">
                    <Button
                    type="button"
                    variant={listening ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleListening}
                    title={listening ? "Stoppa röstinmatning" : "Svara med rösten"}
                    aria-label={listening ? "Stoppa röstinmatning" : "Svara med rösten"}
                  >
                    {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  </div>
                )}
              </div>
              {listening && (
                <p className="font-nunito text-sm text-accent" role="status">
                  Lyssnar… säg svaret.
                </p>
              )}
              {mode === "voice" && (
                <div className="min-h-16 border-t border-primary/30 pt-3 font-nunito" aria-live="polite" aria-atomic="true">
                  <p className="text-sm text-muted-foreground">Senast uppfattat</p>
                  <p className="break-words text-lg font-semibold text-foreground">
                    {heard || "Inget röstsvar har kommit fram ännu"}
                  </p>
                </div>
              )}
              {voiceStatus && <p className="font-nunito text-sm text-destructive" role="status">{voiceStatus}</p>}
              <Button size="lg" onClick={() => submitAnswer(answer)} className="font-nunito">
                Svara
              </Button>
            </div>
          )}

          {phase === "done" && (
            <div className="mt-6 space-y-5 font-nunito">
              <p
                className={`font-orbitron text-3xl font-bold ${
                  passed ? "text-accent" : "text-destructive"
                }`}
              >
                {passed ? "Godkänt!" : "Inte godkänt än"}
              </p>
              <p className="text-lg text-foreground">
                {score} av {QUESTION_COUNT} rätt · snittid {formatTime(avgMs)} ·{" "}
                {INPUT_MODE_LABELS[mode]}
              </p>
              <p className="text-sm text-muted-foreground">
                {passed
                  ? "Bra jobbat! Resultatet är sparat. Gör gärna ett nytt försök för att förbättra din tid."
                  : `Du behöver minst ${PASS_SCORE} rätt på högst ${formatTime(passAvgMs(mode))} i snitt. Försök igen!`}
              </p>
              {saveError && (
                <p className="text-sm text-destructive">
                  Resultatet kunde inte sparas just nu – gör ett nytt försök.
                </p>
              )}
              {best && (
                <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-4 py-2 text-sm text-accent">
                  <Trophy className="h-4 w-4" />
                  Personbästa: {best.score}/{best.total} rätt · {formatTime(best.avg_time_ms)}
                  {best.passed ? " · Godkänt" : ""}
                </p>
              )}
              <div>
                <Button size="lg" onClick={startTest} className="font-nunito">
                  Försök igen
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ExerciseShell>
  );
};

export default Tabelltest;
