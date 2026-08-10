# Robustare hantering av #divider (och #spacer/#header/#note)

Vi vet inte exakt vilken cell som skiljer sig på den trasiga raden, så istället för att gissa gör vi parsern tålig mot alla vanliga avvikelser och lägger in diagnostik som pekar ut raden om den ändå faller bort.

## Vad som ändras

1. **Kommandorader släpps alltid igenom**
   Idag kräver filtret i backend att raden har en titel och att URL:en börjar med `http` eller `#`. Rader som innehåller `#divider`, `#spacer`, `#header` eller `#note` ska passera oavsett om kolumn C är tom, har mellanslag eller osynliga tecken.

2. **Tålig tolkning av kommandotexten**
   - Trimmar blanksteg och osynliga tecken (zero-width, non-breaking space) före jämförelse.
   - Jämför i gemener, så `#Divider` eller `#DIVIDER` fungerar.
   - Letar efter kommandot i kolumn C, D **och** E (idag missas vissa kombinationer när kolumnerna hamnat förskjutna vid kopiering).

3. **Tåligare kapitel och kategori**
   - Kapitelnumret tolkas även om cellen innehåller mellanslag eller är formaterad som text.
   - Kategorin jämförs utan hänsyn till versaler/gemener och extra mellanslag, så `Spel ` och `spel` hamnar i samma grupp.

4. **Frontend**
   Samma normalisering (trim, gemener, osynliga tecken bort) innan `#divider`/`#spacer`/`#note` känns igen i resurslistan.

5. **Diagnostik**
   Backend loggar varje rad som innehåller `#` men ändå filtreras bort, med radnummer och cellinnehåll. Om dividern fortfarande saknas kan jag läsa loggen och peka exakt på vilken cell som är fel.

## Teknisk detalj

- `supabase/functions/get-resources/index.ts`: ny hjälpfunktion `normalizeCommand()`, kommandodetektering över kolumn C/D/E, uppdaterat `.filter()` så kommandorader undantas titelkravet, samt extra `console.log` för bortfiltrerade `#`-rader.
- `src/components/ResourceAccordion.tsx`: normalisera `cleanUrl` (trim + lowercase + zero-width-strip) innan `startsWith`-kontrollerna.
- Edge-funktionen deployas och testas mot åk 9, kapitel 1.

## Ingen ändring i sheetet krävs

Efter detta ska en kopierad divider-rad fungera oavsett tomma celler, mellanslag eller versalskillnader.
