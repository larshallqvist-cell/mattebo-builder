import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { buildStats, type Attempt } from "@/lib/algebraStats";
import { PROCENT_MODES } from "@/components/ProcentResults";
import { PAGE_LABELS, formatActiveTime } from "@/lib/studentActivity";
import { CLASS_GRADES, NOT_STUDENT, classLabel, isClassGrade, type RosterStudent } from "@/lib/studentClasses";
import {
  summarizeActivity, summarizeTabelltest, surveyHistory,
  type ResourceRow, type SurveyMeta, type SurveyRow, type TabelltestRow, type VisitRow,
} from "@/lib/studentCard";

const fmtDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const LEVEL_LABEL: Record<string, string> = { none: "–", mastered: "Bemästrad", practicing: "Övar", struggling: "Svårt" };
const formatSeconds = (ms: number | null) => (ms === null ? "—" : `${(ms / 1000).toFixed(1).replace(".", ",")} s`);

type CardData = {
  tabell: TabelltestRow[];
  algebra: Attempt[];
  procent: Attempt[];
  fractions: { exercise_id: number; is_correct: boolean; attempt_number: number; hint_used: boolean; answered_at: string }[];
  missions: { mission_id: string; completed_at: string }[];
  responses: SurveyRow[];
  surveys: SurveyMeta[];
  visits: VisitRow[];
  logs: ResourceRow[];
};

/** Admin: one page per student with test results, levels, surveys and activity together. */
export default function Elevkort() {
  const { isAdmin } = useAuth();
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<CardData | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      const [directory, people] = await Promise.all([
        supabase.rpc("admin_student_directory"),
        supabase.from("profiles").select("id,class_grade").order("full_name"),
      ]);
      if (cancelled) return;
      if (directory.error || people.error) {
        setError(true);
        setLoading(false);
        return;
      }
      const grades = new Map((people.data ?? []).map((p) => [p.id, p.class_grade ?? null]));
      setRoster(
        ((directory.data ?? []) as { user_id: string; full_name: string; last_sign_in_at: string | null }[]).map((s) => ({
          user_id: s.user_id,
          full_name: s.full_name,
          last_sign_in_at: s.last_sign_in_at,
          class_grade: grades.get(s.user_id) ?? null,
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, refresh]);

  const students = useMemo(
    () =>
      roster.filter((s) =>
        s.class_grade !== NOT_STUDENT && (classFilter === "all" ? true : classFilter === "none" ? !isClassGrade(s.class_grade) : s.class_grade === Number(classFilter)),
      ),
    [roster, classFilter],
  );
  const active = selected && students.some((s) => s.user_id === selected) ? selected : students[0]?.user_id ?? "";
  const current = roster.find((s) => s.user_id === active);

  useEffect(() => {
    if (!isAdmin || !active) {
      setData(null);
      return;
    }
    let cancelled = false;
    setCardLoading(true);
    (async () => {
      const [tabell, algebra, fractions, missions, responses, surveys, visits, logs, procent] = await Promise.all([
        supabase.from("tabelltest_results").select("score,total,avg_time_ms,passed,input_mode,created_at").eq("user_id", active).order("created_at", { ascending: false }),
        supabase.from("algebra_attempts").select("user_id,session_id,mode,level,is_correct,created_at").eq("user_id", active).order("created_at", { ascending: false }),
        supabase.from("braklabbet_attempts").select("exercise_id,is_correct,attempt_number,hint_used,answered_at").eq("user_id", active).order("answered_at", { ascending: false }),
        supabase.from("braklabbet_progress").select("mission_id,completed_at").eq("user_id", active).order("completed_at", { ascending: false }),
        supabase.from("survey_responses").select("survey_id,q_learning,q_effort,q_calm,q_teacher,learned_text,wish_text,created_at").eq("user_id", active).order("created_at", { ascending: false }),
        supabase.from("weekly_surveys").select("id,grade,week_start"),
        supabase.from("student_visits").select("visit_id,path,started_at,last_seen_at,active_seconds").eq("user_id", active).order("last_seen_at", { ascending: false }),
        supabase.from("activity_logs").select("grade,chapter,resource_title,created_at").eq("user_id", active).order("created_at", { ascending: false }).limit(300),
        supabase.from("procent_attempts").select("user_id,session_id,mode,level,is_correct,created_at").eq("user_id", active).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      const results = [tabell, algebra, fractions, missions, responses, surveys, visits, logs, procent];
      if (results.some((r) => r.error)) {
        setError(true);
        setData(null);
      } else {
        setError(false);
        setData({
          tabell: (tabell.data ?? []) as TabelltestRow[],
          algebra: (algebra.data ?? []) as Attempt[],
          procent: (procent.data ?? []) as Attempt[],
          fractions: (fractions.data ?? []) as CardData["fractions"],
          missions: (missions.data ?? []) as CardData["missions"],
          responses: (responses.data ?? []) as SurveyRow[],
          surveys: (surveys.data ?? []) as SurveyMeta[],
          visits: (visits.data ?? []) as VisitRow[],
          logs: (logs.data ?? []) as ResourceRow[],
        });
      }
      setCardLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, active, refresh]);

  if (!isAdmin) return null;

  const tabell = data ? summarizeTabelltest(data.tabell) : null;
  const algebra = data ? buildStats(data.algebra)[0] : undefined;
  const activity = data ? summarizeActivity(data.visits, data.logs) : null;
  const surveys = data ? surveyHistory(data.responses, data.surveys) : [];
  const solved = data ? new Set(data.fractions.filter((f) => f.is_correct).map((f) => f.exercise_id)).size : 0;

  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={classFilter}
          onValueChange={(value) => {
            setClassFilter(value);
            setSelected("");
          }}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrera klass"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla klasser</SelectItem>
            {CLASS_GRADES.map((grade) => (
              <SelectItem key={grade} value={String(grade)}>Åk {grade}</SelectItem>
            ))}
            <SelectItem value="none">Okänd klass</SelectItem>
          </SelectContent>
        </Select>
        <Select value={active || undefined} onValueChange={setSelected}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Välj elev"><SelectValue placeholder="Välj elev" /></SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" disabled={loading || cardLoading} aria-label="Uppdatera elevkort" onClick={() => setRefresh((r) => r + 1)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar elever…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">Kunde inte hämta elevkortet. Försök uppdatera.</p>
      ) : !current ? (
        <p className="text-sm text-muted-foreground">Inga elever i den klassen ännu.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3">
            <h3 className="font-semibold text-lg text-foreground">{current.full_name}</h3>
            <span className="text-sm text-primary">{classLabel(current.class_grade)}</span>
            <span className="text-xs text-muted-foreground">Senast inloggad {fmtDateTime(current.last_sign_in_at)}</span>
          </div>

          {cardLoading ? (
            <p className="text-sm text-muted-foreground">Hämtar elevens resultat…</p>
          ) : !data ? null : (
            <div className="space-y-6">
              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Tabelltestet</h4>
                {tabell && tabell.attempts > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {tabell.attempts} försök · bästa {tabell.bestScore}/{tabell.bestOf} ·{" "}
                      {tabell.passedAny ? "godkänt" : "inte godkänt än"} · snittid {formatSeconds(tabell.avgTimeMs)} ·{" "}
                      {tabell.voice} med röst, {tabell.keyboard} med tangentbord · senaste {fmtDateTime(tabell.lastAt)}
                    </p>
                    <ul className="space-y-1">
                      {data.tabell.slice(0, 12).map((r, i) => (
                        <li key={i} className="flex flex-wrap gap-x-4 border-b border-border pb-1 text-sm">
                          <span className="w-16 shrink-0">{r.score}/{r.total}</span>
                          <span className="w-24 shrink-0">{formatSeconds(r.avg_time_ms)}</span>
                          <span className={r.passed ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                            {r.passed ? "Godkänt" : "Ej godkänt"}
                          </span>
                          <span className="text-muted-foreground">{r.input_mode === "keyboard" ? "Tangentbord" : "Röst"}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Testet är inte gjort ännu.</p>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Algebra</h4>
                {algebra ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {algebra.right} rätt av {algebra.total} · högsta bemästrade nivå{" "}
                      {algebra.highestMastered === null ? "—" : algebra.highestMastered + 1} · senaste {fmtDateTime(algebra.lastAt)}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {algebra.levels.map((l, i) => (
                        <li key={i} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                          Nivå {i + 1}: {l.right}/{l.total} · {LEVEL_LABEL[l.status] ?? l.status}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Inga algebraövningar ännu.</p>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Procent</h4>
                {data.procent.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {PROCENT_MODES.flatMap((m) => {
                      const st = buildStats(data.procent, m.id)[0];
                      return st ? m.levels.map((name, i) => (
                        <li key={m.id + i} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                          {m.title} · {name}: {st.levels[i].right}/{st.levels[i].total} · {LEVEL_LABEL[st.levels[i].status] ?? st.levels[i].status}
                        </li>
                      )) : [];
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Inga procentövningar ännu.</p>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Bråklabbet</h4>
                <p className="text-sm text-muted-foreground">
                  {data.fractions.length} försök · {solved} av 20 uppgifter klara ·{" "}
                  {data.missions.length ? `uppdrag: ${data.missions.map((m) => m.mission_id).join(", ")}` : "inga klara uppdrag"}
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Veckoavstämning</h4>
                {surveys.length > 0 ? (
                  <ul className="space-y-2">
                    {surveys.map((s) => (
                      <li key={s.weekStart} className="space-y-1 border-b border-border pb-2 text-sm">
                        <span className="font-medium text-foreground">{s.weekLabel}</span>
                        <span className="ml-3 text-muted-foreground">
                          Lugn {s.answers.calm} · Ork {s.answers.effort} · Nöjd med läraren {s.answers.teacher}
                        </span>
                        {s.learned && <p className="text-muted-foreground">Lärde sig: {s.learned}</p>}
                        {s.wish && <p className="text-muted-foreground">Önskar: {s.wish}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Inga avstämningar inlämnade.</p>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Aktivitet i Mattebo</h4>
                {activity && (
                  <p className="text-sm text-muted-foreground">
                    Aktiv tid ≈ {formatActiveTime(activity.activeSeconds)} · {activity.visits} besök · {activity.resources} resursklick ·
                    senaste {fmtDateTime(activity.lastAt)}
                  </p>
                )}
                <ul className="space-y-1">
                  {data.logs.slice(0, 15).map((l, i) => (
                    <li key={i} className="flex flex-wrap gap-x-4 border-b border-border pb-1 text-sm">
                      <span className="min-w-0 break-words">
                        Åk {l.grade}
                        {l.chapter !== null ? `, kapitel ${l.chapter}` : ""}: {l.resource_title || "Länk öppnad"}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{fmtDateTime(l.created_at)}</span>
                    </li>
                  ))}
                </ul>
                {data.visits.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Besökt: {[...new Set(data.visits.map((v) => PAGE_LABELS[v.path] ?? v.path))].join(", ")}
                  </p>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
