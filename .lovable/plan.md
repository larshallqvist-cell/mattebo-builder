# Förhandsgranskning av elevens enkätvy

Läraren ska kunna se exakt hur elevenkätens dialog ser ut — utan att skicka in ett riktigt svar under sitt eget konto. Idag går det bara att se vyn genom att klicka lampan på en årskurssida, vilket skriver en riktig rad i `survey_responses`.

## Vad som byggs

En knapp **"Förhandsgranska elevvyn"** i `SurveyAdmin.tsx` (bredvid öppna/stäng-knappen). Den öppnar samma `SurveyDialog` som eleven ser, men i ett skrivskyddat läge:

- `SurveyDialog` får en ny valfri prop `preview?: boolean`.
- I preview-läge är "Skicka in"-knappen dold/avstängd och `onSubmit` anropas aldrig — inget skrivs till databasen.
- Dialogen visar den valda veckans enkät med samma frågor, ansiktsalternativ, färgade kort och fritextfält som eleven ser, så läraren ser exakt formen.
- Knappen är tillgänglig oavsett om veckans avstämning är öppen eller stängd, så läraren kan förhandsgranska innan den öppnas. Om ingen avstämning finns för veckan visas knappen inaktiverad med tooltip.

## Teknisk plan

- `src/components/SurveyDialog.tsx` — lägg till `preview?: boolean`. Dölj submit-knappen och spara-tillstånd när `preview`; behåll all layout oförändrad.
- `src/components/SurveyAdmin.tsx` — lägg till en "Förhandsgranska"-knapp + lokal `previewOpen`-state. Bygg ett `WeeklySurvey`-objekt (eller använd `selectedSurvey`/`currentSurvey`) och rendera `SurveyDialog` med `preview` när knappen klickas.
- Ingen databasändring, ingen ny migration, ingen påverkan på elevens riktiga vy eller resultat.

## Resultatet (fråga 2)

Resultatet finns redan i **Admin → Veckoavstämning**: fördelning per fråga, trend, flaggade elever, elevsvar och CSV-export. Ingen ändring där — det redogörs för i svaret, inte i planen.
