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
    
    // Use spreadsheets.get with includeGridData to get hyperlink metadata from rich links
    // This is necessary because Google Sheets rich links (Ctrl+K style) don't appear in valueRenderOption=FORMULA
    // Extended to column E in case URLs are in a 5th column
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&ranges=${encodeURIComponent(`${tabName}!A2:E1000`)}&includeGridData=true`;
    
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
    
    // Extract rows from the grid data structure
    const sheet = data.sheets?.[0];
    const gridData = sheet?.data?.[0];
    const rowData = gridData?.rowData || [];
    
    // Convert grid data to simple row arrays with hyperlink info
    interface CellInfo {
      value: string;
      hyperlink?: string;
    }
    
    // Helper to extract YouTube URL from various formats (video ID, short URL, smart chip text)
    const extractYouTubeUrl = (text: string): string => {
      if (!text) return '';
      // Already a full URL
      if (text.startsWith('http')) return text;
      // YouTube video ID pattern (11 characters, alphanumeric + dash/underscore)
      const videoIdMatch = text.match(/^[a-zA-Z0-9_-]{11}$/);
      if (videoIdMatch) {
        return `https://www.youtube.com/watch?v=${text}`;
      }
      // Pattern like "youtu.be/VIDEO_ID" or embedded in text
      const shortUrlMatch = text.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (shortUrlMatch) {
        return `https://www.youtube.com/watch?v=${shortUrlMatch[1]}`;
      }
      // Pattern "youtube.com/watch?v=VIDEO_ID" embedded in text
      const fullUrlMatch = text.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (fullUrlMatch) {
        return `https://www.youtube.com/watch?v=${fullUrlMatch[1]}`;
      }
      return '';
    };
    
    const rows: CellInfo[][] = rowData.map((row: { values?: Array<{ formattedValue?: string; hyperlink?: string; userEnteredValue?: { formulaValue?: string; stringValue?: string } }> }) => {
      const cells = row.values || [];
      return cells.map((cell) => {
        const value = cell.formattedValue || '';
        // Check for hyperlink in cell metadata (rich links)
        const hyperlink = cell.hyperlink || '';
        // Also check for HYPERLINK formula
        const formula = cell.userEnteredValue?.formulaValue || '';
        const formulaMatch = formula.match(/^=HYPERLINK\s*\(\s*"([^"]+)"/i);
        const urlFromFormula = formulaMatch ? formulaMatch[1] : '';
        // Check stringValue for raw URL that might not be formatted as hyperlink
        const stringValue = cell.userEnteredValue?.stringValue || '';
        const urlFromString = stringValue.startsWith('http') ? stringValue : extractYouTubeUrl(stringValue);
        
        return {
          value,
          hyperlink: hyperlink || urlFromFormula || urlFromString || extractYouTubeUrl(value)
        };
      });
    });

    console.log(`Fetched ${rows.length} rows from tab ${tabName}`);
    
    // DEBUG: Log first 5 rows to understand structure, including all columns
    if (rows.length > 0) {
      console.log('DEBUG - First 5 rows (full):', JSON.stringify(rows.slice(0, 5)));
    }

    // Helper to extract chapter number from title like "G 1.1 ...", "Z 1.1 ...", or "1.1 ..."
    const extractChapterFromTitle = (title: string): number => {
      // Match patterns like "G 1.1", "Z 1.1", "1.1", "G 2.3", etc.
      const match = title.match(/(?:[A-Z]\s*)?(\d+)\.\d+/i);
      if (match) {
        return parseInt(match[1], 10);
      }
      return NaN;
    };

    // Detect sheet format based on first row
    // Format A (Åk6): [Title with chapter, URL] - 2 columns
    // Format B (Åk7-9): [Chapter number, Category, Title, URL] - 4 columns
    const firstRow = rows[0] || [];
    const firstCellValue = firstRow[0]?.value || '';
    const firstCellIsNumber = !isNaN(parseInt(firstCellValue, 10)) && firstCellValue.length <= 2;
    
    console.log(`Detected format: ${firstCellIsNumber ? 'B (Chapter|Category|Title|URL)' : 'A (Title|URL)'}`);

    let resources: ResourceRow[];

    if (firstCellIsNumber) {
      // Format B: Chapter | Category | Länktext (title) | URL (hyperlink in cell C or D)
      resources = rows
        .filter((row: CellInfo[]) => row.length >= 3)
        .map((row: CellInfo[]) => {
          const chapter = parseInt(row[0]?.value || '', 10);
          const category = (row[1]?.value || '').trim() || 'Övrigt';
          const cellC = row[2];
          const cellD = row[3];
          const cellE = row[4]; // Check column E as well
          
          // Try to get URL from columns D, E, then fall back to column C
          let url = '';
          let title = '';
          
          // Check column E for URL (hyperlink or plain text URL)
          if (cellE) {
            url = cellE.hyperlink || (cellE.value?.startsWith('http') ? cellE.value : '');
          }
          
          // Check column D for URL (hyperlink or plain text URL)
          if (!url && cellD) {
            url = cellD.hyperlink || (cellD.value?.startsWith('http') ? cellD.value : '');
          }
          
          // If no URL in column D/E, check column C for hyperlink
          if (!url && cellC?.hyperlink) {
            url = cellC.hyperlink;
          }
          
          // If still no URL, check if column C's value itself is a URL
          if (!url && cellC?.value?.startsWith('http')) {
            url = cellC.value;
          }
          
          // Title comes from column C's display value, or use URL as title if value is empty
          title = (cellC?.value || '').trim();
          if (!title && url) {
            // If title is empty but we have a URL, use a generic title
            title = 'Länk';
          }
          
          return { chapter, category, title, url };
        })
        .filter((r: ResourceRow) => !isNaN(r.chapter) && r.title && r.url && r.url.startsWith('http'));
      
      // DEBUG: Log categories found and sample of resources without URLs
      const categoriesFound = [...new Set(resources.map(r => r.category))];
      console.log(`DEBUG - Categories found: ${JSON.stringify(categoriesFound)}`);
      console.log(`DEBUG - Valid resources found: ${resources.length} out of ${rows.length} rows`);
      
      // DEBUG: Log rows that were filtered out due to missing URLs (first 5)
      const filteredOut = rows
        .filter((row: CellInfo[]) => row.length >= 3)
        .map((row: CellInfo[]) => {
          const chapter = parseInt(row[0]?.value || '', 10);
          const category = (row[1]?.value || '').trim() || 'Övrigt';
          const cellC = row[2];
          const cellD = row[3];
          const cellE = row[4];
          let url = '';
          if (cellE) {
            url = cellE.hyperlink || (cellE.value?.startsWith('http') ? cellE.value : '');
          }
          if (!url && cellD) {
            url = cellD.hyperlink || (cellD.value?.startsWith('http') ? cellD.value : '');
          }
          if (!url && cellC?.hyperlink) {
            url = cellC.hyperlink;
          }
          return { 
            chapter, 
            category, 
            title: cellC?.value || '', 
            url, 
            cellCHyperlink: cellC?.hyperlink || '',
            cellDValue: cellD?.value || '',
            cellDHyperlink: cellD?.hyperlink || '',
            cellEValue: cellE?.value || '',
            cellEHyperlink: cellE?.hyperlink || ''
          };
        })
        .filter(r => !r.url && r.category === 'Videolektioner');
      
      if (filteredOut.length > 0) {
        console.log(`DEBUG - Videolektioner rows missing URLs (first 5): ${JSON.stringify(filteredOut.slice(0, 5))}`);
      }
    } else {
      // Format A: Title (with chapter embedded) | URL
      resources = rows
        .filter((row: CellInfo[]) => row.length >= 2)
        .map((row: CellInfo[]) => {
          const title = (row[0]?.value || '').trim();
          const cellB = row[1];
          const url = cellB?.hyperlink || (cellB?.value?.startsWith('http') ? cellB.value : '');
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
