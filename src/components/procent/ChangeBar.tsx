import { fmt, fmtDec, type ChangeTask } from "@/lib/procent";

const ACCENT = "hsl(var(--accent))";
const PRIMARY = "hsl(var(--primary))";
const FG = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";
const DANGER = "hsl(var(--destructive))";

const X0 = 12;
const L0 = 340; // 100 %
const BAR_Y = 62;
const BAR_H = 52;

const Bracket = ({ x1, x2, y, label, color }: { x1: number; x2: number; y: number; label: string; color: string }) => (
  <g>
    <path d={`M${x1} ${y - 6} V${y} H${x2} V${y - 6}`} fill="none" stroke={color} strokeWidth={1.8} />
    <text x={(x1 + x2) / 2} y={y + 18} textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{label}</text>
  </g>
);

/** Rektangelmodell: 100 % som fast rektangel, förändringen streckad (förlängning vid ökning, bortklippt del vid minskning). */
const ChangeBar = ({ task, factorKnown, valueKnown }: { task: ChangeTask; factorKnown: boolean; valueKnown: boolean }) => {
  const up = task.percent > 0;
  const L1 = L0 * task.factor;
  const change = Math.abs(task.newValue - task.original);
  const sign = up ? "+" : "−";
  const newPct = factorKnown ? `${100 + task.percent} %` : "? %";
  const newVal = valueKnown ? `${fmt(task.newValue)} ${task.unit}` : "?";
  const changeMid = up ? X0 + (L0 + L1) / 2 : X0 + (L1 + L0) / 2;
  const width = X0 + Math.max(L0, L1) + 12;

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${Math.max(width, 380)} 196`} className="w-full" role="img"
        aria-label={`Ursprungsvärde ${fmt(task.original)} ${task.unit} är 100 %. ${up ? "Ökning" : "Minskning"} med ${Math.abs(task.percent)} %.`}>
        {/* bas: det som finns kvar / det ursprungliga */}
        <rect x={X0} y={BAR_Y} width={up ? L0 : L1} height={BAR_H} rx={10} fill={PRIMARY} fillOpacity={0.85} />
        {/* förändringen, streckad */}
        <rect x={X0 + (up ? L0 : L1)} y={BAR_Y} width={Math.abs(L1 - L0)} height={BAR_H} rx={up ? 10 : 6}
          fill={up ? ACCENT : DANGER} fillOpacity={0.14} stroke={up ? ACCENT : DANGER} strokeWidth={2.5} strokeDasharray="8 6" />
        {!up && <line x1={X0 + L1} y1={BAR_Y - 8} x2={X0 + L1} y2={BAR_Y + BAR_H + 8} stroke={DANGER} strokeWidth={2.5} />}
        <text x={X0 + (up ? L0 : L1) / 2} y={BAR_Y + BAR_H / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="hsl(var(--primary-foreground))" className="font-orbitron">
          {up ? "100 %" : newPct}
        </text>

        <text x={changeMid} y={BAR_Y - 14} textAnchor="middle" fontSize="15" fontWeight="800" fill={up ? ACCENT : DANGER} className="font-orbitron">
          {sign}{Math.abs(task.percent)} %
        </text>
        <text x={changeMid} y={BAR_Y - 34} textAnchor="middle" fontSize="12" fontWeight="600" fill={MUTED}>
          {sign}{fmt(change)} {task.unit}
        </text>

        <Bracket x1={X0} x2={X0 + L0} y={BAR_Y + BAR_H + 18} label={`100 % = ${fmt(task.original)} ${task.unit}`} color={MUTED} />
        <Bracket x1={X0} x2={X0 + L1} y={BAR_Y + BAR_H + 58} label={`${newPct} = ${newVal}`} color={ACCENT} />
      </svg>
      <figcaption className="mt-1 text-center font-nunito text-sm text-muted-foreground">
        {factorKnown ? <>Förändringsfaktor <span className="font-semibold text-accent">{fmtDec(task.factor)}</span></> : "Hur många procent blir det efter förändringen?"}
      </figcaption>
    </figure>
  );
};

export default ChangeBar;
