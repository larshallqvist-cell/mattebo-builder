import { describe, expect, test } from "bun:test";
import { checkSimplified, checkValue, generateExercise, linEq, parseExpression, evalLin, MODES } from "../src/lib/algebra";

describe("algebra", () => {
  test("parses fractions, parentheses and implicit multiplication", () => {
    expect(linEq(parseExpression("2(x+3)-x")!, parseExpression("x+6")!)).toBe(true);
    expect(linEq(parseExpression("½x + ¼x")!, parseExpression("3/4x")!)).toBe(true);
    expect(linEq(parseExpression("−2(x − 3) + x")!, parseExpression("-x+6")!)).toBe(true);
  });
  test("unsimplified but equal answers are not accepted as simplified", () => {
    const ex = generateExercise("simplify", 0, () => 0.3);
    expect(checkSimplified(ex, ex.expr).correct).toBe(false);
  });
  test("every generated exercise is self-consistent across modes and levels", () => {
    for (const m of MODES) for (let l = 0; l < 7; l++) for (let k = 0; k < 40; k++) {
      const ex = generateExercise(m.id, l);
      const parsed = parseExpression(ex.expr)!;
      expect(linEq(parsed, ex.simplified)).toBe(true);
      if (m.id !== "simplify") {
        const v = evalLin(ex.simplified, ex.values);
        expect(checkValue(ex, v.d === 1 ? String(v.n) : `${v.n}/${v.d}`).correct).toBe(true);
      }
    }
  });
});
