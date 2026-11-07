import { useState } from "react";
import { Calculator, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { hideIntroForever, shouldShowIntro } from "@/lib/procentIntro";

const STEPS = [
  { icon: Target, text: "Välj vad du vill öva på." },
  { icon: Calculator, text: "När du klarat tre banor får du ha miniräknare." },
  { icon: Trophy, text: "Många rätt i rad tar dig in på topplistan." },
];

/** Kort instruktion som poppar upp varje gång tills eleven kryssar i "Visa inte igen". */
const ProcentIntro = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(() => shouldShowIntro(localStorage, user?.id));
  const [never, setNever] = useState(false);

  const close = () => {
    if (never) hideIntroForever(localStorage, user?.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="exercise-light font-nunito max-w-sm rounded-3xl border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl">Så här funkar det</DialogTitle>
          <DialogDescription className="sr-only">Kort instruktion till procentträningen</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold"><span className="mr-1 text-muted-foreground">{i + 1}.</span>{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-2 flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={never} onCheckedChange={(v) => setNever(v === true)} aria-label="Visa inte igen" />
            Visa inte igen
          </label>
          <Button onClick={close} className="rounded-2xl px-5 font-bold">Kör!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcentIntro;
