import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { YOUTUBE_OPEN_EVENT, getYouTubeRoot, tryRequestFullscreen } from "@/lib/youtube";

const getFsElement = (): Element | null =>
  document.fullscreenElement ??
  (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
  null;

const exitFullscreen = () => {
  try {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    };
    if (!getFsElement()) return;
    const fn =
      doc.exitFullscreen?.bind(doc) ??
      doc.webkitExitFullscreen?.bind(doc) ??
      doc.msExitFullscreen?.bind(doc);
    const result = fn?.() as Promise<void> | void;
    if (result && typeof (result as Promise<void>).catch === "function") {
      (result as Promise<void>).catch(() => {});
    }
  } catch {
    /* ignorera */
  }
};

/**
 * Global helskärmsoverlay för YouTube-videor.
 * Försöker använda äkta Fullscreen API (begärs i klick-handlern i youtube.ts),
 * med den fasta overlayen som fallback när fullscreen nekas eller saknas.
 */
const YouTubeOverlay = () => {
  const [video, setVideo] = useState<{ videoId: string; title?: string } | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const wasFullscreenRef = useRef(false);

  if (!rootRef.current && typeof document !== "undefined") {
    rootRef.current = getYouTubeRoot();
  }

  const close = useCallback(() => {
    wasFullscreenRef.current = false;
    exitFullscreen();
    setVideo(null);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ videoId: string; title?: string }>).detail;
      if (detail?.videoId) setVideo(detail);
    };
    window.addEventListener(YOUTUBE_OPEN_EVENT, handler);
    return () => window.removeEventListener(YOUTUBE_OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!video) return;

    const root = rootRef.current;
    // Andra försöket: om klick-begäran inte gick igenom (t.ex. pga timing).
    if (root && !getFsElement()) tryRequestFullscreen(root);
    wasFullscreenRef.current = !!getFsElement();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onFsChange = () => {
      const isFs = !!getFsElement();
      if (wasFullscreenRef.current && !isFs) {
        // Användaren lämnade äkta fullscreen (t.ex. Escape) -> stäng overlayen.
        wasFullscreenRef.current = false;
        setVideo(null);
      } else {
        wasFullscreenRef.current = isFs;
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [video, close]);

  const root = rootRef.current;
  if (!video || !root) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={video.title || "YouTube-video"}
      onClick={close}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Stäng video"
        className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/60 p-2 text-white/80 transition-colors hover:bg-black/90 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="h-full w-full p-2 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <iframe
          key={video.videoId}
          className="h-full w-full border-0"
          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
          title={video.title || "YouTube-video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>,
    root,
  );
};

export default YouTubeOverlay;
