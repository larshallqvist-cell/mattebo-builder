# Lektionsanteckningar – "tankar efter lektionen"

## Så fungerar det

**Under lektionen (klassidan)**
- En liten anteckningsknapp (blocksymbol) i sidhuvudet, bredvid enkätlampan. Bara du som admin ser den.
- Klick öppnar en ruta ovanpå klassidan med ett stort tomt textfält. Rubriken visar vilken lektion anteckningen hör till, t.ex. "Åk 8 · tors 1 okt 10:15".
- Den hör automatiskt till lektionen som pågår just nu. Finns ingen pågående, väljs den senast avslutade lektionen idag (så du kan skriva efteråt).
- Texten sparas automatiskt medan du skriver (ingen spara-knapp att glömma). En liten "Sparat"-text bekräftar.
- Knappen får en liten prick när lektionen redan har en anteckning.

**När du planerar (Admin, både "Per klass" och "Per dag")**
- Ovanför textrutan i editorn visas en ruta **"Tankar från förra lektionen"** med anteckningen från föregående lektion i samma klass, inklusive datum.
- Finns ingen anteckning syns "Inga anteckningar från förra lektionen".
- Den lektion du planerar har också en egen liten anteckningsdel, så du kan läsa/komplettera anteckningar för vilken lektion som helst.

**Integritet**
- Anteckningarna är bara dina: elever ser dem aldrig, och de skickas inte till kalkylbladet eller Google Kalender.

## Teknisk beskrivning
- Ny tabell `lesson_notes` (grade, event_uid, starts_at, content, created_at, updated_at), unik på (grade, event_uid). GRANT till authenticated/service_role, RLS: endast admin (has_role) får läsa/skriva. updated_at-trigger.
- Ny hook `useLessonNotes(grade)` (läs, upsert med debounce ~800 ms).
- Ny komponent `LessonNotesButton` + dialog i `ApocalypticNav`/mobilraden i `ApocalypticGradePage`, renderas bara när `isAdmin`. Aktuell lektion tas från `useCalendarEvents(grade)` (pågående, annars senast avslutade idag).
- `LessonEditorPane` i `LessonPlanEditor.tsx`: hitta föregående event i samma årskurs (sorterat på starttid) och visa dess anteckning skrivskyddat; plus redigerbart notisfält för vald lektion. Ingen ändring i sync-lesson-to-calendar.
- Versionsbump vid publicering.
