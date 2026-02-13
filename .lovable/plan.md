

# Tillgångsförfrågan -- "Be om lov att komma in"

## Sammanfattning
Just nu kan bara konton med `@leteboskolan.se` logga in. Vi bygger ett system där vem som helst kan logga in med Google, men om deras e-postadress inte är godkänd hamnar de i ett "vänterum". Du (Lars) ser en lista med väntande förfrågningar och kan godkänna eller neka dem.

## Hur det fungerar

1. **Inloggning öppnas för alla Google-konton** -- vi tar bort `hd`-begränsningen.
2. **Efter inloggning** kontrolleras om användaren är godkänd:
   - `@leteboskolan.se`-konton godkänns automatiskt.
   - Andra konton hamnar i status "pending" (väntar på godkännande).
3. **Väntande användare** ser ett meddelande: "Din förfrågan har skickats. Du får tillgång när en administratör godkänner dig."
4. **Du som admin** ser en enkel admin-vy (ny sida `/admin`) där du kan godkänna eller neka väntande användare.

## Teknisk plan

### 1. Ny databastabell: `access_requests`

```sql
create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  full_name text,
  status text not null default 'pending', -- 'pending', 'approved', 'denied'
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  unique(user_id)
);

alter table public.access_requests enable row level security;
```

RLS-policyer:
- Alla autentiserade kan se sin egen rad (för att veta sin status).
- Admins kan läsa alla rader och uppdatera status.

### 2. Admin-roller via `user_roles`-tabell

```sql
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);

alter table public.user_roles enable row level security;
```

En `has_role`-funktion (security definer) för att använda i RLS-policyer.

Du (Lars) läggs till som admin via en migration baserat på din befintliga user-id.

### 3. Databaslogik: automatisk hantering vid inloggning

En databasfunktion/trigger eller klientlogik som:
- Vid inloggning kollar om e-posten slutar på `@leteboskolan.se` -- sätter automatiskt status `approved`.
- Annars skapar en rad med status `pending`.

### 4. AuthContext-ändringar

- Ta bort `hd: "leteboskolan.se"` från OAuth-anropet så alla Google-konton kan logga in.
- Efter inloggning: hämta användarens `access_requests`-status.
- Exponera `accessStatus` (`approved` / `pending` / `denied` / `loading`) i kontexten.

### 5. Ny komponent: `PendingAccessPage`

En sida/vy som visas för användare med `pending`-status:
- "Tack! Din förfrågan om åtkomst har skickats."
- "Du får tillgång så snart en administratör godkänner dig."
- Knapp för att logga ut.

### 6. Skydd i appen

I navigeringen och på skyddade sidor: om `accessStatus !== 'approved'`, visa `PendingAccessPage` istället för det skyddade innehållet. Publikt innehåll (startsidan, åk-sidorna) förblir tillgängligt för alla.

### 7. Admin-sida (`/admin`)

En enkel sida (bara synlig för admin-rollen) som visar:
- Lista med väntande förfrågningar (namn, e-post, datum).
- Knappar för "Godkänn" och "Neka".
- Lista med redan godkända användare.

### 8. Filöversikt

| Fil | Ändring |
|-----|---------|
| `src/contexts/AuthContext.tsx` | Ta bort `hd`-param, lägg till accessStatus-logik |
| `src/components/LoginButton.tsx` | Eventuellt uppdatera hjälptext |
| `src/components/ApocalypticNav.tsx` | Uppdatera texten "skolkonto" till mer generell |
| `src/components/PendingAccessPage.tsx` | Ny -- väntesida |
| `src/pages/Admin.tsx` | Ny -- admin-panel för godkännande |
| `src/App.tsx` | Lägg till `/admin`-rutt |
| Databasmigration | `access_requests`, `user_roles`, `has_role`-funktion, RLS-policyer, seed admin-roll |

