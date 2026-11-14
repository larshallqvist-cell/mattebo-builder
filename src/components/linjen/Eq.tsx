import { fmtNum, type Line } from "@/lib/linjen";

/** Bråk med täljare över nämnare, i löptext. */
const Frac = ({ p, q }: { p: number; q: number }) => (
  <span className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.72em] leading-[1.05]">
    <span>{p}</span><span className="w-full border-t-2 border-current text-center">{q}</span>
  </span>
);

/** Ekvationen y = kx + m som i boken, med k som riktigt bråk. */
export default function Eq({ line: l }: { line: Line }) {
  const kx = l.kp === 0 ? null : l.kq !== 1
    ? <>{l.kp < 0 && "−"}<Frac p={Math.abs(l.kp)} q={l.kq} />x</>
    : l.kp === 1 ? "x" : l.kp === -1 ? "−x" : `${fmtNum(l.kp)}x`;
  return (
    <span className="whitespace-nowrap font-orbitron">
      y = {kx}
      {kx === null ? fmtNum(l.m) : l.m === 0 ? null : ` ${l.m < 0 ? "−" : "+"} ${fmtNum(Math.abs(l.m))}`}
    </span>
  );
}
