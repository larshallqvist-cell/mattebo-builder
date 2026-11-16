import { describe, expect, test } from "bun:test";
import { withTouchControls } from "../src/lib/presentationControls";

describe("withTouchControls", () => {
  test("adds close and next buttons before </body>", () => {
    const out = withTouchControls("<html><body><p>Bild</p></body></html>");
    expect(out).toContain('aria-label="Stäng presentationen"');
    expect(out).toContain('aria-label="Nästa bild"');
    expect(out.indexOf("Nästa bild")).toBeLessThan(out.indexOf("</body>"));
  });

  test("is added only once", () => {
    const once = withTouchControls("<body></body>");
    expect(withTouchControls(once)).toBe(once);
  });

  test("works on html without a body tag", () => {
    expect(withTouchControls("<p>x</p>")).toContain("Nästa bild");
  });
});
