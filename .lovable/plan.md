

# Fix: Google-inloggning - "provider is not enabled"

## Problem
Koden anropar `supabase.auth.signInWithOAuth({ provider: "google" })` direkt, men Google-providern ar inte konfigurerad i backend. Lovable Cloud hanterar Google OAuth automatiskt via sin egen modul.

## Losning

### Steg 1: Konfigurera Google OAuth via Lovable Cloud
Anvand verktyget `configure-social-auth` for att aktivera Google-inloggning. Detta genererar automatiskt modulen `src/integrations/lovable/` med ratt konfiguration.

### Steg 2: Uppdatera AuthContext.tsx
Byt ut det nuvarande Supabase-anropet mot Lovable Clouds autentiseringsmodul:

**Fore:**
```typescript
import { supabase } from "@/integrations/supabase/client";
// ...
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/` },
});
```

**Efter:**
```typescript
import { lovable } from "@/integrations/lovable/index";
// ...
const { error } = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin,
});
```

Resten av AuthContext (session-hantering, signOut, onAuthStateChange) behalles som det ar -- de anvander Supabase-klienten korrekt.

### Steg 3: Verifiera
Testa inloggningsknappen i forhandsgranskningsfonstret for att bekrafta att Google OAuth-flodet fungerar.

## Paverkade filer
- `src/contexts/AuthContext.tsx` -- byt signInWithOAuth-anropet
- `src/integrations/lovable/` -- genereras automatiskt av verktyget

## Inga andra andringar behovs
LoginButton, UserMenu och ovriga komponenter anvander `useAuth()` och paverkas inte.

