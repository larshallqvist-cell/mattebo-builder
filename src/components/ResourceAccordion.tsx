/**
 * Filnamn: ResourceAccordion.tsx
 * Timestamp: 2026-01-10 17:50
 * Beskrivning: Kraftfull länkhantering som tvingar webbläsaren att lämna
 * applikationen för att undvika 404-fel i inbäddade miljöer.
 */

import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Video, Gamepad2, FileText, MoreHorizontal, Loader2, Link } from "lucide-react";

interface ResourceLink {
  title: string;
  url: string;
}

interface ResourceCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  links: ResourceLink[];
  order?: number;
}

const categoryConfig: Record<
  string,
  {
    icon: React.ReactNode;
    order: number;
  }
> = {
  Videolektioner: { icon: <Video className="w-5 h-5" />, order: 1 },
  Spel: { icon: <Gamepad2 className="w-5 h-5" />, order: 2 },
  Extrauppgifter: { icon: <FileText className="w-5 h-5" />, order: 3 },
  Övrigt: { icon: <MoreHorizontal className="w-5 h-5" />, order: 4 },
};

const generateFallbackData = (grade: number, chapter: number): ResourceCategory[] => {
  return [
    {
      id: "videos",
      title: "Videolektioner",
      icon: <Video className="w-5 h-5" />,
      links: [
        {
          title: `Sök matematik kapitel ${chapter}`,
          url: `https://www.youtube.com/results?search_query=matematik+kapitel+${chapter}`,
        },
      ],
    },
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
      const sheetId = localStorage.getItem("mattebo_sheet_id");
      if (!sheetId) {
        setResources(generateFallbackData(grade, chapter));
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-resources?grade=${grade}&chapter=${chapter}&sheetId=${encodeURIComponent(sheetId)}`,
          {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          },
        );
        const result = await response.json();
        const grouped = result.resources || {};
        const categories: ResourceCategory[] = Object.entries(grouped)
          .map(([name, links]) => ({
            id: name.toLowerCase().replace(/[^a-z]/g, ""),
            title: name,
            icon: categoryConfig[name]?.icon || <MoreHorizontal className="w-5 h-5" />,
            links: links as ResourceLink[],
            order: categoryConfig[name]?.order || 99,
          }))
          .sort((a, b) => (a.order || 99) - (b.order || 99));
        setResources(categories.length === 0 ? generateFallbackData(grade, chapter) : categories);
      } catch (err) {
        setError("Kunde inte hämta data");
        setResources(generateFallbackData(grade, chapter));
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [grade, chapter]);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden h-full flex flex-col">
      <div className="bg-secondary px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold font-life-savers text-primary text-2xl">Kapitel {chapter} - Resurser</h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion type="single" collapsible className="w-full">
          {resources.map((category) => (
            <AccordionItem key={category.id} value={category.id} className="accordion-chapter">
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 text-left">
                <span className="flex items-center gap-3 font-medium text-foreground text-xl">
                  {category.icon} {category.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-muted/30">
                <div className="px-3 py-1 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 auto-rows-min grid-flow-row-dense">
                  {category.links.map((link, index) => {
                    // 1. Rensa URL:en från allt skräp
                    const cleanUrl = link.url.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
                    const isExternal = cleanUrl.startsWith("http");

                    return (
                      <a
                        key={index}
                        href={cleanUrl}
                        // VIKTIGT: Vi använder _top för att tvinga webbläsaren att lämna iframen/appen
                        target={isExternal ? "_top" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-1.5 py-1 px-2 leading-tight rounded-md hover:bg-accent/10 transition-colors group cursor-pointer"
                        onClick={(e) => {
                          // Om det är en extern länk, logga i konsolen så vi kan se vad som händer
                          if (isExternal) console.log("Navigerar till:", cleanUrl);
                        }}
                      >
                        {isExternal ? (
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Link className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className="text-sm leading-tight text-[#d7e7fe]">{link.title}</span>
                      </a>
                    );
                  })}
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
