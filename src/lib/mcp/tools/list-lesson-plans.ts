import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { fail, gradeSchema } from "./shared";

export default defineTool({
  name: "list_lesson_plans",
  title: "Lista lektionsplaneringar",
  description: "List upcoming lesson plans for a grade, starting from a date (default today).",
  inputSchema: {
    grade: gradeSchema,
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date YYYY-MM-DD (default today)."),
    limit: z.number().int().min(1).max(50).optional().describe("Max number of lessons (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ grade, from, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const start = from ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("lesson_plans").select("id, title, content, starts_at")
      .eq("grade", grade).gte("starts_at", start).order("starts_at").limit(limit ?? 10);
    if (error) return fail(error.message);
    const lessons = (data ?? []).map((l) => ({ id: l.id, title: l.title, content: l.content, startsAt: l.starts_at }));
    const text = lessons.length
      ? lessons.map((l) => `${l.startsAt.slice(0, 16).replace("T", " ")} – ${l.title}${l.content ? `\n  ${l.content}` : ""}`).join("\n")
      : "Inga planerade lektioner.";
    return { content: [{ type: "text", text }], structuredContent: { lessons } };
  },
});
