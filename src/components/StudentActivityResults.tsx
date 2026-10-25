import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAGE_LABELS, summarizeStudents, formatActiveTime, type ActivityEvent, type Student, type Visit } from "@/lib/studentActivity";

const fmt = (value: string | null) => value ? new Date(value).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function StudentActivityResults() {
  const { isAdmin } = useAuth();
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [timelineLimit, setTimelineLimit] = useState(50);
  const [since, setSince] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(false);
      const start = new Date(Date.now() - days * 86400_000).toISOString();
      async function pages<T>(query: (from: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
        const all: T[] = [];
        for (let from = 0; !cancelled; from += 1000) {
          const result = await query(from);
          if (result.error) throw result.error;
          all.push(...(result.data ?? []));
          if ((result.data?.length ?? 0) < 1000) break;
        }
        return all;
      }
      try {
        const [directory, visitRows, resources, algebra, tables, fractions, missions] = await Promise.all([
          supabase.rpc("admin_student_directory"),
          pages((from) => supabase.from("student_visits").select("*").gte("last_seen_at", start).order("last_seen_at", { ascending: false }).order("id").range(from, from + 999)),
          pages((from) => supabase.from("activity_logs").select("id,user_id,grade,chapter,resource_title,resource_url,created_at").gte("created_at", start).order("created_at", { ascending: false }).order("id").range(from, from + 999)),
          pages((from) => supabase.from("algebra_attempts").select("id,user_id,mode,level,is_correct,created_at").gte("created_at", start).order("created_at", { ascending: false }).order("id").range(from, from + 999)),
          pages((from) => supabase.from("tabelltest_results").select("id,user_id,score,total,passed,created_at").gte("created_at", start).order("created_at", { ascending: false }).order("id").range(from, from + 999)),
          pages((from) => supabase.from("braklabbet_attempts").select("id,user_id,exercise_id,is_correct,answered_at").gte("answered_at", start).order("answered_at", { ascending: false }).order("id").range(from, from + 999)),
          pages((from) => supabase.from("braklabbet_progress").select("user_id,mission_id,completed_at").gte("completed_at", start).order("completed_at", { ascending: false }).order("user_id").order("mission_id").range(from, from + 999)),
        ]);
        if (directory.error) throw directory.error;
        if (cancelled) return;
        setStudents(directory.data ?? []); setVisits(visitRows); setSince(Date.parse(start));
        setEvents([
          ...resources.map((r) => ({ id: `resource-${r.id}`, userId: r.user_id, at: r.created_at, label: `Resurs – Åk ${r.grade}${r.chapter ? `, kapitel ${r.chapter}` : ""}: ${r.resource_title || "Länk öppnad"}`, url: r.resource_url?.startsWith("http") ? r.resource_url : undefined })),
          ...algebra.map((r) => ({ id: `algebra-${r.id}`, userId: r.user_id, at: r.created_at, label: `Algebra – nivå ${r.level + 1}, ${r.is_correct ? "rätt" : "fel"} (${r.mode === "simplify" ? "förenkla" : r.mode === "both" ? "förenkla och beräkna" : "beräkna"})` })),
          ...tables.map((r) => ({ id: `table-${r.id}`, userId: r.user_id, at: r.created_at, label: `Tabelltestet – ${r.score}/${r.total} rätt, ${r.passed ? "godkänt" : "ej godkänt"}` })),
          ...fractions.map((r) => ({ id: `fraction-${r.id}`, userId: r.user_id, at: r.answered_at, label: `Bråklabbet – uppgift ${r.exercise_id}, ${r.is_correct ? "rätt" : "fel"}` })),
          ...missions.map((r) => ({ id: `mission-${r.user_id}-${r.mission_id}`, userId: r.user_id, at: r.completed_at, label: `Bråklabbet – avklarat uppdrag: ${r.mission_id}` })),
        ]);
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [isAdmin, days, refresh]);

  if (!isAdmin) return null;
  const rows = summarizeStudents(students, visits, events, since).filter((s) => s.full_name.toLocaleLowerCase("sv").includes(search.toLocaleLowerCase("sv")));
  const current = students.find((s) => s.user_id === selected);
  const timeline = [
    ...events.filter((e) => e.userId === selected),
    ...visits.filter((v) => v.user_id === selected).map((v): ActivityEvent => ({ id: `visit-${v.id}`, userId: v.user_id, at: v.started_at, label: `Besök – ${PAGE_LABELS[v.path] ?? "Mattebo"}, aktiv tid ${formatActiveTime(v.active_seconds)}` })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return <div className="space-y-4 p-5">
    <div className="flex flex-wrap items-center gap-2">
      {[1, 7, 30].map((value) => <Button key={value} size="sm" variant={days === value ? "default" : "outline"} onClick={() => { setDays(value); setSelected(null); }}>{value === 1 ? "24 timmar" : `${value} dagar`}</Button>)}
      <Button size="icon" variant="ghost" disabled={loading} aria-label="Uppdatera elevaktivitet" onClick={() => setRefresh((r) => r + 1)}><RefreshCw className="h-4 w-4" /></Button>
      <Input className="w-full sm:ml-auto sm:w-56" placeholder="Sök elev" aria-label="Sök elev" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    <p className="text-xs text-muted-foreground">Besök och aktiv tid registreras från nu. Aktiv tid är en uppskattning och pausas efter en minuts inaktivitet eller när fliken inte är i fokus. Besök är inte samma sak som Google-inloggningar. Resursklick visar inte om materialet lästes klart.</p>
    {error ? <p role="alert" className="text-sm text-destructive">Kunde inte hämta hela elevöversikten. Försök uppdatera.</p>
      : loading ? <p className="text-sm text-muted-foreground">Laddar elevaktivitet…</p>
      : rows.length === 0 ? <p className="text-sm text-muted-foreground">Inga elever hittades.</p>
      : <Table><TableHeader><TableRow><TableHead>Elev</TableHead><TableHead>Senaste aktivitet</TableHead><TableHead>Besök</TableHead><TableHead>Aktiv tid ≈</TableHead><TableHead>Aktiviteter</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map((s) => <TableRow key={s.user_id}>
          <TableCell className="min-w-44"><Button variant="ghost" className="h-auto max-w-64 justify-start gap-2 whitespace-normal px-0 text-left" aria-expanded={selected === s.user_id} onClick={() => { setSelected(selected === s.user_id ? null : s.user_id); setTimelineLimit(50); }}>{selected === s.user_id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}{s.full_name}</Button><div className="text-xs text-muted-foreground">Senast inloggad: {fmt(s.last_sign_in_at)}</div></TableCell>
          <TableCell className="whitespace-nowrap">{fmt(s.lastAt)}</TableCell><TableCell>{s.visits || "—"}</TableCell><TableCell className="whitespace-nowrap">{formatActiveTime(s.activeSeconds)}</TableCell><TableCell className="min-w-32 text-xs">{s.activities.join(", ") || "—"}</TableCell>
        </TableRow>)}</TableBody>
      </Table>}
    {!loading && !error && current && <section className="space-y-3 border-t border-border pt-4" aria-label={`Aktiviteter för ${current.full_name}`}>
      <h3 className="font-semibold text-foreground">{current.full_name} · senaste {days === 1 ? "24 timmarna" : `${days} dagarna`}</h3>
      {timeline.length === 0 ? <p className="text-sm text-muted-foreground">Ingen registrerad aktivitet under perioden.</p> : <ol className="space-y-3">{timeline.slice(0, timelineLimit).map((e) => <li key={e.id} className="flex flex-col gap-1 border-b border-border pb-2 text-sm sm:flex-row sm:gap-4"><time className="shrink-0 text-xs text-muted-foreground">{fmt(e.at)}</time><span className="min-w-0 break-words">{e.label}{e.url && <> – <a href={e.url} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline underline-offset-2 hover:opacity-80">{e.url}</a></>}</span></li>)}</ol>}
      {timeline.length > timelineLimit && <Button size="sm" variant="outline" onClick={() => setTimelineLimit((n) => n + 50)}>Visa fler</Button>}
    </section>}
  </div>;
}