import { useState } from "react";
import { Calendar, BookOpen, Volume2, Wrench, Sun } from "lucide-react";
import LoginGate from "@/components/LoginGate";

import PageTransition from "@/components/PageTransition";
import ApocalypticNav from "@/components/ApocalypticNav";
import CalculatorThumbnail from "@/components/CalculatorThumbnail";
import WebRadio from "@/components/WebRadio";
import LunchMenu from "@/components/LunchMenu";
import LessonTimer from "@/components/LessonTimer";
import PostItNote from "@/components/PostItNote";
import HomeworkBanner from "@/components/HomeworkBanner";
import SurveyLamp from "@/components/SurveyLamp";
import LessonNotesButton from "@/components/LessonNotesButton";
import ViewModeToggle from "@/components/ViewModeToggle";
import CollapsibleSection from "@/components/CollapsibleSection";
import { useViewMode } from "@/hooks/useViewMode";
import { useIsWideLayout } from "@/hooks/useSectionOpen";
import ChapterSelector, { getChapterFromCookie, getChapterSubtitle } from "@/components/ChapterSelector";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { GRADE_NEON_COLORS } from "@/config/app";
import { SuspenseResourceAccordion, SuspenseLessonCalendar, SuspenseMascotPanel } from "@/components/LazyComponents";

interface ApocalypticGradePageProps {
  grade: number;
}

const TOOL_LINKS = [
  { label: "Drills", url: "https://drills.vidma.se" },
  { label: "Tabellerna", url: "https://multiplication.fluentmath.com/" },
  { label: "Mathdrop", url: "https://vidma.se/mathdrop/" },
] as const;

const ToolsGrid = ({ onChannelChange }: { onChannelChange: (c: string | null) => void }) => (
  <div className="grid grid-cols-2 gap-3 h-[140px]">
    <div className="flex flex-col gap-2 min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        <CalculatorThumbnail fillSpace />
      </div>
      <div className="flex-shrink-0 grid grid-cols-3 gap-1.5">
        {TOOL_LINKS.map((link) => (
          <button
            key={link.url}
            type="button"
            onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
            className="rounded-lg bg-primary/80 hover:bg-primary text-primary-foreground text-xs font-semibold py-1.5 transition-colors"
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-1.5 min-h-0 overflow-hidden [&_span:first-child]:!text-2xl">
      <WebRadio fillSpace onChannelChange={onChannelChange} />
    </div>
  </div>
);

const formatNext = (date: Date) =>
  date.toLocaleString("sv-SE", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });

const ApocalypticGradePage = ({ grade }: ApocalypticGradePageProps) => {
  const [selectedChapter, setSelectedChapter] = useState(() => getChapterFromCookie(grade));
  const [activeRadioChannel, setActiveRadioChannel] = useState<string | null>(null);
  const { nextEvent } = useCalendarEvents(grade);
  const { mode } = useViewMode();
  const wide = useIsWideLayout(mode);
  const glowColor = GRADE_NEON_COLORS[grade as keyof typeof GRADE_NEON_COLORS] || "hsl(var(--neon-copper))";

  // Wide layout places planning in a right column; narrow layout stacks everything.
  const left = wide ? "col-span-8 col-start-1" : "";

  return (
    <LoginGate>
      <PageTransition>
        <div
          className="h-screen flex flex-col relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)" }}
        >
          <ApocalypticNav
            grade={grade}
            glowColor={glowColor}
            centerContent={
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <ViewModeToggle compact />
                <LessonNotesButton grade={grade} />
                <SurveyLamp grade={grade} />
                <LessonTimer grade={grade} size={56} hideClock />
              </div>
            }
          />

          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-28 sm:px-4 lg:pb-8 relative z-20" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className={`max-w-7xl mx-auto ${wide ? "grid grid-cols-12 gap-5 items-start" : "flex flex-col gap-5"}`}>
              {/* 1. Idag – always open, strongest accent */}
              <CollapsibleSection
                id="today"
                title="Idag"
                icon={<Sun className="h-5 w-5" />}
                tone="accent"
                alwaysOpen
                className={left}
                contentClassName="space-y-3"
              >
                <PostItNote grade={grade} />
                <HomeworkBanner grade={grade} />
              </CollapsibleSection>

              {/* 2. Resurser – chapter selector lives in the header */}
              <CollapsibleSection
                id="resources"
                title={`Kapitel ${selectedChapter} — ${getChapterSubtitle(grade, selectedChapter)}`}
                icon={<BookOpen className="h-4 w-4 text-primary" />}
                alwaysOpen
                headerControls={<ChapterSelector grade={grade} onChapterChange={setSelectedChapter} variant="title" />}
                className={left}
                contentClassName="-mx-1"
              >
                <SuspenseResourceAccordion grade={grade} chapter={selectedChapter} />
              </CollapsibleSection>

              {/* 3. Planering – right column on wide screens, collapsed by default on mobile */}
              <CollapsibleSection
                id="calendar"
                title={`Planering Åk ${grade}`}
                icon={<Calendar className="h-4 w-4 text-primary" />}
                headerExtra={!wide && nextEvent ? `nästa: ${formatNext(nextEvent.date)}` : undefined}
                alwaysOpen={wide}
                defaultOpen={false}
                className={wide ? "col-span-4 col-start-9 row-start-1 row-span-4 sticky top-0" : ""}
                contentClassName={wide ? "h-[calc(100vh-14rem)] overflow-y-auto industrial-scrollbar" : "h-[340px] overflow-y-auto"}
              >
                <SuspenseLessonCalendar grade={grade} />
              </CollapsibleSection>

              {/* 4. Verktyg – muted; open on wide screens, closed on mobile */}
              <CollapsibleSection
                id="tools"
                title="Verktyg"
                icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
                headerExtra={activeRadioChannel ? <Volume2 className="inline h-4 w-4 text-primary animate-pulse" /> : undefined}
                tone="muted"
                keepMounted
                defaultOpen={wide}
                className={left}
                contentClassName="space-y-3"
              >
                <ToolsGrid onChannelChange={setActiveRadioChannel} />
                <div className="pt-3 border-t border-border/40">
                  <LunchMenu compact />
                </div>
              </CollapsibleSection>

              {/* Mat-t-e – last and small */}
              <div className={`${left} opacity-90`}>
                <SuspenseMascotPanel compact />
              </div>
            </div>
          </main>

          <MobileBottomNav grade={grade} />
        </div>
      </PageTransition>
    </LoginGate>
  );
};

export default ApocalypticGradePage;
