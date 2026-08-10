import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireApprovedUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ICS URLs per grade - loaded from environment variables for security
const getCalendarUrls = (): Record<number, string> => {
  return {
    6: Deno.env.get('CALENDAR_URL_GRADE_6') || '',
    7: Deno.env.get('CALENDAR_URL_GRADE_7') || '',
    8: Deno.env.get('CALENDAR_URL_GRADE_8') || '',
    9: Deno.env.get('CALENDAR_URL_GRADE_9') || '',
  };
};

// Simple in-memory cache
const cache: Record<number, { data: string; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const STALE_TTL = 24 * 60 * 60 * 1000; // serve stale up to 24h if upstream fails

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

async function readDbCache(grade: number): Promise<{ data: string; timestamp: number } | null> {
  const { data, error } = await admin
    .from("calendar_cache")
    .select("ics_data, fetched_at")
    .eq("grade", grade)
    .maybeSingle();
  if (error || !data) return null;
  return { data: data.ics_data as string, timestamp: new Date(data.fetched_at as string).getTime() };
}

async function writeDbCache(grade: number, ics: string) {
  const { error } = await admin
    .from("calendar_cache")
    .upsert({ grade, ics_data: ics, fetched_at: new Date().toISOString() }, { onConflict: "grade" });
  if (error) console.error("Failed to persist calendar cache:", error.message);
}

function urlVariants(url: string): string[] {
  const variants = new Set<string>([url]);
  // Google Calendar ICS comes in two shapes; try both if one 404s
  if (url.includes("/public/basic.ics")) variants.add(url.replace("/public/basic.ics", "/basic.ics"));
  else if (url.endsWith("/basic.ics")) variants.add(url.replace(/\/basic\.ics$/, "/public/basic.ics"));
  if (url.includes("calendar.google.com/calendar/ical/")) {
    variants.add(url.replace("/calendar/ical/", "/calendar/u/0/ical/"));
  }
  return [...variants];
}

async function fetchWithRetry(rawUrl: string, attempts = 3): Promise<Response> {
  let last: Response | null = null;
  for (const url of urlVariants(rawUrl)) {
    for (let i = 0; i < attempts; i++) {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MatteboCalendar/1.0)" } });
      if (res.ok) return res;
      last = res;
      // Only retry on rate limit / transient server errors
      if (res.status !== 429 && res.status < 500) {
        await res.body?.cancel();
        break;
      }
      await res.body?.cancel();
      await sleep(800 * Math.pow(2, i));
    }
  }
  return last!;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireApprovedUser(req, corsHeaders);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const gradeParam = url.searchParams.get("grade");
    const grade = gradeParam ? parseInt(gradeParam, 10) : 9;

    const ICS_URLS = getCalendarUrls();
    const icsUrl = ICS_URLS[grade];

    if (!icsUrl) {
      console.error(`Calendar URL not configured for grade ${grade}`);
      return new Response(
        JSON.stringify({ error: "Invalid grade or calendar not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache (in-memory first, then persistent DB cache)
    let cached = cache[grade] ?? null;
    if (!cached || Date.now() - cached.timestamp >= CACHE_TTL) {
      const dbCached = await readDbCache(grade);
      if (dbCached && (!cached || dbCached.timestamp > cached.timestamp)) {
        cached = dbCached;
        cache[grade] = dbCached;
      }
    }
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached calendar for grade ${grade}`);
      return new Response(cached.data, {
        headers: { ...corsHeaders, "Content-Type": "text/calendar" },
      });
    }

    // Fetch from Google Calendar (no CORS issues from server)
    console.log(`Fetching fresh calendar for grade ${grade}`);
    const response = await fetchWithRetry(icsUrl!);

    if (!response.ok) {
      console.error(`Upstream calendar fetch failed: ${response.status}`);
      // Serve stale cache rather than breaking the page
      if (cached) {
        console.log(`Serving stale calendar for grade ${grade}`);
        return new Response(cached.data, {
          headers: { ...corsHeaders, "Content-Type": "text/calendar", "X-Cache": "stale" },
        });
      }
      return new Response(
        JSON.stringify({ error: "Calendar temporarily unavailable", status: response.status }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const icsData = await response.text();

    // Update caches
    cache[grade] = { data: icsData, timestamp: Date.now() };
    await writeDbCache(grade, icsData);

    return new Response(icsData, {
      headers: { ...corsHeaders, "Content-Type": "text/calendar" },
    });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch calendar" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
