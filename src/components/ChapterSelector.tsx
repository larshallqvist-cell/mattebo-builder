import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/hooks/useHaptic";
import { CHAPTER_SUBTITLES, CHAPTER_COOKIE_PREFIX, CHAPTER_COOKIE_DAYS, MIN_CHAPTER, MAX_CHAPTER } from "@/config/app";

interface ChapterSelectorProps {
  grade: number;
  onChapterChange?: (chapter: number) => void;
}

const getChapterFromCookie = (grade: number): number => {
  const cookieName = `${CHAPTER_COOKIE_PREFIX}${grade}`;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === cookieName) {
      const parsed = parseInt(value, 10);
      if (parsed >= MIN_CHAPTER && parsed <= MAX_CHAPTER) return parsed;
    }
  }
  return 1; // Default to chapter 1
};
const setChapterCookie = (grade: number, chapter: number) => {
  const cookieName = `${CHAPTER_COOKIE_PREFIX}${grade}`;
  const expires = new Date();
  expires.setDate(expires.getDate() + CHAPTER_COOKIE_DAYS);
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
    <div className="flex flex-col items-center justify-center gap-0.5">
      <span className="text-[0.6rem] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Kapitel</span>
      <div className="flex gap-1">
        {chapters.map(chapter => (
          <button 
            key={chapter} 
            onClick={() => {
              hapticFeedback('light');
              setSelectedChapter(chapter);
            }} 
            className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full text-sm sm:text-base font-medium transition-all",
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
  );
};
export default ChapterSelector;
export { getChapterFromCookie, getChapterSubtitle };