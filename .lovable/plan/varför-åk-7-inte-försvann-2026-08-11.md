# Varför Åk 7 inte försvann

## Vad jag kontrollerade
Jag läste appens kalendercache i databasen. Tre saker syns direkt:

- Cachen för åk 7 hämtades 12:44 och åk 8 12:53 idag — alltså **innan** du körde "Rensa kalendrar" (15:05/15:17). Appen visar därför gamla lektioner oavsett vad som hänt i Google.
- Kalendern som ligger på **åk 8** innehåller händelser med titeln "Matte Åk 7". Åk 8-flödet i backend pekar alltså på åk 7:s kalender (eller åk 7-lektioner har synkats dit).
- Din körningslogg visade "Kunde inte hitta kalender" för **alla fyra** kalendrar. Ingenting raderades alls i Google — varken åk 7 eller någon annan.

Så det är inte ett fel i appen: rensningen körde tomt, och det du ser i Mattebo är cache.

## Vad som behöver göras

1. **Hitta rätt kalender-ID:n.** Kör `listaKalendrar()` i Apps Script och klistra in loggen här. Utan riktiga ID:n kan varken rensning eller synk träffa rätt kalender. (Om åk 7–9 inte dyker upp i listan är kalendrarna inte tillagda i det Google-konto som kör kalkylbladet — de måste prenumereras på först.)
2. **Rätt ID:n in i scriptet.** Jag fyller i alla fyra i både `rensaKalender()` och `synkaHelaBladetTillKalender()` när jag har loggen, så vi slipper platshållarna.
3. **Reda ut åk 7/åk 8-krocken.** När ID-listan finns jämför vi den mot backendens fyra iCal-adresser och rättar den som pekar fel, så att åk 8 verkligen visar åk 8.
4. **Tvinga fram ny cache.** Efter rensning och ny synk nollställer jag `calendar_cache` så att appen hämtar färska flöden direkt istället för att vänta ut cachen.

## Tekniska detaljer
- Cachetabellen `public.calendar_cache` används som fallback när Google svarar långsamt eller med 429; den maskerar därför gamla data när Google-sidan ändras.
- Steg 4 är en radering av de fyra raderna i `calendar_cache`; nästa anrop till `get-calendar` fyller på dem på nytt.
- Inga ändringar i appens kod behövs för detta — felet ligger i Apps Script-ID:n och en felpekande iCal-adress i backend.

## Nästa steg
Klistra in loggen från `listaKalendrar()`, så levererar jag ett färdigt script med rätt ID:n och rättar backend-adressen.
