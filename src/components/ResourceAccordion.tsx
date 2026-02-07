/**
 * Filnamn: ResourceAccordion.tsx
 * Timestamp: 2026-01-15 20:15
 * Beskrivning: Kraftfull länkhantering som tvingar webbläsaren att lämna
 * applikationen för att undvika 404-fel i inbäddade miljöer.
 */

import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, Video, Gamepad2, FileText, MoreHorizontal, Link } from "lucide-react";
import { hapticFeedback } from "@/hooks/useHaptic";
import { ResourceSkeleton } from "@/components/skeletons";

interface ResourceLink {
  title: string;
  url: string;
  color?: string;
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
  Övningsuppgifter: { icon: <FileText className="w-5 h-5" />, order: 3 },
  Övningsprov: { icon: <FileText className="w-5 h-5" />, order: 4 },
  Övrigt: { icon: <MoreHorizontal className="w-5 h-5" />, order: 5 },
};

// Note: Previously had expected category validation, but removed as it caused
// false positives when a specific chapter simply doesn't have video lessons

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
        {loading && <ResourceSkeleton />}

        {error && !loading && (
          <div className="py-4 px-4 text-center text-muted-foreground font-nunito">
            {error}
          </div>
        )}

        {!loading && (
          <>
            
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
                  <div className="px-2 py-0.5 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0 max-h-[400px] overflow-y-auto industrial-scrollbar">
                    {category.links.map((link, index) => {
                      // 1. Rensa URL:en från allt skräp
                      const cleanUrl = link.url?.trim().replace(/[\u200B-\u200D\uFEFF]/g, "") || "";
                      
                      // Parse special commands from URL
                      const isHeader = !cleanUrl || cleanUrl === "#" || cleanUrl.startsWith("#header");
                      const isDivider = cleanUrl.startsWith("#divider");
                      const isSpacer = cleanUrl.startsWith("#spacer");
                      const isNote = cleanUrl.startsWith("#note");
                      const isExternal = cleanUrl.startsWith("http");
                      
                      // Parse text formatting from title (supports **bold**, *italic*, __underline__)
                      const parseFormattedText = (text: string) => {
                        // Process in order: bold (**), underline (__), italic (*)
                        const parts: { text: string; bold?: boolean; italic?: boolean; underline?: boolean }[] = [];
                        let remaining = text;
                        
                        // Simple regex-based parsing
                        const regex = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)/g;
                        let lastIndex = 0;
                        let match;
                        
                        while ((match = regex.exec(text)) !== null) {
                          // Add text before match
                          if (match.index > lastIndex) {
                            parts.push({ text: text.slice(lastIndex, match.index) });
                          }
                          
                          if (match[1]) {
                            // Bold **text**
                            parts.push({ text: match[2], bold: true });
                          } else if (match[3]) {
                            // Underline __text__
                            parts.push({ text: match[4], underline: true });
                          } else if (match[5]) {
                            // Italic *text*
                            parts.push({ text: match[6], italic: true });
                          }
                          
                          lastIndex = match.index + match[0].length;
                        }
                        
                        // Add remaining text
                        if (lastIndex < text.length) {
                          parts.push({ text: text.slice(lastIndex) });
                        }
                        
                        return parts.length > 0 ? parts : [{ text }];
                      };
                      
                      const renderFormattedText = (text: string, baseClass: string, style?: React.CSSProperties) => {
                        const parts = parseFormattedText(text);
                        return (
                          <span className={baseClass} style={style}>
                            {parts.map((part, i) => {
                              let className = "";
                              if (part.bold) className += " font-bold";
                              if (part.italic) className += " italic";
                              if (part.underline) className += " underline";
                              return <span key={i} className={className}>{part.text}</span>;
                            })}
                          </span>
                        );
                      };
                      
                      // Determine link color
                      const linkColor = link.color || undefined;
                      const isHexOrCss = linkColor && (linkColor.startsWith('#') || linkColor.startsWith('rgb') || linkColor.startsWith('hsl') || /^[a-z]+$/i.test(linkColor));
                      const colorStyle = isHexOrCss ? { color: linkColor } : undefined;
                      const colorClass = linkColor && !isHexOrCss ? linkColor : '';

                      // Render #divider - horizontal line
                      if (isDivider) {
                        return (
                          <div key={index} className="col-span-full py-2 px-1.5">
                            <div 
                              className="h-px w-full"
                              style={{ 
                                background: `linear-gradient(90deg, transparent, ${linkColor || "hsl(var(--neon-copper))"}, transparent)`,
                                boxShadow: `0 0 4px ${linkColor || "hsl(var(--neon-copper))"}40`
                              }}
                            />
                          </div>
                        );
                      }
                      
                      // Render #spacer - extra vertical space
                      if (isSpacer) {
                        return <div key={index} className="col-span-full h-3" />;
                      }
                      
                      // Render #note:text - info text
                      if (isNote) {
                        return (
                          <div key={index} className="col-span-full py-1 px-1.5">
                            <span 
                              className="text-xs font-nunito italic opacity-70"
                              style={{ color: linkColor || "hsl(var(--foreground))" }}
                            >
                              {link.title}
                            </span>
                          </div>
                        );
                      }

                      // Render #header - grouping text
                      if (isHeader) {
                        return (
                          <div key={index} className="col-span-full pt-2 pb-0.5 px-1.5">
                            {renderFormattedText(
                              link.title,
                              "text-xs font-orbitron font-bold uppercase tracking-wider",
                              { 
                                color: linkColor || "hsl(var(--neon-copper))",
                                textShadow: `0 0 8px ${linkColor || "hsl(var(--neon-copper))"}40`
                              }
                            )}
                          </div>
                        );
                      }

                      // Render as clickable link
                      return (
                        <button
                          key={index}
                          type="button"
                          className={`flex items-center gap-1.5 py-0.5 px-1.5 transition-all rounded-md hover:bg-white/10 cursor-pointer group text-left w-full ${colorClass}`}
                          style={colorStyle}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            hapticFeedback('light');
                            if (isExternal) {
                              window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              window.location.href = cleanUrl;
                            }
                          }}
                        >
                          {isExternal ? (
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 transition-colors" style={colorStyle ? { color: colorStyle.color } : undefined} />
                          ) : (
                            <Link className="w-3.5 h-3.5 flex-shrink-0 transition-colors" style={colorStyle ? { color: colorStyle.color } : undefined} />
                          )}
                          {renderFormattedText(
                            link.title,
                            `text-sm font-nunito leading-tight transition-colors ${colorClass || 'text-foreground/90 group-hover:text-foreground'}`,
                            colorStyle
                          )}
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
