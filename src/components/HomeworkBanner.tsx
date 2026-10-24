import { useState } from "react";
import { GraduationCap, ExternalLink } from "lucide-react";
import { useHomework } from "@/hooks/useHomework";
import { openYouTubeOverlay } from "@/lib/youtube";

interface HomeworkBannerProps {
  grade: number;
  className?: string;
  compact?: boolean;
  dense?: boolean;
}

const URL_REGEX = /(\[[^\]]+\]\((?:https?:\/\/|www\.|mailto:)[^)\s]+\)|https?:\/\/\S+|www\.\S+)/gi;

const isSafeHref = (href: string) => {
  return /^(https?:|mailto:)/i.test(href) || href.startsWith("/") || href.startsWith("#");
};

const makeHref = (raw: string) => {
  if (raw.startsWith("www.")) return `https://${raw}`;
  return raw;
};

const renderContentWithLinks = (text: string) => {
  const parts = text.split(URL_REGEX);
  return parts.filter(Boolean).map((part, i) => {
    const markdownMatch = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (markdownMatch) {
      const label = markdownMatch[1];
      const href = makeHref(markdownMatch[2]);
      if (!isSafeHref(href)) return <span key={i}>{label}</span>;
      return (
        <a
          key={i}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            if (openYouTubeOverlay(href, label)) return;
            window.open(href, "_blank", "noopener,noreferrer");
          }}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 align-baseline rounded-md border border-[hsl(var(--homework-text))/40] bg-[hsl(var(--homework-text))/10] px-1 py-[1px] text-[0.75rem] font-medium transition-colors hover:bg-[hsl(var(--homework-text))/20] hover:border-[hsl(var(--homework-text))/70]"
        >
          {label}
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      );
    }

    if (/^https?:\/\/\S+|^www\.\S+/.test(part)) {
      const href = makeHref(part);
      if (!isSafeHref(href)) return <span key={i}>{part}</span>;
      return (
        <a
          key={i}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            if (openYouTubeOverlay(href)) return;
            window.open(href, "_blank", "noopener,noreferrer");
          }}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 align-baseline rounded-md border border-[hsl(var(--homework-text))/40] bg-[hsl(var(--homework-text))/10] px-1 py-[1px] text-[0.75rem] font-medium transition-colors hover:bg-[hsl(var(--homework-text))/20] hover:border-[hsl(var(--homework-text))/70]"
        >
          {part}
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      );
    }

    return <span key={i}>{part}</span>;
  });
};

/** Rectangular highlight box at the very top of a grade page. */
const HomeworkBanner = ({ grade, className = "", compact = false, dense = false }: HomeworkBannerProps) => {
  const { title, content, loading } = useHomework(grade);
  const [expanded, setExpanded] = useState(false);

  if (loading || !content.trim()) return null;

  const firstMatch = content.match(URL_REGEX)?.[0];
  const md = firstMatch?.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  const firstHref = firstMatch ? makeHref(md ? md[2] : firstMatch) : null;
  const firstLabel = md ? md[1] : undefined;
  const isLong = content.length > 90 || content.includes("\n");

  return (
    <section
      className={`rounded-xl border ${compact ? "px-2.5 py-1.5 w-full sm:w-[6cm] shrink-0" : dense ? "px-3 py-1.5" : "px-3 py-2"} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--homework-bg-soft)) 0%, hsl(var(--homework-bg)) 100%)",
        borderColor: "hsl(var(--homework-border))",
        color: "hsl(var(--homework-text))",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-orbitron font-bold uppercase tracking-wide text-xs">
            <GraduationCap className="h-4 w-4" />
            {title}
          </h2>
          <p className={`whitespace-pre-line font-nunito leading-snug mt-0.5 text-sm ${expanded ? "" : "line-clamp-2"}`}>
            {renderContentWithLinks(content)}
          </p>
          {isLong && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-0.5 text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100">
              {expanded ? "Visa mindre" : "Visa mer"}
            </button>
          )}
        </div>
        {firstHref && isSafeHref(firstHref) && (
          <button
            type="button"
            onClick={() => {
              if (openYouTubeOverlay(firstHref, firstLabel)) return;
              window.open(firstHref, "_blank", "noopener,noreferrer");
            }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--homework-text))/50] bg-[hsl(var(--homework-text))/15] px-3 py-2 text-sm font-semibold hover:bg-[hsl(var(--homework-text))/25] transition-colors"
          >
            Öppna läxa
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
};

export default HomeworkBanner;
