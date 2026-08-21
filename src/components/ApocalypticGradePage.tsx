import { useState } from "react";
import { Calendar, BookOpen, Volume2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoginGate from "@/components/LoginGate";
import WelcomeFlash from "@/components/WelcomeFlash";

import PageTransition from "@/components/PageTransition";
import ApocalypticNav from "@/components/ApocalypticNav";
import MetalPanel from "@/components/MetalPanel";
import ScreenFrame from "@/components/ScreenFrame";
import CalculatorThumbnail from "@/components/CalculatorThumbnail";
import WebRadio from "@/components/WebRadio";
import LunchMenu from "@/components/LunchMenu";
import LessonTimer from "@/components/LessonTimer";
import PostItNote from "@/components/PostItNote";
import HomeworkBanner from "@/components/HomeworkBanner";
import ChapterSelector, { getChapterFromCookie, getChapterSubtitle } from "@/components/ChapterSelector";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { GRADE_NEON_COLORS } from "@/config/app";
// Lazy-loaded components for better initial load performance
import { 
  SuspenseResourceAccordion, 
  SuspenseLessonCalendar, 
  SuspenseMascotPanel 
} from "@/components/LazyComponents";


interface ApocalypticGradePageProps {
  grade: number;
}

const ApocalypticGradePage = ({ grade }: ApocalypticGradePageProps) => {
  const [selectedChapter, setSelectedChapter] = useState(() => getChapterFromCookie(grade));
  const [activeRadioChannel, setActiveRadioChannel] = useState<string | null>(null);
  const { nextEvent } = useCalendarEvents(grade);
  const { user } = useAuth();
  const glowColor = GRADE_NEON_COLORS[grade as keyof typeof GRADE_NEON_COLORS] || "hsl(var(--neon-copper))";


  const nextLessonTitle = "NÄSTA LEKTION";


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

        {/* Navigation with grade, chapter selector, and homework on desktop */}
        <ApocalypticNav
          centerContent={
            <>
              <div className="flex items-center gap-3">
                <h1
                  className="text-xl font-orbitron font-bold whitespace-nowrap"
                  style={{
                    color: glowColor,
                    textShadow: `0 0 16px ${glowColor}60`,
                  }}
                >
                  Åk {grade}
                </h1>
                <ChapterSelector grade={grade} onChapterChange={setSelectedChapter} />
              </div>
              <HomeworkBanner grade={grade} compact />
              <div className="ml-auto flex-shrink-0">
                <LessonTimer grade={grade} size={44} hideClock />
              </div>
            </>
          }
        />

        {/* Mobile: homework + header below nav */}
        <div className="lg:hidden px-3 md:px-6 pt-20 pb-2 relative z-20">
          <HomeworkBanner grade={grade} />
          <header className="mt-3">
            <div className="flex flex-row items-center justify-start gap-4">
              <h1
                className="text-xl font-orbitron font-bold whitespace-nowrap"
                style={{
                  color: glowColor,
                  textShadow: `0 0 16px ${glowColor}60`,
                }}
              >
                Åk {grade}
              </h1>
              <ChapterSelector grade={grade} onChapterChange={setSelectedChapter} />
            </div>
          </header>
        </div>

        {/* Glowing divider — desktop gets extra top padding to clear the expanded nav */}
        <div
          className="h-[2px] mx-6 relative z-20 lg:pt-28"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor}80 20%, ${glowColor} 50%, ${glowColor}80 80%, transparent)`,
            boxShadow: `0 0 15px ${glowColor}60`,
          }}
        />

        {/* Main Content - Fixed to viewport, no external scroll */}
        <main
          className="flex-1 px-3 lg:px-4 py-1 lg:pt-2 lg:pb-3 relative z-20 min-h-0 overflow-y-auto lg:overflow-hidden overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="max-w-7xl mx-auto lg:h-full">
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

                {/* Mascot at bottom of left column — compact so resources get more height */}
                <SuspenseMascotPanel className="flex-shrink-0" compact />
              </div>

              {/* Column 2 - Next Lesson + Tools - flexible sizing */}
              <div className="lg:col-span-4 flex flex-col gap-2 h-full min-h-0 overflow-y-auto industrial-scrollbar pr-1">
                {/* Next Lesson - elastic, expands with content */}
                <MetalPanel 
                  title={nextLessonTitle}
                  icon={<Calendar className="w-4 h-4" />}
                  glowColor={glowColor}
                  className="flex-shrink-0"
                >
                  <PostItNote grade={grade} />
                </MetalPanel>

                {/* Combined Tools Panel - 2x2 grid fills remaining space */}
                <MetalPanel 
                  title="Verktyg" 
                  glowColor="hsl(var(--neon-copper))" 
                  className="flex-1 min-h-[180px] flex flex-col flex-shrink-0" 
                  showSparks
                  titleExtra={
                    activeRadioChannel && (
                      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                    )
                  }
                >
                  <div className="flex-1 min-h-0 flex flex-col gap-3">
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0 [&>*]:min-h-0 [&>*]:overflow-hidden">
                      <CalculatorThumbnail fillSpace />
                      <WebRadio fillSpace onChannelChange={setActiveRadioChannel} />
                    </div>
                    <div className="pt-3 border-t border-border/40 flex-shrink-0">
                      <LunchMenu compact />
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

            {/* Tablet: Two-column layout — auto height so the page scrolls */}
            <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-4 items-start pb-24">
              {/* Left column - Calendar + Tools */}
              <div className="flex flex-col gap-4">
                <ScreenFrame title={`Planering Åk ${grade}`} className="flex-1 min-h-[300px]">
                  <SuspenseLessonCalendar grade={grade} />
                </ScreenFrame>

                {/* Tools - 2x2 grid fills remaining space */}
                <MetalPanel 
                  title="Verktyg" 
                  glowColor="hsl(var(--neon-copper))" 
                  className="flex-1 min-h-[180px] flex flex-col flex-shrink-0" 
                  showSparks
                  titleExtra={
                    activeRadioChannel && (
                      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                    )
                  }
                >
                  <div className="flex-1 min-h-0 flex flex-col gap-3">
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0 [&>*]:min-h-0 [&>*]:overflow-hidden">
                      <CalculatorThumbnail fillSpace />
                      <WebRadio fillSpace onChannelChange={setActiveRadioChannel} />
                    </div>
                    <div className="pt-3 border-t border-border/40 flex-shrink-0">
                      <LunchMenu compact />
                    </div>
                    <div className="pt-3 border-t border-border/40 flex justify-center flex-shrink-0">
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
                  className="flex-1 min-h-[300px]"
                >
                  <div className="max-h-[60vh] overflow-y-auto -m-4 px-4 py-4">
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
                  <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0 [&>*]:min-h-0 [&>*]:overflow-hidden">
                    <CalculatorThumbnail fillSpace />
                    <WebRadio fillSpace onChannelChange={setActiveRadioChannel} />
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <LunchMenu compact />
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
