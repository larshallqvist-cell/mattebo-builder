# Memory: style/visual-elements/animations-v6-swe
Updated: 2026-02-05

## Animationsöversikt

Mattebo använder ett omfattande animationssystem byggt med framer-motion och CSS keyframes för det post-apokalyptiska temat.

### Sidövergångar
- **MetalDoorTransition**: Dramatiska metalliska dörrar som glider isär vid navigering mellan sidor. Två paneler med rostigt metallutseende, nitar, handtag och neonkoppar-glödkanter. Triggas endast vid faktiska ruttändringar, inte vid initial laddning.

### Partikeleffekter
- **DustParticles**: Svävande dammpartiklar i bakgrunden (koppar, brons, rost, grå)
- **SparkParticles**: Gnistpartiklar vid hover på MetalPanel och ApocalypticGradeCard. Animerade med framer-motion.
- **ChalkDust**: Kritdammpartiklar vid klick på interaktiva element

### Hover-effekter
- **CRT Glitch (.glitch-hover)**: Retro-glitch-effekt på rubriker vid hover. RGB-separation och subtil förskjutning.
- **Neon Pulse (.neon-pulse, .neon-pulse-hover)**: Pulserande neonglöd på knappar och interaktiva element.
- **Floating animation (.animate-float)**: Svävande animation på årskurskort på startsidan.
- **Impatient letters (.animate-impatient)**: Rastlös bokstavsanimation för HandwrittenText.

### Komponentspecifika animationer
- **ApocalypticGradeCard**: Skalning, neonglöd-intensifiering och gnistpartiklar vid hover.
- **MetalPanel**: Gnistpartiklar vid hover (valfritt via showSparks-prop), glödkant-förstärkning.
- **Button**: neon-pulse-hover på default-varianten för taktil feedback.
- **HandwrittenText**: Bokstav-för-bokstav inträdesanimation med Orbitron-font.

### Scrollbar
- **industrial-scrollbar**: Animerad scrollbar med kopparglöd och pulsering.

### Respekt för användarpreferenser
Alla animationer respekterar `prefers-reduced-motion: reduce` via CSS media query.

### Tekniska detaljer
- framer-motion används för komplexa animationer (partiklar, sidövergångar)
- CSS keyframes för enklare effekter (glitch, pulse, float)
- AnimatePresence hanterar exit-animationer
- useLocation för att trigga sidövergångar vid ruttändringar
