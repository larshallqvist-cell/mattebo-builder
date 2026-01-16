import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ApocalypticGradeCard from "@/components/ApocalypticGradeCard";
import ApocalypticNav from "@/components/ApocalypticNav";
import ApocalypticFooter from "@/components/ApocalypticFooter";
import DustParticles from "@/components/DustParticles";

const grades = [6, 7, 8, 9];

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col relative">
        {/* Dust particles background */}
        <DustParticles />

        {/* Navigation */}
        <ApocalypticNav />

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12 relative z-20">
          {/* Hero content */}
          <div className="text-center mb-12 md:mb-16">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold mb-4 text-foreground"
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

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground font-nunito max-w-xl mx-auto"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              Välj din årskurs och utforska matematikens värld
            </motion.p>
          </div>

          {/* Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl md:text-2xl font-orbitron font-medium text-foreground/80 mb-8 md:mb-12"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            Välj årskurs
          </motion.h2>

          {/* Grade Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10 justify-items-center">
            {grades.map((grade, index) => (
              <ApocalypticGradeCard key={grade} grade={grade} delay={index} />
            ))}
          </div>

          {/* Instruction hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-center text-muted-foreground mt-12 text-sm font-nunito"
          >
            Klicka på en panel för att se resurser och lektionsplaneringar
          </motion.p>
        </main>

        {/* Decorative copper line */}
        <div 
          className="h-[2px] mx-6 relative z-20"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6) 20%, hsl(var(--primary) / 0.8) 50%, hsl(var(--primary) / 0.6) 80%, transparent)",
            boxShadow: "0 0 10px hsl(var(--primary) / 0.4)",
          }}
        />

        {/* Footer */}
        <ApocalypticFooter />
      </div>
    </PageTransition>
  );
};

export default Index;
