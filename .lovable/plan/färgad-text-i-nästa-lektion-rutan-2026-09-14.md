# Färgad text i "Nästa lektion"-rutan

## Mål
Du ska kunna färga text i lektionsplaneringen, så att färgen syns både i förhandsvisningen i admin och i "Nästa lektion"-rutan (PostItNote). Stöd för både en fast palett snabbval och en egen valfri hex-färg.

## Syntax
Kort tagg-syntax som är lätt att skriva och läsa:

```text
{röd}viktig text{/}
{#1aa7ec}valfri färg{/}
```

- Fast palett (namn): `röd`, `blå`, `grön`, `gul`, `lila`, `orange`, `svart`, `vit`
- Fri färg: `#RRGGBB` (valfri hex)
- Taggen stängs med `{/}`. Kan kombineras med fetstil, punktlistor och rubriker.

## Vad jag bygger

### 1. Färgtolkning i renderaren — `src/lib/lessonContent.tsx`
- Lägg till en palett-mappning (namn → CSS-färg) och validering av `#hex`.
- Utöka `renderPlainInline` så att `{färg}text{/}`-sekvenser blir en `<span style={{ color }}>…</span>`. Färgen kan omsluta annan inline-formatering (fet, länk).
- Utöka `renderInlineHtml` (Google Kalender-HTML-vägen) på motsvarande sätt så att färger även fungerar där.
- Längdgräns och sanitization bibehålls; ogiltiga/okända färger renderas som vanlig text (ingen krasch).

### 2. Färgknapp i editorns verktygsrad — `src/components/LessonPlanEditor.tsx`
- Ny knapp "Färg" i verktygsraden (bredvid Fet/Rubrik/Punkt/Länk).
- Klick öppnar en liten popover med:
  - Snabbval: de fasta palettfärgerna som klickbara färgrutor.
  - En `<input type="color">` för egen hex-färg + ev. textfält för hex.
- Vald färg infogar `{färg}` före och `{/}` efter markören/markeringen i textrutan, via befintlig `insertAtCursor`.
- Uppdatera hjälptexten under verktygsraden med färgsyntaxen.

### 3. Tekniska noteringar
- Inga databas- eller backend-ändringar; färger sparas som text i `lesson_plans` precis som annan formatering.
- Båda redigeringsflikarna ("Per klass" och "Per dag") använder samma `LessonEditorPane`, så färgknappen finns i båda automatiskt.
- Förhandsvisningen i editorn visar färgerna direkt eftersom den använder samma `parseLessonContent`.
- Expandera-dialogen ("Förstora dagens agenda") visar också färgerna utan extra arbete.
