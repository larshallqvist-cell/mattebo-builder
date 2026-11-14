import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cardId, DECK, RANK_LABEL, SUITS, type Card, type ColorKey, type Scene, type TreeNode } from "@/lib/sannolikhet";

const col = (c: ColorKey) => `hsl(var(--sl-${c}))`;

/** Text där [n/d] ritas som staplat bråk. */
export const Rich = ({ text, className }: { text: string; className?: string }) => (
  <span className={className}>
    {text.split(/(\[-?\d+\/\d+\])/).map((part, i) => {
      const m = part.match(/^\[(-?\d+)\/(\d+)\]$/);
      return m ? (
        <span key={i} className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.85em] leading-none">
          <span className="px-0.5">{m[1]}</span><span className="w-full border-t border-current" /><span className="px-0.5">{m[2]}</span>
        </span>
      ) : <Fragment key={i}>{part}</Fragment>;
    })}
  </span>
);

const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`;
};

const Wheel = ({ scene }: { scene: Extract<Scene, { kind: "wheel" }> }) => {
  const total = scene.slices.reduce((s, x) => s + x.size, 0);
  const R = 100, C = 110; let acc = 0;
  return (
    <svg viewBox="0 0 220 236" className="mx-auto h-56 w-56 sm:h-64 sm:w-64" role="img" aria-label="Lyckohjul">
      <circle cx={C} cy={C + 12} r={R + 8} className="sl-rim" />
      <g className="sl-spin" style={{ transformOrigin: `${C}px ${C + 12}px` }}>
        {scene.slices.map((s, i) => {
          const a0 = (acc / total) * 2 * Math.PI; acc += s.size; const a1 = (acc / total) * 2 * Math.PI;
          const mid = (a0 + a1) / 2;
          return (
            <g key={i}>
              <path d={arc(C, C + 12, R, a0, a1)} fill={col(s.color)} className="sl-slice" />
              {scene.deg && (
                <text x={C + R * 0.62 * Math.sin(mid)} y={C + 12 - R * 0.62 * Math.cos(mid)} textAnchor="middle" dominantBaseline="middle" className="sl-deg">
                  {Math.round((s.size / total) * 360)}°
                </text>
              )}
            </g>
          );
        })}
        {!scene.deg && Array.from({ length: total }, (_, i) => {
          const a = (i / total) * 2 * Math.PI;
          return <line key={i} x1={C} y1={C + 12} x2={C + R * Math.sin(a)} y2={C + 12 - R * Math.cos(a)} className="sl-unit" />;
        })}
        <circle cx={C} cy={C + 12} r={12} className="sl-hub" />
      </g>
      <path d={`M${C - 11},2 L${C + 11},2 L${C},26 Z`} className="sl-pointer" />
    </svg>
  );
};

const Ball = ({ c, x, y, r = 13 }: { c: ColorKey; x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={col(c)} className="sl-ball" />
    <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} className="sl-gloss" />
  </g>
);

const Urn = ({ scene }: { scene: Extract<Scene, { kind: "urn" }> }) => {
  const per = 6;
  return (
    <div className="flex items-end justify-center gap-4">
      <svg viewBox="0 0 230 190" className="h-48 w-56 sm:h-52 sm:w-64" role="img" aria-label={`Påse med ${scene.balls.length} kulor`}>
        <path d="M30,30 Q20,30 22,50 L30,170 Q32,184 50,184 L180,184 Q198,184 200,170 L208,50 Q210,30 200,30 Z" className="sl-jar" />
        <rect x="22" y="18" width="186" height="16" rx="8" className="sl-jar-lid" />
        {scene.balls.map((c, i) => {
          const row = Math.floor(i / per), k = i % per;
          return <Ball key={i} c={c} x={48 + k * 27} y={168 - row * 25} />;
        })}
      </svg>
      {scene.aside?.length ? (
        <div className="flex flex-col items-center gap-1 pb-2 text-xs font-semibold opacity-90">
          <svg viewBox="0 0 34 34" className="h-10 w-10">{scene.aside.map((c, i) => <Ball key={i} c={c} x={17} y={17} r={15} />)}</svg>
          Åt sidan
        </div>
      ) : null}
    </div>
  );
};

const MiniCard = ({ c, on, gone }: { c: Card; on: boolean; gone: boolean }) => {
  const s = SUITS.find((x) => x.key === c.suit)!;
  return (
    <div className={cn("sl-card flex aspect-[5/7] flex-col items-center justify-center rounded-[4px] text-[9px] font-bold leading-none sm:text-[11px]",
      s.red && "sl-card-red", on && "sl-card-on", gone && "opacity-25 line-through")}>
      <span>{RANK_LABEL(c.rank)}</span><span>{s.sym}</span>
    </div>
  );
};

const Deck = ({ scene, match, reveal }: { scene: Extract<Scene, { kind: "deck" }>; match?: string[]; reveal: boolean }) => {
  const aside = new Set((scene.aside ?? []).map(cardId));
  const hit = new Set(reveal ? match ?? [] : []);
  return (
    <div className="mx-auto w-full max-w-xl space-y-1">
      {SUITS.map((s) => (
        <div key={s.key} className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
          {DECK.filter((c) => c.suit === s.key).map((c) => <MiniCard key={cardId(c)} c={c} on={hit.has(cardId(c))} gone={aside.has(cardId(c))} />)}
        </div>
      ))}
      <p className="pt-1 text-center text-xs opacity-80">E = ess · Kn = knekt · D = dam · K = kung{scene.aside?.length ? " · överstrukna kort är dragna" : ""}</p>
    </div>
  );
};

const DIE_DOTS: Record<number, [number, number][]> = {
  1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
};
const Die = () => (
  <div className="flex flex-wrap justify-center gap-2">
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <svg key={n} viewBox="0 0 40 40" className="sl-pop h-12 w-12 sm:h-14 sm:w-14" style={{ animationDelay: `${n * 60}ms` }} aria-label={`Tärningssida ${n}`}>
        <rect x="2" y="2" width="36" height="36" rx="8" className="sl-die" />
        {DIE_DOTS[n].map(([x, y], i) => <circle key={i} cx={x * 10} cy={y * 10} r="3.4" className="sl-pip" />)}
      </svg>
    ))}
  </div>
);

const Coins = ({ count }: { count: number }) => (
  <div className="flex justify-center gap-6">
    {Array.from({ length: count }, (_, i) => (
      <Fragment key={i}>
        <div className="sl-coin sl-flip grid h-20 w-20 place-items-center rounded-full text-sm font-black">Krona</div>
        <div className="sl-coin sl-flip grid h-20 w-20 place-items-center rounded-full text-sm font-black" style={{ animationDelay: "120ms" }}>Klave</div>
      </Fragment>
    ))}
  </div>
);

/** Liggande träddiagram: roten till vänster, utfallen längst till höger. */
const Tree = ({ scene, match, reveal }: { scene: Extract<Scene, { kind: "tree" }>; match?: string[]; reveal: boolean }) => {
  const depthOf = (ns: TreeNode[] | undefined): number => (ns?.length ? 1 + depthOf(ns[0].children) : 0);
  const depth = depthOf(scene.root); const colW = depth === 3 ? 92 : 120; const rowH = depth === 3 ? 36 : 42;
  const nodes: { x: number; y: number; label: string; leaf?: number; path: string[] }[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number; p?: string }[] = [];
  let leaf = 0;
  const walk = (n: TreeNode, d: number, path: string[]): number => {
    const p = [...path, n.label]; const x = 30 + d * colW;
    let y: number; let leafIdx: number | undefined;
    if (n.children?.length) {
      const ys = n.children.map((c) => walk(c, d + 1, p));
      y = (ys[0] + ys[ys.length - 1]) / 2;
      n.children.forEach((c, i) => edges.push({ x1: x + 14, y1: y, x2: x + colW - 14, y2: ys[i], p: c.p }));
    } else { y = 30 + leaf * rowH; leafIdx = leaf++; }
    nodes.push({ x, y, label: n.label, leaf: leafIdx, path: p });
    return y;
  };
  const ys = scene.root.map((n) => walk(n, 1, []));
  const rootY = (ys[0] + ys[ys.length - 1]) / 2;
  scene.root.forEach((n, i) => edges.push({ x1: 30, y1: rootY, x2: 30 + colW - 14, y2: ys[i], p: n.p }));
  const H = leaf * rowH + 14, W = 30 + depth * colW + 100;
  const hit = new Set(reveal ? match ?? [] : []);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-xl" style={{ minWidth: 300 }} role="img" aria-label="Träddiagram">
        <circle cx={30} cy={rootY} r={5} className="sl-node-dot" />
        {edges.map((e, i) => (
          <g key={`e${i}`}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="sl-branch" />
            {e.p && (
              <foreignObject x={(e.x1 + e.x2) / 2 - 18} y={(e.y1 + e.y2) / 2 + (e.y2 < e.y1 ? -25 : 1)} width={36} height={24}>
                <div className="sl-ptag text-center text-[10px] font-bold leading-none"><Rich text={e.p} /></div>
              </foreignObject>
            )}
          </g>
        ))}
        {nodes.map((n, i) => {
          const on = n.leaf !== undefined && hit.has(String(n.leaf));
          return (
            <g key={`n${i}`}>
              <rect x={n.x - 14} y={n.y - 10} width={28} height={20} rx={10} className={cn("sl-node", on && "sl-node-on")} />
              <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle" className="sl-node-text">{n.label}</text>
              {n.leaf !== undefined && (
                <text x={n.x + 22} y={n.y + 1} dominantBaseline="middle" className={cn("sl-leaf", on && "sl-leaf-on")}>{n.path.join(" ")}</text>
              )}
            </g>
          );
        })}
      </svg>
      {scene.legend && <p className="text-center text-xs opacity-80">{scene.legend}</p>}
    </div>
  );
};

const Combo = ({ scene }: { scene: Extract<Scene, { kind: "combo" }> }) => (
  <div className="mx-auto flex max-w-md flex-col gap-2">
    {scene.groups.map((g, i) => (
      <div key={i} className="sl-felt-inset flex items-center gap-3 rounded-2xl px-3 py-2">
        <span className="w-20 shrink-0 text-sm font-bold">{g.name}</span>
        <span className="flex flex-wrap gap-1.5 text-xl">{g.items.map((it, k) => <span key={k} className="sl-chip rounded-lg px-1.5 text-base font-bold">{it}</span>)}</span>
      </div>
    ))}
  </div>
);

export const SceneView = ({ scene, match, reveal }: { scene: Scene; match?: string[]; reveal: boolean }): ReactNode => {
  switch (scene.kind) {
    case "wheel": return <Wheel scene={scene} />;
    case "urn": return <Urn scene={scene} />;
    case "deck": return <Deck scene={scene} match={match} reveal={reveal} />;
    case "die": return <Die />;
    case "coins": return <Coins count={scene.count} />;
    case "tree": return <Tree scene={scene} match={match} reveal={reveal} />;
    case "combo": return <Combo scene={scene} />;
  }
};
