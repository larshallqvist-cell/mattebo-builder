# Analys: Mattebo -> Google Sheet (master) -> Google Kalender

Endast analys. Inga filer ändras förrän planen godkänns.

## 1. Var kalenderhändelser hämtas och visas

- `src/hooks/useCalendarEvents.ts`
  - `useCalendarEvents(grade)` anropar edge-funktionen `get-calendar?grade=X` med användarens inloggningstoken, cachar i minnet och sessionStorage.
  - `parseICSData()` tolkar ICS-texten (även återkommande händelser och undantag), `deduplicateCalendarEvents()` tar bort dubbletter (föredrar händelse med sal).
  - Typen `CalendarEvent` har `uid`, `date`, `endDate`, `location`, `description`, `title`.
- Visas i: `LessonCalendar.tsx`, `PostItNote.tsx`, `LessonTimer.tsx`, `ApocalypticGradePage.tsx`, samt adminvyn `LessonPlanEditor.tsx` (via `useAllGradeLessons.ts` för fliken "Per dag").

## 2. "Nästa lektion" (post-it)

- `src/components/PostItNote.tsx`: tar `upcomingEvents[eventIndex]`, slår upp planering med `getLessonPlan(plans, event)` från `useLessonPlans`.
- Innehållsregel: planeringen i databasen vinner, annars kalenderns `description`.
- Tolkning/visning: `parseLessonContent()` i `src/lib/lessonContent.tsx` (rubriker `##`, fetstil, länkar, färger `{röd}...{/}`, avdelare, YouTube-overlay).

## 3. Befintliga skrivvägar

- Tabellen `lesson_plans` (grade, event_uid, starts_at, title, content), bara admin får skriva (RLS).
- `useLessonPlans.savePlan()`: sparar till `lesson_plans`, anropar sedan edge-funktionen `sync-lesson-to-calendar`.
- `supabase/functions/sync-lesson-to-calendar/index.ts`: kräver godkänd användare och adminroll, plockar kalender-ID ur `CALENDAR_URL_GRADE_X`, gör PATCH på Google Calendar-händelsen (summary och description) via Google Calendar-kopplingen, tömmer `calendar_cache`.
- Apps Script `docs/Mattebo_Kalender_2026_2027_v2.gs`: `synkaHelaBladetTillKalender()` och `uppdateraBeskrivningar()` skriver Sheet -> Kalender och fyller i kolumn F (KalenderEventID). Det finns en tidsstyrd körning var 15:e minut sedan v1.7.0.
- `get-resources` läser det andra kalkylbladet (länkar) med `GOOGLE_SHEETS_API_KEY`, bara läsning.
- Ingen kod skriver till master-Sheetet i dag.

## 4. Faktisk datakälla i dag

Privata ICS-länkar från Google Kalender (hemligheter `CALENDAR_URL_GRADE_6..9`), hämtade via `get-calendar` med minnescache och `calendar_cache` (10 min, gammal kopia får användas i upp till 24 h). Sheetet läses aldrig direkt av sajten.

## 5. Stabilt ID i frontend

- `CalendarEvent.uid` = ICS-UID, t.ex. `abc123@google.com`. För återkommande händelser: `abc123@google.com::<RECURRENCE-ID>`.
- `eventIdFromUid()` tar delen före `@`, vilket motsvarar Google Calendar Event ID, alltså samma värde som Apps Script skriver i kolumn F (`event.getId()` returnerar också `...@google.com`).
- Reserv: `starts_at` plus årskurs (används redan via `legacyLessonPlanKey`).

## Konflikt i nuvarande flöde (viktigt)

Mattebo skriver direkt till kalendern, medan Apps Script skriver Sheet kolumn E till kalenderbeskrivningen var 15:e minut. Då kan en ändring gjord i Mattebo skrivas över av det gamla Sheet-innehållet. Det här bör lösas med förändringen nedan.

## 6. Minsta säkra förändring

```text
Mattebo (admin) -> edge-funktion (server, bara admin) -> Sheet rad (Titel/Beskrivning)
                                                      -> Apps Script / direkt PATCH -> Kalender
```

1. Ny edge-funktion `save-lesson-to-sheet` (eller utökning av `sync-lesson-to-calendar`), med samma skydd: `requireApprovedUser` plus adminkontroll.
2. Hitta raden: läs fliken `Åk X` (A:F), matcha kolumn F mot event-ID (jämför med och utan `@google.com`), annars Starttid (Stockholm) plus Titel.
3. Skriv Titel (A) och Beskrivning (E) med `values:batchUpdate` via Google Sheets-kopplingen (servern, aldrig webbläsaren).
4. Direkt därefter PATCH på kalenderhändelsen med samma text (befintlig kod), så eleverna ser ändringen direkt. Apps Script-körningen skriver sedan samma värde, så ingen konflikt uppstår.
5. `lesson_plans` behålls som snabb cache och reserv; om skrivningen till Sheetet misslyckas visas fel i editorn ("Sparat lokalt, ej i Sheet").
6. Frontend: bara `savePlan` i `useLessonPlans.ts` byter funktionsanrop. Ingen ny hemlighet i frontend.

Alternativ utan Sheets-koppling: Apps Script-webbapp (`doPost`) med delad hemlighet, anropad bara från edge-funktionen. Det blir mer underhåll, så jag rekommenderar det inte.

## 7. Behövs från dig

- Länken till master-kalkylbladet (Spreadsheet-ID) och exakta fliknamn (`Åk 6` med eller utan mellanslag).
- Koppla Google Sheets-kopplingen med skrivbehörighet (`spreadsheets`) med det Google-konto som äger bladet. Nuvarande `GOOGLE_SHEETS_API_KEY` är en vanlig nyckel och kan bara läsa.
- Bekräfta att Google Calendar-kopplingen tillhör samma konto som äger årskurskalendrarna (den finns redan).
- Beslut: ska Mattebo få ändra Starttid/Plats också, eller bara Titel och Beskrivning? (Förslag: bara Titel och Beskrivning.)
- Deploy: ny eller uppdaterad edge-funktion plus publicering. Apps Script behöver ingen ändring.
