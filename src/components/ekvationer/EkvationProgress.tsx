import { Star, Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/ekvationer";
import { MASTERY_SOLVED, type EkvationLevel, type EkvationSummary } from "@/lib/ekvationStats";

export const STATUS_TEXT: Record<EkvationLevel["status"], string> = { none: "Ej testad", mastered: "Bemästrad", practicing: "Övar", struggling: "Kämpar" };

export const Stars = ({ n, className }: { n: number; className?: string }) => (
  <span className={cn("inline-flex", className)} aria-label={`${n} av 3 stjärnor`}>
    {[0, 1, 2].map((i) => <Star key={i} className={cn("h-3.5 w-3.5", i < n ? "fill-current text-coral" : "text-muted-foreground/40")} />)}
  </span>
);

export const MasteryBar = ({ value, mastered }: { value: number; mastered?: boolean }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <div className={cn("h-full rounded-full transition-all duration-500", mastered ? "bg-accent" : "bg-primary")} style={{ width: `${value}%` }} />
  </div>
);

/** Kort status för en nivå – visas under nivåväljaren. */
export const LevelStatusLine = ({ l, level }: { l: EkvationLevel; level: number }) => (
  <div className="space-y-1.5 rounded-2xl border border-border bg-card p-3">
    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-foreground">
      <span>Nivå {level + 1}: {STATUS_TEXT[l.status]}</span>
      <Stars n={l.stars} />
    </div>
    <MasteryBar value={l.mastery} mastered={l.status === "mastered"} />
    <p className="text-xs text-muted-foreground">
      {l.status === "mastered" ? "Klart! Du kan gå vidare." : `${Math.min(l.solved, MASTERY_SOLVED)}/${MASTERY_SOLVED} lösta – minst 8 av de 10 senaste ska sitta direkt utan tips.`}
    </p>
  </div>
);

/** "Mina framsteg" – elevens egen översikt för alla nivåer. */
export default function EkvationProgress({ s, current, onPick }: { s: EkvationSummary; current: number; onPick: (l: number) => void }) {
  return (
    <section className="exercise-card space-y-4 rounded-[1.75rem] p-4 sm:p-6" aria-labelledby="mina-framsteg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="mina-framsteg" className="text-base font-bold text-foreground">Mina framsteg</h2>
        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span>{s.solved} lösta</span>
          <span className="flex items-center gap-1 text-coral"><Flame className="h-3.5 w-3.5" />{s.currentStreak} i rad</span>
          <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />Rekord {s.bestStreak}</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {LEVELS.map((lv, i) => {
          const l = s.levels[i];
          return (
            <li key={i}>
              <button type="button" onClick={() => onPick(i)} aria-pressed={current === i}
                className={cn("w-full space-y-2 rounded-2xl border p-3 text-left transition-colors",
                  current === i ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50")}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-bold text-foreground">Nivå {i + 1}</span>
                  <Stars n={l.stars} />
                </div>
                <p className="truncate text-xs text-muted-foreground">{lv.name}</p>
                <MasteryBar value={l.mastery} mastered={l.status === "mastered"} />
                <p className="text-xs font-semibold text-foreground">{l.solved} lösta · {l.status === "none" ? "ej testad" : `${l.mastery} %`}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
