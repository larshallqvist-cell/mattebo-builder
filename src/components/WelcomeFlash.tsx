import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

const SESSION_KEY = "mattebo_welcome_shown";

const WelcomeFlash = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [activityCount, setActivityCount] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Get display name from profile
    const firstName =
      user.user_metadata?.full_name?.split(" ")[0] ||
      user.user_metadata?.name?.split(" ")[0] ||
      "";

    setDisplayName(firstName);

    // Fetch activity count
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        setActivityCount(count ?? 0);
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "1");
      });
  }, [user]);

  // Auto-dismiss after 5s
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-lg"
          onClick={() => setVisible(false)}
        >
          <div
            className="rounded-2xl px-7 py-6 shadow-2xl border border-primary/30 backdrop-blur-md cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--background) / 0.92), hsl(var(--muted) / 0.85))",
              boxShadow:
                "0 0 40px hsl(var(--primary) / 0.2), 0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-start gap-4">
              <Sparkles
                className="w-8 h-8 flex-shrink-0 mt-0.5"
                style={{ color: "hsl(var(--neon-copper))" }}
              />
              <div className="space-y-2 font-nunito">
                <p className="text-lg font-bold text-foreground">
                  Kul att du är här, {displayName}!
                </p>
                {activityCount !== null && activityCount > 0 ? (
                  <p className="text-sm text-foreground/80 leading-snug">
                    Du har öppnat{" "}
                    <span
                      className="font-bold"
                      style={{ color: "hsl(var(--neon-copper))" }}
                    >
                      {activityCount} {activityCount === 1 ? "resurs" : "resurser"}
                    </span>{" "}
                    hittills. Bra jobbat, du blir säkrare för varje gång!
                  </p>
                ) : (
                  <p className="text-sm text-foreground/80 leading-snug">
                    Börja utforska material så håller vi koll på dina framsteg!
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeFlash;
