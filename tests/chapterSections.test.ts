import { test, expect } from "bun:test";
import { parseSections, clampCurrent, carryCurrent, MAX_SECTIONS } from "../src/lib/chapterSections";

test("en rad per delkapitel, tomma rader och extra mellanslag bort", () => {
  expect(parseSections("  Uttryck \n\n2.2  Ekvationer\r\n   ")).toEqual(["Uttryck", "2.2 Ekvationer"]);
});

test("högst 12 delkapitel", () => {
  const text = Array.from({ length: 20 }, (_, i) => `Del ${i + 1}`).join("\n");
  expect(parseSections(text).length).toBe(MAX_SECTIONS);
});

test("markerat delkapitel utanför listan blir omarkerat", () => {
  expect(clampCurrent(2, 3)).toBe(2);
  expect(clampCurrent(3, 3)).toBeNull();
  expect(clampCurrent(-1, 3)).toBeNull();
  expect(clampCurrent(null, 3)).toBeNull();
});

test("markeringen följer med samma delkapitel när listan ändras", () => {
  expect(carryCurrent(["A", "Uttryck", "C"], 1, ["Ny", "A", "Uttryck"])).toBe(2);
  expect(carryCurrent(["A", "Uttryck"], 1, ["A", "B"])).toBeNull();
});
