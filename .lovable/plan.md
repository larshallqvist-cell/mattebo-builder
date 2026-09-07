# Dagsplanering — planera en hel dag i taget

Planeringssektionen på Admin får två flikar: **Per klass** (dagens funktion, oförändrad) och **Per dag** (ny).

## Så fungerar "Per dag"

- Överst en dagrad: pil vänster / datum (t.ex. "Måndag 8 september") / pil höger, plus en **Idag**-knapp.
- Under datumraden listas alla lektioner den dagen från alla årskurser (6, 7, 8, 9), sorterade på starttid. Varje rad visar tid, "Åk X", sal och en prick om planering redan finns.
- Klick på en lektion öppnar samma editor som idag till höger (rubrik, Fet/Rubrik/Punkt/Länk, textruta, förhandsvisning, Spara). Spara skriver till rätt årskurs och synkas till Google Kalender precis som nu.
- Är dagen tom visas "Inga lektioner den här dagen".
- Fungerar bakåt i tiden också, så du kan stega tillbaka till gårdagen.

## Teknisk beskrivning

- `LessonPlanEditor.tsx` delas upp: editordelen (rubrik, verktygsrad, textruta, förhandsvisning, spara) bryts ut till en intern `LessonEditorPane` som tar `grade`, `event` och en `savePlan`-funktion, så både klass- och dagsvyn använder samma kod utan dubblering.
- Ny `useAllGradeCalendars()`-hook (eller anrop av `useCalendarEvents` per årskurs i en liten wrapper-komponent för att respektera hook-regler) som slår ihop events från alla `SUPPORTED_GRADES` och taggar varje event med sin `grade`.
- Motsvarande `useLessonPlans(grade)` anropas för varje årskurs; dagsvyn slår upp plan/titel via befintliga `getLessonPlan` / `getLessonTitle` och sparar via den valda årskursens `savePlan`.
- Dagsfiltrering sker på lokal tid (Europe/Stockholm) mellan 00:00 och 23:59 för valt datum; datumet hålls i lokal state och stegas ±1 dag.
- Flikväxlingen görs med befintliga shadcn `Tabs` inuti den ihopfällbara "Planering"-sektionen; vald flik sparas i `localStorage` så iPad kommer tillbaka till samma läge.
- Ingen databas- eller RLS-ändring behövs; `lesson_plans` används som idag.
