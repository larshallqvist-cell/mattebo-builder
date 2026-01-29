import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { PostItSkeleton } from "@/components/skeletons";

interface PostItNoteProps {
  grade: number;
}

const PostItNote = ({ grade }: PostItNoteProps) => {
  const { nextEvent, loading } = useCalendarEvents(grade);

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
  
  if (loading) {
    return <PostItSkeleton />;
  }

  return (
    <div className="font-nunito text-foreground">
      {/* Content */}
      <div className="space-y-1 text-foreground/90">
        {content ? (
          parseContent(content)
        ) : (
          <p className="text-sm text-muted-foreground italic">Ingen beskrivning tillgänglig</p>
        )}
      </div>
    </div>
  );
};

export default PostItNote;
