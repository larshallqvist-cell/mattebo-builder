import { useState } from "react";
import MetalPanel from "./MetalPanel";
import { UtensilsCrossed, AlertTriangle } from "lucide-react";

const LunchMenu = () => {
  const [loadError, setLoadError] = useState(false);

  return (
    <MetalPanel className="h-full">
      <div className="flex items-center gap-2 mb-2">
        <UtensilsCrossed className="w-4 h-4 text-neon-copper" />
        <h3 className="font-display text-sm text-foreground">Skollunch</h3>
      </div>
      
      {loadError ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs text-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <p>Schoolsoft blockerar inbäddning.</p>
          <a 
            href="https://sms.schoolsoft.se/letebo/jsp/teacher/right_teacher_lunchmenu.jsp?requestid=6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-copper hover:underline"
          >
            Öppna i ny flik →
          </a>
        </div>
      ) : (
        <div className="relative w-full h-40 bg-background/50 rounded overflow-hidden">
          <iframe
            src="https://sms.schoolsoft.se/letebo/jsp/teacher/right_teacher_lunchmenu.jsp?requestid=6"
            className="w-full h-full border-0"
            title="Skollunch"
            onError={() => setLoadError(true)}
            sandbox="allow-same-origin"
          />
          {/* Fallback message if iframe loads but content is blocked */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 animate-pulse">
            <span className="text-xs text-muted-foreground">Laddar...</span>
          </div>
        </div>
      )}
    </MetalPanel>
  );
};

export default LunchMenu;
