import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDuration, summarize, type EkvationRow } from "@/lib/ekvationStats";
import EkvationTeacherDetail, { STATUS_CLASS } from "@/components/ekvationer/EkvationTeacherDetail";
import { STATUS_TEXT } from "@/components/ekvationer/EkvationProgress";

export const EKVATION_LEVELS = ["Två figurer", "Tre figurer", "Gånger först", "x, y och z"];
export const EKVATION_SELECT = "user_id,session_id,level,is_correct,hint_used,created_at,puzzle_id,error_kind,seconds_spent";

type Row = EkvationRow & { user_id: string };
const fmt = (iso: string) => new Date(iso).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Läraröversikt för Ekvationspusslet. Bara admin läser alla rader (RLS). */
export default function EkvationResults() {
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [time, setTime] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    const all: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const r = await supabase.from("ekvation_attempts").select(EKVATION_SELECT).order("created_at", { ascending: false }).range(from, from + 999);
      if (r.error) { setError(true); setLoading(false); return; }
      all.push(...(r.data ?? []));
      if ((r.data?.length ?? 0) < 1000) break;
    }
    const [people, visits] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email"),
      supabase.from("student_visits").select("user_id,active_seconds").eq("path", "/ekvationer"),
    ]);
    setNames(Object.fromEntries((people.data ?? []).map((p) => [p.id, p.full_name || p.email || "Elev"])));
    const t: Record<string, number> = {};
    for (const v of visits.data ?? []) t[v.user_id] = (t[v.user_id] ?? 0) + v.active_seconds;
    setTime(t);
    setRows(all); setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const by = new Map<string, Row[]>();
    for (const r of rows) (by.get(r.user_id) ?? by.set(r.user_id, []).get(r.user_id)!).push(r);
    return [...by].map(([userId, list]) => ({ userId, s: summarize(list) }))
      .sort((a, b) => (b.s.lastAt ?? "").localeCompare(a.s.lastAt ?? ""));
  }, [rows]);

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Nivårutor: <span className="text-accent">grön</span> = bemästrad (minst 8 lösta, ≥ 80 % av de 10 senaste direkt rätt utan ledtråd), gul = övar, röd = svårt (&lt; 50 % rätt av minst 5 svar), grå = ej testad. Klicka på en elev för detaljer och bedömningsunderlag.
        </p>
        <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Hämta resultat"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {error ? <p className="text-sm text-destructive">Kunde inte hämta resultaten.</p>
        : loading ? <p className="text-sm text-muted-foreground">Laddar…</p>
        : stats.length === 0 ? <p className="text-sm text-muted-foreground">Inga svar ännu.</p>
        : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Elev</TableHead><TableHead>Lösta</TableHead><TableHead>Tid</TableHead><TableHead>Prio-fel</TableHead><TableHead>Nivåer</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {stats.map(({ userId, s }) => (
                <Fragment key={userId}>
                  <TableRow className="cursor-pointer" onClick={() => setOpen(open === userId ? null : userId)} aria-expanded={open === userId}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1"><ChevronDown className={cn("h-4 w-4 transition-transform", open === userId && "rotate-180")} />{names[userId] ?? "Elev"}</span>
                      {s.lastAt && <div className="pl-5 text-xs text-muted-foreground">{fmt(s.lastAt)}</div>}
                    </TableCell>
                    <TableCell>{s.solved} <span className="text-xs text-muted-foreground">({s.attempts} svar)</span></TableCell>
                    <TableCell>{formatDuration(Math.max(time[userId] ?? 0, s.seconds))}</TableCell>
                    <TableCell>{s.priorityErrors}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {EKVATION_LEVELS.map((name, i) => {
                          const l = s.levels[i];
                          return (
                            <span key={i} title={`${name}: ${l.solved} lösta, ${l.accuracy} % träff – ${STATUS_TEXT[l.status]}`}
                              className={cn("rounded-md px-2 py-1 text-xs font-bold", STATUS_CLASS[l.status])}>{i + 1} {name}</span>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                  {open === userId && (
                    <TableRow><TableCell colSpan={5} className="bg-muted/20"><EkvationTeacherDetail s={s} activeSeconds={time[userId]} /></TableCell></TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
    </div>
  );
}
