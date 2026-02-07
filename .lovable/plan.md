
# Plan: Förbättrad layout med större verktygsikoner och fler radiokanaler

## Sammanfattning
Slå ihop verktygsmodulen och radiomodulen till EN enhetlig panel med två rader: verktygsikoner överst och radiokanaler under. Detta skapar en visuellt balanserad och sammanhängande "Verktyg"-sektion som kompletterar "Nästa lektion"-panelen.

## Ändringar

### 1. Uppdatera ApocalypticGradePage - Kombinerad verktygspanel
**Fil:** `src/components/ApocalypticGradePage.tsx`

Slå ihop de två separata MetalPanel-komponenterna (verktyg + radio) till en enda panel:

```text
┌─────────────────────────────┐
│     🧮 Verktyg             │  <- En panel med titel
├─────────────────────────────┤
│  [Calc]  [Geogebra] [Matte] │  <- Rad 1: Verktyg, större
├─────────────────────────────┤
│  🧘 🎸 🎧 ✌🏼 🎵 📻 🔊      │  <- Rad 2: Radio, 6 kanaler
│  Spa Rock Pop Faith NRJ P3  │
└─────────────────────────────┘
```

- Ändra `max-h-[60%]` till `max-h-[50%]` på "Nästa lektion"-panelen
- Ta bort de två separata MetalPanel-komponenterna för verktyg och radio
- Skapa en kombinerad MetalPanel med titel "Verktyg"

### 2. Större verktygsikoner med tightare spacing
**Filer:** `CalculatorThumbnail.tsx`, `GeogebraLink.tsx`, `MattebokenLink.tsx`

Öka storlek för compact-läget:
- **CalculatorThumbnail:** `w-[50px]` → `w-[60px]`
- **GeogebraLink/MattebokenLink:** `w-[50px]` → `w-[60px]`, ikoner `w-8 h-8` → `w-10 h-10`, text `text-[7px]` → `text-[8px]`
- Minska gap i ApocalypticGradePage från `gap-3` till `gap-2` för tightare spacing

### 3. Lägg till två nya radiokanaler
**Fil:** `src/components/WebRadio.tsx`

Lägg till NRJ och P3 i channels-arrayen:

```typescript
{ 
  id: "nrj", 
  name: "NRJ", 
  emoji: "🎵", 
  description: "NRJ Sverige", 
  color: "from-red-500 to-yellow-500",
  streamUrl: "https://stream.nrj.se/nrj_se_mp3"
},
{ 
  id: "p3", 
  name: "P3", 
  emoji: "📻", 
  description: "Sveriges Radio P3", 
  color: "from-green-500 to-emerald-600",
  streamUrl: "https://sverigesradio.se/topsy/direkt/164-hi-mp3.m3u"
}
```

### 4. Kompaktare radioknappar för 6 kanaler
**Fil:** `src/components/WebRadio.tsx`

Justera compact-läget för att rymma 6 kanaler:
- Minska `min-w-[68px]` → `min-w-[52px]`
- Minska `text-3xl` → `text-2xl` för emojis
- Minska `text-xs` → `text-[9px]` för kanalnamn
- Minska `px-4 py-3` → `px-2 py-2`
- Minska `gap-4` → `gap-2`
- Ta bort den separata Radio-ikonen (sparar plats)

## Resulterande layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  Kapitel X — Titel  │  Nästa lektion (max 50%)  │  Planering Åk X         │
│  ─────────────────  │  ──────────────────────   │  ───────────────        │
│  Resurser           │  [Post-it innehåll]       │  [Kalender]             │
│  ...                │                           │                         │
│  ...                │  ──────────────────────   │                         │
│  ...                │  🧮 Verktyg               │                         │
│  ...                │  [Calc][Geo][Matte]       │                         │
│  ...                │  🧘🎸🎧✌🏼🎵📻 + 🔊      │                         │
│  ─────────────────  │                           │                         │
│  [Mascot]           │                           │                         │
└────────────────────────────────────────────────────────────────────────────┘
```

## Tekniska detaljer

### Nya stream-URLer
- **NRJ:** `https://stream.nrj.se/nrj_se_mp3` (direkt MP3-stream)
- **P3:** `https://sverigesradio.se/topsy/direkt/164-hi-mp3.m3u` (M3U, men kan behöva testas)

Alternativ P3-stream om M3U inte fungerar: `https://sverigesradio.se/topsy/direkt/164-hi-aac`

### Förväntade fördelar
1. Bättre visuell balans - en stor verktygsmodul vs en "Nästa lektion"-panel
2. Konsekvent stil med gemensam MetalPanel
3. Mer kompakt och effektiv användning av utrymmet
4. Verktyg och radio logiskt grupperade tillsammans
