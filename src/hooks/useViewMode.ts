import { useCallback, useEffect, useState } from "react";

export type ViewMode = "auto" | "mobile" | "desktop";

const STORAGE_KEY = "mattebo-view-mode";
const EVENT = "mattebo-view-mode-change";

const read = (): ViewMode => {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "mobile" || v === "desktop" ? v : "auto";
};

/**
 * Lets the user override the responsive layout (handy on iPad where the
 * mobile view is sometimes nicer than the tablet grid).
 */
export const useViewMode = () => {
  const [mode, setModeState] = useState<ViewMode>(read);

  useEffect(() => {
    const sync = () => setModeState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = useCallback((next: ViewMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const cycle = useCallback(() => {
    setMode(mode === "auto" ? "mobile" : mode === "mobile" ? "desktop" : "auto");
  }, [mode, setMode]);

  return { mode, setMode, cycle };
};
