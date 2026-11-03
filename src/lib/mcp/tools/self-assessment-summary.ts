import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { SCALE, defaultQuestions, resolveQuestions, summarize } from "../../selfAssessment";
import { chapterSchema, fail, gradeSchema } from "./shared";

export default defineTool({
  name: "self_assessment_summary",
  title: "Sammanfatta självskattning",
  description: "Summarize self-assessment answers per question for one sub-chapter. Teachers see the class; students see only their own answers.",
  inputSchema: {
    grade: gradeSchema,
    chapter: chapterSchema,
    sectionIndex: z.number().int().min(0).max(30).describe("Sub-chapter index (0 = first), see list_chapter_sections."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ grade, chapter, sectionIndex }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const db = supabaseForUser(ctx);
    const [q, r] = await Promise.all([
      db.from("self_assessment_questions").select("questions")
        .eq("grade", grade).eq("chapter", chapter).eq("section_index", sectionIndex).maybeSingle(),
      db.from("self_assessment_responses").select("questions, ratings")
        .eq("grade", grade).eq("chapter", chapter).eq("section_index", sectionIndex).limit(500),
    ]);
    if (q.error) return fail(q.error.message);
    if (r.error) return fail(r.error.message);
    const questions = resolveQuestions(q.data?.questions, defaultQuestions(grade, chapter, sectionIndex));
    const summary = summarize(questions, (r.data ?? []).map((x) => ({ questions: x.questions, ratings: x.ratings })));
    const rows = summary.map((s) => ({
      question: s.question,
      answered: s.answered,
      counts: SCALE.map((l, i) => ({ label: l.label, count: s.counts[i] })),
    }));
    const text = rows.length
      ? `${r.data?.length ?? 0} svar\n` + rows.map((s) => `${s.question}\n  ${s.counts.map((c) => `${c.label}: ${c.count}`).join(" · ")}`).join("\n")
      : "Inga frågor för delkapitlet.";
    return { content: [{ type: "text", text }], structuredContent: { responses: r.data?.length ?? 0, questions: rows } };
  },
});
