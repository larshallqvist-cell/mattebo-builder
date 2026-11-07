import { useEffect, useState } from "react";
import { Medal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Row = { scope: number; place: number; name: string; best: number; is_me: boolean };
const CLASSES = [6, 7, 8, 9];

const List = ({ rows, empty }: { rows: Row[]; empty: string }) =>
  rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
    <ol className="space-y-1">
      {rows.map((r) => (
        <li key={`${r.scope}-${r.place}`} className={cn("flex items-center gap-2 rounded-xl px-2 py-1 text-sm",
          r.is_me ? "bg-primary/15 font-bold" : r.place <= 3 ? "bg-secondary/60" : "")}>
          <span className="w-6 shrink-0 text-right font-orbitron font-bold text-muted-foreground">{r.place}.</span>
          <span className="min-w-0 flex-1 truncate">{r.name}{r.is_me && " (du)"}</span>
          <span className="shrink-0 font-orbitron font-bold text-coral">{r.best}</span>
        </li>
      ))}
    </ol>
  );

/** Topplistan för en träning: hela skolan topp 10 och topp 3 i varje klass, räknat på bästa svit. */
const Leaderboard = ({ mode, title, open, onOpenChange }: { mode: "mangd" | "faktormangd"; title: string; open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFailed(false);
    void supabase.rpc("procent_leaderboard", { p_mode: mode }).then(({ data, error }) => {
      if (error) { setFailed(true); setRows([]); } else setRows((data ?? []) as Row[]);
    });
  }, [open, mode]);

  const school = rows?.filter((r) => r.scope === 0) ?? [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="exercise-light font-nunito max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-orbitron text-xl"><Medal className="h-5 w-5 text-coral" />Topplista · {title}</DialogTitle>
          <DialogDescription>Flest rätt i rad. Vid lika ligger den som kom dit först högst.</DialogDescription>
        </DialogHeader>
        {rows === null ? <p className="text-sm text-muted-foreground">Hämtar…</p> : failed ? (
          <p className="text-sm text-coral">Topplistan gick inte att hämta just nu.</p>
        ) : (
          <div className="space-y-4">
            <section>
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Hela skolan · topp 10</h3>
              <List rows={school} empty="Ingen har kommit in på listan än." />
            </section>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CLASSES.map((g) => (
                <section key={g} className="exercise-card rounded-2xl p-3">
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Åk {g} · topp 3</h3>
                  <List rows={rows.filter((r) => r.scope === g)} empty="Ingen än." />
                </section>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Leaderboard;
