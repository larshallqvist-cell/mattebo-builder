import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MatteboCalendar/1.0)" } });
    if (res.ok) return res;
    last = res;
    // Only retry on rate limit / transient server errors
    if (res.status !== 429 && res.status < 500) break;
    await res.body?.cancel();
    await sleep(500 * Math.pow(2, i));
  }
  return last!;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Check cache
    const cached = cache[grade];
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
      if (cached && Date.now() - cached.timestamp < STALE_TTL) {
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

    // Update cache
    cache[grade] = { data: icsData, timestamp: Date.now() };

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
