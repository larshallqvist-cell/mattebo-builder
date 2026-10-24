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

// Largest answer in the table test (9 × 10).
const MAX_TABLE_ANSWER = 90;

// A separator is required: "4.15" / "4 15" can contain two answers,
// but "4" -> "42" and "fyrtio" -> "fyrtiotvå" are revisions, not new answers.
function appendedAnswer(text: string, prefix: string): string | null {
  if (!prefix || !text.startsWith(prefix)) return null;
  const rest = text.slice(prefix.length);
  // Browsers sometimes glue digits: accepted "40" then "4015" or "406".
  // If the glued number cannot be a table answer, the tail is a new answer;
  // otherwise ("4" -> "42") it is a revision of the accepted one.
  const prefixDigits = prefix.match(/\d+$/)?.[0];
  if (prefixDigits && /^\d{1,2}$/.test(rest)) {
    return Number(prefixDigits + rest) > MAX_TABLE_ANSWER ? rest : null;
  }
  if (!/^[\s.,;:!?]/.test(rest)) return null;
  return rest.replace(/^[\s.,;:!?]+/, "") || null;
}

// iOS sometimes starts a new result that repeats earlier answers ("40 15"
// or "4015" after 40 was accepted elsewhere). Strip the already graded text.
function stripAcceptedHistory(text: string, history: string[]): string | null {
  const prefixes = new Set<string>();
  for (let start = 0; start < history.length; start++) {
    const tail = history.slice(start);
    prefixes.add(tail.join(" "));
    prefixes.add(tail.join(""));
  }
  const ordered = [...prefixes].sort((a, b) => b.length - a.length);
  for (const prefix of ordered) {
    const rest = appendedAnswer(text, prefix);
    if (rest !== null) return rest;
  }
  return null;
}

/** One submission per utterance, including when its final result arrives later. */
export function createVoiceAnswerHandler(
  submit: (answer: number) => void,
  onHeard?: (text: string) => void,
  /** Accepted answer texts, shared across reconnected sessions in one test. */
  history: string[] = [],
) {
  const consumed = new Map<number, string>();
  let pending: { index: number; value: number; transcript: string; answerText: string } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let ended = false;

  const cancelPending = () => {
    clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  const accept = (index: number, value: number, transcript: string, answerText: string) => {
    cancelPending();
    if (stopped || consumed.get(index) === transcript) return;
    consumed.set(index, transcript);
    history.push(answerText);
    if (history.length > 6) history.splice(0, history.length - 6);
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
        const candidate = prefix === undefined
          ? stripAcceptedHistory(transcript, history) ?? transcript
          : appendedAnswer(transcript, prefix);
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
          accept(index, value, transcript, candidate);
          return;
        }
        // Give compound numbers longer to settle, but never wait forever for final.
        const delay = value >= 20 && value % 10 === 0 ? VOICE_TENS_STABILITY_MS : VOICE_STABILITY_MS;
        if (pending?.index === index && pending.value === value && pending.transcript === transcript) return;
        cancelPending();
        pending = { index, value, transcript, answerText: candidate };
        timer = setTimeout(() => accept(index, value, transcript, candidate), delay);
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