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
