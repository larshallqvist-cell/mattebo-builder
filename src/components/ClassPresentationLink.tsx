import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FileUp, Files, Pencil, Play, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChapterSections } from "@/hooks/useChapterSections";
import { parsePresentationFileName, sectionNumber } from "@/lib/presentations";
import { cn } from "@/lib/utils";
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
  chapter: number;
  children: ReactNode;
}

interface Presentation {
  url: string;
  file_path: string | null;
  file_name: string | null;
}

interface SectionFile {
  file_path: string;
  file_name: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

const isHtml = (f: File) => /\.html?$/i.test(f.name);

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
 * Admin-only: clicking the "Åk" word opens the slideshow for the highlighted
 * sub-chapter, falling back to the class-wide presentation (Google Slides link
 * or HTML file). Everything lives behind admin-only access rules.
 */
const ClassPresentationLink = ({ grade, chapter, children }: Props) => {
  const { toast } = useToast();
  const { sections, current } = useChapterSections(grade, chapter);
  const [classWide, setClassWide] = useState<Presentation | null>(null);
  const [sectionFiles, setSectionFiles] = useState<Map<number, SectionFile>>(new Map());
  const [editing, setEditing] = useState(false);
  const [slidesInput, setSlidesInput] = useState("");
  const [busy, setBusy] = useState(false);
  const classFileRef = useRef<HTMLInputElement>(null);
  const manyRef = useRef<HTMLInputElement>(null);
  const rowFileRef = useRef<HTMLInputElement>(null);
  const rowTarget = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("class_presentations")
      .select("url, file_path, file_name")
      .eq("grade", grade)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setClassWide(data ?? null);
      });
    return () => {
      active = false;
    };
  }, [grade]);

  const loadSections = useCallback(async () => {
    const { data } = await supabase
      .from("section_presentations")
      .select("section, file_path, file_name")
      .eq("grade", grade)
      .eq("chapter", chapter);
    setSectionFiles(new Map((data ?? []).map((r) => [r.section, { file_path: r.file_path, file_name: r.file_name }])));
  }, [grade, chapter]);

  useEffect(() => {
    setSectionFiles(new Map());
    void loadSections();
  }, [loadSections]);

  const activeNumber = current != null && sections[current] ? sectionNumber(sections[current], current, chapter) : null;
  const activeFile = activeNumber != null ? sectionFiles.get(activeNumber) : undefined;

  const startEdit = () => {
    setSlidesInput(classWide?.url ?? "");
    setEditing(true);
  };

  const removeFile = async (path: string | null | undefined, keep?: string) => {
    if (path && path !== keep) await supabase.storage.from(BUCKET).remove([path]);
  };

  /** Opens an uploaded HTML file; the tab opens inside the click so popup blockers allow it. */
  const openHtml = async (path: string, name: string | null) => {
    const win = window.open("", "_blank");
    if (!win) return toast({ title: "Webbläsaren stoppade fliken", description: "Tillåt popup-fönster för Mattebo.", variant: "destructive" });
    win.document.title = "Laddar…";
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      win.close();
      return toast({ title: "Kunde inte öppna bildspelet", variant: "destructive" });
    }
    showHtmlInWindow(win, await data.text(), name?.replace(/\.html?$/i, "") || `Åk ${grade}`);
  };

  // ---------- Sub-chapter slideshows ----------

  /** Uploads one file for a sub-chapter; returns false when something failed. */
  const putSectionFile = async (ch: number, section: number, file: File, oldPath?: string) => {
    const path = `ak${grade}/kap${ch}/${ch}.${section}-${Date.now()}.html`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "text/html", upsert: false });
    if (upErr) return false;
    const { error } = await supabase
      .from("section_presentations")
      .upsert({ grade, chapter: ch, section, file_path: path, file_name: file.name, updated_at: new Date().toISOString() });
    if (error) {
      await removeFile(path);
      return false;
    }
    await removeFile(oldPath, path);
    return true;
  };

  const existingPath = async (ch: number, section: number) => {
    if (ch === chapter) return sectionFiles.get(section)?.file_path;
    const { data } = await supabase
      .from("section_presentations")
      .select("file_path")
      .eq("grade", grade)
      .eq("chapter", ch)
      .eq("section", section)
      .maybeSingle();
    return data?.file_path;
  };

  const uploadForRow = async (section: number, file: File) => {
    if (!isHtml(file)) return toast({ title: "Välj en HTML-fil", variant: "destructive" });
    if (file.size > MAX_BYTES) return toast({ title: "Filen är för stor", description: "Max 25 MB.", variant: "destructive" });
    setBusy(true);
    const ok = await putSectionFile(chapter, section, file, sectionFiles.get(section)?.file_path);
    await loadSections();
    setBusy(false);
    toast(ok ? { title: `${file.name} är sparad för ${chapter}.${section}` } : { title: "Kunde inte spara filen", variant: "destructive" });
  };

  /** Several files at once, matched to sub-chapters by name ("ak6_kap2_5_procent.html" → 2.5). */
  const uploadMany = async (files: File[]) => {
    setBusy(true);
    const saved: string[] = [];
    const skipped: string[] = [];
    for (const file of files) {
      const match = isHtml(file) && file.size <= MAX_BYTES ? parsePresentationFileName(file.name, grade) : { error: "no-section" as const };
      if ("error" in match) {
        skipped.push(match.error === "wrong-grade" ? `${file.name} (annan årskurs)` : file.name);
        continue;
      }
      const ok = await putSectionFile(match.chapter, match.section, file, await existingPath(match.chapter, match.section));
      if (ok) saved.push(`${match.chapter}.${match.section}`);
      else skipped.push(file.name);
    }
    await loadSections();
    setBusy(false);
    toast({
      title: saved.length ? `${saved.length} genomgångar sparade (${saved.join(", ")})` : "Inga filer sparades",
      description: skipped.length ? `Hoppade över: ${skipped.join(", ")}. Filnamnet ska innehålla t.ex. kap2_5.` : undefined,
      variant: saved.length ? undefined : "destructive",
    });
  };

  const removeSection = async (section: number) => {
    const file = sectionFiles.get(section);
    setBusy(true);
    const { error } = await supabase
      .from("section_presentations")
      .delete()
      .eq("grade", grade)
      .eq("chapter", chapter)
      .eq("section", section);
    if (!error) await removeFile(file?.file_path);
    await loadSections();
    setBusy(false);
    if (error) toast({ title: "Kunde inte ta bort filen", variant: "destructive" });
  };

  // ---------- Class-wide fallback ----------

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
    await removeFile(classWide?.file_path);
    setClassWide({ url: next, file_path: null, file_name: null });
    toast({ title: `Klassens presentation för Åk ${grade} är sparad` });
  };

  const uploadClassHtml = async (file: File) => {
    if (!isHtml(file)) return toast({ title: "Välj en HTML-fil", description: "Filen ska sluta på .html", variant: "destructive" });
    if (file.size > MAX_BYTES) return toast({ title: "Filen är för stor", description: "Max 25 MB.", variant: "destructive" });
    setBusy(true);
    const path = `ak${grade}/${Date.now()}.html`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "text/html", upsert: false });
    if (upErr) {
      setBusy(false);
      return toast({ title: "Kunde inte ladda upp filen", variant: "destructive" });
    }
    const { error } = await supabase
      .from("class_presentations")
      .upsert({ grade, url: "", file_path: path, file_name: file.name, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) {
      await removeFile(path);
      return toast({ title: "Kunde inte spara presentationen", variant: "destructive" });
    }
    await removeFile(classWide?.file_path, path);
    setClassWide({ url: "", file_path: path, file_name: file.name });
    toast({ title: `${file.name} är sparad för hela Åk ${grade}` });
  };

  const removeClassWide = async () => {
    setBusy(true);
    const { error } = await supabase.from("class_presentations").delete().eq("grade", grade);
    setBusy(false);
    if (error) return toast({ title: "Kunde inte ta bort presentationen", variant: "destructive" });
    await removeFile(classWide?.file_path);
    setClassWide(null);
  };

  const openClassWide = () => {
    if (classWide?.file_path) return void openHtml(classWide.file_path, classWide.file_name);
    if (classWide?.url) window.open(classWide.url, "_blank", "noopener,noreferrer");
  };

  const open = () => {
    if (activeFile) return void openHtml(activeFile.file_path, activeFile.file_name);
    if (classWide?.file_path || classWide?.url) return openClassWide();
    startEdit();
  };

  const hasClassWide = Boolean(classWide?.file_path || classWide?.url);
  const openTitle = activeFile
    ? `Öppna genomgången för ${chapter}.${activeNumber}`
    : hasClassWide
      ? `Öppna klassens presentation för Åk ${grade}`
      : `Lägg till genomgångar för Åk ${grade}`;

  return (
    <span className="relative inline-flex items-start">
      <button
        type="button"
        onClick={open}
        title={openTitle}
        className="cursor-pointer rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ font: "inherit", color: "inherit", letterSpacing: "inherit" }}
      >
        {children}
      </button>
      <button
        type="button"
        onClick={startEdit}
        aria-label={`Genomgångar för Åk ${grade}`}
        title="Genomgångar"
        className="ml-0.5 mt-0.5 rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
      </button>

      <input
        ref={rowFileRef}
        type="file"
        accept=".html,.htm,text/html"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file && rowTarget.current != null) void uploadForRow(rowTarget.current, file);
        }}
      />
      <input
        ref={manyRef}
        type="file"
        multiple
        accept=".html,.htm,text/html"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void uploadMany(files);
        }}
      />
      <input
        ref={classFileRef}
        type="file"
        accept=".html,.htm,text/html"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadClassHtml(file);
        }}
      />

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto font-manrope">
          <DialogHeader>
            <DialogTitle>Genomgångar för Åk {grade}</DialogTitle>
            <DialogDescription>
              "Åk" öppnar genomgången för det markerade delkapitlet. Saknas den öppnas klassens presentation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Kapitel {chapter}</p>
              <Button type="button" size="sm" className="gap-1.5" disabled={busy} onClick={() => manyRef.current?.click()}>
                <Files className="h-4 w-4" /> Ladda upp flera
              </Button>
            </div>
            {sections.length === 0 ? (
              <p className="text-xs text-muted-foreground">Kapitlet har inga delkapitel än.</p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-lg border border-border/60" aria-label={`Delkapitel i kapitel ${chapter}`}>
                {sections.map((name, i) => {
                  const num = sectionNumber(name, i, chapter);
                  const file = sectionFiles.get(num);
                  return (
                    <li key={`${i}-${name}`} className={cn("flex items-center gap-2 px-2 py-1.5", i === current && "bg-accent/15")}>
                      <span className="min-w-0 flex-1 truncate text-sm" title={file?.file_name}>
                        {name}
                        {!file && <span className="ml-1 text-xs text-muted-foreground">– ingen fil</span>}
                      </span>
                      {file && (
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" title={`Öppna ${file.file_name}`} aria-label={`Öppna ${name}`} onClick={() => void openHtml(file.file_path, file.file_name)}>
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={busy}
                        title={file ? "Byt fil" : "Ladda upp fil"}
                        aria-label={`Ladda upp fil för ${name}`}
                        onClick={() => {
                          rowTarget.current = num;
                          rowFileRef.current?.click();
                        }}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                      {file && (
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={busy} title="Ta bort filen" aria-label={`Ta bort fil för ${name}`} onClick={() => void removeSection(num)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Med "Ladda upp flera" hamnar filerna rätt av sig själva om namnet innehåller t.ex. <code>kap2_5</code>. Bilder måste ligga inbakade i filerna.
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-semibold">Klassens presentation (reserv)</p>
            <p className="text-xs text-muted-foreground">
              {classWide?.file_name ? `Nu: ${classWide.file_name}` : classWide?.url ? "Nu: Google Slides-länk" : "Ingen än."}
            </p>
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
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => classFileRef.current?.click()}>
                <FileUp className="h-4 w-4" /> HTML-fil för hela klassen
              </Button>
              {hasClassWide && (
                <>
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={openClassWide}>
                    <Play className="h-4 w-4" /> Öppna
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-destructive" disabled={busy} onClick={() => void removeClassWide()}>
                    <Trash2 className="h-4 w-4" /> Ta bort
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </span>
  );
};

export default ClassPresentationLink;
