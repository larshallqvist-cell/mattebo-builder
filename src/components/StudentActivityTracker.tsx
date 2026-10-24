import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { activeElapsed, PAGE_LABELS, VISIT_GAP_MS, resumeVisit } from "@/lib/studentActivity";

type SavedVisit = { userId: string; visitId: string; lastSeen: number };
const KEY = "mattebo_activity_visit";

/** No input content, audio or external browsing is captured. Admin activity is excluded. */
export default function StudentActivityTracker() {
  const { user, accessStatus, isAdmin } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!user || isAdmin || accessStatus !== "approved" || !PAGE_LABELS[pathname]) return;
    const userId = user.id;
    let saved: SavedVisit | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null"); } catch { /* storage may be disabled */ }
    let visitId = resumeVisit(saved, userId, Date.now(), crypto.randomUUID());
    let rowId = crypto.randomUUID();
    let seconds = 0;
    let previous = Date.now();
    let lastInput = previous;
    let lastActive = previous;
    let foreground = document.visibilityState === "visible" && document.hasFocus();
    let pending = false;
    let dirty = true;
    let stopped = false;
    let finalQueued = false;
    const owner = crypto.randomUUID();
    const leaseKey = `mattebo_activity_foreground_${userId}`;
    const ownsForeground = (now: number) => {
      try {
        const lease = JSON.parse(localStorage.getItem(leaseKey) ?? "null");
        if (lease && lease.owner !== owner && now - lease.at < 10_000) return false;
        localStorage.setItem(leaseKey, JSON.stringify({ owner, at: now }));
      } catch { /* fall back to document focus */ }
      return true;
    };
    const remember = () => {
      try { sessionStorage.setItem(KEY, JSON.stringify({ userId, visitId, lastSeen: lastActive })); } catch { /* optional */ }
    };
    const save = async () => {
      if (pending) { if (stopped) finalQueued = true; return; }
      if (!dirty) return;
      pending = true; dirty = false;
      const snapshot = { p_id: rowId, p_visit_id: visitId, p_path: pathname, p_active_seconds: Math.min(28800, Math.floor(seconds)) };
      try {
        const { error } = await supabase.rpc("record_student_visit", snapshot);
        if (error) dirty = true;
      } catch { dirty = true; }
      finally {
        pending = false;
        if (finalQueued) { finalQueued = false; void save(); }
      }
    };
    const sample = () => {
      const now = Date.now();
      const elapsed = activeElapsed(previous, now, lastInput, foreground && ownsForeground(now));
      if (elapsed > 0) {
        seconds += elapsed / 1000; dirty = true; lastActive = Math.min(now, lastInput + 60_000); remember();
      }
      previous = now;
    };
    const interact = () => {
      sample();
      const now = Date.now();
      if (now - lastActive >= VISIT_GAP_MS) {
        void save(); visitId = crypto.randomUUID(); rowId = crypto.randomUUID(); seconds = 0; dirty = true;
      }
      lastInput = now; lastActive = now; remember();
    };
    const visibility = () => {
      sample(); foreground = document.visibilityState === "visible" && document.hasFocus();
      if (foreground) interact(); else void save();
    };
    const pagehide = () => { sample(); void save(); };
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, interact, { passive: true }));
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", visibility); window.addEventListener("blur", visibility);
    window.addEventListener("pagehide", pagehide);
    remember(); void save();
    const timer = window.setInterval(sample, 5_000);
    const writer = window.setInterval(() => { void save(); }, 30_000);
    return () => {
      sample(); stopped = true; void save();
      window.clearInterval(timer); window.clearInterval(writer);
      events.forEach((event) => window.removeEventListener(event, interact));
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", visibility); window.removeEventListener("blur", visibility);
      window.removeEventListener("pagehide", pagehide);
      try {
        const lease = JSON.parse(localStorage.getItem(leaseKey) ?? "null");
        if (lease?.owner === owner) localStorage.removeItem(leaseKey);
      } catch { /* optional */ }
    };
  }, [user?.id, accessStatus, isAdmin, pathname]);
  return null;
}