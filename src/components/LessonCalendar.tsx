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
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-secondary px-4 py-3 border-b border-border">
        <h3 className="text-lg font-bold text-secondary-foreground">
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
                  <span className="text-sm font-bold text-accent tracking-wider">
                    VECKA {event.week}
                  </span>
                </div>
              )}
              
              {/* Event item */}
              <div className="px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors">
                {/* Row 1: Date and Title */}
                <div className="flex gap-4">
                  {/* Date column */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {formatDay(event.date)}
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {event.date.getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatMonth(event.date)}
                    </div>
                  </div>
                  
                  {/* Title column */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground line-clamp-2">
                      {event.title}
                    </h4>
                  </div>
                </div>
                
                {/* Row 2: Time and Location */}
                <div className="mt-2 ml-[4.5rem] flex gap-4 text-sm text-muted-foreground">
                  <span>
                    {formatTime(event.date)}–{formatTime(event.endDate)}
                  </span>
                  {event.location && (
                    <span className="text-accent">{event.location}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {!loading && !error && upcomingEvents.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Inga kommande lektioner
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonCalendar;
