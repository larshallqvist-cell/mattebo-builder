# Rubrik- och fetstil-knapparna: varför de ser likadana ut

## Vad som faktiskt händer

I lektionsplaneringen tolkas en rad som **rubrik** så snart den antingen börjar med `**...**` eller slutar med `:`. Därför blir "Fet"-knappen (som skriver `**text**`) automatiskt en rubrik om den används först på en rad — exakt samma utseende som "Rubrik"-knappen. Fetstil syns bara om `**text**` står mitt i en mening.

Dessutom finns ingen förhandsvisning i admin-editorn, så det går inte att se vad formateringen gör förrän man sparar och tittar på "Nästa lektion".

## Vad jag gör

1. **Separera rubrik och fetstil**
   - Rubrik får en egen tydlig markering: `## Rubrik` på egen rad.
   - `**text**` blir alltid vanlig fetstil, även först på raden.
   - Gamla planeringar som använder `Rubrik:` fortsätter att renderas som rubrik (bakåtkompatibelt).

2. **Uppdatera knapparna i editorn**
   - "Rubrik" infogar `## ` i början av raden.
   - "Fet" infogar `**text**` som fetstil.
   - Kort hjälptext under verktygsraden som förklarar `##`, `**fet**`, `- punkt`, `---` (linje) och länkar.

3. **Live-förhandsvisning i adminläget**
   - En ruta vid sidan av/under textfältet som visar exakt samma rendering som "Nästa lektion", uppdaterad medan man skriver.

## Tekniskt

- `src/components/PostItNote.tsx`: rubrikigenkänning i både HTML- och textvägen ändras till `##`/`Rubrik:` istället för inledande `**`; `**` hanteras enbart som inline-fetstil.
- Renderingslogiken flyttas till en delad modul (t.ex. `src/lib/lessonContent.tsx`) så att både `PostItNote` och editorns förhandsvisning använder samma kod.
- `src/components/LessonPlanEditor.tsx`: knapparnas insättning uppdateras plus en förhandsvisningspanel.
- Inga databas- eller backend-ändringar; befintliga sparade planeringar påverkas inte.
