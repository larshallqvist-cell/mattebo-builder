import { describe, expect, test } from "bun:test";
import { parsePresentationFileName, sectionNumber } from "../src/lib/presentations";

describe("parsePresentationFileName", () => {
  test("reads chapter and sub-chapter from Lasse's file names", () => {
    expect(parsePresentationFileName("ak6_kap2_5_procent.html", 6)).toEqual({ chapter: 2, section: 5 });
    expect(parsePresentationFileName("ak6_kap2_1_rakna_med_brak.html", 6)).toEqual({ chapter: 2, section: 1 });
    expect(parsePresentationFileName("ak6_kap2_7_berakna_delen_procentform.html", 6)).toEqual({ chapter: 2, section: 7 });
  });

  test("reads the dotted book number", () => {
    expect(parsePresentationFileName("Åk6 2.5 Procent.html", 6)).toEqual({ chapter: 2, section: 5 });
  });

  test("refuses a file made for another grade", () => {
    expect(parsePresentationFileName("ak7_kap2_5_procent.html", 6)).toEqual({ error: "wrong-grade" });
  });

  test("reports files without a sub-chapter number", () => {
    expect(parsePresentationFileName("procent.html", 6)).toEqual({ error: "no-section" });
  });
});

describe("sectionNumber", () => {
  test("uses the written book number when it belongs to the chapter", () => {
    expect(sectionNumber("2.5 Procent", 0, 2)).toBe(5);
  });

  test("falls back to the place in the list", () => {
    expect(sectionNumber("Procent", 4, 2)).toBe(5);
    expect(sectionNumber("3.1 Fel kapitel", 0, 2)).toBe(1);
  });
});
