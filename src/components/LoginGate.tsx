import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import PendingAccessPage from "@/components/PendingAccessPage";

interface LoginGateProps {
  children: React.ReactNode;
}

const LoginGate = ({ children }: LoginGateProps) => {
  const { user, loading, accessStatus, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(205, 127, 50, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(64, 224, 208, 0.05) 0%, transparent 50%),
            linear-gradient(180deg, hsl(150 20% 12%) 0%, hsl(160 25% 8%) 100%)
          `,
        }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(205, 127, 50, 0.15)",
              boxShadow: "0 0 30px rgba(205, 127, 50, 0.2)",
            }}
          >
            <LogIn className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-orbitron font-bold text-foreground">
            Logga in för att fortsätta
          </h1>
          <p className="text-muted-foreground font-nunito leading-relaxed">
            Du behöver logga in med ditt Google-konto för att komma åt
            materialet. Dina framsteg sparas automatiskt!
          </p>

          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="gap-2 font-nunito text-base"
          >
            <LogIn className="w-5 h-5" />
            Logga in med Google
          </Button>

          <p className="text-xs text-muted-foreground/60 font-nunito">
            Skolkonton (@leteboskolan.se) godkänns direkt.
            <br />
            Andra konton behöver godkännas av läraren.
          </p>
        </div>
      </div>
    );
  }

  // User is logged in but access not yet approved
  if (accessStatus === "pending" || accessStatus === "denied") {
    return <PendingAccessPage />;
  }

  // User is logged in and approved (or still loading access status)
  return <>{children}</>;
};

export default LoginGate;
