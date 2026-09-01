import { GraduationCap, ExternalLink } from "lucide-react";
import { useHomework } from "@/hooks/useHomework";

interface HomeworkBannerProps {
  grade: number;
  className?: string;
  compact?: boolean;
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
const HomeworkBanner = ({ grade, className = "", compact = false }: HomeworkBannerProps) => {
  const { title, content, loading } = useHomework(grade);

  if (loading || !content.trim()) return null;

  return (
    <section
      className={`rounded-xl border ${compact ? "px-2.5 py-1.5 w-[6cm] max-w-[34vw] shrink-0" : "px-4 py-2.5"} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--homework-bg-soft)) 0%, hsl(var(--homework-bg)) 100%)",
        borderColor: "hsl(var(--homework-border))",
        color: "hsl(var(--homework-text))",
        boxShadow: "0 12px 28px -18px hsl(var(--homework-border) / 0.9)",
      }}
    >
      <h2 className={`flex items-center gap-2 font-orbitron font-bold uppercase tracking-wide ${compact ? "text-base" : "text-sm md:text-base"}`}>
        <GraduationCap className={`${compact ? "h-4 w-4" : "h-4 w-4"}`} />
        {title}
      </h2>
      <p className={`mt-1 whitespace-pre-line font-nunito leading-snug ${compact ? "text-sm line-clamp-3" : "text-sm md:text-[0.95rem]"}`}>
        {renderContentWithLinks(content)}
      </p>
    </section>
  );
};

export default HomeworkBanner;
