import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { hapticFeedback } from "@/hooks/useHaptic";
import SparkParticles from "./SparkParticles";

interface ApocalypticGradeCardProps {
  grade: number;
  delay?: number;
}

const gradeColors: Record<number, { neon: string; glow: string; border: string }> = {
  6: { 
    neon: "hsl(var(--neon-turquoise))", 
    glow: "0 0 20px hsl(var(--neon-turquoise) / 0.6), 0 0 40px hsl(var(--neon-turquoise) / 0.4), 0 0 60px hsl(var(--neon-turquoise) / 0.2)",
    border: "hsl(var(--neon-turquoise) / 0.5)"
  },
  7: { 
    neon: "hsl(var(--neon-copper))", 
    glow: "0 0 20px hsl(var(--neon-copper) / 0.6), 0 0 40px hsl(var(--neon-copper) / 0.4), 0 0 60px hsl(var(--neon-copper) / 0.2)",
    border: "hsl(var(--neon-copper) / 0.5)"
  },
  8: { 
    neon: "hsl(var(--neon-blue))", 
    glow: "0 0 20px hsl(var(--neon-blue) / 0.6), 0 0 40px hsl(var(--neon-blue) / 0.4), 0 0 60px hsl(var(--neon-blue) / 0.2)",
    border: "hsl(var(--neon-blue) / 0.5)"
  },
  9: { 
    neon: "hsl(var(--neon-violet))", 
    glow: "0 0 20px hsl(var(--neon-violet) / 0.6), 0 0 40px hsl(var(--neon-violet) / 0.4), 0 0 60px hsl(var(--neon-violet) / 0.2)",
    border: "hsl(var(--neon-violet) / 0.5)"
  },
};

const ApocalypticGradeCard = ({ grade, delay = 0 }: ApocalypticGradeCardProps) => {
  const colors = gradeColors[grade];
  const floatClass = delay % 2 === 0 ? "animate-float" : "animate-float-delayed";

  return (
    <Link to={`/ak${grade}`} className="block touch-manipulation" onClick={() => hapticFeedback('medium')}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6, 
          delay: delay * 0.15,
          ease: "easeOut"
        }}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.3 }
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0.1 }
        }}
        className={`relative w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] lg:w-[200px] lg:h-[200px] cursor-pointer group ${floatClass}`}
        style={{ animationDelay: `${delay * 0.5}s` }}
      >
        {/* Spark particles on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <SparkParticles count={8} color={colors.neon} />
        </div>

        {/* Outer rusty metal frame */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `
              linear-gradient(135deg, 
                hsl(var(--rust-dark)) 0%, 
                hsl(var(--rust-medium)) 30%, 
                hsl(var(--rust-light)) 50%, 
                hsl(var(--rust-medium)) 70%, 
                hsl(var(--rust-dark)) 100%
              )
            `,
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.4)",
          }}
        />

        {/* Metal texture overlay */}
        <div 
          className="absolute inset-0 rounded-lg opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 1px, transparent 1px),
              radial-gradient(circle at 40% 80%, rgba(0,0,0,0.2) 2px, transparent 2px),
              radial-gradient(circle at 60% 20%, rgba(0,0,0,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px, 25px 25px, 30px 30px, 15px 15px",
          }}
        />

        {/* Rivets */}
        {[
          { top: "8px", left: "8px" },
          { top: "8px", right: "8px" },
          { bottom: "8px", left: "8px" },
          { bottom: "8px", right: "8px" },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              ...pos,
              background: "linear-gradient(145deg, hsl(var(--metal-light)), hsl(var(--metal-dark)))",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        ))}

        {/* Inner neon panel */}
        <motion.div
          animate={{
            boxShadow: [
              colors.glow,
              colors.glow.replace(/0\.6/g, "0.8").replace(/0\.4/g, "0.6").replace(/0\.2/g, "0.4"),
              colors.glow,
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-4 rounded-md flex items-center justify-center"
          style={{
            background: `
              radial-gradient(circle at center, 
                hsl(var(--panel-inner)) 0%, 
                hsl(var(--panel-dark)) 100%
              )
            `,
            border: `2px solid ${colors.border}`,
            boxShadow: colors.glow,
          }}
        >
          {/* Neon number */}
          <motion.span
            animate={{
              textShadow: [
                `0 0 10px ${colors.neon}, 0 0 20px ${colors.neon}, 0 0 30px ${colors.neon}`,
                `0 0 15px ${colors.neon}, 0 0 30px ${colors.neon}, 0 0 45px ${colors.neon}`,
                `0 0 10px ${colors.neon}, 0 0 20px ${colors.neon}, 0 0 30px ${colors.neon}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-orbitron font-bold transition-transform duration-300 group-hover:scale-110"
            style={{
              color: colors.neon,
              textShadow: `0 0 10px ${colors.neon}, 0 0 20px ${colors.neon}, 0 0 30px ${colors.neon}`,
            }}
          >
            {grade}
          </motion.span>
        </motion.div>

        {/* Hover glow effect */}
        <div 
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `0 0 30px ${colors.neon}, 0 0 60px ${colors.neon}`,
          }}
        />
      </motion.div>
    </Link>
  );
};

export default ApocalypticGradeCard;
