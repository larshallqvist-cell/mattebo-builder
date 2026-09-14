import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { YOUTUBE_OPEN_EVENT } from "@/lib/youtube";

/**
 * Global helskärmsoverlay för YouTube-videor.
 * Monteras en gång i App och lyssnar på YOUTUBE_OPEN_EVENT.
 * När den stängs avmonteras iframen helt så uppspelningen stoppas.
 */
const YouTubeOverlay = () => {
  const [video, setVideo] = useState<{ videoId: string; title?: string } | null>(null);

  const close = useCallback(() => setVideo(null), []);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [video, close]);

  if (!video) return null;

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
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>,
    document.body,
  );
};

export default YouTubeOverlay;
