import { motion, Variants } from "framer-motion";

interface HandwrittenTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

const HandwrittenText = ({ 
  text, 
  className = "", 
  delay = 0,
  speed = 0.05 
}: HandwrittenTextProps) => {
  const letters = text.split("");
  
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: speed,
        delayChildren: delay,
      },
    },
  };
  
  const child: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      rotate: -10,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap justify-center ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={child}
          className={letter === " " ? "w-3" : "inline-block"}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default HandwrittenText;
