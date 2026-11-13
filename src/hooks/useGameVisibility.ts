import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VisibilityRow } from "@/lib/gameVisibility";

const EVENT = "mattebo:game-visibility";

/** Loads the teacher's game on/off choices, optionally for one class. Refetches when the admin matrix saves. */
export function useGameVisibility(grade?: number | null) {
  const [rows, setRows] = useState<VisibilityRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    let q = supabase.from("game_visibility").select("grade, chapter, game_key, enabled");
    if (grade) q = q.eq("grade", grade);
    const { data } = await q;
    setRows((data as VisibilityRow[]) ?? []);
    setLoaded(true);
  }, [grade]);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, [load]);

  return { rows, setRows, loaded, reload: load };
}

export const notifyGameVisibilityChanged = () => window.dispatchEvent(new Event(EVENT));
