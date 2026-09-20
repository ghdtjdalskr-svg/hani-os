import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const url = process.env.HANI_PREVIEW_URL || "http://127.0.0.1:8775/dev-center/ai-approval-room-v3-office-behavior-preview.html";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.HANI_BROWSER_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

async function verify(width) {
  const errors = [];
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url, { waitUntil: "networkidle" });
  const storageBefore = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  await page.locator('.step[data-state="idle"]').click();

  const seen = Object.fromEntries(["hani", "jieun", "naeun", "hina", "sua", "haru", "minji", "sooyeon", "yuna"].map(name => [name, new Set()]));
  const locations = Object.fromEntries(Object.keys(seen).map(name => [name, new Set()]));
  for (let cycle = 0; cycle < 12; cycle += 1) {
    await page.locator("#ambientShuffle").click();
    await page.waitForFunction(() => !document.querySelector("#ambientShuffle")?.disabled, null, { timeout: 7000 });
    const snapshot = await page.locator(".actor").evaluateAll(actors => actors.map(actor => ({
      name: actor.dataset.person,
      label: actor.dataset.actionLabel || "",
      point: `${actor.style.left},${actor.style.top}`,
    })));
    snapshot.forEach(item => { seen[item.name].add(item.label); locations[item.name].add(item.point); });
  }

  assert.ok(seen.hani.has("직원들 자리 슬쩍 둘러보는 중"), "HANI must occasionally leave the private office");
  assert.ok(locations.hani.has("47%,68%"), "HANI office-round waypoint must be used");
  assert.ok([...locations.naeun].some(point => point === "44%,55%"), "NAEUN must work at her desk");
  assert.ok([...locations.naeun].some(point => point !== "44%,55%"), "NAEUN must also use shared spaces");
  assert.ok(seen.naeun.size >= 3, "NAEUN should show several distinct behaviors");
  assert.ok(Object.values(seen).every(labels => labels.size >= 2), "Every character should vary behavior in the sample");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 2);
  if (process.env.HANI_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.HANI_SCREENSHOT_DIR}/office-behavior-${width}.png`, fullPage: true });
  }
  await page.locator('.step[data-state="agenda"]').click();
  const hani = page.locator('.actor[data-person="hani"]');
  assert.equal(await hani.evaluate(actor => `${actor.style.left},${actor.style.top}`), "20%,21%", "HANI must return to the private room when a meeting starts");
  assert.ok(await hani.evaluate(actor => actor.classList.contains("seated")));
  assert.deepEqual(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), storageBefore);
  assert.deepEqual(errors, []);
  await page.close();
}

try {
  await verify(1440);
  await verify(390);
  console.log("Office behavior variety: desktop + mobile PASS");
} finally {
  await browser.close();
}
