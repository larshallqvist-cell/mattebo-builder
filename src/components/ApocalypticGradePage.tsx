import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Calendar, BookOpen, Gamepad2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ApocalypticNav from "@/components/ApocalypticNav";
import DustParticles from "@/components/DustParticles";
import MetalPanel from "@/components/MetalPanel";
import ScreenFrame from "@/components/ScreenFrame";
import MascotPanel from "@/components/MascotPanel";
import LessonCalendar from "@/components/LessonCalendar";
import ResourceAccordion from "@/components/ResourceAccordion";
import CalculatorThumbnail from "@/components/CalculatorThumbnail";
import WebRadio from "@/components/WebRadio";
import PostItNote from "@/components/PostItNote";
import ChapterSelector, { getChapterFromCookie, getChapterSubtitle } from "@/components/ChapterSelector";

interface ApocalypticGradePageProps {
  grade: number;
}

const gradeNeonColors: Record<number, string> = {
  6: "hsl(var(--neon-turquoise))",
  7: "hsl(var(--neon-copper))",
  8: "hsl(var(--neon-blue))",
  9: "hsl(var(--neon-violet))",
};

const ApocalypticGradePage = ({ grade }: ApocalypticGradePageProps) => {
  const [selectedChapter, setSelectedChapter] = useState(() => getChapterFromCookie(grade));
  const glowColor = gradeNeonColors[grade] || "hsl(var(--neon-copper))";

  return (
    <PageTransition>
      <div 
        className="min-h-screen flex flex-col relative"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(205, 127, 50, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(64, 224, 208, 0.05) 0%, transparent 50%),
            linear-gradient(180deg, hsl(150 20% 12%) 0%, hsl(160 25% 8%) 100%)
          `,
        }}
      >
        {/* Dust particles */}
        <DustParticles />

        {/* Navigation */}
        <ApocalypticNav />

        {/* Hero Header */}
        <header className="relative pt-20 pb-6 px-6 z-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 
                  className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-2"
                  style={{
                    color: glowColor,
                    textShadow: `0 0 20px ${glowColor}60, 0 0 40px ${glowColor}30`,
                  }}
                >
                  Kontrollpanelen
                </h1>
                <p className="text-lg text-muted-foreground font-nunito">
                  Årskurs {grade} — Din kommandocentral för matematik
                </p>
              </div>

              {/* Quick actions */}
              <div className="hidden md:flex items-center gap-3">
                <Link 
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${glowColor}40`,
                  }}
                >
                  <Home className="w-4 h-4" style={{ color: glowColor }} />
                  <span className="text-sm font-nunito text-foreground/80">Hem</span>
                </Link>
              </div>
            </motion.div>

            {/* Chapter Selector */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <ChapterSelector grade={grade} onChapterChange={setSelectedChapter} />
            </motion.div>
          </div>
        </header>

        {/* Glowing divider */}
        <div 
          className="h-[2px] mx-6 relative z-20"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor}80 20%, ${glowColor} 50%, ${glowColor}80 80%, transparent)`,
            boxShadow: `0 0 15px ${glowColor}60`,
          }}
        />

        {/* Main Content - Fixed to viewport height */}
        <main className="flex-1 px-4 lg:px-6 py-4 relative z-20 overflow-hidden">
          <div className="max-w-7xl mx-auto h-[calc(100vh-220px)]">
            {/* Desktop: Three-column layout */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-full">
              {/* Column 1 - Calendar (scrollable) */}
              <div className="lg:col-span-5 h-full">
                <ScreenFrame title={`Planering Åk ${grade}`} className="h-full">
                  <div className="h-full overflow-y-auto">
                    <LessonCalendar grade={grade} />
                  </div>
                </ScreenFrame>
              </div>

              {/* Column 2 - Next Lesson (expanded), Calculator, Radio */}
              <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-y-auto pr-1">
                {/* Next Lesson - Takes more space */}
                <MetalPanel 
                  title="Nästa lektion" 
                  icon={<Calendar className="w-4 h-4" />}
                  glowColor={glowColor}
                  className="flex-1 min-h-[200px]"
                >
                  <div className="h-full overflow-y-auto">
                    <PostItNote grade={grade} />
                  </div>
                </MetalPanel>

                {/* Calculator */}
                <MetalPanel glowColor="hsl(var(--neon-copper))" className="flex-shrink-0">
                  <CalculatorThumbnail />
                </MetalPanel>

                {/* Radio */}
                <MetalPanel glowColor="hsl(var(--neon-turquoise))" className="flex-shrink-0">
                  <WebRadio />
                </MetalPanel>
              </div>

              {/* Column 3 - Resources with chapter headers + Mascot at bottom */}
              <div className="lg:col-span-4 h-full flex flex-col gap-3 overflow-hidden">
                <MetalPanel 
                  title={`Kapitel ${selectedChapter} — ${getChapterSubtitle(grade, selectedChapter)}`}
                  icon={<BookOpen className="w-4 h-4" />}
                  glowColor={glowColor}
                  className="flex-1 min-h-0 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto -mx-4 -mb-4 px-4 pb-4">
                    <ResourceAccordion grade={grade} chapter={selectedChapter} />
                  </div>
                </MetalPanel>

                {/* Mascot at bottom of right column */}
                <MascotPanel className="flex-shrink-0" />
              </div>
            </div>

            {/* Tablet: Two-column layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-4">
              {/* Left - Calendar */}
              <ScreenFrame title={`Planering Åk ${grade}`} className="h-[400px]">
                <LessonCalendar grade={grade} />
              </ScreenFrame>

              {/* Right - Resources */}
              <MetalPanel 
                title="Resurser" 
                icon={<BookOpen className="w-5 h-5" />}
                glowColor={glowColor}
                className="h-[400px]"
              >
                <div className="h-full overflow-hidden -m-4">
                  <ResourceAccordion grade={grade} chapter={selectedChapter} />
                </div>
              </MetalPanel>

              {/* Bottom row */}
              <MetalPanel glowColor="hsl(var(--neon-copper))">
                <div className="flex items-center gap-4">
                  <CalculatorThumbnail />
                  <div className="flex-1">
                    <WebRadio />
                  </div>
                </div>
              </MetalPanel>

              <MascotPanel />
            </div>

            {/* Mobile: Single column */}
            <div className="md:hidden space-y-4 pb-8">
              {/* Quick info */}
              <PostItNote grade={grade} />

              {/* Calendar */}
              <ScreenFrame title={`Planering Åk ${grade}`} className="h-[350px]">
                <LessonCalendar grade={grade} />
              </ScreenFrame>

              {/* Tools */}
              <MetalPanel glowColor="hsl(var(--neon-copper))">
                <div className="flex items-center gap-4">
                  <CalculatorThumbnail />
                  <div className="flex-1">
                    <WebRadio />
                  </div>
                </div>
              </MetalPanel>

              {/* Resources */}
              <MetalPanel 
                title="Lektioner & Resurser" 
                icon={<BookOpen className="w-5 h-5" />}
                glowColor={glowColor}
              >
                <div className="-m-4">
                  <ResourceAccordion grade={grade} chapter={selectedChapter} />
                </div>
              </MetalPanel>

              {/* Mascot */}
              <MascotPanel />

              {/* Home button for mobile */}
              <Link 
                to="/"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg transition-all"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${glowColor}40`,
                }}
              >
                <Home className="w-5 h-5" style={{ color: glowColor }} />
                <span className="font-nunito text-foreground/80">Tillbaka till startsidan</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default ApocalypticGradePage;
