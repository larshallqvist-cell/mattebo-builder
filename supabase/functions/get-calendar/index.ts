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
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

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
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached calendar for grade ${grade}`);
      return new Response(cached.data, {
        headers: { ...corsHeaders, "Content-Type": "text/calendar" },
      });
    }

    // Fetch from Google Calendar (no CORS issues from server)
    console.log(`Fetching fresh calendar for grade ${grade}`);
    const icsUrl = ICS_URLS[grade];
    const response = await fetch(icsUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status}`);
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
