import { useEffect, useState, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

interface ParallaxHeroProps {
  title: string;
  subtitle?: string;
  heightClass?: string;
  titleOffset?: string;
  children?: ReactNode;
}

const ParallaxHero = ({ 
  title, 
  subtitle, 
  heightClass = "h-[40vh]", 
  titleOffset = "",
  children,
}: ParallaxHeroProps) => {
  const [, setElementTop] = useState(0);
  const { scrollY } = useScroll();
  
  // Parallax effect - background moves slower than scroll
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.6]);
  
  useEffect(() => {
    const handleResize = () => {
      setElementTop(window.scrollY);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className={`relative w-full ${heightClass} flex items-center justify-center overflow-hidden`}>
      {/* Parallax Background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroBg})`,
          y,
          scale: 1.1,
        }}
      />

      {/* Gradient overlay for depth */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15 border-0"
        style={{ opacity }}
      />

      {/* Content */}
      <div className={`relative z-10 text-center px-4 ${titleOffset}`}>
        {children ? (
          children
        ) : (
          <>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl chalk-text font-bold tracking-wide">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-lg md:text-xl text-muted-foreground">
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>

      {/* Decorative chalk dust effect */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default ParallaxHero;
