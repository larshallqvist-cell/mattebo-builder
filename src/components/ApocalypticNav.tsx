import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginButton from "./LoginButton";
import UserMenu from "./UserMenu";

interface ApocalypticNavProps {
  /** Optional content rendered in the middle of the nav bar (desktop only) */
  centerContent?: ReactNode;
}

const ApocalypticNav = ({ centerContent }: ApocalypticNavProps) => {
  const { user, loading } = useAuth();

  return <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className={`${centerContent ? "max-w-7xl" : "max-w-5xl"} mx-auto flex items-center justify-between gap-4 rounded-full px-6 py-[10px]`} style={{
      background: "hsl(var(--secondary) / 0.6)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 18px 40px -22px hsl(211 69% 6% / 0.9), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
      border: "1px solid hsl(var(--primary) / 0.2)"
    }}>
        {/* Logo / Site title */}
        <Link to="/" className="font-orbitron text-lg font-bold text-accent hover:text-foreground transition-colors">
          Leteboskolan
        </Link>

        {/* Center content (grade + chapter selector) */}
        {centerContent && (
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0">
            {centerContent}
          </div>
        )}

        {/* Navigation links and auth */}
        <div className="flex items-center gap-5 text-sm font-nunito flex-shrink-0">
          <Link to="/" className="nav-link">
            Hem
          </Link>
          <a href="#about" className={centerContent ? "nav-link hidden xl:inline" : "nav-link"}>
            Om
          </a>
          <a href="#contact" className={centerContent ? "nav-link hidden xl:inline" : "nav-link"}>
            Kontakt
          </a>
          {!loading && (
            user ? <UserMenu /> : (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs text-muted-foreground/70 font-nunito">
                  Logga in med Google →
                </span>
                <LoginButton variant="ghost" size="sm" />
              </div>
            )
          )}
        </div>
      </div>
    </nav>;
};
export default ApocalypticNav;
