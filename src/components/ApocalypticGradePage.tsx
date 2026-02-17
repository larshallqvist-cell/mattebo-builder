import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Calendar, BookOpen, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoginGate from "@/components/LoginGate";
import WelcomeFlash from "@/components/WelcomeFlash";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ApocalypticNav from "@/components/ApocalypticNav";
import MetalPanel from "@/components/MetalPanel";
import ScreenFrame from "@/components/ScreenFrame";
import CalculatorThumbnail from "@/components/CalculatorThumbnail";
import GeogebraLink from "@/components/GeogebraLink";
import MattebokenLink from "@/components/MattebokenLink";
import WebRadio from "@/components/WebRadio";
import LessonTimer from "@/components/LessonTimer";
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
  const [activeRadioChannel, setActiveRadioChannel] = useState<string | null>(null);
  const { nextEvent } = useCalendarEvents(grade);
  const { user } = useAuth();
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
    <LoginGate>
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
        {/* Welcome Flash for logged-in users */}
        {user && <WelcomeFlash />}

        {/* Navigation */}
        <ApocalypticNav />

        {/* Compact Hero Header with Chapter Selector */}
        <header className="relative pt-14 md:pt-14 pb-2 px-3 md:px-4 z-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              {/* Title + Chapter Selector - stacked on mobile, inline on desktop */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <h1 
                  className="text-2xl md:text-3xl font-orbitron font-bold text-center md:text-left"
                  style={{
                    color: glowColor,
                    textShadow: `0 0 20px ${glowColor}60, 0 0 40px ${glowColor}30`,
                  }}
                >
                  Åk {grade}
                </h1>
                
                {/* Chapter Selector - horizontal centered on mobile */}
                <ChapterSelector grade={grade} onChapterChange={setSelectedChapter} />
              </div>

              {/* Quick actions - hidden on mobile */}
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
              {/* Column 1 - Resources with chapter headers + Mascot at bottom */}
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

              {/* Column 2 - Next Lesson + Tools - flexible sizing */}
              <div className="lg:col-span-4 flex flex-col gap-2 h-full min-h-0">
                {/* Next Lesson - elastic, expands with content */}
                <MetalPanel 
                  title={nextLessonTitle}
                  icon={<Calendar className="w-4 h-4" />}
                  glowColor={glowColor}
                  className="flex-shrink-0"
                >
                  <PostItNote grade={grade} />
                </MetalPanel>

                {/* Combined Tools Panel - 3x3 grid that fills available space */}
                <MetalPanel 
                  title="Verktyg" 
                  glowColor="hsl(var(--neon-copper))" 
                  className="flex-1 min-h-0" 
                  showSparks
                  titleExtra={
                    activeRadioChannel && (
                      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                    )
                  }
                >
                  <div className="flex items-start gap-3 h-full">
                    <div className="flex-shrink-0 self-center">
                      <LessonTimer grade={grade} size={100} />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 flex-1 self-stretch" style={{ gridTemplateRows: 'repeat(3, 1fr)' }}>
                      <CalculatorThumbnail fillSpace />
                      <GeogebraLink fillSpace />
                      <MattebokenLink fillSpace />
                      <WebRadio fillSpace onChannelChange={setActiveRadioChannel} />
                    </div>
                  </div>
                </MetalPanel>
              </div>

              {/* Column 3 - Calendar (narrower) */}
              <div className="lg:col-span-3 h-full min-h-0">
                <ScreenFrame title={`Planering Åk ${grade}`} className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <SuspenseLessonCalendar grade={grade} />
                  </div>
                </ScreenFrame>
              </div>
            </div>

            {/* Tablet: Two-column layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-4 h-full">
              {/* Left column - Calendar + Tools */}
              <div className="flex flex-col gap-4">
                <ScreenFrame title={`Planering Åk ${grade}`} className="flex-1 min-h-[300px]">
                  <SuspenseLessonCalendar grade={grade} />
                </ScreenFrame>

                {/* Tools - 3x3 grid */}
                <MetalPanel 
                  title="Verktyg" 
                  glowColor="hsl(var(--neon-copper))" 
                  className="min-h-[200px]"
                  showSparks
                  titleExtra={
                    activeRadioChannel && (
                      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                    )
                  }
                >
                  <div className="flex flex-col gap-2 h-full" style={{ minHeight: '180px' }}>
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <CalculatorThumbnail fillSpace />
                      <GeogebraLink fillSpace />
                      <MattebokenLink fillSpace />
                      <WebRadio fillSpace onChannelChange={setActiveRadioChannel} />
                    </div>
                    <div className="flex justify-center">
                      <LessonTimer grade={grade} />
                    </div>
                  </div>
                </MetalPanel>
              </div>

              {/* Right column - Resources + Mascot */}
              <div className="flex flex-col gap-4">
                <MetalPanel 
                  title={`Kapitel ${selectedChapter} — ${getChapterSubtitle(grade, selectedChapter)}`}
                  icon={<BookOpen className="w-5 h-5" />}
                  glowColor={glowColor}
                  className="flex-1"
                >
                  <div className="h-full overflow-y-auto -m-4 px-4 py-4">
                    <SuspenseResourceAccordion grade={grade} chapter={selectedChapter} />
                  </div>
                </MetalPanel>

                <SuspenseMascotPanel />
              </div>
            </div>

            {/* Mobile: Single column - optimized for touch */}
            <div className="md:hidden space-y-4 pb-24 px-1">
              {/* Quick info - compact */}
              <div id="next-lesson">
                <PostItNote grade={grade} />
              </div>

              {/* Tools - 3x3 grid for mobile - LARGER and more prominent */}
              <MetalPanel 
                title="Verktyg" 
                glowColor="hsl(var(--neon-copper))" 
                showSparks
                className="border border-primary/20"
                titleExtra={
                  activeRadioChannel && (
                    <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                  )
                }
              >
                <div className="flex flex-col gap-3" style={{ minHeight: '240px' }}>
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    <CalculatorThumbnail fillSpace />
                    <GeogebraLink fillSpace />
                    <MattebokenLink fillSpace />
                    <WebRadio fillSpace onChannelChange={setActiveRadioChannel} />
                  </div>
                  <div className="flex justify-center">
                    <LessonTimer grade={grade} />
                  </div>
                </div>
              </MetalPanel>

              {/* Calendar - compact height */}
              <div id="calendar">
                <ScreenFrame title={`Planering Åk ${grade}`} className="h-[260px]">
                  <SuspenseLessonCalendar grade={grade} />
                </ScreenFrame>
              </div>

              {/* Resources - full width, touch optimized */}
              <div id="resources">
                <MetalPanel 
                  title={`Kap ${selectedChapter}: ${getChapterSubtitle(grade, selectedChapter)}`}
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
    </LoginGate>
  );
};

export default ApocalypticGradePage;
