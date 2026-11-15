import boxImg from "@/assets/kistan/box.webp";
import fishImg from "@/assets/kistan/fish.webp";
import bflyImg from "@/assets/kistan/butterfly.webp";
import { cn } from "@/lib/utils";

const IMAGES: Record<string, string> = { box: boxImg, fish: fishImg, bfly: bflyImg };
const LETTERS: Record<string, string> = { box: "x", fish: "a", bfly: "b" };
const NAMES: Record<string, string> = { box: "kistan", fish: "fisk", bfly: "fjäril" };

type Props = { kind: string; neg: boolean; coef?: number; den?: number; letters?: boolean; selected?: boolean; small?: boolean; onClick?: () => void; disabled?: boolean };

/** En bricka: bild (värld 1–2) eller bokstav (värld 3–4), med koefficient (3x) eller nämnare (x/3). Minusbrickor är mörka med ett minustecken. */
export default function KistanTile({ kind, neg, coef = 1, den = 1, letters, selected, small, onClick, disabled }: Props) {
  const img = !letters ? IMAGES[kind] : undefined;
  const base = letters ? (LETTERS[kind] ?? kind) : kind;
  const label = coef > 1 ? `${coef}${base}` : base;
  const spoken = `${coef > 1 ? `${coef} ` : ""}${letters ? base : (NAMES[kind] ?? kind)}${den > 1 ? ` delat med ${den}` : ""}`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${neg ? "minus " : ""}${spoken}`}
      className={cn(
        "kistan-tile kistan-pop relative grid place-items-center rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-60",
        small ? "h-12 w-12 text-3xl" : "h-14 w-14 text-4xl sm:h-20 sm:w-20 sm:text-5xl",
        label.length > 2 && (small ? "text-xl" : "text-2xl sm:text-4xl"),
        neg && "kistan-tile-neg",
        selected && "kistan-ring -translate-y-2",
      )}
    >
      {neg && <span className="absolute left-1 top-0 text-2xl leading-none">−</span>}
      {img ? <img src={img} alt="" className="h-4/5 w-4/5 object-contain" draggable={false} />
        : den > 1 ? (
          <span className="flex flex-col items-center text-[0.7em] leading-none">
            <span>{label}</span><span className="mt-0.5 border-t-[3px] border-current px-1 pt-0.5">{den}</span>
          </span>
        ) : <span>{label}</span>}
    </button>
  );
}

export { boxImg as kistanBoxImg, fishImg as kistanFishImg };
