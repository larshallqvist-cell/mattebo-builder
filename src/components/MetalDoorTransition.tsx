import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface MetalDoorTransitionProps {
  children: ReactNode;
}

const MetalDoorTransition = ({ children }: MetalDoorTransitionProps) => {
  const location = useLocation();
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [showContent, setShowContent] = useState(true);
  const prevPathRef = useRef(location.pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only animate if path actually changed
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      
      // Close doors
      setDoorsOpen(false);
      setShowContent(false);
      
      // Open doors after a moment
      const openTimer = setTimeout(() => {
        setDoorsOpen(true);
      }, 400);

      // Show content after doors start opening
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 600);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(contentTimer);
      };
    }
  }, [location.pathname]);

  return (
    <div className="relative overflow-hidden">
      {/* Left Door */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: doorsOpen ? "-100%" : 0 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.76, 0, 0.24, 1],
        }}
        className="fixed inset-y-0 left-0 w-1/2 z-50 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, 
            hsl(var(--rust-dark)) 0%, 
            hsl(var(--rust-medium)) 40%, 
            hsl(var(--rust-light)) 80%, 
            hsl(var(--metal-light)) 100%
          )`,
          boxShadow: "4px 0 20px rgba(0,0,0,0.5), inset -2px 0 10px rgba(255,255,255,0.1)",
        }}
      >
        {/* Metal texture */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px),
              repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)
            `,
          }}
        />
        {/* Rivets */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full"
              style={{
                background: "linear-gradient(145deg, hsl(var(--metal-light)), hsl(var(--metal-dark)))",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)",
              }}
            />
          ))}
        </div>
        {/* Handle */}
        <div 
          className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-24 rounded-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--metal-dark)), hsl(var(--metal-light)), hsl(var(--metal-dark)))",
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.5), 2px 0 8px rgba(0,0,0,0.3)",
          }}
        />
        {/* Glow edge */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute right-0 inset-y-0 w-1"
          style={{
            background: "linear-gradient(180deg, transparent, hsl(var(--neon-copper)), transparent)",
            boxShadow: "0 0 20px hsl(var(--neon-copper))",
          }}
        />
      </motion.div>

      {/* Right Door */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: doorsOpen ? "100%" : 0 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.76, 0, 0.24, 1],
        }}
        className="fixed inset-y-0 right-0 w-1/2 z-50 pointer-events-none"
        style={{
          background: `linear-gradient(270deg, 
            hsl(var(--rust-dark)) 0%, 
            hsl(var(--rust-medium)) 40%, 
            hsl(var(--rust-light)) 80%, 
            hsl(var(--metal-light)) 100%
          )`,
          boxShadow: "-4px 0 20px rgba(0,0,0,0.5), inset 2px 0 10px rgba(255,255,255,0.1)",
        }}
      >
        {/* Metal texture */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px),
              repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)
            `,
          }}
        />
        {/* Rivets */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full"
              style={{
                background: "linear-gradient(145deg, hsl(var(--metal-light)), hsl(var(--metal-dark)))",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)",
              }}
            />
          ))}
        </div>
        {/* Handle */}
        <div 
          className="absolute left-8 top-1/2 -translate-y-1/2 w-3 h-24 rounded-full"
          style={{
            background: "linear-gradient(90deg, hsl(var(--metal-dark)), hsl(var(--metal-light)), hsl(var(--metal-dark)))",
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.5), -2px 0 8px rgba(0,0,0,0.3)",
          }}
        />
        {/* Glow edge */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute left-0 inset-y-0 w-1"
          style={{
            background: "linear-gradient(180deg, transparent, hsl(var(--neon-copper)), transparent)",
            boxShadow: "0 0 20px hsl(var(--neon-copper))",
          }}
        />
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MetalDoorTransition;
