# Mattebo - Matematikresurs för skolan

En modern webbresurs för matematikundervisning byggd med React, TypeScript och Tailwind CSS.

## Kom igång lokalt

### Förutsättningar
- Node.js (version 18 eller senare)
- npm eller bun

### Installation

```bash
# Klona repot
git clone <din-repo-url>

# Gå till projektmappen
cd <projektnamn>

# Installera beroenden
npm install
```

### Lokal utveckling

```bash
# Starta utvecklingsservern
npm run dev
```

Öppna [http://localhost:8080](http://localhost:8080) i din webbläsare.

## Driftsättning (Deploy)

### Bygga för produktion

```bash
# Skapa produktionsbygge
npm run build
```

Detta skapar en `dist`-mapp med alla filer redo för driftsättning.

### Ladda upp till egen server

1. Kör `npm run build`
2. Ladda upp innehållet i `dist`-mappen till din webbserver
3. Konfigurera din server att servera `index.html` för alla routes (SPA-routing)

### Automatisk driftsättning med CI/CD

Rekommenderade tjänster som stöder automatisk deploy från GitHub:
- **Netlify** - Koppla repot och deploya automatiskt vid push
- **Vercel** - Samma princip, perfekt för React-appar
- **GitHub Pages** - Gratis hosting direkt från repot

## Tekniker

- **React 18** - UI-bibliotek
- **TypeScript** - Typad JavaScript
- **Vite** - Byggverktyg och dev-server
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - UI-komponenter
- **Framer Motion** - Animationer

## Projektstruktur

```
src/
├── components/     # React-komponenter
├── pages/          # Sidkomponenter
├── hooks/          # Custom React hooks
├── assets/         # Bilder och resurser
├── lib/            # Hjälpfunktioner
└── integrations/   # API-integrationer
```
