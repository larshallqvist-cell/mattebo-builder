import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Lock, RotateCcw, Star, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ExerciseShell from "@/components/exercise/ExerciseShell";
import KistanTile, { kistanBoxImg, kistanFishImg } from "@/components/kistan/KistanTile";
import {
  isSolved, isUnlocked, LEVELS, mergeBest, minMoves, nextLevel, parseEquation, placeTile, simplifyPair, stars as calcStars,
  trayTiles, WORLD_NAMES, type GameState, type Level, type ProgressMap, type Side,
} from "@/lib/kistan";

const Stars = ({ n, size = "h-4 w-4" }: { n: number; size?: string }) => (
  <span className="flex" aria-label={`${n} av 3 stjärnor`}>
    {[0, 1, 2].map((i) => <Star key={i} className={cn(size, i < n ? "kistan-gold fill-current" : "opacity-40")} />)}
  </span>
);

/** Nivåväljaren: tre världar med tio nivåer var, låsta tills den förra är klarad. */
const LevelPicker = ({ progress, all, onPick }: { progress: ProgressMap; all: boolean; onPick: (id: string) => void }) => (
  <section className="kistan-board space-y-6 rounded-[1.75rem] p-4 sm:p-6">
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex items-end gap-1">
        <img src={kistanBoxImg} alt="Kistan" className="h-20 w-20 drop-shadow-xl" />
        <img src={kistanFishImg} alt="" className="h-14 w-14 drop-shadow-xl" />
      </div>
      <h1 className="font-playful text-3xl font-bold drop-shadow sm:text-4xl">Gör kistan ensam!</h1>
      <p className="max-w-md text-sm opacity-90">Det du gör på ena sidan måste du göra på den andra. Få bort allt som står bredvid kistan.</p>
    </div>
    {WORLD_NAMES.map((name, w) => (
      <div key={name}>
        <h2 className="mb-2 font-playful text-xl font-bold drop-shadow">{w + 1}. {name}</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {LEVELS.filter((l) => l.world === w + 1).map((l) => {
            const open = isUnlocked(l.id, progress, all);
            const n = progress[l.id]?.stars ?? 0;
            return open ? (
              <button key={l.id} type="button" onClick={() => onPick(l.id)} aria-label={`Nivå ${l.id}`}
                className="kistan-tile flex aspect-square flex-col items-center justify-center rounded-xl text-2xl transition-transform hover:scale-105 active:scale-95 sm:text-3xl">
                {l.id.split("-")[1]}
                <Stars n={n} size="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            ) : (
              <div key={l.id} className="kistan-tile grid aspect-square place-items-center rounded-xl opacity-50">
                <Lock aria-label="Låst" className="h-5 w-5" />
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </section>
);

/** Själva spelplanen för en nivå. */
const Play = ({ level, onBack, onNext, onSolved }: {
  level: Level; onBack: () => void; onNext: (id: string) => void; onSolved: (stars: number, moves: number) => void;
}) => {
  const letters = level.world === 3;
  const start = useMemo(() => parseEquation(level.eq), [level.eq]);
  const min = useMemo(() => minMoves(start), [start]);
  const [history, setHistory] = useState<GameState[]>([start]);
  const [trayPick, setTrayPick] = useState<{ kind: string; neg: boolean } | null>(null);
  const [boardPick, setBoardPick] = useState<{ side: Side; id: string } | null>(null);
  const [shake, setShake] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const state = history[history.length - 1] ?? start;
  const solved = isSolved(state);
  const earned = calcStars(state.moves, min);

  const reset = useCallback(() => { setHistory([start]); setTrayPick(null); setBoardPick(null); setShowResult(false); }, [start]);
  useEffect(reset, [reset]);
  useEffect(() => { if (solved) { onSolved(earned, state.moves); setShowResult(true); } }, [solved]); // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (reason: string) => { toast(reason); setShake((n) => n + 1); };
  const push = (s: GameState) => setHistory((h) => [...h, s]);

  const tapSide = (side: Side) => {
    if (solved) return;
    const pick = trayPick ?? (state.pending ? { kind: state.pending.kind, neg: state.pending.neg } : null);
    if (!pick) return;
    const r = placeTile(state, pick.kind, pick.neg, side);
    if (!r.ok) return fail(r.reason);
    push(r.state);
    setTrayPick(r.state.pending ? pick : null);
    setBoardPick(null);
  };

  const tapTerm = (side: Side, id: string) => {
    if (solved) return;
    if (trayPick || state.pending) return tapSide(side);
    if (!boardPick || boardPick.side !== side) return setBoardPick({ side, id });
    if (boardPick.id === id) return setBoardPick(null);
    const r = simplifyPair(state, side, boardPick.id, id);
    setBoardPick(null);
    if (!r.ok) return fail(r.reason);
    push(r.state);
  };

  const hint = solved ? "Kistan är ensam och allt är förenklat!"
    : state.pending ? `Lägg samma bricka på ${state.pending.side === "left" ? "vänster" : "höger"} sida också!`
    : trayPick ? "Tryck på en sida för att lägga brickan."
    : boardPick ? "Välj motsatsen, eller ett annat tal att slå ihop med."
    : "Välj en bricka nedanför, eller två brickor som tar ut varandra.";

  const renderSide = (side: Side) => (
    <div onClick={() => tapSide(side)}
      className={cn(
        "kistan-half flex min-h-[34vh] flex-1 flex-wrap content-center items-center justify-center gap-2 rounded-3xl p-2 sm:p-3",
        state.pending?.side === side && "kistan-ring",
        trayPick && !state.pending && "kistan-ring-soft cursor-pointer",
      )}>
      {state[side].length === 0 && <KistanTile kind="0" neg={false} letters={letters} disabled />}
      {state[side].map((t) => (
        <span key={t.id} onClick={(e) => { e.stopPropagation(); tapTerm(side, t.id); }}>
          <KistanTile kind={t.kind} neg={t.neg} letters={letters} selected={boardPick?.id === t.id} />
        </span>
      ))}
    </div>
  );

  const next = nextLevel(level.id);
  const iconBtn = "h-11 w-11 rounded-full";

  return (
    <section className="kistan-board relative overflow-hidden rounded-[1.75rem]">
      <div className="flex items-center justify-between gap-2 p-3">
        <Button variant="secondary" size="icon" aria-label="Alla nivåer" onClick={onBack} className={iconBtn}><ArrowLeft /></Button>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{WORLD_NAMES[level.world - 1]} · nivå {level.id.split("-")[1]}</p>
          <p className="font-playful text-xl font-bold" title="Dina drag / bästa möjliga">{state.moves}/{min} drag</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" aria-label="Ångra" disabled={history.length <= 1}
            onClick={() => { setHistory((h) => h.slice(0, -1)); setTrayPick(null); setBoardPick(null); setShowResult(false); }} className={iconBtn}><Undo2 /></Button>
          <Button variant="secondary" size="icon" aria-label="Börja om" onClick={reset} className={iconBtn}><RotateCcw /></Button>
        </div>
      </div>

      <p role="status" className="px-4 text-center text-base font-semibold">{hint}</p>

      <div key={shake} className={cn("flex items-stretch gap-1.5 p-2 sm:gap-2 sm:p-3", shake > 0 && "kistan-shake")}>
        {renderSide("left")}
        <div className="self-center font-playful text-4xl font-bold drop-shadow sm:text-5xl">=</div>
        {renderSide("right")}
      </div>

      <div className="kistan-tray flex min-h-[80px] flex-wrap items-center justify-center gap-3 p-4">
        {solved ? (
          <Button size="lg" className="h-12 gap-2 rounded-full text-lg font-bold" onClick={() => setShowResult(true)}><Check />Visa resultat</Button>
        ) : trayTiles(state).map((t) => (
          <KistanTile key={`${t.kind}${t.neg}`} kind={t.kind} neg={t.neg} letters={letters} small
            selected={trayPick?.kind === t.kind && trayPick.neg === t.neg}
            onClick={() => !state.pending && setTrayPick((p) => (p?.kind === t.kind && p.neg === t.neg ? null : t))} />
        ))}
      </div>

      {solved && showResult && (
        <div className="absolute inset-0 grid place-items-center bg-foreground/40 p-4">
          <div role="dialog" aria-modal="true" aria-label="Nivåresultat" className="kistan-pop exercise-card w-full max-w-sm rounded-3xl p-6 text-center text-foreground">
            <h2 className="font-playful text-3xl font-bold">Kistan är ensam!</h2>
            <div className="my-3 flex justify-center"><Stars n={earned} size="h-11 w-11" /></div>
            <p className="mb-5 text-sm">{state.moves} drag (bästa möjliga: {min})</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="lg" onClick={reset} className="rounded-full font-bold">Igen</Button>
              {next ? (
                <Button size="lg" onClick={() => onNext(next.id)} className="rounded-full font-bold">Nästa nivå</Button>
              ) : (
                <Button size="lg" onClick={onBack} className="rounded-full font-bold">Alla nivåer</Button>
              )}
            </div>
            <Button variant="link" className="mt-2" onClick={() => setShowResult(false)}>Visa spelplanen</Button>
          </div>
        </div>
      )}
    </section>
  );
};

/** Kistan: ekvationer med "samma sak på båda sidor", i tre världar från bilder till bokstäver. */
const Kistan = () => {
  const { user, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const [progress, setProgress] = useState<ProgressMap>({});
  const levelId = params.get("niva");
  const level = LEVELS.find((l) => l.id === levelId && isUnlocked(l.id, progress, isAdmin));

  useEffect(() => { document.title = "Kistan · Mattebo"; }, []);
  useEffect(() => {
    if (!user) return;
    void supabase.from("kistan_progress").select("level_id,stars,best_moves").eq("user_id", user.id).then(({ data }) => {
      setProgress(Object.fromEntries((data ?? []).map((r) => [r.level_id, { stars: r.stars, best_moves: r.best_moves }])));
    });
  }, [user]);

  const goTo = (id: string | null) => setParams(id ? { niva: id } : {}, { replace: false });

  const saveSolved = (lvl: Level) => (stars: number, moves: number) => {
    const best = mergeBest(progress[lvl.id], stars, moves);
    if (!best) return;
    setProgress((p) => ({ ...p, [lvl.id]: best }));
    if (user) {
      void supabase.from("kistan_progress").upsert(
        { user_id: user.id, level_id: lvl.id, ...best, updated_at: new Date().toISOString() },
        { onConflict: "user_id,level_id" },
      ).then(() => {});
    }
  };

  const done = Object.keys(progress).length;
  return (
    <ExerciseShell title="Kistan · Gör kistan ensam" progress={{ value: done, total: LEVELS.length, showLabel: false }}>
      {level ? (
        <Play key={level.id} level={level} onBack={() => goTo(null)} onNext={goTo} onSolved={saveSolved(level)} />
      ) : (
        <>
          <LevelPicker progress={progress} all={isAdmin} onPick={goTo} />
          <p className="text-center text-sm text-muted-foreground">
            {done} av {LEVELS.length} nivåer klarade · {Object.values(progress).reduce((s, p) => s + p.stars, 0)} stjärnor
          </p>
        </>
      )}
    </ExerciseShell>
  );
};

export default Kistan;
