import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Settings2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import GuideRobot from "./GuideRobot";

type Props = {
  title: string;
  /** Kort text om vald övning/nivå, visas på knappen som öppnar inställningarna. */
  current?: string;
  progress?: { value: number; total: number; showLabel?: boolean };
  sound?: { on: boolean; toggle: () => void };
  /** Val av övning och nivå. Döljs bakom inställningsknappen så att uppgiften står i fokus. */
  settings?: ReactNode;
  /** Roboten visas vid framstegen, utom när den redan syns i ett tips. */
  showRobot?: boolean;
  children: ReactNode;
};

/** Gemensam ljus ram för övningssidorna: kompakt toppfält med framsteg, ljud och inställningar. */
const ExerciseShell = ({ title, current, progress, sound, settings, showRobot = true, children }: Props) => {
  const [open, setOpen] = useState(false);
  const pct = progress ? Math.min(100, Math.round((progress.value / progress.total) * 100)) : 0;

  return (
    <div className="exercise-light min-h-screen font-nunito">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/" aria-label="Tillbaka till Mattebo"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Mattebo</span>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="truncate font-orbitron text-base font-bold text-foreground">{title}</span>
              {progress?.showLabel !== false && progress && (
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">Uppgift {Math.min(progress.value + 1, progress.total)} av {progress.total}</span>
              )}
            </div>
            {progress && (
              <div role="progressbar" aria-label="Framsteg" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.value}
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          {showRobot && <GuideRobot size={34} className="hidden shrink-0 sm:block" />}

          {sound && (
            <button type="button" onClick={sound.toggle} aria-pressed={sound.on} aria-label={sound.on ? "Stäng av ljud" : "Slå på ljud"}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              {sound.on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}
          {settings && (
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="exercise-settings" aria-label="Välj övning och nivå"
              className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                open ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              <Settings2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
        {settings && current && (
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="exercise-settings"
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary/50">
            <span className="truncate">{current}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        )}
        {settings && open && (
          <div id="exercise-settings" className="exercise-card exercise-rise space-y-4 rounded-3xl p-4 sm:p-5"
            onClick={(e) => { if ((e.target as HTMLElement).closest("[data-close-settings]")) setOpen(false); }}>
            {settings}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default ExerciseShell;
