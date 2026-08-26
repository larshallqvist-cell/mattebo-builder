# Stabilisera adminredigeringen (kraschar vid klipp och klistra)

## Vad du upplever
Sidan slocknar ibland mitt i redigering av lektionsinnehåll i adminläget, oftast i samband med klipp och klistra. Omstart fungerar, men arbetet avbryts.

## Trolig orsak (ej bekräftad ännu)
Förhandsvisningen i editorn och rutan "Nästa lektion" tolkar texten om på nytt vid varje tangenttryck. Vid inklistring av formaterad text (från Word, Google Docs, kalendern) kan innehållet bli långt eller innehålla taggar/tecken som tolkningsmotorn inte hanterar, och då kastas ett fel mitt i renderingen. Eftersom appen saknar ett skyddsnät för renderingsfel slår ett sådant fel ut hela sidan i stället för bara den lilla rutan. Detta är en hypotes — första steget i arbetet är att bekräfta den.

## Åtgärder

1. **Bekräfta orsaken**
   Kör tolkningsmotorn mot typiska inklistringar (HTML från Google Docs, mycket lång text, avbruten markdown som `**` eller `[text](`) och fånga vilket fall som faktiskt kraschar.

2. **Skyddsnät mot totalkrasch**
   Lägg ett felskydd runt förhandsvisningen i editorn och runt "Nästa lektion". Om tolkningen misslyckas visas ett litet meddelande ("Kunde inte förhandsvisa just nu") i stället för att hela sidan försvinner. Texten du skrivit ligger kvar och går att spara.

3. **Rensa inklistrad text**
   Vid klistra-in i textfältet: ta bort osynlig formatering och normalisera radbrytningar, så att det som hamnar i fältet är ren text i det format editorn förstår.

4. **Lugnare förhandsvisning**
   Fördröj omtolkningen någon tiondels sekund efter senaste tangenttryck, så att den inte körs mitt under en pågående inklistring.

5. **Härda tolkningen**
   Gör regeluttrycken tåligare mot ofullständig markdown och orimligt långa rader, och åtgärda de saknade nyckelvärdena i punktlistorna.

## Teknisk sammanfattning
- Ny `ErrorBoundary`-komponent; används runt förhandsvisningen i `LessonPlanEditor.tsx` och runt innehållet i `PostItNote.tsx`.
- `onPaste`-hantering i editorns `Textarea`: strippa `\r`, zero-width-tecken och NBSP, klipp till `MAX_CONTENT_LENGTH`.
- Debounce (≈150 ms) av `parseLessonContent`-anropet i editorns preview via `useDeferredValue` eller `useMemo` + timer.
- I `src/lib/lessonContent.tsx`: gör inline-regexerna icke-katastrofala (undvik nästlad backtracking), sätt `key` på fragmenten i `bulletItems`, och lägg en längdgräns per rad.
- Inga ändringar i databas, sparlogik eller kalendersynk.
