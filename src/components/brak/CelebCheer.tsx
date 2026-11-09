import { useEffect } from "react";
import { PHOTOS, PROFILE_TINT } from "@/components/ekvationer/PuzzleFigure";
import { cn } from "@/lib/utils";

export type Cheer = { key: number; id: string; text: string };
const SHOW_MS = 4500;

/** Stillsamt kändisberöm: porträtt med pratbubbla, utan rörelse, så eleven behåller fokus. */
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
      className="fixed bottom-4 right-4 z-50 flex items-end gap-2 text-left sm:bottom-8 sm:right-8">
      <span role="status" className="relative mb-10 max-w-[13rem] rounded-2xl border-2 border-foreground bg-background px-3 py-2 font-playful text-sm font-bold leading-snug text-foreground shadow-xl sm:max-w-[16rem] sm:text-base">
        {cheer.text}
        <span aria-hidden className="absolute -right-2 bottom-3 h-4 w-4 rotate-45 border-r-2 border-t-2 border-foreground bg-background" />
      </span>
      <span aria-hidden className={cn("relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-xl sm:h-24 sm:w-24", PROFILE_TINT[cheer.id])}>
        {src && <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
      </span>
    </button>
  );
};
export default CelebCheer;
