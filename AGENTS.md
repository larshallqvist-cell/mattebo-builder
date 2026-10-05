# Project architecture rules

- Cache quota-limited Google Sheets reads in the server-only `google_sheet_cache` table; frontend clients must never access this cache or connector credentials.