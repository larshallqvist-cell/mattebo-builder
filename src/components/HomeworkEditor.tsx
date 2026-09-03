import { useEffect, useState } from "react";
import { SUPPORTED_GRADES } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHomework, DEFAULT_HOMEWORK_TITLE } from "@/hooks/useHomework";

const MAX_LENGTH = 1000;

const HomeworkEditor = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState<number>(SUPPORTED_GRADES[0]);
  const { title, content, loading, saveHomework } = useHomework(grade);
  const [draftTitle, setDraftTitle] = useState(DEFAULT_HOMEWORK_TITLE);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftTitle(title);
    setDraft(content);
  }, [title, content, grade]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveHomework(draftTitle, draft.slice(0, MAX_LENGTH));
      toast({ title: "Sparat!", description: "Läxrutan är uppdaterad." });
    } catch (err) {
      toast({
        title: "Kunde inte spara",
        description: (err as { message?: string })?.message ?? "Okänt fel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <p className="text-sm text-muted-foreground">Läxrutan visas högst upp på årskurssidan.</p>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_GRADES.map((g) => (
            <Button key={g} size="sm" variant={g === grade ? "default" : "outline"} onClick={() => setGrade(g)}>
              Åk {g}
            </Button>
          ))}
        </div>

        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder={DEFAULT_HOMEWORK_TITLE}
          maxLength={80}
        />

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={5}
          disabled={loading}
          placeholder={"Räkna s. 42–44\nTa med linjal"}
          className="font-body text-sm whitespace-pre-wrap"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {draft.length}/{MAX_LENGTH} tecken · radbyten visas som de skrivs · länkar skrivs som https://… eller [text](https://…) · Töm fältet för att dölja rutan.
          </span>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Spara
          </Button>
        </div>
    </div>
  );
};

export default HomeworkEditor;
