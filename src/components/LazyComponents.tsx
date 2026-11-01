import { lazy, Suspense, ComponentType } from "react";
import { ResourceSkeleton, CalendarSkeleton } from "@/components/skeletons";
import { isChunkLoadError, reloadOnceForStaleChunks } from "@/pwa";

/**
 * React.lazy swallows a failed chunk import into a render error, which blanks the page.
 * Retry once (a dev-server restart or new deploy can briefly 404 old chunks), then
 * reload once for fresh code; other errors still surface normally.
 */
const lazyWithReload = <T extends ComponentType<any>>(load: () => Promise<{ default: T }>) =>
  lazy(async () => {
    try {
      return await load();
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;
      await new Promise((r) => setTimeout(r, 800));
      try {
        return await load();
      } catch (retryErr) {
        if (!isChunkLoadError(retryErr)) throw retryErr;
        reloadOnceForStaleChunks();
        throw retryErr;
      }
    }
  });

// Lazy load heavy components for better initial load performance
export const LazyResourceAccordion = lazyWithReload(() => import("@/components/ResourceAccordion"));
export const LazyLessonCalendar = lazyWithReload(() => import("@/components/LessonCalendar"));
export const LazyMascotPanel = lazyWithReload(() => import("@/components/MascotPanel"));

// Wrapper components with suspense boundaries
interface ResourceAccordionProps {
  grade: number;
  chapter: number;
}

export const SuspenseResourceAccordion = ({ grade, chapter }: ResourceAccordionProps) => (
  <Suspense fallback={<ResourceSkeleton />}>
    <LazyResourceAccordion grade={grade} chapter={chapter} />
  </Suspense>
);

interface LessonCalendarProps {
  grade: number;
}

export const SuspenseLessonCalendar = ({ grade }: LessonCalendarProps) => (
  <Suspense fallback={<CalendarSkeleton />}>
    <LazyLessonCalendar grade={grade} />
  </Suspense>
);

export const SuspenseMascotPanel = ({ className, compact }: { className?: string; compact?: boolean }) => (
  <Suspense fallback={<div className={className} />}>
    <LazyMascotPanel className={className} compact={compact} />
  </Suspense>
);
