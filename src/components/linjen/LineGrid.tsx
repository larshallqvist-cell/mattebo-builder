import { GRID_MAX, stepStart, tierSpec, fmtNum, type LinjeCheck, type LinjeTask } from "@/lib/linjen";

const S = 360; // ritytans storlek i viewBox-enheter
const PAD = 0.75;
const lo = -GRID_MAX - PAD, hi = GRID_MAX + PAD;
const tx = (x: number) => ((x - lo) / (hi - lo)) * S;
const ty = (y: number) => S - ((y - lo) / (hi - lo)) * S;
const TICKS = Array.from({ length: GRID_MAX * 2 + 1 }, (_, i) => i - GRID_MAX);
const neg = (v: number) => (v < 0 ? `−${-v}` : `${v}`);

/** Koordinatsystem med en rät linje. Efter svaret ritas trappsteget (1 åt höger, k upp/ner) och skärningen med y-axeln. */
export default function LineGrid({ task, result }: { task: LinjeTask; result: LinjeCheck | null }) {
  const { k, m } = task;
  const color = result ? (result.correct ? "hsl(var(--survey-good))" : "hsl(var(--coral))") : "";
  const s = stepStart(k, m);
  const showStep = !!result && task.mode !== "m";
  const showM = !!result && task.mode !== "k";
  const dots = tierSpec(task.tier).dots
    ? TICKS.filter((x) => Math.abs(k * x + m) <= GRID_MAX).map((x) => ({ x, y: k * x + m }))
    : [];

  return (
    <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Koordinatsystem med en rät linje"
      className="mx-auto aspect-square w-full max-w-[420px] select-none rounded-2xl bg-background">
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

      {/* linjen */}
      <line clipPath="url(#linje-clip)" x1={tx(lo)} y1={ty(k * lo + m)} x2={tx(hi)} y2={ty(k * hi + m)}
        className="stroke-primary" strokeWidth={3.5} strokeLinecap="round" />
      {dots.map((d) => <circle key={d.x} cx={tx(d.x)} cy={ty(d.y)} r={3.5} className="fill-primary" />)}

      {/* trappsteget: 1 åt höger, sedan k upp eller ner */}
      {showStep && (
        <g stroke={color} strokeWidth={3} strokeLinecap="round" fill="none">
          <line x1={tx(s.x)} y1={ty(s.y)} x2={tx(s.x + 1)} y2={ty(s.y)} strokeDasharray="6 4" />
          {k !== 0 && <line x1={tx(s.x + 1)} y1={ty(s.y)} x2={tx(s.x + 1)} y2={ty(s.y + k)} strokeDasharray="6 4" />}
          <text x={(tx(s.x) + tx(s.x + 1)) / 2} y={ty(s.y) + (k > 0 ? 16 : -7)} textAnchor="middle" fill={color} stroke="none" className="font-orbitron text-[14px] font-bold">1</text>
          <text x={tx(s.x + 1) + 6} y={(ty(s.y) + ty(s.y + k)) / 2 + 5} fill={color} stroke="none" className="font-orbitron text-[14px] font-bold">
            {k === 0 ? "0" : `${k > 0 ? "+" : "−"}${Math.abs(k)}`}
          </text>
        </g>
      )}
      {showM && (
        <g>
          <circle cx={tx(0)} cy={ty(m)} r={7} fill={color} />
          <text x={tx(0) - 10} y={ty(m) - 9} textAnchor="end" fill={color} className="font-orbitron text-[15px] font-bold">m = {fmtNum(m)}</text>
        </g>
      )}
    </svg>
  );
}
