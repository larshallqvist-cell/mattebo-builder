import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateResponse, GatewayError } from "npm:@lovable.dev/ai-gateway";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = Record<string, unknown>;
/** Correct rate per mode/level (plus error kinds), so the model sees patterns instead of raw rows. */
function perModeLevel(rows: Row[]) {
  const g: Record<string, { n: number; ok: number; errors: Record<string, number> }> = {};
  for (const r of rows) {
    const k = `${r.mode} nivå ${r.level}`;
    g[k] ??= { n: 0, ok: 0, errors: {} };
    g[k].n++;
    if (r.is_correct) g[k].ok++;
    else if (r.error_kind) g[k].errors[String(r.error_kind)] = (g[k].errors[String(r.error_kind)] ?? 0) + 1;
  }
  return Object.entries(g).map(([k, v]) => ({ del: k, forsok: v.n, ratt_procent: Math.round((100 * v.ok) / v.n), feltyper: v.errors }));
}

const SYSTEM = `Du är en erfaren speciallärare i matematik på högstadiet i Sverige (Lgr22).
Du får pseudonymiserad data om EN elev: övningsresultat från Mattebos digitala övningar, elevens självskattningar
(skala: 1 = "Nja kanske med lite hjälp", 2 = "Ja, jag är ganska säker", 3 = "Jag känner mig helt säker"),
veckoenkäter (1–5) och eventuellt provresultat inklistrade av läraren.
Skriv på svenska i markdown med exakt dessa rubriker:
## Sammanfattning
## Styrkor
## Utvecklingsområden
## Självbild jämfört med resultat
## Förslag på träning (2–4 konkreta punkter, gärna med Mattebo-övningar: Tabelltest, Algebra, Procent, Bråkträning, Ekvationspusslet, Koordinater, Räta linjen, Kistan, Sannolikhetslabbet)
## Att ta upp med eleven
Var konkret och kortfattad. Dra inga slutsatser som datan inte stöder; säg när underlaget är för litet.
Skriv aldrig diagnoser eller värderande omdömen om personen.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const { data: claims } = await anon.auth.getClaims(auth.slice(7));
  const callerId = claims?.claims?.sub as string | undefined;
  if (!callerId) return json({ error: "Unauthorized" }, 401);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: role } = await db.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
  if (!role) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  const examText = String(body.examText ?? "").slice(0, 4000);
  if (!UUID_RE.test(userId)) return json({ error: "Invalid student" }, 400);

  const q = (t: string, cols: string) => db.from(t).select(cols).eq("user_id", userId).limit(2000);
  const [prof, alg, pro, brak, ekv, koo, lin, tab, kis, san, sa, sv] = await Promise.all([
    db.from("profiles").select("class_grade").eq("id", userId).maybeSingle(),
    q("algebra_attempts", "mode,level,is_correct"),
    q("procent_attempts", "mode,level,is_correct"),
    q("brak_attempts", "mode,level,is_correct,unsimplified"),
    q("ekvation_attempts", "mode,level,is_correct,error_kind,hint_used"),
    q("koordinat_attempts", "mode,level,is_correct,error_kind"),
    q("linje_attempts", "mode,level,is_correct,error_kind"),
    q("tabelltest_results", "score,total,avg_time_ms,passed,input_mode,created_at"),
    q("kistan_progress", "level_id,stars"),
    q("sannolikhet_progress", "level_id,stars,best_correct"),
    q("self_assessment_responses", "grade,chapter,section_index,questions,ratings,updated_at"),
    db.from("survey_responses").select("q_learning,q_effort,q_calm,q_teacher,learned_text,wish_text,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
  ]);

  const data = {
    arskurs: prof.data?.class_grade ?? null,
    algebra: perModeLevel((alg.data ?? []) as Row[]),
    procent: perModeLevel((pro.data ?? []) as Row[]),
    brak: perModeLevel((brak.data ?? []) as Row[]),
    ekvationspusslet: perModeLevel(((ekv.data ?? []) as Row[]).map((r) => ({ ...r, mode: "ekvation" }))),
    koordinater: perModeLevel((koo.data ?? []) as Row[]),
    rata_linjen: perModeLevel((lin.data ?? []) as Row[]),
    tabelltest: ((tab.data ?? []) as Row[]).slice(-10),
    kistan_klarade_nivaer: (kis.data ?? []).map((r: Row) => `${r.level_id}:${r.stars}★`),
    sannolikhet_klarade_nivaer: (san.data ?? []).map((r: Row) => `${r.level_id}:${r.stars}★`),
    sjalvskattning: (sa.data ?? []).map((r: Row) => ({
      delkapitel: `${r.chapter}.${Number(r.section_index) + 1}`,
      svar: (r.questions as string[]).map((fr, i) => `${fr} → ${(r.ratings as number[])[i] ?? "-"}`),
    })),
    veckoenkater: sv.data ?? [],
  };

  try {
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: SYSTEM,
      input: `Elevdata (JSON):\n${JSON.stringify(data)}\n\nProvresultat från läraren:\n${examText || "(inga inklistrade)"}`,
    });
    const text = (res.output ?? [])
      .flatMap((o: { type: string; content?: { type: string; text?: string }[] }) => (o.type === "message" ? o.content ?? [] : []))
      .filter((c) => c.type === "output_text")
      .map((c) => c.text ?? "")
      .join("\n");
    return json({ analysis: text });
  } catch (e) {
    if (e instanceof GatewayError) {
      console.error("gateway", e.code, e.httpStatus);
      const status = e.httpStatus === 429 ? 429 : e.httpStatus === 402 ? 402 : 502;
      return json({ error: e.code }, status);
    }
    console.error(e);
    return json({ error: "failed" }, 500);
  }
});
