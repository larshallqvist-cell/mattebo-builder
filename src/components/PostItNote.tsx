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
  // Convert HTML to Markdown-like format for consistent parsing
  const htmlToMarkdown = (html: string): string => {
    let text = html;
    
    // Handle line breaks first
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // Handle links FIRST (before bold, since bold might wrap links)
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, content) => {
      // Clean any remaining tags from link content
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `[${cleanContent}](${href})`;
    });
    
    // Handle bold tags - use non-greedy match with [\s\S] to handle any content including newlines
    text = text.replace(/<b>([\s\S]*?)<\/b>/gi, (_, content) => {
      // Don't double-wrap if already has markdown bold
      const cleanContent = content.replace(/^\*\*|\*\*$/g, '').trim();
      return `**${cleanContent}**`;
    });
    text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, content) => {
      const cleanContent = content.replace(/^\*\*|\*\*$/g, '').trim();
      return `**${cleanContent}**`;
    });
    
    // Handle underline (convert to bold for simplicity)
    text = text.replace(/<u>([\s\S]*?)<\/u>/gi, (_, content) => {
      const cleanContent = content.replace(/^\*\*|\*\*$/g, '').trim();
      return `**${cleanContent}**`;
    });
    
    // Handle italic
    text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
    text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
    
    // Handle list items with any content
    text = text.replace(/<li>([\s\S]*?)<\/li>/gi, (_, content) => {
      return `- ${content.trim()}\n`;
    });
    
    // Remove remaining list tags
    text = text.replace(/<\/?ul>/gi, '\n');
    text = text.replace(/<\/?ol>/gi, '\n');
    
    // Remove other common tags
    text = text.replace(/<\/?p>/gi, '\n');
    text = text.replace(/<\/?div>/gi, '\n');
    text = text.replace(/<\/?span>/gi, '');
    
    // Clean up any remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Clean up multiple newlines and spaces
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.trim();
    
    return text;
  };

  const parseContent = (text: string) => {
    // Check if content contains HTML tags
    const hasHtml = /<[^>]+>/g.test(text);
    const processedText = hasHtml ? htmlToMarkdown(text) : text;
    
    const lines = processedText.split('\n');
    const elements: JSX.Element[] = [];
    let bulletItems: string[] = [];
    let numberedItems: string[] = [];
    
    const flushBulletList = () => {
      if (bulletItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1 font-body font-normal">
            {bulletItems.map((item, i) => (
              <li key={i} className="text-sm leading-tight">{parseInline(item)}</li>
            ))}
          </ul>
        );
        bulletItems = [];
      }
    };
    
    const flushNumberedList = () => {
      if (numberedItems.length > 0) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-0.5 my-1 font-body font-normal">
            {numberedItems.map((item, i) => (
              <li key={i} className="text-sm leading-tight">{parseInline(item)}</li>
            ))}
          </ol>
        );
        numberedItems = [];
      }
    };
    
    const parseInline = (text: string): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = [];
      // Pattern for: **bold**, __underline__, *italic*, and [links](url)
      // Order matters: ** and __ before single * to avoid conflicts
      const pattern = /(\*\*[\s\S]*?\*\*|__[\s\S]*?__|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
      let lastIndex = 0;
      let match;
      let keyIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          result.push(text.slice(lastIndex, match.index));
        }
        
        const token = match[0];
        
        if (token.startsWith('**') && token.endsWith('**')) {
          // Bold: **text**
          const boldContent = token.slice(2, -2);
          result.push(<strong key={`b-${keyIndex++}`}>{boldContent}</strong>);
        } else if (token.startsWith('__') && token.endsWith('__')) {
          // Underline: __text__
          const underlineContent = token.slice(2, -2);
          result.push(<span key={`u-${keyIndex++}`} className="underline">{underlineContent}</span>);
        } else if (token.startsWith('*') && token.endsWith('*') && !token.startsWith('**')) {
          // Italic: *text*
          const italicContent = token.slice(1, -1);
          result.push(<em key={`i-${keyIndex++}`}>{italicContent}</em>);
        } else if (token.startsWith('[')) {
          const linkMatch = token.match(/\[([^\]]+)\]\(([^)\s]+)\)/);
          if (linkMatch) {
            let href = linkMatch[2];
            if (href.startsWith('www.')) {
              href = 'https://' + href;
            }
            result.push(
              <a 
                key={`a-${keyIndex++}`}
                href={href} 
                className="text-primary underline hover:text-primary/80"
                target="_blank"
                rel="noopener noreferrer"
              >
                {linkMatch[1]}
              </a>
            );
          }
        }
        
        lastIndex = pattern.lastIndex;
      }
      
      if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
      }
      
      return result;
    };
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      
      // Check for headings (## or ###)
      if (trimmed.startsWith('### ')) {
        flushBulletList();
        flushNumberedList();
        elements.push(
          <h6 key={`h6-${i}`} className="text-sm font-semibold mt-3 mb-1 font-body">
            {parseInline(trimmed.slice(4))}
          </h6>
        );
      }
      else if (trimmed.startsWith('## ')) {
        flushBulletList();
        flushNumberedList();
        elements.push(
          <h5 key={`h5-${i}`} className="text-sm font-semibold mt-2 mb-0.5 font-body leading-tight">
            {parseInline(trimmed.slice(3))}
          </h5>
        );
      }
      // Check for bullet list items
      else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        flushNumberedList();
        bulletItems.push(trimmed.slice(2));
      } 
      // Check for numbered list items (1. 2. 3. etc)
      else if (/^\d+\.\s/.test(trimmed)) {
        flushBulletList();
        numberedItems.push(trimmed.replace(/^\d+\.\s/, ''));
      } 
      else {
        flushBulletList();
        flushNumberedList();
        if (trimmed) {
          elements.push(
            <p key={`p-${i}`} className="text-sm my-0.5 font-body font-normal leading-tight">
              {parseInline(trimmed)}
            </p>
          );
        }
      }
    });
    
    flushBulletList();
    flushNumberedList();
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
