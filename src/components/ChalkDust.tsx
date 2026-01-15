import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
}

const ChalkDust = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Only trigger on interactive elements
    if (!target.closest('button, a, [role="button"], .grade-card')) return;
    
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: centerX + (Math.random() - 0.5) * 20,
      y: centerY + (Math.random() - 0.5) * 20,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.6 + 0.4,
      velocityX: (Math.random() - 0.5) * 60,
      velocityY: Math.random() * -40 - 20,
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
    
    // Clean up particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, []);

  useEffect(() => {
    document.addEventListener("click", createParticles);
    return () => document.removeEventListener("click", createParticles);
  }, [createParticles]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: particle.opacity,
              scale: 1,
            }}
            animate={{
              x: particle.x + particle.velocityX,
              y: particle.y + particle.velocityY + 30,
              opacity: 0,
              scale: 0.5,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: "hsl(var(--chalk-yellow))",
              boxShadow: "0 0 4px hsl(var(--chalk-yellow) / 0.5)",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ChalkDust;
