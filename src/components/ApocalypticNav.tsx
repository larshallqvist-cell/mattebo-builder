import { Link } from "react-router-dom";

const ApocalypticNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div 
        className="max-w-6xl mx-auto flex items-center justify-between rounded-lg px-6 py-3"
        style={{
          background: "linear-gradient(180deg, rgba(30, 40, 55, 0.95) 0%, rgba(20, 28, 40, 0.9) 100%)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(205, 127, 50, 0.2)",
        }}
      >
        {/* Logo / Site title */}
        <Link 
          to="/" 
          className="font-orbitron text-lg font-bold text-primary hover:text-accent transition-colors"
          style={{
            textShadow: "0 0 10px hsl(var(--primary) / 0.5)",
          }}
        >
          Leteboskolan
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6 text-sm font-nunito">
          <Link to="/" className="nav-link">
            Hem
          </Link>
          <span className="text-muted-foreground/30">|</span>
          <a href="#about" className="nav-link">
            Om
          </a>
          <span className="text-muted-foreground/30">|</span>
          <a href="#contact" className="nav-link">
            Kontakt
          </a>
        </div>
      </div>
    </nav>
  );
};

export default ApocalypticNav;
