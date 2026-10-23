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

/** One submission per utterance, including when its final result arrives later. */
export function createVoiceAnswerHandler(submit: (answer: number) => void, onHeard?: (text: string) => void) {
  const consumed = new Set<number>();
  let pending: { index: number; value: number } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let ended = false;

  const cancelPending = () => {
    clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  const accept = (index: number, value: number) => {
    cancelPending();
    if (stopped || consumed.has(index)) return;
    consumed.add(index);
    submit(value);
  };

  return {
    handle(event: SpeechResultsEvent) {
      if (stopped || ended) return;
      for (let index = event.resultIndex ?? 0; index < event.results.length; index++) {
        const result = event.results[index];
        onHeard?.(result?.[0]?.transcript ?? "");
        if (consumed.has(index)) continue;
        const value = parseSpokenNumber(result?.[0]?.transcript ?? "");
        if (value == null) {
          if (pending?.index === index) cancelPending();
          continue;
        }
        if (result.isFinal !== false) {
          accept(index, value);
          return;
        }
        // Give compound numbers longer to settle, but never wait forever for final.
        const delay = value >= 20 && value % 10 === 0 ? VOICE_TENS_STABILITY_MS : VOICE_STABILITY_MS;
        if (pending?.index === index && pending.value === value) return;
        cancelPending();
        pending = { index, value };
        timer = setTimeout(() => accept(index, value), delay);
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