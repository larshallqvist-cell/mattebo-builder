# Rätta Ui.alert-felet och införa versionsnummer

## 1. Felet: "Parametrarna (String,String) matchar inte metodsignaturen för Ui.alert"

I scriptfilen finns två anrop (i rensa-funktionen och i synk-funktionen) som skickar två strängar till `SpreadsheetApp.getUi().alert(...)`. Apps Script tillåter bara ett argument (meddelande) eller tre (rubrik, meddelande, knappar) — två fungerar inte.

Åtgärd: dessa två anrop skrivs om till ett enda sammanslaget meddelande, t.ex.
`alert("Rensat Åk 6 2026-08-18 → 2026-12-18\nRaderade 214 event")`.
Alla övriga alert-anrop i filen är redan korrekta med ett argument.

## 2. Versionsnummer i Apps Script-filen

- Konstanter överst: version och datum, format `1.2.0 (2026-08-11)`.
- Menyn "Mattebo" visar versionen längst ned samt ett menyval "Om / version" med version, datum och kort ändringslogg.
- Versionen loggas när Generera, Synka och Rensa körs, så körningsloggen visar vilken version som användes.

## 3. Versionsnummer i Mattebo-appen

- Version och datum definieras en gång i `src/lib/version.ts`.
- Sidfoten visar `v1.2.0 · 2026-08-11` diskret vid copyright-raden, med befintliga färgtokens och typsnitt.
- `package.json` sätts till samma versionsnummer.

## Rutin framåt

Vid varje ändring höjer jag versionen (patch för småfix, minor för ny funktion) och uppdaterar datumet på alla tre ställen samtidigt. Den här omgången blir 1.2.0.

## Teknisk detalj

Ny fil `src/lib/version.ts` exporterar `APP_VERSION` och `APP_VERSION_DATE`; sidfoten importerar dem. I .gs-filen används `VERSION`/`VERSION_DATUM` samt `Logger.log`. Scriptfilen levereras som en ny version (`Mattebo_Kalender_2026_2027_v2.gs`) att klistra in i Apps Script.
