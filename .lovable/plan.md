

# Komprimera lunchmenyn -- visa bara dagens lunch

## Vad andras

LunchMenu-komponenten visas idag som en lista med alla fem veckodagar. Den ska istallet bara visa **en rad** med dagens ratt (t.ex. "Ons: Pannkakor"), vilket gor panelen mycket kortare.

## Detaljerade andringar

**Fil: `src/components/LunchMenu.tsx`**

1. **Normalvy (ej redigering):** Istallet for att loopa genom alla fem dagar, filtrera ut enbart den dag som matchar `todayCapitalized`. Visa den som en enda rad: `dagnamn: ratt`. Om det ar helg (lordag/sondag) visas ett kort meddelande som "Ingen skollunch idag".

2. **Tom-vy:** Om det inte finns nagon meny inlagd for idag visas "Ingen meny inlagd for idag" med redigeringslanken (om inloggad).

3. **Redigeringslaget behalles som det ar** -- nar lararen redigerar ska alla fem dagar fortfarande visas sa att hela veckans meny kan laggas in.

4. **Minskad padding/margin:** Ta bort onodigt vertikalt utrymme (t.ex. minska `mb-3` till `mb-2` i headern och minska tomrummet i "ingen meny"-vyn).

## Resultat
Panelen gar fran att visa fem rader till att visa en enda rad, vilket sparar ca 60-70% av hojden pa startsidan.

