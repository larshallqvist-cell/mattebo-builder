import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";

const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const formatDay = (date: Date): string => {
  const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  return days[date.getDay()];
};

const formatMonth = (date: Date): string => {
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return months[date.getMonth()];
};

interface LessonCalendarProps {
  grade: number;
}

const LessonCalendar = ({ grade }: LessonCalendarProps) => {
  const { upcomingEvents, loading, error } = useCalendarEvents(grade);
  
  let lastShownWeek: number | null = null;
  
  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden flex-1">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-secondary px-4 py-3 border-b border-border">
        <h3 className="text-xl font-bold text-secondary-foreground font-life-savers">
          Lektionsplanering Åk {grade}
        </h3>
      </div>
      
      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading && (
          <div className="p-8 text-center text-muted-foreground">
            Laddar kalendern...
          </div>
        )}
        
        {error && (
          <div className="p-8 text-center text-destructive">
            {error}
          </div>
        )}
        
        {!loading && !error && upcomingEvents.map((event) => {
          const showWeekHeader = event.week !== lastShownWeek;
          lastShownWeek = event.week;
          
          return (
            <div key={event.id}>
              {/* Week header */}
              {showWeekHeader && (
                <div className="bg-muted px-4 py-2">
                  <span className="text-[15px] font-normal text-accent tracking-wider font-body">
                    VECKA {event.week} ({formatMonth(event.date)})
                  </span>
                </div>
              )}
              
              {/* Event item - compact layout */}
              <div className="px-3 py-2 border-b border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex gap-3 items-center">
                  {/* Date column - compact */}
                  <div className="flex-shrink-0 w-12 text-center font-body">
                    <div className="text-[15px] text-muted-foreground uppercase">
                      {formatDay(event.date)}
                    </div>
                    <div className="text-xl font-normal text-foreground leading-tight">
                      {event.date.getDate()}
                    </div>
                  </div>
                  
                  {/* Content column - time/location first, then title */}
                  <div className="flex-1 min-w-0 font-body">
                    {/* Time and Location */}
                    <div className="flex gap-2 text-[15px] text-muted-foreground">
                      <span>{formatTime(event.date)}–{formatTime(event.endDate)}</span>
                      {event.location && (
                        <span className="text-accent">{event.location}</span>
                      )}
                    </div>
                    {/* Title */}
                    <h4 className="font-body font-normal text-foreground text-[15px] mt-0.5 line-clamp-2">
                      {event.title}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
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
