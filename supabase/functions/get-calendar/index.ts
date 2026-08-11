import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireApprovedUser } from "../_shared/auth.ts";
import {
  CALENDAR_CACHE_TTL_MS,
  CALENDAR_ENV_URL_KEYS,
  CALENDAR_STALE_TTL_MS,
  DEFAULT_GRADE,
  FETCH_RETRY_ATTEMPTS,
  FETCH_RETRY_BASE_MS,
  FETCH_RETRY_MULTIPLIER,
  SUPPORTED_GRADES,
  type Grade,
} from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ICS URLs per grade - loaded from environment variables for security
const getCalendarUrls = (): Record<Grade, string> => {
  const urls = {} as Record<Grade, string>;
  for (const grade of SUPPORTED_GRADES) {
    urls[grade] = Deno.env.get(CALENDAR_ENV_URL_KEYS[grade]) || "";
  }
  return urls;
};

// Simple in-memory cache
const cache: Record<number, { data: string; timestamp: number }> {};

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

async function fetchWithRetry(rawUrl: string): Promise<Response> {
  let last: Response | null = null;
  for (const url of urlVariants(rawUrl)) {
    for (let i = 0; i < FETCH_RETRY_ATTEMPTS; i++) {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MatteboCalendar/1.0)" } });
      if (res.ok) return res;
      last = res;
      // Only retry on rate limit / transient server errors
      if (res.status !== 429 && res.status < 500) {
        await res.body?.cancel();
        break;
      }
      await res.body?.cancel();
      await sleep(FETCH_RETRY_BASE_MS * Math.pow(FETCH_RETRY_MULTIPLIER, i));
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
    const grade = gradeParam ? parseInt(gradeParam, 10) : DEFAULT_GRADE;

    const ICS_URLS = getCalendarUrls();
    const icsUrl = ICS_URLS[grade as Grade];

    if (!icsUrl) {
      console.error(`Calendar URL not configured for grade ${grade}`);
      return new Response(
        JSON.stringify({ error: "Invalid grade or calendar not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache (in-memory first, then persistent DB cache)
    let cached = cache[grade] ?? null;
    if (!cached || Date.now() - cached.timestamp >= CALENDAR_CACHE_TTL_MS) {
      const dbCached = await readDbCache(grade);
      if (dbCached && (!cached || dbCached.timestamp > cached.timestamp)) {
        cached = dbCached;
        cache[grade] = dbCached;
      }
    }
    if (cached && Date.now() - cached.timestamp < CALENDAR_CACHE_TTL_MS) {
      return new Response(cached.data, {
        headers: { ...corsHeaders, "Content-Type": "text/calendar" },
      });
    }

    // Fetch from Google Calendar (no CORS issues from server)
    const response = await fetchWithRetry(icsUrl!);

    if (!response.ok) {
      console.error(`Upstream calendar fetch failed: ${response.status}`);
      // Serve stale cache rather than breaking the page
      if (cached) {
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
