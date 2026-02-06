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
  const [dayOffset, setDayOffset] = useState(0);
  const [navigationUnlocked, setNavigationUnlocked] = useState(false);
  
  // Group events by date (YYYY-MM-DD)
  const eventsByDate = upcomingEvents.reduce((acc, event) => {
    const dateKey = event.date.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof upcomingEvents>);
  
  // Get sorted unique dates
  const sortedDates = Object.keys(eventsByDate).sort();
  
  // Current date to display
  const currentDateKey = sortedDates[dayOffset] || null;
  const eventsForCurrentDay = currentDateKey ? eventsByDate[currentDateKey] : [];
  
  // Navigation handlers
  const goToPreviousDay = () => {
    if (dayOffset > 0) setDayOffset(dayOffset - 1);
  };
  
  const goToNextDay = () => {
    if (dayOffset < sortedDates.length - 1) setDayOffset(dayOffset + 1);
  };
  
  // Secret toggle
  const handleSecretToggle = () => {
    setNavigationUnlocked(!navigationUnlocked);
  };
  
  // Format date for display
  const formatDayHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString("sv-SE", { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    });
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
      // More robust pattern: allow any content inside ** and links
      const pattern = /(\*\*[\s\S]*?\*\*|\[[^\]]+\]\([^)\s]+\))/g;
      let lastIndex = 0;
      let match;
      let keyIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          result.push(text.slice(lastIndex, match.index));
        }
        
        const token = match[0];
        
        if (token.startsWith('**') && token.endsWith('**')) {
          const boldContent = token.slice(2, -2);
          result.push(<strong key={`b-${keyIndex++}`}>{boldContent}</strong>);
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
                className="text-yellow-400 underline hover:text-yellow-300"
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

  // Combine all events for current day into content
  const buildDayContent = () => {
    if (eventsForCurrentDay.length === 0) {
      return null;
    }
    
    // If just one event, show its description
    if (eventsForCurrentDay.length === 1) {
      return eventsForCurrentDay[0].description || "";
    }
    
    // Multiple events: show each with time header
    return eventsForCurrentDay.map(event => {
      const time = event.date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
      const title = event.title || "Lektion";
      const desc = event.description || "";
      return `## ${time} — ${title}\n${desc}`;
    }).join("\n\n");
  };
  
  const content = buildDayContent();
  
  if (loading) {
    return <PostItSkeleton />;
  }

  return (
    <div className="h-full flex flex-col relative font-nunito text-foreground">
      {/* Secret "screw" toggle - tiny, positioned at top-right corner like a panel rivet */}
      <button
        onClick={handleSecretToggle}
        className="absolute -top-2 -right-2 w-2.5 h-2.5 rounded-full transition-all z-20"
        style={{
          background: navigationUnlocked 
            ? "radial-gradient(circle at 35% 35%, hsl(var(--primary)), hsl(var(--primary) / 0.4))"
            : "radial-gradient(circle at 35% 35%, hsl(var(--muted-foreground) / 0.3), hsl(var(--muted-foreground) / 0.1))",
          boxShadow: navigationUnlocked 
            ? "inset 0.5px 0.5px 1px rgba(255,255,255,0.3), 0 0 6px hsl(var(--primary) / 0.6)"
            : "inset 0.5px 0.5px 1px rgba(255,255,255,0.15), inset -0.5px -0.5px 1px rgba(0,0,0,0.2)",
          opacity: navigationUnlocked ? 1 : 0.4,
        }}
        title=""
        aria-label="Toggle navigation"
      />
      
      {/* Navigation bar - only visible when unlocked */}
      {navigationUnlocked && sortedDates.length > 0 && (
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-primary/30">
          <button
            onClick={goToPreviousDay}
            disabled={dayOffset === 0}
            className="p-1 rounded hover:bg-primary/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          
          <span className="text-xs text-foreground/70 font-medium text-center">
            {currentDateKey ? formatDayHeader(currentDateKey) : "Inga dagar"}
            <span className="block text-muted-foreground text-[10px]">
              Dag {dayOffset + 1} av {sortedDates.length}
            </span>
          </span>
          
          <button
            onClick={goToNextDay}
            disabled={dayOffset === sortedDates.length - 1}
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
