import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, BookOpen, Volume2, Wrench, Pin, Calculator, Dumbbell, Grid3x3, Droplets, PieChart, Timer, Sigma, Percent, Puzzle, Crosshair, Package } from "lucide-react";
import ChapterSections, { ChapterTitle } from "@/components/ChapterHeader";
import LoginGate from "@/components/LoginGate";

import PageTransition from "@/components/PageTransition";
import ApocalypticNav from "@/components/ApocalypticNav";
import CalculatorModal from "@/components/CalculatorModal";
import WebRadio from "@/components/WebRadio";
import LunchMenu from "@/components/LunchMenu";
import LessonTimer from "@/components/LessonTimer";
import PostItNote from "@/components/PostItNote";
import HomeworkBanner from "@/components/HomeworkBanner";
import AnnouncementFlash from "@/components/AnnouncementFlash";
import SurveyLamp from "@/components/SurveyLamp";
import LessonNotesButton from "@/components/LessonNotesButton";
import ViewModeToggle from "@/components/ViewModeToggle";
import CollapsibleSection from "@/components/CollapsibleSection";
import { useViewMode } from "@/hooks/useViewMode";
import { useIsWideLayout } from "@/hooks/useSectionOpen";
import { getChapterFromCookie } from "@/components/ChapterSelector";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { SuspenseResourceAccordion, SuspenseLessonCalendar, SuspenseMascotPanel } from "@/components/LazyComponents";

interface ApocalypticGradePageProps {
  grade: number;
}

/** Each class gets its own tint in the header headline, matching the start-page circles. */
const GRADE_TINT: Record<number, string> = {
  6: "var(--grade-6)",
  7: "var(--grade-7)",
  8: "var(--grade-8)",
  9: "var(--grade-9)",
};


const TOOL_LINKS: { label: string; url: string; icon: typeof Calculator; internal?: boolean }[] = [
  { label: "Drills", url: "https://drills.vidma.se", icon: Dumbbell },
  { label: "Tabellerna", url: "https://multiplication.fluentmath.com/", icon: Grid3x3 },
  { label: "Mathdrop", url: "https://vidma.se/mathdrop/", icon: Droplets },
  { label: "Bråklabbet", url: "/braklabbet", icon: PieChart, internal: true },
  { label: "Tabelltest", url: "/tabelltestet", icon: Timer, internal: true },
  { label: "Algebra", url: "/algebra", icon: Sigma, internal: true },
  { label: "Procent", url: "/procent", icon: Percent, internal: true },
  { label: "Ekvationer", url: "/ekvationer", icon: Puzzle, internal: true },
  { label: "Koordinater", url: "/koordinater", icon: Crosshair, internal: true },
  { label: "Kistan", url: "/kistan", icon: Package, internal: true },
];

const toolBtn =
  "relative flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl border px-1.5 py-1.5 text-center text-sm font-bold text-background transition-transform duration-300 hover:scale-[1.06] active:scale-95 [font-family:'Short_Stack',cursive]";

/** Same weightless feel as the start-page grade circles: slow staggered float, soft halo and layered shadow. */
const floatWrap = (i: number) => ({
  className: `group relative block ${i % 2 === 0 ? "animate-float-soft" : "animate-float-soft-delayed"}`,
  style: { animationDelay: `${(i % 4) * -0.9}s` },
});

const pastel = (i: number) => {
  const c = `var(--pastel-${(i % 9) + 1})`;
  return {
    backgroundColor: `hsl(${c})`,
    borderColor: `hsl(${c} / 0.5)`,
    boxShadow: `0 2px 4px hsl(var(--background) / 0.18), 0 10px 22px -6px hsl(${c} / 0.55), 0 18px 34px -14px hsl(var(--background) / 0.45)`,
  };
};

const ToolHalo = ({ i }: { i: number }) => (
  <span
    aria-hidden
    className="pointer-events-none absolute -inset-2 rounded-3xl opacity-35 blur-lg transition-opacity duration-500 group-hover:opacity-70"
    style={{ background: `radial-gradient(circle, hsl(var(--pastel-${(i % 9) + 1})) 0%, transparent 70%)` }}
  />
);

const headerBtn =
  "relative flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-card/60 text-foreground hover:bg-accent/30 transition-colors flex-shrink-0 sm:h-9 sm:w-9";

/** Calculator and today's lunch live in the header so the page body stays about the chapter. */
const HeaderTools = () => {
  const [calcOpen, setCalcOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setCalcOpen(true)} aria-label="Kalkylator" title="Kalkylator" className={headerBtn}>
        <Calculator className="h-4 w-4" />
      </button>
      <CalculatorModal open={calcOpen} onOpenChange={setCalcOpen} />
    </>
  );
};

const ToolsGrid = ({ onChannelChange }: { onChannelChange: (c: string | null) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2.5 pt-1 sm:grid-cols-4 xl:grid-cols-2">
      {TOOL_LINKS.map(({ label, url, icon: Icon, internal }, i) =>
        internal ? (
          <span key={url} {...floatWrap(i)}>
            <ToolHalo i={i + 1} />
            <Link to={url} className={toolBtn} style={pastel(i + 1)}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </span>
        ) : (
          <span key={url} {...floatWrap(i)}>
            <ToolHalo i={i + 1} />
            <button type="button" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} className={toolBtn} style={pastel(i + 1)}>
              <Icon className="h-5 w-5" />
              {label}
            </button>
          </span>
        ),
      )}
    </div>
    <div className="grid grid-cols-3 gap-1.5 h-[52px] [&_span:first-child]:!text-xl">
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

  // Wide layout: chapter work in a ~70% main column, a calmer notice board (~30%) on the right.
  // Narrow layout stacks everything and folds the notice board into one card.
  // From 1280px the resources narrow to ~half and the games get their own middle column.
  // The chapter title and sub-chapters live in the header, so resources and games start at the top.
  const resourcesCol = wide ? "col-span-7 col-start-1 row-start-1 xl:col-span-5" : "";
  const toolsCol = wide ? "col-span-7 col-start-1 row-start-2 xl:col-span-2 xl:col-start-6 xl:row-start-1" : "";

  return (
    <LoginGate>
      <PageTransition>
        <div
          className="h-screen flex flex-col relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)" }}
        >
          <ApocalypticNav
            grade={grade}
            chapter={selectedChapter}
            tint={GRADE_TINT[grade] ?? "var(--accent)"}
            headerAction={
              <>
                <HeaderTools />
                <SurveyLamp grade={grade} compact />
                <ViewModeToggle compact />
                <LessonNotesButton grade={grade} />
              </>
            }
            subtitle={<ChapterTitle grade={grade} chapter={selectedChapter} onChapterChange={setSelectedChapter} />}
            centerContent={
              <>
                <ChapterSections grade={grade} chapter={selectedChapter} />
                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                  <LessonTimer grade={grade} size={44} hideClock />
                </div>
              </>
            }

          />

          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-28 sm:px-4 lg:pb-8 relative z-20" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className={`max-w-7xl mx-auto ${wide ? "grid grid-cols-10 gap-5 items-start" : "flex flex-col gap-4"}`}>
              {/* Anslagstavla – right column on wide screens, one folded card on mobile */}
              <CollapsibleSection
                id="board"
                title="Anslagstavla"
                icon={<Pin className="h-4 w-4 text-primary" />}
                headerExtra={!wide && nextEvent ? `nästa lektion ${formatNext(nextEvent.date)}` : undefined}
                tone="muted"
                alwaysOpen={wide}
                defaultOpen={false}
                keepMounted
                className={wide ? "col-span-3 col-start-8 row-start-1 row-span-2 sticky top-0 max-h-[calc(100vh-11rem)] overflow-y-auto industrial-scrollbar" : ""}
                contentClassName="space-y-4"
              >
                <PostItNote grade={grade} />
                <HomeworkBanner grade={grade} />
                <div id="calendar" className="scroll-mt-4">
                  <h3 className="mb-2 flex items-center gap-2 font-sora text-sm font-extrabold tracking-tight text-foreground/90">
                    <Calendar className="h-4 w-4 text-primary" />
                    Planering Åk {grade}
                  </h3>
                  <div className="h-[340px] overflow-y-auto industrial-scrollbar rounded-xl">
                    <SuspenseLessonCalendar grade={grade} />
                  </div>
                </div>
                <div className="opacity-90">
                  <SuspenseMascotPanel compact />
                </div>
              </CollapsibleSection>

              {/* 2. Resurser för valt kapitel */}
              <CollapsibleSection
                id="resources"
                title="Resurser"
                icon={<BookOpen className="h-5 w-5 text-primary" />}
                headerExtra={`Kapitel ${selectedChapter}`}
                alwaysOpen
                className={resourcesCol}
                contentClassName="-mx-1"
              >
                <SuspenseResourceAccordion grade={grade} chapter={selectedChapter} />
              </CollapsibleSection>

              {/* 3. Övningar, spel och verktyg */}
              <CollapsibleSection
                id="tools"
                title="Övningar och spel"
                icon={<Wrench className="h-5 w-5 text-primary" />}
                headerExtra={activeRadioChannel ? <Volume2 className="inline h-4 w-4 text-primary animate-pulse" /> : undefined}
                alwaysOpen
                keepMounted
                className={toolsCol}
                contentClassName="space-y-3"
              >
                <ToolsGrid onChannelChange={setActiveRadioChannel} />
              </CollapsibleSection>
            </div>
          </main>

          <MobileBottomNav grade={grade} />
          <AnnouncementFlash grade={grade} />
        </div>
      </PageTransition>
    </LoginGate>
  );
};

export default ApocalypticGradePage;
