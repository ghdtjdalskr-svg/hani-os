import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hani-meeting-voice-"));
const serverPath = path.join(tempRoot, "supabase/functions/hani-agent-orchestrator/index.ts");
fs.mkdirSync(path.dirname(serverPath), { recursive: true });
process.on("exit", () => fs.rmSync(tempRoot, { recursive: true, force: true }));

const baseline = execFileSync("git", ["show", "cd90dada4e068e0d68c39e6bd8cee34b3f09e9ac:supabase/functions/hani-agent-orchestrator/index.ts"], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
fs.writeFileSync(serverPath, baseline);
for (const file of [
  "docs/hani-agent-orchestrator-v46-baseline.patch",
  "docs/hani-agent-orchestrator-meeting-engine-v2-batch1.patch",
  "docs/hani-agent-orchestrator-meeting-voice.patch",
]) execFileSync("git", ["apply", "--ignore-space-change", "--ignore-whitespace", "--whitespace=nowarn", path.join(root, file)], { cwd: tempRoot });

const server = fs.readFileSync(serverPath, "utf8").replace(/\r\n/g, "\n");
const patchText = fs.readFileSync(path.join(root, "docs/hani-agent-orchestrator-meeting-voice.patch"), "utf8");
const voiceStart = server.indexOf("type MeetingVoiceProfile");
const voiceEnd = server.indexOf("const AGENT_BEHAVIOR", voiceStart);
assert.ok(voiceStart >= 0 && voiceEnd > voiceStart, "canonical Meeting Voice map must exist");
const voiceSource = stripTypeScriptTypes(server.slice(voiceStart, voiceEnd), { mode: "strip" });
const { AGENT_VOICE, meetingVoicePrompt } = new Function(`${voiceSource}; return { AGENT_VOICE, meetingVoicePrompt };`)();

assert.deepEqual(Object.keys(AGENT_VOICE).sort(), ["HANI", "HARU", "HINA", "JIEUN", "MINJI", "NAEUN", "SUA", "SUYEON", "YUNA"]);
const prompts = Object.fromEntries(Object.keys(AGENT_VOICE).map((key) => [key, meetingVoicePrompt(key)]));

// A. Finance
assert.match(prompts.JIEUN, /숫자·현금흐름|금액과 흐름/);
assert.notEqual(prompts.JIEUN, prompts.HARU);
// B. Health
assert.match(prompts.NAEUN, /친근|건강 위험/);
assert.match(prompts.NAEUN, /단호|제동/);
// C. Learning
assert.match(prompts.HINA, /공부·일본어·대학/);
assert.match(prompts.HINA, /전문 지식을 부정확하게 만들기/);
// D. Business / Cloud / CX
assert.match(prompts.SUA, /고객 관점·책임범위|Vendor/);
assert.match(prompts.SUA, /계약·Cloud·보안/);
// E. Relationship and actual response
assert.match(prompts.HARU, /JIEUN/);
assert.match(prompts.HANI, /상대의 이름과 논점을 짚어 동의·반론·보완/);
// F. HANI Final
assert.match(server, /executive_summary는 딱딱한 AI 보고서 문구를 피하고/);
assert.match(server, /전문가의 이름과 논점을 연결/);
// G. Risk lowers humor
assert.match(prompts.SUA, /유머를 0~5%로 낮춘다/);
assert.match(prompts.SUA, /Cloud 장애·계약·재무손실·건강위험·보안·데이터손실/);
// H. Anti-repetition
assert.match(prompts.HINA, /같은 캐치프레이즈를 연속 사용하지 않는다/);
assert.match(prompts.HINA, /낮은 확률/);

for (const [key, prompt] of Object.entries(prompts)) {
  assert.ok(prompt.length < 1250, `${key} voice prompt must stay compact: ${prompt.length}`);
}
assert.match(server, /meetingVoicePrompt\(agent\?\.agent_key\)/);
assert.match(server, /meetingVoicePrompt\("HANI"\)/);
assert.doesNotMatch(patchText, /^\+.*(?:route_case|applyDecisionReadinessGate|representative_decision|\.from\(|\.insert\(|\.update\(|\.upsert\(|\.delete\()/m);

console.log("Meeting Character Voice A-H targeted QA: PASS");
console.log(`Voice prompt chars: min ${Math.min(...Object.values(prompts).map((x) => x.length))}, max ${Math.max(...Object.values(prompts).map((x) => x.length))}`);
