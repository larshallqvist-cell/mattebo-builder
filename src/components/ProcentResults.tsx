import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildStats, pct, type Attempt, type LevelStatus } from "@/lib/algebraStats";

export const PROCENT_MODES = [
  { id: "triangel", title: "Procenttriangeln", levels: ["Markerad", "Ledtråd", "Utan"] },
  { id: "faktor", title: "Förändringsfaktor", levels: ["Ökning", "Minskning", "Blandat"] },
] as const;

const STATUS: Record<LevelStatus, string> = {
  none: "bg-muted/40 text-muted-foreground",
  mastered: "bg-accent text-accent-foreground",
  practicing: "bg-yellow-400/80 text-background",
  struggling: "bg-destructive/80 text-destructive-foreground",
};
const fmt = (iso: string) => new Date(iso).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Läraröversikt för Procent. Bara admin läser alla rader (RLS). */
export default function ProcentResults() {
  const [rows, setRows] = useState<Attempt[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"triangel" | "faktor">("triangel");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    const all: Attempt[] = [];
    for (let from = 0; ; from += 1000) {
      const r = await supabase.from("procent_attempts").select("user_id,session_id,mode,level,is_correct,created_at").order("created_at", { ascending: false }).range(from, from + 999);
      if (r.error) { setError(true); setLoading(false); return; }
      all.push(...(r.data ?? []));
      if ((r.data?.length ?? 0) < 1000) break;
    }
    const people = await supabase.from("profiles").select("id,full_name,email");
    setNames(Object.fromEntries((people.data ?? []).map((p) => [p.id, p.full_name || p.email || "Elev"])));
    setRows(all); setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const meta = PROCENT_MODES.find((m) => m.id === mode)!;
  const stats = buildStats(rows, mode);
  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {PROCENT_MODES.map((m) => (
          <Button key={m.id} size="sm" variant={mode === m.id ? "default" : "outline"} onClick={() => setMode(m.id)}>{m.title}</Button>
        ))}
        <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Hämta resultat"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Nivårutor: <span className="text-accent">grön</span> = bemästrad (minst 5 svar, ≥ 80 %), gul = övar (50–79 %), röd = svårt (&lt; 50 %), grå = ej testad. Varje fel svar och varje färdig uppgift räknas.
      </p>
      {error ? <p className="text-sm text-destructive">Kunde inte hämta resultaten.</p>
        : loading ? <p className="text-sm text-muted-foreground">Laddar…</p>
        : stats.length === 0 ? <p className="text-sm text-muted-foreground">Inga svar ännu.</p>
        : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Elev</TableHead><TableHead>Senaste pass</TableHead><TableHead>Totalt</TableHead><TableHead>Nivåer</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {stats.map((s) => (
                <TableRow key={s.userId}>
                  <TableCell className="font-medium">{names[s.userId] ?? "Elev"}<div className="text-xs text-muted-foreground">{fmt(s.lastAt)}</div></TableCell>
                  <TableCell>{pct(s.last.right, s.last.total)} % <span className="text-xs text-muted-foreground">({s.last.right}/{s.last.total})</span></TableCell>
                  <TableCell>{pct(s.right, s.total)} % <span className="text-xs text-muted-foreground">({s.total} svar)</span></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {meta.levels.map((name, i) => {
                        const l = s.levels[i];
                        return (
                          <span key={i} title={l.total ? `${name}: ${l.right}/${l.total} rätt (${pct(l.right, l.total)} %)` : `${name}: ej testad`}
                            className={cn("rounded-md px-2 py-1 text-xs font-bold", STATUS[l.status])}>{i + 1} {name}</span>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
    </div>
  );
}
