# UX-granskning av årskurssidan (ingen kod ändras i detta steg)

## Vad som konkurrerar om uppmärksamheten idag

1. **Sidhuvudet är för fullt.** Där finns årskurs, kapitelväljare, läxruta, vy-väljare, anteckningsknapp, enkätlampa och lektionstimer. På mobil trängs detta och skjuter ner innehållet. Eleven ser verktyg innan hen ser "vad ska jag göra idag".
2. **Alla paneler ser lika viktiga ut.** Resurser, Nästa lektion, Verktyg, Lunch, Planering och Mat-t-e har samma ram, glöd och rubrikstil. Det finns ingen tydlig startpunkt.
3. **Dekor stjäl fokus.** Glödande kanter, gnistor i verktygspanelen och skruvar i hörnen drar ögat till ramarna i stället för innehållet.
4. **Mobil ordning stämmer inte med elevens behov.** Nu: Nästa lektion → Verktyg (kalkylator, radio, lunch, timer) → Planering → Resurser → Mat-t-e. Kapitlets resurser, som är det eleven oftast söker, hamnar långt ner, efter radio och lunch.
5. **Läxan är liten trots att den är viktig.** I headern är den kompakt och lätt att missa, särskilt på mobil.
6. **Kapitelväljaren sitter långt från resurserna den styr.** Eleven byter kapitel uppe i headern men ser resultatet längre ner.

## Föreslagen hierarki för elever

```text
1. Idag        Nästa lektion + Läxa (med länk)          syns direkt
2. Jobba       Kapitelväljare + kapitlets resurser       syns direkt
3. Framåt      Planeringskalender                        hopfälld på mobil, öppen på dator
4. Extra       Kalkylator, Drills/Tabellerna/Mathdrop,   hopfällt "Verktyg"
               radio, lunch, Mat-t-e
```

## Konkreta ändringar

**Sidhuvud (alla skärmar)**
- Behåll bara: Mattebo/tillbaka, "Åk X", timer och användarmeny.
- Flytta läxan ner till "Idag"-kortet.
- Flytta kapitelväljaren till resurspanelens rubrik.
- Lägg vy-väljaren i användarmenyn. Anteckningar och enkätlampa blir kvar men som små ikoner (anteckningar syns bara för dig som lärare, som idag).

**"Idag"-kort överst**
- Nästa lektion och läxa i ett gemensamt kort med tydlig huvudrubrik. Läxan får egen rad med länkknapp.
- Visas alltid öppet. "Förstora dagens agenda" behålls.

**Resurser**
- Rubriken "Kapitel X — namn" blir själva kapitelväljaren (rullgardin eller pilar).
- Länkar, spel och övriga resurser kvar som idag i fällbara grupper. Första gruppen öppen, övriga stängda på mobil.

**Planering**
- Mobil: hopfälld rad "Planering Åk X — nästa: tis 10:15" som öppnas med ett tryck.
- Dator: kvar som högerspalt.

**Verktyg och extra**
- Ett hopfällt "Verktyg"-kort med kalkylator, de tre länkknapparna, radio och lunch. Mobil: stängt som standard. Dator: öppet men visuellt nedtonat.
- Mat-t-e flyttas längst ner, mindre, eller in i Verktyg.
- Det senaste öppna/stängda läget sparas per enhet.

**Visuellt lugn**
- En starkare ram och accentfärg bara för "Idag"-kortet. Övriga paneler får enklare kort utan glöd, gnistor och skruvar.
- Mer luft mellan sektioner, färre linjer.
- Mobil bottenmeny: Idag · Resurser · Planering · Verktyg (hoppar till respektive sektion).

## Översikt: direkt synligt vs hopfällbart

| Del | Mobil | Dator |
|---|---|---|
| Nästa lektion | Direkt | Direkt |
| Läxa med länk | Direkt | Direkt |
| Kapitelväljare + resurser | Direkt (första gruppen öppen) | Direkt |
| Planeringskalender | Hopfälld | Direkt |
| Kalkylator, länkknappar, radio, lunch | Hopfällt | Synligt, nedtonat |
| Mat-t-e | Längst ner | Liten, nederst i vänsterspalten |
| Timer | I sidhuvudet | I sidhuvudet |
| Lärarknappar (anteckningar, vy) | Bara för admin, i meny | Bara för admin |

## Dator-layout (förslag)

```text
[ Sidhuvud: Åk X · timer · meny ]
[ Idag: nästa lektion + läxa      ][ Planering ]
[ Kapitel ▾ + resurser            ][ (spalt)   ]
[ Verktyg (nedtonat)  · Mat-t-e   ][           ]
```

## Tekniska detaljer (för genomförandet senare)
- Ändringarna rör främst `ApocalypticGradePage.tsx`, `ApocalypticNav.tsx`, `HomeworkBanner.tsx`, `ChapterSelector.tsx`, `MetalPanel.tsx`/`ScreenFrame.tsx` och `MobileBottomNav.tsx`.
- Hopfällning med befintlig accordion/collapsible-komponent; läget sparas i localStorage per sektion.
- Ingen data, inga funktioner och inget innehåll tas bort; endast placering och utseende.
- Verifieras med skärmdumpar i mobil (390 px), iPad liggande och dator.
