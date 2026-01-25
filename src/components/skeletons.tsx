import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for PostItNote / Next Lesson panel
 */
export const PostItSkeleton = () => (
  <div className="font-nunito">
    {/* Title skeleton */}
    <div className="mb-3 pb-2 border-b border-primary/30">
      <Skeleton className="h-5 w-32 bg-primary/20" />
    </div>
    
    {/* Content skeletons */}
    <div className="space-y-3">
      <Skeleton className="h-4 w-full bg-muted/50" />
      <Skeleton className="h-4 w-4/5 bg-muted/50" />
      <Skeleton className="h-4 w-3/4 bg-muted/50" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-4 w-2/3 bg-muted/50" />
        <Skeleton className="h-4 w-1/2 bg-muted/50" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton loader for LessonCalendar
 */
export const CalendarSkeleton = () => (
  <div className="space-y-2 p-2">
    {/* Week header skeleton */}
    <div 
      className="px-4 py-2.5 rounded-md"
      style={{
        background: "linear-gradient(90deg, rgba(64, 224, 208, 0.1) 0%, rgba(64, 224, 208, 0.03) 100%)",
      }}
    >
      <Skeleton className="h-5 w-28 bg-[hsl(var(--neon-turquoise)/0.2)]" />
    </div>
    
    {/* Event skeletons */}
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="px-3 py-2.5 flex gap-3 items-center">
        {/* Date column */}
        <div className="flex-shrink-0 w-14 flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-8 bg-muted/40" />
          <Skeleton className="h-7 w-10 bg-primary/20" />
        </div>
        
        {/* Content column */}
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24 bg-muted/40" />
          <Skeleton className="h-4 w-full bg-muted/50" />
        </div>
      </div>
    ))}
    
    {/* Additional collapsed weeks */}
    {[1, 2].map((i) => (
      <div 
        key={`week-${i}`}
        className="px-4 py-2.5 rounded-md"
        style={{
          background: "linear-gradient(90deg, rgba(64, 224, 208, 0.05) 0%, transparent 100%)",
        }}
      >
        <Skeleton className="h-5 w-24 bg-[hsl(var(--neon-turquoise)/0.15)]" />
      </div>
    ))}
  </div>
);

/**
 * Skeleton loader for ResourceAccordion
 */
export const ResourceSkeleton = () => (
  <div className="space-y-1 p-4">
    {/* Category skeletons */}
    {[1, 2, 3].map((i) => (
      <div 
        key={i} 
        className="px-4 py-3 border-b border-white/10"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded bg-primary/20" />
          <Skeleton className="h-5 w-32 bg-muted/50" />
        </div>
      </div>
    ))}
    
    {/* Expanded category with links */}
    <div className="px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-5 w-5 rounded bg-primary/30" />
        <Skeleton className="h-5 w-28 bg-muted/60" />
      </div>
      <div className="bg-black/20 px-3 py-2 space-y-2 rounded">
        {[1, 2, 3, 4].map((j) => (
          <div key={j} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded bg-muted/30" />
            <Skeleton className="h-4 bg-muted/40" style={{ width: `${60 + j * 8}%` }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Generic skeleton for cards
 */
export const CardSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className="h-4 bg-muted/50" 
        style={{ width: `${100 - i * 15}%` }} 
      />
    ))}
  </div>
);
