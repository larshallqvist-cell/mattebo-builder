import { describe, expect, test } from "bun:test";
import { hideIntroForever, shouldShowIntro } from "../src/lib/procentIntro";

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
};

describe("instruktionen i Procent", () => {
  test("visas varje gång tills eleven väljer bort den", () => {
    const s = memory();
    expect(shouldShowIntro(s, "elev-1")).toBe(true);
    expect(shouldShowIntro(s, "elev-1")).toBe(true);
  });

  test("är borta permanent när eleven valt bort den", () => {
    const s = memory();
    hideIntroForever(s, "elev-1");
    expect(shouldShowIntro(s, "elev-1")).toBe(false);
    expect(shouldShowIntro(s, "elev-1")).toBe(false);
  });

  test("bortvalet gäller bara den eleven", () => {
    const s = memory();
    hideIntroForever(s, "elev-1");
    expect(shouldShowIntro(s, "elev-2")).toBe(true);
  });
});
