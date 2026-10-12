import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PRIVATE_BRAKLABBET_URL } from "@/config/app";

// Official, frame-embeddable Polypad (Mathigon/Amplify). The full app at /p blocks iframes.
const POLYPAD_EMBED_URL = "https://polypad.amplify.com/embed";

const Braklabbet = () => {
  const { isAdmin } = useAuth();
  useEffect(() => {
    document.title = "Bråklabbet – Mattebo";
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary/60 px-4 py-2 text-sm font-nunito text-foreground hover:bg-primary/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till Mattebo
        </Link>
        <h1 className="font-orbitron text-xl sm:text-2xl font-bold text-accent">Bråklabbet</h1>
        <div className="flex items-center gap-1 sm:gap-3">
          {isAdmin && (
            <span className="inline-flex items-center gap-1.5">
              <a
                href={PRIVATE_BRAKLABBET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-2 text-xs font-nunito text-accent transition-colors hover:bg-accent/10"
                title="Öppnar det privata Bråklabbet i en ny flik (ChatGPT-inloggning krävs)"
                aria-label="Privata Bråklabbet – öppnas i ny flik, ChatGPT-inloggning krävs"
              >
                Öppna nya Bråklabbet <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="hidden text-[11px] text-muted-foreground lg:inline">
                Privat · ChatGPT-inloggning
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => window.open("https://polypad.amplify.com/p", "_blank", "noopener")}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-nunito text-muted-foreground hover:text-foreground transition-colors"
          >
            Öppna i ny flik <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      <main className="flex-1 min-h-0 px-2 pb-2 sm:px-3 sm:pb-3">
        <iframe
          src={POLYPAD_EMBED_URL}
          title="Polypad – bråkverktyg"
          className="h-full w-full rounded-2xl border border-primary/20 bg-card"
          allow="fullscreen; clipboard-read; clipboard-write"
          allowFullScreen
        />
      </main>
    </div>
  );
};

export default Braklabbet;
