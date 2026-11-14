// Copies the pure exercise rule modules into the edge-function bundle so the
// server generates and grades exactly like the page. tests/exerciseLibsCopy.test.ts fails on drift.
import { copyFileSync } from "node:fs";
for (const f of ["procent.ts", "ekvationer.ts"]) {
  copyFileSync(new URL(`../src/lib/${f}`, import.meta.url), new URL(`../supabase/functions/_shared/exercises/${f}`, import.meta.url));
  console.log("copied", f);
}
