import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";

/** Nästa lektion är dold för elever som standard; läraren ser den alltid och kan slå på den per årskurs. */
const PostItVisibilityGate = ({ grade, children }: { grade: number; children: ReactNode }) => {
  const { isAdmin } = useAuth();
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      supabase.from("postit_visibility").select("visible").eq("grade", grade).maybeSingle()
        .then(({ data }) => alive && setVisible(!!data?.visible));
    load();
    const ch = supabase.channel(`postit-vis-${grade}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "postit_visibility", filter: `grade=eq.${grade}` }, load)
      .subscribe();
    window.addEventListener("focus", load);
    return () => { alive = false; supabase.removeChannel(ch); window.removeEventListener("focus", load); };
  }, [grade]);

  const toggle = async () => {
    const next = !visible;
    setVisible(next);
    const { error } = await supabase.from("postit_visibility")
      .upsert({ grade, visible: next, updated_at: new Date().toISOString() });
    if (error) setVisible(!next);
  };

  if (!isAdmin) return visible ? <>{children}</> : null;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={visible === null}
        aria-pressed={!!visible}
        className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          visible ? "border-primary bg-primary/20 text-foreground" : "border-border bg-muted/40 text-muted-foreground"
        }`}
      >
        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        {visible ? "Synlig för elever – klicka för att dölja" : "Dold för elever – klicka för att visa"}
      </button>
      <div className={visible ? "" : "opacity-75"}>{children}</div>
    </div>
  );
};
export default PostItVisibilityGate;
