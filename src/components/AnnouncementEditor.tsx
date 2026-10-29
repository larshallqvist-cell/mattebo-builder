import { useEffect, useState } from "react";
import { SUPPORTED_GRADES } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnnouncement } from "@/hooks/useAnnouncement";
import { parseLessonContent, sanitizeLessonText } from "@/lib/lessonContent";

const MAX_LENGTH = 400;

const AnnouncementEditor = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState<number>(SUPPORTED_GRADES[0]);
  const { announcement, loading, save } = useAnnouncement(grade);
  const [draft, setDraft] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(announcement?.content ?? "");
    setExpires(announcement?.expiresOn ?? "");
  }, [announcement, grade]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(draft.slice(0, MAX_LENGTH), expires || null);
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
      <Textarea
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
        <div className="rounded-2xl border border-accent/40 bg-card p-4">
          {parseLessonContent(sanitizeLessonText(draft))}
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
