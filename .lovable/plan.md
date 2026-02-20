
# Enklare matsedelsinmatning -- "Klistra in hela veckan"

## Problem
Just nu maste du fylla i 5 separata textfalt (ett per dag). Det ar omstandligt nar du redan har hela veckans matsedel kopierad fran Schoolsoft.

## Losning
Byt ut de 5 separata inmatningsfalten mot **en enda textruta** dar du klistrar in hela veckans matsedel pa en gang. Systemet tolkar automatiskt raderna och fordelar dem till ratt veckodagar.

### Sa har fungerar det:

1. Tryck pa redigera-pennan
2. En textruta visas med platshallare som visar formatet:

```text
Kottbullar med potatis
Fiskpinnar med mos
Pasta bolognese
Kycklinggryta med ris
Pizza
```

3. Klistra in fran Schoolsoft (eller skriv for hand)
4. Rad 1 = mandag, rad 2 = tisdag, osv.
5. Tryck spara -- klart!

Om du klistrar in farre an 5 rader fylls bara de forsta dagarna i. Tomma rader hoppas over.

Du kan fortfarande finjustera enskilda dagar -- under textrutan visas en forhandsvisning med dag-namn sa du ser att allt stammer innan du sparar.

## Teknisk plan

### Fil: `src/components/LunchMenu.tsx`

- **Ersatt 5 input-falt med en textarea** for snabbinklistring
- **Laga till parsningsfunktion** som delar upp text pa radbrytningar och mappar till mandag-fredag
- **Forhandsvisning** under textrutan som visar "Man: Kottbullar", "Tis: Fiskpinnar" etc. sa du kan verifiera innan du sparar
- **Tvavagssync**: om det redan finns en sparad meny, visas den i textrutan (en rad per dag) sa du enkelt kan redigera enskilda dagar
- Spara-logiken (upsert/delete) forblir oforandrad
