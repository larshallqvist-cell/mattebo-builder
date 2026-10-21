import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

export default function BraklabbetResults() {
  const [rows, setRows] = useState<Tables<"braklabbet_attempts">[]>([]);
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true); setError(false);
    // Paginate so the teacher overview does not silently lose older students at the API row limit.
    const attempts: Tables<"braklabbet_attempts">[] = [];
    let failed = false;
    for (let from = 0; ; from += 500) {
      const result = await supabase.from("braklabbet_attempts").select("*").order("answered_at", { ascending: false }).order("id").range(from, from + 499);
      if (result.error) { failed = true; break; }
      attempts.push(...(result.data ?? []));
      if ((result.data?.length ?? 0) < 500) break;
    }
    const people = await supabase.from("profiles").select("*").order("full_name");
    if (failed || people.error) setError(true);
    else { setRows(attempts); setProfiles(people.data ?? []); }
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const studentIds = new Set(rows.map(r => r.user_id));
  const students = profiles.filter(p => studentIds.has(p.id));
  const active = selected || students[0]?.id || "";
  const answers = rows.filter(r => r.user_id === active);
  const complete = new Set(answers.filter(r => r.is_correct).map(r => r.exercise_id)).size;
  return <div className="p-5 space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <Select value={active || undefined} onValueChange={setSelected}>
        <SelectTrigger className="w-full sm:w-72" aria-label="Välj elev"><SelectValue placeholder="Välj elev" /></SelectTrigger>
        <SelectContent>{students.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || "Elev"}</SelectItem>)}</SelectContent>
      </Select>
      <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} title="Hämta resultat" aria-label="Hämta resultat"><RefreshCw className="h-4 w-4" /></Button>
      {active && <span className="text-sm text-muted-foreground">{complete} / 20 klara · {answers.length} försök</span>}
    </div>
    {loading ? <p role="status">Hämtar resultat…</p> : error ? <p role="alert" className="text-destructive">Resultaten kunde inte hämtas. Försök igen.</p> : !rows.length ? <p className="text-muted-foreground">Inga träningssvar ännu.</p> : <>
      <p className="text-sm text-muted-foreground">Uppgift 16: sant/falskt rättas automatiskt; elevens förklaring behöver lärarens bedömning.</p>
      <Table><TableHeader><TableRow><TableHead>Uppgift</TableHead><TableHead>Svar</TableHead><TableHead>Resultat</TableHead><TableHead>Försök</TableHead><TableHead>Ledtråd</TableHead><TableHead>Tidpunkt</TableHead></TableRow></TableHeader>
        <TableBody>{answers.map(r => <TableRow key={r.id}><TableCell>{r.exercise_id}</TableCell><TableCell className="max-w-xs break-words whitespace-pre-wrap">{r.answer}</TableCell><TableCell>{r.is_correct ? "Rätt" : "Fel"}</TableCell><TableCell>{r.attempt_number}</TableCell><TableCell>{r.hint_used ? "Ja" : "Nej"}</TableCell><TableCell className="whitespace-nowrap">{new Date(r.answered_at).toLocaleString("sv-SE")}</TableCell></TableRow>)}</TableBody>
      </Table>
    </>}
  </div>;
}