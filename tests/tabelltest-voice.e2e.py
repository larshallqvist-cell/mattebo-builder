"""Run with python3 tests/tabelltest-voice.e2e.py after minting the owner's preview session.

Uses a synthetic speech recognizer, not microphone hardware. Result writes are
intercepted so this regression never adds a test result to the owner's history.
"""
import asyncio
import json
import os
from playwright.async_api import async_playwright


async def main():
    with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as f:
        auth = json.load(f)
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
                            [auth["storage_key"], json.dumps(auth["session"])])
        await page.goto("http://localhost:8080/tabelltestet")
        await page.evaluate("""() => {
            window.SpeechRecognition = class {
                start() { window.testRecognition = this; window.recognitionStarts = (window.recognitionStarts || 0) + 1; }
                stop() { this.onend?.(); }
            };
        }""")
        await page.get_by_role("button", name="Starta testet").click()
        await page.get_by_role("button", name="Svara med rösten", exact=True).click()
        for i in range(20):
            progress = await page.locator("p").filter(has_text="Uppgift ").inner_text()
            assert progress.startswith(f"Uppgift {i + 1} av 20"), progress
            question = await page.locator("p").filter(has_text=" × ").inner_text()
            a, b = question.split(" × ")
            await page.evaluate("answer => window.testRecognition.onresult({results: [[{transcript: String(answer)}]]})", int(a) * int(b))
            if i < 19:
                await page.get_by_text(f"Uppgift {i + 2} av 20", exact=False).wait_for()
        await page.get_by_text("20 av 20 rätt", exact=False).wait_for()
        await page.get_by_role("button", name="Försök igen").wait_for()
        await page.wait_for_timeout(200)
        assert len(writes) == 1, f"Expected one final save, got {len(writes)}"
        assert writes[0]["score"] == 20
        assert writes[0]["total"] == 20
        assert writes[0]["input_mode"] == "voice"
        assert await page.evaluate("window.recognitionStarts") == 1
        print("PASS: one continuous recognition session advances through all 20 questions and submits one 20/20 voice result")
        await browser.close()


asyncio.run(main())