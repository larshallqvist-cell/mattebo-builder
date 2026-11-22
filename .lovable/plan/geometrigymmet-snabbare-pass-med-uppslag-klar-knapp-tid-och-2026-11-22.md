# Geometrigymmet: snabbare pass med uppslag, Klar-knapp, tid och poäng

## Vad eleven ser
- Varje pass blir **två uppslag med 4 uppgifter var**, i stället för 8 frågor en och en. Ett pass har alltså fortfarande 8 uppgifter.
- Eleven fyller i alla fyra rutorna och trycker **Klar**. Tangenten Enter hoppar till nästa ruta, och i sista rutan betyder Enter Klar.
- **Rättningen visas en ruta i taget**, ungefär var tredjedels sekund:
  - **Rätt:** rutan blir grön och det låter "pling". Tonen stiger för varje rätt svar i rad.
  - **Fel:** rutan blir röd och det låter "tuuut" (en låg ton). Rätt svar visas under rutan.
- Under uppslaget visas en kort förklaring med enhetstrappan för **varje fel uppgift**. Sedan trycker eleven **Nästa uppslag**.
- Det finns en ljudknapp i toppen (samma som i de andra övningarna), så det går att spela tyst i klassrummet.

## Tid (valfritt)
- En knapp **"Spela på tid"** finns på startrutan och sparas per elev.
- Med tid på räknar en klocka uppåt från första tangenttrycket på uppslaget och stannar när eleven trycker Klar.
- Eleven ser sin tid för uppslaget och sitt **bästa uppslag hittills** för övningen. Ingen topplista, så ingen jämförelse med klasskamrater.
- Utan tid syns ingen klocka alls.

## Poäng
- **+10 poäng** för varje rätt och **−5 poäng** för varje fel. Ett uppslag kan inte ge mindre än 0 poäng.
- På tid ger ett snabbt helt rätt uppslag en **tidsbonus**: +1 poäng per sekund under 40 sekunder, högst +20.
- Passets poäng summeras på resultatrutan. Elevens totalpoäng och bästa pass sparas.

## Svit och nivåer (som idag)
- 8 rätt i rad låser fortfarande upp nästa nivå. Uppslagen räknas i ordning, ruta för ruta.
- Ett fel nollställer sviten men tar inte bort klarade nivåer.
- En nivå kan alltså låsas upp mitt i ett uppslag. Banderollen "Ny nivå!" visas efter rättningen.

## Färre namn i berömmet
- Elevens förnamn nämns i berömmet bara **var 5:e till 8:e gång** (slumpat avstånd). Annars visas kort beröm utan namn.
- Tekniskt: `praise()` får en räknare för hur många beröm som gått sedan namnet senast användes. Ett test kontrollerar avståndet 5–8.

## Elevkort och analys
- Elevkortet visar också poäng, bästa tid per övning och om eleven brukar spela på tid.

## Tekniska detaljer
- **I `src/lib/geometrigymmet.ts`:**
  - `SPREAD_SIZE = 4` och `spreadQuestions()` ger fyra olika frågor.
  - `gradeSpread()` ger rätt/fel per ruta.
  - `scoreSpread(results, seconds | null)` har konstanterna `POINTS_RIGHT`, `POINTS_WRONG`, `TIME_BONUS_*` och golvet 0.
  - `recordAnswer` anropas per ruta i ordning, så svitreglerna är oförändrade.
- **Framsteg:** `Progress` utökas med `points`, `bestSeconds` per övning och `timed`. `parseProgress` sparar fortfarande gammal data med standardvärden. Ingen databasändring behövs, eftersom allt ligger i samma jsonb-rad.
- **Ljud:** korta Web Audio-toner (stigande sinus för rätt, låg fyrkantston för fel), utan ljudfiler. Ljudet respekterar avstängt ljud. Den stegvisa avslöjningen hoppas över vid reduced-motion, men färgerna visas ändå.
- **Sidan:** ett rutnät med fyra uppgiftskort (2×2 på surfplatta och dator, en kolumn på mobil). Det sparade passet på enheten utökas med uppslagets svar.
- **Tester i `tests/geometrigymmet.test.ts`:** +10/−5 och golvet 0, tidsbonusens tak, fyra unika frågor per uppslag, svit över ett uppslag med fel på sista rutan, och gammal sparad data som fortfarande läses.
- Testspel med Playwright: tre rätt och ett fel ger tre gröna rutor och en röd, rätt poäng och att klockan stannar vid Klar.
