import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";
import { fail, gradeSchema } from "./shared";

export default defineTool({
  name: "get_homework",
  title: "Visa läxa",
  description: "Show the current homework posted for a grade.",
  inputSchema: { grade: gradeSchema },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ grade }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("homework").select("title, content, updated_at").eq("grade", grade).maybeSingle();
    if (error) return fail(error.message);
    if (!data) return { content: [{ type: "text", text: "Ingen läxa just nu." }], structuredContent: { homework: null } };
    const homework = { title: data.title, content: data.content, updatedAt: data.updated_at };
    return { content: [{ type: "text", text: `${homework.title}\n${homework.content}` }], structuredContent: { homework } };
  },
});
