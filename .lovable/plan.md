Prestandaförbättringar för Mattebo-appen

Mål
Göra appen snabbare att ladda, flera årskurssidor att växla mellan, och animationer att rendera — utan att ändra utseende eller funktioner.

Bakgrund: vad som är långsamt idag
- Kalender-ICS-parsning sker i webbläsaren vid varje laddning. Varje gång en användare öppnar Åk 6–9 parsas iCal-strängen, veckonummer räknas och dubbletter slås ihop på nytt.
- Resource-accordion hämtar rå Google Sheets-grid-data (`includeGridData=true`) varje gång och bearbetar 5000 rader i klienten.
- Tung animation: `ChalkDust` skapar nya Framer Motion-partiklar vid varje klick, `CalendarEffects` har 5–12 animerade element per händelse, och `LessonCalendar` skjuter upp 39 animerade partiklar varje gång en vecka vecklas ut.
- Bara tre komponenter är lazy-laddade. Stora bibliotek som `recharts`, `embla-carousel-react` och hela shadcn/ui-biblioteket riskerar att hamna i initiala bundeln.
- `QueryClient` skapas med standardinställningar, ingen global staleTime, vilket ger onödiga nätverksanrop.
- `tailwind.config.lov.json` är 205 kB, vilket kan försämra byggtiden och dev-serverns svarstid.

Plan

1. Flytta kalenderparsningen till backend
   - Edge-funktionen `get-calendar` ska returnera färdig JSON med redan expanderade, deduplicerade och sorterade händelser (istället för rå ICS).
   - Cachen i `public.calendar_cache` sparar redan parsad JSON, så framtida anrop returnerar direkt från cache.
   - Frontend: `useCalendarEvents` tar bort `ICAL.parse`, `expandRecurringEvent` och `deduplicateCalendarEvents` — den får bara visa och filtrera datum.

2. Sätt aggressiv cachning med React Query
   - Konfigurera global `staleTime` och `gcTime` på QueryClient (t.ex. 10 minuter för kalender, 30 minuter för resurser).
   - Dela kalenderdata mellan sidorna via `queryKey` så att Åk 6–9 inte hämtar separat mer än nödvändigt.
   - `useCalendarEvents` ersätts med `useQuery`.

3. Tunna ut animationerna
   - `ChalkDust`: minska antalet partiklar från 8 till 4 per klick, och använd ren CSS-animation istället för Framer Motion där det går.
   - `CalendarEffects`: begränsa antalet rörliga element (`fire` 8→4, `smoke` 5→3, `stars` 12→6, `sparkle` 8→4) och föredra CSS keyframes.
   - `LessonCalendar.SparkleExplosion`: minska 25+8+6 till 12+4+3, och stäng av helt på enheter med `prefers-reduced-motion`.

4. Lazy-ladda mer
   - Lägg `Calculator`, `WebRadio`, `LessonTimer`, `LunchMenu`, `CalendarEffects` och stora shadcn-komponenter (`sidebar`, `chart`, `menubar`) bakom `React.lazy()` och `Suspense`.
   - Dela upp routes med `React.lazy()` i `App.tsx` så att startsidan inte laddar allt.

5. Memoera och undvik onödiga omberäkningar
   - `LessonCalendar`: `weekGroups` och `defaultOpenWeek` redan memoiserade, men accordion-items och `CalendarEffect` ska wrappas med `React.memo` för att inte renderas om när inget ändras.
   - `PostItNote`, `ResourceAccordion` och `ApocalypticGradePage` granskas och memoeras där det behövs.

6. Optimera resurshämtningen
   - `get-resources` kan minska sitt område beroende på vilket kapitel som efterfrågas, eller spara en förenklad tabellcache (`includeGridData=false` är tyvärr nödvändig för hyperlänkar, så vi cachar istället).
   - Lägg till en 10-minuters backend-cache för resurser i Supabase eller i funktionsminnet.
   - Möjligtvis indexera rader i kalkylbladet så att endast aktuellt kapitel hämtas.

7. Mät innan och efter
   - Kör en build och kontrollera att den fortfarande går igenom.
   - Använd Chrome DevTools Performance-flik och Lighthouse för att jämföra TTI, LCP och JS-executionstid.
   - Mät edge-funktionernas svarstid med `curl`/Supabase-loggar.

Uteslutningar
- Ingen ändring av visuell design eller UX.
- Ingen borttagning av funktioner (bara färre partiklar och snabbare data).
- Ingen ändring av Google-kalendrarna eller kalkylbladets format.

Tekniska detaljer
- Backend: Deno + `ical.js`, JSON-svar istället för `text/calendar`.
- Frontend: `React.lazy`, `React.memo`, `useQuery` från `@tanstack/react-query`, preferens för CSS keyframes över Framer Motion-partiklar.
- Cache: `staleTime`/`gcTime` på QueryClient; backend-cache i `public.calendar_cache` och eventuellt en ny `public.resource_cache`.

Ordning
1. Backend-kalender: JSON-svar + cache.
2. Frontend: React Query + förenklad `useCalendarEvents`.
3. Animationer: minska partiklar och byt till CSS.
4. Lazy loading av stora komponenter/routes.
5. Memoization och resurscache.
6. Mätning och justering.
