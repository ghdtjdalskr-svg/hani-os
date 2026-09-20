import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.HANI_PREVIEW_URL || "http://127.0.0.1:8774/";
const outputDir = path.resolve(process.env.HANI_PREVIEW_OUTPUT_DIR || path.join(os.tmpdir(), "hani-newsroom-followup"));
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.HANI_BROWSER_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const errors = [];
const fixture = [{
  id: "weekly-followup-fixture",
  post_type: "WEEKLY",
  period_key: "2026-09-W3",
  published_at: "2026-09-19T21:15:29.629Z",
  payload: {
    company_followup: {
      version: 1,
      week_label: "9월 3주차",
      headlines: {
        semiconductor: "메모리 업황보다 실제 투자와 고객 수요를 봅니다.",
        lg: "전장과 AI 제품의 실행력을 확인합니다.",
        infra: "AI 인프라 투자가 공급망에 미치는 영향을 봅니다.",
        frontier: "모델 경쟁보다 제품과 매출 변화를 봅니다.",
        world: "정책과 공급망 변화의 직접 영향을 확인합니다.",
      },
      channels: Object.fromEntries(["semiconductor", "lg", "infra", "frontier", "world"].map((key, index) => [key, [{
        topic: `핵심 주제 ${index + 1}`,
        importance: "핵심",
        sentiment: ["POSITIVE", "MIXED", "NEUTRAL", "POSITIVE", "NEGATIVE"][index],
        title: `채널 ${index + 1}의 이번 주 주요 변화`,
        change: "지난주 대비 확인된 변화",
        summary: "반복 기사보다 실제 사업과 수요에 영향을 주는 변화만 요약합니다.",
        next_check: "다음 실적과 공식 발표 확인",
        sources: [{ name: "공식 자료", url: "https://example.com/source" }],
        comments: [{ agent_key: "hani", agent_name: "하니", role: "핵심 해석", comment: "숫자와 후속 확인 항목을 함께 보겠습니다." }],
      }]])),
    },
  },
}];

async function verify(viewport, name) {
  const page = await browser.newPage({ viewport });
  await page.route("https://cdn.jsdelivr.net/**", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "window.supabase={createClient:function(){return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}}},from:function(){return {select:function(){return this},eq:function(){return this},order:function(){return this},limit:function(){return this},single:async function(){return {data:null,error:null}}}}}}};",
  }));
  page.on("console", msg => { if (msg.type() === "error") errors.push(`${name}: ${msg.text()}`); });
  page.on("pageerror", error => errors.push(`${name}: ${error.message}`));
  await page.goto(`${baseUrl}#newsroom`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.waitForFunction(() => typeof window.HANI_COMPANY_FOLLOWUP_RENDER === "function", null, { timeout: 15_000 });
  await page.evaluate(data => {
    document.querySelectorAll(".login-gate,.login-recovery-gate").forEach(el => { el.style.display = "none"; });
    document.getElementById("app")?.classList.remove("login-locked");
    document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
    const view = document.getElementById("newsroom");
    view.classList.add("active");
    view.style.display = "block";
    window.HANI_COMPANY_FOLLOWUP_RENDER(data, new Set(), false, "", () => {});
  }, fixture);

  const root = page.locator(".company-followup-preview");
  await root.waitFor({ state: "visible" });
  await root.scrollIntoViewIfNeeded();
  assert.equal(await root.locator(".company-followup-channels label").count(), 5);
  assert.equal(await root.locator(".company-followup-panel").count(), 5);
  assert.equal(await root.locator(".followup-issue").count(), 5);
  assert.ok(await root.locator(".followup-company-mark").count() >= 9);
  assert.match(await root.locator(".company-followup-cycle b").innerText(), /9월 3주차/);
  const titleSize = Number.parseFloat(await root.locator(".issue-copy b").first().evaluate(el => getComputedStyle(el).fontSize));
  assert.ok(titleSize >= 16, `${name} issue title is too small: ${titleSize}px`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 2, `${name} horizontal overflow: ${overflow}px`);
  await root.screenshot({ path: path.join(outputDir, `${name}.png`) });
  await page.close();
}

await verify({ width: 1440, height: 1000 }, "desktop");
await verify({ width: 390, height: 844 }, "mobile-390");
await browser.close();

const relevantErrors = errors.filter(line => !/favicon|ERR_ABORTED|Failed to fetch|Cloud|WebSocket/i.test(line));
assert.deepEqual(relevantErrors, [], `Unexpected browser errors:\n${relevantErrors.join("\n")}`);
console.log(`Newsroom weekly follow-up smoke: desktop + mobile PASS (${outputDir})`);
