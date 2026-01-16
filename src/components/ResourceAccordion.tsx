/**
 * Filnamn: ResourceAccordion.tsx
 * Timestamp: 2026-01-15 20:15
 * Beskrivning: Kraftfull länkhantering som tvingar webbläsaren att lämna
 * applikationen för att undvika 404-fel i inbäddade miljöer.
 */

import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Video, Gamepad2, FileText, MoreHorizontal, Loader2, Link } from "lucide-react";
import { getChapterSubtitle } from "@/components/ChapterSelector";

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

  // Standard Sheet-ID för resurser (kan överskrivas via SheetConfig)
  const DEFAULT_SHEET_ID = "1UzIhln8WHH_Toy7-cXXmlMi4UQEg6DEypzE_kVNkFkQ";

  useEffect(() => {
    const fetchResources = async () => {
      const sheetId = localStorage.getItem("mattebo_sheet_id") || DEFAULT_SHEET_ID;
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header removed - MetalPanel provides it */}

      <div className="flex-1 overflow-y-auto">
        <Accordion type="single" collapsible className="w-full">
          {resources.map((category) => (
            <AccordionItem key={category.id} value={category.id} className="border-b border-white/10">
              <AccordionTrigger 
                className="px-4 py-3 hover:bg-white/5 text-left transition-colors"
              >
                <span className="flex items-center gap-3 font-orbitron font-medium text-foreground text-lg">
                  <span style={{ color: "hsl(var(--neon-copper))" }}>{category.icon}</span> 
                  {category.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-black/20">
                <div className="px-3 py-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
                  {category.links.map((link, index) => {
                    // 1. Rensa URL:en från allt skräp
                    const cleanUrl = link.url.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
                    const isExternal = cleanUrl.startsWith("http");

                    return (
                      <a
                        key={index}
                        href={cleanUrl}
                        target={isExternal ? "_top" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-2 py-1 px-2 transition-all rounded-md hover:bg-white/10 cursor-pointer group"
                        onClick={(e) => {
                          if (isExternal) console.log("Navigerar till:", cleanUrl);
                        }}
                      >
                        {isExternal ? (
                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-neon-turquoise flex-shrink-0 transition-colors" />
                        ) : (
                          <Link className="w-4 h-4 text-muted-foreground group-hover:text-neon-turquoise flex-shrink-0 transition-colors" />
                        )}
                        <span className="text-base font-nunito leading-snug text-foreground/90 group-hover:text-foreground transition-colors">{link.title}</span>
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
