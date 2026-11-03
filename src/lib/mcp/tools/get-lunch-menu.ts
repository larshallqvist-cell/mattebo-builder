import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { fail } from "./shared";

export default defineTool({
  name: "get_lunch_menu",
  title: "Visa matsedel",
  description: "Show the school lunch menu for the coming days.",
  inputSchema: {
    days: z.number().int().min(1).max(14).optional().describe("How many days ahead (default 5)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("lunch_menu").select("date, menu_text").gte("date", today).order("date").limit(days ?? 5);
    if (error) return fail(error.message);
    const menu = (data ?? []).map((m) => ({ date: m.date, menu: m.menu_text }));
    const text = menu.length ? menu.map((m) => `${m.date}: ${m.menu}`).join("\n") : "Ingen matsedel inlagd.";
    return { content: [{ type: "text", text }], structuredContent: { menu } };
  },
});
