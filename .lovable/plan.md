

# Valkomstflash med aktivitetssparning

## Oversikt

Nar en inloggad elev besöker sidan visas en kort välkomstanimation med deras namn och hur aktiva de har varit. Aktivitet mäts genom **resurslänksklick** (videor, övningar, spel) -- inte bara inloggningstid. Det betyder att man faktiskt måste jobba för att samla poäng.

## Vad som räknas som aktivitet

Varje gång en elev klickar på en resurslänk (video, övningsuppgift, spel etc.) i ResourceAccordion loggas det som en aktivitetshändelse i databasen. Det här är svårt att fuska med -- man måste faktiskt öppna material för att det ska räknas.

Välkomstmeddelandet visar sedan:
- "Kul att du är här, **Anna**!"
- "Du har öppnat **47 resurser** hittills. Bra jobbat, du blir säkrare för varje gång!"

(Alternativt kan vi kalla det "aktivitetspoäng" istället för "resurser" om du vill.)

## Hur det fungerar

1. Eleven loggar in och besöker en årskurssida
2. En animerad välkomstruta glider in (auto-stängs efter ca 5 sekunder)
3. Varje klick på en resurslänk sparas i bakgrunden
4. Nästa gång eleven besöker sidan visas det uppdaterade antalet

## Eventuell topplista

Eftersom vi räknar faktiska klick på lärresurser blir en topplista meningsfull -- man kan inte bara logga in och vänta. Den som klickar mest på videor och övningar hamnar högst. (Topplistan kan byggas som ett separat steg senare.)

---

## Tekniska detaljer

### 1. Ny databastabell: `activity_logs`

```sql
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  grade integer NOT NULL,
  chapter integer,
  resource_title text,
  resource_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Användare kan läsa sina egna loggar
CREATE POLICY "Users can read own activity"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Användare kan logga sin egen aktivitet
CREATE POLICY "Users can insert own activity"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 2. Ny komponent: `WelcomeFlash.tsx`

- Visas som en animerad overlay/toast vid sidladdning (framer-motion)
- Hämtar användarens namn från `useAuth()` och totalantal från `activity_logs`
- Visar meddelandet i ca 5 sekunder, sedan glider den bort
- Visas max en gång per session (sparas i sessionStorage)

### 3. Ändring i `ResourceAccordion.tsx`

- I onClick-hanteraren för resurslänkar: anropa en funktion som skriver en rad till `activity_logs` (med user_id, grade, chapter, resource_title, resource_url)
- Bara för inloggade användare -- anonyma besökare loggas inte

### 4. Ändring i `ApocalypticGradePage.tsx`

- Importera och rendera `WelcomeFlash` inuti sidan, villkorat på att användaren är inloggad

### Filer som skapas/ändras

| Fil | Aktion |
|---|---|
| `src/components/WelcomeFlash.tsx` | Ny |
| `src/components/ResourceAccordion.tsx` | Ändra onClick för att logga aktivitet |
| `src/components/ApocalypticGradePage.tsx` | Lägg till WelcomeFlash |
| Databasmigration | Ny tabell `activity_logs` |
| `src/integrations/supabase/types.ts` | Uppdateras automatiskt |

