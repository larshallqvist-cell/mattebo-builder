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
    const startsAtRaw = typeof body?.starts_at === "string" ? body.starts_at : "";
    const startsAt = startsAtRaw && !isNaN(Date.parse(startsAtRaw)) ? new Date(startsAtRaw) : null;
    const originalTitle = typeof body?.original_title === "string" ? body.original_title.slice(0, 300) : "";

    if (!SUPPORTED_GRADES.includes(grade as Grade) || !uid) {
      return json({ error: "Invalid grade or event_uid" }, 400);
    }

    const calendarId = calendarIdForGrade(grade as Grade);
    if (!calendarId) return json({ error: `Calendar not configured for grade ${grade}` }, 400);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const connectorKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!lovableKey || !connectorKey) return json({ error: "Google Calendar connector not configured" }, 500);

    // 1) Master: skriv Titel (A) + Beskrivning (E) till master-kalkylbladet.
    const sheetResult = await writeToMasterSheet(grade as Grade, uid, title.trim(), content, lovableKey, startsAt, originalTitle);
    if (!sheetResult.written) {
      console.error("Master sheet write failed:", sheetResult.error);
      // Kalendern uppdateras inte: Apps Script skulle ändå skriva tillbaka bladets gamla text.
      return json({ ok: false, sheet: sheetResult, calendarSynced: false }, 200);
    }

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
      return json({ ok: false, error: "Google Calendar update failed", status: res.status, details, sheet: sheetResult, calendarSynced: false }, 200);
    }

    // Force a fresh iCal fetch so the app shows the new text immediately.
    await admin.from("calendar_cache").delete().eq("grade", grade);

    return json({ ok: true, sheet: sheetResult, calendarSynced: true });
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
  startsAt: Date | null,
  originalTitle: string,
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
  const colRes = await fetch(
    `${SHEETS_URL}/spreadsheets/${sheetId}/values/${encodeURIComponent(`${quoted}!A:F`)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`,
    { headers },
  );
  if (!colRes.ok) return { written: false, tab, error: `read ${colRes.status}: ${(await colRes.text()).slice(0, 300)}` };
  const rows: unknown[][] = (await colRes.json()).values ?? [];

  // 1) KalenderEventID i F (med eller utan @google.com)
  const target = eventIdFromUid(uid.split("::")[0]).toLowerCase();
  let idx = rows.findIndex((r, i) => i > 0 && r[5] && eventIdFromUid(String(r[5])).toLowerCase() === target);

  // 2) Fallback: starttid (Stockholm, minutprecision) + titel — bara om exakt en träff.
  if (idx < 0 && startsAt) {
    const wanted = stockholmMinuteKey(startsAt);
    const t = originalTitle.trim().toLowerCase();
    const hits = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => i > 0 && cellToStockholmKey(r[1]) === wanted && (!t || String(r[0] ?? "").trim().toLowerCase() === t));
    if (hits.length === 1) idx = hits[0].i;
    else if (hits.length > 1) return { written: false, tab, error: "Flera rader matchar starttid/titel – skriver inte" };
  }
  if (idx < 0) return { written: false, tab, error: "Lektionen hittades inte i bladet (varken KalenderEventID eller starttid+titel)" };
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

/** "YYYY-MM-DD HH:mm" i Europe/Stockholm */
function stockholmMinuteKey(d: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** Bladets starttid: serienummer (lokal tid) eller text "YYYY-MM-DD HH:mm". */
function cellToStockholmKey(v: unknown): string | null {
  if (typeof v === "number") {
    const ms = Math.round((v - 25569) * 86400000); // serienummer tolkat som "väggklocka"
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2})[:.](\d{2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")} ${m[4].padStart(2, "0")}:${m[5]}`;
  }
  return null;
}
