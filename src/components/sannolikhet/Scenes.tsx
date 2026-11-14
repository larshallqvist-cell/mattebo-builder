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
  const per = 7;
  return (
    <div className="flex items-end justify-center gap-4">
      <svg viewBox="0 0 230 190" className="h-48 w-56 sm:h-52 sm:w-64" role="img" aria-label={`Påse med ${scene.balls.length} kulor`}>
        <path d="M30,30 Q20,30 22,50 L30,170 Q32,184 50,184 L180,184 Q198,184 200,170 L208,50 Q210,30 200,30 Z" className="sl-jar" />
        <rect x="22" y="18" width="186" height="16" rx="8" className="sl-jar-lid" />
        {scene.balls.map((c, i) => {
          const row = Math.floor(i / per), k = i % per;
          const offset = row % 2 ? 13 : 0;
          return <Ball key={i} c={c} x={40 + offset + k * 26} y={166 - row * 24} />;
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
  type P = { x: number; y: number; node: TreeNode; parent?: { x: number; y: number }; leaf?: number; path: string[] };
  const items: P[] = []; let leaf = 0;
  const depthOf = (ns: TreeNode[] | undefined): number => (ns?.length ? 1 + depthOf(ns[0].children) : 0);
  const depth = depthOf(scene.root); const colW = depth === 3 ? 92 : 120; const rowH = depth === 3 ? 26 : 34;
  const walk = (ns: TreeNode[], d: number, parent: { x: number; y: number }, path: string[]): number[] =>
    ns.map((n) => {
      const p = [...path, n.label];
      let y: number;
      const placeholder: P = { x: 30 + d * colW, y: 0, node: n, parent, path: p };
      items.push(placeholder);
      if (n.children?.length) {
        const ys = walk(n.children, d + 1, { x: placeholder.x, y: 0 }, p);
        y = (ys[0] + ys[ys.length - 1]) / 2;
      } else { y = 16 + leaf * rowH; placeholder.leaf = leaf++; }
      placeholder.y = y;
      items.filter((it) => it.parent && it.path.length === p.length + 1 && it.path.slice(0, -1).join() === p.join()).forEach((c) => { c.parent = { x: placeholder.x, y }; });
      return y;
    });
  const rootY = (() => { const ys = walk(scene.root, 1, { x: 30, y: 0 }, []); return (ys[0] + ys[ys.length - 1]) / 2; })();
  items.filter((it) => it.path.length === 1).forEach((it) => { it.parent = { x: 30, y: rootY }; });
  const H = leaf * rowH + 8, W = 30 + depth * colW + 110;
  const hit = new Set(reveal ? match ?? [] : []);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-xl" style={{ minWidth: 300 }} role="img" aria-label="Träddiagram">
        <circle cx={30} cy={rootY} r={5} className="sl-node-dot" />
        {items.map((it, i) => {
          const on = it.leaf !== undefined && hit.has(String(it.leaf));
          const midX = (it.parent!.x + it.x) / 2, midY = (it.parent!.y + it.y) / 2;
          return (
            <g key={i}>
              <line x1={it.parent!.x} y1={it.parent!.y} x2={it.x - 14} y2={it.y} className="sl-branch" />
              {it.node.p && (
                <foreignObject x={midX - 18} y={midY - 22} width={36} height={30}>
                  <div className="sl-ptag text-center text-[10px] font-bold leading-none"><Rich text={it.node.p} /></div>
                </foreignObject>
              )}
              <rect x={it.x - 14} y={it.y - 10} width={28} height={20} rx={10} className={cn("sl-node", on && "sl-node-on")} />
              <text x={it.x} y={it.y + 1} textAnchor="middle" dominantBaseline="middle" className="sl-node-text">{it.node.label}</text>
              {it.leaf !== undefined && (
                <text x={it.x + 22} y={it.y + 1} dominantBaseline="middle" className={cn("sl-leaf", on && "sl-leaf-on")}>{it.path.join(" ")}</text>
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
