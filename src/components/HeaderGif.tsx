import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const BUCKET = "header-gif";

/** 2×2 cm box left of the class headline; one GIF shared by all class pages, admin uploads by clicking. */
const HeaderGif = () => {
  const { isAdmin } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.storage.from(BUCKET).list("", { sortBy: { column: "created_at", order: "desc" }, limit: 1 });
    const file = data?.find((f) => f.name && !f.name.startsWith("."));
    if (!file) return setUrl(null);
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(file.name, 60 * 60 * 24);
    setUrl(signed?.signedUrl ?? null);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Välj en bildfil (GIF).");
    setBusy(true);
    const { data: old } = await supabase.storage.from(BUCKET).list("");
    const name = `gif-${Date.now()}.${file.name.split(".").pop() || "gif"}`;
    const { error } = await supabase.storage.from(BUCKET).upload(name, file, { contentType: file.type });
    if (error) { setBusy(false); return toast.error("Kunde inte ladda upp bilden."); }
    const stale = (old ?? []).map((f) => f.name).filter((n) => n && n !== name);
    if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
    await load();
    setBusy(false);
    toast.success("GIF:en är uppdaterad.");
  };

  if (!url && !isAdmin) return null;

  return (
    <button
      type="button"
      disabled={!isAdmin || busy}
      onClick={() => inputRef.current?.click()}
      title={isAdmin ? "Byt GIF" : undefined}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-secondary/40 text-muted-foreground disabled:cursor-default"
      style={{ width: "2cm", height: "2cm" }}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
      {isAdmin && (
        <input ref={inputRef} type="file" accept="image/gif,image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      )}
    </button>
  );
};

export default HeaderGif;
