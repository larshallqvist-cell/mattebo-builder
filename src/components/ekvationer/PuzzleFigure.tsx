import magdalena from "@/assets/magdalena.webp.asset.json";
import zlatan from "@/assets/profiles/zlatan.webp.asset.json";
import kungen from "@/assets/profiles/kungen.webp.asset.json";
import taylor from "@/assets/profiles/taylor.webp.asset.json";
import ronaldo from "@/assets/profiles/ronaldo.webp.asset.json";
import messi from "@/assets/profiles/messi.webp.asset.json";
import pernilla from "@/assets/profiles/pernilla.webp.asset.json";
import benjamin from "@/assets/profiles/benjamin.webp.asset.json";
import mrbeast from "@/assets/profiles/mrbeast.webp.asset.json";
import therock from "@/assets/profiles/therock.webp.asset.json";
import bieber from "@/assets/profiles/bieber.webp.asset.json";
import { PROFILES, type Puzzle, type Term } from "@/lib/ekvationer";
import { cn } from "@/lib/utils";

/** Frilagda porträtt (lärarens egna uppladdningar). */
const PHOTOS: Record<string, string> = {
  magdalena: magdalena.url, zlatan: zlatan.url, kungen: kungen.url, taylor: taylor.url,
  ronaldo: ronaldo.url, messi: messi.url, pernilla: pernilla.url, benjamin: benjamin.url,
  mrbeast: mrbeast.url, therock: therock.url, bieber: bieber.url,
};

const PROFILE_TINT: Record<string, string> = {
  zlatan: "bg-[hsl(45_90%_85%)]", kungen: "bg-[hsl(210_70%_88%)]", carola: "bg-[hsl(330_70%_90%)]",
  taylor: "bg-[hsl(270_60%_90%)]", magdalena: "bg-[hsl(170_45%_85%)]", ronaldo: "bg-[hsl(0_70%_90%)]",
  messi: "bg-[hsl(200_75%_88%)]", pernilla: "bg-[hsl(320_60%_90%)]", benjamin: "bg-[hsl(30_80%_88%)]",
  mrbeast: "bg-[hsl(190_70%_86%)]", therock: "bg-[hsl(25_60%_86%)]", bieber: "bg-[hsl(150_45%_86%)]",
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
    const photo = PHOTOS[id];
    return (
      <span className="inline-flex w-14 flex-col items-center gap-0.5 align-middle sm:w-20" title={photo ? undefined : profile.name} aria-label={photo ? "Porträtt" : undefined}>
        <span className={cn("flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-background shadow-md sm:h-16 sm:w-16", PROFILE_TINT[id])}>
          {photo
            ? <img src={photo} alt="" className="h-full w-full object-cover" draggable={false} />
            : <span className="text-xl sm:text-3xl" aria-hidden="true">{profile.icon}</span>}
        </span>
        {!photo && <span className="max-w-full truncate text-[10px] font-bold leading-tight text-foreground sm:text-xs">{"short" in profile ? profile.short : profile.name}</span>}
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
export const PuzzleLine = ({ terms, result, p, question, row }: { terms: Term[]; result?: number; p: Puzzle; question?: boolean; row?: number }) => (
  <div className={cn("relative flex flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-2xl px-2 py-2 font-orbitron text-xl sm:gap-x-2 sm:px-3 sm:text-2xl font-bold text-foreground sm:text-3xl",
    row !== undefined && "pl-7 sm:pl-9",
    question ? "border-2 border-dashed border-coral/60 bg-coral/5" : "bg-secondary/60")}>
    {row !== undefined && (
      <span className="absolute left-2 top-1/2 -translate-y-1/2 font-sans text-[11px] font-semibold text-muted-foreground sm:left-3 sm:text-xs" aria-label={`Rad ${row}`}>{row}</span>
    )}
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
