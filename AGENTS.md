# Project architecture rules

- Cache quota-limited Google Sheets reads in the server-only `google_sheet_cache` table; frontend clients must never access this cache or connector credentials.
- The private Bråklabbet lives in a separate owner-only app outside this codebase; reach it only as an external link through the `PRIVATE_BRAKLABBET_URL` constant, never embed it or copy its code, so its own access rules stay in charge.