import { useCallback, useEffect, useState } from "react";

const PREFIX = "mattebo-section-";
export const OPEN_SECTION_EVENT = "mattebo-open-section";

const readStored = (name: string): boolean | null => {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(PREFIX + name);
  return v === "1" ? true : v === "0" ? false : null;
};

/** Open/closed state per section, remembered per device. Falls back to `defaultOpen` until the user toggles. */
export const useSectionOpen = (name: string, defaultOpen: boolean) => {
  const [stored, setStored] = useState<boolean | null>(() => readStored(name));

  const setOpen = useCallback(
    (next: boolean) => {
      window.localStorage.setItem(PREFIX + name, next ? "1" : "0");
      setStored(next);
    },
    [name],
  );

  // The mobile bottom nav asks a section to open before scrolling to it.
  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail === name) setOpen(true);
    };
    window.addEventListener(OPEN_SECTION_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SECTION_EVENT, onOpen);
  }, [name, setOpen]);

  return [stored ?? defaultOpen, setOpen] as const;
};

/** True when the wide (two-column) layout is shown. */
export const useIsWideLayout = (forced: "auto" | "mobile" | "desktop") => {
  const query = "(min-width: 1024px)";
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  if (forced === "mobile") return false;
  if (forced === "desktop") return true;
  return matches;
};
