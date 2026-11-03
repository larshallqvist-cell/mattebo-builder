import { z } from "zod";

export const gradeSchema = z.number().int().min(6).max(9).describe("Årskurs (6–9).");
export const chapterSchema = z.number().int().min(1).max(5).describe("Kapitel (1–5).");

export const fail = (text: string) => ({ content: [{ type: "text" as const, text }], isError: true });
