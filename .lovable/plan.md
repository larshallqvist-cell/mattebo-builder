# Få "Rensa kalender" att fungera + ta bort dubbletterna

## Läge
Rensningen i kalkylbladets script går inte igenom. Vid förra försöket loggade det "Kunde inte hitta kalender" för alla fyra kalendrar. Det beror nästan alltid på ett av tre saker: platshållar-ID kvar i koden, att kalendern inte är tillagd i det Google-konto som kör kalkylbladet, eller att scriptet inte fått behörighet (godkännande-dialogen inte klarad).

## Steg
1. Du kör `listaKalendrar()` och klistrar in loggen här (Apps Script > Kör > Körningslogg). Då ser vi vilka av de fyra kalendrarna kontot faktiskt når.
2. Jag levererar ett komplett script där alla fyra kalender-ID:n är inskrivna på riktigt, och där rensningen:
   - går dag för dag över hela läsåret i stället för ett enda stort intervall (Google returnerar max 2500 händelser per anrop),
   - loggar antal raderade händelser per kalender så du ser att det verkligen hände,
   - stannar med ett tydligt felmeddelande om en kalender inte kan öppnas.
3. Du kör rensningen och sedan **Generera + Synka en gång** per årskurs.
4. Jag tömmer kalender-cachen i backend och verifierar i appen att varje årskurs visar rätt antal lektioner med sal och utan dubbletter.
5. Om dubbletter ändå kvarstår gör jag dedupen i appen mer tolerant (normaliserad titel + tidsfönster i stället för exakt minutmatch), så att en dubbelsynk inte slår igenom visuellt.

## Om rensningen inte går att få igång alls
Reservväg: skapa fyra nya, tomma kalendrar och synka dit i stället för att radera händelse för händelse. Jag byter då iCal-adresserna i backend till de nya kalendrarna.

## Teknisk detalj
Dedupen ligger i `deduplicateCalendarEvents` i `src/hooks/useCalendarEvents.ts`. Cachen ligger både i edge-funktionen `get-calendar` och i tabellen `calendar_cache`; båda töms i steg 4. Inget i Google Kalender raderas från Lovable — rensningen sker via ditt Apps Script.
