
# Plan: Dynamiskt skalande verktygsrutnät

## Sammanfattning
Omstrukturera "Verktyg"-panelen så att alla 9 element (3 verktygsikoner + 6 radiokanaler) placeras i ett CSS Grid med 2 rader som fyller hela det tillgängliga utrymmet. Elementen skalas dynamiskt baserat på panelens storlek.

## Layout-koncept

```text
┌─────────────────────────────────────────┐
│ 🧮 Verktyg                              │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌────┐│  <- Rad 1: Fyller hela bredden
│  │Calc │ │Geo  │ │Matte│ │ 🧘  │ │ 🎸 ││
│  │     │ │     │ │     │ │ Spa │ │Rock││
│  └─────┘ └─────┘ └─────┘ └─────┘ └────┘│
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  🔊   │  <- Rad 2: 4 radiokanaler + volym
│  │ 🎧  │ │ ✌🏼  │ │ 🎵  │ │ 📻  │       │
│  │ Pop │ │Faith│ │ NRJ │ │ P3  │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
└─────────────────────────────────────────┘
```

Alternativt med alla 9 element i ett 5+4-rutnät:

```text
Rad 1: [Calc] [Geo] [Matte] [🧘 Spa] [🎸 Rock]
Rad 2: [🎧 Pop] [✌🏼 Faith] [🎵 NRJ] [📻 P3] [🔊]
```

## Tekniska ändringar

### 1. ApocalypticGradePage - Integrerat grid
**Fil:** `src/components/ApocalypticGradePage.tsx`

Ersätt den nuvarande layouten i "Verktyg"-panelen med ett enhetligt CSS Grid:

- Använd `grid grid-cols-5 grid-rows-2` för att skapa ett 5x2 rutnät
- Sätt `h-full` på grid-containern så den fyller panelen
- Låt varje cell ha `flex-1` och `aspect-auto` för att skalas proportionellt
- Integrera CalculatorThumbnail, GeogebraLink, MattebokenLink direkt i griden
- Skicka en ny prop `fillSpace` till WebRadio för att indikera att kanaler ska fylla celler

### 2. WebRadio - Ny "fillSpace" prop
**Fil:** `src/components/WebRadio.tsx`

Lägg till ett nytt läge `fillSpace` som:

- Returnerar enbart kanalknapparna som en React Fragment (utan wrapper-div)
- Varje knapp får `flex-1` och `h-full` för att fylla sin grid-cell
- Tar bort min-width och fasta storlekar, låter CSS Grid styra
- Volymknappen placeras i sista cellen

### 3. Verktygskomponenter - fillSpace-stöd
**Filer:** `CalculatorThumbnail.tsx`, `GeogebraLink.tsx`, `MattebokenLink.tsx`

Lägg till `fillSpace` prop som:

- Använder `h-full w-full` istället för fasta dimensioner
- Sätter `aspect-square` eller låter höjden styras av grid-raden
- Centrerar innehållet med flex

## Förväntad CSS-struktur

```tsx
// I ApocalypticGradePage:
<MetalPanel title="Verktyg" className="flex-1 flex flex-col min-h-0">
  <div className="grid grid-cols-5 grid-rows-2 gap-2 h-full">
    {/* Rad 1 */}
    <CalculatorThumbnail fillSpace />
    <GeogebraLink fillSpace />
    <MattebokenLink fillSpace />
    <WebRadioButton channel="spa" fillSpace />
    <WebRadioButton channel="rock" fillSpace />
    
    {/* Rad 2 */}
    <WebRadioButton channel="pop" fillSpace />
    <WebRadioButton channel="christian" fillSpace />
    <WebRadioButton channel="nrj" fillSpace />
    <WebRadioButton channel="p3" fillSpace />
    <VolumeControl />
  </div>
</MetalPanel>
```

## Alternativ approach: Enkel flex-lösning

Om CSS Grid blir för komplext kan vi använda:

```tsx
<div className="flex flex-col h-full gap-2">
  <div className="flex-1 flex gap-2">
    {/* 5 element som delar raden */}
    <CalculatorThumbnail className="flex-1" />
    <GeogebraLink className="flex-1" />
    <MattebokenLink className="flex-1" />
    <RadioButton className="flex-1" />
    <RadioButton className="flex-1" />
  </div>
  <div className="flex-1 flex gap-2">
    {/* 5 element som delar raden */}
    <RadioButton className="flex-1" />
    <RadioButton className="flex-1" />
    <RadioButton className="flex-1" />
    <RadioButton className="flex-1" />
    <VolumeButton className="flex-1" />
  </div>
</div>
```

## Tekniska detaljer

### Varför detta fungerar
- `flex-1` gör att varje element tar lika mycket av tillgängligt utrymme
- `h-full` på raderna och containern säkerställer att höjden fylls
- `gap-2` ger konsekvent avstånd mellan elementen
- Elementen skalas proportionellt när panelen växer/krymper

### Fördelar
1. Alla 9 element fyller hela det tillgängliga utrymmet
2. Dynamisk skalning - större panel = större knappar
3. Visuellt balanserat mot "Nästa lektion"-panelen
4. Bibehåller tillgänglighet med rimliga touch-targets
