# Verifiering: sparat testpass mot "Auto åk6" (bara läsning, ingen kod ändrad)

## Resultat: hela kedjan fungerade

| Steg | Resultat |
|---|---|
| Mattebo, sparat 17:02:58 UTC | Åk 6, titel "Prov kap 1", text "PROV KAPITEL 1 TESTSYNK" |
| Serverfunktionen, 17:03:04 UTC | Svarade OK, inga fel loggade |
| Kalkylbladet, Åk 6 rad 35 | Samma titel och text, rätt händelse-ID (du har kontrollerat) |
| Kalendern "Åk 6 Letebo" | Titel "Prov kap 1", text "PROV KAPITEL 1 TESTSYNK", ändrad 17:03:03 UTC |

Lektionen i kalendern: 1 okt 2026 kl 08:45–09:35 svensk tid, sal Fjäderm.

## Varför första sökningen missade

Texten är ihopskriven, "TESTSYNK". Sökningen gällde "TEST SYNK" med mellanslag.

## Ny kontroll 18:05 UTC (bara läsning)

- summary: "Prov kap 1"
- description: "PROV KAPITEL 1 TESTSYNK"
- updated: **2026-09-30T17:03:03.894Z**, samma tid som vid förra kontrollen

Texten finns kvar efter drygt 60 minuter. Tidsstämpeln har inte ändrats, så det går inte att se om den automatiska synken har körts. Kanske skriver skriptet inte om en händelse vars värden redan är desamma, men det framgår inte av det vi har läst. Säkert är bara att synken inte har skrivit över texten.

## Kvar innan publicering

- Vill du bekräfta att den automatiska synken körs: öppna Apps Script → Körningar och kontrollera att `autoSynk` har körts efter 17:03 UTC. Det är bara läsning.
- Därefter kan appen publiceras.
