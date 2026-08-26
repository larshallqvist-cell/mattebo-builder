import { ExternalLink } from "lucide-react";

/**
 * Shared renderer for lesson plan content (used by PostItNote and the admin editor preview).
 *
 * Formatting rules (plain text / markdown):
 *  - `## Rubrik`            → rubrik (liten, versal, med linje över). Text efter rubriken på samma rad blir brödtext.
 *  - `Rubrik:`              → rubrik (bakåtkompatibelt med äldre planeringar)
 *  - `**fet**`              → fetstil (alltid inline, aldrig rubrik)
 *  - `- punkt`              → punktlista
 *  - `---`, `___`, `***`    → avskiljande linje
 *  - `[text](url)` / url    → länk
 *
 * HTML content (från Google Kalender) hanteras med samma visuella regler.
 */

const HEADING_MARKER = /^##\s*/;

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

const linkClass =
  "inline-flex items-center gap-1 align-baseline rounded-md border border-[hsl(var(--neon-blue))/40] bg-[hsl(var(--neon-blue))/10] px-1.5 py-[1px] text-[0.8rem] font-medium text-[hsl(var(--neon-blue))] transition-colors hover:bg-[hsl(var(--neon-blue))/20] hover:border-[hsl(var(--neon-blue))/70]";

const openLink = (href: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  window.open(href, "_blank", "noopener,noreferrer");
};

const isSafeHref = (href: string) =>
  /^(https?:|mailto:)/i.test(href) || href.startsWith("/") || href.startsWith("#");

const headingWrapper = (key: string, isFirst: boolean, title: React.ReactNode, rest: React.ReactNode) => (
  <div
    key={key}
    className={`${isFirst ? "mt-0" : "mt-5"} mb-1 border-t border-[hsl(var(--postit-text))/25] pt-1.5`}
  >
    <span className="text-[0.7rem] uppercase tracking-[0.14em] font-orbitron text-[hsl(var(--postit-text))]">
      {title}
    </span>
    {rest && <span className="ml-2 text-sm font-body font-normal leading-snug">{rest}</span>}
  </div>
);

const bulletList = (key: string, items: React.ReactNode[]) => (
  <ul key={key} className="my-1.5 space-y-1 font-body font-normal">
    {items.map((item, i) => (
      <li key={i} className="relative pl-4 text-sm leading-snug">
        <span className="absolute left-0 top-[0.45em] h-1.5 w-1.5 rounded-full bg-[hsl(var(--postit-text))] shadow-[0_0_6px_hsl(var(--postit-text)/0.8)]" />
        {item}
      </li>
    ))}
  </ul>
);

const divider = (key: string) => <hr key={key} className="my-3 border-[hsl(var(--postit-text))/25]" />;

/* ------------------------------- inline HTML ------------------------------- */

const renderInlineHtml = (html: string): (string | JSX.Element)[] => {
  const result: (string | JSX.Element)[] = [];
  let keyIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = /<(b|strong|u|i|em|a)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const decoded = decodeHtmlEntities(html.slice(lastIndex, match.index));
      if (decoded) result.push(decoded);
    }

    const fullMatch = match[0];
    const tagName = match[1].toLowerCase();

    if (tagName === "b" || tagName === "strong") {
      const content = fullMatch.replace(/<\/?(?:b|strong)[^>]*>/gi, "");
      result.push(<strong key={`b-${keyIndex++}`}>{renderInlineHtml(content)}</strong>);
    } else if (tagName === "u") {
      const content = fullMatch.replace(/<\/?u[^>]*>/gi, "");
      result.push(
        <span key={`u-${keyIndex++}`} className="underline">
          {renderInlineHtml(content)}
        </span>,
      );
    } else if (tagName === "i" || tagName === "em") {
      const content = fullMatch.replace(/<\/?(?:i|em)[^>]*>/gi, "");
      result.push(<em key={`i-${keyIndex++}`}>{renderInlineHtml(content)}</em>);
    } else if (tagName === "a") {
      const hrefMatch = fullMatch.match(/href="([^"]*)"/i);
      const href = hrefMatch ? hrefMatch[1] : "#";
      const cleanContent = fullMatch
        .replace(/<\/?a[^>]*>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      const finalHref = href.startsWith("www.") ? `https://${href}` : href;

      if (!isSafeHref(finalHref)) {
        result.push(<span key={`a-${keyIndex++}`}>{cleanContent}</span>);
      } else {
        result.push(
          <a
            key={`a-${keyIndex++}`}
            href={finalHref}
            onClick={openLink(finalHref)}
            className={linkClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            {cleanContent}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
          </a>,
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < html.length) {
    const decoded = decodeHtmlEntities(html.slice(lastIndex).replace(/<[^>]+>/g, ""));
    if (decoded) result.push(decoded);
  }

  return result.length > 0 ? result : [decodeHtmlEntities(html.replace(/<[^>]+>/g, ""))];
};

/* ------------------------------ inline markdown --------------------------- */

const renderPlainInline = (line: string): (string | JSX.Element)[] => {
  const parts = line.split(
    /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/|www\.|mailto:)[^)\s]+\)|https?:\/\/\S+|www\.\S+)/g,
  );
  return parts.filter(Boolean).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const raw = linkMatch[2];
      const href = raw.startsWith("www.") ? `https://${raw}` : raw;
      if (!/^(https?:|mailto:)/i.test(href)) return label;
      return (
        <a key={i} href={href} onClick={openLink(href)} className={linkClass} target="_blank" rel="noopener noreferrer">
          {label}
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      );
    }
    if (/^(https?:\/\/|www\.)/i.test(part)) {
      const href = part.startsWith("www.") ? `https://${part}` : part;
      return (
        <a key={i} href={href} onClick={openLink(href)} className={linkClass} target="_blank" rel="noopener noreferrer">
          {part.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      );
    }
    return part;
  });
};

/* --------------------------------- HTML ----------------------------------- */

const renderRichContent = (html: string): JSX.Element[] => {
  const elements: JSX.Element[] = [];
  let text = html;

  text = text.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "{{SPACING}}");
  text = text.replace(/<br\s*\/?>/gi, "{{BR}}");
  text = text.replace(/<\/ul><ul>/gi, "{{SPACING}}");

  const listItems: string[] = [];
  text = text.replace(/<li>([\s\S]*?)<\/li>/gi, (_, content: string) => {
    const trimmed = content.trim();
    listItems.push(!trimmed || trimmed === "{{BR}}" ? "{{EMPTY}}" : trimmed);
    return "{{LI}}";
  });

  text = text.replace(/<\/?(?:ul|ol)>/gi, "");
  text = text.replace(/<\/?p>/gi, "{{BR}}");
  text = text.replace(/<\/?div>/gi, "{{BR}}");
  text = text.replace(/<\/?span[^>]*>/gi, "");
  text = text.replace(/<hr\s*\/?>/gi, "{{HR}}");

  const parts = text.split(/(\{\{BR\}\}|\{\{LI\}\}|\{\{SPACING\}\}|\{\{HR\}\})/);
  let listIndex = 0;
  let headingCount = 0;
  let bulletItems: JSX.Element[] = [];

  const flushBulletList = () => {
    if (bulletItems.length > 0) {
      elements.push(bulletList(`ul-${elements.length}`, bulletItems));
      bulletItems = [];
    }
  };

  parts.forEach((part, i) => {
    if (part === "{{BR}}") {
      flushBulletList();
      return;
    }
    if (part === "{{SPACING}}") {
      flushBulletList();
      elements.push(<div key={`space-${i}`} className="h-3" />);
      return;
    }
    if (part === "{{HR}}") {
      flushBulletList();
      elements.push(divider(`hr-${i}`));
      return;
    }
    if (part === "{{LI}}") {
      const item = listItems[listIndex++];
      if (item === "{{EMPTY}}") {
        flushBulletList();
        elements.push(<div key={`space-${i}`} className="h-4" />);
      } else {
        bulletItems.push(<span key={`li-${i}`}>{renderInlineHtml(item)}</span>);
      }
      return;
    }


    const trimmed = part.trim();
    if (!trimmed) return;
    flushBulletList();

    // Heading marker: "## Rubrik" (possibly wrapped in tags) or a short line ending with ":"
    const withoutMarker = trimmed.replace(/^((?:<[^>]+>\s*)*)##\s*/, "$1");
    const plainText = trimmed.replace(/<[^>]+>/g, "").trim();
    const hasMarker = withoutMarker !== trimmed;
    const colonHeading = !hasMarker && plainText.endsWith(":") && plainText.length < 40;

    if (hasMarker || colonHeading) {
      const isFirst = headingCount === 0;
      headingCount++;
      const source = hasMarker ? withoutMarker : trimmed;
      elements.push(headingWrapper(`h-${i}`, isFirst, renderInlineHtml(source), null));
      return;
    }

    elements.push(
      <p key={`p-${i}`} className="text-sm my-1 font-body font-normal leading-snug">
        {renderInlineHtml(trimmed)}
      </p>,
    );
  });

  flushBulletList();
  return elements;
};

/* ----------------------------- plain / markdown --------------------------- */

const MAX_LINE_LENGTH = 2000;

const renderPlainContent = (text: string): JSX.Element[] => {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let bulletItems: JSX.Element[] = [];
  let headingCount = 0;

  const flushBulletList = () => {
    if (bulletItems.length > 0) {
      elements.push(bulletList(`ul-${elements.length}`, bulletItems));
      bulletItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim().slice(0, MAX_LINE_LENGTH);

    if (trimmed === "---" || trimmed === "___" || trimmed === "***") {
      flushBulletList();
      elements.push(divider(`hr-${i}`));
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      bulletItems.push(<span key={`li-${i}`}>{renderPlainInline(trimmed.slice(2))}</span>);
      return;
    }

    flushBulletList();
    if (!trimmed) return;


    const isMarkerHeading = HEADING_MARKER.test(trimmed);
    const colonHeading = !isMarkerHeading && trimmed.endsWith(":") && trimmed.length < 40;

    if (isMarkerHeading || colonHeading) {
      const body = isMarkerHeading ? trimmed.replace(HEADING_MARKER, "") : trimmed.replace(/:$/, "");
      // Allow body text on the same line as the heading, separated by " – " is not required:
      // everything up to the first "  " (double space) or the whole line is the heading.
      const isFirst = headingCount === 0;
      headingCount++;
      elements.push(headingWrapper(`h-${i}`, isFirst, renderPlainInline(body), null));
      return;
    }

    elements.push(
      <p key={`p-${i}`} className="text-sm my-1 font-body font-normal leading-snug">
        {renderPlainInline(trimmed)}
      </p>,
    );
  });

  flushBulletList();
  return elements;
};

/** Render lesson content (HTML from Google Calendar or markdown from the admin editor). */
export const parseLessonContent = (text: string): JSX.Element[] => {
  if (!text) return [];
  return /<[^>]+>/.test(text) ? renderRichContent(text) : renderPlainContent(text);
};
