import { useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { GRID_MAX, fmtNum, snapGrid, stepStart, type Line, type Point } from "@/lib/linjen";

const S = 360; // ritytans storlek i viewBox-enheter
const PAD = 0.75;
const lo = -GRID_MAX - PAD, hi = GRID_MAX + PAD;
const tx = (x: number) => ((x - lo) / (hi - lo)) * S;
const ty = (y: number) => S - ((y - lo) / (hi - lo)) * S;
const TICKS = Array.from({ length: GRID_MAX * 2 + 1 }, (_, i) => i - GRID_MAX);
const neg = (v: number) => (v < 0 ? `−${-v}` : `${v}`);

export type Tone = "primary" | "muted" | "good" | "bad";
const COLOR: Record<Tone, string> = {
  primary: "hsl(var(--primary))",
  muted: "hsl(var(--muted-foreground) / 0.55)",
  good: "hsl(var(--survey-good))",
  bad: "hsl(var(--coral))",
};
export type GridLine = { line: Line; tone: Tone; dashed?: boolean; width?: number };
export type GridPoint = Point & { tone: Tone; label?: string };

type Props = {
  lines?: GridLine[];
  points?: GridPoint[];
  /** Trappsteget: kq åt höger, sedan kp upp eller ner. */
  step?: { line: Line; tone: Tone };
  /** Markerar skärningen med y-axeln, (0, m). */
  mMark?: { m: number; tone: Tone };
  /** Små prickar på linjens rutnätshörn, som stöd på de första stegen. */
  dots?: Line | null;
  onPick?: (p: Point) => void;
  overlay?: string;
  label: string;
};

/** Koordinatsystem med räta linjer, trappsteg och (valfritt) klickbara rutnätshörn. */
export default function LineGrid({ lines = [], points = [], step, mMark, dots, onPick, overlay, label }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const toWorld = (e: PointerEvent<SVGSVGElement>): Point | null => {
    const m = ref.current?.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return snapGrid({ x: lo + (p.x / S) * (hi - lo), y: lo + ((S - p.y) / S) * (hi - lo) });
  };
  const dotPts = dots ? TICKS.filter((x) => Math.abs(dots.k * x + dots.m) <= GRID_MAX && Number.isInteger(dots.k * x)).map((x) => ({ x, y: dots.k * x + dots.m })) : [];
  const s = step ? stepStart(step.line) : null;

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <svg ref={ref} viewBox={`0 0 ${S} ${S}`} role="img" aria-label={label}
        className={cn("aspect-square w-full select-none rounded-2xl bg-background", onPick && "cursor-crosshair touch-none")}
        onPointerMove={(e) => onPick && setHover(toWorld(e))}
        onPointerLeave={() => setHover(null)}
        onPointerDown={(e) => { if (!onPick) return; const p = toWorld(e); if (p) onPick(p); }}>
        <defs>
          <clipPath id="linje-clip"><rect x={tx(-GRID_MAX - 0.4)} y={ty(GRID_MAX + 0.4)} width={tx(GRID_MAX + 0.4) - tx(-GRID_MAX - 0.4)} height={ty(-GRID_MAX - 0.4) - ty(GRID_MAX + 0.4)} /></clipPath>
          <marker id="linje-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-foreground" />
          </marker>
        </defs>
        {TICKS.map((v) => (
          <g key={v}>
            <line x1={tx(v)} x2={tx(v)} y1={ty(lo)} y2={ty(hi)} className="stroke-border" strokeWidth={1} />
            <line y1={ty(v)} y2={ty(v)} x1={tx(lo)} x2={tx(hi)} className="stroke-border" strokeWidth={1} />
          </g>
        ))}
        <line x1={tx(lo)} x2={tx(hi) - 2} y1={ty(0)} y2={ty(0)} className="stroke-foreground" strokeWidth={1.6} markerEnd="url(#linje-arrow)" />
        <line x1={tx(0)} x2={tx(0)} y1={ty(lo)} y2={ty(hi) + 2} className="stroke-foreground" strokeWidth={1.6} markerEnd="url(#linje-arrow)" />
        <text x={tx(hi) - 4} y={ty(0) - 8} textAnchor="end" className="fill-foreground font-orbitron text-[15px] font-bold italic">x</text>
        <text x={tx(0) + 9} y={ty(hi) + 14} className="fill-foreground font-orbitron text-[15px] font-bold italic">y</text>
        {TICKS.filter((v) => v !== 0 && Math.abs(v) < GRID_MAX).map((v) => (
          <g key={`t${v}`} className="fill-muted-foreground text-[11px] font-semibold">
            <text x={tx(v)} y={ty(0) + 14} textAnchor="middle">{neg(v)}</text>
            <text x={tx(0) - 5} y={ty(v) + 4} textAnchor="end">{neg(v)}</text>
          </g>
        ))}

        {lines.map(({ line: l, tone, dashed, width }, i) => (
          <line key={i} clipPath="url(#linje-clip)" x1={tx(lo)} y1={ty(l.k * lo + l.m)} x2={tx(hi)} y2={ty(l.k * hi + l.m)}
            stroke={COLOR[tone]} strokeWidth={width ?? 3.5} strokeLinecap="round" strokeDasharray={dashed ? "8 6" : undefined} />
        ))}
        {dotPts.map((d) => <circle key={d.x} cx={tx(d.x)} cy={ty(d.y)} r={3.5} className="fill-primary" />)}

        {step && s && (
          <g stroke={COLOR[step.tone]} strokeWidth={3} strokeLinecap="round" fill="none">
            <line x1={tx(s.x)} y1={ty(s.y)} x2={tx(s.x + step.line.kq)} y2={ty(s.y)} strokeDasharray="6 4" />
            {step.line.kp !== 0 && <line x1={tx(s.x + step.line.kq)} y1={ty(s.y)} x2={tx(s.x + step.line.kq)} y2={ty(s.y + step.line.kp)} strokeDasharray="6 4" />}
            <text x={(tx(s.x) + tx(s.x + step.line.kq)) / 2} y={ty(s.y) + (step.line.kp > 0 ? 16 : -7)} textAnchor="middle" fill={COLOR[step.tone]} stroke="none" className="font-orbitron text-[14px] font-bold">{step.line.kq}</text>
            <text x={tx(s.x + step.line.kq) + 6} y={(ty(s.y) + ty(s.y + step.line.kp)) / 2 + 5} fill={COLOR[step.tone]} stroke="none" className="font-orbitron text-[14px] font-bold">
              {step.line.kp === 0 ? "0" : `${step.line.kp > 0 ? "+" : "−"}${Math.abs(step.line.kp)}`}
            </text>
          </g>
        )}
        {mMark && (
          <g>
            <circle cx={tx(0)} cy={ty(mMark.m)} r={7} fill={COLOR[mMark.tone]} />
            <text x={tx(0) - 10} y={ty(mMark.m) - 9} textAnchor="end" fill={COLOR[mMark.tone]} className="font-orbitron text-[15px] font-bold">m = {fmtNum(mMark.m)}</text>
          </g>
        )}
        {onPick && hover && !points.some((p) => p.x === hover.x && p.y === hover.y) && (
          <circle cx={tx(hover.x)} cy={ty(hover.y)} r={6} className="fill-primary/30" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={tx(p.x)} cy={ty(p.y)} r={7.5} fill={COLOR[p.tone]} />
            {p.label && <text x={tx(p.x) + 10} y={ty(p.y) - 9} className="fill-foreground font-orbitron text-[16px] font-bold">{p.label}</text>}
          </g>
        ))}
      </svg>
      {overlay && (
        <p className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl bg-background/90 px-4 py-3 text-center text-sm font-semibold text-muted-foreground shadow">{overlay}</p>
      )}
    </div>
  );
}
