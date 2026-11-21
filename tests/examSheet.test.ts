import { describe, expect, it } from "bun:test";
import { examStudents, parseExamForStudent } from "../supabase/functions/_shared/examSheet";

const input = [
  [],
  ["Åk 6 · Kapitel 1"],
  ["Elev", "Variant", "1", "3 svar", "3 reson.", "Total", "Andel", "Nivå", "P", "B", "M", "R", "K", "Anteckning", "Behöver träna på"],
  ["", "", "M", "B", "R", "24 p", "%", "Förslag"],
  ["Elsa  Segerblom", "A", "1", "1", "0", "18", "75%", "C", "2", "3", "6", "2", "5", "", "Resonemang"],
  ["Utan variant", "", "1"],
];
const facit = [["Uppgift", "Moment", "Max"], ["1", "Addition", "1"], ["3", "Talet närmast 1,5", "2"]];

describe("exam sheet", () => {
  it("lists only rows with a variant", () => {
    expect(examStudents(input)).toEqual(["Elsa  Segerblom"]);
  });
  it("matches name ignoring case and spacing and sums sub-points per task", () => {
    const r = parseExamForStudent("Prov", input, facit, "elsa segerblom")!;
    expect(r.total).toBe("18");
    expect(r.niva).toBe("C");
    expect(r.uppgifter).toEqual([
      { uppgift: "1", moment: "Addition", poang: 1, max: 1 },
      { uppgift: "3", moment: "Talet närmast 1,5", poang: 1, max: 2 },
    ]);
    expect(r.formagor.R).toBe("2");
    expect(r.behover_trana).toBe("Resonemang");
  });
  it("returns null for an unknown student", () => {
    expect(parseExamForStudent("Prov", input, facit, "Någon Annan")).toBeNull();
  });
});
