/** Kändisberöm i Bråkträningen: när en kändis dyker upp och vad hen säger. */

export type CheerReason = "tier" | "record" | "streak";
export const STREAK_MILESTONES = [5, 10, 20] as const;

export type CheerState = { streakBefore: number; streak: number; tierBefore: number; tier: number; recordBefore: number; streakPoints: number; recordCheered: boolean };

/** Vilket beröm ett rätt svar ger: nytt steg går före nytt rekord, som går före 5/10/20 i rad. Rekord bara en gång per svit och bara om det fanns ett tidigare rekord. */
export function cheerReason(s: CheerState): CheerReason | null {
  if (s.streak <= s.streakBefore) return null;
  if (s.tier > s.tierBefore) return "tier";
  if (!s.recordCheered && s.recordBefore > 0 && s.streakPoints > s.recordBefore) return "record";
  if ((STREAK_MILESTONES as readonly number[]).includes(s.streak)) return "streak";
  return null;
}

/** Repliker per kändis. {n} byts mot antal rätt i rad, {steg} mot det nya steget. */
export const CHEER_LINES: Record<string, string[]> = {
  zlatan: ["Zlatan har sett många bråk. Detta var inget av dem. Detta var perfekt.", "Du räknar som Zlatan spelar. Fast utan bicykletter."],
  kungen: ["Vi har beslutat att utnämna dig till Riddare av Den Gemensamma Nämnaren.", "Detta var… kungligt. Nu går vi och vilar."],
  carola: ["Fångad av en stormvind av rätta svar!", "Det här var värt tolv poäng från varenda jury."],
  taylor: ["Shake it off! Fast behåll svaren, de var rätt.", "Jag skriver en låt om det här bråket. Den blir lång."],
  magdalena: ["Rektorn har bestämt: det här får du gärna fortsätta med.", "Jag ser allt från expeditionen. Och det här var snyggt."],
  ronaldo: ["SIUUU! Det var ett mål i nämnaren!", "Jag tränar varje dag. Du också, märker jag."],
  messi: ["Liten men otroligt skicklig. Du alltså, inte bråket.", "Den där dribblingen förbi nämnaren såg jag inte komma."],
  pernilla: ["Ååh, det här var ju HELT fantastiskt!", "Jag blev så glad att jag tappade glittret."],
  benjamin: ["Det här är nästan lika bra som en refräng. Nästan.", "Dansa med mig! Nä förresten, räkna vidare."],
  mrbeast: ["Du har vunnit… ingenting! Men du är jättebra på bråk.", "Om du klarar nästa ger jag dig… beröm. Mycket beröm."],
  therock: ["Can you smell what the bråk is cooking?", "Jag lyfter tunga vikter. Du lyfter tunga bråk."],
  bieber: ["Baby, baby, baby, ooh – vilket svar!", "Is it too late now to say you're good at math? Nej."],
};
export const REASON_LINES: Record<CheerReason, string[]> = {
  tier: ["Steg {steg}! Och nu till något helt annat.", "Du har nått steg {steg}. Ingen förväntade sig detta."],
  record: ["Nytt rekord! Detta är ett före detta gammalt rekord.", "Ditt gamla rekord har slutat existera. Det är ett ex-rekord."],
  streak: ["{n} rätt i rad! Bråken säger att det bara är ett köttsår.", "{n} i rad. Det är inte nödvändigtvis ett svar – men det är rätt."],
};

type Rnd = () => number;
const pick = <T,>(rnd: Rnd, xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];

/** Väljer kändis (inte samma som förra gången) och replik: hälften kändisens egen, hälften anledningens. */
export function pickCheer(reason: CheerReason, ctx: { streak: number; tier: number }, last?: string, rnd: Rnd = Math.random) {
  const ids = Object.keys(CHEER_LINES).filter((id) => id !== last);
  const id = pick(rnd, ids);
  const line = rnd() < 0.5 ? pick(rnd, CHEER_LINES[id]) : pick(rnd, REASON_LINES[reason]);
  return { id, text: line.replace("{n}", String(ctx.streak)).replace("{steg}", String(ctx.tier + 1)) };
}
