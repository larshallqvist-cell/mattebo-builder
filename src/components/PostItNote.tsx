import { useState } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useLessonPlans, getLessonPlan } from "@/hooks/useLessonPlans";
import { PostItSkeleton } from "@/components/skeletons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseLessonContent } from "@/lib/lessonContent";


interface PostItNoteProps {
  grade: number;
}

const PostItNote = ({ grade }: PostItNoteProps) => {
  const { upcomingEvents, loading } = useCalendarEvents(grade);
  const { plans } = useLessonPlans(grade);
  const [eventIndex, setEventIndex] = useState(0);
  const [navigationUnlocked, setNavigationUnlocked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  // Current event to display
  const currentEvent = upcomingEvents[eventIndex] || null;
  
  // Navigation handlers
  const goToPrevious = () => {
    if (eventIndex > 0) setEventIndex(eventIndex - 1);
  };
  
  const goToNext = () => {
    if (eventIndex < upcomingEvents.length - 1) setEventIndex(eventIndex + 1);
  };
  
  // Secret toggle
  const handleSecretToggle = () => {
    setNavigationUnlocked(!navigationUnlocked);
  };
  
  // Format date for display
  const formatEventDate = (date: Date) => {
    return date
      .toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" })
      .replace(/^./, (c) => c.toUpperCase());
  };
  
  // Format time
  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  };
  const planContent = currentEvent ? getLessonPlan(plans, currentEvent) : undefined;
  const content = (planContent && planContent.trim()) || currentEvent?.description || "";
  
  if (loading) {
    return <PostItSkeleton />;
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="flex flex-col gap-1 font-nunito bg-[hsl(var(--postit-light))] text-[hsl(var(--postit-text))] rounded-md p-4">
        <p className="text-sm font-semibold">Inga kommande lektioner</p>
        <p className="text-xs text-[hsl(var(--postit-text))/70]">
          Terminens schema verkar inte vara inlagt i kalendern än.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative font-nunito bg-[hsl(var(--postit-light))] text-[hsl(var(--postit-text))] rounded-md p-4 md:max-h-[50vh]">
      {/* Secret "screw" toggle - small circle at top-right corner */}
      <button
        onClick={handleSecretToggle}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full transition-all z-20 flex items-center justify-center"
        style={{
          background: navigationUnlocked 
            ? "radial-gradient(circle at 35% 35%, hsl(var(--primary)), hsl(var(--primary) / 0.6))"
            : "radial-gradient(circle at 35% 35%, hsl(var(--muted-foreground) / 0.5), hsl(var(--muted-foreground) / 0.2))",
          boxShadow: navigationUnlocked 
            ? "inset 1px 1px 2px rgba(255,255,255,0.3), 0 0 8px hsl(var(--primary) / 0.6)"
            : "inset 1px 1px 2px rgba(255,255,255,0.2), inset -1px -1px 2px rgba(0,0,0,0.3)",
          opacity: navigationUnlocked ? 1 : 0.6,
        }}
        title="Stega mellan lektioner"
        aria-label="Toggle navigation"
      />
      
      {/* Navigation bar - only visible when unlocked */}
      {navigationUnlocked && upcomingEvents.length > 0 && (
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[hsl(var(--postit-text))/30]">
          <button
            onClick={goToPrevious}
            disabled={eventIndex === 0}
            className="p-1 rounded hover:bg-[hsl(var(--postit-text))/10] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[hsl(var(--postit-text))]" />
          </button>
          
          <span className="text-xs text-slate-700 font-medium text-center">
            {currentEvent ? (
              <>
                {formatEventDate(currentEvent.date)} {formatEventTime(currentEvent.date)}
                <span className="block text-[hsl(var(--postit-text))/70] text-[10px]">
                  {eventIndex + 1} av {upcomingEvents.length}
                </span>
              </>
            ) : "Inga lektioner"}
          </span>
          
          <button
            onClick={goToNext}
            disabled={eventIndex === upcomingEvents.length - 1}
            className="p-1 rounded hover:bg-[hsl(var(--postit-text))/10] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[hsl(var(--postit-text))]" />
          </button>
        </div>
      )}
      
      {/* Lesson header */}
      {currentEvent && (
        <div className="mb-2">
          <div className="text-sm font-bold text-[hsl(var(--postit-text))]">
            {formatEventDate(currentEvent.date)} · {formatEventTime(currentEvent.date)}–{formatEventTime(currentEvent.endDate)}
            {currentEvent.location && ` · ${currentEvent.location}`}
          </div>
        </div>
      )}

      {/* Content - no scroll on mobile for natural expansion */}
      {isMobile ? (
        <div className="space-y-0.5 text-black">
          <ErrorBoundary fallback={<p className="text-sm italic text-[hsl(var(--postit-text))/70]">Kunde inte visa innehållet just nu.</p>}>
            {content ? (
              parseLessonContent(content)
            ) : (
              <p className="text-sm text-[hsl(var(--postit-text))/70] italic">Ingen beskrivning tillgänglig</p>
            )}
          </ErrorBoundary>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 text-black pr-3">
            <ErrorBoundary fallback={<p className="text-sm italic text-[hsl(var(--postit-text))/70]">Kunde inte visa innehållet just nu.</p>}>
              {content ? (
                parseLessonContent(content)
              ) : (
                <p className="text-sm text-[hsl(var(--postit-text))/70] italic">Ingen beskrivning tillgänglig</p>
              )}
            </ErrorBoundary>
          </div>
        </ScrollArea>
      )}


      {/* Expand agenda for projector */}
      {content && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 inline-flex items-center justify-center gap-1.5 self-start rounded-md border border-[hsl(var(--postit-text))/30] bg-[hsl(var(--postit-text))/5] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--postit-text))] transition-colors hover:bg-[hsl(var(--postit-text))/12]"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Förstora dagens agenda
        </button>
      )}

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-5xl bg-[hsl(var(--postit-light))] text-[hsl(var(--postit-text))] font-nunito">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold underline underline-offset-4 decoration-[hsl(var(--postit-text))/60] text-left">
              {currentEvent
                ? `${formatEventDate(currentEvent.date)} · ${formatEventTime(currentEvent.date)}–${formatEventTime(currentEvent.endDate)}${currentEvent.location ? ` · ${currentEvent.location}` : ""}`
                : "Dagens agenda"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="pr-4 text-black [&_p]:text-xl [&_p]:leading-relaxed [&_li]:text-xl [&_li]:leading-relaxed [&_span.font-orbitron]:text-base [&_a]:text-lg">
              {content ? parseLessonContent(content) : null}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default PostItNote;
