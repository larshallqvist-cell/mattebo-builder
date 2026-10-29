import { useEffect, useState } from "react";
import { RefreshCw, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CLASS_GRADES, classLabel, groupByClass, missingClassCount, type RosterStudent,
} from "@/lib/studentClasses";

const fmt = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" }) : "—";

/** Admin: every approved student grouped by class, with the class correctable by hand. */
export default function StudentClassRoster() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);

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

  const changeClass = async (student: RosterStudent, value: string) => {
    const grade = value === "none" ? null : Number(value);
    setSavingId(student.user_id);
    const { error: err } = await supabase.from("profiles").update({ class_grade: grade }).eq("id", student.user_id);
    setSavingId(null);
    if (err) {
      toast({ title: "Kunde inte ändra klass", description: err.message, variant: "destructive" });
      return;
    }
    setRoster((list) => list.map((s) => (s.user_id === student.user_id ? { ...s, class_grade: grade } : s)));
    toast({ title: `${student.full_name} · ${classLabel(grade)}` });
  };

  const fillMissing = async () => {
    setFilling(true);
    const { data, error: err } = await supabase.rpc("fill_missing_classes");
    setFilling(false);
    if (err) {
      toast({ title: "Kunde inte fylla i klasser", description: err.message, variant: "destructive" });
      return;
    }
    toast({ title: `Fyllde i klass hos ${data ?? 0} elever` });
    setRefresh((r) => r + 1);
  };

  if (!isAdmin) return null;

  const query = search.trim().toLocaleLowerCase("sv");
  const filtered = query ? roster.filter((s) => s.full_name.toLocaleLowerCase("sv").includes(query)) : roster;
  const groups = groupByClass(filtered).filter((g) => g.students.length > 0);
  const missing = missingClassCount(roster);

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-full sm:ml-auto sm:w-56"
          placeholder="Sök elev"
          aria-label="Sök elev i klasslistan"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button size="sm" variant="outline" className="gap-1" disabled={filling || missing === 0} onClick={() => void fillMissing()}>
          <Wand2 className="w-4 h-4" /> Fyll i saknade klasser
        </Button>
        <Button size="icon" variant="ghost" disabled={loading} aria-label="Uppdatera klasslistan" onClick={() => setRefresh((r) => r + 1)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Klass föreslås automatiskt från den årskurs personen först var aktiv i – rätta här, och markera föräldrar som "Inte elev". {missing} elever har ingen klass ännu.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laddar klasslista…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">Kunde inte hämta klasslistan. Försök uppdatera.</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga elever hittades.</p>
      ) : (
        groups.map((group) => (
          <section key={group.label} className="space-y-2">
            <h4 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
              {group.label}
              <span className="text-xs font-normal text-muted-foreground">{group.students.length} elever</span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Elev</TableHead>
                  <TableHead>Senast inloggad</TableHead>
                  <TableHead className="w-44">Klass</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.students.map((s) => (
                  <TableRow key={s.user_id}>
                    <TableCell className="min-w-44">{s.full_name}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmt(s.last_sign_in_at)}</TableCell>
                    <TableCell>
                      <Select
                        value={String(s.class_grade ?? "none")}
                        onValueChange={(value) => void changeClass(s, value)}
                        disabled={savingId === s.user_id}
                      >
                        <SelectTrigger className="h-8" aria-label={`Klass för ${s.full_name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_GRADES.map((grade) => (
                            <SelectItem key={grade} value={String(grade)}>Åk {grade}</SelectItem>
                          ))}
                          <SelectItem value="none">Okänd klass</SelectItem>
                          <SelectItem value="0">Inte elev (t.ex. förälder)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))
      )}
    </div>
  );
}
