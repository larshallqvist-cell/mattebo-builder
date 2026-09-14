# Redigerare och förhandsvisning sida vid sida

I lektionsplaneringen (både "Per klass" och "Per dag") ligger idag textrutan ovanför förhandsvisningen, vilket tvingar till scrollning. De läggs bredvid varandra istället.

## Så blir det

- Inne i editordelen: **textrutan till vänster** och **förhandsvisningen till höger**, sida vid sida.
- Förhandsvisningen följer med i höjd med textrutan och scrollar inom sin egen ram vid långa texter — ingen sidscrollning upp och ner längre.
- Teckenräknaren (t.ex. "123/4000 tecken") hamnar under textrutan.
- Rubrikfält, knapprad och hjälptexten ovanför behålls över hela bredden, oförändrade.
- På smal skärm (iPad stående eller mobil) staplas de under varandra som idag, så inget blir trångt.

## Teknisk beskrivning

- Ändringen görs enbart i `LessonEditorPane` i `src/components/LessonPlanEditor.tsx`, så båda flikarna ("Per klass" och "Per dag") får samma nya layout automatiskt.
- Textruta + teckenräknare och förhandsvisningsrutan wrappas i en grid: `grid gap-3 lg:grid-cols-2` (sida vid sida från ~1024 px, staplat under).
- Förhandsvisningen får egen scroll (`overflow-y-auto`) med max-höjd matchad mot textrutan så sidan inte växer i höjd.
- Textrutans `rows` justeras vid behov så höjderna ser balanserade ut.
- Ingen ändring i sparlogik, databas eller övriga komponenter.
