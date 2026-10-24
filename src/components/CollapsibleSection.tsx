import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSectionOpen } from "@/hooks/useSectionOpen";
import { cn } from "@/lib/utils";

type Tone = "accent" | "calm" | "muted";

interface CollapsibleSectionProps {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  /** Shown on the right of the header (e.g. a next-lesson hint or radio indicator). */
  headerExtra?: ReactNode;
  /** Header content that should stay clickable without toggling (e.g. chapter buttons). */
  headerControls?: ReactNode;
  children: ReactNode;
  tone?: Tone;
  /** Never collapsible – always shows content. */
  alwaysOpen?: boolean;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  /** Keep children mounted while closed (e.g. so the radio keeps playing). */
  keepMounted?: boolean;
}

const TONE_CLASSES: Record<Tone, string> = {
  accent: "border-accent/60 bg-secondary/70 shadow-[0_18px_40px_-24px_hsl(var(--accent)/0.6)]",
  calm: "border-primary/20 bg-secondary/45",
  muted: "border-border/40 bg-secondary/25",
};

const CollapsibleSection = ({
  id,
  title,
  icon,
  headerExtra,
  headerControls,
  children,
  tone = "calm",
  alwaysOpen = false,
  defaultOpen = true,
  className,
  contentClassName,
  keepMounted = false,
}: CollapsibleSectionProps) => {
  const [storedOpen, setOpen] = useSectionOpen(id, defaultOpen);
  const open = alwaysOpen || storedOpen;
  const titleClass = cn(
    "flex items-center gap-2 font-orbitron font-bold text-left",
    tone === "accent" ? "text-base sm:text-lg text-accent" : "text-sm sm:text-base text-foreground/90",
  );

  return (
    <section id={id} className={cn("scroll-mt-4 rounded-2xl border", TONE_CLASSES[tone], className)}>
      <Collapsible open={open} onOpenChange={alwaysOpen ? undefined : setOpen} className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          {alwaysOpen ? (
            <h2 className={titleClass}>
              {icon}
              {title}
            </h2>
          ) : (
            <CollapsibleTrigger className={cn(titleClass, "group flex-1 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
              {icon}
              <span className="min-w-0 truncate">{title}</span>
              {headerExtra && <span className="ml-1 min-w-0 truncate font-nunito text-xs font-normal text-muted-foreground">{headerExtra}</span>}
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          )}
          {alwaysOpen && headerExtra && <span className="font-nunito text-xs text-muted-foreground">{headerExtra}</span>}
          {headerControls && <div className="ml-auto">{headerControls}</div>}
        </div>
        <CollapsibleContent forceMount={keepMounted ? true : undefined} className={cn("min-h-0 data-[state=closed]:hidden flex-1 px-4 pb-4", contentClassName)}>{children}</CollapsibleContent>
      </Collapsible>
    </section>
  );
};

export default CollapsibleSection;
