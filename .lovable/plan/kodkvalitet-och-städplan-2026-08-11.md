# Kodkvalitet och städplan

## Ärlig bedömning

Koden är **funktionell men patchwork-byggd**, inte genomtänkt från början. Det märks tydligt att appen har växt fram via många små, snabba iterationer (chatten och snabbfixar) snarare än en övergripande arkitektur.

### Starka sidor
- Kalender-edge-funktionen (`get-calendar`) har medveten design: retry, backoff, cache, stale-fallback.
- Auth-gate och rollhantering är på plats med `requireApprovedUser`.
- Tungfunktioner som resurser, kalender och maskot laddas lazy via `React.lazy`/`Suspense`.
- Filerna är överlag rimligt stora och namngivningen är tydlig.

### Svaga sidor (ad-hoc-spår)
- **40+ komponenter i en platt mapp**, ingen domänindelning (calendar/, resources/, auth/).
- **Död kod**: `GradePage.tsx` och `GradeCard.tsx` importeras inte längre, troligen kvar sedan redesign.
- **Hårdkodade värden duplicerade**: standard-Sheet-ID `1UzIhln8...` står både i `SheetConfig.tsx` och `ResourceAccordion.tsx`. Samma åk 6-9-konfig upprepas på flera ställen.
- **Edge-funktion `get-resources`**: 12 st `console.log` kvar i produktionskod, och URL-extraktionen är en lång kedja av fallbacks byggd för specifika formatobservationer.
- **Inga tester alls** trots komplex logik (ical-recurrence, Sheets-parsning, formatdetektion).
- **React Query** är installerat och en `QueryClient` skapas, men används inte för kalender/resurser — istället handrullas cache i `useCalendarEvents` och `ResourceAccordion`.
- **Magiska tal överallt**: `A2:F5000`, `800 * Math.pow(2, i)`, `21 * 24 * 60 * 60 * 1000`, `maxOccurrences = 200`, `slice(0, 50)` — inga namngivna konstanter.
- **Animationer/particles** i `LessonCalendar.tsx`, `ChalkDust.tsx`, `SparkParticles.tsx` m.m. kör Framer Motion per partikel med glow/filter; kan vara tungt på Chromebooks (vilkär en explicit målgrupp).

Sammanfattning: det är en typisk Lovable-byggd app där säkerhet och kalender-resiliens har hårdats efterhand, men struktur, konfiguration, testning och städning har inte fått samma pass.

## Plan för uppstädning

### Fas 1 — Struktur och död kod (1-2 timmars arbete)
1. Skapa `src/config/app.ts` med centrala konstanter: årskurser, färger, Sheet-ID, kapitelnamn.
2. Ersätt hårdkodade grade-maps i `ApocalypticGradePage.tsx`, `ChapterSelector.tsx`, `get-calendar/index.ts` m.m. med konfigen.
3. Ta bort `GradePage.tsx` och `GradeCard.tsx` (död kod).
4. Dra ut `SheetConfig`- och `ResourceAccordion`-Sheet-ID till samma konstant.
5. Städa bort `console.log` från `get-resources/index.ts` och ersätt med strukturerad logging eller tyst felrapportering.

### Fas 2 — Delad datahantering (2-3 timmars arbete)
1. Inför `@tanstack/react-query` på riktigt för kalender och resurser, så vi slipper handrullad cache och får deduplicering, bakgrundsuppdatering och tydlig invalidation.
2. Dra ut kalenderhämtningen från `useCalendarEvents` till en query-hook (`useCalendarQuery`).
3. Dra ut resurshämtningen från `ResourceAccordion` till en query-hook (`useResourcesQuery`).
4. Sätt upp ett gemensamt `@/types`-paket för ResourceRow/ResourceLink så klient och edge-funktion pratar samma språk.

### Fas 3 — Prestanda och robusthet (2-3 timmars arbete)
1. Flytta ICS-parsning/recurrence-expansion från main thread till en Web Worker, eller cacha åtminstone *parsade* resultat i `sessionStorage` så inte hela flödet parsas om vid varje grade-byte.
2. Lägg till `prefers-reduced-motion`-stöd och begränsa partikelantal/effekter på svagare enheter.
3. Kapsla in de tre nästan identiska layoutblocken i `ApocalypticGradePage.tsx` i en enda responsiv komponent.
4. Återställ ESLint-regeln `no-unused-vars` och städa upp efter den.

### Fas 4 — Tester och dokumentation (3-4 timmars arbete)
1. Lägg till Vitest.
2. Skriv enhetstester för `get-resources` formatdetektion och URL-extraktion (de är komplexa och formatkänsliga).
3. Skriv tester för `useCalendarEvents`-parsning och recurrence-expansion.
4. Dokumentera det implicita kontraktet för `effect:keyword` i kalenderbeskrivningar och kapitel-mappningen.

## Föreslaget startläge
Börja med **Fas 1** — det ger mest "bang for the buck" (färre hårdkodade värden, mindre förvirring, borttagen död kod) utan att riskera att förstöra fungerande flöden. Därefter kan vi ta Fas 2 när kalendrarna och resurserna är stabila igen.

## Fråga till dig
Vill du köra hela uppstädningsplanen, eller begränsa oss till Fas 1 + 2 först? Och ska jag samtidigt ta bort `recharts` och andra uppenbart döda dependencies om de inte används?
