import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.HANI_BROWSER_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const url = process.env.HANI_PREVIEW_URL ||
  "http://127.0.0.1:8773/docs/ai-approval-meeting-engine-v2-batch1-preview.html";

try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto(url);
    const questions = page.locator("#questionList textarea");
    assert.equal(await questions.count(), 2);
    await page.locator("#answerBtn").click();
    assert.equal(await questions.count(), 2, "empty answers must not advance");
    await questions.nth(0).fill("10월 10일부터 3박 4일");
    await questions.nth(1).fill("1인 80만원");
    await page.locator("#answerBtn").click();
    assert.equal(await questions.count(), 1);
    assert.match(await page.locator("#questionList").innerText(), /숙소 희망 지역/);
    await questions.first().fill("오사카 근방 교통이 좋으면 아무데나 좋아");
    await page.locator("#answerBtn").click();
    assert.equal(await page.locator("#caseReadiness").innerText(), "READY");
    assert.equal(await questions.count(), 0);
    assert.equal(await page.locator("#approveBtn").isEnabled(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 2);
    await page.locator("#resetBtn").click();
    assert.equal(await questions.count(), 2);
    assert.equal(await page.locator("#caseReadiness").innerText(), "NEED_USER_INFO");
    await page.close();
  }
} finally {
  await browser.close();
}

console.log("Meeting preview two-answer flow: desktop + mobile PASS");
