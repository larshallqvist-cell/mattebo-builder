import { useState } from "react";
import { useWeeklySurvey } from "@/hooks/useWeeklySurvey";
import SurveyDialog from "@/components/SurveyDialog";

interface Props {
  grade: number;
  /** Smaller variant for the mobile header. */
  compact?: boolean;
}

/**
 * A small lamp in the header. It glows while this week's check-in is open and
 * the student hasn't answered yet, and dims once the answer is submitted.
 */
const SurveyLamp = ({ grade, compact }: Props) => {
  const { survey, answers, hasAnswered, isOpen, submit } = useWeeklySurvey(grade);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isOpen || !survey) return null;

  const size = compact ? 34 : 40;
  const hue = hasAnswered ? "var(--survey-good)" : "var(--homework-bg)";

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        title={hasAnswered ? "Din veckoavstämning är inskickad" : "Ny veckoavstämning — klicka för att svara"}
        aria-label={hasAnswered ? "Veckoavstämning inskickad" : "Ny veckoavstämning att fylla i"}
        className="relative flex-shrink-0 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: size, height: size }}
      >
        <span
          className={`absolute inset-0 rounded-full ${hasAnswered ? "" : "animate-pulse"}`}
          style={{
            background: `radial-gradient(circle at 35% 30%, hsl(${hue} / 0.95), hsl(${hue} / 0.5))`,
            border: `2px solid hsl(${hue} / ${hasAnswered ? 0.6 : 1})`,
            boxShadow: hasAnswered
              ? `0 0 6px hsl(${hue} / 0.4)`
              : `0 0 14px hsl(${hue} / 0.85), 0 0 30px hsl(${hue} / 0.45)`,
            opacity: hasAnswered ? 0.55 : 1,
          }}
        />
        <span
          className="relative flex items-center justify-center h-full w-full font-orbitron font-bold text-[hsl(var(--homework-text))]"
          style={{ fontSize: compact ? 13 : 15 }}
          aria-hidden
        >
          {hasAnswered ? "✓" : "?"}
        </span>
      </button>

      <SurveyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        survey={survey}
        existing={answers}
        onSubmit={submit}
      />
    </>
  );
};

export default SurveyLamp;
