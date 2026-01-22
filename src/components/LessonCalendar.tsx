import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMemo } from "react";

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
  const { upcomingEvents, loading, error } = useCalendarEvents(grade);

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

  // Default open: only the first week
  const defaultOpenWeek = weekGroups.length > 0 ? [`week-${weekGroups[0].week}`] : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading && (
          <div className="p-8 text-center text-muted-foreground">
            Laddar kalendern...
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-destructive">{error}</div>
        )}

        {!loading && !error && weekGroups.length > 0 && (
          <Accordion
            type="multiple"
            defaultValue={defaultOpenWeek}
            className="w-full"
          >
            {weekGroups.map((group) => (
              <AccordionItem
                key={`week-${group.week}`}
                value={`week-${group.week}`}
                className="border-b-0"
              >
                <AccordionTrigger
                  className="px-4 py-2.5 hover:no-underline"
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
                <AccordionContent className="pb-0">
                  {group.events.map((event) => (
                    <div
                      key={event.id}
                      className="px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <div className="flex gap-3 items-center">
                        {/* Date column - compact */}
                        <div className="flex-shrink-0 w-14 text-center">
                          <div className="text-sm font-nunito uppercase font-medium text-muted-foreground">
                            {formatDay(event.date)}
                          </div>
                          <div
                            className="text-2xl font-orbitron font-bold leading-tight"
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
                          <h4 className="font-nunito font-normal text-foreground mt-0.5 line-clamp-2 text-base">
                            {event.title}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
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