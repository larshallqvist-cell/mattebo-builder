import { useCalendarEvents } from "@/hooks/useCalendarEvents";

interface PostItNoteProps {
  grade: number;
}

const PostItNote = ({ grade }: PostItNoteProps) => {
  const { nextEvent, loading } = useCalendarEvents(grade);

  // Convert HTML to Markdown-like format for consistent parsing
  const htmlToMarkdown = (html: string): string => {
    let text = html;
    
    // Handle line breaks
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // Handle bold tags
    text = text.replace(/<b>([^<]*)<\/b>/gi, '**$1**');
    text = text.replace(/<strong>([^<]*)<\/strong>/gi, '**$1**');
    
    // Handle underline (convert to bold for simplicity)
    text = text.replace(/<u>([^<]*)<\/u>/gi, '**$1**');
    
    // Handle links
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)');
    
    // Handle list items - extract content
    text = text.replace(/<li>([^<]*)<\/li>/gi, '- $1\n');
    // Handle list items with nested content (like links)
    text = text.replace(/<li>(.*?)<\/li>/gi, (match, content) => {
      // If content already processed (has markdown link), just add bullet
      if (content.includes('[') && content.includes('](')) {
        return `- ${content}\n`;
      }
      return `- ${content}\n`;
    });
    
    // Remove remaining list tags
    text = text.replace(/<\/?ul>/gi, '\n');
    text = text.replace(/<\/?ol>/gi, '\n');
    
    // Remove other common tags
    text = text.replace(/<\/?p>/gi, '\n');
    text = text.replace(/<\/?div>/gi, '\n');
    text = text.replace(/<\/?span>/gi, '');
    
    // Clean up multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');
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
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 font-body font-normal">
            {bulletItems.map((item, i) => (
              <li key={i} className="text-[15px]">{parseInline(item)}</li>
            ))}
          </ul>
        );
        bulletItems = [];
      }
    };
    
    const flushNumberedList = () => {
      if (numberedItems.length > 0) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 font-body font-normal">
            {numberedItems.map((item, i) => (
              <li key={i} className="text-[15px]">{parseInline(item)}</li>
            ))}
          </ol>
        );
        numberedItems = [];
      }
    };
    
    const parseInline = (text: string): (string | JSX.Element)[] => {
      const result: (string | JSX.Element)[] = [];
      const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
      let lastIndex = 0;
      let match;
      let keyIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          result.push(text.slice(lastIndex, match.index));
        }
        
        const token = match[0];
        
        if (token.startsWith('**') && token.endsWith('**')) {
          result.push(<strong key={`b-${keyIndex++}`}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('[')) {
          const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            let href = linkMatch[2];
            if (href.startsWith('www.')) {
              href = 'https://' + href;
            }
            
            result.push(
              <a 
                key={`a-${keyIndex++}`}
                href={href} 
                className="text-primary-foreground/80 underline hover:text-primary-foreground"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => console.log("Öppnar länk:", href)}
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
          <h6 key={`h6-${i}`} className="text-[14px] font-semibold mt-3 mb-1 font-body">
            {parseInline(trimmed.slice(4))}
          </h6>
        );
      }
      else if (trimmed.startsWith('## ')) {
        flushBulletList();
        flushNumberedList();
        elements.push(
          <h5 key={`h5-${i}`} className="text-[15px] font-semibold mt-3 mb-1 font-body">
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
            <p key={`p-${i}`} className="text-[15px] my-1 font-body font-normal">
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

  const content = nextEvent?.description || "";
  
  // Format weekday in Swedish
  const getSwedishWeekday = (date: Date) => {
    const days = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
    return days[date.getDay()];
  };
  
  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };
  
  const weekday = nextEvent ? getSwedishWeekday(nextEvent.date) : '';
  const time = nextEvent ? formatTime(nextEvent.date) : '';
  const title = nextEvent ? `Nästa lektion ${weekday} ${time}` : "Nästa lektion";
  
  return (
    <div className="post-it-straight max-w-full">
      {/* Title */}
      <h4 className="font-bold text-lg mb-2 border-b border-yellow-600/30 pb-2">
        {title}
      </h4>
      
      {/* Content */}
      <div className="space-y-1">
        {loading ? (
          <p className="text-base text-muted-foreground">Laddar...</p>
        ) : content ? (
          parseContent(content)
        ) : (
          <p className="text-base text-muted-foreground">Ingen beskrivning tillgänglig</p>
        )}
      </div>
    </div>
  );
};

export default PostItNote;
