# Autentisering med Google OAuth via Supabase

## Översikt
Denna applikation använder Supabase Auth för att hantera autentisering med Google OAuth. Detta gör att elever och lärare kan logga in med sina Google-konton från skolan.

## Konfiguration i Supabase Dashboard

### Steg 1: Skapa Google OAuth-app
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa ett nytt projekt eller välj ett befintligt
3. Aktivera Google+ API
4. Gå till "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Välj "Web application"
6. Lägg till dessa Authorized redirect URIs:
   - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - För utveckling: `http://localhost:8080/auth/v1/callback`
7. Kopiera Client ID och Client Secret

### Steg 2: Konfigurera i Supabase
1. Gå till din Supabase Dashboard
2. Navigera till Authentication > Providers
3. Leta upp "Google" i listan över providers
4. Aktivera Google provider
5. Klistra in Client ID och Client Secret från Google
6. Klicka på "Save"

### Steg 3: Konfigurera domänbegränsning (valfritt)
Om du bara vill tillåta inloggning från specifika Google Workspace-domäner (t.ex. @leteboskolan.se):
1. I Supabase Dashboard, gå till Authentication > Settings
2. Under "Email Auth", lägg till domänbegränsningar
3. Alternativt kan du implementera custom authorization hooks

## Teknisk implementation

### Struktur
- **AuthContext** (`src/contexts/AuthContext.tsx`): Hanterar autentiseringstillstånd
- **LoginButton** (`src/components/LoginButton.tsx`): Knapp för att logga in
- **UserMenu** (`src/components/UserMenu.tsx`): Meny för inloggade användare
- **Supabase Client** (`src/integrations/supabase/client.ts`): Konfigurerad Supabase-klient

### Funktionalitet
- ✅ Google OAuth-inloggning
- ✅ Sessionhantering (persistent med localStorage)
- ✅ Automatisk tokenuppdatering
- ✅ Skydd av känsliga funktioner (t.ex. lunchmeny-redigering)
- ✅ Användarinformation i navigation
- ✅ Utloggning

### Användning i komponenter

#### Använda auth i en komponent:
```typescript
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  
  if (loading) return <div>Laddar...</div>;
  
  return user ? (
    <div>
      <p>Välkommen {user.email}</p>
      <button onClick={signOut}>Logga ut</button>
    </div>
  ) : (
    <button onClick={signInWithGoogle}>Logga in</button>
  );
};
```

#### Skydda funktionalitet:
```typescript
const ProtectedFeature = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <p>Du måste logga in för att se detta innehåll</p>;
  }
  
  return <div>Skyddat innehåll...</div>;
};
```

## Säkerhet

### Befintliga säkerhetsåtgärder:
- Session-tokens lagras säkert i localStorage
- Automatisk tokenuppdatering
- HTTPS används i produktion
- OAuth 2.0-standard följs

### Rekommendationer:
1. Konfigurera Row Level Security (RLS) i Supabase för databastabeller
2. Implementera rate limiting för inloggningsförsök
3. Överväg att aktivera Multi-Factor Authentication (MFA)
4. Logga och övervaka autentiseringsförsök

## Utveckling och testning

### Lokal utveckling:
1. Se till att miljövariabler är konfigurerade i `.env`:
   ```
   VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=[YOUR-ANON-KEY]
   ```

2. Starta utvecklingsservern:
   ```bash
   npm run dev
   ```

3. Testa inloggning på `http://localhost:8080`

### Testning:
- Testa på både desktop och mobil
- Verifiera att sessionen persistas vid siduppdatering
- Kontrollera att skyddade funktioner inte är tillgängliga utan inloggning
- Testa utloggning

## Felsökning

### Problem: "OAuth callback error"
- Kontrollera att redirect URIs är korrekt konfigurerade i både Google Cloud Console och Supabase
- Se till att domänen matchar exakt (inklusive http/https och port)

### Problem: "User not authorized"
- Kontrollera att Google provider är aktiverad i Supabase
- Verifiera att Client ID och Client Secret är korrekta
- Kontrollera att användaren har ett giltigt Google-konto

### Problem: Session försvinner vid siduppdatering
- Kontrollera att localStorage är aktiverat i webbläsaren
- Se till att `persistSession: true` är satt i Supabase-klienten

## Framtida förbättringar

### Potentiella tillägg:
- [ ] Role-based access control (RBAC) för olika användartyper (elever vs. lärare)
- [ ] Admin-panel för användarhantering
- [ ] Logga användaraktivitet
- [ ] Implementera "Kom ihåg mig"-funktionalitet
- [ ] Lägg till fler OAuth-providers (Microsoft, Apple, etc.)
- [ ] Implementera passwordless email login som backup

## Support och dokumentation

### Användbara länkar:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)

### Kontakt:
För frågor eller problem, kontakta utvecklingsteamet.
