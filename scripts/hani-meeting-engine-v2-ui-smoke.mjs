import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.HANI_PREVIEW_URL || "http://127.0.0.1:8773/";
const outputDir = path.resolve(process.env.HANI_PREVIEW_OUTPUT_DIR || path.join(os.tmpdir(), "hani-meeting-engine-v2-batch1"));
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.HANI_BROWSER_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const errors = [];

async function verify(viewport, name) {
  const page = await browser.newPage({ viewport });
  await page.route("https://cdn.jsdelivr.net/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "window.supabase={createClient:function(){return {auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}}},from:function(){return {select:function(){return this},eq:function(){return this},order:function(){return this},limit:function(){return this},single:async function(){return {data:null,error:null}}}}}}};",
  }));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(`${name}: ${msg.text()}`); });
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  await page.goto(`${baseUrl}#agentReview`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.waitForFunction(() => typeof window.renderAgentCaseDetail === "function", null, { timeout: 15_000 });
  await page.evaluate(() => {
    document.querySelectorAll(".login-gate,.login-recovery-gate").forEach((el) => { el.style.display = "none"; });
    document.getElementById("app")?.classList.remove("login-locked");
    document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
    const view = document.getElementById("agentReview");
    view.classList.add("active");
    view.style.display = "block";
    const detailFixture = {
      case: {
        id: "case-osaka", case_code: "CASE-OSAKA", workflow: "TRAVEL_PLAN",
        title: "오사카 여행 일정", status: "HELD", risk_level: "MEDIUM",
        verification_status: "NEEDS_DATA", updated_at: new Date().toISOString(),
        context: { human_question_round_count: 0 }, hani_final: {},
        verification: {
          status: "NEEDS_DATA", decision_status: "NEED_USER_INFO", ready_for_decision: false,
          summary: "기간과 예산이 없어 실제 일정을 확정할 수 없습니다.",
          blocker_reason: "여행의 핵심 조건을 먼저 확인해야 합니다.",
          human_required_questions: ["여행 기간과 출발일은 언제인가요?", "총예산은 얼마인가요?"],
          consolidated_questions: ["여행 기간과 출발일은 언제인가요?", "총예산은 얼마인가요?"],
          decision_blockers: ["여행 기간과 출발일", "총예산"], conditional_checks: [],
          optimization_questions: ["선호하는 카페 분위기가 있나요?"], conflicts: [],
          research_required_items: [],
        },
      },
      reviews: [{ review_round: 1, agent_key: "SUYEON", role: "TRAVEL", verdict: "NEEDS_DATA", summary: "핵심 여행 조건 확인이 필요합니다.", candidate_scores: [] }],
      decisions: [],
      events: [{ event_type: "CASE_CREATED" }, { event_type: "ROUTING_COMPLETED" }, { event_type: "AGENT_REVIEWS_COMPLETED" }, { event_type: "VERIFICATION_COMPLETED" }],
    };
    window.eval(`agentDetailCache = ${JSON.stringify(detailFixture)}`);
    window.renderAgentCaseDetail();
  });

  const detail = page.locator("#agentCaseDetail");
  await assert.doesNotReject(() => detail.waitFor({ state: "visible" }));
  assert.equal(await detail.getByText("결정 준비 점검", { exact: true }).count(), 1);
  assert.equal(await detail.getByText("하니 최종 결론", { exact: true }).count(), 0);
  assert.equal(await detail.locator("[data-agent-answer]").count(), 2);
  assert.equal(await detail.locator("#agentAdditionalCondition").count(), 1);
  assert.equal(await detail.locator('[data-agent-decision="APPROVE"]').isDisabled(), true);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 2, `${name} horizontal overflow: ${overflow}px`);
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true });

  await page.evaluate(() => {
    const c = window.eval("agentDetailCache.case");
    c.verification = { status: "NEEDS_DATA", decision_status: "HOLD", human_required_questions: [], consolidated_questions: [], decision_blockers: [], research_required_items: [] };
    window.renderAgentCaseDetail();
  });
  assert.equal(await detail.locator("#agentAdditionalCondition").count(), 1);
  assert.equal(await detail.locator("#agentSubmitAnswers").count(), 1);
  assert.equal(await detail.locator('[data-agent-decision="APPROVE"]').isDisabled(), true);

  await page.evaluate(() => {
    const c = window.eval("agentDetailCache.case");
    c.status = "AWAITING_APPROVAL";
    c.verification_status = "PASS";
    c.hani_final = { ready_for_decision: true, recommendation: "PROCEED", executive_summary: "일정과 예산이 확정되어 추천 동선을 제안합니다.", representative_questions: ["지난 라운드 질문"] };
    c.verification = { status: "PASS", decision_status: "READY", human_required_questions: [], research_required_items: ["예약 직전 가격 재확인"], research_blocking: false, optimization_questions: ["선호 카페 분위기"] };
    window.renderAgentCaseDetail();
  });
  assert.equal(await detail.getByText("하니 최종 결론", { exact: true }).count(), 1);
  assert.equal(await detail.locator("[data-agent-answer]").count(), 0);
  assert.equal(await detail.locator('[data-agent-decision="APPROVE"]').isEnabled(), true);
  const readyOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(readyOverflow <= 2, `${name} READY horizontal overflow: ${readyOverflow}px`);
  await page.screenshot({ path: path.join(outputDir, `${name.replace("held", "ready")}.png`), fullPage: true });
  await page.close();
}

await verify({ width: 1440, height: 1000 }, "desktop-held");
await verify({ width: 390, height: 844 }, "mobile-390-held");
await browser.close();

const relevantErrors = errors.filter((line) => !/favicon|ERR_ABORTED|Failed to fetch|Cloud/i.test(line));
assert.deepEqual(relevantErrors, [], `Unexpected browser errors:\n${relevantErrors.join("\n")}`);
console.log("Meeting Engine v2 UI smoke: desktop + mobile PASS");
