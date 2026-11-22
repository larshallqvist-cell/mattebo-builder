import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, ladderFor, UNITS, type Question } from "@/lib/geometrigymmet";

/** Visual unit ladder: the steps between two units and the factor of each step. */
const UnitLadder = ({ question }: { question: Pick<Question, "from" | "to"> }) => {
  const { from, to } = question;
  const ladder = ladderFor(question);
  const step = "min-w-[2.5rem] rounded-lg border-b-2 px-2 py-1.5 text-center text-sm font-bold";
  const hi = "border-primary bg-primary/10 text-primary";
  if (!ladder) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 py-2" aria-label={`1 ${from} är ${formatNumber(UNITS[from] / UNITS[to])} ${to}`}>
        <span className={cn(step, hi)}>1 {from}</span><span className="font-bold">=</span>
        <span className={cn(step, hi)}>{formatNumber(UNITS[from] / UNITS[to])} {to}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-2" aria-label={`Enhetstrappa: ${ladder.join(", ")}`}>
      {ladder.map((u, i) => (
        <div key={u} className="contents">
          {i > 0 && (
            <span className="flex flex-col items-center text-[11px] font-semibold text-muted-foreground">
              ×{formatNumber(UNITS[ladder[i - 1]] / UNITS[u])}<ArrowRight className="h-3 w-3" />
            </span>
          )}
          <span className={cn(step, u === from || u === to ? hi : "border-border")}>{u}</span>
        </div>
      ))}
    </div>
  );
};

export default UnitLadder;
