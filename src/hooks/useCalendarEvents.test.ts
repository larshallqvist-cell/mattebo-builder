import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { deduplicateCalendarEvents, parseICSData, type CalendarEvent } from "./useCalendarEvents";

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "event-without-room",
  title: "Matte Åk 7",
  date: new Date("2026-08-18T08:00:00.000Z"),
  endDate: new Date("2026-08-18T08:50:00.000Z"),
  week: 34,
  ...overrides,
});

describe("calendar event deduplication", () => {
  test("keeps the duplicate that includes a room", () => {
    const events = deduplicateCalendarEvents([
      makeEvent(),
      makeEvent({ id: "event-with-room", location: "H3" }),
    ]);

    assert.equal(events.length, 1);
    assert.equal(events[0]?.id, "event-with-room");
    assert.equal(events[0]?.location, "H3");
  });

  test("keeps genuinely different lessons", () => {
    const events = deduplicateCalendarEvents([
      makeEvent(),
      makeEvent({ id: "later-event", date: new Date("2026-08-18T09:00:00.000Z") }),
    ]);

    assert.equal(events.length, 2);
  });

  test("merges a UTC event with an equivalent floating local-time event", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:with-room@google.com",
      "DTSTART:20260818T080000Z",
      "DTEND:20260818T085000Z",
      "SUMMARY:Matte Åk 7",
      "LOCATION:H3",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:without-room@google.com",
      "DTSTART:20260818T100000",
      "DTEND:20260818T105000",
      "SUMMARY:Matte Åk 7",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseICSData(ics);

    assert.equal(events.length, 1);
    assert.equal(events[0]?.location, "H3");
  });
});