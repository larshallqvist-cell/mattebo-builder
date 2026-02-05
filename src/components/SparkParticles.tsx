import { motion } from "framer-motion";
import { useMemo } from "react";

interface SparkParticlesProps {
  count?: number;
  color?: string;
  className?: string;
}

const SparkParticles = ({ 
  count = 8, 
  color = "hsl(var(--neon-copper))",
  className = "" 
}: SparkParticlesProps) => {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 2 + Math.random() * 3,
    })), [count]
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            bottom: 0,
            width: particle.size,
            height: particle.size,
            background: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}, 0 0 ${particle.size * 4}px ${color}`,
          }}
          animate={{
            y: [0, -120, -200],
            x: [0, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export default SparkParticles;
