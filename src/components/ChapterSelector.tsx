import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChapterSelectorProps {
  grade: number;
  onChapterChange?: (chapter: number) => void;
}

// Chapter subtitles per grade - easily configurable
const CHAPTER_SUBTITLES: Record<number, Record<number, string>> = {
  6: {
    1: "Tal och beräkningar",
    2: "Algebra",
    3: "Geometri",
    4: "Bråk och procent",
    5: "Statistik",
  },
  7: {
    1: "Tal och beräkningar",
    2: "Algebra",
    3: "Geometri",
    4: "Samband och förändring",
    5: "Sannolikhet och Statistik",
  },
  8: {
    1: "Tal och beräkningar",
    2: "Algebra",
    3: "Geometri",
    4: "Samband och förändring",
    5: "Statistik",
  },
  9: {
    1: "Tal och beräkningar",
    2: "Algebra",
    3: "Geometri",
    4: "Bråk och procent",
    5: "Statistik",
  },
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

const ChapterSelector = ({ grade, onChapterChange }: ChapterSelectorProps) => {
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
    <div className="flex flex-col items-center py-2 px-4">
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2 hidden sm:inline">Kapitel:</span>
        <div className="flex gap-1 sm:gap-2">
          {chapters.map((chapter) => (
            <button
              key={chapter}
              onClick={() => setSelectedChapter(chapter)}
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm font-medium transition-all",
                "border-2 hover:scale-105",
                selectedChapter === chapter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-muted-foreground/30 hover:border-primary/50",
              )}
            >
              {chapter}
            </button>
          ))}
        </div>
      </div>
      {/* Subtitle removed - now shown in ResourceAccordion header */}
    </div>
  );
};

export default ChapterSelector;
export { getChapterFromCookie, getChapterSubtitle };
