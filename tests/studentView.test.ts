import { describe, expect, test } from "bun:test";
import { effectiveIsAdmin, studentViewEnabled } from "../src/lib/studentView";

describe("elevvy", () => {
  test("elevvy gäller bara en riktig lärare och bara när den är påslagen", () => {
    expect(studentViewEnabled(true, "1")).toBe(true);
    expect(studentViewEnabled(true, null)).toBe(false);
    expect(studentViewEnabled(true, "0")).toBe(false);
    // A stale flag on a shared device must never make a student into a teacher.
    expect(studentViewEnabled(false, "1")).toBe(false);
  });

  test("i elevvy ser läraren sidan som en elev", () => {
    expect(effectiveIsAdmin(true, true)).toBe(false);
    expect(effectiveIsAdmin(true, false)).toBe(true);
    expect(effectiveIsAdmin(false, false)).toBe(false);
  });
});
