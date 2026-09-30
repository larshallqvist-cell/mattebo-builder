# Felsökning: Spara-testet mot "Auto åk6" (bara analys, ingen kod ändrad)

## Resultat

1. **Nådde anropet serverfunktionen?** Ja. `POST /functions/v1/sync-lesson-to-calendar` svarade **200** kl 17:03:04 UTC. Funktionen startade kl 17:02:59.
2. **Data som sparades** (raden i `lesson_plans`, uppdaterad 17:02:58 UTC):
   - grade: **6**
   - event_uid: `pbu56sep2amjq2ae0p440ele1c@google.com`
   - starts_at: 2026-10-01 06:45 UTC (08:45 svensk tid)
   - title: **"Prov kap 1"**
   - content: **"PROV KAPITEL 1 TESTSYNK"**
3. **Skrivningen till kalkylbladet:** Loggarna visar inga fel. Funktionen loggar `Master sheet write failed` om skrivningen misslyckas, och den raden finns inte. Svaret var 200 och inga fel loggades, så skrivningen verkar ha lyckats.
4. **Kalendern:** Inget `Calendar patch failed` i loggarna, så kalenderändringen verkar också ha lyckats.
5. **Varför hittades inget?** Den sparade texten är **"TESTSYNK"**, alltså ihopskrivet, inte "TEST SYNK" med mellanslag. Därför gav sökningen ingen träff. Titeln är "Prov kap 1".

## Förslag på kontroll (inga skrivtester)

- Sök efter `TESTSYNK` eller `Prov kap 1` på fliken **Åk 6**. Titta i kolumn F efter raden med KalenderEventID `pbu56sep2amjq2ae0p440ele1c`.
- Öppna lektionen 1 okt kl 08:45 i Åk 6-kalendern och kontrollera beskrivningen.

## Förbehåll

- Serverfunktionen loggar inte svaret när allt går bra. Därför bygger "lyckades" på att inga fel finns, inte på en bekräftelse i loggen. Om texten ändå saknas i bladet kan den körda versionen av funktionen vara äldre än koden. Nästa steg är då att bekräfta att den senaste versionen är i drift. Den kontrollen ändrar inga data.
