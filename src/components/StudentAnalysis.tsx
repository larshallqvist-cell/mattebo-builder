import { useEffect, useState } from "react";
import { Sparkles, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Admin: AI-generated pedagogical analysis of one student, optionally with pasted exam results. */
export default function StudentAnalysis({ userId }: { userId: string }) {
  const [exam, setExam] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setText(""); setError(""); setExam(""); }, [userId]);

  const run = async () => {
    setBusy(true); setError("");
    const { data, error: err } = await supabase.functions.invoke("student-analysis", { body: { userId, examText: exam } });
    setBusy(false);
    if (err || !data?.analysis) {
      const status = (err as { context?: { status?: number } } | null)?.context?.status;
      setError(status === 429 ? "För många analyser just nu – vänta en stund." : status === 402 ? "AI-krediterna är slut." : "Analysen misslyckades. Försök igen.");
      return;
    }
    setText(data.analysis);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Namnet skickas inte med. Klistra gärna in elevens provresultat (t.ex. "Bråk 6/8, Ekvationer 2/8").</p>
      <Textarea value={exam} onChange={(e) => setExam(e.target.value)} placeholder="Provresultat (valfritt)" rows={3} maxLength={4000} />
      <div className="flex gap-2">
        <Button onClick={run} disabled={busy} size="sm"><Sparkles className="w-4 h-4 mr-1" />{busy ? "Analyserar…" : "Generera pedagogisk analys"}</Button>
        {text && <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(text)}><Copy className="w-4 h-4 mr-1" />Kopiera</Button>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {text && <div className="prose prose-sm prose-invert max-w-none rounded-lg border border-border p-4"><ReactMarkdown>{text}</ReactMarkdown></div>}
    </div>
  );
}
