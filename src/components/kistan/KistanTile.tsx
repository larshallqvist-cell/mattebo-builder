import boxImg from "@/assets/kistan/box.webp";
import fishImg from "@/assets/kistan/fish.webp";
import bflyImg from "@/assets/kistan/butterfly.webp";
import { cn } from "@/lib/utils";

const IMAGES: Record<string, string> = { box: boxImg, fish: fishImg, bfly: bflyImg };
const LETTERS: Record<string, string> = { box: "x", fish: "a", bfly: "b" };
const NAMES: Record<string, string> = { box: "kistan", fish: "fisk", bfly: "fjäril" };

type Props = { kind: string; neg: boolean; letters?: boolean; selected?: boolean; small?: boolean; onClick?: () => void; disabled?: boolean };

/** En bricka: bild (värld 1–2) eller bokstav (värld 3). Minusbrickor är mörka med ett minustecken. */
export default function KistanTile({ kind, neg, letters, selected, small, onClick, disabled }: Props) {
  const img = !letters ? IMAGES[kind] : undefined;
  const label = letters ? (LETTERS[kind] ?? kind) : kind;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${neg ? "minus " : ""}${letters ? label : (NAMES[kind] ?? kind)}`}
      className={cn(
        "kistan-tile kistan-pop relative grid place-items-center rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-60",
        small ? "h-12 w-12 text-3xl" : "h-14 w-14 text-4xl sm:h-20 sm:w-20 sm:text-5xl",
        neg && "kistan-tile-neg",
        selected && "kistan-ring -translate-y-2",
      )}
    >
      {neg && <span className="absolute left-1 top-0 text-2xl leading-none">−</span>}
      {img ? <img src={img} alt="" className="h-4/5 w-4/5 object-contain" draggable={false} /> : <span>{label}</span>}
    </button>
  );
}

export { boxImg as kistanBoxImg, fishImg as kistanFishImg };
