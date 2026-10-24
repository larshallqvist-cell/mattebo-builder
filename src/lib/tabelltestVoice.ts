import { parseSpokenNumber } from "./tabelltest";

export const VOICE_STABILITY_MS = 400;
export const VOICE_TENS_STABILITY_MS = 800;

interface SpeechResult {
  isFinal?: boolean;
  [index: number]: { transcript: string } | undefined;
}

export interface SpeechResultsEvent {
  resultIndex?: number;
  results: ArrayLike<SpeechResult>;
}

// Browsers revise punctuation as words accumulate ("10." -> "10:12").
// Compare word boundaries, not the browser's choice of punctuation.
const normalizeTranscript = (text: string) => text.toLowerCase().replace(/[\s.,;:!?]+/g, " ").trim();

// A separator is required: "4.15" / "4 15" can contain two answers,
// but "4" -> "42" and "fyrtio" -> "fyrtiotvå" are revisions, not new answers.
function appendedAnswer(text: string, prefix: string): string | null {
  if (!text.startsWith(prefix)) return null;
  const rest = text.slice(prefix.length);
  // Browsers sometimes glue digits: accepted "40" then "4015". A two-digit
  // tail after an accepted number is a new answer; a single digit ("4" -> "42")
  // stays a revision.
  if (/\d$/.test(prefix) && /^\d{2}$/.test(rest)) return rest;
  if (!/^[\s.,;:!?]/.test(rest)) return null;
  return rest.replace(/^[\s.,;:!?]+/, "") || null;
}

/** One submission per utterance, including when its final result arrives later. */
export function createVoiceAnswerHandler(submit: (answer: number) => void, onHeard?: (text: string) => void) {
  const consumed = new Map<number, string>();
  let pending: { index: number; value: number; transcript: string } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let ended = false;

  const cancelPending = () => {
    clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  const accept = (index: number, value: number, transcript: string) => {
    cancelPending();
    if (stopped || consumed.get(index) === transcript) return;
    consumed.set(index, transcript);
    submit(value);
  };

  return {
    handle(event: SpeechResultsEvent) {
      if (stopped || ended) return;
      for (let index = event.resultIndex ?? 0; index < event.results.length; index++) {
        const result = event.results[index];
        onHeard?.(result?.[0]?.transcript ?? "");
        const transcript = normalizeTranscript(result?.[0]?.transcript ?? "");
        const prefix = consumed.get(index);
        const candidate = prefix === undefined ? transcript : appendedAnswer(transcript, prefix);
        // A late final or a correction of already graded words is not another answer.
        if (candidate === null) {
          if (pending?.index === index) cancelPending();
          continue;
        }
        // The general parser extracts the first digit group. Here that would
        // silently grade "10:12" as 10 if no previous answer was accepted.
        // Only one numeric token is safe after removing the accepted prefix.
        const value = /\d/.test(candidate) && !/^\d{1,3}$/.test(candidate)
          ? null : parseSpokenNumber(candidate);
        if (value == null) {
          if (pending?.index === index) cancelPending();
          continue;
        }
        if (result.isFinal !== false) {
          accept(index, value, transcript);
          return;
        }
        // Give compound numbers longer to settle, but never wait forever for final.
        const delay = value >= 20 && value % 10 === 0 ? VOICE_TENS_STABILITY_MS : VOICE_STABILITY_MS;
        if (pending?.index === index && pending.value === value && pending.transcript === transcript) return;
        cancelPending();
        pending = { index, value, transcript };
        timer = setTimeout(() => accept(index, value, transcript), delay);
        return;
      }
    },
    // Natural session endings do not invalidate the last received candidate.
    // Keep its original compound-number debounce; explicit stops still cancel it.
    end() {
      ended = true;
    },
    stop() {
      stopped = true;
      cancelPending();
    },
  };
}