import { useCalendarEvents } from "@/hooks/useCalendarEvents";

interface PostItNoteProps {
  grade: number;
}

const PostItNote = ({ grade }: PostItNoteProps) => {
  const { nextEvent, loading } = useCalendarEvents(grade);

  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 font-body font-normal">
            {listItems.map((item, i) => (
              <li key={i} className="text-[15px]">{parseInline(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };
    
    const parseInline = (text: string) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          return (
            <a 
              key={i} 
              href={linkMatch[2]} 
              className="text-primary-foreground/80 underline hover:text-primary-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      });
    };
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        listItems.push(trimmed.slice(2));
      } else {
        flushList();
        if (trimmed) {
          elements.push(
            <p key={`p-${i}`} className="text-[15px] my-1 font-body font-normal">
              {parseInline(trimmed)}
            </p>
          );
        }
      }
    });
    
    flushList();
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
