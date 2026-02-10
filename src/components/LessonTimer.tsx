import { useState, useEffect, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

interface LessonTimerProps {
  grade: number;
}

const CIRCLE_RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const LessonTimer = ({ grade }: LessonTimerProps) => {
  const { upcomingEvents } = useCalendarEvents(grade);
  const [now, setNow] = useState(() => Date.now());

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Find the currently active lesson
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

  // SVG arc offset — full dash = full circle, offset shrinks the visible red arc
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  const remainingSec = Math.ceil(remaining / 1000);
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const isUrgent = mins < 5 && remaining > 0;
  const isDone = remaining <= 0;

  // Format display
  const timeDisplay = isDone
    ? "Slut!"
    : mins >= 10
      ? `${mins} min`
      : `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative w-[60px] h-[60px] ${isUrgent ? "animate-pulse" : ""}`}
      >
        <svg
          viewBox="0 0 60 60"
          className="w-full h-full -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="30"
            cy="30"
            r={CIRCLE_RADIUS}
            fill="white"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
          {/* Red decreasing arc */}
          <circle
            cx="30"
            cy="30"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke={isUrgent ? "hsl(0 80% 50%)" : "hsl(0 70% 55%)"}
            strokeWidth="6"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            style={{
              filter: isUrgent ? "drop-shadow(0 0 6px hsl(0 80% 50% / 0.6))" : undefined,
            }}
          />
        </svg>
        {/* Time digits in center */}
        <span
          className={`absolute inset-0 flex items-center justify-center rotate-0 text-xs font-bold tabular-nums ${
            isDone
              ? "text-destructive"
              : isUrgent
                ? "text-destructive"
                : "text-foreground"
          }`}
        >
          {timeDisplay}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground truncate max-w-[80px] text-center leading-tight">
        {currentLesson.title}
      </span>
    </div>
  );
};

export default LessonTimer;
