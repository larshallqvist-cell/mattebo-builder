import { useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { snapPoint, tierSpec, type KoordCheck, type KoordTask, type Point } from "@/lib/koordinater";

const S = 360; // ritytans storlek i viewBox-enheter
const PAD = 0.75;

type Props = {
  task: KoordTask;
  result: KoordCheck | null;
  /** Elevens utsatta punkt (bara vid "sätt ut punkten"). */
  placed: Point | null;
  onPlace?: (p: Point) => void;
};

/** Koordinatsystem som SVG. Visar punkten att läsa av, eller tar emot ett klick som fäster på närmaste tillåtna punkt. */
export default function CoordinateGrid({ task, result, placed, onPlace }: Props) {
  const spec = tierSpec(task.tier);
  const lo = spec.min - PAD, hi = spec.max + PAD;
  const tx = (x: number) => ((x - lo) / (hi - lo)) * S;
  const ty = (y: number) => S - ((y - lo) / (hi - lo)) * S;
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const placing = task.kind === "place" && !result && !!onPlace;

  const toWorld = (e: PointerEvent<SVGSVGElement>): Point | null => {
    const svg = ref.current, m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return snapPoint({ x: lo + (p.x / S) * (hi - lo), y: lo + ((S - p.y) / S) * (hi - lo) }, task.tier);
  };

  const ticks: number[] = [];
  for (let v = spec.min; v <= spec.max; v++) ticks.push(v);
  const showPath = !!result;
  const target = task.point;
  /** Bokstaven hamnar till vänster om punkten nära högerkanten. */
  const labelAt = (p: Point) => (p.x > spec.max - 1.5 ? { x: tx(p.x) - 10, y: ty(p.y) - 9, textAnchor: "end" as const } : { x: tx(p.x) + 10, y: ty(p.y) - 9 });
  const shownPoint = task.kind === "read" || (result && !result.correct) ? target : null;

  return (
    <svg ref={ref} viewBox={`0 0 ${S} ${S}`} role="img"
      aria-label={task.kind === "read" ? `Koordinatsystem med punkten ${task.label}` : "Koordinatsystem – tryck där punkten ska vara"}
      className={cn("mx-auto aspect-square w-full max-w-[420px] select-none rounded-2xl bg-background touch-none", placing && "cursor-crosshair")}
      onPointerMove={(e) => placing && setHover(toWorld(e))}
      onPointerLeave={() => setHover(null)}
      onPointerDown={(e) => { if (!placing) return; const p = toWorld(e); if (p) onPlace!(p); }}>
      {/* rutnät */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={tx(v)} x2={tx(v)} y1={ty(lo)} y2={ty(hi)} className="stroke-border" strokeWidth={1} />
          <line y1={ty(v)} y2={ty(v)} x1={tx(lo)} x2={tx(hi)} className="stroke-border" strokeWidth={1} />
        </g>
      ))}
      {/* axlar med pilar */}
      <defs>
        <marker id="koord-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-foreground" />
        </marker>
      </defs>
      <line x1={tx(lo)} x2={tx(hi) - 2} y1={ty(0)} y2={ty(0)} className="stroke-foreground" strokeWidth={1.6} markerEnd="url(#koord-arrow)" />
      <line x1={tx(0)} x2={tx(0)} y1={ty(lo)} y2={ty(hi) + 2} className="stroke-foreground" strokeWidth={1.6} markerEnd="url(#koord-arrow)" />
      <text x={tx(hi) - 4} y={ty(0) - 8} textAnchor="end" className="fill-foreground font-orbitron text-[15px] font-bold italic">x</text>
      <text x={tx(0) + 9} y={ty(hi) + 14} className="fill-foreground font-orbitron text-[15px] font-bold italic">y</text>
      {/* skalstreck och siffror */}
      {ticks.filter((v) => v !== 0).map((v) => (
        <g key={`t${v}`} className="fill-muted-foreground text-[12px] font-semibold">
          <line x1={tx(v)} x2={tx(v)} y1={ty(0) - 3} y2={ty(0) + 3} className="stroke-foreground" strokeWidth={1.2} />
          <line y1={ty(v)} y2={ty(v)} x1={tx(0) - 3} x2={tx(0) + 3} className="stroke-foreground" strokeWidth={1.2} />
          <text x={tx(v)} y={ty(0) + 15} textAnchor="middle">{v < 0 ? `−${-v}` : v}</text>
          <text x={tx(0) - 6} y={ty(v) + 4} textAnchor="end">{v < 0 ? `−${-v}` : v}</text>
        </g>
      ))}
      <text x={tx(0) - 5} y={ty(0) + 15} textAnchor="end" className="fill-muted-foreground text-[12px] font-semibold">0</text>

      {/* vägen från origo: först x, sedan y */}
      {showPath && (
        <g className={result!.correct ? "stroke-[hsl(var(--survey-good))]" : "stroke-coral"} strokeWidth={3} strokeLinecap="round" fill="none">
          <line x1={tx(0)} y1={ty(0)} x2={tx(target.x)} y2={ty(0)} strokeDasharray="6 5" />
          <line x1={tx(target.x)} y1={ty(0)} x2={tx(target.x)} y2={ty(target.y)} strokeDasharray="6 5" />
        </g>
      )}

      {/* förhandsvisning vid utsättning */}
      {placing && hover && !(placed && hover.x === placed.x && hover.y === placed.y) && (
        <circle cx={tx(hover.x)} cy={ty(hover.y)} r={6} className="fill-primary/30" />
      )}
      {placed && (
        <g>
          <circle cx={tx(placed.x)} cy={ty(placed.y)} r={7.5}
            className={cn(result ? (result.correct ? "fill-[hsl(var(--survey-good))]" : "fill-muted-foreground/60") : "fill-primary")} />
          {(!result || result.correct) && <text {...labelAt(placed)} className="fill-foreground font-orbitron text-[16px] font-bold">{task.label}</text>}
        </g>
      )}
      {shownPoint && (
        <g>
          <circle cx={tx(shownPoint.x)} cy={ty(shownPoint.y)} r={7.5}
            className={result?.correct ? "fill-[hsl(var(--survey-good))]" : "fill-coral"} />
          <text {...labelAt(shownPoint)} className="fill-foreground font-orbitron text-[16px] font-bold">{task.label}</text>
        </g>
      )}
    </svg>
  );
}
