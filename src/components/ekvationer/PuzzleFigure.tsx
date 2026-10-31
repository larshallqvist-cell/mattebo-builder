import magdalena from "@/assets/magdalena.webp.asset.json";
import { PROFILES, type Puzzle, type Term } from "@/lib/ekvationer";
import { cn } from "@/lib/utils";

const PROFILE_TINT: Record<string, string> = {
  zlatan: "bg-[hsl(45_90%_85%)]", kungen: "bg-[hsl(210_70%_88%)]", carola: "bg-[hsl(330_70%_90%)]",
  taylor: "bg-[hsl(270_60%_90%)]", magdalena: "bg-[hsl(170_45%_85%)]",
};

/** Kort namn för förklaringstexten. */
export function symbolName(id: string) {
  const p = PROFILES.find((x) => x.id === id);
  return p ? ("short" in p ? p.short : p.name) : id;
}

/** En figur: emoji, profilkort eller variabel. */
export const Figure = ({ id }: { id: string }) => {
  const profile = PROFILES.find((p) => p.id === id);
  if (profile) {
    return (
      <span className="inline-flex w-12 flex-col items-center gap-0.5 align-middle sm:w-20" title={profile.name}>
        <span className={cn("flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-background shadow-md sm:h-16 sm:w-16", PROFILE_TINT[id])}>
          {id === "magdalena"
            ? <img src={magdalena.url} alt="" className="h-full w-full object-cover" draggable={false} />
            : <span className="text-xl sm:text-3xl" aria-hidden="true">{profile.icon}</span>}
        </span>
        <span className="max-w-full truncate text-[10px] font-bold leading-tight text-foreground sm:text-xs">{"short" in profile ? profile.short : profile.name}</span>
      </span>
    );
  }
  if (id.length === 1 && /[a-z]/.test(id)) return <span className="font-orbitron italic text-primary">{id}</span>;
  return <span className="inline-block align-middle text-3xl leading-none sm:text-5xl" role="img" aria-label={id}>{id}</span>;
};

const Op = ({ children }: { children: string }) => <span className="font-orbitron text-xl font-bold text-muted-foreground sm:px-0.5 sm:text-3xl">{children}</span>;

const TermView = ({ term, p }: { term: Term; p: Puzzle }) => {
  const vars = p.level === 3;
  return (
    <span className="inline-flex items-center gap-1">
      {vars && term.coef !== 1 && <span className="font-orbitron">{term.coef}</span>}
      {term.syms.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <Op>·</Op>}
          <Figure id={p.symbols[s]} />
        </span>
      ))}
      {!vars && term.coef !== 1 && <><Op>·</Op><span className="font-orbitron">{term.coef}</span></>}
    </span>
  );
};

/** En rad i pusslet, t.ex. 🐮 · 2 + 🍌 = 25. */
export const PuzzleLine = ({ terms, result, p, question }: { terms: Term[]; result?: number; p: Puzzle; question?: boolean }) => (
  <div className={cn("flex flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-2xl px-2 py-2 font-orbitron text-xl sm:gap-x-2 sm:px-3 sm:text-2xl font-bold text-foreground sm:text-3xl",
    question ? "border-2 border-dashed border-coral/60 bg-coral/5" : "bg-secondary/60")}>
    {terms.map((t, i) => (
      <span key={i} className="inline-flex items-center gap-1 sm:gap-2">
        {i > 0 && <Op>+</Op>}
        <TermView term={t} p={p} />
      </span>
    ))}
    <Op>=</Op>
    <span className={question ? "text-coral" : "text-primary"}>{question ? "?" : result}</span>
  </div>
);
