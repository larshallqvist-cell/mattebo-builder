import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

// The server grades Procent and Ekvationspusslet with copies of these modules.
// Run `node scripts/sync-exercise-libs.mjs` after changing them.
describe("server copies of exercise rules", () => {
  for (const f of ["procent.ts", "ekvationer.ts", "koordinater.ts", "linjen.ts", "sannolikhet.ts", "brak.ts", "algebra.ts", "kistan.ts", "geometrigymmet.ts"]) {
    it(`${f} matches src/lib`, () => {
      expect(readFileSync(`supabase/functions/_shared/exercises/${f}`, "utf8")).toBe(readFileSync(`src/lib/${f}`, "utf8"));
    });
  }
});
