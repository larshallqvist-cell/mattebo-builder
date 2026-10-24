# Tydligare header, kompakt läxruta och enhetlig verktygsruta

Allt innehåll och alla funktioner finns kvar. Bara placering och utseende ändras.

## 1. Ny sidheader
- "Leteboskolan" och "Åk X" blir störst i headern, med större text än länkarna.
- Mer luft i höjd och sidled, även på mobil (390 px). Inga överlappande delar.
- Timer, vy-väljare, anteckningar och enkätlampa ligger kvar till höger och syns bara för behöriga, precis som idag.
- Du som admin har kvar Åk 6–9-knapparna under skolnamnet.

## 2. Småapparna flyttas till Verktyg
- Bråklabbet, Tabelltestet och Algebra tas bort från klassidans header och läggs i Verktyg.
- Startsidan behåller sina länkar som idag.

## 3. Kompakt läxruta
- En rad med läxans korta text och en tydlig knapp, "Öppna läxa".
- Lång text kortas av med "Visa mer". Länken öppnas som idag, även YouTube.

## 4. Enhetlig verktygsruta
- Ett rutnät med lika stora knappar, ikon och namn: Kalkylator, Drills, Tabellerna, Mathdrop, Bråklabbet, Tabelltestet och Algebra.
- 2 kolumner på mobil, 3–4 på iPad och 4 på dator.
- Radion och lunchen ligger under rutnätet, som idag.

## 5. Kalkylatorn
- Bilden ersätts med en vanlig kalkylatorikon.
- Innan jag bygger kontrollerar jag villkoren för Texas Instruments och Casio:
  - Om en officiell kalkylator är gratis, fungerar utan konto och får bäddas in, öppnas den från knappen.
  - Om den inte får bäddas in men är gratis, får knappen en tydlig länk dit.
  - Annars blir den egna kalkylatorn kvar bakom ikonen, eftersom den redan fungerar. Den ser ut och räknar som idag. Jag lägger inte in någon obekräftad emulator eller kopia.
- Jag berättar vad jag hittade och vad jag valde.

## Verifiering
Jag tar skärmdumpar på mobil (390 px), iPad liggande (1180×820) och dator (1280 px), inloggad som admin. Jag kontrollerar läxknappen, varje verktygsknapp, kalkylatorn, radion och att headern inte är trång.

## Tekniska detaljer
- `ApocalypticNav.tsx`: lägg till `compactLinks` för klassidan, som döljer app-länkarna, och ge skolnamn och årskurs större typsnitt (Sora).
- `HomeworkBanner.tsx`: ett kompakt läge med `line-clamp` och en knapp. Länklogiken återanvänds.
- `ApocalypticGradePage.tsx`: ny `ToolsGrid` med en lista över verktyg. Interna sidor öppnas med `Link`, externa med `window.open`.
- `CalculatorThumbnail.tsx`: lägg till `variant="icon"` med `lucide Calculator`, som öppnar `CalculatorModal` eller en officiell länk.
- Inga ändringar i databasen.
