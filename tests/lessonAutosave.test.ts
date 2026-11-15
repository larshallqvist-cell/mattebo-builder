import { describe, expect, test } from "bun:test";
import { AUTOSAVE_DELAY_MS, DRAFT_BACKUP_MAX_AGE_MS, pickRestoredDraft } from "../src/lib/lessonAutosave";

const now = Date.parse("2026-11-15T17:30:00Z");
const current = { content: "Sparad text", title: "Bråk" };

describe("Autosave av lektionsplanering", () => {
  test("sparar tre sekunder efter senaste tangenttryckning", () => {
    expect(AUTOSAVE_DELAY_MS).toBe(3000);
  });

  test("osparad lokal text återställs när den skiljer sig", () => {
    expect(pickRestoredDraft({ content: "Ny osparad text", title: "Bråk", savedAt: now - 60_000 }, current, now)).toEqual({
      content: "Ny osparad text",
      title: "Bråk",
    });
  });

  test("lokal kopia som är likadan återställs inte", () => {
    expect(pickRestoredDraft({ ...current, savedAt: now - 60_000 }, current, now)).toBeNull();
  });

  test("lokal kopia äldre än 14 dagar ignoreras", () => {
    expect(DRAFT_BACKUP_MAX_AGE_MS).toBe(14 * 24 * 60 * 60 * 1000);
    expect(pickRestoredDraft({ content: "Gammal", title: "", savedAt: now - DRAFT_BACKUP_MAX_AGE_MS - 1 }, current, now)).toBeNull();
  });
});
