import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Calendar, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ApocalypticNav from "@/components/ApocalypticNav";
import DustParticles from "@/components/DustParticles";
import MetalPanel from "@/components/MetalPanel";
import ScreenFrame from "@/components/ScreenFrame";
import CalculatorThumbnail from "@/components/CalculatorThumbnail";
import GeogebraLink from "@/components/GeogebraLink";
import WebRadio from "@/components/WebRadio";
import PostItNote from "@/components/PostItNote";
import ChapterSelector, { getChapterFromCookie, getChapterSubtitle } from "@/components/ChapterSelector";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
// Lazy-loaded components for better initial load performance
import { 
  SuspenseResourceAccordion, 
  SuspenseLessonCalendar, 
  SuspenseMascotPanel 
} from "@/components/LazyComponents";

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
  const { nextEvent } = useCalendarEvents(grade);
  const glowColor = gradeNeonColors[grade] || "hsl(var(--neon-copper))";

  // Format short weekday in Swedish
  const getShortSwedishWeekday = (date: Date) => {
    const days = ['sö', 'må', 'ti', 'on', 'to', 'fr', 'lö'];
    return days[date.getDay()];
  };
  
  // Format time as HH.MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  };
  
  const nextLessonTitle = nextEvent 
    ? `Nästa lektion: ${getShortSwedishWeekday(nextEvent.date)} ${formatTime(nextEvent.date)}`
    : "Nästa lektion";

  return (
    <PageTransition>
      <div 
        className="h-screen flex flex-col relative overflow-hidden"
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

        {/* Compact Hero Header with Chapter Selector */}
        <header className="relative pt-14 pb-2 px-4 z-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between gap-2"
            >
              {/* Title + Chapter Selector combined */}
              <div className="flex items-center gap-6 flex-wrap">
                <h1 
                  className="text-xl sm:text-2xl md:text-3xl font-orbitron font-bold"
                  style={{
                    color: glowColor,
                    textShadow: `0 0 20px ${glowColor}60, 0 0 40px ${glowColor}30`,
                  }}
                >
                  Kontrollpanelen {grade}
                </h1>
                
                {/* Chapter Selector inline */}
                <ChapterSelector grade={grade} onChapterChange={setSelectedChapter} />
              </div>

              {/* Quick actions */}
              <div className="hidden md:flex items-center gap-3">
                <Link 
                  to="/"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
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

        {/* Main Content - Fixed to viewport, no external scroll */}
        <main className="flex-1 px-3 lg:px-4 py-2 relative z-20 min-h-0">
          <div className="max-w-7xl mx-auto h-full">
            {/* Desktop: Three-column layout - tighter gaps for Chromebooks */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-full">
              {/* Column 1 - Resources with chapter headers + Mascot at bottom (now widest) */}
              <div className="lg:col-span-5 h-full flex flex-col gap-3 min-h-0">
                <MetalPanel 
                  title={`Kapitel ${selectedChapter} — ${getChapterSubtitle(grade, selectedChapter)}`}
                  icon={<BookOpen className="w-4 h-4" />}
                  glowColor={glowColor}
                  className="flex-1 min-h-0 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto min-h-0 -mx-4 -mb-4 px-4 pb-4 industrial-scrollbar">
                    <SuspenseResourceAccordion grade={grade} chapter={selectedChapter} />
                  </div>
                </MetalPanel>

                {/* Mascot at bottom of left column */}
                <SuspenseMascotPanel className="flex-shrink-0" />
              </div>

              {/* Column 2 - Next Lesson (takes 50%), Calculator/Radio (bottom 50%) */}
              <div className="lg:col-span-3 flex flex-col gap-2 h-full min-h-0">
                {/* Next Lesson - Takes top half */}
                <MetalPanel 
                  title={nextLessonTitle}
                  icon={<Calendar className="w-4 h-4" />}
                  glowColor={glowColor}
                  className="flex-[0.5] min-h-0 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto min-h-0 industrial-scrollbar">
                    <PostItNote grade={grade} />
                  </div>
                </MetalPanel>

                {/* Bottom half: Calculator + Geogebra + Radio stacked */}
                <div className="flex-[0.5] flex flex-col gap-2 min-h-0">
                  {/* Calculator + Geogebra side by side */}
                  <MetalPanel glowColor="hsl(var(--neon-copper))" className="flex-shrink-0">
                    <div className="flex items-center justify-center gap-2">
                      <CalculatorThumbnail compact />
                      <GeogebraLink compact />
                    </div>
                  </MetalPanel>

                  {/* Radio */}
                  <MetalPanel glowColor="hsl(var(--neon-turquoise))" className="flex-1 min-h-0">
                    <WebRadio />
                  </MetalPanel>
                </div>
              </div>

              {/* Column 3 - Calendar (scrollable, now narrower) */}
              <div className="lg:col-span-4 h-full min-h-0">
                <ScreenFrame title={`Planering Åk ${grade}`} className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <SuspenseLessonCalendar grade={grade} />
                  </div>
                </ScreenFrame>
              </div>
            </div>

            {/* Tablet: Two-column layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-4">
              {/* Left - Calendar */}
              <ScreenFrame title={`Planering Åk ${grade}`} className="h-[400px]">
                <SuspenseLessonCalendar grade={grade} />
              </ScreenFrame>

              {/* Right - Resources */}
              <MetalPanel 
                title={`Kapitel ${selectedChapter} — ${getChapterSubtitle(grade, selectedChapter)}`}
                icon={<BookOpen className="w-5 h-5" />}
                glowColor={glowColor}
                className="h-[400px]"
              >
                <div className="h-full overflow-hidden -m-4">
                  <SuspenseResourceAccordion grade={grade} chapter={selectedChapter} />
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

              <SuspenseMascotPanel />
            </div>

            {/* Mobile: Single column - optimized for touch */}
            <div className="md:hidden space-y-3 pb-24">
              {/* Quick info - compact */}
              <div id="next-lesson">
                <PostItNote grade={grade} />
              </div>

              {/* Calendar - compact height */}
              <div id="calendar">
                <ScreenFrame title={`Planering Åk ${grade}`} className="h-[280px]">
                  <SuspenseLessonCalendar grade={grade} />
                </ScreenFrame>
              </div>

              {/* Tools - horizontal scroll for touch */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 py-1 -mx-1">
                <MetalPanel glowColor="hsl(var(--neon-copper))" className="flex-shrink-0 min-w-[120px]">
                  <div className="flex items-center justify-center">
                    <CalculatorThumbnail compact />
                  </div>
                </MetalPanel>
                <MetalPanel glowColor="hsl(var(--neon-turquoise))" className="flex-shrink-0 min-w-[120px]">
                  <div className="flex items-center justify-center">
                    <GeogebraLink compact />
                  </div>
                </MetalPanel>
                <MetalPanel glowColor="hsl(var(--neon-blue))" className="flex-shrink-0 flex-1 min-w-[180px]">
                  <WebRadio />
                </MetalPanel>
              </div>

              {/* Resources - full width, touch optimized */}
              <div id="resources">
                <MetalPanel 
                  title={`Kapitel ${selectedChapter} — ${getChapterSubtitle(grade, selectedChapter)}`}
                  icon={<BookOpen className="w-5 h-5" />}
                  glowColor={glowColor}
                >
                  <div className="-m-4">
                    <SuspenseResourceAccordion grade={grade} chapter={selectedChapter} />
                  </div>
                </MetalPanel>
              </div>

              {/* Mascot - compact */}
              <SuspenseMascotPanel />
            </div>
          </div>
        </main>
        
        {/* Mobile bottom navigation */}
        <MobileBottomNav grade={grade} />
      </div>
    </PageTransition>
  );
};

export default ApocalypticGradePage;
