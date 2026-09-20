import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePatchPath = path.join(root, "docs/hani-agent-orchestrator-v46-baseline.patch");
const patchPath = path.join(root, "docs/hani-agent-orchestrator-meeting-engine-v2-batch1.patch");
const clientPath = path.join(root, "hani-main.js");
const patch = fs.readFileSync(patchPath, "utf8");
const baseline = execFileSync(
  "git",
  ["show", "cd90dada4e068e0d68c39e6bd8cee34b3f09e9ac:supabase/functions/hani-agent-orchestrator/index.ts"],
  { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);
const client = fs.readFileSync(clientPath, "utf8");
assert.match(patch, /v1\.8\.1 · Investment Newsroom/, "patch must target deployed v1.8.1");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hani-meeting-engine-v2-"));
const tempServer = path.join(tempRoot, "supabase/functions/hani-agent-orchestrator/index.ts");
fs.mkdirSync(path.dirname(tempServer), { recursive: true });
fs.writeFileSync(tempServer, baseline);
process.on("exit", () => fs.rmSync(tempRoot, { recursive: true, force: true }));
execFileSync("git", ["apply", baselinePatchPath], { cwd: tempRoot, stdio: "pipe" });
const deployedBaseline = fs.readFileSync(tempServer, "utf8").replace(/\r\n/g, "\n");
assert.equal(createHash("sha256").update(deployedBaseline.slice(0, -1)).digest("hex"),
  "fc36b8594ceff62fb6cdb8c3b51956ede4dd966b9e7297775554461a7decd16a",
  "baseline patch must reconstruct the exact deployed v46 source");
execFileSync("git", ["apply", patchPath], { cwd: tempRoot, stdio: "pipe" });
const server = fs.readFileSync(tempServer, "utf8").replace(/\r\n/g, "\n");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} closing brace not found`);
}

const gateSource = stripTypeScriptTypes(extractFunction(server, "applyDecisionReadinessGate"), { mode: "strip" });
const cleanText = (value, limit = 1000) => String(value ?? "").trim().slice(0, limit);
const asObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const applyDecisionReadinessGate = new Function(
  "cleanText",
  "asObject",
  `${gateSource}; return applyDecisionReadinessGate;`,
)(cleanText, asObject);

const base = {
  status: "NEEDS_DATA", summary: "", missing: [], decision_blockers: [],
  conditional_checks: [], optimization_questions: [], conflicts: [], anomalies: [],
  critical_anomalies: [], duplicates: [], existing_data_mismatch: [],
  consolidated_questions: [], human_required_questions: [], research_required_items: [],
  research_needed: false, research_blocking: false, research_items: [], blocker_reason: "",
};
const testCase = { context: { human_question_round_count: 0 } };

// CASE A: incomplete Osaka request asks only the top two blockers and does not become a Decision.
const osaka = applyDecisionReadinessGate({
  ...base,
  decision_blockers: ["여행 기간은 언제인가요?", "총예산은 얼마인가요?", "출발지는 어디인가요?"],
  human_required_questions: ["여행 기간은 언제인가요?", "총예산은 얼마인가요?", "출발지는 어디인가요?"],
}, testCase, 1);
assert.equal(osaka.decision_status, "NEED_USER_INFO");
assert.equal(osaka.ready_for_decision, false);
assert.equal(osaka.human_required_questions.length, 2);
assert.equal(osaka.same_case_resume, true);

const osakaAnswered = applyDecisionReadinessGate({ ...base, status: "PASS" }, {
  context: { human_question_round_count: 1, representative_answers: { qa: [{ question: "기간", answer: "3박4일" }] } },
}, 2);
assert.equal(osakaAnswered.decision_status, "READY");
assert.equal(osakaAnswered.ready_for_decision, true);

// CASE B: a critical unresolved fact produces HOLD, never an invented final answer.
const unsafe = applyDecisionReadinessGate({
  ...base, status: "FAIL", critical_anomalies: ["핵심 예약 날짜가 서로 충돌합니다."],
}, testCase, 2);
assert.equal(unsafe.decision_status, "HOLD");
assert.equal(unsafe.ready_for_decision, false);

// CASE D: optional preferences improve quality but never block a rational result.
const optionalCafe = applyDecisionReadinessGate({
  ...base, status: "PASS", optimization_questions: ["선호하는 카페 분위기가 있나요?"],
}, testCase, 1);
assert.equal(optionalCafe.decision_status, "READY");
assert.equal(optionalCafe.optional_information.length, 1);

// Structural contracts for CASE C and the server/client decision gate.
assert.match(server, /\["REVIEW_COMPLETE", "ANALYZING", "HELD"\]/, "HELD case must resume");
assert.match(server, /representative_answer_history: historyWithPrevious\.slice\(-12\)/, "answer history must be preserved");
assert.match(server, /if \(verification\.decision_status === "READY"/, "HANI synthesis must be readiness-gated");
assert.match(server, /const nextStatus = haniResult \? "AWAITING_APPROVAL" : "HELD"/, "non-ready case must HOLD");
assert.match(server, /if \(parsedHani\.ready_for_decision !== true\)/, "HANI must retain the final readiness veto");
assert.match(patch, /^-\s*parsedHani\.ready_for_decision = true;/m, "old forced readiness must be removed");
assert.doesNotMatch(server, /parsedHani\.ready_for_decision = true/, "patch must not reintroduce forced readiness");
assert.match(patch, /^-.*humanRounds >= 2 \|\| latestReviewRound >= 3/m, "old round limit must be removed");
assert.match(client, /additional_condition:additionalCondition/, "same-case additional condition must be accumulated");
assert.match(client, /\["REVIEW_COMPLETE","ANALYZING","HELD"\]/, "HELD clarification form must stay active");
assert.match(client, /canDecide=hasExecutive&&ready&&c\.status==="AWAITING_APPROVAL"/, "decision buttons require readiness");
assert.doesNotMatch(client, /prompt\(`하니가 한 가지만 확인할게요/, "clarification must not happen before Case creation");

console.log("Meeting Engine v2 Batch 1 scenarios A-D: PASS");
