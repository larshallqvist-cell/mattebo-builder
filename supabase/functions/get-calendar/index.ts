import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ICS URLs per grade
const ICS_URLS: Record<number, string> = {
  6: "https://calendar.google.com/calendar/ical/0f524015b333a62614ee79bfffa842b02ba01f68ac67a3d8691b4391abc6af1e%40group.calendar.google.com/private-2888a415c500bbb3bf6c96a255c48b82/basic.ics",
  7: "https://calendar.google.com/calendar/ical/d4f5bcba13265c8b896d83349278dddd9415bae5ed132e28a0103682d92e9e17%40group.calendar.google.com/private-86942205e370b95b069d0b24dec6f766/basic.ics",
  8: "https://calendar.google.com/calendar/ical/cbab979826818c72a03dbe3429daa2f509bcdc1ec4954dfc5f3b685e0b550871%40group.calendar.google.com/private-f9e4b06417fa4b09dcf8a6d659aaf436/basic.ics",
  9: "https://calendar.google.com/calendar/ical/bac560a2da180a78f3ff69fd77ebaa580ef750833d374e2bcc184f4ac4b1c0ec%40group.calendar.google.com/private-ffebdd7af80a58ffc03de299343e1b41/basic.ics",
};

// Simple in-memory cache
const cache: Record<number, { data: string; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const gradeParam = url.searchParams.get("grade");
    const grade = gradeParam ? parseInt(gradeParam, 10) : 9;

    if (!ICS_URLS[grade]) {
      return new Response(
        JSON.stringify({ error: "Invalid grade" }),
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
