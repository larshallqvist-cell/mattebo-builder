# Bråkträning – oändligt spel med ökande svårighet

## Vad som händer med det gamla Bråklabbet
- Labbet sparas precis som det är, och inget raderas.
- Bara du som admin ser det, via en liten knapp på sidan. Eleverna ser bara det nya spelet.

## Spelet
Det byggs som Procent: man väljer bana, uppgifterna tar aldrig slut och blir sakta svårare. Det finns svit, rekord, topplista (topp 3 per klass och topp 10 för hela skolan) och en kort instruktion som visas tills eleven väljer bort den.

Banor plus en MIX-knapp:
1. Bråkform och blandad form, åt båda hållen
2. Förlänga och förkorta
3. MGN, minsta gemensamma nämnare
4. Addition och subtraktion
5. Multiplikation
6. Division

Varje bana har 6 steg. På de lägre stegen är nämnarna små och lika. Längre upp blir nämnarna olika och större, och det kommer in blandad form och negativa svar.

**Bilder:** på steg 1–2 visas bråken också som tårtbitar eller staplar. Från steg 3 visas bara siffror.

## Poäng (nytt jämfört med Procent)
- Ett rätt svar ger 1 poäng.
- **Förkortning:**
  - Steg 1: ett oförkortat svar räknas som rätt, och eleven får ett tips om att förkorta.
  - Steg 2–3: eleven får upp till 5 varningar. Efter det ger ett oförkortat svar bara 0,5 poäng.
  - Steg 4 och uppåt: ett oförkortat svar ger 0,5 poäng.
- **Miniräknare:** finns alltid. På steg 1–3 halveras poängen när eleven använder den. Från steg 4 ger den full poäng, som i Procent.
- Ett fel svar bryter sviten.

Två förslag som du gärna får säga till om:
- Sviten fortsätter även när eleven får halv poäng.
- Topplistan visar poängen i den längsta sviten.

## Resultat
- Varje svar sparas med bana, steg, om det var rätt, poäng, om svaret var oförkortat och om miniräknaren användes.
- Resultaten visas i Admin och i Elevkortet, som för Procent.

## Teknisk sammanfattning
- Ny ren logikmodul `src/lib/brak.ts` för uppgifter, exakt rättning (även blandad form), poäng och varningar. Testerna ligger i `tests/brak.test.ts`.
- Ny sida, återanvänder `ExerciseShell` och `StreakDrill`-mönstret, med nya bildkomponenter för bråk.
- `/braklabbet` visar spelet. Iframen med det gamla labbet visas bara om användaren är admin, och den skyddade labb-koden lämnas orörd.
- Ny tabell `brak_attempts`: eleven får lägga till och läsa sina egna rader, admin läser allt. Topplistan hämtas genom en funktion som är byggd som `procent_leaderboard`.
- Uppdatera AGENTS.md och minnet.
