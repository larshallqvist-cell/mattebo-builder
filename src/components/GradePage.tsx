import { useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import ParallaxHero from "@/components/ParallaxHero";
import HandwrittenText from "@/components/HandwrittenText";
import PageTransition from "@/components/PageTransition";
import LessonCalendar from "@/components/LessonCalendar";
import CalculatorThumbnail from "@/components/CalculatorThumbnail";
import WebRadio from "@/components/WebRadio";
import ResourceAccordion from "@/components/ResourceAccordion";
import PostItNote from "@/components/PostItNote";
import ChapterSelector, { getChapterFromCookie } from "@/components/ChapterSelector";

interface GradePageProps {
  grade: number;
}

const GradePage = ({ grade }: GradePageProps) => {
  const [selectedChapter, setSelectedChapter] = useState(() => getChapterFromCookie(grade));

  return (
    <PageTransition>
      <div className="h-screen flex flex-col overflow-hidden font-body">
        {/* Hero Section - 1/5 (20%) */}
        <div className="relative">
          <ParallaxHero 
            title={`Årskurs ${grade}`}
            heightClass="h-[20vh]"
          >
            <HandwrittenText 
              text={`Årskurs ${grade}`}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl chalk-text font-bold tracking-wide"
              speed={0.06}
            />
          </ParallaxHero>
          
          {/* Home button */}
          <Link
            to="/"
            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-secondary/80 hover:bg-secondary rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 text-secondary-foreground" />
            <span className="text-sm font-medium text-secondary-foreground hidden sm:inline">Hem</span>
          </Link>
        </div>
        
        {/* Chapter Selector - between hero and divider */}
        <div className="bg-background/80 backdrop-blur-sm border-b border-border/50">
          <ChapterSelector grade={grade} onChapterChange={setSelectedChapter} />
        </div>
        
        {/* Glowing divider line */}
        <div 
          className="h-[4px] animate-glow-pulse-orange flex-shrink-0"
          style={{ 
            background: 'linear-gradient(90deg, transparent, hsl(var(--divider-orange)) 15%, hsl(var(--divider-orange)) 85%, transparent)'
          }}
        />
        
        {/* Content Area - 2/3 (resources) + 1/3 (calendar/tools) from md */}
        <main className="flex-1 min-h-0 px-4 pt-2 pb-0 lg:px-6">
          {/* Desktop/Tablet: 2/3 - 1/3 layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 h-full pb-4">
            {/* Left Column (1/3) - Calendar, Post-it, Tools */}
            <div className="md:col-span-1 h-full overflow-hidden flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                <LessonCalendar grade={grade} />
              </div>
              <PostItNote grade={grade} />
              <div className="flex items-start gap-4">
                <CalculatorThumbnail />
                <div className="flex-1">
                  <WebRadio />
                </div>
              </div>
            </div>
            
            {/* Right Column (2/3) - Resources */}
            <div className="md:col-span-2 h-full overflow-hidden">
              <ResourceAccordion grade={grade} chapter={selectedChapter} />
            </div>
          </div>
          
          {/* Mobile: Vertical stack */}
          <div className="md:hidden space-y-4 overflow-y-auto h-full pb-8">
            {/* Post-it first on mobile */}
            <PostItNote grade={grade} />
            
            {/* Calendar */}
            <div className="h-[400px]">
              <LessonCalendar grade={grade} />
            </div>
            
            {/* Calculator + Radio */}
            <div className="flex items-start gap-4">
              <CalculatorThumbnail />
              <div className="flex-1">
                <WebRadio />
              </div>
            </div>
            
            {/* Resources */}
            <ResourceAccordion grade={grade} chapter={selectedChapter} />
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default GradePage;
