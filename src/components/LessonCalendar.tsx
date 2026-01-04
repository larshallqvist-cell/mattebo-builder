import { useState, useEffect } from "react";
import ICAL from "ical.js";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate: Date;
  location?: string;
  description?: string;
  week: number;
}

// ICS URLs per grade - using the same URL for now, can be customized per grade
const ICS_URLS: Record<number, string> = {
  6: "https://calendar.google.com/calendar/ical/bac560a2da180a78f3ff69fd77ebaa580ef750833d374e2bcc184f4ac4b1c0ec%40group.calendar.google.com/private-ffebdd7af80a58ffc03de299343e1b41/basic.ics",
  7: "https://calendar.google.com/calendar/ical/bac560a2da180a78f3ff69fd77ebaa580ef750833d374e2bcc184f4ac4b1c0ec%40group.calendar.google.com/private-ffebdd7af80a58ffc03de299343e1b41/basic.ics",
  8: "https://calendar.google.com/calendar/ical/bac560a2da180a78f3ff69fd77ebaa580ef750833d374e2bcc184f4ac4b1c0ec%40group.calendar.google.com/private-ffebdd7af80a58ffc03de299343e1b41/basic.ics",
  9: "https://calendar.google.com/calendar/ical/bac560a2da180a78f3ff69fd77ebaa580ef750833d374e2bcc184f4ac4b1c0ec%40group.calendar.google.com/private-ffebdd7af80a58ffc03de299343e1b41/basic.ics",
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

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

const parseICSData = (icsData: string): CalendarEvent[] => {
  try {
    const jcalData = ICAL.parse(icsData);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents("vevent");
    
    const events: CalendarEvent[] = vevents.map((vevent, index) => {
      const event = new ICAL.Event(vevent);
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();
      
      return {
        id: event.uid || `event-${index}`,
        title: event.summary || "Ingen titel",
        date: startDate,
        endDate: endDate,
        location: event.location || undefined,
        description: event.description || undefined,
        week: getWeekNumber(startDate),
      };
    });
    
    // Sort by start date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error("Error parsing ICS data:", error);
    return [];
  }
};

interface LessonCalendarProps {
  grade: number;
}

const LessonCalendar = ({ grade }: LessonCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const icsUrl = ICS_URLS[grade] || ICS_URLS[9];
        // Use a CORS proxy to fetch the ICS file
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error("Kunde inte hämta kalendern");
        }
        
        const icsData = await response.text();
        const parsedEvents = parseICSData(icsData);
        setEvents(parsedEvents);
      } catch (err) {
        console.error("Calendar fetch error:", err);
        setError("Kunde inte ladda kalendern");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [grade]);
  
  // Filter to show only upcoming events
  const now = new Date();
  const upcomingEvents = events.filter(e => e.endDate > now);
  
  // Track which weeks have been shown
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
