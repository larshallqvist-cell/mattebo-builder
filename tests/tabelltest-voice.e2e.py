"""Run with python3 tests/tabelltest-voice.e2e.py after minting the owner's preview session.

Uses a synthetic speech recognizer, not microphone hardware, including answers
appended with changing punctuation to the same browser result. Result writes are
intercepted so this regression never adds a test result to the owner's history.
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright


async def main():
    if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS") == "injected":
        storage_key = os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"]
        session_json = os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]
    else:
        with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as f:
            auth = json.load(f)
        storage_key = auth["storage_key"]
        session_json = json.dumps(auth["session"])
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"])
        context = await browser.new_context(viewport={"width": 1280, "height": 1800}, permissions=["microphone"])
        await context.add_init_script("""window.SpeechRecognition = class {
            start() { window.testRecognition = this; window.recognitionStarts = (window.recognitionStarts || 0) + 1; }
            stop() { this.onend?.(); }
        };""")
        page = await context.new_page()
        writes = []

        async def results(route):
            if route.request.method == "POST":
                writes.append(route.request.post_data_json)
                await route.fulfill(status=201, content_type="application/json", body="")
            else:
                await route.continue_()

        await page.route("**/rest/v1/tabelltest_results**", results)
        await page.goto("http://localhost:8080")
        await page.evaluate("([k,v])=>localStorage.setItem(k,v)",
                            [storage_key, session_json])
        await page.goto("http://localhost:8080/tabelltestet")
        await page.get_by_text("Mikrofonen är på – ljudnivån visas ovan.", exact=True).wait_for()
        await page.wait_for_function("Number(document.querySelector('[role=meter]')?.getAttribute('aria-valuenow')) > 0")
        os.makedirs("/tmp/browser/voice-latency", exist_ok=True)
        await page.screenshot(path="/tmp/browser/voice-latency/pre-test.png")
        assert await page.evaluate("window.recognitionStarts || 0") == 0
        await page.get_by_role("button", name="Starta testet").click()
        await page.get_by_role("button", name="Stoppa röstinmatning", exact=True).wait_for()
        assert await page.evaluate("window.testRecognition.interimResults") is True
        for i in range(20):
            if i == 5:
                await page.evaluate("window.testRecognition.onend()")
                await page.wait_for_function("window.recognitionStarts === 2")
                await page.evaluate("window.voiceResults = []")
                await page.evaluate("window.voiceTranscript = ''")
            utterance = 0
            progress = await page.locator("p").filter(has_text="Uppgift ").inner_text()
            assert progress.startswith(f"Uppgift {i + 1} av 20"), progress
            question = await page.locator("p").filter(has_text=" × ").inner_text()
            a, b = question.split(" × ")
            value = int(a) * int(b)
            await page.evaluate("""([index, answer]) => {
                window.voiceResults ??= [];
                // Change old separators and add a new colon, as iPad can do
                // when revising "10." to "10:12" after a question advances.
                window.voiceTranscript = window.voiceTranscript
                    ? window.voiceTranscript.replace(/[.,:;!?]+/g, ', ') + ':' + answer + '.'
                    : String(answer) + '.';
                const result = [{transcript: window.voiceTranscript}];
                result.isFinal = false;
                window.voiceResults[index] = result;
                window.testRecognition.onresult({resultIndex:index, results:window.voiceResults});
            }""", [utterance, value])
            if i == 19:
                # A browser ending after interim must not discard the final answer.
                await page.evaluate("window.testRecognition.onend()")
            if i < 19:
                await page.get_by_text(f"Uppgift {i + 2} av 20", exact=False).wait_for()
            else:
                await page.get_by_text("20 av 20 rätt", exact=False).wait_for()
            # The late final result must not answer the following question.
            await page.evaluate("""index => {
                window.voiceResults[index].isFinal = true;
                window.testRecognition.onresult({resultIndex:index, results:window.voiceResults});
            }""", utterance)
        await page.get_by_text("20 av 20 rätt", exact=False).wait_for()
        await page.get_by_role("button", name="Försök igen").wait_for()
        await page.wait_for_timeout(200)
        assert len(writes) == 1, f"Expected one final save, got {len(writes)}"
        assert writes[0]["score"] == 20
        assert writes[0]["total"] == 20
        assert writes[0]["input_mode"] == "voice"
        assert await page.evaluate("window.recognitionStarts") in (2, 3)
        os.makedirs("/tmp/browser/voice-latency", exist_ok=True)
        await page.screenshot(path="/tmp/browser/voice-latency/after.png")
        print("PASS: 20 answers with revised punctuation advance exactly once, including delayed finals and reconnection; one 20/20 voice result")
        await browser.close()


asyncio.run(main())