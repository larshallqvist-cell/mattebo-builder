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
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 text-left">
                <span className="font-medium text-foreground text-base">{chapter.title}</span>
              </AccordionTrigger>
              <AccordionContent className="bg-muted/30">
                <div className="px-4 py-2 space-y-1">
                  {chapter.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      <span className="text-base text-foreground group-hover:text-accent transition-colors">
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
