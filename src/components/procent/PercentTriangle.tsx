import { fmt, fmtDec, type TriangleTask } from "@/lib/procent";

const ACCENT = "hsl(var(--accent))";
const PRIMARY = "hsl(var(--primary))";
const FG = "hsl(var(--foreground))";
const MUTED = "hsl(var(--muted-foreground))";

/** Procenttriangeln: Delen överst, Andelen och Det hela i botten. `marked` visar vilken räkning som gäller. */
const PercentTriangle = ({ task, marked, solved }: { task: TriangleTask; marked: boolean; solved: boolean }) => {
  const { kind } = task;
  const cells = {
    delen: { label: "Delen", value: fmt(task.part), x: 160, y: 92, poly: "160,12 78.75,140 241.25,140" },
    andel: { label: "Andelen", value: `${task.rate} % = ${fmtDec(task.rate / 100)}`, x: 92, y: 196, poly: "78.75,140 10,250 160,250 160,140" },
    hela: { label: "Det hela", value: fmt(task.whole), x: 228, y: 196, poly: "241.25,140 310,250 160,250 160,140" },
  } as const;
  const division = kind !== "delen";
  const formula = kind === "andel" ? "Andelen = Delen ÷ Det hela" : kind === "delen" ? "Delen = Andelen · Det hela" : "Det hela = Delen ÷ Andelen";

  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 320 262" className="w-full" role="img" aria-label={`Procenttriangel. Sökt: ${cells[kind].label}. ${formula}`}>
        {(Object.keys(cells) as (keyof typeof cells)[]).map((k) => {
          const sought = k === kind;
          const given = marked && !sought;
          return (
            <polygon key={k} points={cells[k].poly}
              fill={sought ? ACCENT : PRIMARY} fillOpacity={sought ? 0.3 : given ? 0.22 : 0.08}
              stroke={FG} strokeOpacity={0.25} strokeWidth={1} />
          );
        })}
        <polygon points="160,12 10,250 310,250" fill="none" stroke={FG} strokeOpacity={0.7} strokeWidth={2.5} strokeLinejoin="round" />
        <line x1="78.75" y1="140" x2="241.25" y2="140" stroke={marked && division ? ACCENT : FG} strokeOpacity={marked && division ? 1 : 0.6} strokeWidth={marked && division ? 6 : 2.5} strokeLinecap="round" />
        <line x1="160" y1="140" x2="160" y2="250" stroke={marked && !division ? ACCENT : FG} strokeOpacity={marked && !division ? 1 : 0.6} strokeWidth={marked && !division ? 6 : 2.5} strokeLinecap="round" />
        {marked && (
          division
            ? <text x={kind === "andel" ? 254 : 66} y="146" textAnchor="middle" fontSize="22" fontWeight="700" fill={ACCENT}>÷</text>
            : <circle cx="160" cy="200" r="13" fill={ACCENT} />
        )}
        {marked && !division && <text x="160" y="207" textAnchor="middle" fontSize="22" fontWeight="800" fill="hsl(var(--accent-foreground))">·</text>}
        {(Object.keys(cells) as (keyof typeof cells)[]).map((k) => {
          const c = cells[k];
          const sought = k === kind;
          return (
            <g key={k} className="font-nunito">
              <text x={c.x} y={c.y} textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="0.06em" fill={sought ? ACCENT : MUTED}>{c.label.toUpperCase()}</text>
              <text x={c.x} y={c.y + 24} textAnchor="middle" fontSize={k === "andel" ? 15 : 20} fontWeight="700" fill={FG} className="font-orbitron">
                {sought && !solved ? "?" : c.value}
              </text>
            </g>
          );
        })}
      </svg>
      {marked && <figcaption className="mt-2 text-center font-nunito text-sm font-semibold text-accent">{formula}</figcaption>}
    </figure>
  );
};

export default PercentTriangle;
