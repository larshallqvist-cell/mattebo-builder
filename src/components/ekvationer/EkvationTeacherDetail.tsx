import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/ekvationer";
import { assessment, formatDuration, pctOf, type Assessment, type EkvationSummary } from "@/lib/ekvationStats";
import { STATUS_TEXT } from "./EkvationProgress";

export const STATUS_CLASS = {
  none: "bg-muted/40 text-muted-foreground",
  mastered: "bg-accent text-accent-foreground",
  practicing: "bg-yellow-400/80 text-background",
  struggling: "bg-destructive/80 text-destructive-foreground",
} as const;

const VERDICT_CLASS: Record<Assessment["verdict"], string> = {
  "Behärskar": "bg-accent text-accent-foreground",
  "På väg": "bg-yellow-400/80 text-background",
  "Behöver stöd": "bg-destructive/80 text-destructive-foreground",
  "Ej visat": "bg-muted/40 text-muted-foreground",
};

/** Lärarens fördjupning för en elev: nivåtabell, fällor och bedömningsunderlag. */
export default function EkvationTeacherDetail({ s, activeSeconds }: { s: EkvationSummary; activeSeconds?: number }) {
  const time = activeSeconds && activeSeconds > s.seconds ? activeSeconds : s.seconds;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {s.solved} lösta pussel · {s.attempts} svar · tid ≈ {formatDuration(time)} · {s.hints} ledtrådar · bästa svit {s.bestStreak}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-1 pr-2 font-medium">Nivå</th><th className="pr-2 font-medium">Lösta</th><th className="pr-2 font-medium">Svar</th><th className="pr-2 font-medium">Träff</th><th className="pr-2 font-medium">Direkt rätt</th><th className="pr-2 font-medium">Ledtrådar</th><th className="pr-2 font-medium" title="Nivå 3–4: räknade vänster → höger. Nivå 5: räknade som om parentesen inte fanns.">Prio-/parentesfel</th><th className="pr-2 font-medium">Tid</th><th className="font-medium">Status</th></tr>
          </thead>
          <tbody>
            {LEVELS.map((lv, i) => {
              const l = s.levels[i];
              return (
                <tr key={i} className="border-t border-border">
                  <td className="py-1.5 pr-2 font-medium text-foreground">{i + 1} · {lv.name}</td>
                  <td className="pr-2">{l.solved}</td>
                  <td className="pr-2">{l.attempts}</td>
                  <td className="pr-2">{l.attempts ? `${l.accuracy} %` : "–"}</td>
                  <td className="pr-2">{l.solved ? `${pctOf(l.firstTry, l.solved)} %` : "–"}</td>
                  <td className="pr-2">{l.hints}</td>
                  <td className="pr-2">{i === 4 ? l.parenErrors : i >= 2 ? l.priorityErrors : "–"}</td>
                  <td className="pr-2">{l.seconds ? formatDuration(l.seconds) : "–"}</td>
                  <td><span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", STATUS_CLASS[l.status])}>{STATUS_TEXT[l.status]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border border-border p-3 text-sm">
        <p className="font-semibold text-foreground">Vanliga fällor</p>
        <p className="text-muted-foreground">
          {s.priorityChances === 0
            ? "Inga fel på nivå 3–4 ännu."
            : `Räknade från vänster till höger (glömde att gånger går före plus) ${s.priorityErrors} av ${s.priorityChances} fel på nivå 3–4 (${pctOf(s.priorityErrors, s.priorityChances)} %).`}
        </p>
        <p className="text-muted-foreground">
          {s.parenChances === 0
            ? "Inga fel på nivå 5 ännu."
            : `Räknade som om parentesen inte fanns ${s.parenErrors} av ${s.parenChances} fel på nivå 5 (${pctOf(s.parenErrors, s.parenChances)} %).`}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Bedömningsunderlag</p>
        <ul className="space-y-1.5">
          {assessment(s).map((a) => (
            <li key={a.area} className="flex flex-wrap items-start gap-2 text-sm">
              <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-bold", VERDICT_CLASS[a.verdict])}>{a.verdict}</span>
              <span className="min-w-0 flex-1"><span className="font-medium text-foreground">{a.area}</span> <span className="text-muted-foreground">({a.levels}) – {a.note}</span></span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Bemästrad = minst 8 lösta och minst 80 % av de 10 senaste rätt direkt utan ledtråd. Pussel lösta före 31 okt 2026 saknar tid och felsort.</p>
      </div>
    </div>
  );
}
