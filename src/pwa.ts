import { registerSW } from "virtual:pwa-register";

// Tvinga fram ny version direkt (iOS Safari/PWA fastnar annars i gammal cache).
let reloading = false;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    // Leta efter ny version vid start, vid fokus och en gång i timmen.
    const check = () => {
      if (document.visibilityState === "visible") registration.update();
    };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.setInterval(check, 60 * 60 * 1000);
  },
});
