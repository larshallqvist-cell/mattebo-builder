import { describe, expect, test } from "bun:test";
import { classLabel, groupByClass, isClassGrade, missingClassCount, type RosterStudent } from "../src/lib/studentClasses";

const s = (user_id: string, full_name: string, class_grade: number | null): RosterStudent =>
  ({ user_id, full_name, last_sign_in_at: null, class_grade });

describe("student class roster", () => {
  test("only grades 6-9 count as a class", () => {
    expect(isClassGrade(6)).toBe(true);
    expect(isClassGrade(9)).toBe(true);
    expect(isClassGrade(10)).toBe(false);
    expect(isClassGrade(null)).toBe(false);
    expect(classLabel(null)).toBe("Okänd klass");
    expect(classLabel(7)).toBe("Åk 7");
  });

  test("classes come in order 6-9 and unknown class lands last", () => {
    const groups = groupByClass([
      s("u1", "Elsa", 9),
      s("u2", "Anton", null),
      s("u3", "Bella", 6),
      s("u4", "David", 7),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Åk 6", "Åk 7", "Åk 8", "Åk 9", "Okänd klass"]);
    expect(groups[0].students.map((x) => x.full_name)).toEqual(["Bella"]);
    expect(groups.at(-1)!.students.map((x) => x.full_name)).toEqual(["Anton"]);
  });

  test("students inside a class are alphabetically sorted", () => {
    const groups = groupByClass([
      s("u1", "Wilma", 8),
      s("u2", "Alice", 8),
      s("u3", "Gösta", 8),
    ]);
    expect(groups[2].students.map((x) => x.full_name)).toEqual(["Alice", "Gösta", "Wilma"]);
  });

  test("the unknown-class group is skipped when every student has a class", () => {
    const groups = groupByClass([s("u1", "Elsa", 6), s("u2", "Anton", 7)]);
    expect(groups).toHaveLength(4);
    expect(groups.every((g) => g.students.length > 0 || g.grade !== null)).toBe(true);
  });

  test("missing classes are counted so the admin can fill them in", () => {
    expect(missingClassCount([s("u1", "Elsa", 6), s("u2", "Anton", null), s("u3", "Bella", 9)])).toBe(1);
    expect(missingClassCount([s("u1", "Elsa", 6)])).toBe(0);
  });
});

describe("people who are not students", () => {
  test("parents marked 'Inte elev' get their own group last and are not counted as missing", () => {
    const groups = groupByClass([s("u1", "Elsa", 6), s("u2", "Ann-Sofie", 0), s("u3", "Anton", null)]);
    expect(groups.map((g) => g.label)).toEqual(["Åk 6", "Åk 7", "Åk 8", "Åk 9", "Okänd klass", "Inte elev"]);
    expect(groups.at(-1)!.students.map((x) => x.full_name)).toEqual(["Ann-Sofie"]);
    expect(missingClassCount([s("u2", "Ann-Sofie", 0), s("u3", "Anton", null)])).toBe(1);
    expect(classLabel(0)).toBe("Inte elev");
  });
});
