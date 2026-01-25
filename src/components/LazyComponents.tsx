import { lazy, Suspense, ComponentType } from "react";
import { ResourceSkeleton, CalendarSkeleton } from "@/components/skeletons";

// Lazy load heavy components for better initial load performance
export const LazyResourceAccordion = lazy(() => import("@/components/ResourceAccordion"));
export const LazyLessonCalendar = lazy(() => import("@/components/LessonCalendar"));
export const LazyMascotPanel = lazy(() => import("@/components/MascotPanel"));

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

export const SuspenseMascotPanel = ({ className }: { className?: string }) => (
  <Suspense fallback={<div className={className} />}>
    <LazyMascotPanel className={className} />
  </Suspense>
);
