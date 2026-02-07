import { motion } from "framer-motion";
import SparkParticles from "./SparkParticles";

interface MetalPanelProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  titleExtra?: React.ReactNode;
  className?: string;
  glowColor?: string;
  showSparks?: boolean;
}

const MetalPanel = ({ 
  children, 
  title, 
  icon,
  titleExtra,
  className = "",
  glowColor = "hsl(var(--neon-copper))",
  showSparks = false
}: MetalPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-lg overflow-hidden group flex flex-col ${className}`}
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
          0 0 15px ${glowColor}20
        `,
      }}
    >
      {/* Spark particles on hover */}
      {showSparks && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <SparkParticles count={6} color={glowColor} />
        </div>
      )}
      {/* Corner screws */}
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
          {/* Screw slot */}
          <div 
            className="absolute top-1/2 left-1/2 w-1.5 h-[1px] -translate-x-1/2 -translate-y-1/2 bg-black/40"
          />
        </div>
      ))}

      {/* Metal texture overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.05) 1px, transparent 1px),
            radial-gradient(circle at 70% 60%, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "15px 15px, 20px 20px",
        }}
      />

      {/* Glowing edge effect */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}30`,
        }}
      />

      {/* Header with title */}
      {title && (
        <div 
          className="relative px-3 py-1.5 border-b"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 100%)",
            borderColor: `${glowColor}40`,
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            {icon && (
              <span className="w-3.5 h-3.5" style={{ color: glowColor, filter: `drop-shadow(0 0 4px ${glowColor})` }}>
                {icon}
              </span>
            )}
            <h2 
              className="font-orbitron font-bold text-base glitch-hover"
              style={{ 
                color: glowColor,
                textShadow: `0 0 10px ${glowColor}60`,
              }}
            >
              {title}
            </h2>
          </div>
          {titleExtra && (
            <div className="flex items-center">
              {titleExtra}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative p-4 flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </motion.div>
  );
};

export default MetalPanel;
