import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listChapterSections from "./tools/list-chapter-sections";
import getHomework from "./tools/get-homework";
import listLessonPlans from "./tools/list-lesson-plans";
import getLunchMenu from "./tools/get-lunch-menu";
import selfAssessmentSummary from "./tools/self-assessment-summary";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "mattebo-builder",
  title: "Mattebo Builder",
  version: "0.1.0",
  instructions:
    "Read-only tools for Mattebo, a math class site for grades 6–9: chapters and sub-chapters, homework, lesson plans, lunch menu and self-assessment summaries. Everything runs with the signed-in user's own permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listChapterSections, getHomework, listLessonPlans, getLunchMenu, selfAssessmentSummary],
});
