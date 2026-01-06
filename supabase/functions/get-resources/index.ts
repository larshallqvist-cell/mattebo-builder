import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResourceRow {
  grade: number;
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

    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_SHEETS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch data from Google Sheets
    // Assuming data is in first sheet, columns A-E, starting from row 2 (row 1 is header)
    const range = 'A2:E1000';
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    
    console.log(`Fetching from Google Sheets: ${sheetId}`);
    
    const response = await fetch(sheetsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Google Sheets', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const rows = data.values || [];

    console.log(`Fetched ${rows.length} rows from sheet`);

    // Parse rows into structured data
    const resources: ResourceRow[] = rows
      .filter((row: string[]) => row.length >= 5)
      .map((row: string[]) => ({
        grade: parseInt(row[0], 10),
        chapter: parseInt(row[1], 10),
        category: row[2]?.trim() || '',
        title: row[3]?.trim() || '',
        url: row[4]?.trim() || '',
      }))
      .filter((r: ResourceRow) => !isNaN(r.grade) && !isNaN(r.chapter) && r.title && r.url);

    // Filter by grade and chapter if provided
    let filtered = resources;
    
    if (grade) {
      const gradeNum = parseInt(grade, 10);
      filtered = filtered.filter(r => r.grade === gradeNum);
    }
    
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
