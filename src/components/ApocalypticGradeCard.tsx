import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { hapticFeedback } from "@/hooks/useHaptic";
import SparkParticles from "./SparkParticles";
import { GRADE_CARD_COLORS } from "@/config/app";

interface ApocalypticGradeCardProps {
  grade: number;
  delay?: number;
}


const ApocalypticGradeCard = ({ grade, delay = 0 }: ApocalypticGradeCardProps) => {
  const colors = GRADE_CARD_COLORS[grade as keyof typeof GRADE_CARD_COLORS];
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
          scale: 1.07,
          transition: { duration: 0.3 }
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0.1 }
        }}
        className={`relative w-[104px] h-[104px] sm:w-[124px] sm:h-[124px] md:w-[140px] md:h-[140px] rounded-full cursor-pointer group ${floatClass}`}
        style={{ animationDelay: `${delay * 0.5}s` }}
      >
        {/* Soft halo under the floating circle */}
        <div
          className="absolute -inset-3 rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none blur-xl"
          style={{ background: `radial-gradient(circle, ${colors.neon} 0%, transparent 70%)` }}
        />

        {/* Circle body */}
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(160deg, ${colors.neon} 0%, hsl(var(--secondary)) 100%)`,
            border: `1px solid ${colors.border}`,
            boxShadow: colors.glow,
          }}
        >
          <span
            className="font-orbitron font-bold text-4xl sm:text-5xl md:text-6xl text-background transition-transform duration-300 group-hover:scale-110"
            style={{ textShadow: "0 1px 2px hsl(var(--background) / 0.25)" }}
          >
            {grade}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

export default ApocalypticGradeCard;
