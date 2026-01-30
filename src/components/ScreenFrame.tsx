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
          hsl(20 45% 22%) 0%, 
          hsl(25 40% 28%) 20%, 
          hsl(20 35% 25%) 50%, 
          hsl(25 40% 28%) 80%, 
          hsl(20 45% 22%) 100%
        )`,
        boxShadow: `
          inset 0 2px 4px rgba(255,255,255,0.1),
          inset 0 -2px 4px rgba(0,0,0,0.3),
          0 8px 30px rgba(0,0,0,0.5),
          0 0 20px rgba(205, 127, 50, 0.15)
        `,
      }}
    >
      {/* Outer frame with rivets */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top rivets */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`top-${i}`}
            className="absolute w-2 h-2 rounded-full top-2"
            style={{
              left: `${15 + i * 18}%`,
              background: "linear-gradient(145deg, #8b7355, #5c4d3d)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)",
            }}
          />
        ))}
        {/* Bottom rivets */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`bottom-${i}`}
            className="absolute w-2 h-2 rounded-full bottom-2"
            style={{
              left: `${15 + i * 18}%`,
              background: "linear-gradient(145deg, #8b7355, #5c4d3d)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)",
            }}
          />
        ))}
      </div>

      {/* Screen bezel */}
      <div 
        className="m-3 flex-1 rounded-md overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, hsl(215 30% 8%) 0%, hsl(215 25% 12%) 100%)",
          boxShadow: `
            inset 0 0 30px rgba(0,0,0,0.8),
            inset 0 0 60px rgba(0,0,0,0.4),
            0 0 10px rgba(64, 224, 208, 0.1)
          `,
          border: "2px solid hsl(var(--rust-dark))",
        }}
      >
        {/* Scanline effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
          }}
        />

        {/* Title bar */}
        {title && (
          <div 
            className="px-3 py-1.5 border-b flex-shrink-0"
            style={{
              background: "linear-gradient(180deg, rgba(64, 224, 208, 0.15) 0%, rgba(64, 224, 208, 0.05) 100%)",
              borderColor: "rgba(64, 224, 208, 0.3)",
            }}
          >
            <h3 
              className="font-orbitron font-bold text-sm"
              style={{ 
                color: "hsl(var(--neon-turquoise))",
                textShadow: "0 0 10px hsl(var(--neon-turquoise) / 0.6)",
              }}
            >
              {title}
            </h3>
          </div>
        )}

        {/* Content with subtle glow - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 relative industrial-scrollbar">
          {children}
        </div>
      </div>

      {/* Power LED indicator */}
      <motion.div
        animate={{
          opacity: [0.6, 1, 0.6],
          boxShadow: [
            "0 0 4px #40E0D0, 0 0 8px #40E0D0",
            "0 0 8px #40E0D0, 0 0 16px #40E0D0",
            "0 0 4px #40E0D0, 0 0 8px #40E0D0",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-4 right-4 w-2 h-2 rounded-full"
        style={{
          background: "#40E0D0",
        }}
      />
    </motion.div>
  );
};

export default ScreenFrame;
