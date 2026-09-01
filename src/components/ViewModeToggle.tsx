import { Monitor, Smartphone, LayoutGrid } from "lucide-react";
import { useViewMode } from "@/hooks/useViewMode";

const LABELS = {
  auto: { icon: LayoutGrid, text: "Auto" },
  mobile: { icon: Smartphone, text: "Mobil" },
  desktop: { icon: Monitor, text: "Dator" },
} as const;

/** Small button that cycles Auto → Mobil → Dator layout. */
const ViewModeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { mode, cycle } = useViewMode();
  const { icon: Icon, text } = LABELS[mode];

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Vy: ${text} — klicka för att byta (Auto → Mobil → Dator)`}
      aria-label={`Byt vy (nu: ${text})`}
      className="flex items-center gap-1.5 flex-shrink-0 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-nunito font-semibold text-accent shadow-sm transition-colors hover:bg-accent/20 hover:border-accent"
    >
      <Icon className="w-4 h-4" />
      <span className={compact ? "hidden sm:inline" : ""}>Vy: {text}</span>
    </button>
  );

};

export default ViewModeToggle;
