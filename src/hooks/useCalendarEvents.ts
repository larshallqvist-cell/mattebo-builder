import { useState, useEffect } from "react";
import ICAL from "ical.js";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate: Date;
  location?: string;
  description?: string;
  week: number;
}

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const expandRecurringEvent = (vevent: ICAL.Component, event: ICAL.Event): CalendarEvent[] => {
  const start = event.startDate;
  const duration = event.duration;
  
  // Expandera 6 månader framåt från idag
  const now = ICAL.Time.now();
  const rangeEnd = now.clone();
  rangeEnd.addDuration(new ICAL.Duration({ weeks: 26 }));
  
  const expand = new ICAL.RecurExpansion({
    component: vevent,
    dtstart: start,
  });
  
  const occurrences: CalendarEvent[] = [];
  let next;
  let count = 0;
  const maxOccurrences = 200;
  
  while ((next = expand.next()) && count < maxOccurrences) {
    if (next.compare(rangeEnd) > 0) break;
    if (next.compare(now) < 0) continue;
    
    const startDate = next.toJSDate();
    const endDate = next.clone();
    endDate.addDuration(duration);
    
    occurrences.push({
      id: `${event.uid}-${next.toString()}`,
      title: event.summary || "Ingen titel",
      date: startDate,
      endDate: endDate.toJSDate(),
      location: event.location || undefined,
      description: event.description || undefined,
      week: getWeekNumber(startDate),
    });
    count++;
  }
  
  return occurrences;
};

const parseICSData = (icsData: string): CalendarEvent[] => {
  try {
    const jcalData = ICAL.parse(icsData);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents("vevent");
    
    const allEvents: CalendarEvent[] = [];
    // Samla RECURRENCE-ID händelser för att ersätta expanderade instanser
    const recurrenceOverrides = new Map<string, CalendarEvent>();
    
    // Första pass: samla alla RECURRENCE-ID händelser
    vevents.forEach((vevent, index) => {
      const recurrenceId = vevent.getFirstPropertyValue("recurrence-id");
      if (recurrenceId) {
        const event = new ICAL.Event(vevent);
        const startDate = event.startDate.toJSDate();
        const endDate = event.endDate.toJSDate();
        const key = `${event.uid}-${recurrenceId.toString()}`;
        
        recurrenceOverrides.set(key, {
          id: `${event.uid}-override-${index}`,
          title: event.summary || "Ingen titel",
          date: startDate,
          endDate: endDate,
          location: event.location || undefined,
          description: event.description || undefined,
          week: getWeekNumber(startDate),
        });
      }
    });
    
    // Andra pass: hantera vanliga och återkommande händelser
    vevents.forEach((vevent, index) => {
      const recurrenceId = vevent.getFirstPropertyValue("recurrence-id");
      // Hoppa över RECURRENCE-ID händelser - de hanterades ovan
      if (recurrenceId) return;
      
      const event = new ICAL.Event(vevent);
      
      // Kolla om det är en recurring event
      if (event.isRecurring()) {
        const expanded = expandRecurringEvent(vevent, event);
        // Filtrera bort instanser som har en override
        expanded.forEach(e => {
          // Kolla om det finns en override för denna instans
          const overrideKey = Array.from(recurrenceOverrides.keys()).find(key => 
            key.startsWith(event.uid) && 
            Math.abs(recurrenceOverrides.get(key)!.date.getTime() - e.date.getTime()) < 60000
          );
          if (!overrideKey) {
            allEvents.push(e);
          }
        });
      } else {
        const startDate = event.startDate.toJSDate();
        const endDate = event.endDate.toJSDate();
        
        allEvents.push({
          id: event.uid || `event-${index}`,
          title: event.summary || "Ingen titel",
          date: startDate,
          endDate: endDate,
          location: event.location || undefined,
          description: event.description || undefined,
          week: getWeekNumber(startDate),
        });
      }
    });
    
    // Lägg till alla overrides
    recurrenceOverrides.forEach(override => {
      allEvents.push(override);
    });
    
    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error("Error parsing ICS data:", error);
    return [];
  }
};

// Simple cache to avoid refetching
const cache: Record<number, { events: CalendarEvent[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useCalendarEvents = (grade: number) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      // Check cache first
      const cached = cache[grade];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setEvents(cached.events);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Use edge function to fetch calendar (faster, no CORS issues)
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-calendar?grade=${grade}`;
        const response = await fetch(functionUrl, {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!response.ok) {
          throw new Error("Kunde inte hämta kalendern");
        }

        const icsData = await response.text();
        
        if (!icsData) {
          throw new Error("Kunde inte hämta kalendern");
        }
        
        const parsedEvents = parseICSData(icsData);
        
        // Update cache
        cache[grade] = { events: parsedEvents, timestamp: Date.now() };
        
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

  const now = new Date();
  const upcomingEvents = events.filter(e => e.endDate > now);
  const nextEvent = upcomingEvents[0] || null;

  return { events, upcomingEvents, nextEvent, loading, error };
};
