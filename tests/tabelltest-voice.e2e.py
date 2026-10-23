"""Run with python3 tests/tabelltest-voice.e2e.py after minting the owner's preview session.

Uses a synthetic speech recognizer, not microphone hardware. Result writes are
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
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
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
        await page.evaluate("""() => {
            window.SpeechRecognition = class {
                start() { window.testRecognition = this; window.recognitionStarts = (window.recognitionStarts || 0) + 1; }
                stop() { this.onend?.(); }
            };
        }""")
        await page.get_by_role("button", name="Starta testet").click()
        await page.get_by_role("button", name="Svara med rösten", exact=True).click()
        assert await page.evaluate("window.testRecognition.interimResults") is True
        for i in range(20):
            progress = await page.locator("p").filter(has_text="Uppgift ").inner_text()
            assert progress.startswith(f"Uppgift {i + 1} av 20"), progress
            question = await page.locator("p").filter(has_text=" × ").inner_text()
            a, b = question.split(" × ")
            value = int(a) * int(b)
            await page.evaluate("""([index, answer]) => {
                window.voiceResults ??= [];
                const result = [{transcript: String(answer)}];
                result.isFinal = answer >= 20 && answer % 10 === 0;
                window.voiceResults[index] = result;
                window.testRecognition.onresult({resultIndex:index, results:window.voiceResults});
            }""", [i, value])
            if i < 19:
                await page.get_by_text(f"Uppgift {i + 2} av 20", exact=False).wait_for()
            else:
                await page.get_by_text("20 av 20 rätt", exact=False).wait_for()
            # The late final result must not answer the following question.
            await page.evaluate("""index => {
                window.voiceResults[index].isFinal = true;
                window.testRecognition.onresult({resultIndex:index, results:window.voiceResults});
            }""", i)
        await page.get_by_text("20 av 20 rätt", exact=False).wait_for()
        await page.get_by_role("button", name="Försök igen").wait_for()
        await page.wait_for_timeout(200)
        assert len(writes) == 1, f"Expected one final save, got {len(writes)}"
        assert writes[0]["score"] == 20
        assert writes[0]["total"] == 20
        assert writes[0]["input_mode"] == "voice"
        assert await page.evaluate("window.recognitionStarts") == 1
        os.makedirs("/tmp/browser/voice-latency", exist_ok=True)
        await page.screenshot(path="/tmp/browser/voice-latency/after.png")
        print("PASS: stable interim answers and delayed finals advance 20 questions exactly once, with one 20/20 voice result")
        await browser.close()


asyncio.run(main())