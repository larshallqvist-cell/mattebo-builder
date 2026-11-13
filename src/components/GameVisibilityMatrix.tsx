import { useState } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useGameVisibility, notifyGameVisibilityChanged } from "@/hooks/useGameVisibility";
import {
  GAME_KEYS, GAME_LABELS, VISIBILITY_CHAPTERS, VISIBILITY_GRADES, isGameEnabled,
  type GameKey, type VisibilityRow,
} from "@/lib/gameVisibility";

/** Admin matrix: switch each game on or off per class and chapter. Saves immediately. */
const GameVisibilityMatrix = () => {
  const { toast } = useToast();
  const { rows, setRows, reload } = useGameVisibility();
  const [grade, setGrade] = useState<number>(6);

  const save = async (changes: VisibilityRow[]) => {
    if (changes.length === 0) return;
    const key = (r: VisibilityRow) => `${r.grade}-${r.chapter}-${r.game_key}`;
    const changed = new Set(changes.map(key));
    setRows((prev) => [...prev.filter((r) => !changed.has(key(r))), ...changes]);
    const { error } = await supabase
      .from("game_visibility")
      .upsert(changes.map((c) => ({ ...c, updated_at: new Date().toISOString() })), { onConflict: "grade,chapter,game_key" });
    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
      reload();
      return;
    }
    notifyGameVisibilityChanged();
  };

  const on = (game: GameKey, chapter: number) => isGameEnabled(rows, game, grade, chapter);

  const toggleCell = (game: GameKey, chapter: number) =>
    save([{ grade, chapter, game_key: game, enabled: !on(game, chapter) }]);

  /** Whole row or column: if everything is on, switch all off; otherwise switch all on. */
  const toggleRow = (game: GameKey) => {
    const target = !VISIBILITY_CHAPTERS.every((c) => on(game, c));
    save(VISIBILITY_CHAPTERS.map((chapter) => ({ grade, chapter, game_key: game, enabled: target })));
  };
  const toggleColumn = (chapter: number) => {
    const target = !GAME_KEYS.every((g) => on(g, chapter));
    save(GAME_KEYS.map((game) => ({ grade, chapter, game_key: game, enabled: target })));
  };

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">
        Tryck på en ruta för att visa eller dölja spelet på klassidan för det kapitlet. Tryck på ett spelnamn eller en
        kapitelrubrik för att ändra hela raden eller kolumnen. Ändringarna sparas direkt.
      </p>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Välj klass">
        {VISIBILITY_GRADES.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={grade === g}
            onClick={() => setGrade(g)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              grade === g ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 hover:bg-accent/30",
            )}
          >
            Åk {g}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spel</th>
              {VISIBILITY_CHAPTERS.map((c) => (
                <th key={c} className="p-0">
                  <button
                    type="button"
                    onClick={() => toggleColumn(c)}
                    className="w-full rounded-md px-1 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                    title={`Ändra alla spel i kapitel ${c}`}
                  >
                    Kap {c}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GAME_KEYS.map((game) => (
              <tr key={game}>
                <th scope="row" className="p-0 text-left">
                  <button
                    type="button"
                    onClick={() => toggleRow(game)}
                    className="w-full rounded-md px-2 py-1.5 text-left font-medium hover:bg-accent/30"
                    title={`Ändra ${GAME_LABELS[game]} i alla kapitel`}
                  >
                    {GAME_LABELS[game]}
                  </button>
                </th>
                {VISIBILITY_CHAPTERS.map((c) => {
                  const enabled = on(game, c);
                  return (
                    <td key={c} className="p-0 text-center">
                      <button
                        type="button"
                        aria-pressed={enabled}
                        aria-label={`${GAME_LABELS[game]}, Åk ${grade}, kapitel ${c}: ${enabled ? "på" : "av"}`}
                        onClick={() => toggleCell(game, c)}
                        className={cn(
                          "flex h-9 w-full items-center justify-center rounded-lg border transition-colors",
                          enabled
                            ? "border-primary/50 bg-primary/20 text-primary hover:bg-primary/30"
                            : "border-border bg-muted/30 text-muted-foreground/60 hover:bg-muted/60",
                        )}
                      >
                        {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameVisibilityMatrix;
