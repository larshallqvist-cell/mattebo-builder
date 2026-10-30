import { useCallback, useRef, useState, type ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import GuideRobot from "./GuideRobot";

/** Väljare i inställningspanelen. `data-close-settings` stänger panelen efter val. */
export const OptionGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

export const Option = ({ active, onClick, title, children }: { active: boolean; onClick: () => void; title?: string; children: ReactNode }) => (
  <button type="button" data-close-settings onClick={onClick} aria-pressed={active} title={title}
    className={cn("rounded-2xl border px-3.5 py-2 text-left text-sm transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50")}>
    {children}
  </button>
);

/** Diskret tips som bara visas på begäran, med roboten som guide. */
export const HintToggle = ({ open, onToggle, children }: { open: boolean; onToggle: () => void; children: ReactNode }) => (
  <div className="text-left">
    <button type="button" onClick={onToggle} aria-expanded={open}
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
      <Lightbulb className="h-4 w-4" /> {open ? "Dölj tips" : "Visa tips"}
    </button>
    {open && (
      <div className="exercise-rise mt-2 flex items-center gap-3 rounded-2xl bg-secondary px-3 py-2.5">
        <GuideRobot size={40} className="shrink-0" />
        <p className="text-sm font-semibold text-foreground">{children}</p>
      </div>
    )}
  </div>
);

/** Feedback efter svar: tydlig vid rätt, ett konkret nästa steg vid fel – aldrig skämmande. */
export const Feedback = ({ correct, title, children }: { correct: boolean; title?: string; children: ReactNode }) => (
  <div role="status" className={cn("exercise-rise rounded-2xl border-l-4 px-4 py-3 text-left",
    correct ? "border-[hsl(var(--survey-good))] bg-[hsl(var(--survey-good)/0.08)]" : "border-coral bg-coral/10")}>
    <p className={cn("font-orbitron text-lg font-bold", correct ? "animate-answer-correct text-[hsl(var(--survey-good))]" : "text-coral")}>
      {title ?? (correct ? "Rätt!" : "Inte riktigt än")}
    </p>
    <div className="mt-0.5 text-base text-foreground">{children}</div>
  </div>
);

const SOUND_KEY = "mattebo:exercise-sound";
/** Korta, mjuka toner vid svar. Av som standard; valet sparas lokalt. */
export function useExerciseSound() {
  const [on, setOn] = useState(() => { try { return localStorage.getItem(SOUND_KEY) === "1"; } catch { return false; } });
  const ctx = useRef<AudioContext | null>(null);
  const toggle = useCallback(() => setOn((v) => { try { localStorage.setItem(SOUND_KEY, v ? "0" : "1"); } catch { /* privat läge */ } return !v; }), []);
  const play = useCallback((correct: boolean) => {
    if (!on) return;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx.current ??= new AC();
      const c = ctx.current;
      (correct ? [660, 880] : [330]).forEach((f, i) => {
        const o = c.createOscillator(); const g = c.createGain();
        const t = c.currentTime + i * 0.09;
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.25);
      });
    } catch { /* ljud är bara extra */ }
  }, [on]);
  return { on, toggle, play };
}

/** Markerar tal i uppgiftstexten: procent i korall, övriga tal (med enhet) i turkos. */
export function highlightNumbers(text: string): ReactNode[] {
  const re = /\d+(?:[\u00a0\u202f ]\d{3})*(?:,\d+)?(?:[\u00a0 ]?%|[\u00a0 ](?:kr|g)\b)?/g;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const pct = m[0].endsWith("%");
    out.push(<strong key={i} className={cn("whitespace-nowrap font-bold", pct ? "text-coral" : "text-primary")}>{m[0]}</strong>);
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const ROUND = 10;
