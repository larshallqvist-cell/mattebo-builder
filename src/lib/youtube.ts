/**
 * Generell YouTube-hantering.
 *
 * `extractYouTubeId` känner igen vanliga YouTube-varianter och plockar ut video-ID.
 * `openYouTubeOverlay` skickar ett event som <YouTubeOverlay /> lyssnar på,
 * så att vilken länkrenderare som helst kan öppna spelaren utan props-borrning.
 */

export const YOUTUBE_OPEN_EVENT = "mattebo:open-youtube";

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** Returnerar video-ID om url:en är en YouTube-länk, annars null. */
export const extractYouTubeId = (rawUrl: string): string | null => {
  if (!rawUrl) return null;
  const cleaned = rawUrl.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!cleaned) return null;

  let url: URL;
  try {
    url = new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  const isYouTube =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "youtu.be";
  if (!isYouTube) return null;

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && ID_PATTERN.test(id) ? id : null;
  }

  // youtube.com/watch?v=<id>
  const v = url.searchParams.get("v");
  if (v && ID_PATTERN.test(v)) return v;

  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && ["embed", "shorts", "live", "v"].includes(segments[0].toLowerCase())) {
    const id = segments[1];
    if (ID_PATTERN.test(id)) return id;
  }

  return null;
};

export const isYouTubeUrl = (url: string): boolean => extractYouTubeId(url) !== null;

/** Öppnar helskärmsoverlayen för ett video-ID (eller en hel YouTube-url). */
export const openYouTubeOverlay = (urlOrId: string, title?: string): boolean => {
  const videoId = ID_PATTERN.test(urlOrId) ? urlOrId : extractYouTubeId(urlOrId);
  if (!videoId) return false;
  window.dispatchEvent(
    new CustomEvent(YOUTUBE_OPEN_EVENT, { detail: { videoId, title } }),
  );
  return true;
};
