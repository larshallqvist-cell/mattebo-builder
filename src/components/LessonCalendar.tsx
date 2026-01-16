import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
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
const LessonCalendar = ({
  grade
}: LessonCalendarProps) => {
  const {
    upcomingEvents,
    loading,
    error
  } = useCalendarEvents(grade);
  let lastShownWeek: number | null = null;
  return <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky header - removed for ScreenFrame usage */}

      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading && <div className="p-8 text-center text-muted-foreground">Laddar kalendern...</div>}

        {error && <div className="p-8 text-center text-destructive">{error}</div>}

        {!loading && !error && upcomingEvents.map(event => {
        const showWeekHeader = event.week !== lastShownWeek;
        lastShownWeek = event.week;
        return <div key={event.id}>
                {/* Week header */}
                {showWeekHeader && <div 
                  className="px-4 py-2.5"
                  style={{
                    background: "linear-gradient(90deg, rgba(64, 224, 208, 0.15) 0%, rgba(64, 224, 208, 0.05) 100%)",
                    borderBottom: "1px solid rgba(64, 224, 208, 0.3)",
                  }}
                >
                    <span 
                      className="text-base font-orbitron font-semibold tracking-wider"
                      style={{ color: "hsl(var(--neon-turquoise))", textShadow: "0 0 8px rgba(64, 224, 208, 0.5)" }}
                    >
                      VECKA {event.week} ({formatMonth(event.date)})
                    </span>
                  </div>}

                {/* Event item - compact layout */}
                <div 
                  className="px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="flex gap-3 items-center">
                    {/* Date column - compact */}
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className="text-sm font-nunito uppercase font-medium text-muted-foreground">{formatDay(event.date)}</div>
                      <div 
                        className="text-2xl font-orbitron font-bold leading-tight"
                        style={{ color: "hsl(var(--neon-copper))", textShadow: "0 0 8px rgba(205, 127, 50, 0.4)" }}
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
                        {event.location && <span style={{ color: "hsl(var(--neon-turquoise))" }}>{event.location}</span>}
                      </div>
                      {/* Title */}
                      <h4 className="font-nunito font-normal text-foreground mt-0.5 line-clamp-2 text-base">
                        {event.title}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>;
      })}

        {!loading && !error && upcomingEvents.length === 0 && <div className="p-8 text-center text-muted-foreground text-base">Inga kommande lektioner</div>}
      </div>
    </div>;
};
export default LessonCalendar;