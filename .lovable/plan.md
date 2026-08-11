# Versionsnummer i script och app

Ett tydligt versionsnummer med datum på båda ställena, så det alltid går att se vilken version som ligger i Google Sheets respektive i webbappen.

Format: `1.2.0 (2026-08-11)` — semver som jag höjer manuellt vid varje ändring, plus datumet för ändringen.

## Apps Script-filen

- En konstant överst i filen: `const VERSION = "1.2.0"; const VERSION_DATUM = "2026-08-11";`
- Menyn "Mattebo" får en icke-klickbar rad längst ned som visar `v1.2.0 (2026-08-11)`.
- Ett nytt menyval "Om / version" som visar en dialog med version, datum och kort ändringslogg.
- Versionen loggas också vid Generera/Synka/Rensa, så körningsloggen visar vilken version som kördes.

## Webbappen

- Versionen samlas på ett ställe i koden (en liten `src/lib/version.ts` med nummer och datum).
- Sidfoten visar `v1.2.0 · 2026-08-11` diskret bredvid copyright-raden, i samma stil som övrig sidfotstext (inga hårdkodade färger, befintliga tokens används).
- `package.json` sätts till samma version, så alla tre källor stämmer överens.

## Rutin framåt

Vid varje ändring jag gör åt dig höjer jag versionen (patch för småfix, minor för ny funktion) och uppdaterar datumet på alla ställen samtidigt.

## Teknisk detalj

Version och datum definieras en gång per artefakt (`VERSION`-konstanter i .gs-filen, `APP_VERSION`/`APP_VERSION_DATE` i `src/lib/version.ts`) och importeras där de visas — ingen dubblering i komponenterna.
