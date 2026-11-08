import { useState } from "react";
import { Calculator, Scissors, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  { icon: Target, text: "Välj vad du vill öva på – eller MIX." },
  { icon: Scissors, text: "Förkorta dina svar! Annars blir det halva poäng längre fram." },
  { icon: Calculator, text: "Miniräknaren halverar poängen på steg 1–3." },
  { icon: Trophy, text: "Poängen i din längsta svit tar dig in på topplistan." },
];
const key = (uid?: string) => `brak-intro-hidden-${uid ?? "anon"}`;

const BrakIntro = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(key(user?.id)) !== "1"; } catch { return true; } });
  const [never, setNever] = useState(false);
  const close = () => { if (never) try { localStorage.setItem(key(user?.id), "1"); } catch { /* ignoreras */ } setOpen(false); };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="exercise-light font-nunito max-w-sm rounded-3xl border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl">Så här funkar det</DialogTitle>
          <DialogDescription className="sr-only">Kort instruktion till bråkträningen</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Icon className="h-5 w-5" /></span>
              <span className="text-base font-semibold"><span className="mr-1 text-muted-foreground">{i + 1}.</span>{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-2 flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={never} onCheckedChange={(v) => setNever(v === true)} aria-label="Visa inte igen" />Visa inte igen
          </label>
          <Button onClick={close} className="rounded-2xl px-5 font-bold">Kör!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default BrakIntro;
