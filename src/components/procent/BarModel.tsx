import { fmt, type TriangleTask } from "@/lib/procent";

const KNOWN = "hsl(var(--survey-good))";
const SOUGHT = "hsl(var(--destructive))";
const FG = "hsl(var(--foreground))";

/**
 * Stapelmodell (t.ex. en chokladkaka): hela stapeln = 100 % = Det hela, fyllda bitar = Andelen = Delen.
 * Söks andelen visas den fyllda delen utan bitgränser, så att modellen inte avslöjar svaret.
 */
const BarModel = ({ task, solved }: { task: TriangleTask; solved: boolean }) => {
  const choc = /choklad/i.test(task.text);
  const pieces = task.rate % 10 === 0 ? 10 : 20;
  const filled = Math.round((task.rate / 100) * pieces);
  const countable = task.kind !== "andel" || solved;
  const X = 12, W = 296, Y = 54, H = 64;
  const pw = W / pieces;
  const fillW = filled * pw;
  const show = (k: TriangleTask["kind"], v: string) => (task.kind === k && !solved ? "?" : v);
  const col = (k: TriangleTask["kind"]) => (task.kind === k ? SOUGHT : KNOWN);
  const filledFill = choc ? "hsl(var(--choc))" : "hsl(var(--primary))";
  const emptyFill = choc ? "hsl(var(--choc-soft))" : "hsl(var(--secondary))";
  const labelX = Math.max(X + 50, Math.min(X + fillW / 2, X + W - 50));

  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 320 170" className="w-full" role="img"
        aria-label={`Stapel i ${pieces} lika delar. ${countable ? `${filled} delar är fyllda.` : ""} ${task.kind === "andel" ? "Andelen" : task.rate + " procent"} motsvarar ${show("delen", fmt(task.part))} ${task.unit}. Hela stapeln är 100 procent = ${show("hela", fmt(task.whole))} ${task.unit}.`}>
        <text x={labelX} y={30} textAnchor="middle" fontSize="18" fontWeight="800" className="font-orbitron">
          <tspan fill={col("andel")}>{show("andel", `${task.rate} %`)}</tspan>
          <tspan fill={FG} fillOpacity={0.5}> = </tspan>
          <tspan fill={col("delen")}>{show("delen", fmt(task.part))} {task.unit}</tspan>
        </text>
        <path d={`M${X} 40 V46 H${X + fillW} V40`} fill="none" stroke={col("andel")} strokeWidth={2} />

        <rect x={X} y={Y} width={W} height={H} rx={10} fill={emptyFill} />
        <rect x={X} y={Y} width={fillW} height={H} rx={10} fill={filledFill} />
        {Array.from({ length: pieces }, (_, i) => {
          const x = X + i * pw;
          const on = i < filled;
          if (!countable && on) return null;
          return <rect key={i} x={x + 2} y={Y + 2} width={pw - 4} height={H - 4} rx={5}
            fill="none" stroke={on ? "hsl(0 0% 100%)" : FG} strokeOpacity={on ? 0.28 : 0.14} strokeWidth={1.5} />;
        })}
        <rect x={X} y={Y} width={W} height={H} rx={10} fill="none" stroke={FG} strokeOpacity={0.35} strokeWidth={1.5} />

        <path d={`M${X} ${Y + H + 12} V${Y + H + 18} H${X + W} V${Y + H + 12}`} fill="none" stroke={col("hela")} strokeWidth={2} />
        <text x={X + W / 2} y={Y + H + 42} textAnchor="middle" fontSize="18" fontWeight="800" className="font-orbitron">
          <tspan fill={FG}>100 %</tspan>
          <tspan fill={FG} fillOpacity={0.5}> = </tspan>
          <tspan fill={col("hela")}>{show("hela", fmt(task.whole))} {task.unit}</tspan>
        </text>
      </svg>
      {countable && <figcaption className="text-center text-sm text-muted-foreground">{filled} av {pieces} lika delar</figcaption>}
    </figure>
  );
};

export default BarModel;
