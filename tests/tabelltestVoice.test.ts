import { expect, test } from "bun:test";
import { createVoiceAnswerHandler, VOICE_STABILITY_MS, VOICE_TENS_STABILITY_MS } from "../src/lib/tabelltestVoice";

const result = (transcript: string, isFinal: boolean) => Object.assign([{ transcript }], { isFinal });
const wait = () => new Promise((resolve) => setTimeout(resolve, VOICE_STABILITY_MS + 60));

test("stable interim answers advance before the final result, exactly once", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("42", false)] });
  await wait();
  expect(answers).toEqual([42]);
  handler.handle({ results: [result("42", true)] });
  handler.handle({ results: [result("42", true)] });
  expect(answers).toEqual([42]);
  handler.stop();
});

test("Swedish tens fragments wait instead of submitting an incomplete compound", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("fyrtio", false)] });
  await wait();
  expect(answers).toEqual([]);
  handler.handle({ results: [result("fyrtio två", false)] });
  await wait();
  expect(answers).toEqual([42]);
  handler.handle({ results: [result("fyrtio två", true)] });
  expect(answers).toEqual([42]);
  handler.stop();
});

test("changed or unparseable interim cancels the previous candidate", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("4", false)] });
  handler.handle({ results: [result("42", false)] });
  await wait();
  expect(answers).toEqual([42]);
  handler.handle({ resultIndex: 1, results: [result("42", true), result("6", false)] });
  handler.handle({ resultIndex: 1, results: [result("42", true), result("", false)] });
  await wait();
  expect(answers).toEqual([42]);
  handler.stop();
});

test("identical answers in separate utterances both count, using resultIndex", () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("12", true)] });
  handler.handle({ resultIndex: 1, results: [result("12", true), result("12", true)] });
  expect(answers).toEqual([12, 12]);
  handler.stop();
});

test("final corrections replace a pending interim immediately", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("4", false)] });
  handler.handle({ results: [result("42", true)] });
  expect(answers).toEqual([42]);
  await wait();
  expect(answers).toEqual([42]);
  handler.stop();
});

test("stopping cancels queued answers and ignores later events", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("42", false)] });
  handler.stop();
  await wait();
  handler.handle({ results: [result("42", true)] });
  expect(answers).toEqual([]);
});

test("a whole ten is accepted even when the browser never sends final", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("fyrtio", false)] });
  await new Promise((resolve) => setTimeout(resolve, VOICE_TENS_STABILITY_MS + 60));
  expect(answers).toEqual([40]);
  handler.handle({ results: [result("fyrtio", true)] });
  expect(answers).toEqual([40]);
  handler.stop();
});

test("a natural session end preserves the last received answer", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("42", false)] });
  handler.end();
  await wait();
  expect(answers).toEqual([42]);
  handler.handle({ results: [result("42", true)] });
  expect(answers).toEqual([42]);
  handler.stop();
});

test("ending a session does not shorten the compound-number delay", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("fyrtio", false)] });
  handler.end();
  await wait();
  expect(answers).toEqual([]);
  await new Promise((resolve) => setTimeout(resolve, VOICE_TENS_STABILITY_MS));
  expect(answers).toEqual([40]);
  handler.stop();
});

test("explicit stop cancels even an ended session's pending answer", async () => {
  const answers: number[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n));
  handler.handle({ results: [result("42", false)] });
  handler.end();
  handler.stop();
  await wait();
  expect(answers).toEqual([]);
});

test("revised words remain visible without grading a consumed utterance twice", () => {
  const answers: number[] = [];
  const heard: string[] = [];
  const handler = createVoiceAnswerHandler((n) => answers.push(n), (text) => heard.push(text));
  handler.handle({ results: [result("12", true)] });
  handler.handle({ results: [result("24", false)] });
  expect(heard).toEqual(["12", "24"]);
  expect(answers).toEqual([12]);
  handler.stop();
});