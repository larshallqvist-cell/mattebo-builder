
# Uppdatera MAT-T-E:s AI-tema och lagg till glitteranimation vid citatbyte

## 1. Uppdatera edge-funktionen (mascot-message)

**Fil:** `supabase/functions/mascot-message/index.ts`

Byter ut systempromptens tema fran "klassiska aforismer fran filosofer" till det nya temat: citat fran idrottare, historiska personer och andra som kampat mot motgangar och lyckats. Uppdaterar aven exemplen i prompten sa att AI:n genererar citat i ratt stil.

Andringar i system-prompten:
- Uppgift: "Dela ett inspirerande citat om kamp, traningsgladje, motgangar och framgang"
- Kallor: "idrottare, historiska personer, entreprenorer och andra som overvunnit motgangar"
- Exempelen byts till nagra av de nya citaten (t.ex. Michael Jordan, Usain Bolt, Nelson Mandela)
- Max-ord hojs till 30 for att rymma de langre citaten i det nya temat

## 2. Lagg till glitteranimation vid citatbyte

**Fil:** `src/components/MascotPanel.tsx`

Nar citatet byts (bade vid 30-sekundersintervall och vid klick) visas en kort glitterexplosion i pratbubblan. Implementeras med framer-motion AnimatePresence:

- Lagg till en `showSparkle`-state som satts till `true` vid citatbyte och atergar till `false` efter ~600ms
- Rendera 6-8 sma glitterpartiklar (guldiga/kopparpunkter) som sprids utifran mitten av pratbubblan med framer-motion `animate` (skala fran 0 till 1, opacity fran 1 till 0, slumpvis x/y-forflyttning)
- Partiklarna renderas ovanpa texten med `pointer-events-none` och `absolute` positionering
- Textens befintliga fade-in-animation (opacity 0 till 1) behalles

Visuell effekt: Nar citatet byter syns ett kort "starburst" av guldiga glitterprickar som tinar bort pa ~500ms, samtidigt som det nya citatet fadar in.

## Tekniska detaljer

- Inga nya beroenden behovs (framer-motion finns redan)
- Edge-funktionen deployas automatiskt
- Glittereffekten ar handelsestyrd (inte kontinuerlig) vilket foljer den befintliga animationsstrategin for Chromebook-prestanda
