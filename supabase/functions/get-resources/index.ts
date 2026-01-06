import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResourceRow {
  chapter: number;
  category: string;
  title: string;
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const grade = url.searchParams.get('grade');
    const chapter = url.searchParams.get('chapter');
    const sheetId = url.searchParams.get('sheetId');

    if (!sheetId) {
      console.error('Missing sheetId parameter');
      return new Response(
        JSON.stringify({ error: 'sheetId parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!grade) {
      console.error('Missing grade parameter');
      return new Response(
        JSON.stringify({ error: 'grade parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_SHEETS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use grade-specific tab: Åk6, Åk7, Åk8, Åk9
    // Columns: A=Kapitel, B=Kategori, C=Länktext, D=URL
    const tabName = `Åk${grade}`;
    const range = `${tabName}!A2:D1000`;
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    
    console.log(`Fetching from Google Sheets: ${sheetId}, tab: ${tabName}`);
    
    const response = await fetch(sheetsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      
      // Check if it's a tab not found error
      if (response.status === 400 && errorText.includes('Unable to parse range')) {
        return new Response(
          JSON.stringify({ error: `Fliken "${tabName}" hittades inte i kalkylbladet`, resources: {} }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const rows = data.values || [];

    console.log(`Fetched ${rows.length} rows from tab ${tabName}`);

    // Parse rows into structured data (4 columns: Kapitel, Kategori, Länktext, URL)
    const resources: ResourceRow[] = rows
      .filter((row: string[]) => row.length >= 4)
      .map((row: string[]) => ({
        chapter: parseInt(row[0], 10),
        category: row[1]?.trim() || '',
        title: row[2]?.trim() || '',
        url: row[3]?.trim() || '',
      }))
      .filter((r: ResourceRow) => !isNaN(r.chapter) && r.title && r.url);

    // Filter by chapter if provided
    let filtered = resources;
    
    if (chapter) {
      const chapterNum = parseInt(chapter, 10);
      filtered = filtered.filter(r => r.chapter === chapterNum);
    }

    console.log(`Returning ${filtered.length} filtered resources`);

    // Group by category
    const grouped: Record<string, { title: string; url: string }[]> = {};
    for (const r of filtered) {
      if (!grouped[r.category]) {
        grouped[r.category] = [];
      }
      grouped[r.category].push({ title: r.title, url: r.url });
    }

    return new Response(
      JSON.stringify({ resources: grouped }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-resources function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
