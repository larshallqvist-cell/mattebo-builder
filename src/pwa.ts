import { registerSW } from "virtual:pwa-register";
import { APP_VERSION } from "@/lib/version";

// Tvinga fram ny version direkt (iOS Safari/PWA fastnar annars i gammal cache).
let reloading = false;

const hardReload = () => {
  if (reloading) return;
  reloading = true;
  window.location.reload();
};

/**
 * iOS-räddning: om appen startar med en annan version än den senast sedda,
 * töm alla caches och avregistrera gamla service workers en gång.
 */
const purgeStaleCaches = async () => {
  const KEY = "mattebo-app-version";
  let seen: string | null = null;
  try {
    seen = window.localStorage.getItem(KEY);
  } catch {
    return;
  }
  if (seen === APP_VERSION) return;

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.includes("google-fonts") && !k.includes("gstatic"))
          .map((k) => caches.delete(k)),
      );
    }
  } catch {
    /* ignore */
  }

  try {
    window.localStorage.setItem(KEY, APP_VERSION);
  } catch {
    /* ignore */
  }

  if (seen !== null) hardReload();
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", hardReload);
}

void purgeStaleCaches();

/**
 * Självläkning vid trasiga kodbitar: om en dynamisk import misslyckas
 * (t.ex. för att en ny version ersatt de gamla filerna medan sidan var öppen)
 * laddas sidan om en gång för att hämta färsk kod. Vakten i sessionStorage
 * hindrar oändliga omladdningsloopar om felet kvarstår.
 */
const CHUNK_RELOAD_KEY = "mattebo-chunk-reload";

const reloadOnceForStaleChunks = () => {
  try {
    if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    // Tillåt ett nytt försök om sidan lever vidare en stund efter omladdningen.
    window.setTimeout(() => window.sessionStorage.removeItem(CHUNK_RELOAD_KEY), 60_000);
  } catch {
    /* ignore */
  }
  hardReload();
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadOnceForStaleChunks();
});

// Safari rapporterar samma fel som ett avvisat löfte utan vite-händelsen.
window.addEventListener("unhandledrejection", (event) => {
  const msg = String(event.reason?.message ?? event.reason ?? "");
  if (/importing a module script failed|failed to fetch dynamically imported module|error loading dynamically imported module/i.test(msg)) {
    reloadOnceForStaleChunks();
  }
});

/**
 * Manuell escape-hatch för fastnad iOS/PWA-cache.
 * Avregistrerar service workers, tömmer alla cache-poster (förutom Google-fonts),
 * rensar versionsnyckeln och laddar om siden hårt.
 */
export async function forceAppUpdate() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.includes("google-fonts") && !k.includes("gstatic"))
          .map((k) => caches.delete(k)),
      );
    }
  } catch {
    /* ignore */
  }

  try {
    window.localStorage.removeItem("mattebo-app-version");
  } catch {
    /* ignore */
  }

  window.location.reload();
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    // Leta efter ny version vid start, vid fokus och var 5:e minut.
    const check = () => {
      if (document.visibilityState === "visible") registration.update();
    };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.setInterval(check, 5 * 60 * 1000);
  },
});
