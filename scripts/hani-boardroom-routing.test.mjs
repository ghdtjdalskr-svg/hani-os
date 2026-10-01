import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";

const sourcePath = process.argv[2];
assert.ok(sourcePath, "pass rebuilt Edge Function source path");
const source = fs.readFileSync(sourcePath, "utf8");
const objectStart = source.indexOf("function asObject(value:");
const objectEnd = source.indexOf("function cleanText(value:", objectStart);
const routingStart = source.indexOf("type RouteMember =");
const routingEnd = source.indexOf("function extractOpenAIOutputText(", routingStart);
assert.ok(objectStart > 0 && objectEnd > objectStart && routingStart > 0 && routingEnd > routingStart);
const code = stripTypeScriptTypes(`${source.slice(objectStart, objectEnd)}\n${source.slice(routingStart, routingEnd)}\nthis.buildRouting=buildRouting;this.explicitlyRequestedAgents=explicitlyRequestedAgents;`);
const context = {};
vm.runInNewContext(code, context);
const route = (source_text, workflow = "GENERAL_REVIEW", domains = ["PREFERENCE"]) => context.buildRouting({
  workflow, risk_level: "LOW", title: "QA 회의 안건", source_text,
  context: { router_v2: { context_domains: domains } },
});
const keys = routing => Array.from(routing.selected_agents, agent => agent.agent_key);

const qa = route("[QA] 하니, 수아, 지은의 관점으로 간단히 검토해 주세요. 실제 결재나 저장 행동은 하지 않습니다.");
assert.deepEqual(Array.from(qa.requested_agents), ["HANI", "SUA", "JIEUN"]);
assert.deepEqual(keys(qa), ["HANI", "SUA", "JIEUN", "MINJI"]);
assert.equal(qa.capacity_conflict, null);
assert.ok(qa.selected_agents.find(agent => agent.agent_key === "SUA").required);
assert.deepEqual(keys(route("회의 결과를 정리해 주세요.")), ["HANI", "MINJI"], "unmentioned routing stays unchanged");
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("지은은 빼고 수아의 의견을 함께 검토해 줘.")), ["SUA"]);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("지은은 회의에 참여시키지 말고 수아를 불러 검토해 줘.")), ["SUA"]);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("지은 없이 수아의 의견을 검토해 줘.")), ["SUA"]);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("지은과 수아는 제외하고 히나만 불러 검토해 줘.")), ["HINA"]);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("지은을 불러 검토하고 수아는 제외해 줘.")), ["JIEUN"]);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("하루 동안 회의 내용을 검토해 줘.")), []);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("하루만 회의 내용을 검토해 줘.")), []);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("하루만 불러 회의해 줘.")), ["HARU"]);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("HANI, SUA, JIEUN의 관점으로 검토해 줘.")), ["HANI", "SUA", "JIEUN"]);
assert.deepEqual(Array.from(context.explicitlyRequestedAgents("하니네 사무실을 검토해 줘.")), []);

const travel = route("히나, 수아, 유나를 회의에 불러 검토해 줘.", "TRAVEL_REVIEW", []);
assert.ok(travel.capacity_conflict, "required travel specialists plus three named experts exceed the pilot cap");
assert.equal(travel.capacity_conflict.required_agents, 6);
assert.equal(travel.capacity_conflict.max_cross_review_experts, 3);
console.log("PASS: explicit participant routing, exclusions, normal routing, and capacity guard");
