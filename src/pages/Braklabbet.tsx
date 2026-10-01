import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

// Official, frame-embeddable Polypad (Mathigon/Amplify). The full app at /p blocks iframes.
const POLYPAD_EMBED_URL = "https://polypad.amplify.com/embed";

const Braklabbet = () => {
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
        <button
          type="button"
          onClick={() => window.open("https://polypad.amplify.com/p", "_blank", "noopener")}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-nunito text-muted-foreground hover:text-foreground transition-colors"
        >
          Öppna i ny flik <ExternalLink className="h-3.5 w-3.5" />
        </button>
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
