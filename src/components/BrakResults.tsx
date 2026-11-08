import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildStats, pct, type Attempt, type LevelStatus } from "@/lib/algebraStats";
import { BANOR, FOCUS_LABEL, type Focus } from "@/lib/brak";

export const BRAK_MODES: Focus[] = [...BANOR, "mix"];
type Row = Attempt & { points: number; unsimplified: boolean; calculator_used: boolean; streak_points: number };
const STATUS: Record<LevelStatus, string> = {
  none: "bg-muted/40 text-muted-foreground",
  mastered: "bg-accent text-accent-foreground",
  practicing: "bg-yellow-400/80 text-background",
  struggling: "bg-destructive/80 text-destructive-foreground",
};
const fmt = (iso: string) => new Date(iso).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Läraröversikt för Bråkträningen. Bara admin läser alla rader (RLS). */
export default function BrakResults() {
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Focus>("mix");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    const all: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const r = await supabase.from("brak_attempts").select("user_id,session_id,mode,level,is_correct,created_at,points,unsimplified,calculator_used,streak_points").order("created_at", { ascending: false }).range(from, from + 999);
      if (r.error) { setError(true); setLoading(false); return; }
      all.push(...((r.data ?? []) as Row[]));
      if ((r.data?.length ?? 0) < 1000) break;
    }
    const people = await supabase.from("profiles").select("id,full_name,email");
    setNames(Object.fromEntries((people.data ?? []).map((p) => [p.id, p.full_name || p.email || "Elev"])));
    setRows(all); setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const stats = buildStats(rows, mode);
  const extra: Record<string, { best: number; right: number; uns: number; calc: number; pts: number }> = {};
  for (const r of rows) {
    if (r.mode !== mode) continue;
    const e = (extra[r.user_id] ??= { best: 0, right: 0, uns: 0, calc: 0, pts: 0 });
    e.best = Math.max(e.best, Number(r.streak_points));
    if (r.is_correct) { e.right++; e.pts += Number(r.points); if (r.unsimplified) e.uns++; if (r.calculator_used) e.calc++; }
  }
  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {BRAK_MODES.map((m) => <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>{FOCUS_LABEL[m]}</Button>)}
        <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Hämta resultat"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Nivårutor: grön = bemästrad (minst 5 svar, ≥ 80 %), gul = övar, röd = svårt, grå = ej testad. "Oförkortat" och "Räknare" är andelen av elevens rätta svar.
      </p>
      {error ? <p className="text-sm text-destructive">Kunde inte hämta resultaten.</p>
        : loading ? <p className="text-sm text-muted-foreground">Laddar…</p>
        : stats.length === 0 ? <p className="text-sm text-muted-foreground">Inga svar ännu.</p>
        : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Elev</TableHead><TableHead>Senast</TableHead><TableHead>Totalt</TableHead><TableHead>Bästa svit (p)</TableHead><TableHead>Oförkortat</TableHead><TableHead>Räknare</TableHead><TableHead>Steg</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {stats.map((s) => {
                const e = extra[s.user_id];
                return (
                  <TableRow key={s.user_id}>
                    <TableCell className="font-medium">{names[s.user_id] ?? "Elev"}</TableCell>
                    <TableCell className="text-xs">{fmt(s.lastAt)}</TableCell>
                    <TableCell>{s.right}/{s.total}</TableCell>
                    <TableCell>{e?.best.toLocaleString("sv-SE") ?? 0}</TableCell>
                    <TableCell>{e?.right ? `${pct(e.uns, e.right)} %` : "–"}</TableCell>
                    <TableCell>{e?.right ? `${pct(e.calc, e.right)} %` : "–"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.levels.map((l, i) => (
                          <span key={i} title={l.total ? `Steg ${i + 1}: ${l.right}/${l.total} rätt` : `Steg ${i + 1}: ej testad`}
                            className={cn("rounded-md px-2 py-1 text-xs font-bold", STATUS[l.status])}>{i + 1}</span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
    </div>
  );
}
