import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FileUp, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SLIDES_PREFIX = "https://docs.google.com/presentation/";
const BUCKET = "class-presentations";
const MAX_BYTES = 25 * 1024 * 1024;

interface Props {
  grade: number;
  children: ReactNode;
}

interface Presentation {
  url: string;
  file_path: string | null;
  file_name: string | null;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/**
 * Shows an uploaded HTML slideshow in a new tab. The file runs inside a
 * sandboxed frame without same-origin access, so its scripts can never reach
 * the signed-in Mattebo session.
 */
const showHtmlInWindow = (win: Window, html: string, title: string) => {
  const doc = win.document;
  doc.open();
  doc.write(
    `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
      `<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%;display:block}</style>` +
      `</head><body><iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals" allow="fullscreen; autoplay"></iframe></body></html>`,
  );
  doc.close();
  const frame = doc.querySelector("iframe");
  if (!frame) return;
  frame.addEventListener("load", () => frame.focus());
  frame.srcdoc = html;
};

/**
 * Admin-only: clicking the "Åk" word opens the class's presentation — either a
 * Google Slides link or an uploaded HTML slideshow. Both live behind admin-only
 * access rules, so students never see them.
 */
const ClassPresentationLink = ({ grade, children }: Props) => {
  const { toast } = useToast();
  const [current, setCurrent] = useState<Presentation | null>(null);
  const [editing, setEditing] = useState(false);
  const [slidesInput, setSlidesInput] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("class_presentations")
      .select("url, file_path, file_name")
      .eq("grade", grade)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCurrent(data ?? null);
      });
    return () => {
      active = false;
    };
  }, [grade]);

  const startEdit = () => {
    setSlidesInput(current?.url ?? "");
    setEditing(true);
  };

  const removeOldFile = async (oldPath: string | null | undefined, keep?: string) => {
    if (oldPath && oldPath !== keep) await supabase.storage.from(BUCKET).remove([oldPath]);
  };

  const saveSlides = async () => {
    const next = slidesInput.trim();
    if (!next.startsWith(SLIDES_PREFIX)) {
      return toast({
        title: "Det ser inte ut som en Google Slides-länk",
        description: "Länken ska börja med https://docs.google.com/presentation/ – eller ladda upp en HTML-fil i stället.",
        variant: "destructive",
      });
    }
    setBusy(true);
    const { error } = await supabase
      .from("class_presentations")
      .upsert({ grade, url: next, file_path: null, file_name: null, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return toast({ title: "Kunde inte spara länken", variant: "destructive" });
    await removeOldFile(current?.file_path);
    setCurrent({ url: next, file_path: null, file_name: null });
    setEditing(false);
    toast({ title: `Presentationen för Åk ${grade} är sparad`, description: 'Klicka på "Åk" för att öppna den.' });
  };

  const uploadHtml = async (file: File) => {
    if (!/\.html?$/i.test(file.name)) {
      return toast({ title: "Välj en HTML-fil", description: "Filen ska sluta på .html", variant: "destructive" });
    }
    if (file.size > MAX_BYTES) {
      return toast({ title: "Filen är för stor", description: "Max 25 MB.", variant: "destructive" });
    }
    setBusy(true);
    const path = `ak${grade}/${Date.now()}.html`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: "text/html", upsert: false });
    if (upErr) {
      setBusy(false);
      return toast({ title: "Kunde inte ladda upp filen", variant: "destructive" });
    }
    const { error } = await supabase
      .from("class_presentations")
      .upsert({ grade, url: "", file_path: path, file_name: file.name, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      return toast({ title: "Kunde inte spara presentationen", variant: "destructive" });
    }
    await removeOldFile(current?.file_path, path);
    setCurrent({ url: "", file_path: path, file_name: file.name });
    setEditing(false);
    toast({ title: `${file.name} är sparad för Åk ${grade}`, description: 'Klicka på "Åk" för att visa bildspelet.' });
  };

  const remove = async () => {
    setBusy(true);
    const { error } = await supabase.from("class_presentations").delete().eq("grade", grade);
    setBusy(false);
    if (error) return toast({ title: "Kunde inte ta bort presentationen", variant: "destructive" });
    await removeOldFile(current?.file_path);
    setCurrent(null);
    setEditing(false);
    toast({ title: `Presentationen för Åk ${grade} är borttagen` });
  };

  const open = async () => {
    if (current?.file_path) {
      // Open synchronously inside the click so the browser doesn't block the tab.
      const win = window.open("", "_blank");
      if (!win) return toast({ title: "Webbläsaren stoppade fliken", description: "Tillåt popup-fönster för Mattebo.", variant: "destructive" });
      win.document.title = "Laddar…";
      const { data, error } = await supabase.storage.from(BUCKET).download(current.file_path);
      if (error || !data) {
        win.close();
        return toast({ title: "Kunde inte öppna bildspelet", variant: "destructive" });
      }
      showHtmlInWindow(win, await data.text(), current.file_name?.replace(/\.html?$/i, "") || `Åk ${grade}`);
      return;
    }
    if (current?.url) window.open(current.url, "_blank", "noopener,noreferrer");
    else startEdit();
  };

  const hasTarget = Boolean(current?.file_path || current?.url);

  return (
    <span className="relative inline-flex items-start">
      <button
        type="button"
        onClick={() => void open()}
        title={hasTarget ? `Öppna presentationen för Åk ${grade}` : `Lägg till presentation för Åk ${grade}`}
        className="cursor-pointer rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ font: "inherit", color: "inherit", letterSpacing: "inherit" }}
      >
        {children}
      </button>
      <button
        type="button"
        onClick={startEdit}
        aria-label={`Byt presentation för Åk ${grade}`}
        title="Byt presentation"
        className="ml-0.5 mt-0.5 rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
      </button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-md font-manrope">
          <DialogHeader>
            <DialogTitle>Presentation för Åk {grade}</DialogTitle>
            <DialogDescription>
              {current?.file_name
                ? `Nu: ${current.file_name}`
                : current?.url
                  ? "Nu: Google Slides-länk"
                  : "Ingen presentation än."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-semibold">HTML-bildspel (t.ex. från Gemini)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadHtml(file);
              }}
            />
            <Button type="button" className="w-full gap-2" disabled={busy} onClick={() => fileRef.current?.click()}>
              <FileUp className="h-4 w-4" /> Ladda upp HTML-fil
            </Button>
            <p className="text-xs text-muted-foreground">
              Bilder måste ligga inbakade i filen – bilder som bara finns i en mapp på datorn följer inte med.
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-semibold">…eller en Google Slides-länk</p>
            <div className="flex gap-2">
              <Input
                value={slidesInput}
                onChange={(e) => setSlidesInput(e.target.value)}
                placeholder="https://docs.google.com/presentation/…"
              />
              <Button type="button" variant="secondary" disabled={busy || !slidesInput.trim()} onClick={() => void saveSlides()}>
                Spara
              </Button>
            </div>
          </div>

          {hasTarget && (
            <Button type="button" variant="ghost" className="gap-2 text-destructive" disabled={busy} onClick={() => void remove()}>
              <Trash2 className="h-4 w-4" /> Ta bort presentationen
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </span>
  );
};

export default ClassPresentationLink;
