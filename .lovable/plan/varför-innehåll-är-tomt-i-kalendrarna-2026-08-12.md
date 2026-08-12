# Varför "Innehåll" är tomt i kalendrarna

## Vad kontrollen visar
Jag läste den råa kalenderdatan som appen hämtar (senast hämtad idag 09:34 för åk 6, 09:29 för åk 7, i natt för åk 9):

- Lektionerna finns: 168 för åk 6, 156 för åk 7, 126 för åk 9. De har titel, tid och sal (LOCATION).
- **Noll av händelserna har någon beskrivning** (DESCRIPTION saknas helt i alla tre kalendrarna).
- Åk 8 saknar sparad kalenderdata just nu.

Alltså: ingen kod är borttagen i appen. Innehållet skickades aldrig med till Google Kalender vid senaste synken — händelserna skapades utan beskrivning. Appen visar tomt eftersom det inte finns något att visa.

Trolig orsak: kolumn E (Beskrivning) i kalkylbladet var tom när du körde Generera + Synka, eftersom "Generera" bara skapar Titel/Starttid/Varaktighet/Plats och lämnar Beskrivning tom.

## Vad jag föreslår

1. **Kontrollera kolumn E i kalkylbladet.** Om den är tom är det förväntat att kalendern saknar innehåll — texten måste skrivas där (eller genereras).
2. **Uppdaterings-synk i Apps Script.** Ny funktion `uppdateraBeskrivningar()` som går igenom raderna och skriver in Beskrivning på befintliga kalenderhändelser via KalenderEventID (kolumn F) — utan att radera och skapa om något. Då slipper du hela rensa/generera/synka-karusellen när du bara ändrar text.
3. **Säkerställ att Synka alltid skickar beskrivning** både vid skapande och uppdatering (`setDescription`), så det inte tappas igen.
4. **Valfritt: mallinnehåll vid Generera.** "Generera" kan fylla kolumn E med en enkel mall (rubrik + punktlista) som du sedan redigerar, så att Post-it-lappen alltid har struktur att visa.
5. **Åk 8:** jag kollar varför den saknar kalenderdata och rapporterar om det är länken eller en tom kalender.

## Tekniska detaljer
- Appens kod är oförändrad på den här punkten: `useCalendarEvents` läser `description` från VEVENT och `PostItNote` renderar den. Utan DESCRIPTION i flödet blir rutan tom — inget fel i parsern.
- `uppdateraBeskrivningar()` använder `CalendarApp.getCalendarById(...).getEventById(idFrånKolumnF).setDescription(text)`; rader utan ID hoppas över och loggas.
- Version bumpas till 1.6.0 i Apps Script-filen och i `src/lib/version.ts`/`package.json`.
- Backend-cachen (`calendar_cache`) töms efter din synk så appen hämtar färska flöden direkt.