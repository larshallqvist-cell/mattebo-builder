import { useEffect, useRef, useState } from "react";
import { SUPPORTED_GRADES } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnnouncement, type AnnouncementSize } from "@/hooks/useAnnouncement";

const SIZES: { id: AnnouncementSize; label: string }[] = [
  { id: "small", label: "Liten" },
  { id: "medium", label: "Mellan" },
  { id: "large", label: "Stor" },
];
const COLORS: { tag: string; hex: string }[] = [
  { tag: "gul", hex: "#ca8a04" }, { tag: "röd", hex: "#e02424" }, { tag: "grön", hex: "#15803d" },
  { tag: "blå", hex: "#1d4ed8" }, { tag: "orange", hex: "#ea580c" }, { tag: "lila", hex: "#7c3aed" },
];
import { parseLessonContent, sanitizeLessonText } from "@/lib/lessonContent";
import "@/styles/announcement-flash.css";

const MAX_LENGTH = 400;

const AnnouncementEditor = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState<number>(SUPPORTED_GRADES[0]);
  const { announcement, loading, save } = useAnnouncement(grade);
  const [draft, setDraft] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);
  const [size, setSize] = useState<AnnouncementSize>("medium");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const wrapColor = (tag: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const inner = draft.slice(a, b) || "text";
    const next = `${draft.slice(0, a)}{${tag}}${inner}{/}${draft.slice(b)}`;
    setDraft(next.slice(0, MAX_LENGTH));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(a + tag.length + 2, a + tag.length + 2 + inner.length); });
  };

  useEffect(() => {
    setDraft(announcement?.content ?? "");
    setExpires(announcement?.expiresOn ?? "");
    setSize(announcement?.size ?? "medium");
  }, [announcement, grade]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(draft.slice(0, MAX_LENGTH), expires || null, size);
      toast({ title: "Sparat!", description: draft.trim() ? `Anslaget för Åk ${grade} visas vid nästa besök.` : "Anslaget är borttaget." });
    } catch (err) {
      toast({ title: "Kunde inte spara", description: (err as { message?: string })?.message ?? "Okänt fel", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <p className="text-sm text-muted-foreground">
        Anslaget dyker upp en gång per dag när eleven öppnar klassidan. Ändrar du texten visas det igen samma dag.
      </p>
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_GRADES.map((g) => (
          <Button key={g} size="sm" variant={g === grade ? "default" : "outline"} onClick={() => setGrade(g)}>
            Åk {g}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Storlek:</span>
        {SIZES.map((o) => (
          <Button key={o.id} size="sm" variant={size === o.id ? "default" : "outline"} onClick={() => setSize(o.id)}>{o.label}</Button>
        ))}
        <span className="ml-3 text-muted-foreground">Färg på markerad text:</span>
        {COLORS.map((c) => (
          <button key={c.tag} type="button" onClick={() => wrapColor(c.tag)} aria-label={c.tag} title={c.tag}
            className="h-7 w-7 rounded-full border-2 border-border" style={{ backgroundColor: c.hex }} />
        ))}
      </div>
      <Textarea
        ref={taRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        disabled={loading}
        placeholder={"## Nationellt prov\nGlöm inte {röd}miniräknare{/} på tisdag!"}
        className="font-body text-sm"
      />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="ann-exp" className="text-muted-foreground">Visa till och med:</label>
        <Input id="ann-exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="w-44" />
        {expires && <Button size="sm" variant="ghost" onClick={() => setExpires("")}>Inget slutdatum</Button>}
      </div>
      {draft.trim() && (
        <div data-size={size} className="flash-card mx-auto rounded-[1.75rem] border border-accent/40 bg-card px-4 pb-5 pt-4" lang="sv">
          <div className="flash-body flex flex-1 flex-col justify-center py-4 text-center font-bold">
            {parseLessonContent(sanitizeLessonText(draft))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {draft.length}/{MAX_LENGTH} tecken · samma format som "Nästa lektion" · töm fältet för att stänga av.
        </span>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Spara
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementEditor;
