import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireApprovedUser } from "../_shared/auth.ts";
import { CALENDAR_ENV_URL_KEYS, SUPPORTED_GRADES, type Grade } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

/** The calendar ID lives inside the private iCal URL: /calendar/ical/<id>/private-.../basic.ics */
function calendarIdForGrade(grade: Grade): string | null {
  const url = Deno.env.get(CALENDAR_ENV_URL_KEYS[grade]) || "";
  const m = url.match(/\/calendar\/(?:u\/\d+\/)?ical\/([^/]+)\//);
  return m ? decodeURIComponent(m[1]) : null;
}

/** iCal UIDs from Google look like "<eventId>@google.com". */
function eventIdFromUid(uid: string): string {
  return uid.split("@")[0].trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireApprovedUser(req, corsHeaders);
    if (auth.error) return auth.error;

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.userId!)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => null);
    const grade = Number(body?.grade);
    const uid = typeof body?.event_uid === "string" ? body.event_uid : "";
    const title = typeof body?.title === "string" ? body.title.slice(0, 300) : "";
    const content = typeof body?.content === "string" ? body.content.slice(0, 4000) : "";

    if (!SUPPORTED_GRADES.includes(grade as Grade) || !uid) {
      return json({ error: "Invalid grade or event_uid" }, 400);
    }

    const calendarId = calendarIdForGrade(grade as Grade);
    if (!calendarId) return json({ error: `Calendar not configured for grade ${grade}` }, 400);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const connectorKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!lovableKey || !connectorKey) return json({ error: "Google Calendar connector not configured" }, 500);

    // 1) Master: skriv Titel (A) + Beskrivning (E) till master-kalkylbladet.
    const sheetResult = await writeToMasterSheet(grade as Grade, uid, title.trim(), content, lovableKey);
    if (sheetResult.error) console.error("Master sheet write:", sheetResult.error);

    const patch: Record<string, string> = { description: content };
    if (title.trim()) patch.summary = title.trim();

    const res = await fetch(
      `${GATEWAY_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventIdFromUid(uid))}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": connectorKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      },
    );

    if (!res.ok) {
      const details = await res.text();
      console.error(`Calendar patch failed [${res.status}]: ${details}`);
      return json({ error: "Google Calendar update failed", status: res.status, details, sheet: sheetResult }, res.status);
    }

    // Force a fresh iCal fetch so the app shows the new text immediately.
    await admin.from("calendar_cache").delete().eq("grade", grade);

    return json({ ok: true, sheet: sheetResult });
  } catch (error) {
    console.error("sync-lesson-to-calendar error:", error);
    return json({ error: String(error) }, 500);
  }
});

const SHEETS_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

type SheetResult = { written: boolean; row?: number; tab?: string; error?: string };

async function writeToMasterSheet(
  grade: Grade,
  uid: string,
  title: string,
  content: string,
  lovableKey: string,
): Promise<SheetResult> {
  const sheetId = Deno.env.get("MASTER_LESSON_SHEET_ID");
  const sheetsKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
  if (!sheetId) return { written: false, error: "MASTER_LESSON_SHEET_ID not configured" };
  if (!sheetsKey) return { written: false, error: "Google Sheets connector not configured" };
  const headers = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };

  const metaRes = await fetch(`${SHEETS_URL}/spreadsheets/${sheetId}?fields=sheets.properties.title`, { headers });
  if (!metaRes.ok) return { written: false, error: `meta ${metaRes.status}: ${(await metaRes.text()).slice(0, 300)}` };
  const meta = await metaRes.json();
  const tab: string | undefined = (meta.sheets ?? [])
    .map((s: { properties: { title: string } }) => s.properties.title)
    .find((t: string) => new RegExp(`^\\s*åk\\s*${grade}\\s*$`, "i").test(t));
  if (!tab) return { written: false, error: `Tab for grade ${grade} not found` };

  const quoted = `'${tab.replace(/'/g, "''")}'`;
  const colRes = await fetch(`${SHEETS_URL}/spreadsheets/${sheetId}/values/${encodeURIComponent(`${quoted}!F:F`)}`, { headers });
  if (!colRes.ok) return { written: false, tab, error: `read ${colRes.status}: ${(await colRes.text()).slice(0, 300)}` };
  const col: string[][] = (await colRes.json()).values ?? [];

  const target = eventIdFromUid(uid.split("::")[0]);
  const idx = col.findIndex((r, i) => i > 0 && r[0] && eventIdFromUid(String(r[0])) === target);
  if (idx < 0) return { written: false, tab, error: "Event ID not found in column F" };
  const row = idx + 1;

  const data = [{ range: `${quoted}!E${row}`, values: [[content]] }];
  if (title) data.push({ range: `${quoted}!A${row}`, values: [[title]] });
  const upd = await fetch(`${SHEETS_URL}/spreadsheets/${sheetId}/values:batchUpdate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ valueInputOption: "RAW", data }),
  });
  if (!upd.ok) return { written: false, tab, row, error: `write ${upd.status}: ${(await upd.text()).slice(0, 300)}` };
  return { written: true, tab, row };
}
