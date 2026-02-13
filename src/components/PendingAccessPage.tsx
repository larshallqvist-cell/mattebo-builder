import { LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const PendingAccessPage = () => {
  const { signOut, accessStatus } = useAuth();

  const isDenied = accessStatus === "denied";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-primary" />
        </div>

        {isDenied ? (
          <>
            <h1 className="text-2xl font-orbitron font-bold text-foreground">
              Åtkomst nekad
            </h1>
            <p className="text-muted-foreground font-nunito">
              Din förfrågan om åtkomst har nekats. Kontakta en administratör om du
              tror att detta är fel.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-orbitron font-bold text-foreground">
              Väntar på godkännande
            </h1>
            <p className="text-muted-foreground font-nunito">
              Tack! Din förfrågan om åtkomst har skickats. Du får tillgång så snart
              en administratör godkänner dig.
            </p>
          </>
        )}

        <Button onClick={signOut} variant="outline" className="gap-2">
          <LogOut className="w-4 h-4" />
          Logga ut
        </Button>
      </div>
    </div>
  );
};

export default PendingAccessPage;
