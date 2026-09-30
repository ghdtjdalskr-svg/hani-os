import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "hani-boardroom-voice-"));
const sourcePath = path.join(temp, "supabase/functions/hani-agent-orchestrator/index.ts");
fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
process.on("exit", () => fs.rmSync(temp, { recursive: true, force: true }));
fs.writeFileSync(sourcePath, execFileSync("git", ["show", "cd90dada4e068e0d68c39e6bd8cee34b3f09e9ac:supabase/functions/hani-agent-orchestrator/index.ts"], { cwd: root }));
for (const patch of [
  "hani-agent-orchestrator-v46-baseline.patch",
  "hani-agent-orchestrator-meeting-engine-v2-batch1.patch",
  "hani-agent-orchestrator-meeting-voice.patch",
  "hani-agent-orchestrator-boardroom-voice.patch",
]) execFileSync("git", ["apply", "--ignore-space-change", "--ignore-whitespace", "--whitespace=nowarn", path.join(root, "docs", patch)], { cwd: temp });

const source = fs.readFileSync(sourcePath, "utf8");
const start = source.indexOf("type MeetingVoiceProfile");
const end = source.indexOf("const AGENT_BEHAVIOR", start);
assert.ok(start >= 0 && end > start);
const voiceCode = stripTypeScriptTypes(source.slice(start, end), { mode: "strip" });
const { AGENT_VOICE, meetingVoicePrompt } = new Function(`${voiceCode}; return { AGENT_VOICE, meetingVoicePrompt };`)();
assert.deepEqual(Object.keys(AGENT_VOICE).sort(), ["HANI", "HARU", "HINA", "JIEUN", "MINJI", "NAEUN", "SUA", "SUYEON", "YUNA"]);
for (const [key, profile] of Object.entries(AGENT_VOICE)) {
  assert.ok(profile.domain_authority && profile.boardroom_address, `${key} needs domain and address rules`);
  const prompt = meetingVoicePrompt(key);
  assert.match(prompt, /대표님/);
  assert.match(prompt, /실제 제공된 다른 Agent 의견에만 반응/);
  assert.match(prompt, /사실·숫자·조사결과/);
  assert.match(prompt, /억지 합의를 만들지 않는다/);
}
assert.match(meetingVoicePrompt("HINA"), /지은 언니 같은 자동 연공서열 호칭을 쓰지 않는다/);
assert.match(meetingVoicePrompt("SUA"), /Vendor 사실은 확인 전 확정하지 않는다/);
assert.match(meetingVoicePrompt("YUNA"), /빈 값을 추정하지 않고/);
assert.match(source, /HANI Final은 합의점·의미 있는 이견·남은 결정 조건·추천안과 대표의 다음 결정을 분리/);
assert.match(source, /Promise\.all\(\s*selectedAgents\.map/);
console.log("Boardroom voice contract: 9 profiles, address/domain/factual safeguards PASS");
console.log("Architecture check: first-round reviews remain parallel; true cross-review requires a later engine stage");
