import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink, Video, Gamepad2, FileText, MoreHorizontal, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

// Sheet ID - this should be configured per deployment
const SHEET_ID = localStorage.getItem('mattebo_sheet_id') || '';

const categoryConfig: Record<string, { icon: React.ReactNode; order: number }> = {
  'Videolektioner': { icon: <Video className="w-5 h-5" />, order: 1 },
  'Spel': { icon: <Gamepad2 className="w-5 h-5" />, order: 2 },
  'Extrauppgifter': { icon: <FileText className="w-5 h-5" />, order: 3 },
  'Övrigt': { icon: <MoreHorizontal className="w-5 h-5" />, order: 4 },
};

// Fallback data when no sheet is configured
const generateFallbackData = (grade: number, chapter: number): ResourceCategory[] => {
  const chapterNames = ["Talförståelse", "Algebra", "Geometri", "Statistik", "Samband"];
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
      ]
    },
    {
      id: "games",
      title: "Spel",
      icon: <Gamepad2 className="w-5 h-5" />,
      links: [
        { title: `${chapterName}-spelet`, url: `#game-main-${chapter}` },
        { title: "Snabbquiz", url: `#game-quiz-${chapter}` },
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
      ]
    },
    {
      id: "other",
      title: "Övrigt",
      icon: <MoreHorizontal className="w-5 h-5" />,
      links: [
        { title: "Formelblad", url: `#other-formulas-${chapter}` },
        { title: "Facit", url: `#other-answers-${chapter}` },
      ]
    }
  ];
};

interface ResourceAccordionProps {
  grade: number;
  chapter: number;
}

const ResourceAccordion = ({ grade, chapter }: ResourceAccordionProps) => {
  const [resources, setResources] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      const sheetId = localStorage.getItem('mattebo_sheet_id');
      
      if (!sheetId) {
        // Use fallback data if no sheet configured
        setResources(generateFallbackData(grade, chapter));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-resources', {
          body: null,
          headers: {},
        });

        // Build URL with query params manually since invoke doesn't support query params directly
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-resources?grade=${grade}&chapter=${chapter}&sheetId=${encodeURIComponent(sheetId)}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        // Transform grouped data into ResourceCategory array
        const grouped = result.resources || {};
        const categories: ResourceCategory[] = Object.entries(grouped)
          .map(([categoryName, links]) => {
            const config = categoryConfig[categoryName] || { 
              icon: <MoreHorizontal className="w-5 h-5" />, 
              order: 99 
            };
            return {
              id: categoryName.toLowerCase().replace(/[^a-z]/g, ''),
              title: categoryName,
              icon: config.icon,
              links: links as ResourceLink[],
              order: config.order,
            };
          })
          .sort((a, b) => (a as any).order - (b as any).order);

        if (categories.length === 0) {
          // No data from sheet, use fallback
          setResources(generateFallbackData(grade, chapter));
        } else {
          setResources(categories);
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err instanceof Error ? err.message : 'Kunde inte hämta resurser');
        setResources(generateFallbackData(grade, chapter));
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [grade, chapter]);
  
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-secondary px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-secondary-foreground font-life-savers">
            Kapitel {chapter} - Resurser
          </h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
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
                <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {category.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target={link.url.startsWith('http') ? '_blank' : undefined}
                      rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted transition-colors group font-body font-normal"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
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
