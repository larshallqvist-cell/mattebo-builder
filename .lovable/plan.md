

# Nedräkningstimer -- "Time Timer" till lektionens slut

## Koncept
En liten rund "time timer"-klocka med en röd minskande cirkelsektor som visar hur mycket tid som ar kvar av pagaende lektion. Nar ingen lektion pagar visas timern inte alls (helt diskret). Placeras i verktygssektionen bredvid kalkylatorn och radion.

## Dataflode
Komponenten anvander `useCalendarEvents(grade)` som redan finns. Fran `upcomingEvents` identifieras den handelse dar `date <= nu <= endDate` -- det ar den pagaende lektionen. Om ingen sadan finns: timern doljs.

## Ny komponent: `src/components/LessonTimer.tsx`

**Visuellt:**
- En rund SVG-cirkel (~60px) med vit bakgrund och tunn gra kant.
- En rod cirkelsektor (arc) som borjar fran kl 12-positionen och minskar medsols, precis som en fysisk Time Timer.
- I mitten visas aterstaende tid som siffror (t.ex. "23:45" for minuter:sekunder, eller "23 min" om mer an 5 minuter kvar).
- Under cirkeln: en liten etikett "Tid kvar" eller lektionens titel, i dammad text.

**Logik:**
- `useEffect` med `setInterval` (var sekund) rakar ut proportion kvar: `(endDate - now) / (endDate - startDate)`.
- SVG `stroke-dasharray` + `stroke-dashoffset` pa en cirkel for den roda sektorn.
- Nar mindre an 5 minuter kvar: pulsande rod glow-animation.
- Nar lektionen slutar: kort "Slut!"-animation, sedan forsvinner timern.

## Placering i `src/components/GradePage.tsx`

**Desktop (vänsterkolumnen):** Laggs till i raden med kalkylator och radio -- en tredje liten widget.

**Mobil:** Laggs till i verktygssektionen, samma rad som kalkylator och radio.

Komponenten tar `grade` som prop och hanterar resten internt.

## Tekniska detaljer

- Inga nya beroenden behovs -- ren SVG + React state + `useCalendarEvents`.
- Uppdatering sker via `setInterval(1000)` -- lagen CPU-last, bara en simpel rakning.
- Cirkelsektorn implementeras med SVG `circle` och `stroke-dasharray/stroke-dashoffset` (standard-teknik for cirkulara progress-indikatorer).
- Liten pulsanimation under sista 5 minuterna via Tailwind `animate-pulse` eller en enkel CSS keyframe.

