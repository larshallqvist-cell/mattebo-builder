import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, BookOpen, Volume2, Wrench, Sun, Calculator, Dumbbell, Grid3x3, Droplets, PieChart, Timer, Sigma, Percent, Puzzle } from "lucide-react";
import LoginGate from "@/components/LoginGate";

import PageTransition from "@/components/PageTransition";
import ApocalypticNav from "@/components/ApocalypticNav";
import CalculatorModal from "@/components/DesmosCalculatorModal";
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
import ChapterSelector, { getChapterFromCookie, getChapterSubtitle } from "@/components/ChapterSelector";
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
  { label: "Tabelltestet", url: "/tabelltestet", icon: Timer, internal: true },
  { label: "Algebra", url: "/algebra", icon: Sigma, internal: true },
  { label: "Procent", url: "/procent", icon: Percent, internal: true },
  { label: "Ekvationer", url: "/ekvationer", icon: Puzzle, internal: true },
];

const toolBtn =
  "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-2 text-center text-base font-bold text-background shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg [font-family:'Short_Stack',cursive]";

const pastel = (i: number) => ({
  backgroundColor: `hsl(var(--pastel-${(i % 9) + 1}))`,
  borderColor: `hsl(var(--pastel-${(i % 9) + 1}) / 0.6)`,
});

const ToolsGrid = ({ onChannelChange }: { onChannelChange: (c: string | null) => void }) => {
  const [calcOpen, setCalcOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={() => setCalcOpen(true)} className={toolBtn} style={pastel(0)}>
          <Calculator className="h-6 w-6" />
          Kalkylator
        </button>
        {TOOL_LINKS.map(({ label, url, icon: Icon, internal }, i) =>
          internal ? (
            <Link key={url} to={url} className={toolBtn} style={pastel(i + 1)}>
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          ) : (
            <button key={url} type="button" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} className={toolBtn} style={pastel(i + 1)}>
              <Icon className="h-6 w-6" />
              {label}
            </button>
          ),
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 h-[64px] [&_span:first-child]:!text-2xl">
        <WebRadio fillSpace onChannelChange={onChannelChange} />
      </div>
      <CalculatorModal open={calcOpen} onOpenChange={setCalcOpen} />
    </div>
  );
};

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
  const main = wide ? "col-span-7 col-start-1" : "";

  return (
    <LoginGate>
      <PageTransition>
        <div
          className="h-screen flex flex-col relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)" }}
        >
          <ApocalypticNav
            grade={grade}
            tint={GRADE_TINT[grade] ?? "var(--accent)"}
            headerAction={
              <>
                <SurveyLamp grade={grade} compact />
                <ViewModeToggle compact />
                <LessonNotesButton grade={grade} />
              </>
            }
            centerContent={
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <LessonTimer grade={grade} size={56} hideClock />
              </div>
            }

          />

          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-28 sm:px-4 lg:pb-8 relative z-20" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className={`max-w-7xl mx-auto ${wide ? "grid grid-cols-10 gap-5 items-start" : "flex flex-col gap-4"}`}>
              {/* 1. Kapitlet – what we are working on now */}
              <div className={main}>
                <ChapterHeader grade={grade} chapter={selectedChapter} onChapterChange={setSelectedChapter} />
              </div>

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
                className={wide ? "col-span-3 col-start-8 row-start-1 row-span-3 sticky top-0 max-h-[calc(100vh-11rem)] overflow-y-auto industrial-scrollbar" : ""}
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
                <div className="border-t border-border/40 pt-3">
                  <LunchMenu compact />
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
                className={main}
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
                className={main}
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
