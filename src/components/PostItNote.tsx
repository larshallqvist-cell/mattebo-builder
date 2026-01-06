import { useCalendarEvents } from "@/hooks/useCalendarEvents";

interface PostItNoteProps {
  grade: number;
}

const PostItNote = ({ grade }: PostItNoteProps) => {
  const { nextEvent, loading } = useCalendarEvents(grade);

  const parseContent = (text: string) => {
    const lines = text.split('\n');
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
      
      // Check for bullet list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
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
  
  const weekday = nextEvent ? getSwedishWeekday(nextEvent.date) : '';
  const title = nextEvent ? `Nästa lektion ${weekday}` : "Nästa lektion";
  
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
