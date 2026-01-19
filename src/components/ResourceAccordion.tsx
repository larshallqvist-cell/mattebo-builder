/**
 * Filnamn: ResourceAccordion.tsx
 * Timestamp: 2026-01-15 20:15
 * Beskrivning: Kraftfull länkhantering som tvingar webbläsaren att lämna
 * applikationen för att undvika 404-fel i inbäddade miljöer.
 */

import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, Video, Gamepad2, FileText, MoreHorizontal, Link, Loader2, AlertTriangle } from "lucide-react";

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

// Expected categories that should normally be present
const expectedCategories = ["Videolektioner"];

const generateFallbackData = (chapter: number): ResourceCategory[] => {
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

const ResourceAccordion = forwardRef<HTMLDivElement, ResourceAccordionProps>(({ grade, chapter }, ref) => {
  const [resources, setResources] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, ResourceCategory[]>>(new Map());

  // Standard Sheet-ID för resurser (kan överskrivas via SheetConfig)
  const DEFAULT_SHEET_ID = "1UzIhln8WHH_Toy7-cXXmlMi4UQEg6DEypzE_kVNkFkQ";

  const fetchResources = useCallback(async () => {
    const cacheKey = `${grade}-${chapter}`;
    
    // Return cached data immediately if available
    if (cacheRef.current.has(cacheKey)) {
      setResources(cacheRef.current.get(cacheKey)!);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const sheetId = localStorage.getItem("mattebo_sheet_id") || DEFAULT_SHEET_ID;
    setLoading(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-resources?grade=${grade}&chapter=${chapter}&sheetId=${encodeURIComponent(sheetId)}`,
        {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          signal: abortControllerRef.current.signal,
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
      
      const finalResources = categories.length === 0 ? generateFallbackData(chapter) : categories;
      cacheRef.current.set(cacheKey, finalResources);
      setResources(finalResources);
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Ignore aborted requests
      setError("Kunde inte hämta data");
      setResources(generateFallbackData(chapter));
    } finally {
      setLoading(false);
    }
  }, [grade, chapter]);

  useEffect(() => {
    fetchResources();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchResources]);

  return (
    <div ref={ref} className="h-full flex flex-col overflow-hidden">
      {/* Header removed - MetalPanel provides it */}

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="font-nunito">Laddar resurser...</span>
          </div>
        )}

        {error && !loading && (
          <div className="py-4 px-4 text-center text-muted-foreground font-nunito">
            {error}
          </div>
        )}

        {!loading && (
          <>
            {/* Warning if expected categories are missing */}
            {resources.length > 0 && (() => {
              const presentCategories = resources.map(r => r.title);
              const missingCategories = expectedCategories.filter(c => !presentCategories.includes(c));
              if (missingCategories.length > 0) {
                return (
                  <div className="mx-4 mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-nunito text-amber-200/90">
                      <span className="font-medium">Saknas:</span> {missingCategories.join(", ")}
                      <span className="block text-xs text-amber-200/60 mt-0.5">
                        Kontrollera att kategorin finns i kalkylbladet
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
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
                          <button
                            key={index}
                            type="button"
                            className="flex items-center gap-2 py-1 px-2 transition-all rounded-md hover:bg-white/10 cursor-pointer group text-left w-full"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isExternal) {
                                // Force open in new tab - bypasses iframe restrictions
                                window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                              } else {
                                window.location.href = cleanUrl;
                              }
                            }}
                          >
                            {isExternal ? (
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-neon-turquoise flex-shrink-0 transition-colors" />
                            ) : (
                              <Link className="w-4 h-4 text-muted-foreground group-hover:text-neon-turquoise flex-shrink-0 transition-colors" />
                            )}
                            <span className="text-base font-nunito leading-snug text-foreground/90 group-hover:text-foreground transition-colors">{link.title}</span>
                          </button>
                        );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            </Accordion>
          </>
        )}
      </div>
    </div>
  );
});

ResourceAccordion.displayName = "ResourceAccordion";

export default ResourceAccordion;
