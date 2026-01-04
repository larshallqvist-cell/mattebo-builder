import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import Hero from "@/components/Hero";
import LessonCalendar from "@/components/LessonCalendar";
import Calculator from "@/components/Calculator";
import ChapterAccordion from "@/components/ChapterAccordion";
import PostItNote from "@/components/PostItNote";

interface GradePageProps {
  grade: number;
}

const GradePage = ({ grade }: GradePageProps) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
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
      </div>
      
      {/* Content Area - 4/5 (80%) */}
      <main className="flex-1 min-h-0 p-4 lg:p-6">
        {/* Desktop/Tablet: Grid layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 lg:gap-6 h-full">
          {/* Calendar Column - 25% */}
          <div className="col-span-1 h-full overflow-hidden">
            <LessonCalendar grade={grade} />
          </div>
          
          {/* Calculator Column - 25% */}
          <div className="col-span-1 flex flex-col gap-4">
            <Calculator />
            <PostItNote 
              grade={grade}
              rotation={-2}
            />
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
          <PostItNote 
            grade={grade}
            rotation={1}
          />
          
          {/* Calculator */}
          <Calculator />
          
          {/* Chapters */}
          <ChapterAccordion grade={grade} />
        </div>
      </main>
    </div>
  );
};

export default GradePage;
