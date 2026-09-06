# Låsa upp IPad-cachen + escape-knapp för framtiden

## Bakgrund (verifierat)
Publicerad kod på mattebo.com är **1.7.1** — alltså den senaste versionen med fällbara admin-sektioner. iPads problem är därför en ren cache- ockyrsation, inte en opublicerad ändring.

Rotorsak: iOS PWA-cachen håller kvar en gammal service worker. Den gamla JS:en har gammalt `APP_VERSION`, som matchar det sparade `seen`-värdet i `localStorage`, så `purgeStaleCaches` i `src/pwa.ts` avbryter på rad 25 och hämtar aldrig ny kod. Kodändringar kan inte nå en redan fastnad service worker — bara en manuell rens på enheten låser upp den nuvarande situationen.

## 1. Manuellt på iPaden (låser upp NU)
Detta är det enda som garanterat låser upp en redan fastnad iOS-PWA:

1. Ta bort Mattebo-ikonen från hemskärmen (lång tryck → Ta bort app).
2. Inställningar → Safari → Avancerat → Webbplatsdata → sök "mattebo" → svep och radera (gör samma för "lovable.app" om det finns).
3. Inställningar → Safari → Rensa historik och webbplatsdata (säkrast).
4. Starta om iPaden.
5. Öppna Safari → mattebo.com → Lägg till på hemskärmen igen.

Därefter har du 1.7.1. Bekräfta genom att kolla att Admin-sidan har de fällbara sektionerna.

## 2. Kod: escape-knapp så du slipper iOS-inställningar nästa gång
Lägg till en "Tvinga uppdatering"-knapp i admin-huvudet (vid postlådelampan i `src/pages/Admin.tsx`) som körs helt på klienten:
- Avregistrerar alla service workers (`navigator.serviceWorker.getRegistrations()` → `unregister()`).
- Tömmer alla `caches`-poster.
- Rensar `localStorage`-nyckeln `mattebo-app-version`.
- `window.location.reload()`.

Detta ger en knapptryckning inifrån appen som alltid låser upp en fastnad cache — utan att behöva gräva i iOS-inställningar.

## 3. Kod: version-bump + publicera
- `src/lib/version.ts` → `1.8.0`, datum `2026-09-06` (minor: ny escape-knapp).
- `package.json` → `1.8.0`.
- Publicera appen till mattebo.com.

När 1.8.0 är live och du har rensat iPaden enligt steg 1, kör `purgeStaleCaches` korrekt vid nästa versionsbytte därefter, och escape-knappen finns till hands om det ändå fastnar igen.

## Teknisk detalj
- Ny knapp i `src/pages/Admin.tsx` (vid `Mail`-lampan, `ml-auto`-raden): `<Button variant="ghost" size="icon" onClick={forceUpdate}>` med `RefreshCw`-ikon, `title="Tvinga uppdatering"`.
- `forceUpdate`-funktionen flyttas till `src/pwa.ts` som `export async function forceAppUpdate()` så den kan återanvändas, och Admin-knappen importerar den.
- Ingen databas- eller backend-ändring. Ingen ny edge-funktion.
