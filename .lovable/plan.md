

# Plan: Inloggningsskylt och användaröversikt

## Vad som ska göras

### 1. "Logga in med ditt skolkonto"-skylt
En liten ledtext visas bredvid login-knappen i navigeringen, så att elever forstår att de ska använda sitt skolkonto. Texten syns bara när man inte är inloggad.

### 2. Spara inloggade användare i databasen
En ny tabell skapas som automatiskt sparar namn och e-post for varje ny användare som loggar in. Du kan sedan se alla som loggat in via databasen i Lovable Cloud.

---

## Tekniska detaljer

### Databasändring (migration)
Skapa en `profiles`-tabell:
- `id` (uuid, kopplad till auth.users)
- `email` (text)
- `full_name` (text)
- `avatar_url` (text)
- `created_at` / `updated_at` (timestamps)

En databas-trigger skapas som automatiskt lägger till en rad i `profiles` varje gång en ny användare loggar in for forsta gången. Trigger-funktionen läser metadata från Google OAuth (namn, bild, e-post).

RLS-policy: Alla autentiserade användare kan läsa profiler, men bara sin egen kan uppdateras.

### UI-ändring i `ApocalypticNav.tsx`
Nar användaren inte är inloggad visas texten "Logga in med ditt skolkonto" bredvid login-knappen. På mobil kan texten kortas eller doljas for att spara plats.

### Filer som ändras
- `supabase/migrations/` — ny migration for `profiles`-tabell + trigger
- `src/components/ApocalypticNav.tsx` — lägga till ledtext vid login-knappen
- `src/integrations/supabase/types.ts` — uppdateras automatiskt

