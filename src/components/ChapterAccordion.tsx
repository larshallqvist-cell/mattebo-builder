import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink } from "lucide-react";

interface ChapterLink {
  title: string;
  url: string;
}

interface Chapter {
  id: string;
  title: string;
  links: ChapterLink[];
}

// Mock chapter data - would come from API/CMS in production
const generateChapterData = (grade: number): Chapter[] => {
  const baseChapters = [
    {
      id: "talforstaelse",
      title: "1. Talförståelse och aritmetik",
      topics: ["Naturliga tal", "Negativa tal", "Decimaler", "Bråk", "Procent", "Prioriteringsregler"]
    },
    {
      id: "algebra",
      title: "2. Algebra",
      topics: ["Uttryck", "Ekvationer", "Olikheter", "Formler", "Mönster", "Funktioner"]
    },
    {
      id: "geometri", 
      title: "3. Geometri",
      topics: ["Area", "Omkrets", "Volym", "Vinklar", "Likformighet", "Pythagoras sats"]
    },
    {
      id: "statistik",
      title: "4. Statistik och sannolikhet",
      topics: ["Medelvärde", "Median", "Typvärde", "Diagram", "Sannolikhet", "Kombinatorik"]
    },
    {
      id: "samband",
      title: "5. Samband och förändring",
      topics: ["Proportionalitet", "Grafer", "Tabeller", "Koordinatsystem", "Linjära funktioner"]
    },
    {
      id: "problemlosning",
      title: "6. Problemlösning",
      topics: ["Strategier", "Modellering", "Resonemang", "Kommunikation"]
    }
  ];
  
  return baseChapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    links: chapter.topics.flatMap((topic, i) => [
      { 
        title: `${topic} - Teori`, 
        url: `#${chapter.id}-${i}-teori` 
      },
      { 
        title: `${topic} - Övningar`, 
        url: `#${chapter.id}-${i}-ovningar` 
      },
      { 
        title: `${topic} - Video`, 
        url: `#${chapter.id}-${i}-video` 
      },
    ])
  }));
};

interface ChapterAccordionProps {
  grade: number;
}

const ChapterAccordion = ({ grade }: ChapterAccordionProps) => {
  const chapters = generateChapterData(grade);
  
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-secondary px-4 py-3 border-b border-border flex-shrink-0">
        <h3 className="text-xl font-bold text-secondary-foreground font-life-savers">
          Kapitel & Resurser
        </h3>
      </div>
      
      {/* Accordion */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="single" collapsible className="w-full">
          {chapters.map((chapter) => (
            <AccordionItem 
              key={chapter.id} 
              value={chapter.id}
              className="accordion-chapter"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 text-left group/chapter data-[state=open]:bg-muted/30">
                <span className="font-medium text-foreground text-base font-body transition-all duration-300 group-hover/chapter:text-[hsl(var(--divider-orange))] group-hover/chapter:drop-shadow-[0_0_8px_hsl(var(--divider-orange)/0.6)] group-data-[state=open]/chapter:text-[hsl(var(--divider-orange))] group-data-[state=open]/chapter:animate-text-glow-pulse-orange">{chapter.title}</span>
              </AccordionTrigger>
              <AccordionContent className="bg-muted/30">
                <div className="px-3 py-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
                  {chapter.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      className="flex items-center gap-2 py-0.5 px-2 rounded-md hover:bg-muted transition-colors group font-body font-normal"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                      <span className="text-lg text-foreground group-hover:text-accent transition-colors">
                        {link.title}
                      </span>
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default ChapterAccordion;
