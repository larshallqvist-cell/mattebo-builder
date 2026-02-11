
# Begränsa inloggning till @leteboskolan.se

## Vad som ändras
Google-inloggningen begränsas så att bara konton med domänen `@leteboskolan.se` kan logga in. Elever och personal med privata Gmail-konton kommer inte kunna använda dem.

## Hur det fungerar
Google OAuth har en inbyggd parameter (`hd`) som filtrerar vilka konton som visas vid inloggning. Genom att sätta `hd: "leteboskolan.se"` visar Google bara skolkonton i inloggningsrutan.

---

## Tekniska detaljer

### Fil som ändras
**`src/contexts/AuthContext.tsx`** -- Lägg till `extraParams` med `hd`-begränsning i `signInWithGoogle`:

```typescript
const { error } = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin,
  extraParams: {
    hd: "leteboskolan.se",
  },
});
```

Ingen databasändring behövs. Ändringen är en enda rad kod.
