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
const Sparkle = ({ delay, x, y, size, color, duration }: { 
  delay: number; 
  x: number; 
  y: number; 
  size: number;
  color: string;
  duration: number;
}) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      scale: [0, 1.5, 1, 0],
      rotate: [0, 180],
      y: [0, -10, 5],
    }}
    transition={{ 
      duration, 
      delay,
      ease: "easeOut"
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
        fill={color}
        style={{ filter: `drop-shadow(0 0 ${size/2}px ${color})` }}
      />
    </svg>
  </motion.div>
);

// Glowing orb that floats up
const GlowOrb = ({ delay, x, size, color }: { delay: number; x: number; size: number; color: string }) => (
  <motion.div
    className="absolute pointer-events-none rounded-full"
    style={{ 
      left: `${x}%`, 
      bottom: 0,
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      boxShadow: `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}`,
    }}
    initial={{ opacity: 0, y: 0 }}
    animate={{ 
      opacity: [0, 0.8, 0.6, 0],
      y: [-20, -80, -120],
      scale: [0.5, 1.2, 0.3],
    }}
    transition={{ 
      duration: 1.2, 
      delay,
      ease: "easeOut"
    }}
  />
);

// Shooting star that flies across
const ShootingStar = ({ delay, startX, startY, angle }: { 
  delay: number; 
  startX: number; 
  startY: number;
  angle: number;
}) => {
  const distance = 150;
  const endX = startX + Math.cos(angle) * distance;
  const endY = startY + Math.sin(angle) * distance;
  
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${startX}%`, top: `${startY}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0.3, 1, 0.5],
        x: [0, (endX - startX) * 2],
        y: [0, (endY - startY) * 2],
      }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
    >
      <div 
        className="w-1 h-4 rounded-full"
        style={{
          background: "linear-gradient(to bottom, hsl(var(--neon-turquoise)), transparent)",
          boxShadow: "0 0 8px hsl(var(--neon-turquoise))",
          transform: `rotate(${angle * 180 / Math.PI + 90}deg)`,
        }}
      />
    </motion.div>
  );
};

const SparkleExplosion = ({ show }: { show: boolean }) => {
  const particles = useMemo(() => {
    const colors = [
      "hsl(var(--neon-turquoise))",
      "hsl(var(--neon-copper))",
      "#FFD700",
      "#FFFFFF",
      "hsl(var(--primary))",
    ];
    
    // Main sparkles - lots of them!
    const sparkles = Array.from({ length: 25 }, (_, i) => ({
      id: `sparkle-${i}`,
      type: 'sparkle' as const,
      x: 5 + Math.random() * 90,
      y: 10 + Math.random() * 80,
      delay: Math.random() * 0.4,
      size: 8 + Math.random() * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 0.6 + Math.random() * 0.4,
    }));
    
    // Glowing orbs that float up
    const orbs = Array.from({ length: 8 }, (_, i) => ({
      id: `orb-${i}`,
      type: 'orb' as const,
      x: 10 + Math.random() * 80,
      delay: Math.random() * 0.3,
      size: 12 + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    
    // Shooting stars from center
    const stars = Array.from({ length: 6 }, (_, i) => ({
      id: `star-${i}`,
      type: 'shooting' as const,
      startX: 45 + Math.random() * 10,
      startY: 40 + Math.random() * 20,
      angle: (i / 6) * Math.PI * 2 + Math.random() * 0.5,
      delay: Math.random() * 0.2,
    }));
    
    return { sparkles, orbs, stars };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          {/* Main sparkles */}
          {particles.sparkles.map((s) => (
            <Sparkle 
              key={s.id} 
              delay={s.delay} 
              x={s.x} 
              y={s.y} 
              size={s.size}
              color={s.color}
              duration={s.duration}
            />
          ))}
          
          {/* Floating orbs */}
          {particles.orbs.map((o) => (
            <GlowOrb
              key={o.id}
              delay={o.delay}
              x={o.x}
              size={o.size}
              color={o.color}
            />
          ))}
          
          {/* Shooting stars */}
          {particles.stars.map((s) => (
            <ShootingStar
              key={s.id}
              delay={s.delay}
              startX={s.startX}
              startY={s.startY}
              angle={s.angle}
            />
          ))}
          
          {/* Flash overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, hsl(var(--neon-turquoise) / 0.3) 0%, transparent 70%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.5 }}
          />
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