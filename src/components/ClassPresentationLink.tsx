import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SLIDES_PREFIX = "https://docs.google.com/presentation/";

interface Props {
  grade: number;
  children: ReactNode;
}

/**
 * Admin-only: clicking the "Åk" word opens the class's Google Slides deck.
 * The link lives in an admin-only table, so students never see it.
 */
const ClassPresentationLink = ({ grade, children }: Props) => {
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("class_presentations")
      .select("url")
      .eq("grade", grade)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setUrl(data?.url ?? null);
      });
    return () => {
      active = false;
    };
  }, [grade]);

  const editLink = async () => {
    const input = window.prompt(
      `Klistra in länken till presentationen för Åk ${grade} (Google Slides). Lämna tomt för att ta bort.`,
      url ?? "",
    );
    if (input === null) return;
    const next = input.trim();
    if (!next) {
      const { error } = await supabase.from("class_presentations").delete().eq("grade", grade);
      if (error) return toast({ title: "Kunde inte ta bort länken", variant: "destructive" });
      setUrl(null);
      return toast({ title: `Länken för Åk ${grade} är borttagen` });
    }
    if (!next.startsWith(SLIDES_PREFIX)) {
      return toast({ title: "Det ser inte ut som en Google Slides-länk", description: "Länken ska börja med https://docs.google.com/presentation/", variant: "destructive" });
    }
    const { error } = await supabase
      .from("class_presentations")
      .upsert({ grade, url: next, updated_at: new Date().toISOString() });
    if (error) return toast({ title: "Kunde inte spara länken", variant: "destructive" });
    setUrl(next);
    toast({ title: `Presentationen för Åk ${grade} är sparad`, description: "Klicka på \"Åk\" för att öppna den." });
  };

  const open = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else void editLink();
  };

  return (
    <span className="relative inline-flex items-start">
      <button
        type="button"
        onClick={open}
        title={url ? `Öppna presentationen för Åk ${grade}` : `Lägg till presentation för Åk ${grade}`}
        className="cursor-pointer rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ font: "inherit", color: "inherit", letterSpacing: "inherit" }}
      >
        {children}
      </button>
      <button
        type="button"
        onClick={editLink}
        aria-label={`Byt presentationslänk för Åk ${grade}`}
        title="Byt presentationslänk"
        className="ml-0.5 mt-0.5 rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </span>
  );
};

export default ClassPresentationLink;
