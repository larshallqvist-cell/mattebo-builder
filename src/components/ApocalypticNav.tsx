import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginButton from "./LoginButton";
import UserMenu from "./UserMenu";

interface ApocalypticNavProps {
  /** Optional content rendered in the middle of the nav bar (desktop only) */
  centerContent?: ReactNode;
  /** Hide center content entirely (used when mobile view is forced) */
  hideCenter?: boolean;
  /** Optional grade shown as the big headline in the middle of the header */
  grade?: number;
  /** CSS color token used to tint the grade headline */
  tint?: string;
  /** Optional action (e.g. view switch, lesson notes) shown in the link row, left of "Hem" */
  headerAction?: ReactNode;
}

const ApocalypticNav = ({ centerContent, hideCenter, grade, tint, headerAction }: ApocalypticNavProps) => {
  const { user, loading, isAdmin } = useAuth();
  const tintStyle = { "--grade-tint": tint ?? "var(--accent)" } as CSSProperties;

  // The second header row only holds widgets that may render nothing (no open
  // survey, no ongoing lesson). Drop its divider and padding when it is empty
  // so the header doesn't show a stray empty strip.
  const rowRef = useRef<HTMLDivElement>(null);
  const [rowVisible, setRowVisible] = useState(true);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => setRowVisible(el.getBoundingClientRect().height > 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [centerContent]);

  return <nav className={`${grade != null ? "relative shrink-0" : "fixed top-0 left-0 right-0"} z-50 px-2 py-2 sm:px-6 sm:py-3`}>
      <div className={`${centerContent ? "max-w-7xl flex-wrap rounded-2xl" : "max-w-5xl rounded-full"} mx-auto flex items-center justify-between gap-x-3 px-3 py-2.5 sm:gap-x-4 sm:px-6 sm:py-3`} style={{
      background: "hsl(var(--secondary) / 0.6)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 18px 40px -22px hsl(211 69% 6% / 0.9), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
      border: "1px solid hsl(var(--primary) / 0.2)"
    }}>
        {/* School name | big class headline in the middle | links and auth */}
        <div className="flex w-full items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col leading-none">
            <Link to="/" className="font-orbitron text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-accent transition-colors hover:text-foreground sm:text-xs sm:tracking-[0.18em]">
              Leteboskolan
            </Link>
            {grade != null && isAdmin && (
              <div className="mt-1.5 flex items-center gap-1">
                {[6, 7, 8, 9].filter((g) => g !== grade).map((g) => (
                  <Link key={g} to={`/ak${g}`} className="rounded-full px-1.5 py-0.5 font-orbitron text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground sm:px-2 sm:text-sm">
                    <span className="sm:hidden">{g}</span>
                    <span className="hidden sm:inline">Åk {g}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {grade != null && (
            <h1 className="grade-hero shrink-0 text-center" style={tintStyle}>
              <span className="grade-hero-word">Åk</span>
              {grade}
            </h1>
          )}

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-0.5 font-nunito text-xs sm:gap-4 sm:text-sm">
            {headerAction}
            <Link to="/" className="nav-link">
              Hem
            </Link>
            {grade == null && (
              <>
                <Link to="/braklabbet" className="nav-link">
                  <span className="sm:hidden">Labbet</span>
                  <span className="hidden sm:inline">Bråklabbet</span>
                </Link>
                <Link to="/tabelltestet" className="nav-link">
                  <span className="sm:hidden">Testet</span>
                  <span className="hidden sm:inline">Tabelltestet</span>
                </Link>
                <Link to="/algebra" className="nav-link">
                  Algebra
                </Link>
              </>
            )}
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

        {/* Extra header row: widgets that appear only when there is something to show */}
        {centerContent && !hideCenter && (
          <div className="order-last w-full" style={rowVisible ? {
            borderTop: "1px solid hsl(var(--primary) / 0.2)",
            paddingTop: "0.75rem"
          } : undefined}>
            <div ref={rowRef} className="flex min-w-0 flex-wrap items-center gap-3">
              {centerContent}
            </div>
          </div>
        )}
      </div>
    </nav>;
};
export default ApocalypticNav;
