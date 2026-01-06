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
  6: "https://calendar.google.com/calendar/ical/0f524015b333a62614ee79bfffa842b02ba01f68ac67a3d8691b4391abc6af1e%40group.calendar.google.com/private-2888a415c500bbb3bf6c96a255c48b82/basic.ics",
  7: "https://calendar.google.com/calendar/ical/d4f5bcba13265c8b896d83349278dddd9415bae5ed132e28a0103682d92e9e17%40group.calendar.google.com/private-86942205e370b95b069d0b24dec6f766/basic.ics",
  8: "https://calendar.google.com/calendar/ical/cbab979826818c72a03dbe3429daa2f509bcdc1ec4954dfc5f3b685e0b550871%40group.calendar.google.com/private-f9e4b06417fa4b09dcf8a6d659aaf436/basic.ics",
  9: "https://calendar.google.com/calendar/ical/bac560a2da180a78f3ff69fd77ebaa580ef750833d374e2bcc184f4ac4b1c0ec%40group.calendar.google.com/private-ffebdd7af80a58ffc03de299343e1b41/basic.ics",
};

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
    
    vevents.forEach((vevent, index) => {
      const event = new ICAL.Event(vevent);
      
      // Kolla om det är en recurring event
      if (event.isRecurring()) {
        const expanded = expandRecurringEvent(vevent, event);
        allEvents.push(...expanded);
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
        const icsUrl = ICS_URLS[grade] || ICS_URLS[9];
        
        // Try multiple CORS proxies as fallback
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrl)}`,
          `https://corsproxy.io/?${encodeURIComponent(icsUrl)}`,
        ];
        
        let icsData: string | null = null;
        
        for (const proxyUrl of proxies) {
          try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
              icsData = await response.text();
              break;
            }
          } catch {
            // Try next proxy
            continue;
          }
        }
        
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
