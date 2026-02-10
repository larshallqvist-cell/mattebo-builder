import { useState, useEffect, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

interface LessonTimerProps {
  grade: number;
  size?: number;
}

const DEFAULT_SIZE = 60;
const SVG_SIZE = 60;
const CENTER = SVG_SIZE / 2;
const RADIUS = 24;

/** Build an SVG arc/pie-slice path from 12-o'clock, going clockwise */
function piePath(fraction: number): string {
  if (fraction <= 0) return "";
  if (fraction >= 1) {
    // Full circle
    return `M ${CENTER},${CENTER - RADIUS}
            A ${RADIUS},${RADIUS} 0 1,1 ${CENTER},${CENTER + RADIUS}
            A ${RADIUS},${RADIUS} 0 1,1 ${CENTER},${CENTER - RADIUS} Z`;
  }
  const angle = fraction * 2 * Math.PI;
  const x = CENTER + RADIUS * Math.sin(angle);
  const y = CENTER - RADIUS * Math.cos(angle);
  const largeArc = fraction > 0.5 ? 1 : 0;
  return `M ${CENTER},${CENTER}
          L ${CENTER},${CENTER - RADIUS}
          A ${RADIUS},${RADIUS} 0 ${largeArc},1 ${x},${y}
          Z`;
}

const LessonTimer = ({ grade, size = DEFAULT_SIZE }: LessonTimerProps) => {
  const { upcomingEvents } = useCalendarEvents(grade);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentLesson = useMemo(() => {
    return upcomingEvents.find(
      (e) => e.date.getTime() <= now && e.endDate.getTime() > now
    ) ?? null;
  }, [upcomingEvents, now]);

  if (!currentLesson) return null;

  const start = currentLesson.date.getTime();
  const end = currentLesson.endDate.getTime();
  const total = end - start;
  const remaining = Math.max(0, end - now);
  const fraction = total > 0 ? remaining / total : 0;

  const remainingSec = Math.ceil(remaining / 1000);
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const isUrgent = mins < 5 && remaining > 0;
  const isDone = remaining <= 0;

  const timeDisplay = isDone
    ? "Slut!"
    : mins >= 10
      ? `${mins} min`
      : `${mins}:${secs.toString().padStart(2, "0")}`;

  // Current clock time
  const clockStr = new Date(now).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div
        className={`relative ${isUrgent ? "animate-pulse" : ""}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full h-full">
          {/* White background circle */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="white"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />
          {/* Red pie wedge */}
          <path
            d={piePath(fraction)}
            fill={isUrgent ? "hsl(0 80% 50%)" : "hsl(0 70% 55%)"}
            style={{
              filter: isUrgent
                ? "drop-shadow(0 0 6px hsl(0 80% 50% / 0.6))"
                : undefined,
            }}
          />
        </svg>
        {/* Time digits in center */}
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold tabular-nums ${
            size >= 100 ? 'text-base' : 'text-xs'
          } ${
            isDone || isUrgent ? "text-white drop-shadow-md" : "text-foreground"
          }`}
        >
          {timeDisplay}
        </span>
      </div>
      <span className={`${size >= 100 ? 'text-xs' : 'text-[10px]'} text-muted-foreground font-mono leading-tight`}>
        {clockStr}
      </span>
    </div>
  );
};

export default LessonTimer;
