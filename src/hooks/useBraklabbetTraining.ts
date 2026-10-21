import { useEffect, type RefObject } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseTrainingMessage } from "@/lib/braklabbetTraining";

export function useBraklabbetTraining(userId: string | null, frameRef: RefObject<HTMLIFrameElement>, enabled: boolean) {
  useEffect(() => {
    if (!userId || !enabled) return;
    let cancelled = false;
    const inFlight = new Set<string>();
    const onMessage = async (event: MessageEvent) => {
      const frame = frameRef.current?.contentWindow;
      if (!frame || event.source !== frame || event.origin !== "null") return;
      const input = parseTrainingMessage(event.data);
      if (!input) return;
      const send = (data: unknown) => {
        if (!cancelled && frame === frameRef.current?.contentWindow) frame.postMessage(data, "*");
      };
      if (input === "ready") {
        const { data, error } = await supabase.from("braklabbet_attempts")
          .select("id,exercise_id,answer,is_correct,attempt_number,hint_used,answered_at")
          .eq("user_id", userId).order("answered_at", { ascending: true });
        send(error ? { type: "braklabbet:training-load-error" } : { type: "braklabbet:training-results", rows: data ?? [] });
        return;
      }
      if (inFlight.has(input.request_id)) return;
      inFlight.add(input.request_id);
      try {
        const { data, error } = await supabase.functions.invoke("braklabbet-answer", { body: input });
        send(error || !data?.row ? { type: "braklabbet:training-save-error", request_id: input.request_id }
          : { type: "braklabbet:training-saved", request_id: input.request_id, row: data.row });
      } catch {
        send({ type: "braklabbet:training-save-error", request_id: input.request_id });
      } finally { inFlight.delete(input.request_id); }
    };
    window.addEventListener("message", onMessage);
    return () => { cancelled = true; window.removeEventListener("message", onMessage); };
  }, [userId, frameRef, enabled]);
}