import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const url = process.env.HANI_PREVIEW_URL ||
  "http://127.0.0.1:8774/dev-center/ai-approval-room-v3-office-integration-approval.html";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.HANI_BROWSER_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const errors = [];

async function verify(width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on("pageerror", error => errors.push(`${width}: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") errors.push(`${width}: ${message.text()}`); });
  await page.goto(url, { waitUntil: "networkidle" });
  const storageBefore = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  await page.locator('.step[data-state="revised"]').evaluate(button => button.click());
  assert.equal(await page.locator("#officeStage").getAttribute("data-state"), "decision", "Decision must be gated before answers");
  assert.equal(await page.locator('.step[data-state="revised"]').getAttribute("aria-disabled"), "true");
  await page.locator('.step[data-state="action"]').evaluate(button => button.click());
  assert.equal(await page.locator("#officeStage").getAttribute("data-state"), "decision", "Action Preview must be gated before answers");
  await page.locator('.step[data-state="decision"]').click();
  if (process.env.HANI_SCREENSHOT_DIR) {
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${process.env.HANI_SCREENSHOT_DIR}/meeting-inline-${width}.png`, fullPage: true });
    await page.locator(width > 620 ? '.meeting-layer' : '.mobile-meeting').screenshot({ path: `${process.env.HANI_SCREENSHOT_DIR}/meeting-inline-detail-${width}.png` });
  }

  if (width > 620) {
    const form = page.locator("#blockingForm");
    await form.waitFor({ state: "visible" });
    assert.ok(await form.evaluate(el => Boolean(el.closest('.conversation'))), "Question must appear in conversation");
    assert.ok(await form.evaluate(el => el.getBoundingClientRect().width >= 250), "Question must be readable");
    await form.locator('button[type="submit"]').click();
    assert.match(await page.locator("#blockingError").innerText(), /두 질문/);
    assert.equal(await page.locator("#officeStage").getAttribute("data-state"), "decision");
    await page.locator("#blockingDate").fill("10월 10일부터 3박 4일");
    await page.locator("#blockingBudget").fill("1인 80만 원");
    await form.locator('button[type="submit"]').click();
  } else {
    const form = page.locator("#mobileBlockingForm");
    await form.waitFor({ state: "visible" });
    assert.ok(await form.evaluate(el => Boolean(el.closest('.mobile-meeting'))), "Mobile question must appear in conversation");
    await form.locator('button[type="submit"]').click();
    assert.match(await page.locator("#mobileBlockingError").innerText(), /두 질문/);
    await page.locator("#mobileBlockingDate").fill("10월 10일부터 3박 4일");
    await page.locator("#mobileBlockingBudget").fill("1인 80만 원");
    await form.locator('button[type="submit"]').click();
  }

  await page.waitForFunction(() => document.querySelector("#officeStage")?.dataset.state === "revised");
  assert.match(await page.locator("#representativeAnswerEcho").innerText(), /10월 10일부터 3박 4일/);
  assert.match(await page.locator("#representativeAnswerEcho").innerText(), /1인 80만 원/);
  assert.equal(await page.locator("#phaseSafety").innerText(), "DECISION READY");
  assert.equal(await page.locator('.step[data-state="revised"]').getAttribute("aria-disabled"), "false");
  assert.ok(await page.locator('.message[data-order="6"]').evaluate(el => el.classList.contains("show")));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 2);
  assert.deepEqual(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), storageBefore);
  await page.close();
}

try {
  await verify(1440);
  await verify(390);
  assert.deepEqual(errors, []);
  console.log("Meeting inline clarification: desktop + mobile PASS");
} finally {
  await browser.close();
}
