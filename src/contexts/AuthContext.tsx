import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";

type AccessStatus = "loading" | "approved" | "pending" | "denied" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accessStatus: AccessStatus;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchAccessStatus = async (userId: string, email: string) => {
    setAccessStatus("loading");

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const admin = roleData?.some((r: any) => r.role === "admin") ?? false;
    setIsAdmin(admin);

    // Check access request
    const { data, error } = await supabase
      .from("access_requests")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setAccessStatus(data.status as AccessStatus);
    } else {
      // No row yet — create one (for users who signed up before trigger existed)
      const isSchool = email.endsWith("@leteboskolan.se");
      const newStatus = isSchool ? "approved" : "pending";

      await supabase.from("access_requests").insert({
        user_id: userId,
        email,
        full_name: "",
        status: newStatus,
      });

      setAccessStatus(newStatus);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAccessStatus(session.user.id, session.user.email ?? "");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAccessStatus(session.user.id, session.user.email ?? "");
      } else {
        setAccessStatus(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) {
        toast({
          title: "Inloggning misslyckades",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Inloggning misslyckades",
        description: "Ett oväntat fel uppstod",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Utloggning misslyckades",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Utloggad",
          description: "Du har loggats ut",
        });
      }
    } catch (error) {
      toast({
        title: "Utloggning misslyckades",
        description: "Ett oväntat fel uppstod",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, accessStatus, isAdmin, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
