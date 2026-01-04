import { useCalendarEvents } from "@/hooks/useCalendarEvents";

interface PostItNoteProps {
  grade: number;
  rotation?: number;
}

const PostItNote = ({ grade, rotation = -1 }: PostItNoteProps) => {
  const { nextEvent, loading } = useCalendarEvents(grade);

  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">{parseInline(item)}</li>
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
            <p key={`p-${i}`} className="text-sm my-1">
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
  const title = nextEvent?.title || "Nästa lektion";
  
  return (
    <div 
      className="post-it max-w-full"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Tape effect */}
      <div 
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-yellow-200/60 rounded-sm"
        style={{ transform: 'rotate(2deg)' }}
      />
      
      {/* Title */}
      <h4 className="font-bold text-base mb-2 border-b border-yellow-600/30 pb-2">
        {title}
      </h4>
      
      {/* Content */}
      <div className="space-y-1">
        {loading ? (
          <p className="text-sm text-muted-foreground">Laddar...</p>
        ) : content ? (
          parseContent(content)
        ) : (
          <p className="text-sm text-muted-foreground">Ingen beskrivning tillgänglig</p>
        )}
      </div>
    </div>
  );
};

export default PostItNote;
