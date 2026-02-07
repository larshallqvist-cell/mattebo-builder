import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/hooks/useHaptic";
interface ChapterSelectorProps {
  grade: number;
  onChapterChange?: (chapter: number) => void;
}

// Chapter subtitles per grade - easily configurable
const CHAPTER_SUBTITLES: Record<number, Record<number, string>> = {
  6: {
    1: "Taluppfattning och huvudräkning",
    2: "Bråk och procent",
    3: "Samband, uttryck och ekvationer",
    4: "Geometri",
    5: "Med sikte på framtiden"
  },
  7: {
    1: "Taluppfattning och tals användning",
    2: "Algebra",
    3: "Geometri",
    4: "Samband och förändring",
    5: "Sannolikhet och statistik"
  },
  8: {
    1: "Taluppfattning och tals användning",
    2: "Samband och förändring",
    3: "Geometri",
    4: "Algebra",
    5: "Sannolikhet och statistik"
  },
  9: {
    1: "Taluppfattning och tals användning",
    2: "Samband och förändring",
    3: "Algebra",
    4: "Geometri",
    5: "Med sikte på framtiden"
  }
};
const CHAPTER_COOKIE_PREFIX = "mattebo_chapter_grade_";
const getChapterFromCookie = (grade: number): number => {
  const cookieName = `${CHAPTER_COOKIE_PREFIX}${grade}`;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === cookieName) {
      const parsed = parseInt(value, 10);
      if (parsed >= 1 && parsed <= 5) return parsed;
    }
  }
  return 1; // Default to chapter 1
};
const setChapterCookie = (grade: number, chapter: number) => {
  const cookieName = `${CHAPTER_COOKIE_PREFIX}${grade}`;
  // Set cookie to expire in 6 weeks (42 days)
  const expires = new Date();
  expires.setDate(expires.getDate() + 42);
  document.cookie = `${cookieName}=${chapter};expires=${expires.toUTCString()};path=/`;
};
const getChapterSubtitle = (grade: number, chapter: number): string => {
  return CHAPTER_SUBTITLES[grade]?.[chapter] || "";
};
const ChapterSelector = ({
  grade,
  onChapterChange
}: ChapterSelectorProps) => {
  const [selectedChapter, setSelectedChapter] = useState<number>(() => getChapterFromCookie(grade));
  useEffect(() => {
    // Update cookie when chapter changes
    setChapterCookie(grade, selectedChapter);
    onChapterChange?.(selectedChapter);
  }, [selectedChapter, grade, onChapterChange]);

  // Re-read cookie when grade changes
  useEffect(() => {
    setSelectedChapter(getChapterFromCookie(grade));
  }, [grade]);
  const chapters = [1, 2, 3, 4, 5];
  const currentSubtitle = getChapterSubtitle(grade, selectedChapter);
  return (
    <div className="py-1 md:py-2 px-2 md:px-4 flex items-center justify-center">
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground mr-1 sm:mr-2">Kap:</span>
        <div className="flex gap-1">
          {chapters.map(chapter => (
            <button 
              key={chapter} 
              onClick={() => {
                hapticFeedback('light');
                setSelectedChapter(chapter);
              }} 
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full text-sm sm:text-base font-medium transition-all",
                "border-2 hover:scale-105 active:scale-95",
                selectedChapter === chapter 
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                  : "bg-background/50 text-foreground border-muted-foreground/30 hover:border-primary/50"
              )}
            >
              {chapter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ChapterSelector;
export { getChapterFromCookie, getChapterSubtitle };