# Kalendrarna är tomma – vad som faktiskt hänt

Kalkylbladet har inget med kalendern att göra. Lektionerna hämtas från Google Calendar-länkarna (backend-secrets), så borttagna ID:n i sheetet kan inte orsaka detta.

Vad kontrollen visar:

- Åk 7, 8 och 9 har hämtad kalenderdata sparad i backend (senast hämtad idag).
- I den datan slutar lektionerna i maj/juni 2026. Idag är 10 augusti 2026, alltså finns **inga kommande lektioner** – appen visar bara framtida händelser, därför ser det tomt ut.
- Åk 6 har ingen sparad kalenderdata alls. Den länken gav tidigare 404 och behöver dubbelkollas.

Kort sagt: för åk 7–9 är det inte ett fel i appen, utan att läsårets schema har tagit slut. Nya lektioner för höstterminen behöver läggas in i Google-kalendrarna.

## Vad jag föreslår att vi bygger

1. **Tydligt tomt-läge i kalendern**
   I stället för en tom ruta utan förklaring visas "Inga kommande lektioner inlagda" med en liten hjälptext om att schemat för terminen inte är publicerat än. Samma sak för Post-it-lappen ("Nästa lektion") och lektionstimern.

2. **Skilj på tomt och trasigt**
   Om hämtningen misslyckas (nätverk/behörighet) ska det stå ett tydligt felmeddelande med en "Försök igen"-knapp – inte samma tysta tomma ruta som när det bara saknas lektioner.

3. **Kontroll av åk 6-länken**
   Jag testar åk 6-kalendern mot backend efter din senaste uppdatering av secreten. Om den fortfarande ger 404 säger jag exakt vad som är fel med länken (t.ex. privat ICS-adress som bytts ut) så du kan hämta en ny från Google Kalender.

## Teknisk detalj

- `useCalendarEvents` returnerar redan `loading`, `error` och `upcomingEvents`; komponenterna skiljer i dag inte på "0 händelser" och "fel". Tomt-läget läggs i `LessonCalendar`, `PostItNote` och `LessonTimer`.
- Ingen ändring i datamodell eller edge-funktioner behövs för punkt 1–2; punkt 3 är bara verifiering, inte kodändring.
