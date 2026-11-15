import { describe, expect, test } from "bun:test";
import { pickLessonField } from "../src/lib/lessonSource";

const cal = new Date("2026-11-15T15:00:00Z");

describe("Kalendern bestämmer över lektionstexten", () => {
  test("ändring i kalendern efter sparning i Mattebo vinner", () => {
    expect(
      pickLessonField({ calendarValue: "Ny text från kalendern", calendarModified: cal, planValue: "Gammal Mattebo-text", planUpdated: "2026-11-15T14:00:00Z" }),
    ).toBe("Ny text från kalendern");
  });

  test("tömd beskrivning i kalendern vinner också", () => {
    expect(pickLessonField({ calendarValue: "", calendarModified: cal, planValue: "Gammal text", planUpdated: "2026-11-15T14:59:59Z" })).toBe("");
  });

  test("nyss sparad text i Mattebo visas tills kalenderflödet hunnit ikapp", () => {
    expect(
      pickLessonField({ calendarValue: "Före sparning", calendarModified: cal, planValue: "Just sparad", planUpdated: "2026-11-15T15:00:01Z" }),
    ).toBe("Just sparad");
  });

  test("utan Mattebo-text gäller kalendern", () => {
    expect(pickLessonField({ calendarValue: "Kalender", calendarModified: cal, planValue: "", planUpdated: "2026-11-15T16:00:00Z" })).toBe("Kalender");
  });

  test("kalender utan ändringsdatum: kalenderns text gäller om den finns", () => {
    expect(pickLessonField({ calendarValue: "Kalender", planValue: "Mattebo", planUpdated: "2026-11-15T16:00:00Z" })).toBe("Kalender");
    expect(pickLessonField({ calendarValue: "", planValue: "Mattebo", planUpdated: "2026-11-15T16:00:00Z" })).toBe("Mattebo");
  });
});
