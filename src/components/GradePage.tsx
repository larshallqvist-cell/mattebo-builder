import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import Hero from "@/components/Hero";
import LessonCalendar from "@/components/LessonCalendar";
import CalculatorThumbnail from "@/components/CalculatorThumbnail";
import WebRadio from "@/components/WebRadio";
import ChapterAccordion from "@/components/ChapterAccordion";
import PostItNote from "@/components/PostItNote";

interface GradePageProps {
  grade: number;
}

const GradePage = ({ grade }: GradePageProps) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden font-body">
      {/* Hero Section - 1/5 (20%) */}
      <div className="relative">
        <Hero 
          title={`Resurser Åk ${grade}`}
          heightClass="h-[20vh]"
        />
        
        {/* Home button */}
        <Link
          to="/"
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-secondary/80 hover:bg-secondary rounded-lg transition-colors"
        >
          <Home className="w-5 h-5 text-secondary-foreground" />
          <span className="text-sm font-medium text-secondary-foreground hidden sm:inline">Hem</span>
        </Link>
        
        {/* Glowing divider line */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[4px] animate-glow-pulse-orange"
          style={{ 
            background: 'linear-gradient(90deg, transparent, hsl(var(--divider-orange)) 15%, hsl(var(--divider-orange)) 85%, transparent)'
          }}
        />
      </div>
      
      {/* Content Area - moved closer to hero */}
      <main className="flex-1 min-h-0 px-4 pt-2 pb-0 lg:px-6">
        {/* Desktop/Tablet: Grid layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 lg:gap-6 h-full pb-4">
          {/* Calendar Column - 25%, stretches to bottom */}
          <div className="col-span-1 h-full overflow-hidden flex flex-col">
            <LessonCalendar grade={grade} />
          </div>
          
          {/* Post-it + Calculator + Radio Column - 25% */}
          <div className="col-span-1 flex flex-col gap-4">
            <PostItNote grade={grade} />
            <div className="flex items-start gap-4">
              <CalculatorThumbnail />
              <div className="flex-1">
                <WebRadio />
              </div>
            </div>
          </div>
          
          {/* Chapter Accordion - 50% */}
          <div className="col-span-2 h-full overflow-hidden">
            <ChapterAccordion grade={grade} />
          </div>
        </div>
        
        {/* Mobile: Vertical stack */}
        <div className="md:hidden space-y-4 overflow-y-auto h-full pb-8">
          {/* Calendar */}
          <div className="h-[400px]">
            <LessonCalendar grade={grade} />
          </div>
          
          {/* Post-it */}
          <PostItNote grade={grade} />
          
          {/* Calculator + Radio */}
          <div className="flex items-start gap-4">
            <CalculatorThumbnail />
            <div className="flex-1">
              <WebRadio />
            </div>
          </div>
          
          {/* Chapters */}
          <ChapterAccordion grade={grade} />
        </div>
      </main>
    </div>
  );
};

export default GradePage;
