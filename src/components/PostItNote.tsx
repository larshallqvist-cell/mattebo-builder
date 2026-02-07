import { useState } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { PostItSkeleton } from "@/components/skeletons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PostItNoteProps {
  grade: number;
}

const PostItNote = ({ grade }: PostItNoteProps) => {
  const { upcomingEvents, loading } = useCalendarEvents(grade);
  const [eventIndex, setEventIndex] = useState(0);
  const [navigationUnlocked, setNavigationUnlocked] = useState(false);
  
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
    return date.toLocaleDateString("sv-SE", { 
      weekday: "short", 
      day: "numeric", 
      month: "short" 
    });
  };
  
  // Format time
  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  };
  // Render rich text content directly from HTML
  const renderRichContent = (html: string): JSX.Element[] => {
    console.log('[PostIt] Raw HTML:', JSON.stringify(html));
    const elements: JSX.Element[] = [];
    
    // First, normalize the HTML
    let text = html;
    
    // Convert line breaks to markers
    text = text.replace(/<br\s*\/?>/gi, '{{BR}}');
    
    // IMPORTANT: Handle consecutive </ul><ul> BEFORE extracting list items
    // This is how Google Calendar represents "Enter" between bullet points
    text = text.replace(/<\/ul>\s*<ul>/gi, '</ul>{{SPACING}}<ul>');
    
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
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-0.5 my-1 font-body font-normal">
            {bulletItems.map((item, i) => (
              <li key={i} className="text-sm leading-tight">{renderInlineHtml(item)}</li>
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
        elements.push(
          <p key={`p-${i}`} className="text-sm my-0.5 font-body font-normal leading-tight">
            {renderInlineHtml(trimmed)}
          </p>
        );
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
        
        result.push(
          <a
            key={`a-${keyIndex++}`}
            href={finalHref}
            className="text-primary underline hover:text-primary/80"
            target="_blank"
            rel="noopener noreferrer"
          >
            {cleanContent}
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
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let bulletItems: string[] = [];
    
    const flushBulletList = () => {
      if (bulletItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-0.5 my-1 font-body font-normal">
            {bulletItems.map((item, i) => (
              <li key={i} className="text-sm leading-tight">{item}</li>
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
          elements.push(
            <p key={`p-${i}`} className="text-sm my-0.5 font-body font-normal leading-tight">
              {trimmed}
            </p>
          );
        }
      }
    });
    
    flushBulletList();
    return elements;
  };

  const content = currentEvent?.description || "";
  
  if (loading) {
    return <PostItSkeleton />;
  }

  return (
    <div className="h-full flex flex-col relative font-nunito text-foreground">
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
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-primary/30">
          <button
            onClick={goToPrevious}
            disabled={eventIndex === 0}
            className="p-1 rounded hover:bg-primary/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          
          <span className="text-xs text-foreground/70 font-medium text-center">
            {currentEvent ? (
              <>
                {formatEventDate(currentEvent.date)} {formatEventTime(currentEvent.date)}
                <span className="block text-muted-foreground text-[10px]">
                  {eventIndex + 1} av {upcomingEvents.length}
                </span>
              </>
            ) : "Inga lektioner"}
          </span>
          
          <button
            onClick={goToNext}
            disabled={eventIndex === upcomingEvents.length - 1}
            className="p-1 rounded hover:bg-primary/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-primary" />
          </button>
        </div>
      )}
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 text-foreground/90 pr-3">
          {content ? (
            parseContent(content)
          ) : (
            <p className="text-sm text-muted-foreground italic">Ingen beskrivning tillgänglig</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PostItNote;
