import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SCALE } from "@/lib/selfAssessment";
import { CLASS_GRADES, NOT_STUDENT } from "@/lib/studentClasses";
import {
  classOverview, latestPerSection, levelOf, mergeDist, distribution, percent, sectionOverview, studentOverview,
  type Dist, type GoalRow,
} from "@/lib/selfAssessmentGoals";
import { cn } from "@/lib/utils";

const CHAPTERS = [1, 2, 3, 4, 5];
const LEVEL_COLOR = ["var(--survey-bad)", "var(--survey-mid)", "var(--survey-good)"];
const SELECT = "user_id, grade, chapter, section_index, ratings, updated_at";

type SectionMap = Map<string, string[]>; // "grade-chapter" -> sub-chapter names

const sectionName = (map: SectionMap, grade: number, chapter: number, index: number) =>
  map.get(`${grade}-${chapter}`)?.[index] ?? `${chapter}.${index + 1}`;

const loadSections = async (): Promise<SectionMap> => {
  const { data } = await supabase.from("chapter_sections").select("grade, chapter, sections");
  return new Map((data ?? []).map((r) => [`${r.grade}-${r.chapter}`, r.sections ?? []]));
};

/** Horizontal stacked bar: red-ish = med hjälp, yellow = ganska säker, green = helt säker. */
export const GoalBar = ({ dist, label, sub, thin }: { dist: Dist; label: string; sub?: string; thin?: boolean }) => (
  <div className="grid grid-cols-[minmax(0,9rem)_1fr_3.25rem] items-center gap-2 sm:grid-cols-[minmax(0,13rem)_1fr_3.5rem]">
    <div className="min-w-0">
      <p className="truncate text-sm text-foreground" title={label}>{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
    <div
      className={cn("flex overflow-hidden rounded-full bg-muted/40", thin ? "h-3" : "h-5")}
      role="img"
      aria-label={`${label}: ${SCALE.map((s) => `${s.label} ${dist.counts[s.value - 1]}`).join(", ")}`}
    >
      {dist.total > 0 &&
        dist.counts.map((n, i) =>
          n > 0 ? (
            <div
              key={i}
              className="flex h-full items-center justify-center text-[10px] font-semibold text-background"
              style={{ width: `${(n / dist.total) * 100}%`, background: `hsl(${LEVEL_COLOR[i]})` }}
              title={`${SCALE[i].label}: ${n}`}
            >
              {!thin && n / dist.total >= 0.12 ? n : ""}
            </div>
          ) : null,
        )}
    </div>
    <span className="text-right text-sm font-semibold tabular-nums text-foreground">{dist.total ? percent(dist.secure) : "–"}</span>
  </div>
);

const Legend = () => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
    {SCALE.map((s, i) => (
      <span key={s.value} className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${LEVEL_COLOR[i]})` }} />
        {s.label}
      </span>
    ))}
    <span>Siffran till höger = andel svar ”ganska säker” eller ”helt säker”.</span>
  </div>
);

const Dot = ({ dist, title }: { dist: Dist | null; title: string }) => {
  const level = levelOf(dist?.mean ?? null);
  return (
    <span
      className={cn("h-3.5 w-3.5 shrink-0 rounded-full", level === 0 && "border border-border bg-transparent")}
      style={level ? { background: `hsl(${LEVEL_COLOR[level - 1]})` } : undefined}
      title={dist ? `${title}: ${percent(dist.secure)} säkra (${dist.total} svar)` : `${title}: inte svarat`}
    />
  );
};

/** Admin: goal attainment per class, per sub-chapter and per student, from the self-assessments. */
export default function SelfAssessmentGoals() {
  const [rows, setRows] = useState<GoalRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [classOf, setClassOf] = useState<Map<string, number | null>>(new Map());
  const [sections, setSections] = useState<SectionMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [grade, setGrade] = useState<number>(6);
  const [chapter, setChapter] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [resp, dir, people, secs] = await Promise.all([
        supabase.from("self_assessment_responses").select(SELECT),
        supabase.rpc("admin_student_directory"),
        supabase.from("profiles").select("id, class_grade"),
        loadSections(),
      ]);
      if (!alive) return;
      if (resp.error || dir.error || people.error) { setError(true); setLoading(false); return; }
      const cls = new Map((people.data ?? []).map((p) => [p.id, p.class_grade ?? null]));
      setClassOf(cls);
      setNames(new Map(((dir.data ?? []) as { user_id: string; full_name: string }[]).map((s) => [s.user_id, s.full_name])));
      setRows(((resp.data ?? []) as GoalRow[]).filter((r) => cls.get(r.user_id) !== NOT_STUDENT));
      setSections(secs);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // Default to the class chapter with the most recent answer.
  const activeChapter = useMemo(() => {
    if (chapter !== null) return chapter;
    const latest = latestPerSection(rows).filter((r) => r.grade === grade)
      .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0];
    return latest?.chapter ?? 1;
  }, [chapter, rows, grade]);

  const sectionList = sections.get(`${grade}-${activeChapter}`) ?? [];
  const answeredMax = Math.max(0, ...rows.filter((r) => r.grade === grade && r.chapter === activeChapter).map((r) => r.section_index + 1));
  const count = Math.max(sectionList.length, answeredMax);

  const classes = useMemo(() => classOverview(rows, CLASS_GRADES), [rows]);
  const perSection = useMemo(() => sectionOverview(rows, grade, activeChapter, count), [rows, grade, activeChapter, count]);
  const perStudent = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, g] of classOf) if (g === grade) ids.add(id);
    for (const r of rows) if (r.grade === grade && r.chapter === activeChapter) ids.add(r.user_id);
    const list = studentOverview(rows, grade, activeChapter, count, [...ids]);
    return list.sort((a, b) => (names.get(a.user_id) ?? "~").localeCompare(names.get(b.user_id) ?? "~", "sv"));
  }, [rows, classOf, names, grade, activeChapter, count]);

  const pill = (active: boolean) => cn("rounded-full border px-3 py-1 text-sm", active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-primary/15");

  if (loading) return <p className="p-5 text-sm text-muted-foreground">Hämtar självskattningar…</p>;
  if (error) return <p role="alert" className="p-5 text-sm text-destructive">Kunde inte hämta självskattningarna.</p>;

  const answered = perStudent.filter((s) => s.total.total > 0).length;
  const notAnswered = perStudent.filter((s) => s.total.total === 0 && names.has(s.user_id)).map((s) => names.get(s.user_id)!);

  return (
    <div className="space-y-6 p-5 font-manrope">
      <Legend />

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Per klass – alla kapitel</h4>
        {classes.map((c) => (
          <button key={c.grade} type="button" className={cn("block w-full rounded-lg px-1 py-0.5 text-left hover:bg-primary/10", c.grade === grade && "bg-primary/10")}
            onClick={() => { setGrade(c.grade); setChapter(null); }}>
            <GoalBar dist={c.dist} label={`Åk ${c.grade}`} sub={`${c.students} elever · ${c.dist.total} svar`} />
          </button>
        ))}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {CLASS_GRADES.map((g) => <button key={g} className={pill(g === grade)} onClick={() => { setGrade(g); setChapter(null); }}>Åk {g}</button>)}
        <span className="mx-1" />
        {CHAPTERS.map((c) => <button key={c} className={pill(c === activeChapter)} onClick={() => setChapter(c)}>Kap {c}</button>)}
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Åk {grade}, kapitel {activeChapter} – per delkapitel</h4>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">Kapitlet har inga delkapitel än.</p>
        ) : (
          perSection.map((s) => (
            <GoalBar key={s.index} dist={s.dist} label={sectionName(sections, grade, activeChapter, s.index)} sub={`${s.students} elever`} />
          ))
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">
          Åk {grade}, kapitel {activeChapter} – per elev <span className="font-normal text-muted-foreground">({answered} av {perStudent.length} har svarat)</span>
        </h4>
        {answered === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen i klassen har svarat på det här kapitlet än.</p>
        ) : (
          <div className="space-y-1.5">
            {perStudent.filter((s) => s.total.total > 0).map((s) => (
              <div key={s.user_id} className="space-y-1 border-b border-border/50 pb-1.5">
                <GoalBar thin dist={s.total} label={names.get(s.user_id) ?? "Okänd elev"} />
                <div className="flex flex-wrap gap-1 pl-1" aria-label="Per delkapitel">
                  {s.sections.map((d, i) => <Dot key={i} dist={d} title={sectionName(sections, grade, activeChapter, i)} />)}
                </div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">Prickarna = delkapitlen i ordning; håll muspekaren över en prick för detaljer. Tom ring = inte svarat.</p>
          </div>
        )}
        {notAnswered.length > 0 && (
          <p className="text-xs text-muted-foreground"><span className="font-semibold">Inte svarat:</span> {notAnswered.join(", ")}</p>
        )}
      </section>
    </div>
  );
}

/** Elevkort: one student's goal attainment, grouped per class page and chapter. */
export function StudentGoals({ userId }: { userId: string }) {
  const [rows, setRows] = useState<GoalRow[] | null>(null);
  const [sections, setSections] = useState<SectionMap>(new Map());

  useEffect(() => {
    let alive = true;
    setRows(null);
    (async () => {
      const [resp, secs] = await Promise.all([
        supabase.from("self_assessment_responses").select(SELECT).eq("user_id", userId),
        loadSections(),
      ]);
      if (!alive) return;
      setRows(latestPerSection((resp.data ?? []) as GoalRow[]).filter((r) => distribution(r.ratings).total > 0));
      setSections(secs);
    })();
    return () => { alive = false; };
  }, [userId]);

  if (rows === null) return <p className="text-sm text-muted-foreground">Hämtar självskattningar…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Inga självskattningar inlämnade.</p>;

  const groups = [...new Set(rows.map((r) => `${r.grade}-${r.chapter}`))].sort().map((key) => {
    const [g, c] = key.split("-").map(Number);
    return { grade: g, chapter: c, items: rows.filter((r) => r.grade === g && r.chapter === c).sort((a, b) => a.section_index - b.section_index) };
  });

  return (
    <div className="space-y-4">
      <Legend />
      {groups.map((grp) => (
        <div key={`${grp.grade}-${grp.chapter}`} className="space-y-1.5">
          <GoalBar dist={mergeDist(grp.items.map((r) => distribution(r.ratings)))} label={`Åk ${grp.grade}, kapitel ${grp.chapter}`} sub="hela kapitlet" />
          <div className="space-y-1 pl-3">
            {grp.items.map((r) => (
              <GoalBar key={r.section_index} thin dist={distribution(r.ratings)} label={sectionName(sections, grp.grade, grp.chapter, r.section_index)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
