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

export const YOUTUBE_ROOT_ID = "mattebo-youtube-root";

/**
 * Hämtar (eller skapar) den permanenta portal-containern.
 * Den ligger alltid i DOM:en så att requestFullscreen() kan anropas
 * synkront i samma användarinteraktion som klicket.
 */
export const getYouTubeRoot = (): HTMLElement => {
  let root = document.getElementById(YOUTUBE_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = YOUTUBE_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
};

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitEnterFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

/** Försöker gå i äkta fullscreen. Misslyckas tyst om det inte stöds/nekas. */
export const tryRequestFullscreen = (el: HTMLElement): void => {
  const target = el as FsElement;
  try {
    const req =
      target.requestFullscreen?.bind(target) ??
      target.webkitRequestFullscreen?.bind(target) ??
      target.msRequestFullscreen?.bind(target);
    if (!req) return;
    const result = req() as Promise<void> | void;
    if (result && typeof (result as Promise<void>).catch === "function") {
      (result as Promise<void>).catch(() => {
        /* fallback: vanlig overlay */
      });
    }
  } catch {
    /* fallback: vanlig overlay */
  }
};

/** Öppnar helskärmsoverlayen för ett video-ID (eller en hel YouTube-url). */
export const openYouTubeOverlay = (urlOrId: string, title?: string): boolean => {
  const videoId = ID_PATTERN.test(urlOrId) ? urlOrId : extractYouTubeId(urlOrId);
  if (!videoId) return false;

  // Måste ske synkront i klick-handlern för att webbläsaren ska godkänna det.
  tryRequestFullscreen(getYouTubeRoot());

  window.dispatchEvent(
    new CustomEvent(YOUTUBE_OPEN_EVENT, { detail: { videoId, title } }),
  );
  return true;
};
