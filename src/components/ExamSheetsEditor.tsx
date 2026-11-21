import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Sheet = { id: string; grade: number; sheet_id: string; label: string };
const GRADES = [6, 7, 8, 9];
const sheetIdFrom = (link: string) => link.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{20,100})/)?.[1] ?? (/^[A-Za-z0-9_-]{20,100}$/.test(link.trim()) ? link.trim() : null);

/** Admin: link each class's exam result spreadsheets so the AI analysis can read them. */
export default function ExamSheetsEditor() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [grade, setGrade] = useState(6);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase.from("exam_sheets").select("id,grade,sheet_id,label").order("grade").order("created_at");
    setSheets(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const sheetId = sheetIdFrom(link);
    if (!sheetId) { setMsg("Det ser inte ut som en länk till ett Google-kalkylblad."); return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.functions.invoke("student-analysis", { body: { action: "checkSheet", sheetId } });
    if (error || !data?.title) {
      setBusy(false);
      setMsg("Kunde inte läsa bladet. Kontrollera att det ägs av eller är delat med ditt Google-konto och har flikarna Resultatinmatning och Uppgifter och facit.");
      return;
    }
    const { error: insErr } = await supabase.from("exam_sheets").insert({ grade, sheet_id: sheetId, label: data.title });
    setBusy(false);
    if (insErr) { setMsg("Bladet är redan kopplat till den klassen."); return; }
    setMsg(`Kopplat: ${data.title} (${data.students} elever med resultat).`);
    setLink(""); load();
  };

  const remove = async (id: string) => { await supabase.from("exam_sheets").delete().eq("id", id); load(); };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Klistra in länken till ett provkalkylblad. Eleverna kopplas via sitt namn och provresultaten tas med i AI-analysen på Elevkortet.</p>
      <div className="flex flex-wrap gap-2">
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          {GRADES.map((g) => <option key={g} value={g}>Åk {g}</option>)}
        </select>
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" className="flex-1 min-w-[220px]" />
        <Button onClick={add} disabled={busy || !link.trim()}>{busy ? "Läser…" : "Koppla"}</Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      <ul className="space-y-1">
        {sheets.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <span><strong>Åk {s.grade}</strong> · {s.label || "Prov"}</span>
            <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label={`Ta bort ${s.label}`}><Trash2 className="w-4 h-4" /></Button>
          </li>
        ))}
        {sheets.length === 0 && <li className="text-sm text-muted-foreground">Inga provblad kopplade än.</li>}
      </ul>
    </div>
  );
}
