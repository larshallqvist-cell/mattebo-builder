import { motion } from "framer-motion";

interface EffectProps {
  type: "fire" | "smoke" | "shimmer" | "stars" | "glow" | "sparkle";
}

const FireEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute bottom-0 w-3 h-6"
        style={{
          left: `${10 + i * 12}%`,
          background: "linear-gradient(to top, #ff4500, #ff8c00, #ffd700, transparent)",
          borderRadius: "50% 50% 20% 20%",
          filter: "blur(2px)",
        }}
        animate={{
          scaleY: [1, 1.3, 0.9, 1.2, 1],
          scaleX: [1, 0.8, 1.1, 0.9, 1],
          opacity: [0.8, 1, 0.7, 0.9, 0.8],
        }}
        transition={{
          duration: 0.5 + Math.random() * 0.3,
          repeat: Infinity,
          delay: i * 0.1,
        }}
      />
    ))}
    <div 
      className="absolute inset-x-0 bottom-0 h-2"
      style={{
        background: "linear-gradient(to top, rgba(255,69,0,0.4), transparent)",
        filter: "blur(4px)",
      }}
    />
  </div>
);

const SmokeEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-8 h-8 rounded-full"
        style={{
          left: `${15 + i * 18}%`,
          bottom: "20%",
          background: "radial-gradient(circle, rgba(150,150,150,0.4) 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
        animate={{
          y: [-10, -40, -70],
          x: [0, (i % 2 === 0 ? 10 : -10), (i % 2 === 0 ? -5 : 5)],
          opacity: [0, 0.6, 0],
          scale: [0.5, 1, 1.5],
        }}
        transition={{
          duration: 3 + Math.random(),
          repeat: Infinity,
          delay: i * 0.6,
        }}
      />
    ))}
  </div>
);

const ShimmerEffect = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none rounded overflow-hidden"
    style={{
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
      backgroundSize: "200% 100%",
    }}
    animate={{
      backgroundPosition: ["200% 0%", "-200% 0%"],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    }}
  />
);

const StarsEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: `${5 + Math.random() * 90}%`,
          top: `${5 + Math.random() * 90}%`,
          width: "4px",
          height: "4px",
          background: "#ffd700",
          borderRadius: "50%",
          boxShadow: "0 0 6px 2px rgba(255,215,0,0.8)",
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.2, 0.5],
        }}
        transition={{
          duration: 1 + Math.random(),
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

const GlowEffect = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none rounded"
    style={{
      boxShadow: "inset 0 0 20px rgba(64, 224, 208, 0.5), 0 0 15px rgba(64, 224, 208, 0.4)",
    }}
    animate={{
      boxShadow: [
        "inset 0 0 20px rgba(64, 224, 208, 0.5), 0 0 15px rgba(64, 224, 208, 0.4)",
        "inset 0 0 30px rgba(64, 224, 208, 0.7), 0 0 25px rgba(64, 224, 208, 0.6)",
        "inset 0 0 20px rgba(64, 224, 208, 0.5), 0 0 15px rgba(64, 224, 208, 0.4)",
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
    }}
  />
);

const SparkleEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0, 1, 0],
          rotate: [0, 180],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path
            d="M5 0 L5.5 4 L10 5 L5.5 6 L5 10 L4.5 6 L0 5 L4.5 4 Z"
            fill="#ffd700"
            style={{ filter: "drop-shadow(0 0 2px rgba(255,215,0,0.8))" }}
          />
        </svg>
      </motion.div>
    ))}
  </div>
);

export const CalendarEffect = ({ type }: EffectProps) => {
  switch (type) {
    case "fire":
      return <FireEffect />;
    case "smoke":
      return <SmokeEffect />;
    case "shimmer":
      return <ShimmerEffect />;
    case "stars":
      return <StarsEffect />;
    case "glow":
      return <GlowEffect />;
    case "sparkle":
      return <SparkleEffect />;
    default:
      return null;
  }
};

export type EffectType = EffectProps["type"];
