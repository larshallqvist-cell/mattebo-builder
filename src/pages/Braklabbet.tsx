import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, LogIn, ShieldX } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PRIVATE_BRAKLABBET_URL } from "@/config/app";
import { canShowLab, labAccountKey, parseMissionMessage } from "@/lib/braklabbetGate";
import { useBraklabbetTraining } from "@/hooks/useBraklabbetTraining";

type LabState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; html: string; key: string }
  | { kind: "denied"; reason: string }
  | { kind: "error" };

const DENY_TEXT: Record<string, string> = {
  denied: "Ditt konto har spärrats från Mattebo. Prata med din lärare.",
  wrong_domain: "Bråklabbet är bara öppet för skolkonton som slutar på @leteboskolan.se.",
  not_google: "Logga in med ditt Google-skolkonto för att öppna Bråklabbet.",
  unverified: "Ditt Google-konto kunde inte bekräftas som skolkonto.",
};

const Braklabbet = () => {
  const { user, loading, isAdmin, signInWithGoogle, signOut } = useAuth();
  const [lab, setLab] = useState<LabState>({ kind: "idle" });
  const [missions, setMissions] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const userId = user?.id ?? null;
  const accountKey = labAccountKey(userId, user?.email);
  useBraklabbetTraining(userId, iframeRef, canShowLab(lab, accountKey, loading));

  useEffect(() => {
    document.title = "Bråklabbet – Mattebo";
  }, []);

  // Fetch the protected lab document for the current account; reset whenever the account changes.
  useEffect(() => {
    setLab({ kind: accountKey ? "loading" : "idle" });
    if (!accountKey) return;
    const key = accountKey;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("braklabbet-content", { method: "POST" });
      if (cancelled) return;
      if (!error && typeof data?.html === "string") {
        setLab({ kind: "ready", html: data.html, key });
        return;
      }
      if (error instanceof FunctionsHttpError) {
        const status = error.context.status;
        let reason = "";
        try {
          reason = (await error.context.json())?.reason ?? "";
        } catch {
          /* ignore */
        }
        if (cancelled) return;
        if (status === 403) return setLab({ kind: "denied", reason });
        if (status === 401) return setLab({ kind: "denied", reason: "not_google" });
      }
      setLab({ kind: "error" });
    })();
    return () => {
      cancelled = true;
    };
  }, [accountKey]);

  // The sandboxed lab iframe has no storage or tokens, so mission progress
  // travels over postMessage: the parent owns persistence in braklabbet_progress.
  useEffect(() => {
    if (!userId) {
      setMissions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("braklabbet_progress")
        .select("mission_id")
        .eq("user_id", userId);
      if (!cancelled) setMissions((data ?? []).map((r) => r.mission_id));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame || event.source !== frame || !userId) return;
      const missionId = parseMissionMessage(event.data);
      if (!missionId) return;
      void supabase
        .from("braklabbet_progress")
        .upsert({ user_id: userId, mission_id: missionId }, { onConflict: "user_id,mission_id" })
        .then(({ error }) => {
          if (!error) setMissions((prev) => (prev.includes(missionId) ? prev : [...prev, missionId]));
        });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [userId]);

  // Send the saved missions whenever they load or the iframe (re)loads.
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "braklabbet:missions", completed: missions }, "*");
  }, [missions]);

  const signedOut = !loading && !user;

  return (
    <div className="lab-shell flex h-[100dvh] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-5">
        <Link
          to="/"
          className="lab-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-nunito transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till Mattebo
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <a
              href={PRIVATE_BRAKLABBET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lab-chip inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-nunito"
              title="Öppnar det privata Bråklabbet i en ny flik (ChatGPT-inloggning krävs)"
              aria-label="Privata Bråklabbet – öppnas i ny flik, ChatGPT-inloggning krävs"
            >
              Lärarversion <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {user && (
            <button type="button" onClick={signOut} className="lab-chip rounded-full px-3 py-2 text-xs font-nunito">
              Logga ut
            </button>
          )}
        </div>
      </header>

      <main className="min-h-0 flex-1 px-2 pb-2 sm:px-3 sm:pb-3">
        {canShowLab(lab, accountKey, loading) && lab.kind === "ready" ? (
          <iframe
            ref={iframeRef}
            key={lab.key}
            srcDoc={lab.html}
            onLoad={() => {
              iframeRef.current?.contentWindow?.postMessage(
                { type: "braklabbet:missions", completed: missions },
                "*",
              );
            }}
            title="Bråklabbet"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            className="lab-frame h-full w-full rounded-2xl"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4">
            <div className="lab-card w-full max-w-md rounded-3xl p-8 text-center">
              <h1 className="font-orbitron text-3xl font-bold">Bråklabbet</h1>
              {(loading || lab.kind === "loading") && (
                <div className="mt-6 flex items-center justify-center gap-2 font-nunito" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" /> Kontrollerar ditt konto…
                </div>
              )}
              {signedOut && (
                <>
                  <p className="lab-muted mt-4 font-nunito">
                    Bygg, jämför och räkna med bråk. Öppet för elever på Leteboskolan.
                  </p>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle("/braklabbet")}
                    className="lab-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-nunito text-base font-semibold"
                  >
                    <LogIn className="h-5 w-5" />
                    Logga in med ditt skolkonto
                  </button>
                  <p className="lab-muted mt-3 text-xs font-nunito">Använd ditt @leteboskolan.se-konto.</p>
                </>
              )}
              {lab.kind === "denied" && (
                <>
                  <ShieldX className="mx-auto mt-6 h-10 w-10" aria-hidden="true" />
                  <p className="mt-3 font-nunito">{DENY_TEXT[lab.reason] ?? DENY_TEXT.wrong_domain}</p>
                  <p className="lab-muted mt-2 text-sm font-nunito">Inloggad som {user?.email}</p>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      signInWithGoogle("/braklabbet");
                    }}
                    className="lab-primary mt-6 rounded-full px-5 py-2.5 font-nunito font-semibold"
                  >
                    Byt till skolkontot
                  </button>
                </>
              )}
              {lab.kind === "error" && (
                <p className="mt-6 font-nunito">Bråklabbet kunde inte laddas just nu. Ladda om sidan och försök igen.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Braklabbet;
