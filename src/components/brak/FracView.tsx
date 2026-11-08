import { cn } from "@/lib/utils";
import type { Frac, Token } from "@/lib/brak";

/** Ett bråk skrivet med täljare över nämnare, ev. med heltalsdel (blandad form). */
export const FracText = ({ f, mixed }: { f: Frac; mixed?: boolean }) => {
  const neg = f.n * f.d < 0; const n = Math.abs(f.n); const d = Math.abs(f.d);
  const whole = mixed && n > d ? Math.floor(n / d) : 0;
  const rest = whole ? n % d : n;
  if (rest === 0 && d !== 1) return <span>{neg && "−"}{n / d}</span>;
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 align-middle">
      {neg && <span>−</span>}
      {whole > 0 && <span>{whole}</span>}
      {d === 1 ? <span>{rest}</span> : (
        <span className="inline-flex flex-col items-center text-[0.75em] leading-none">
          <span className="px-1">{rest}</span>
          <span className="my-0.5 h-[2px] w-full rounded bg-current" />
          <span className="px-1">{d}</span>
        </span>
      )}
    </span>
  );
};

export const QuestionText = ({ tokens }: { tokens: Token[] }) => (
  <>{tokens.map((t, i) => (typeof t === "string" ? <span key={i}>{t}</span> : <FracText key={i} f={t.frac} mixed={t.mixed} />))}</>
);

/** Bråket som staplar: en stapel per hel, d rutor per stapel, n ifyllda. */
export const FracBars = ({ f, tone }: { f: Frac; tone: number }) => {
  const n = Math.abs(f.n); const d = Math.abs(f.d);
  const bars = Math.max(1, Math.ceil(n / d));
  if (d > 16 || bars > 4) return null;
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: bars }, (_, b) => (
        <div key={b} className="flex h-6 overflow-hidden rounded-lg border-2 border-foreground/30">
          {Array.from({ length: d }, (_, i) => (
            <span key={i} className={cn("flex-1 border-r border-foreground/20 last:border-r-0",
              b * d + i < n ? (tone ? "bg-coral/70" : "bg-primary/70") : "bg-background")} />
          ))}
        </div>
      ))}
    </div>
  );
};
