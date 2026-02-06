import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMemo, useState } from "react";
import { CalendarSkeleton } from "@/components/skeletons";
import { CalendarEffect } from "@/components/CalendarEffects";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sparkle component for accordion expand effect
const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0],
    }}
    transition={{ 
      duration: 0.6, 
      delay,
      ease: "easeOut"
    }}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
        fill="hsl(var(--neon-turquoise))"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--neon-turquoise)))" }}
      />
    </svg>
  </motion.div>
);

const SparkleExplosion = ({ show }: { show: boolean }) => {
  const sparkles = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 0.2,
    })), []);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          {sparkles.map((s) => (
            <Sparkle key={s.id} delay={s.delay} x={s.x} y={s.y} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};

const formatDay = (date: Date): string => {
  const days = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
  return days[date.getDay()];
};

const formatMonth = (date: Date): string => {
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return months[date.getMonth()];
};

interface LessonCalendarProps {
  grade: number;
}

interface WeekGroup {
  week: number;
  month: string;
  events: CalendarEvent[];
}

const LessonCalendar = ({ grade }: LessonCalendarProps) => {
  const { upcomingEvents, loading, error, refresh } = useCalendarEvents(grade);
  const [sparklingWeeks, setSparklingWeeks] = useState<Set<number>>(new Set());
  const [openWeeks, setOpenWeeks] = useState<string[]>([]);

  // Group events by week
  const weekGroups = useMemo(() => {
    const groups: WeekGroup[] = [];
    let currentWeek: number | null = null;
    let currentGroup: WeekGroup | null = null;

    upcomingEvents.forEach((event) => {
      if (event.week !== currentWeek) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentWeek = event.week;
        currentGroup = {
          week: event.week,
          month: formatMonth(event.date),
          events: [event],
        };
      } else if (currentGroup) {
        currentGroup.events.push(event);
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [upcomingEvents]);

  // Default open: only the first week (set on first render)
  const defaultOpenWeek = weekGroups.length > 0 ? [`week-${weekGroups[0].week}`] : [];
  
  // Handle accordion value change to trigger sparkles
  const handleValueChange = (newValue: string[]) => {
    // Find newly opened weeks
    const newlyOpened = newValue.filter(v => !openWeeks.includes(v));
    
    if (newlyOpened.length > 0) {
      const weekNumbers = newlyOpened.map(v => parseInt(v.replace('week-', '')));
      setSparklingWeeks(prev => new Set([...prev, ...weekNumbers]));
      
      // Clear sparkles after animation
      setTimeout(() => {
        setSparklingWeeks(prev => {
          const next = new Set(prev);
          weekNumbers.forEach(w => next.delete(w));
          return next;
        });
      }, 800);
    }
    
    setOpenWeeks(newValue);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Refresh button */}
      <div className="flex justify-end px-2 py-1">
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Uppdatera kalender"
          style={{ color: "hsl(var(--neon-turquoise))" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      
      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading && <CalendarSkeleton />}

        {error && (
          <div className="p-8 text-center text-destructive">{error}</div>
        )}

        {!loading && !error && weekGroups.length > 0 && (
          <Accordion
            type="multiple"
            defaultValue={defaultOpenWeek}
            onValueChange={handleValueChange}
            className="w-full"
          >
            {weekGroups.map((group) => (
              <AccordionItem
                key={`week-${group.week}`}
                value={`week-${group.week}`}
                className="border-b-0"
              >
                <AccordionTrigger
                  className="px-3 py-1 hover:no-underline text-sm"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(64, 224, 208, 0.15) 0%, rgba(64, 224, 208, 0.05) 100%)",
                    borderBottom: "1px solid rgba(64, 224, 208, 0.3)",
                  }}
                >
                  <span
                    className="text-base font-orbitron font-semibold tracking-wider"
                    style={{
                      color: "hsl(var(--neon-turquoise))",
                      textShadow: "0 0 8px rgba(64, 224, 208, 0.5)",
                    }}
                  >
                    VECKA {group.week} ({group.month})
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-0 relative">
                  <SparkleExplosion show={sparklingWeeks.has(group.week)} />
                  {group.events.map((event, eventIndex) => {
                    // Check if this is a new day compared to previous event
                    const prevEvent = eventIndex > 0 ? group.events[eventIndex - 1] : null;
                    const isNewDay = !prevEvent || 
                      event.date.getDate() !== prevEvent.date.getDate() ||
                      event.date.getMonth() !== prevEvent.date.getMonth();
                    
                    return (
                      <div key={event.id}>
                        {/* Day separator - show between different days */}
                        {isNewDay && eventIndex > 0 && (
                          <div 
                            className="mx-3 my-2 h-[2px]"
                            style={{
                              background: "linear-gradient(90deg, transparent 5%, hsl(var(--neon-copper)) 25%, hsl(var(--neon-copper)) 75%, transparent 95%)",
                              boxShadow: "0 0 10px hsl(var(--neon-copper) / 0.6), 0 0 20px hsl(var(--neon-copper) / 0.3)",
                            }}
                          />
                        )}
                        
                        <div
                          className="relative px-2 py-1 hover:bg-white/5 transition-colors cursor-pointer text-sm"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          {/* Special effect overlay */}
                          {event.effect && <CalendarEffect type={event.effect} />}
                          <div className="flex gap-3 items-center relative z-10">
                            {/* Date column - compact */}
                            <div className="flex-shrink-0 w-14 text-center">
                              <div className="text-sm font-nunito uppercase font-medium text-muted-foreground">
                                {formatDay(event.date)}
                              </div>
                              <div
                                className="text-lg font-orbitron font-bold leading-tight"
                                style={{
                                  color: "hsl(var(--neon-copper))",
                                  textShadow: "0 0 8px rgba(205, 127, 50, 0.4)",
                                }}
                              >
                                {event.date.getDate()}
                              </div>
                            </div>

                            {/* Content column - time/location first, then title */}
                            <div className="flex-1 min-w-0">
                              {/* Time and Location */}
                              <div className="flex gap-2 text-sm font-nunito font-medium text-muted-foreground">
                                <span>
                                  {formatTime(event.date)}–{formatTime(event.endDate)}
                                </span>
                                {event.location && (
                                  <span style={{ color: "hsl(var(--neon-turquoise))" }}>
                                    {event.location}
                                  </span>
                                )}
                              </div>
                              {/* Title */}
                              <h4 className="font-nunito font-normal text-foreground mt-0.5 line-clamp-2 text-sm">
                                {event.title}
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {!loading && !error && upcomingEvents.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-base">
            Inga kommande lektioner
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonCalendar;