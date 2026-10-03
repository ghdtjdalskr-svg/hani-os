import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";
import { CHARACTER_REGISTRY, characterProfile, characterVoicePrompt, compactCharacterPolicy, VOICE_MODES } from "../supabase/functions/_shared/character-voice.mjs";
import { compactPersonaPolicy, effectiveStyleWeights } from "../supabase/functions/hani-newsroom-publisher/comment-persona.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = relative => fs.readFileSync(path.join(root, relative), "utf8");
const keys = ["hani", "haru", "hina", "jieun", "minji", "naeun", "sooyeon", "sua", "yuna"];
assert.deepEqual(Object.keys(CHARACTER_REGISTRY).sort(), keys);
assert.deepEqual(VOICE_MODES, ["DIRECT_CHAT", "MONTHLY_REPORT", "BOARDROOM", "LIVING_OFFICE", "NEWSROOM"]);
assert.equal(characterProfile("NAUEN"), CHARACTER_REGISTRY.naeun);
assert.equal(characterProfile("SUYEON"), CHARACTER_REGISTRY.sooyeon);
assert.equal(characterProfile("unknown"), null);
assert.equal(characterProfile("toString"), null);
assert.equal(characterProfile("__proto__"), null);
assert.equal(characterProfile(" HANI "), CHARACTER_REGISTRY.hani);
assert.equal(characterVoicePrompt("unknown"), "");
assert.equal(characterVoicePrompt("hani", "INVALID"), characterVoicePrompt("hani", "DIRECT_CHAT"));
assert.throws(() => { CHARACTER_REGISTRY.hani.address_rules.BOARDROOM = "changed"; }, TypeError);
assert.throws(() => { CHARACTER_REGISTRY.hina.signature_phrases.push("changed"); }, TypeError);
for (const key of keys) {
  const profile = CHARACTER_REGISTRY[key];
  for (const field of ["identity", "personality", "domain_authority", "decision_style", "relationship_style", "address_rules", "voice_modes", "signature_phrases", "humor_level", "seriousness_rules", "avoid_phrases", "relationship_notes"]) {
    assert.ok(profile[field], key + ": missing " + field);
  }
  for (const mode of VOICE_MODES) {
    const prompt = characterVoicePrompt(key, mode);
    assert.match(prompt, /사실·안전·권한 > 담당 영역의 해석/);
    assert.ok(prompt.includes(profile.voice_modes[mode]), key + ": " + mode + " mode not applied");
    assert.ok(prompt.length < 1700, key + ": prompt too long");
  }
}
assert.match(characterVoicePrompt("sua", "BOARDROOM"), /호칭: 대표님/);
assert.match(characterVoicePrompt("yuna", "BOARDROOM"), /추측해서 넣지는 않을게요|모르는 값은 빈칸/);
assert.match(characterVoicePrompt("naeun", "MONTHLY_REPORT", true), /유머는 사용하지 않는다/);
assert.match(characterVoicePrompt("hina", "MONTHLY_REPORT"), /지은을 언니라고 부르지 않는다/);
assert.notEqual(characterVoicePrompt("naeun", "DIRECT_CHAT"), characterVoicePrompt("naeun", "BOARDROOM"));

const newsroom = compactPersonaPolicy();
const canonical = compactCharacterPolicy("NEWSROOM");
for (const key of keys) {
  assert.equal(newsroom[key].authority, canonical[key].authority);
  assert.equal(newsroom[key].say, canonical[key].say);
  assert.ok(Object.keys(effectiveStyleWeights(key, true)).every(style => !["REACTION", "LIGHT", "LIFE", "TREND"].includes(style)));
}
assert.equal(newsroom.nauen, newsroom.naeun);
assert.equal(newsroom.suyeon, newsroom.sooyeon);

const orchestrator = source("supabase/functions/hani-agent-orchestrator/index.ts");
const publisher = source("supabase/functions/hani-newsroom-publisher/index.ts");
const followup = source("supabase/functions/hani-company-followup/index.ts");
for (const ts of [orchestrator, publisher, followup]) {
  const js = stripTypeScriptTypes(ts, { mode: "strip" }).replace(/^import .*;$/gm, "");
  assert.doesNotThrow(() => new Function(js), "Edge Function source must parse after type stripping");
  assert.doesNotMatch(ts, /(?:sk-proj-|sb_secret_|ghp_)[A-Za-z0-9_-]{20,}/, "No embedded credential values");
}
for (const relative of ["supabase/functions/hani-agent-orchestrator/index.ts", "supabase/functions/hani-newsroom-publisher/index.ts", "supabase/functions/hani-newsroom-publisher/comment-persona.mjs", "supabase/functions/hani-company-followup/index.ts"]) {
  for (const match of source(relative).matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(relative), match[1])), "Missing local import: " + relative + " -> " + match[1]);
  }
}
const adapterSource = orchestrator.slice(orchestrator.indexOf("function meetingVoicePrompt("), orchestrator.indexOf("\nconst AGENT_BEHAVIOR:"));
const adapterJs = stripTypeScriptTypes(adapterSource, { mode: "strip" });
const meetingVoice = new Function("characterProfile", "characterVoicePrompt", adapterJs + "\nreturn meetingVoicePrompt;")(characterProfile, characterVoicePrompt);
for (const key of keys) {
  assert.ok(meetingVoice(key).includes(characterVoicePrompt(key, "BOARDROOM")));
  for (const risk of ["HIGH", "CRITICAL", "high"]) {
    assert.match(meetingVoice(key, risk), /유머는 사용하지 않는다/);
  }
}
assert.equal(meetingVoice("unknown"), "");
assert.match(meetingVoice("hani"), /실제 제공된 다른 Agent 의견에만 반응/);
assert.match(meetingVoice("hani"), /가상의 반론·합의·대화를 만들지 않/);
assert.match(orchestrator, /meetingVoicePrompt\(agent\?\.agent_key, existingCase\?\.risk_level\)/);
assert.match(orchestrator, /meetingVoicePrompt\("HANI", existingCase\?\.risk_level\)/);
assert.match(orchestrator, /meetingVoicePrompt\(speaker.agent_key, existingCase\?\.risk_level\)/);
assert.match(orchestrator, /agentSystemPrompt\(agent, existingCase\)/);
assert.match(orchestrator, /compactCharacterPolicy\("NEWSROOM"\)/);
assert.match(publisher, /compactPersonaPolicy\(\)/);
assert.match(publisher, /characterVoicePrompt\("hani", "NEWSROOM", true\)/);
assert.match(followup, /compactCharacterPolicy\("NEWSROOM"\)/);
assert.doesNotMatch(orchestrator, /AGENT_VOICE/);
console.log("Character Voice Registry: 9 agents, 5 modes, Edge paths, and risk gates PASS");
