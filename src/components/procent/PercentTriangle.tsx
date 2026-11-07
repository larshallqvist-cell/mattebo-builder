import type { KeyboardEvent } from "react";
import { fmt, fmtDec, type Focus, type Kind, type TriangleTask } from "@/lib/procent";

const ACCENT = "hsl(var(--accent))";
const FG = "hsl(var(--foreground))";
const BG = "hsl(var(--background))";
const KNOWN = "hsl(var(--survey-good))";
const SOUGHT = "hsl(var(--destructive))";

type Props = {
  task: TriangleTask;
  /** Markerar räknesättet (÷ eller ·) för den sökta rutan. */
  marked: boolean;
  /** Visar svaret i den sökta rutan. */
  solved: boolean;
  /** Visar andelen även som decimaltal, t.ex. "25 % = 0,25". */
  showDecimal?: boolean;
  /** Vald träning. Med `onFocus` blir rutorna och MIX-knappen klickbara. */
  focus?: Focus;
  onFocus?: (f: Focus) => void;
};

const NAMES: Record<Kind, string> = { delen: "Delen", andel: "Andelen", hela: "Det hela" };

/** Procenttriangeln: Delen överst, Andelen och Det hela i botten, MIX i mitten. */
const PercentTriangle = ({ task, marked, solved, showDecimal = true, focus, onFocus }: Props) => {
  const { kind } = task;
  const pct = `${fmt(task.rate)} %`;
  const cells = {
    delen: { value: fmt(task.part), x: 160, y: 70, poly: "160,12 78.75,140 241.25,140" },
    andel: { value: showDecimal ? `${pct} = ${fmtDec(task.rate / 100)}` : pct, x: 92, y: 196, poly: "78.75,140 10,250 160,250 160,140" },
    hela: { value: fmt(task.whole), x: 228, y: 196, poly: "241.25,140 310,250 160,250 160,140" },
  } as const;
  const division = kind !== "delen";
  const formula = kind === "andel" ? "Andelen = Delen ÷ Det hela" : kind === "delen" ? "Delen = Andelen · Det hela" : "Det hela = Delen ÷ Andelen";
  const clickable = !!onFocus;
  const press = (f: Focus) => ({
    role: "button", tabIndex: 0, "aria-pressed": focus === f,
    "aria-label": f === "mix" ? "Träna blandat (MIX)" : `Träna på att söka ${NAMES[f].toLowerCase()}`,
    className: "cursor-pointer outline-none transition-opacity hover:opacity-85 focus-visible:opacity-75",
    onClick: () => onFocus?.(f),
    onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocus?.(f); } },
  });
  const keys = Object.keys(cells) as Kind[];

  return (
    <figure className="mx-auto w-full max-w-[17rem] sm:max-w-sm">
      <svg viewBox="0 0 320 262" className="w-full" role={clickable ? "group" : "img"} aria-label={`Procenttriangel. Sökt: ${NAMES[kind]}. ${formula}`}>
        {keys.map((k) => {
          const sought = k === kind;
          const c = cells[k];
          const cell = (
            <>
              <polygon points={c.poly} fill={sought ? SOUGHT : KNOWN} fillOpacity={sought ? 0.38 : 0.3} stroke={FG} strokeOpacity={0.25} strokeWidth={1} />
              <text x={c.x} y={c.y} textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="0.06em" fill={sought ? SOUGHT : KNOWN} className="font-nunito">{NAMES[k].toUpperCase()}</text>
              <text x={c.x} y={c.y + 26} textAnchor="middle" fontSize={k === "andel" && showDecimal ? 15 : 20} fontWeight="700" fill={FG} className="font-orbitron">
                {sought && !solved ? "?" : c.value}
              </text>
            </>
          );
          return clickable ? <g key={k} {...press(k)}>{cell}</g> : <g key={k}>{cell}</g>;
        })}
        {focus && focus !== "mix" && (
          <polygon points={cells[focus].poly} fill="none" stroke={ACCENT} strokeWidth={5} strokeLinejoin="round" pointerEvents="none" />
        )}
        <polygon points="160,12 10,250 310,250" fill="none" stroke={FG} strokeOpacity={0.7} strokeWidth={2.5} strokeLinejoin="round" pointerEvents="none" />
        <line x1="78.75" y1="140" x2="241.25" y2="140" pointerEvents="none" stroke={marked && division ? ACCENT : FG} strokeOpacity={marked && division ? 1 : 0.6} strokeWidth={marked && division ? 6 : 2.5} strokeLinecap="round" />
        <line x1="160" y1="140" x2="160" y2="250" pointerEvents="none" stroke={marked && !division ? ACCENT : FG} strokeOpacity={marked && !division ? 1 : 0.6} strokeWidth={marked && !division ? 6 : 2.5} strokeLinecap="round" />
        {marked && (
          division
            ? <text x={kind === "andel" ? 254 : 66} y="147" textAnchor="middle" fontSize="22" fontWeight="700" fill={ACCENT} pointerEvents="none">÷</text>
            : <><circle cx="160" cy="214" r="13" fill={ACCENT} pointerEvents="none" /><text x="160" y="221" textAnchor="middle" fontSize="22" fontWeight="800" fill="hsl(var(--accent-foreground))" pointerEvents="none">·</text></>
        )}
        {clickable && (
          <g {...press("mix")}>
            <circle cx="160" cy="140" r="25" fill={focus === "mix" ? ACCENT : BG} stroke={ACCENT} strokeWidth={3} />
            <text x="160" y="145" textAnchor="middle" fontSize="14" fontWeight="800" letterSpacing="0.04em"
              fill={focus === "mix" ? "hsl(var(--accent-foreground))" : ACCENT} className="font-orbitron">MIX</text>
          </g>
        )}
      </svg>
      {(marked || clickable) && (
        <figcaption className="mt-1 text-center font-nunito text-sm font-semibold">
          {marked && <span className="block text-accent">{formula}</span>}
          {clickable && <span className="block text-xs font-medium text-muted-foreground">Tryck på det du vill träna på – eller MIX</span>}
        </figcaption>
      )}
    </figure>
  );
};

export default PercentTriangle;
