# Ta bort dubbla lektioner igen

## Läge
Kalendrarna innehåller dubbletter på nytt. Frontend har redan en dedup som slår ihop poster med samma titel och exakt samma start-/sluttid, så de dubbletter du ser nu skiljer sig troligen åt på något sätt (t.ex. olika titel, olika minut, eller en serie plus enskilda event). Första steget är därför att titta på den faktiska kalenderdatan innan något raderas.

## Steg
1. Hämta rå iCal-data för varje årskurs och lista de dubblerade lektionerna med titel, tid, sal och om de kommer från en återkommande serie eller enskilda event. Då vet vi exakt varför dedupen inte fångar dem.
2. Du kör **Rensa kalender** i kalkylbladet för alla fyra årskurser (menyn i Apps Script), så att kalendrarna töms helt.
3. Du kör **Generera + Synka** en gång per årskurs — bara en gång, dubbelkörning är den vanligaste orsaken till dubbletter.
4. Jag tömmer kalender-cachen i backend och verifierar att varje årskurs laddar rätt antal lektioner med sal.
5. Om steg 1 visar att dubbletterna skiljer sig på minuter eller titelvarianter gör jag dedupen i appen mer tolerant (normaliserad titel, tidsfönster i stället för exakt match) så att framtida synkar inte kan skapa samma problem igen.

## Teknisk detalj
Dedupen ligger i `deduplicateCalendarEvents` i `src/hooks/useCalendarEvents.ts`. Cachen ligger både i edge-funktionen `get-calendar` och i tabellen `calendar_cache`; båda töms i steg 4. Inget i Google Kalender raderas från Lovable — rensningen sker via ditt Apps Script.
