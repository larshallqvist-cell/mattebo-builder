import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogIn, Mic, MicOff, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  generateQuestions, isPassed, parseSpokenNumber,
  QUESTION_COUNT, PASS_SCORE, PASS_AVG_MS, type TabellQuestion,
} from "@/lib/tabelltest";

type Phase = "idle" | "running" | "done";

interface ResultRow {
  score: number;
  total: number;
  avg_time_ms: number;
  passed: boolean;
  created_at: string;
}

const formatTime = (ms: number) => (ms / 1000).toFixed(1).replace(".", ",") + " s";

const Tabelltest = () => {
  const { user, loading, accessStatus, isAdmin, signInWithGoogle } = useAuth();
  const allowed = !!user && (isAdmin || accessStatus === "approved");

  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<TabellQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [avgMs, setAvgMs] = useState(0);
  const [best, setBest] = useState<ResultRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [listening, setListening] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const timesRef = useRef<number[]>([]);
  const questionStartRef = useRef(0);
  const scoreRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const loadBest = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tabelltest_results")
      .select("score,total,avg_time_ms,passed,created_at")
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
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  const startTest = () => {
    const qs = generateQuestions();
    setQuestions(qs);
    setIndex(0);
    setAnswer("");
    setScore(0);
    scoreRef.current = 0;
    timesRef.current = [];
    setSaveError(false);
    setPhase("running");
    questionStartRef.current = performance.now();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const finish = useCallback(
    async (finalScore: number, times: number[]) => {
      stopListening();
      const avg = times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : 0;
      setScore(finalScore);
      setAvgMs(avg);
      setPhase("done");
      if (!user) return;
      const passed = isPassed(finalScore, avg);
      const { error } = await supabase.from("tabelltest_results").insert({
        user_id: user.id,
        score: finalScore,
        total: QUESTION_COUNT,
        avg_time_ms: avg,
        passed,
      });
      if (error) setSaveError(true);
      else loadBest();
    },
    [user, stopListening, loadBest],
  );

  const submitAnswer = useCallback(
    (raw: string) => {
      if (phase !== "running") return;
      const value = parseInt(raw.trim(), 10);
      if (Number.isNaN(value)) return;
      const elapsed = performance.now() - questionStartRef.current;
      timesRef.current.push(elapsed);
      const q = questions[index];
      const newScore = scoreRef.current + (value === q.answer ? 1 : 0);
      scoreRef.current = newScore;
      setScore(newScore);
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
    [phase, questions, index, finish],
  );

  const toggleListening = () => {
    if (listening) {
      stopListening();
      return;
    }
    const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "sv-SE";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript ?? "";
      const number = parseSpokenNumber(transcript);
      if (number != null) {
        setAnswer(String(number));
        submitAnswer(String(number));
      }
    };
    rec.onerror = () => stopListening();
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const passed = isPassed(score, avgMs);
  const displayName = fullName || user?.email || "";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-nunito">Laddar…</p>
      </div>
    );
  }

  if (!user || !allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="nav-link inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Mattebo
        </Link>
        <span className="font-nunito text-sm text-muted-foreground">{displayName}</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div
          className="w-full max-w-lg rounded-[2rem] border border-primary/20 bg-secondary/40 p-8 text-center backdrop-blur-sm"
          style={{
            boxShadow:
              "0 24px 50px -24px hsl(211 69% 6% / 0.9), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
          }}
        >
          <h1 className="font-orbitron text-2xl font-bold text-foreground sm:text-3xl">
            Tabelltestet
          </h1>

          {phase === "idle" && (
            <div className="mt-6 space-y-5 font-nunito">
              <p className="text-muted-foreground">
                {QUESTION_COUNT} slumpvisa uppgifter ur tabellerna 2–9. Godkänt: minst{" "}
                {PASS_SCORE} rätt på högst {formatTime(PASS_AVG_MS)} i snitt per uppgift.
              </p>
              {speechSupported && (
                <p className="text-sm text-muted-foreground">
                  Svara med rösten via mikrofonen, eller skriv svaret med tangentbordet.
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
                <Button size="lg" onClick={startTest} className="font-nunito text-base">
                  Starta testet
                </Button>
              </div>
            </div>
          )}

          {phase === "running" && q && (
            <div className="mt-6 space-y-6">
              <p className="font-nunito text-sm text-muted-foreground">
                Uppgift {index + 1} av {questions.length}
              </p>
              <p className="font-orbitron text-5xl font-bold text-foreground sm:text-6xl">
                {q.a} × {q.b}
              </p>
              <div className="flex items-center justify-center gap-3">
                <input
                  ref={inputRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submitAnswer(answer)}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Ditt svar"
                  className="w-32 rounded-2xl border border-primary/30 bg-background/60 px-4 py-3 text-center font-orbitron text-3xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {speechSupported && (
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
                )}
              </div>
              {listening && (
                <p className="font-nunito text-sm text-accent" role="status">
                  Lyssnar… säg svaret.
                </p>
              )}
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
                {score} av {QUESTION_COUNT} rätt · snittid {formatTime(avgMs)}
              </p>
              <p className="text-sm text-muted-foreground">
                {passed
                  ? "Bra jobbat! Resultatet är sparat. Gör gärna ett nytt försök för att förbättra din tid."
                  : `Du behöver minst ${PASS_SCORE} rätt på högst ${formatTime(PASS_AVG_MS)} i snitt. Försök igen!`}
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
      </main>
    </div>
  );
};

export default Tabelltest;
