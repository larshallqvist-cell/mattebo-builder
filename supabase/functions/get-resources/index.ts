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

    // Validate sheetId parameter - must be present and match Google Sheet ID format
    if (!sheetId) {
      console.error('Missing sheetId parameter');
      return new Response(
        JSON.stringify({ error: 'sheetId parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Google Sheet IDs are typically 44 characters, but can vary between 20-100 characters
    // They contain only alphanumeric characters, hyphens, and underscores
    const sheetIdPattern = /^[a-zA-Z0-9-_]{20,100}$/;
    if (!sheetIdPattern.test(sheetId)) {
      console.error('Invalid sheetId format');
      return new Response(
        JSON.stringify({ error: 'Invalid sheetId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate grade parameter - must be present and one of the valid grades
    if (!grade) {
      console.error('Missing grade parameter');
      return new Response(
        JSON.stringify({ error: 'grade parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validGrades = ['6', '7', '8', '9'];
    if (!validGrades.includes(grade)) {
      console.error('Invalid grade parameter:', grade);
      return new Response(
        JSON.stringify({ error: 'Invalid grade parameter. Must be 6, 7, 8, or 9' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate chapter parameter if provided - must be a positive integer within reasonable range
    if (chapter) {
      const chapterNum = parseInt(chapter, 10);
      if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 50) {
        console.error('Invalid chapter parameter:', chapter);
        return new Response(
          JSON.stringify({ error: 'Invalid chapter parameter. Must be a number between 1 and 50' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
    // Grade is already validated to be one of ['6', '7', '8', '9']
    const tabName = `Åk${grade}`;
    const range = `${tabName}!A2:D1000`;
    
    // Use valueRenderOption=FORMULA to get hyperlink formulas, which contain the actual URLs
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}&valueRenderOption=FORMULA`;
    
    console.log(`Fetching from Google Sheets: ${sheetId}, tab: ${tabName}`);
    
    const response = await fetch(sheetsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      // Log detailed error server-side only
      console.error('Google Sheets API error:', response.status, errorText);
      
      // Check if it's a tab not found error - return user-friendly message
      if (response.status === 400 && errorText.includes('Unable to parse range')) {
        return new Response(
          JSON.stringify({ error: `Fliken "${tabName}" hittades inte i kalkylbladet`, resources: {} }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return generic error without exposing internal details
      return new Response(
        JSON.stringify({ error: 'Kunde inte hämta resurser. Försök igen senare.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const rows = data.values || [];

    // Helper function to extract URL from HYPERLINK formula or return raw value
    // HYPERLINK format: =HYPERLINK("url","displayText") or just plain text/URL
    const extractUrl = (cellValue: unknown): string => {
      // Handle non-string values (numbers, null, undefined)
      if (cellValue === null || cellValue === undefined) return '';
      
      // Convert to string if it's not already
      const strValue = typeof cellValue === 'string' ? cellValue : String(cellValue);
      if (!strValue) return '';
      
      // Check if it's a HYPERLINK formula
      const hyperlinkMatch = strValue.match(/^=HYPERLINK\s*\(\s*"([^"]+)"/i);
      if (hyperlinkMatch) {
        return hyperlinkMatch[1];
      }
      
      // Return the raw value (could be a plain URL or text)
      return strValue.trim();
    };

    console.log(`Fetched ${rows.length} rows from tab ${tabName}`);
    
    // DEBUG: Log first 3 rows to understand structure
    if (rows.length > 0) {
      console.log('DEBUG - First 3 rows:', JSON.stringify(rows.slice(0, 3)));
    }

    // Helper to extract chapter number from title like "G 1.1 ..." or "1.1 ..."
    const extractChapterFromTitle = (title: string): number => {
      // Match patterns like "G 1.1", "1.1", "G 2.3", etc.
      const match = title.match(/(?:G\s*)?(\d+)\.\d+/i);
      if (match) {
        return parseInt(match[1], 10);
      }
      return NaN;
    };

    // Detect sheet format based on first row
    // Format A (Åk6): [Title with chapter, URL] - 2 columns
    // Format B (Åk7-9): [Chapter number, Category, Title, URL] - 4 columns
    const firstRow = rows[0] || [];
    const firstCellIsNumber = !isNaN(parseInt(String(firstRow[0] || ''), 10)) && 
                               String(firstRow[0] || '').length <= 2;
    
    console.log(`Detected format: ${firstCellIsNumber ? 'B (Chapter|Category|Title|URL)' : 'A (Title|URL)'}`);

    let resources: ResourceRow[];

    if (firstCellIsNumber) {
      // Format B: Chapter | Category | Title | URL (or hyperlink in Title)
      resources = rows
        .filter((row: unknown[]) => row.length >= 3)
        .map((row: unknown[]) => {
          const chapter = parseInt(String(row[0] || ''), 10);
          const category = String(row[1] || '').trim() || 'Övrigt';
          const title = String(row[2] || '').trim();
          // URL could be in column D, or column C might be a hyperlink
          const url = row.length >= 4 ? extractUrl(row[3]) : extractUrl(row[2]);
          return { chapter, category, title, url };
        })
        .filter((r: ResourceRow) => !isNaN(r.chapter) && r.title && r.url && r.url.startsWith('http'));
    } else {
      // Format A: Title (with chapter embedded) | URL
      resources = rows
        .filter((row: unknown[]) => row.length >= 2)
        .map((row: unknown[]) => {
          const title = String(row[0] || '').trim();
          const url = extractUrl(row[1]);
          const chapter = extractChapterFromTitle(title);
          const category = 'Videolektioner';
          return { chapter, category, title, url };
        })
        .filter((r: ResourceRow) => !isNaN(r.chapter) && r.title && r.url && r.url.startsWith('http'));
    }

    console.log(`Parsed ${resources.length} valid resources`);

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
    // Log detailed error server-side only
    console.error('Error in get-resources function:', error);
    // Return generic error without exposing internal details
    return new Response(
      JSON.stringify({ error: 'Ett fel uppstod. Försök igen senare.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
