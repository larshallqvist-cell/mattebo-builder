import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type Details = {
  client?: { name?: string; client_name?: string; redirect_uri?: string; uri?: string } | null;
  redirect_uri?: string;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type Result = { data: Details | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<Result>;
  approveAuthorization: (id: string) => Promise<Result>;
  denyAuthorization: (id: string) => Promise<Result>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const SCOPE_LABELS: Record<string, string> = {
  openid: "Bekräfta vem du är",
  email: "Dela din e-postadress",
  profile: "Dela din grundläggande profil",
};

/** Consent page for external assistants (MCP clients) asking to use Mattebo as the signed-in user. */
const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const { user, loading, signInWithGoogle } = useAuth();
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authorizationId) { setError("Länken saknar ett godkännande-id. Starta anslutningen igen från din assistent."); return; }
    if (loading || !user) return;
    let active = true;
    (async () => {
      try {
        const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError("Förfrågan har gått ut eller är ogiltig. Starta anslutningen igen.");
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) { window.location.href = immediate; return; }
        setDetails(data);
      } catch {
        if (active) setError("Kunde inte hämta förfrågan. Försök igen om en stund.");
      }
    })();
    return () => { active = false; };
  }, [authorizationId, user, loading]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorizationId)
        : await oauth().denyAuthorization(authorizationId);
      const target = data?.redirect_url ?? data?.redirect_to;
      if (error || !target) {
        setBusy(false);
        return setError(approve ? "Det gick inte att godkänna. Försök igen." : "Det gick inte att avbryta. Försök igen.");
      }
      window.location.href = target;
    } catch {
      setBusy(false);
      setError("Något gick fel. Försök igen.");
    }
  };

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "En app";
  const redirect = details?.client?.redirect_uri ?? details?.redirect_uri ?? details?.client?.uri;
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  let body: JSX.Element;
  if (error) body = <p className="text-sm text-destructive">{error}</p>;
  else if (loading) body = <p className="text-sm text-muted-foreground">Laddar …</p>;
  else if (!user) body = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Logga in för att fortsätta anslutningen.</p>
      <Button className="w-full" onClick={() => signInWithGoogle(window.location.pathname + window.location.search)}>Logga in med Google</Button>
    </div>
  );
  else if (!details) body = <p className="text-sm text-muted-foreground">Laddar …</p>;
  else body = (
    <div className="space-y-4">
      <p className="text-sm">{clientName} kommer att kunna använda Mattebos verktyg som du, medan du är inloggad.</p>
      <p className="text-xs text-muted-foreground">Inloggad som <b className="text-foreground">{user.email}</b></p>
      {redirect && <p className="break-all text-xs text-muted-foreground">Skickar tillbaka till: {redirect}</p>}
      {scopes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {scopes.map((s) => <li key={s}>{SCOPE_LABELS[s] ?? `Ytterligare behörighet: ${s}`}</li>)}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Det här kringgår inte Mattebos behörigheter – du ser bara det du redan får se i appen.</p>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>Godkänn</Button>
        <Button className="flex-1" variant="outline" disabled={busy} onClick={() => decide(false)}>Avbryt anslutningen</Button>
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 font-manrope">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-accent" />
          <h1 className="font-sora text-lg font-bold">
            {details ? `Anslut ${clientName} till Mattebo` : "Anslut en app till Mattebo"}
          </h1>
        </div>
        {body}
      </div>
    </main>
  );
};

export default OAuthConsent;
