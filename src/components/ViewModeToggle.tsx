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
      title={`Vy: ${text} — klicka för att byta`}
      aria-label={`Byt vy (nu: ${text})`}
      className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/40 px-2.5 py-1 text-xs font-nunito text-muted-foreground transition-colors hover:text-foreground hover:border-primary/60"
    >
      <Icon className="w-4 h-4" />
      {!compact && <span>{text}</span>}
    </button>
  );
};

export default ViewModeToggle;
