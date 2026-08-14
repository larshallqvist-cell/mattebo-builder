import { useState } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useLessonPlans, getLessonPlan } from "@/hooks/useLessonPlans";
import { PostItSkeleton } from "@/components/skeletons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";


interface PostItNoteProps {
  grade: number;
}

const PostItNote = ({ grade }: PostItNoteProps) => {
  const { upcomingEvents, loading } = useCalendarEvents(grade);
  const { plans } = useLessonPlans(grade);
  const [eventIndex, setEventIndex] = useState(0);
  const [navigationUnlocked, setNavigationUnlocked] = useState(false);
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
  // Render rich text content directly from HTML
  const renderRichContent = (html: string): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    
    // First, normalize the HTML
    let text = html;
    
    // Convert double line breaks to spacing markers (this is Enter after non-list content)
    text = text.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '{{SPACING}}');
    
    // Convert remaining single line breaks to markers
    text = text.replace(/<br\s*\/?>/gi, '{{BR}}');
    
    // IMPORTANT: Handle consecutive </ul><ul> BEFORE extracting list items
    // This is how Google Calendar represents "Enter" between bullet points
    // Note: No whitespace between </ul> and <ul> in Google Calendar HTML
    text = text.replace(/<\/ul><ul>/gi, '{{SPACING}}');
    
    // Extract and process list items
    const listItems: string[] = [];
    text = text.replace(/<li>([\s\S]*?)<\/li>/gi, (_, content) => {
      const trimmed = content.trim();
      if (!trimmed || trimmed === '{{BR}}') {
        listItems.push('{{EMPTY}}');
      } else {
        listItems.push(trimmed);
      }
      return '{{LI}}';
    });
    
    // Remove list container tags
    text = text.replace(/<\/?ul>/gi, '');
    text = text.replace(/<\/?ol>/gi, '');
    
    // Remove list container tags
    text = text.replace(/<\/?ul>/gi, '');
    text = text.replace(/<\/?ol>/gi, '');
    text = text.replace(/<\/?p>/gi, '{{BR}}');
    text = text.replace(/<\/?div>/gi, '{{BR}}');
    text = text.replace(/<\/?span[^>]*>/gi, '');
    
    // Split by markers and list items
    const parts = text.split(/(\{\{BR\}\}|\{\{LI\}\}|\{\{SPACING\}\})/);
    let listIndex = 0;
    let bulletItems: string[] = [];
    
    const flushBulletList = () => {
      if (bulletItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-1.5 space-y-1 font-body font-normal">
            {bulletItems.map((item, i) => (
              <li key={i} className="relative pl-4 text-sm leading-snug">
                <span className="absolute left-0 top-[0.45em] h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)]" />
                {renderInlineHtml(item)}
              </li>
            ))}
          </ul>
        );
        bulletItems = [];
      }
    };
    
    parts.forEach((part, i) => {
      if (part === '{{BR}}') {
        flushBulletList();
        return;
      }
      if (part === '{{SPACING}}') {
        flushBulletList();
        elements.push(<div key={`space-${i}`} className="h-3" />);
        return;
      }
      if (part === '{{LI}}') {
        const item = listItems[listIndex++];
        if (item === '{{EMPTY}}') {
          flushBulletList();
          elements.push(<div key={`space-${i}`} className="h-4" />);
        } else {
          bulletItems.push(item);
        }
        return;
      }
      
      const trimmed = part.trim();
      if (trimmed) {
        flushBulletList();
        const isHeading = /^<(b|strong)(\s[^>]*)?>[\s\S]*<\/\1>$/i.test(trimmed);
        if (isHeading) {
          elements.push(
            <h4
              key={`h-${i}`}
              className="mt-2.5 mb-1 text-[0.7rem] uppercase tracking-[0.14em] font-orbitron text-primary border-b border-primary/25 pb-0.5"
            >
              {renderInlineHtml(trimmed.replace(/<\/?(?:b|strong)[^>]*>/gi, ""))}
            </h4>
          );
        } else {
          elements.push(
            <p key={`p-${i}`} className="text-sm my-1 font-body font-normal leading-snug">
              {renderInlineHtml(trimmed)}
            </p>
          );
        }
      }
    });
    
    flushBulletList();
    return elements;
  };
  
  // Render inline HTML with bold, underline, italic, links
  const renderInlineHtml = (html: string): (string | JSX.Element)[] => {
    const result: (string | JSX.Element)[] = [];
    let keyIndex = 0;
    
    // Process HTML tags directly
    // Pattern matches: <b>...</b>, <strong>...</strong>, <u>...</u>, <i>...</i>, <em>...</em>, <a>...</a>
    const tagPattern = /<(b|strong|u|i|em|a)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
    
    let lastIndex = 0;
    let match;
    const htmlCopy = html;
    
    // Reset regex
    const regex = /<(b|strong|u|i|em|a)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
    
    while ((match = regex.exec(htmlCopy)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        const textBefore = htmlCopy.slice(lastIndex, match.index);
        const decoded = decodeHtmlEntities(textBefore);
        if (decoded) result.push(decoded);
      }
      
      const fullMatch = match[0];
      const tagName = match[1].toLowerCase();
      
      if (tagName === 'b' || tagName === 'strong') {
        const content = fullMatch.replace(/<\/?(?:b|strong)[^>]*>/gi, '');
        result.push(
          <strong key={`b-${keyIndex++}`}>{renderInlineHtml(content)}</strong>
        );
      } else if (tagName === 'u') {
        const content = fullMatch.replace(/<\/?u[^>]*>/gi, '');
        result.push(
          <span key={`u-${keyIndex++}`} className="underline">{renderInlineHtml(content)}</span>
        );
      } else if (tagName === 'i' || tagName === 'em') {
        const content = fullMatch.replace(/<\/?(?:i|em)[^>]*>/gi, '');
        result.push(
          <em key={`i-${keyIndex++}`}>{renderInlineHtml(content)}</em>
        );
      } else if (tagName === 'a') {
        const hrefMatch = fullMatch.match(/href="([^"]*)"/i);
        const href = hrefMatch ? hrefMatch[1] : '#';
        const content = fullMatch.replace(/<\/?a[^>]*>/gi, '');
        const cleanContent = content.replace(/<[^>]+>/g, '').trim();
        
        let finalHref = href;
        if (finalHref.startsWith('www.')) {
          finalHref = 'https://' + finalHref;
        }
        // Only allow safe URL schemes (blocks javascript:, data:, vbscript:, ...)
        const isSafeHref =
          /^(https?:|mailto:)/i.test(finalHref) ||
          finalHref.startsWith('/') ||
          finalHref.startsWith('#');
        if (!isSafeHref) {
          result.push(<span key={`a-${keyIndex++}`}>{cleanContent}</span>);
          lastIndex = regex.lastIndex;
          continue;
        }
        
        result.push(
          <a
            key={`a-${keyIndex++}`}
            href={finalHref}
            onClick={(e) => {
              e.preventDefault();
              window.open(finalHref, "_blank", "noopener,noreferrer");
            }}
            className="inline-flex items-center gap-1 align-baseline rounded-md border border-primary/40 bg-primary/10 px-1.5 py-[1px] text-[0.8rem] font-medium text-primary transition-colors hover:bg-primary/20 hover:border-primary/70"
            target="_blank"
            rel="noopener noreferrer"
          >
            {cleanContent}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
          </a>
        );
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < htmlCopy.length) {
      const remaining = htmlCopy.slice(lastIndex);
      // Clean any remaining tags
      const cleaned = remaining.replace(/<[^>]+>/g, '');
      const decoded = decodeHtmlEntities(cleaned);
      if (decoded) result.push(decoded);
    }
    
    return result.length > 0 ? result : [decodeHtmlEntities(html.replace(/<[^>]+>/g, ''))];
  };
  
  // Decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    return text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  };

  const parseContent = (text: string) => {
    // Check if content contains HTML tags
    const hasHtml = /<[^>]+>/g.test(text);
    
    if (hasHtml) {
      // Use the new HTML renderer for HTML content
      return renderRichContent(text);
    }
    
    // Fallback for plain text/markdown content
    const renderPlainInline = (line: string): (string | JSX.Element)[] => {
      // **bold**, [text](url) and bare URLs
      const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/|www\.|mailto:)[^)\s]+\)|https?:\/\/\S+|www\.\S+)/g);
      return parts.filter(Boolean).map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (linkMatch) {
          const label = linkMatch[1];
          const raw = linkMatch[2];
          const href = raw.startsWith("www.") ? `https://${raw}` : raw;
          if (!/^(https?:|mailto:)/i.test(href)) return label;
          return (
            <a
              key={i}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                window.open(href, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1 align-baseline rounded-md border border-primary/40 bg-primary/10 px-1.5 py-[1px] text-[0.8rem] font-medium text-primary transition-colors hover:bg-primary/20 hover:border-primary/70"
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
            </a>
          );
        }
        if (/^(https?:\/\/|www\.)/i.test(part)) {
          const href = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a
              key={i}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                window.open(href, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex items-center gap-1 align-baseline rounded-md border border-primary/40 bg-primary/10 px-1.5 py-[1px] text-[0.8rem] font-medium text-primary transition-colors hover:bg-primary/20 hover:border-primary/70"
              target="_blank"
              rel="noopener noreferrer"
            >
              {part.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
            </a>
          );
        }
        return part;
      });
    };

    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let bulletItems: string[] = [];
    
    const flushBulletList = () => {
      if (bulletItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-1.5 space-y-1 font-body font-normal">
            {bulletItems.map((item, i) => (
              <li key={i} className="relative pl-4 text-sm leading-snug">
                <span className="absolute left-0 top-[0.45em] h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)]" />
                {renderPlainInline(item)}
              </li>
            ))}
          </ul>
        );
        bulletItems = [];
      }
    };
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        bulletItems.push(trimmed.slice(2));
      } else {
        flushBulletList();
        if (trimmed) {
          const isHeading =
            /^\*\*[^*]+\*\*$/.test(trimmed) ||
            (trimmed.endsWith(":") && trimmed.length < 40);
          if (isHeading) {
            elements.push(
              <h4
                key={`h-${i}`}
                className="mt-2.5 mb-1 text-[0.7rem] uppercase tracking-[0.14em] font-orbitron text-primary border-b border-primary/25 pb-0.5"
              >
                {trimmed.replace(/\*\*/g, "").replace(/:$/, "")}
              </h4>
            );
          } else {
            elements.push(
              <p key={`p-${i}`} className="text-sm my-1 font-body font-normal leading-snug">
                {renderPlainInline(trimmed)}
              </p>
            );
          }
        }
      }
    });
    
    flushBulletList();
    return elements;
  };

  const planContent = currentEvent ? getLessonPlan(plans, currentEvent) : undefined;
  const content = (planContent && planContent.trim()) || currentEvent?.description || "";
  
  if (loading) {
    return <PostItSkeleton />;
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="flex flex-col gap-1 font-nunito text-slate-800">
        <p className="text-sm font-semibold">Inga kommande lektioner</p>
        <p className="text-xs text-slate-500">
          Terminens schema verkar inte vara inlagt i kalendern än.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative font-nunito bg-gray-100 text-black rounded-md p-4 md:max-h-[50vh]">
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
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-blue-900/30">
          <button
            onClick={goToPrevious}
            disabled={eventIndex === 0}
            className="p-1 rounded hover:bg-blue-900/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-blue-900" />
          </button>
          
          <span className="text-xs text-slate-700 font-medium text-center">
            {currentEvent ? (
              <>
                {formatEventDate(currentEvent.date)} {formatEventTime(currentEvent.date)}
                <span className="block text-slate-500 text-[10px]">
                  {eventIndex + 1} av {upcomingEvents.length}
                </span>
              </>
            ) : "Inga lektioner"}
          </span>
          
          <button
            onClick={goToNext}
            disabled={eventIndex === upcomingEvents.length - 1}
            className="p-1 rounded hover:bg-blue-900/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-blue-900" />
          </button>
        </div>
      )}
      
      {/* Lesson header */}
      {currentEvent && (
        <div className="mb-2 pb-2 border-b border-blue-900/25">
          <div className="text-sm font-semibold text-blue-900 underline underline-offset-4 decoration-blue-900/60">
            {formatEventDate(currentEvent.date)} · {formatEventTime(currentEvent.date)}–{formatEventTime(currentEvent.endDate)}
            {currentEvent.location && ` · ${currentEvent.location}`}
          </div>
        </div>
      )}

      {/* Content - no scroll on mobile for natural expansion */}
      {isMobile ? (
        <div className="space-y-0.5 text-black">
          {content ? (
            parseContent(content)
          ) : (
            <p className="text-sm text-slate-500 italic">Ingen beskrivning tillgänglig</p>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 text-black pr-3">
            {content ? (
              parseContent(content)
            ) : (
              <p className="text-sm text-slate-500 italic">Ingen beskrivning tillgänglig</p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default PostItNote;
