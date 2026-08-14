import { motion } from "framer-motion";

interface ScreenFrameProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const ScreenFrame = ({ children, title, className = "" }: ScreenFrameProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`relative rounded-lg overflow-hidden h-full flex flex-col ${className}`}
      style={{
        background: `linear-gradient(145deg, 
          hsl(var(--rust-dark)) 0%, 
          hsl(var(--rust-medium)) 15%, 
          hsl(215 25% 20%) 50%, 
          hsl(var(--rust-medium)) 85%, 
          hsl(var(--rust-dark)) 100%
        )`,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.1),
          inset 0 -1px 0 rgba(0,0,0,0.3),
          0 4px 20px rgba(0,0,0,0.4),
          0 0 15px hsl(var(--accent) / 0.13)
        `,
      }}
    >
      {/* Corner screws - same as MetalPanel */}
      {[
        { top: "6px", left: "6px" },
        { top: "6px", right: "6px" },
        { bottom: "6px", left: "6px" },
        { bottom: "6px", right: "6px" },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full z-10"
          style={{
            ...pos,
            background: "linear-gradient(145deg, hsl(var(--metal-light)), hsl(var(--metal-dark)))",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.4)",
          }}
        >
          <div className="absolute top-1/2 left-1/2 w-1.5 h-[1px] -translate-x-1/2 -translate-y-1/2 bg-black/40" />
        </div>
      ))}

      {/* Panel body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Title bar */}
        {title && (
          <div 
            className="relative px-3 py-1.5 border-b flex-shrink-0"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)",
              borderColor: "hsl(var(--accent) / 0.25)",
            }}
          >
            <h2 
              className="font-orbitron font-bold text-base glitch-hover"
              style={{ 
                color: "hsl(var(--accent))",
                textShadow: "0 0 10px hsl(var(--accent) / 0.4)",
              }}
            >
              {title}
            </h2>
          </div>
        )}

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 relative industrial-scrollbar">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default ScreenFrame;
