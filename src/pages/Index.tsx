import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ApocalypticGradeCard from "@/components/ApocalypticGradeCard";
import ApocalypticNav from "@/components/ApocalypticNav";
import ApocalypticFooter from "@/components/ApocalypticFooter";
import MobileBottomNav from "@/components/MobileBottomNav";
import LunchMenu from "@/components/LunchMenu";

const grades = [6, 7, 8, 9];

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col relative">
        {/* Navigation */}

        {/* Navigation */}
        <ApocalypticNav />

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12 relative z-20">
        {/* Hero content */}
        <div className="text-center mb-8 md:mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-orbitron font-bold text-foreground glitch-hover"
            style={{
              textShadow: "0 2px 10px rgba(0,0,0,0.5), 0 0 30px hsl(var(--primary) / 0.2)",
            }}
          >
            Leteboskolans{" "}
            <span 
              className="text-primary"
              style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.6)" }}
            >
              mattesida
            </span>
          </motion.h1>
        </div>

          {/* Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-2xl md:text-3xl lg:text-4xl font-orbitron font-medium text-foreground/80 mb-8 md:mb-12"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            Välj årskurs
          </motion.h2>

          {/* Grade Cards Grid - optimized for mobile touch */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10 justify-items-center px-2">
            {grades.map((grade, index) => (
              <ApocalypticGradeCard key={grade} grade={grade} delay={index} />
            ))}
          </div>

          {/* Instruction hint - hidden on mobile (we have bottom nav) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="hidden md:block text-center text-muted-foreground mt-12 text-sm font-nunito"
          >
            Klicka på en panel för att se resurser och lektionsplaneringar
          </motion.p>

          {/* Lunch menu */}
          <div className="w-full max-w-sm mt-8">
            <LunchMenu />
          </div>
        </main>

        {/* Decorative copper line - hidden on mobile */}
        <div 
          className="hidden md:block h-[2px] mx-6 relative z-20"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6) 20%, hsl(var(--primary) / 0.8) 50%, hsl(var(--primary) / 0.6) 80%, transparent)",
            boxShadow: "0 0 10px hsl(var(--primary) / 0.4)",
          }}
        />

        {/* Footer - hidden on mobile */}
        <div className="hidden md:block">
          <ApocalypticFooter />
        </div>
        
        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </PageTransition>
  );
};

export default Index;
