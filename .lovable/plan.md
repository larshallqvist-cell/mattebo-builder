# Veckoavstämning i Mattebo

En enkel veckoenkät byggd direkt i appen, i samma stil som resten av Mattebo. En lampa i headern tänds när en ny avstämning finns att fylla i. Du får en sammanställning per klass och per elev i adminläget, med trender över tid.

## Frågorna

Fyra skattningsfrågor (glad / neutral / ledsen, precis som i ditt förslag) plus två fritextfält:

1. **Lärande** — "Har jag lärt mig något nytt den här veckan?"
2. **Egen insats** — "Har jag gjort mitt bästa på lektionerna?"
3. **Lugn i klassrummet** — "Har jag bidragit till arbetsro?"
4. **Lärarens insats** — "Har jag fått den hjälp och de förklaringar jag behövde?"

Fritext:
- "En sak jag lärde mig den här veckan:"
- "Något jag önskar att vi ändrar på:"

Detta täcker dina fyra områden och håller enkäten under en minut. Frågetexterna kan justeras innan bygget.

## Så fungerar det för eleven

- En rund "avstämningslampa" ligger i headern bredvid läxrutan. Den lyser mjukt (pulserande) när veckans enkät är öppen och eleven inte svarat än, och slocknar när svaret är skickat.
- Klick öppnar enkäten i en dialog i Mattebos formspråk: pastellfärgade kort per fråga, stora klickbara ansikten, mjuka skuggor.
- Svaren är kopplade till elevens inloggning. En avstämning per elev och vecka; eleven kan ändra sitt svar fram till att veckan stängs.

## Så fungerar det för dig

Ny flik i `/admin`:

- **Öppna/stäng avstämning** per årskurs — du styr när lampan tänds.
- **Sammanställning** för vald vecka: andel grönt/gult/rött per fråga och klass, samt alla fritextsvar i en lista.
- **Trend**: enkel kurva per fråga över veckorna, så du ser om lugnet eller lärandet rör sig åt rätt håll.
- **Elevvy**: klicka på en elev för att se hens svar vecka för vecka.
- **Uppmärksamma**: elever som svarat rött två veckor i rad på samma fråga markeras, så du vet vem som behöver ett samtal.
- Export av veckans svar som CSV om du vill jobba vidare i kalkylblad.

## Teknisk plan

Databas (via migration, RLS enligt befintligt mönster):

- `weekly_surveys` — `grade`, `week_start` (måndag), `opens_at`, `closes_at`, `is_open`. Admin skapar/stänger; godkända användare får läsa öppna.
- `survey_responses` — `survey_id`, `user_id`, `q_learning`, `q_effort`, `q_calm`, `q_teacher` (smallint 1–3), `learned_text`, `wish_text`, unik på (`survey_id`, `user_id`). Elev får läsa/skriva sitt eget svar; admin får läsa alla.
- GRANT till `authenticated` + `service_role`, ingen `anon`.

Frontend:

- `src/hooks/useWeeklySurvey.ts` — hämtar aktuell öppen enkät för årskursen samt elevens eventuella svar.
- `src/components/SurveyLamp.tsx` — lampan i `ApocalypticNav.tsx`.
- `src/components/SurveyDialog.tsx` — själva enkäten, återanvänder Dialog-mönstret från "Förstora dagens agenda".
- `src/components/admin/SurveyAdmin.tsx` — öppna/stänga, sammanställning, trend (recharts, finns redan), elevvy, CSV-export.
- Färger via befintliga tokens (`--grade-*`, postit-skalan). Ingen hårdkodad färg.

Ingen Google Forms behövs; ingen påverkan på kalendersynk, lektionsplaneringar eller läxrutan.
