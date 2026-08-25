# Pastellfärgade årskurscirklar + smartare adminläge

## 1. Fyra milda pastellfärger på cirklarna

Startsidans fyra cirklar använder idag fyra tokens som ligger mycket nära varandra (alla turkos/blå), därav intrycket att de är "samma färg".

Nya, dovt pastellaktiga toner — en per årskurs, valda så de fortfarande fungerar mot den mörka Ocean Deep-bakgrunden:

- Åk 6 — mint/aqua
- Åk 7 — sandgul/persika
- Åk 8 — ljusblå
- Åk 9 — lavendel/rosa

Färgerna läggs som nya tokens (`--grade-6` … `--grade-9`) i temat och kopplas till kortens glöd, ring och halo. Övriga sidor påverkas inte — befintliga neon-tokens ligger kvar för resten av gränssnittet.

## 2. Adminläget öppnar rätt årskurs

Idag startar lektionsredigeraren alltid på Åk 6. Ändring: när du går till adminläget från en årskurssida (t.ex. `/ak8`) ska redigeraren öppna Åk 8 direkt.

- Menylänken till adminläget skickar med den årskurs du står på.
- Adminsidan läser den och sätter startvärdet i lektionsredigeraren; du kan fortfarande byta årskurs manuellt.
- Går du in i adminläget från startsidan används senast valda årskurs, annars Åk 9 som förut.

## Teknisk detalj

- `src/index.css`: fyra nya HSL-tokens för årskursfärger.
- `src/config/app.ts`: `GRADE_CARD_COLORS` pekar om till de nya tokens.
- `src/components/UserMenu.tsx`: adminlänken blir `/admin?grade=N` baserat på aktuell route.
- `src/pages/Admin.tsx` / `LessonPlanEditor.tsx`: initial `grade` från query-param (med `localStorage`-fallback för senast valda).

Ingen backend-ändring, ingen ändring i lektions- eller kalenderlogik.

## Om kodkvaliteten (svar på din fråga)

Kort svar: appen är inte illa byggd, men den bär spår av att ha vuxit fram stegvis.

Hade allt varit bestämt från början hade den sett annorlunda ut på tre punkter:
1. **Mappstruktur** — ~45 komponenter ligger platt i `src/components/`, utan indelning i t.ex. `calendar/`, `resources/`, `admin/`.
2. **Datahämtning** — React Query finns installerat men används inte; kalender, resurser och läxor har varsin handrullad cache-/polling-lösning som gör felsökning svårare (bl.a. "skakigheten" du märker).
3. **Namngivning** — "Apocalyptic"-prefixet är kvar från ett tidigare designspår som inte längre finns.

Skräp som kan städas: några oanvända komponenter, gamla designtokens och beroenden som inte används.

**Min rekommendation:** lägg inte tokens på en stor refaktorering nu. Den ger ingen synlig nytta och riskerar att bryta flöden som äntligen fungerar. Ett rimligt mellanläge är en avgränsad insats senare: samla kalender/lektionsplaner i en gemensam datahämtning (löser formateringens skakighet på riktigt) och rensa död kod. Det tar vi som ett eget steg när du är nöjd med funktionaliteten.
