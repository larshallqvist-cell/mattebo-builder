import { parseSpokenNumber } from "./tabelltest";

export const VOICE_STABILITY_MS = 400;

interface SpeechResult {
  isFinal?: boolean;
  [index: number]: { transcript: string } | undefined;
}

export interface SpeechResultsEvent {
  resultIndex?: number;
  results: ArrayLike<SpeechResult>;
}

/** One submission per utterance, including when its final result arrives later. */
export function createVoiceAnswerHandler(submit: (answer: number) => void) {
  const consumed = new Set<number>();
  let pending: { index: number; value: number } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

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
      if (stopped) return;
      for (let index = event.resultIndex ?? 0; index < event.results.length; index++) {
        if (consumed.has(index)) continue;
        const result = event.results[index];
        const value = parseSpokenNumber(result?.[0]?.transcript ?? "");
        if (value == null) {
          if (pending?.index === index) cancelPending();
          continue;
        }
        if (result.isFinal !== false) {
          accept(index, value);
          return;
        }
        // "fyrtio" can still become "fyrtio två": wait for final on tens.
        if (value >= 20 && value % 10 === 0) {
          if (pending?.index === index) cancelPending();
          continue;
        }
        if (pending?.index === index && pending.value === value) return;
        cancelPending();
        pending = { index, value };
        timer = setTimeout(() => accept(index, value), VOICE_STABILITY_MS);
        return;
      }
    },
    stop() {
      stopped = true;
      cancelPending();
    },
  };
}