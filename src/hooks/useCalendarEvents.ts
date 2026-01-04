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

// ICS URLs per grade
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
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
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
        const icsUrl = ICS_URLS[grade] || ICS_URLS[9];
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error("Kunde inte hämta kalendern");
        }
        
        const icsData = await response.text();
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
