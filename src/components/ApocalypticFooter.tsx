const ApocalypticFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="relative z-20 mt-auto py-8 px-6"
      style={{
        background: "linear-gradient(180deg, rgba(15, 20, 30, 0.9) 0%, rgba(10, 15, 22, 0.98) 100%)",
        borderTop: "1px solid rgba(205, 127, 50, 0.15)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* School name */}
          <div className="text-center md:text-left">
            <h3 
              className="font-orbitron text-lg font-semibold text-primary mb-1"
              style={{ textShadow: "0 0 8px hsl(var(--primary) / 0.4)" }}
            >
              Leteboskolan
            </h3>
            <p className="text-muted-foreground text-sm font-nunito">
              Matematik för årskurs 6–9
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm font-nunito">
            <a href="#about" className="nav-link">
              Om sidan
            </a>
            <span className="text-muted-foreground/30">|</span>
            <a href="#contact" className="nav-link">
              Kontakta oss
            </a>
            <span className="text-muted-foreground/30">|</span>
            <a href="#resources" className="nav-link">
              Resurser
            </a>
          </div>

          {/* Copyright */}
          <p className="text-muted-foreground text-xs font-nunito">
            © {currentYear} Leteboskolan. Alla rättigheter förbehållna.
          </p>
        </div>

        {/* Decorative line */}
        <div 
          className="mt-6 h-[1px] opacity-30"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)) 50%, transparent)",
          }}
        />
      </div>
    </footer>
  );
};

export default ApocalypticFooter;
