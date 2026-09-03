import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, LightbulbOff, Download, AlertTriangle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_GRADES, DEFAULT_GRADE } from "@/config/app";
import {
  SURVEY_QUESTIONS,
  SURVEY_SCALE,
  weekStartOf,
  formatWeekLabel,
  type SurveyQuestionKey,
} from "@/lib/survey";
import SurveyDialog from "@/components/SurveyDialog";
import type { SurveyAnswers } from "@/hooks/useWeeklySurvey";

interface SurveyRow {
  id: string;
  grade: number;
  week_start: string;
  is_open: boolean;
}

interface ResponseRow {
  id: string;
  survey_id: string;
  user_id: string;
  q_learning: number;
  q_effort: number;
  q_calm: number;
  q_teacher: number;
  learned_text: string;
  wish_text: string;
  created_at: string;
}

const scaleColor = (value: number) =>
  value === 3 ? "var(--survey-good)" : value === 2 ? "var(--survey-mid)" : "var(--survey-bad)";

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

const SurveyAdmin = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState<number>(DEFAULT_GRADE);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: surveyRows } = await supabase
      .from("weekly_surveys")
      .select("id, grade, week_start, is_open")
      .eq("grade", grade)
      .order("week_start", { ascending: false })
      .limit(20);

    const list = (surveyRows ?? []) as SurveyRow[];
    setSurveys(list);
    setSelectedWeek((prev) =>
      prev && list.some((s) => s.week_start === prev) ? prev : list[0]?.week_start ?? null,
    );

    if (list.length === 0) {
      setResponses([]);
      setLoading(false);
      return;
    }

    const { data: responseRows } = await supabase
      .from("survey_responses")
      .select("*")
      .in(
        "survey_id",
        list.map((s) => s.id),
      );

    const rows = (responseRows ?? []) as ResponseRow[];
    setResponses(rows);

    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const map: Record<string, string> = {};
      (profileRows ?? []).forEach((p: { id: string; full_name: string | null; email: string | null }) => {
        map[p.id] = p.full_name?.trim() || p.email || "Okänd elev";
      });
      setNames(map);
    }
    setLoading(false);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  const currentWeek = weekStartOf();
  const currentSurvey = surveys.find((s) => s.week_start === currentWeek) ?? null;
  const selectedSurvey = surveys.find((s) => s.week_start === selectedWeek) ?? null;

  const weekResponses = useMemo(
    () => responses.filter((r) => r.survey_id === selectedSurvey?.id),
    [responses, selectedSurvey],
  );

  /** Averages per question for each week, oldest first — the trend. */
  const trend = useMemo(() => {
    return [...surveys]
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
      .map((s) => {
        const rows = responses.filter((r) => r.survey_id === s.id);
        const values = {} as Record<SurveyQuestionKey, number>;
        SURVEY_QUESTIONS.forEach((q) => {
          values[q.key] = average(rows.map((r) => r[q.key] as number));
        });
        return { week_start: s.week_start, count: rows.length, values };
      })
      .filter((w) => w.count > 0);
  }, [surveys, responses]);

  /** Students who answered "Nej" on the same question two weeks running. */
  const flagged = useMemo(() => {
    const sorted = [...surveys].sort((a, b) => b.week_start.localeCompare(a.week_start));
    const lastTwo = sorted.slice(0, 2);
    if (lastTwo.length < 2) return [];
    const out: { user_id: string; label: string }[] = [];
    const byUser = new Map<string, ResponseRow[]>();
    responses
      .filter((r) => lastTwo.some((s) => s.id === r.survey_id))
      .forEach((r) => byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]));

    byUser.forEach((rows, userId) => {
      if (rows.length < 2) return;
      SURVEY_QUESTIONS.forEach((q) => {
        if (rows.every((r) => (r[q.key] as number) === 1)) {
          out.push({ user_id: userId, label: q.label });
        }
      });
    });
    return out;
  }, [surveys, responses]);

  const toggleSurvey = async () => {
    setBusy(true);
    try {
      if (currentSurvey) {
        const { error } = await supabase
          .from("weekly_surveys")
          .update({
            is_open: !currentSurvey.is_open,
            closed_at: currentSurvey.is_open ? new Date().toISOString() : null,
          })
          .eq("id", currentSurvey.id);
        if (error) throw error;
        toast({ title: currentSurvey.is_open ? "Avstämningen stängd" : "Avstämningen öppnad" });
      } else {
        const { error } = await supabase
          .from("weekly_surveys")
          .insert({ grade, week_start: currentWeek, is_open: true });
        if (error) throw error;
        toast({ title: "Avstämningen är öppen", description: `Åk ${grade}, ${formatWeekLabel(currentWeek)}` });
      }
      await load();
    } catch (err) {
      toast({
        title: "Gick inte att ändra",
        description: err instanceof Error ? err.message : "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    if (!selectedSurvey) return;
    const header = [
      "Elev",
      ...SURVEY_QUESTIONS.map((q) => q.label),
      "Lärde mig",
      "Önskemål",
      "Inskickat",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = weekResponses.map((r) =>
      [
        names[r.user_id] ?? r.user_id,
        ...SURVEY_QUESTIONS.map((q) => String(r[q.key])),
        r.learned_text,
        r.wish_text,
        new Date(r.created_at).toLocaleString("sv-SE"),
      ]
        .map(escape)
        .join(";"),
    );
    const csv = "\uFEFF" + [header.map(escape).join(";"), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `avstamning-ak${grade}-${selectedSurvey.week_start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex gap-1">
          {SUPPORTED_GRADES.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={g === grade ? "default" : "outline"}
              onClick={() => setGrade(g)}
            >
              Åk {g}
            </Button>
          ))}
        </div>
      </div>
        {/* Open / close */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={toggleSurvey} disabled={busy} className="gap-2">
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentSurvey?.is_open ? (
              <LightbulbOff className="w-4 h-4" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            {currentSurvey?.is_open ? "Stäng veckans avstämning" : "Öppna veckans avstämning"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            disabled={!selectedSurvey}
            title={selectedSurvey ? "Se hur elevenkätens dialog ser ut" : "Skapa en avstämning först"}
            className="gap-1"
          >
            <Eye className="w-4 h-4" /> Förhandsgranska elevvyn
          </Button>
          <span className="text-sm text-muted-foreground font-nunito">
            {formatWeekLabel(currentWeek)} ·{" "}
            {currentSurvey?.is_open ? "lampan lyser för eleverna" : "lampan är släckt"}
          </span>
        </div>

        {selectedSurvey && (
          <SurveyDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            survey={selectedSurvey}
            existing={null}
            onSubmit={async (_: SurveyAnswers) => {}}
            preview
          />
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Laddar…</p>
        ) : surveys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga avstämningar för Åk {grade} ännu.
          </p>
        ) : (
          <>
            {/* Week picker */}
            <div className="flex gap-2 flex-wrap">
              {surveys.map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  variant={s.week_start === selectedWeek ? "secondary" : "ghost"}
                  onClick={() => setSelectedWeek(s.week_start)}
                >
                  {formatWeekLabel(s.week_start)}
                </Button>
              ))}
            </div>

            {/* Summary for the selected week */}
            <div className="space-y-3">
              <p className="text-sm font-nunito text-muted-foreground">
                {weekResponses.length} svar denna vecka
              </p>
              {SURVEY_QUESTIONS.map((q) => {
                const counts = SURVEY_SCALE.map(
                  (s) => weekResponses.filter((r) => r[q.key] === s.value).length,
                );
                const total = counts.reduce((a, b) => a + b, 0) || 1;
                return (
                  <div key={q.key}>
                    <div className="flex justify-between text-sm font-nunito mb-1">
                      <span className="font-semibold text-foreground">{q.label}</span>
                      <span className="text-muted-foreground">
                        snitt {average(weekResponses.map((r) => r[q.key] as number)).toFixed(1)} / 3
                      </span>
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                      {SURVEY_SCALE.map((s, i) => (
                        <div
                          key={s.value}
                          title={`${s.label}: ${counts[i]}`}
                          style={{
                            width: `${(counts[i] / total) * 100}%`,
                            background: `hsl(var(${s.token}))`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trend */}
            {trend.length > 1 && (
              <div>
                <h3 className="text-sm font-nunito font-semibold mb-2 text-foreground">
                  Trend över veckorna
                </h3>
                <div className="space-y-2">
                  {SURVEY_QUESTIONS.map((q) => (
                    <div key={q.key} className="flex items-center gap-2">
                      <span className="w-32 flex-shrink-0 text-xs font-nunito text-muted-foreground">
                        {q.label}
                      </span>
                      <div className="flex gap-1 items-end h-10 flex-1">
                        {trend.map((w) => {
                          const v = w.values[q.key];
                          return (
                            <div
                              key={w.week_start}
                              title={`${formatWeekLabel(w.week_start)}: ${v.toFixed(1)}`}
                              className="flex-1 rounded-t"
                              style={{
                                height: `${(v / 3) * 100}%`,
                                background: `hsl(${scaleColor(Math.round(v))})`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flagged students */}
            {flagged.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-1">
                <p className="flex items-center gap-2 text-sm font-nunito font-semibold text-foreground">
                  <AlertTriangle className="w-4 h-4" /> Behöver uppmärksamhet
                </p>
                {flagged.map((f, i) => (
                  <p key={`${f.user_id}-${f.label}-${i}`} className="text-sm text-muted-foreground">
                    {names[f.user_id] ?? "Okänd elev"} — "Nej" på {f.label} två veckor i rad
                  </p>
                ))}
              </div>
            )}

            {/* Individual answers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-nunito font-semibold text-foreground">Elevsvar</h3>
                <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1">
                  <Download className="w-4 h-4" /> CSV
                </Button>
              </div>
              {weekResponses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga svar ännu.</p>
              ) : (
                weekResponses.map((r) => (
                  <div key={r.id} className="rounded-md border border-border p-3 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-nunito font-semibold text-sm text-foreground">
                        {names[r.user_id] ?? "Okänd elev"}
                      </span>
                      {SURVEY_QUESTIONS.map((q) => (
                        <span
                          key={q.key}
                          title={q.label}
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: `hsl(${scaleColor(r[q.key] as number)})` }}
                        />
                      ))}
                    </div>
                    {r.learned_text && (
                      <p className="text-sm text-muted-foreground">Lärde sig: {r.learned_text}</p>
                    )}
                    {r.wish_text && (
                      <p className="text-sm text-muted-foreground">Önskar: {r.wish_text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
    </div>
  );
};

export default SurveyAdmin;
