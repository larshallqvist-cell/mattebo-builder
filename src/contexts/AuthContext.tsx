import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { isAllowedReturnPath } from "@/lib/braklabbetGate";
import { STUDENT_VIEW_KEY, effectiveIsAdmin, studentViewEnabled } from "@/lib/studentView";

type AccessStatus = "loading" | "approved" | "pending" | "denied" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accessStatus: AccessStatus;
  /** Teacher-only interface is available (false while a teacher previews the student view). */
  isAdmin: boolean;
  /** The account really is a teacher, also while the student view is switched on. */
  isTeacher: boolean;
  studentView: boolean;
  setStudentView: (on: boolean) => void;
  signInWithGoogle: (returnPath?: unknown) => Promise<void>;
  signOut: () => Promise<void>;
}

export const POST_LOGIN_PATH_KEY = "mattebo_post_login_path";

// Reuse one context instance across hot reloads so provider and consumers never diverge.
const globalCtx = globalThis as { __matteboAuthContext?: React.Context<AuthContextType | undefined> };
const AuthContext = (globalCtx.__matteboAuthContext ??= createContext<AuthContextType | undefined>(undefined));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentViewOn, setStudentViewOn] = useState<boolean>(() => {
    try { return localStorage.getItem(STUDENT_VIEW_KEY) === "1"; } catch { return false; }
  });
  const { toast } = useToast();

  // `isAdmin` holds the real role; what the interface sees is the teacher flag
  // with the student-view preview applied.
  const isTeacher = isAdmin;
  const studentView = studentViewEnabled(isTeacher, studentViewOn ? "1" : null);
  const effectiveAdmin = effectiveIsAdmin(isTeacher, studentView);

  const setStudentView = (on: boolean) => {
    if (!isTeacher) return;
    const next = studentViewEnabled(true, on ? "1" : null);
    setStudentViewOn(next);
    try {
      if (next) localStorage.setItem(STUDENT_VIEW_KEY, "1");
      else localStorage.removeItem(STUDENT_VIEW_KEY);
    } catch { /* storage may be disabled */ }
  };

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
    } else if (!error) {
      // No row yet — create a pending request (only status the database allows from the client).
      const { error: insertError } = await supabase.from("access_requests").insert({
        user_id: userId,
        email,
        full_name: "",
        status: "pending",
      });
      if (insertError) {
        console.error("Could not create access request:", insertError);
        toast({
          title: "Kunde inte skicka åtkomstförfrågan",
          description: "Ladda om sidan och försök igen.",
          variant: "destructive",
        });
      }
      setAccessStatus("pending");
    } else {
      console.error("Could not read access status:", error);
      setAccessStatus("pending");
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
        setStudentViewOn(false);
        try { localStorage.removeItem(STUDENT_VIEW_KEY); } catch { /* storage may be disabled */ }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (returnPath?: unknown) => {
    try {
      // Remember where to land after OAuth; PostLoginRedirect navigates there once the session exists.
      if (isAllowedReturnPath(returnPath)) {
        sessionStorage.setItem(POST_LOGIN_PATH_KEY, returnPath);
      } else {
        sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
      }
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
        setStudentViewOn(false);
        try { localStorage.removeItem(STUDENT_VIEW_KEY); } catch { /* storage may be disabled */ }
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
      value={{
        user,
        session,
        loading,
        accessStatus,
        isAdmin: effectiveAdmin,
        isTeacher,
        studentView,
        setStudentView,
        signInWithGoogle,
        signOut,
      }}
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
