import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  content: string;
  expiresOn: string | null;
  updatedAt: string;
}

/** One announcement row per grade. */
export const useAnnouncement = (grade: number) => {
  const [data, setData] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: row } = await supabase
      .from("announcements")
      .select("content, expires_on, updated_at")
      .eq("grade", grade)
      .maybeSingle();
    setData(row ? { content: row.content, expiresOn: row.expires_on, updatedAt: row.updated_at } : null);
    setLoading(false);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (content: string, expiresOn: string | null) => {
      const { error } = await supabase
        .from("announcements")
        .upsert({ grade, content, expires_on: expiresOn, updated_at: new Date().toISOString() }, { onConflict: "grade" });
      if (error) throw error;
      await load();
    },
    [grade, load],
  );

  return { announcement: data, loading, save };
};
