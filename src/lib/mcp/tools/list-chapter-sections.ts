import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";
import { fail, gradeSchema } from "./shared";

export default defineTool({
  name: "list_chapter_sections",
  title: "Lista kapitel och delkapitel",
  description: "List the chapters and sub-chapters for a grade, including which sub-chapter is currently highlighted.",
  inputSchema: { grade: gradeSchema },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ grade }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("chapter_sections").select("chapter, sections, current_index").eq("grade", grade).order("chapter");
    if (error) return fail(error.message);
    const chapters = (data ?? []).map((r) => ({
      chapter: r.chapter as number,
      sections: (r.sections as string[]) ?? [],
      currentIndex: (r.current_index as number | null) ?? null,
    }));
    const text = chapters.length
      ? chapters.map((c) => `Kapitel ${c.chapter}:\n${c.sections.map((s, i) => `  ${i}. ${s}${i === c.currentIndex ? " (aktuellt)" : ""}`).join("\n")}`).join("\n")
      : "Inga delkapitel för årskursen.";
    return { content: [{ type: "text", text }], structuredContent: { grade, chapters } };
  },
});
