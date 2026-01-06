import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink, Video, Gamepad2, FileText, MoreHorizontal } from "lucide-react";

interface ResourceLink {
  title: string;
  url: string;
}

interface ResourceCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  links: ResourceLink[];
}

// Generate resource data based on grade and chapter
const generateResourceData = (grade: number, chapter: number): ResourceCategory[] => {
  const chapterNames = [
    "Talförståelse",
    "Algebra",
    "Geometri",
    "Statistik",
    "Samband"
  ];
  
  const chapterName = chapterNames[chapter - 1] || "Kapitel";
  
  return [
    {
      id: "videos",
      title: "Videolektioner",
      icon: <Video className="w-5 h-5" />,
      links: [
        { title: `Introduktion till ${chapterName}`, url: `#video-intro-${chapter}` },
        { title: `${chapterName} - Del 1`, url: `#video-part1-${chapter}` },
        { title: `${chapterName} - Del 2`, url: `#video-part2-${chapter}` },
        { title: `${chapterName} - Fördjupning`, url: `#video-advanced-${chapter}` },
        { title: "Sammanfattning", url: `#video-summary-${chapter}` },
      ]
    },
    {
      id: "games",
      title: "Spel",
      icon: <Gamepad2 className="w-5 h-5" />,
      links: [
        { title: `${chapterName}-spelet`, url: `#game-main-${chapter}` },
        { title: "Snabbquiz", url: `#game-quiz-${chapter}` },
        { title: "Memory", url: `#game-memory-${chapter}` },
        { title: "Tävla mot klockan", url: `#game-speed-${chapter}` },
      ]
    },
    {
      id: "exercises",
      title: "Extrauppgifter",
      icon: <FileText className="w-5 h-5" />,
      links: [
        { title: "Grundnivå", url: `#exercises-basic-${chapter}` },
        { title: "Mellannivå", url: `#exercises-medium-${chapter}` },
        { title: "Utmaning", url: `#exercises-challenge-${chapter}` },
        { title: "Prov-träning", url: `#exercises-test-${chapter}` },
      ]
    },
    {
      id: "other",
      title: "Övrigt",
      icon: <MoreHorizontal className="w-5 h-5" />,
      links: [
        { title: "Formelblad", url: `#other-formulas-${chapter}` },
        { title: "Facit", url: `#other-answers-${chapter}` },
        { title: "Ordlista", url: `#other-glossary-${chapter}` },
      ]
    }
  ];
};

interface ResourceAccordionProps {
  grade: number;
  chapter: number;
}

const ResourceAccordion = ({ grade, chapter }: ResourceAccordionProps) => {
  const resources = generateResourceData(grade, chapter);
  
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-secondary px-4 py-3 border-b border-border flex-shrink-0">
        <h3 className="text-xl font-bold text-secondary-foreground font-life-savers">
          Kapitel {chapter} - Resurser
        </h3>
      </div>
      
      {/* Accordion */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="single" collapsible className="w-full">
          {resources.map((category) => (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className="accordion-chapter"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 text-left group/chapter data-[state=open]:bg-muted/30">
                <span className="flex items-center gap-3 font-medium text-foreground text-base font-body transition-all duration-300 group-hover/chapter:text-[hsl(var(--divider-orange))] group-hover/chapter:drop-shadow-[0_0_8px_hsl(var(--divider-orange)/0.6)] group-data-[state=open]/chapter:text-[hsl(var(--divider-orange))] group-data-[state=open]/chapter:animate-text-glow-pulse-orange">
                  {category.icon}
                  {category.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-muted/30">
                <div className="px-4 py-2 space-y-1">
                  {category.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted transition-colors group font-body font-normal"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      <span className="text-[15px] text-foreground group-hover:text-accent transition-colors">
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

export default ResourceAccordion;
