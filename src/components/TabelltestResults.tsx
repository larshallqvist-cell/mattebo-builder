import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Row {
  user_id: string;
  score: number;
  total: number;
  avg_time_ms: number;
  passed: boolean;
  input_mode: "voice" | "keyboard";
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const formatTime = (ms: number) => (ms / 1000).toFixed(1).replace(".", ",") + " s";

/** Läraröversikt: elever som klarat tabelltestet, med bästa tid. Bara admin når datan (RLS). */
const TabelltestResults = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from("tabelltest_results")
        .select("user_id,score,total,avg_time_ms,passed,input_mode,created_at,profiles(full_name,email)")
        .order("created_at", { ascending: false });
      if (err) setError(true);
      else setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  // Bästa godkända resultat per elev (lägsta snittid).
  const bestPassed = new Map<string, Row>();
  for (const r of rows) {
    if (!r.passed) continue;
    const current = bestPassed.get(r.user_id);
    if (!current || r.avg_time_ms < current.avg_time_ms) bestPassed.set(r.user_id, r);
  }
  const approved = [...bestPassed.values()].sort((a, b) => a.avg_time_ms - b.avg_time_ms);

  return (
    <div className="p-5">
      {loading ? (
        <p className="text-muted-foreground text-sm">Laddar…</p>
      ) : error ? (
        <p className="text-destructive text-sm">Kunde inte hämta resultaten.</p>
      ) : approved.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ingen elev har klarat testet ännu.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>E-post</TableHead>
              <TableHead>Bästa resultat</TableHead>
              <TableHead>Snittid</TableHead>
              <TableHead>Läge</TableHead>
              <TableHead>Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approved.map((r) => (
              <TableRow key={r.user_id}>
                <TableCell>{r.profiles?.full_name || "—"}</TableCell>
                <TableCell>{r.profiles?.email || "—"}</TableCell>
                <TableCell>{r.score}/{r.total}</TableCell>
                <TableCell>{formatTime(r.avg_time_ms)}</TableCell>
                <TableCell>{r.input_mode === "keyboard" ? "Tangentbord" : "Röst"}</TableCell>
                <TableCell>{new Date(r.created_at).toLocaleDateString("sv-SE")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default TabelltestResults;
