import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ApocalypticGradeCard from "@/components/ApocalypticGradeCard";
import ApocalypticNav from "@/components/ApocalypticNav";
import ApocalypticFooter from "@/components/ApocalypticFooter";
import MobileBottomNav from "@/components/MobileBottomNav";
import LunchMenu from "@/components/LunchMenu";
import { SUPPORTED_GRADES } from "@/config/app";


const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col relative">
        <ApocalypticNav />

        <main className="flex-1 w-full max-w-5xl mx-auto px-5 pt-28 pb-16 relative z-20 space-y-10">
          {/* Hero */}
          <div className="text-center space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-6xl font-orbitron font-bold tracking-tight text-foreground"
            >
              Leteboskolans mattesida
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-accent text-base md:text-lg max-w-md mx-auto font-nunito"
            >
              Din digitala resurs för matematik i årskurs 6–9.
            </motion.p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Grade selection */}
            <section
              className="md:col-span-12 rounded-[2.5rem] border border-primary/20 bg-secondary/40 backdrop-blur-sm px-6 py-10 flex flex-col items-center gap-8"
              style={{
                boxShadow:
                  "0 24px 50px -24px hsl(211 69% 6% / 0.9), 0 8px 20px -12px hsl(211 69% 6% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
              }}
            >
              <h2 className="text-lg md:text-xl font-orbitron text-accent">Välj årskurs</h2>
              <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                {SUPPORTED_GRADES.map((grade, index) => (
                  <ApocalypticGradeCard key={grade} grade={grade} delay={index} />
                ))}
              </div>
              <p className="hidden md:block text-center text-muted-foreground text-sm font-nunito">
                Klicka på en årskurs för att se resurser och lektionsplaneringar
              </p>
            </section>

            {/* Lunch */}
            <section
              className="md:col-span-7 rounded-[2rem] border border-primary/10 bg-secondary/30 backdrop-blur-sm p-6"
              style={{
                boxShadow:
                  "0 20px 40px -22px hsl(211 69% 6% / 0.85), inset 0 1px 0 hsl(0 0% 100% / 0.05)",
              }}
            >
              <LunchMenu />
            </section>

            {/* Info */}
            <section
              className="md:col-span-5 rounded-[2rem] border border-accent/20 bg-primary/10 backdrop-blur-sm p-6 flex flex-col justify-between gap-6"
              style={{
                boxShadow:
                  "0 20px 40px -22px hsl(211 69% 6% / 0.85), inset 0 1px 0 hsl(0 0% 100% / 0.05)",
              }}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-orbitron text-foreground">Lektionsplanering</h3>
                <p className="text-sm text-muted-foreground font-nunito">
                  Nästa lektion, agenda och länkar hittar du inne på din årskurs.
                </p>
              </div>
              <p className="text-xs uppercase tracking-widest text-accent font-nunito">
                Åk 6 · 7 · 8 · 9
              </p>
            </section>
          </div>
        </main>

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
