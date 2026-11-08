import { useEffect } from "react";
import { PHOTOS, PROFILE_TINT } from "@/components/ekvationer/PuzzleFigure";
import { cn } from "@/lib/utils";

export type Cheer = { key: number; id: string; text: string };
const SHOW_MS = 4500;
/** Var munnen sitter i varje porträtt (andel av höjden), så käken klipps vid läpparna. */
const JAW: Record<string, number> = {
  benjamin: 66, bieber: 75, carola: 74, kungen: 75, messi: 72, mrbeast: 68, pernilla: 67,
  ronaldo: 69, taylor: 72, therock: 68, zlatan: 76, magdalena: 70,
};

/** Kändis som glider in med pratbubbla och Monty Python-käke (porträttet klipps i två delar). */
const CelebCheer = ({ cheer, onDone }: { cheer: Cheer | null; onDone: () => void }) => {
  useEffect(() => {
    if (!cheer) return;
    const t = window.setTimeout(onDone, SHOW_MS);
    return () => window.clearTimeout(t);
  }, [cheer, onDone]);
  if (!cheer) return null;
  const src = PHOTOS[cheer.id];
  return (
    <button key={cheer.key} type="button" onClick={onDone} aria-label="Stäng beröm"
      className="celeb-cheer fixed bottom-4 right-4 z-50 flex items-end gap-2 text-left sm:bottom-8 sm:right-8">
      <span role="status" className="celeb-bubble relative mb-16 max-w-[13rem] rounded-2xl border-2 border-foreground bg-background px-3 py-2 font-playful text-sm font-bold leading-snug text-foreground shadow-xl sm:max-w-[16rem] sm:text-base">
        {cheer.text}
        <span aria-hidden className="absolute -right-2 bottom-3 h-4 w-4 rotate-45 border-r-2 border-t-2 border-foreground bg-background" />
      </span>
      <span aria-hidden style={{ "--jaw": `${JAW[cheer.id] ?? 70}%` } as React.CSSProperties} className={cn("celeb-head relative h-28 w-28 shrink-0 overflow-visible rounded-full border-4 border-background shadow-2xl sm:h-36 sm:w-36", PROFILE_TINT[cheer.id])}>
        <span className="absolute left-[32%] top-[calc(var(--jaw)-3%)] h-[12%] w-[36%] rounded-full bg-foreground" />
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <img src={src} alt="" draggable={false} className="celeb-top absolute inset-0 h-full w-full object-cover" />
        </span>
        <img src={src} alt="" draggable={false} className="celeb-jaw absolute inset-0 h-full w-full object-cover" />
      </span>
    </button>
  );
};
export default CelebCheer;
