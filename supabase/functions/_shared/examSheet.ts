/**
 * Parses the teacher's exam result template ("Resultatinmatning" + "Uppgifter och facit")
 * and picks one student's row by full name. Pure so it can be tested with bun.
 */
export type ExamTask = { uppgift: string; moment: string; poang: number; max: number | null };
export type ExamResult = {
  prov: string;
  variant: string;
  total: string;
  andel: string;
  niva: string;
  formagor: Record<string, string>;
  uppgifter: ExamTask[];
  behover_trana: string;
  anteckning: string;
};

export const normalizeName = (s: string) =>
  s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

const FIXED = new Set(["total", "andel", "nivå", "p", "b", "m", "r", "k", "anteckning"]);
const num = (v: string | undefined) => {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
};

/** Student names listed in the input tab (rows below the "Elev" header with a variant). */
export function examStudents(input: string[][]): string[] {
  const h = input.findIndex((r) => (r[0] ?? "").trim() === "Elev");
  if (h < 0) return [];
  return input.slice(h + 2).filter((r) => (r[0] ?? "").trim() && (r[1] ?? "").trim()).map((r) => r[0].trim());
}

export function parseExamForStudent(title: string, input: string[][], facit: string[][], fullName: string): ExamResult | null {
  const h = input.findIndex((r) => (r[0] ?? "").trim() === "Elev");
  if (h < 0) return null;
  const header = input[h].map((c) => (c ?? "").trim());
  const want = normalizeName(fullName);
  const row = input.slice(h + 2).find((r) => normalizeName(r[0] ?? "") === want && (r[1] ?? "").trim());
  if (!row) return null;
  const col = (name: string) => header.findIndex((c) => c.toLowerCase() === name);
  const at = (i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");

  const fh = facit.findIndex((r) => (r[0] ?? "").trim() === "Uppgift");
  const facitMap = new Map<string, { moment: string; max: number | null }>();
  if (fh >= 0) for (const r of facit.slice(fh + 1)) {
    if ((r[0] ?? "").trim()) facitMap.set(r[0].trim(), { moment: (r[1] ?? "").trim(), max: num(r[2]) });
  }

  const totalIdx = col("total");
  const tasks = new Map<string, number>();
  for (let i = 2; i < (totalIdx > 0 ? totalIdx : header.length); i++) {
    const label = header[i];
    if (!label || FIXED.has(label.toLowerCase())) continue;
    const p = num(row[i]);
    if (p === null || (row[i] ?? "").trim() === "") continue;
    const id = label.split(" ")[0];
    tasks.set(id, (tasks.get(id) ?? 0) + p);
  }
  const uppgifter = [...tasks].map(([id, poang]) => {
    const f = facitMap.get(id) ?? facitMap.get(id.replace(/[a-z]$/, ""));
    return { uppgift: id, moment: f?.moment ?? "", poang, max: facitMap.get(id)?.max ?? null };
  });
  const formagor: Record<string, string> = {};
  for (const f of ["P", "B", "M", "R", "K"]) {
    const i = header.indexOf(f, totalIdx > 0 ? totalIdx : 0);
    if (i >= 0 && at(i)) formagor[f] = at(i);
  }
  const startsWith = (p: string) => header.findIndex((c) => c.toLowerCase().startsWith(p));
  return {
    prov: title,
    variant: at(1),
    total: at(totalIdx),
    andel: at(col("andel")),
    niva: at(col("nivå")),
    formagor,
    uppgifter,
    behover_trana: at(startsWith("behöver träna")).slice(0, 800),
    anteckning: at(col("anteckning")).slice(0, 500),
  };
}
