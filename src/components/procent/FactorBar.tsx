import { fmt, fmtDec, type FactorFocus, type FactorTask } from "@/lib/procent";
import { cn } from "@/lib/utils";

const FG = "hsl(var(--foreground))";
const KNOWN = "hsl(var(--survey-good))";
const UP = "hsl(var(--accent))";
const DOWN = "hsl(var(--destructive))";

const CHOICES: { id: FactorFocus; label: string }[] = [
  { id: "faktor", label: "Faktorn" },
  { id: "nytt", label: "Nya värdet" },
  { id: "procent", label: "Förändringen" },
  { id: "mix", label: "MIX" },
];

type Props = { task: FactorTask; marked: boolean; solved: boolean; focus: FactorFocus; onFocus: (f: FactorFocus) => void };

/** Stapel som visar 100 % före och efter förändringen, plus val av vad man tränar på. */
const FactorBar = ({ task, marked, solved, focus, onFocus }: Props) => {
  const { kind, percent: p, factor } = task;
  const up = p > 0, ch = Math.abs(p), after = 100 + p;
  const scale = 290 / Math.max(100, after);
  const x0 = 15, w100 = 100 * scale, wAfter = after * scale;
  const showChange = kind !== "procent" || solved;
  const showAfter = marked || solved;
  const changeX = up ? x0 + (w100 + wAfter) / 2 : x0 + (wAfter + w100) / 2;
  const clampX = (x: number) => Math.max(40, Math.min(280, x));
  const changeText = showChange ? `${up ? "+" : "−"}${fmt(ch)} %` : "?";

  const line = kind === "faktor"
    ? `100 % ${up ? "+" : "−"} ${fmt(ch)} % = ${showAfter ? `${fmt(after)} %` : "?"}${solved ? ` = ${fmtDec(factor)}` : ""}`
    : kind === "procent"
      ? `${fmtDec(factor)} = ${showAfter ? `${fmt(after)} %` : "? %"}`
      : `${fmt(task.original)} · ${showAfter ? fmtDec(factor) : "?"} = ${solved ? fmt(task.newValue) : "?"}`;

  return (
    <figure className="mx-auto w-full max-w-[17rem] space-y-3 sm:max-w-sm">
      <div role="group" aria-label="Välj vad du vill träna på" className="flex flex-wrap justify-center gap-1.5">
        {CHOICES.map((c) => (
          <button key={c.id} type="button" aria-pressed={focus === c.id} onClick={() => onFocus(c.id)}
            className={cn("rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors",
              focus === c.id ? "border-accent bg-accent text-accent-foreground" : "border-accent/50 text-accent hover:bg-accent/10",
              c.id === "mix" && "font-orbitron tracking-wide")}>
            {c.label}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 320 120" className="w-full" role="img"
        aria-label={`Stapel: förut 100 %, ${up ? "ökning" : "minskning"} ${showChange ? `${fmt(ch)} %` : "okänd"}`}>
        <text x={x0} y="22" fontSize="12" fontWeight="700" letterSpacing="0.06em" fill={FG} fillOpacity={0.6} className="font-nunito">FÖRUT</text>
        <rect x={x0} y="30" width={w100} height="22" rx="6" fill={KNOWN} fillOpacity={0.3} stroke={FG} strokeOpacity={0.25} />
        <text x={x0 + w100 / 2} y="46" textAnchor="middle" fontSize="13" fontWeight="700" fill={FG} className="font-orbitron">100 %</text>

        <text x={x0} y="76" fontSize="12" fontWeight="700" letterSpacing="0.06em" fill={FG} fillOpacity={0.6} className="font-nunito">NU</text>
        {up ? (
          <>
            <rect x={x0} y="84" width={w100} height="22" rx="6" fill={KNOWN} fillOpacity={0.3} stroke={FG} strokeOpacity={0.25} />
            <rect x={x0 + w100} y="84" width={Math.max(2, wAfter - w100)} height="22" rx="4" fill={UP} fillOpacity={0.55} />
          </>
        ) : (
          <>
            <rect x={x0} y="84" width={Math.max(2, wAfter)} height="22" rx="6" fill={KNOWN} fillOpacity={0.3} stroke={FG} strokeOpacity={0.25} />
            <rect x={x0 + wAfter} y="84" width={Math.max(2, w100 - wAfter)} height="22" rx="4" fill={DOWN} fillOpacity={0.12} stroke={DOWN} strokeOpacity={0.7} strokeDasharray="4 3" />
          </>
        )}
        <text x={clampX(changeX)} y="77" textAnchor="middle" fontSize="15" fontWeight="800" fill={up ? UP : DOWN} className="font-orbitron">{changeText}</text>
        {showAfter && (
          <text x={x0 + Math.min(wAfter, w100) / 2} y="100" textAnchor="middle" fontSize="13" fontWeight="700" fill={FG} className="font-orbitron">
            {up ? "100 %" : `${fmt(after)} %`}
          </text>
        )}
      </svg>

      <figcaption className="text-center font-nunito">
        <span className="block font-orbitron text-base font-bold text-accent">{line}</span>
        <span className="block text-xs font-medium text-muted-foreground">Välj ovanför vad du vill träna på – eller MIX</span>
      </figcaption>
    </figure>
  );
};

export default FactorBar;
