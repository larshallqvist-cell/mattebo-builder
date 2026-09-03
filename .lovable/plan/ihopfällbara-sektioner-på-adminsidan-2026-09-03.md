# Ihopfällbara sektioner på adminsidan

Adminsidan har blivit lång. Alla avsnitt görs expanderbara och är **ihopfällda som standard**, plus en indikatorlampa när nya behörighetsförfrågningar inkommit.

## Ändringar

1. **Ny återanvändbar komponent** `CollapsibleAdminSection` (i `src/components/`):
   - Rubrikrad med titel, antal/indelikator och pil (chevron) som roterar vid öppning.
   - Mjuk expandera/kollapsa-animation (framer-motion, befintligt i projektet).
   - Färg och stil enligt befintligt "Ocean Deep"-tema (Card-baserad).

2. **`src/pages/Admin.tsx`** — slå in varje sektion i en egen CollapsibleAdminSection, alla `defaultOpen={false}`:
   - **Läxruta** (HomeworkEditor)
   - **Veckoavstämning** (SurveyAdmin)
   - **Lektionsplanering** (LessonPlanEditor)
   - **Väntande förfrågningar** — visar antal i rubriken, t.ex. "Väntande förfrågningar (3)"
   - **Hanterade** (insläppta/nekade användare)

3. **Postlåde-lampa för nya förfrågningar:**
   - I sektionsrubriken "Väntande förfrågningar": pulserande amber/orange prick (samma stil som enkätlampan) när `pending.length > 0`.
   - I sidhuvudet på adminsidan: en liten lampa/ikon (Mail-ikon med badge) som tänds när det finns väntande förfrågningar, så du ser det direkt utan att scrolla.
   - Lampan i huvudnavigeringen (UserMenu/adminlänk) kan också få en liten prick — ingår om det är enkelt att koppla, annars bara på adminsidan.

## Tekniskt

- `useState` per sektion för open/closed; inget sparas mellan sidladdningar (alltid kollapsade vid öppning av sidan).
- Sektionernas innehåll monteras bara när öppnat (så editors inte laddar i bakgrunden) — alternativt monteras men döljs om det stör befintlig state. Väljer montering vid öppning för prestanda.
- Inga databas- eller backendändringar.
- Pending-antal hämtas redan i Admin.tsx (`requests`), så lampan drivs av befintlig data.
