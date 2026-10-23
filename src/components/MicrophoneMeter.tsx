import { useEffect, useState } from "react";

/** Local-only audio analysis: no recording and no audio uploads. */
const MicrophoneMeter = ({ active, onReadyChange }: { active: boolean; onReadyChange?: (ready: boolean, unavailable: boolean) => void }) => {
  const [level, setLevel] = useState(0);
  const [state, setState] = useState<"off" | "starting" | "ready" | "unavailable">("off");

  useEffect(() => {
    onReadyChange?.(state === "ready", state === "unavailable");
  }, [state, onReadyChange]);

  useEffect(() => {
    setLevel(0);
    if (!active) {
      setState("off");
      return;
    }
    let cancelled = false;
    let stream: MediaStream | undefined;
    let context: AudioContext | undefined;
    let frame = 0;
    setState("starting");

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        context = new AudioContext();
        await context.resume();
        if (cancelled) return;
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        setState("ready");
        const sample = () => {
          if (cancelled) return;
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
          setLevel(Math.min(10, Math.round(Math.sqrt(rms) * 24)));
          frame = requestAnimationFrame(sample);
        };
        sample();
      } catch {
        stream?.getTracks().forEach((track) => track.stop());
        if (context && context.state !== "closed") void context.close();
        if (!cancelled) setState("unavailable");
      }
    };
    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      if (context && context.state !== "closed") void context.close();
    };
  }, [active]);

  const label = state === "unavailable" ? "Ljudmätaren är inte tillgänglig"
    : state === "starting" ? "Ansluter mikrofonen"
    : active ? "Mikrofonens ljudnivå" : "Mikrofonen är avstängd";

  return (
    <div className="flex h-5 w-16 items-center gap-0.5" title={label}
      role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={level}
      aria-valuetext={state === "unavailable" ? "Inte tillgänglig" : `${level} av 10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`h-4 flex-1 rounded-sm ${i < level ? "bg-accent" : "bg-muted-foreground/25"}`} />
      ))}
    </div>
  );
};

export default MicrophoneMeter;