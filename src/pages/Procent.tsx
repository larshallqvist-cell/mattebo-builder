import { useEffect, useState } from "react";
import PercentTriangle from "@/components/procent/PercentTriangle";
import FactorBar from "@/components/procent/FactorBar";
import StreakDrill, { type DrillConfig } from "@/components/procent/StreakDrill";
import { cn } from "@/lib/utils";
import {
  checkFactorDrill, checkTriangle, drillMarked, drillShowsDecimal, drillTip, explainFactorDrill, explainTriangle,
  factorTip, generateDrill, generateFactorDrill,
  type FactorFocus, type FactorTask, type Focus, type TriangleTask,
} from "@/lib/procent";

const TRIANGLE: DrillConfig<TriangleTask, Focus> = {
  mode: "mangd",
  initialFocus: "mix",
  focusLabel: { mix: "MIX", delen: "Sök delen", andel: "Sök andelen", hela: "Sök det hela" },
  generate: (f, t, prev) => generateDrill(f, t, Math.random, prev),
  check: checkTriangle,
  explain: explainTriangle,
  tip: drillTip,
  placeholder: (t) => (t.kind === "andel" ? "t.ex. 25" : "Ditt svar"),
  visual: ({ task, tier, solved, focus, choose }) => (
    <PercentTriangle task={task} marked={drillMarked(tier)} showDecimal={drillShowsDecimal(tier)} solved={solved} focus={focus} onFocus={choose} />
  ),
};

const FACTOR: DrillConfig<FactorTask, FactorFocus> = {
  mode: "faktormangd",
  initialFocus: "mix",
  focusLabel: { mix: "MIX", faktor: "Sök faktorn", nytt: "Sök nya värdet", procent: "Sök förändringen" },
  generate: (f, t, prev) => generateFactorDrill(f, t, Math.random, prev),
  check: checkFactorDrill,
  explain: explainFactorDrill,
  tip: factorTip,
  placeholder: (t) => (t.kind === "faktor" ? "t.ex. 1,25" : t.kind === "procent" ? "t.ex. 15" : "Ditt svar"),
  visual: ({ task, tier, solved, focus, choose }) => (
    <FactorBar task={task} marked={drillMarked(tier)} solved={solved} focus={focus} onFocus={choose} />
  ),
};

type Area = "triangel" | "faktor";
const AREAS: { id: Area; label: string }[] = [
  { id: "triangel", label: "Procenttriangeln" },
  { id: "faktor", label: "Förändringsfaktor" },
];

/** Procent som mängdträning: välj procenttriangeln eller förändringsfaktor. */
const Procent = () => {
  const [area, setArea] = useState<Area>(() => (sessionStorage.getItem("procent-area") === "faktor" ? "faktor" : "triangel"));
  useEffect(() => { document.title = "Procent · Mattebo"; }, []);
  useEffect(() => { sessionStorage.setItem("procent-area", area); }, [area]);

  const switcher = (
    <div role="tablist" aria-label="Välj träning" className="mx-auto flex w-fit rounded-full bg-secondary p-1">
      {AREAS.map((a) => (
        <button key={a.id} type="button" role="tab" aria-selected={area === a.id} onClick={() => setArea(a.id)}
          className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-colors sm:px-4 sm:text-sm",
            area === a.id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
          {a.label}
        </button>
      ))}
    </div>
  );

  return area === "triangel"
    ? <StreakDrill key="triangel" config={TRIANGLE} switcher={switcher} />
    : <StreakDrill key="faktor" config={FACTOR} switcher={switcher} />;
};

export default Procent;
