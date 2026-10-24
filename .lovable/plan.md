# Lugnare årskurssida – genomförande

Allt innehåll, alla länkar och funktioner behålls. Bara placering och utseende ändras. Inga datamodeller ändras.

## Steg (i prioritetsordning)

1. **Idag-kort, alltid öppet**: nästa lektion och läxa med länk i samma kort, överst. Starkast accent på sidan. "Förstora dagens agenda" behålls.
2. **Resurser direkt efter Idag**: kapitelväljaren flyttas in i resurspanelens rubrik ("Kapitel X — namn" blir väljaren). Kapitelbytet sparas som idag.
3. **Planering**: hopfällbar på mobil, stängd som standard, med nästa lektion i raden. På dator kvar i högerspalten.
4. **Verktyg-kort**: kalkylator, Drills/Tabellerna/Mathdrop, radio och lunch i ett nedtonat, hopfällbart kort. Stängt på mobil, öppet på dator.
5. **Lugnare paneler**: glöd, gnistor och skruvar tas bort från vanliga paneler, och det blir mer luft mellan sektionerna.
6. **Mobilens bottenmeny**: Idag · Resurser · Planering · Verktyg. Ett tryck hoppar till sektionen och öppnar den om den är stängd.

Övrigt:
- Timern blir kvar i sidhuvudet.
- Sidhuvudet bantas. Vy-väljare, anteckningar och enkätlampa visas bara för behöriga, precis som idag.
- Mat-t-e flyttas längst ner och blir mindre (kompakt läge).
- Öppet/stängt sparas per sektion och enhet.

## Dator

```text
[ Sidhuvud: Åk X · timer · meny                ]
[ Idag (nästa lektion + läxa) ][ Planering      ]
[ Kapitel ▾ + resurser        ][ (högerspalt)   ]
[ Verktyg (nedtonat)          ][                ]
[ Mat-t-e (liten)             ][                ]
```

## Mobil (390 px)

```text
Sidhuvud (Åk X, timer, meny)
Idag            – öppet
Resurser        – öppet, kapitelväljare i rubriken
Planering       – hopfällt
Verktyg         – hopfällt
Mat-t-e         – liten
Bottenmeny: Idag · Resurser · Planering · Verktyg
```

iPad liggande följer datorlayouten, men med två spalter.

## Verifiering
Jag tar skärmdumpar vid 390 px, iPad liggande (1180×820) och dator (1280 px), inloggad som admin och som elev. Jag kontrollerar:
- nästa lektion och att läxlänken öppnas
- kapitelbyte som uppdaterar resurserna
- att resurslänkarna fungerar
- att planeringen öppnas och stängs, och att läget finns kvar efter omladdning
- att verktygen fungerar, inklusive kalkylator och radio
- att lärarknapparna saknas för elever

## Tekniska detaljer
- Ny `src/hooks/useSectionOpen.ts`: localStorage-nyckel `mattebo-section-<namn>`, med standardläge per skärmbredd.
- Ny `src/components/CollapsibleSection.tsx`, byggd på befintliga `ui/collapsible`.
- Ny `src/components/TodayCard.tsx`, som återanvänder `PostItNote` och `HomeworkBanner` (fullt läge).
- `ChapterSelector` får ett rubrikläge (`variant="title"`) som används i resurspanelens rubrik.
- `MetalPanel`/`ScreenFrame` får `variant="calm"`, utan skruvar, gnistor och glöd. Idag-kortet får `variant="accent"`.
- Ändras: `ApocalypticGradePage.tsx` (ny ordning och sektioner med id), `ApocalypticNav.tsx` (bantad mitt), `MobileBottomNav.tsx` (fyra ankarlänkar som öppnar sektionen via ett event).
- Behörighet: befintliga villkor i `LessonNotesButton`, `SurveyLamp` och admin-kontroller behålls oförändrade.
