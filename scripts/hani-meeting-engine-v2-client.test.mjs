import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "hani-main.js"), "utf8");
const start = source.indexOf("const AGENT_READINESS_LABELS=");
const end = source.indexOf("function agentTimelineHtml", start);
assert.ok(start >= 0 && end > start, "Decision Readiness helpers must exist");

const moduleBox = { exports: {} };
vm.runInNewContext(
  `const agentArray=v=>Array.isArray(v)?v:[];\n` +
    `const agentObj=v=>v&&typeof v===\"object\"&&!Array.isArray(v)?v:{};\n` +
    source.slice(start, end) +
    `\nmodule.exports={agentQuestionItems,agentDecisionReadiness};`,
  { module: moduleBox },
);
const { agentQuestionItems, agentDecisionReadiness } = moduleBox.exports;

const baseCase = { status: "ANALYZING", verification_status: "PENDING" };

// CASE A: missing trip essentials stay blocked and the UI pages only 1-2 questions.
const caseA = agentDecisionReadiness(baseCase, {}, {
  human_required_questions: ["출발일은 언제인가요?", "며칠 일정인가요?", "예산은 얼마인가요?"],
});
assert.equal(caseA.status, "NEED_USER_INFO");
assert.equal(caseA.blocking.length, 3);
assert.match(source, /asking=blocking\.slice\(0,2\)/);

// CASE B: no safe conclusion is represented as HOLD, never implicit READY.
const caseB = agentDecisionReadiness(baseCase, {}, {});
assert.equal(caseB.status, "HOLD");
assert.equal(caseB.ready, false);

// CASE C: answers resume the same Case and never create a replacement Case.
const submitStart = source.indexOf("async function agentSubmitAnswers");
const submitEnd = source.indexOf("async function agentSubmitNewRequest", submitStart);
const submitBody = source.slice(submitStart, submitEnd);
assert.match(submitBody, /apply_representative_context",\{case_id:c\.id/);
assert.match(submitBody, /run_reviews",\{case_id:c\.id/);
assert.doesNotMatch(submitBody, /create_case/);

// CASE D: optional preference gaps do not block a verified decision.
const optional = agentQuestionItems(
  { human_required_questions: [{ question: "선호 카페 종류", kind: "OPTIONAL" }] },
  {},
);
assert.equal(optional[0].kind, "OPTIONAL");
const caseD = agentDecisionReadiness(
  { status: "AWAITING_APPROVAL", verification_status: "PASS" },
  { ready_for_decision: true },
  { human_required_questions: optional },
);
assert.equal(caseD.status, "READY");
assert.equal(caseD.blocking.length, 0);

const nonBlockingResearch = agentDecisionReadiness(
  { status: "AWAITING_APPROVAL", verification_status: "PASS" },
  { ready_for_decision: true, representative_questions: ["지난 라운드의 질문"] },
  { human_required_questions: [], research_required_items: ["실행 직전 가격 재확인"], research_blocking: false },
);
assert.equal(nonBlockingResearch.status, "READY");
assert.equal(nonBlockingResearch.blocking.length, 0);
const explicitHold = agentDecisionReadiness(
  { status: "HELD", verification_status: "PASS" },
  { ready_for_decision: true },
  { human_required_questions: [], decision_status: "HOLD" },
);
assert.equal(explicitHold.ready, false);

// A stale or inconsistent server READY cannot override a current blocker.
const guarded = agentDecisionReadiness(
  { status: "AWAITING_APPROVAL", verification_status: "PASS" },
  { ready_for_decision: true },
  { decision_status: "READY", human_required_questions: ["숙소 지역은 어디인가요?"] },
);
assert.equal(guarded.status, "NEED_USER_INFO");
assert.equal(guarded.ready, false);

assert.doesNotMatch(source, /force_finalize_with_current_context\s*:\s*nextRound\s*>=\s*3/);
assert.match(source, /canApprove=canDecide/);
assert.match(source, /if\(decision==="APPROVE"\).*?if\(!readiness\.ready\)/s);

console.log("Meeting Engine v2 Batch 1 scenarios A-D: PASS");
