import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "hani-boardroom-cross-test-"));
try {
  const sourcePath = execFileSync(process.execPath, [path.join(root, "scripts/hani-boardroom-rebuild-edge.mjs"), temp], { cwd: root, encoding: "utf8" }).trim();
  const source = fs.readFileSync(sourcePath, "utf8");
  const helperStart = source.indexOf("const CROSS_REVIEW_TURN_SCHEMA =");
  const helperEnd = source.indexOf("async function runVerification(", helperStart);
  const routeStart = source.indexOf('if (action === "run_cross_review") {');
  const routeEnd = source.indexOf('if (action === "verify_and_synthesize") {', routeStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart && routeStart >= 0 && routeEnd > routeStart);
  const code = stripTypeScriptTypes(`${source.slice(helperStart, helperEnd)}\nasync function invoke(action,body){${source.slice(routeStart, routeEnd)}}\ninvoke`, { mode: "strip" });
  const events = [], calls = [];
  const caseRow = { id: "case-1", status: "REVIEW_COMPLETE", title: "노트북 교체", risk_level: "LOW", source_text: "노트북을 바꿀까?", context: {}, routing: { selected_agents: [{ agent_key: "JIEUN" }, { agent_key: "HARU" }] } };
  const reviews = [
    { agent_key: "JIEUN", review_round: 1, role: "FINANCE", verdict: "CONDITIONAL", summary: "예산 안이지만 교체 효용 확인 필요" },
    { agent_key: "HARU", review_round: 1, role: "LIFE", verdict: "DELAY", summary: "현재 제품으로도 사용 가능" },
  ];
  function query(table, row=null) {
    const filters = {};
    const q = {
      select(){return q}, eq(key,value){filters[key]=value;return q}, order(){return q},
      limit(){return q}, insert(value){return query(table,value)},
      single(){return Promise.resolve(finish())}, then(resolve,reject){return Promise.resolve(finish()).then(resolve,reject)},
    };
    function finish(){
      if(row){assert.equal(table,"hani_agent_events");const event={id:`event-${events.length+1}`,payload:row.payload,event_type:row.event_type};events.push(event);return {data:{id:event.id},error:null}}
      if(table==="hani_agent_cases")return {data:caseRow,error:null};
      if(table==="hani_agent_reviews")return {data:reviews,error:null};
      if(table==="hani_agent_events")return {data:events.filter(e=>e.event_type===filters.event_type).reverse(),error:null};
      throw new Error(`Unexpected table ${table}`);
    }
    return q;
  }
  const context = {
    Deno:{env:{get:()=>"test-key"}},admin:{from:table=>query(table)},auth:{user:{id:"user-1"}},
    cleanText:(value,max)=>String(value??"").slice(0,max),asObject:value=>value&&typeof value==="object"?value:{},
    compactContextForAgentReview:value=>value,meetingVoicePrompt:key=>`voice ${key}`,
    usageTotals:()=>({total_tokens:42}),json:(value,status=200)=>({status,...value}),
    callStructuredJson:async (_key,name,_schema,_instructions,input)=>{
      calls.push({name,input:JSON.parse(input)});
      if(name==="hani_cross_review_summary")return {parsed:{agreement:"예산 안",disagreement:"교체 효용",missing_condition:"사용 빈도",next_decision:"빈도를 확인"}};
      return {parsed:{stance:calls.length===1?"QUALIFY":"DISAGREE",content:calls.length===1?"하루의 교체 효용 우려를 예산 판단과 분리해야 합니다.":"지은의 예산 조건은 맞지만 사용 빈도 근거가 부족합니다.",unresolved:true,source_refs:[]}};
    },
  };
  const invoke = vm.runInNewContext(code, context);
  const first = await invoke("run_cross_review",{case_id:"case-1",review_round:1});
  assert.equal(first.status,200);assert.equal(first.reused,false);assert.equal(events.length,1);
  assert.equal(first.conversation.turns.length,2);assert.equal(calls.length,3);
  assert.equal(calls[0].input.target_ref,"review:HARU");
  assert.equal(calls[1].input.target_ref,"turn:1");
  assert.equal(first.conversation.turns[1].reply_to,"turn:1");
  assert.equal(first.conversation.hani_issue_summary.disagreement,"교체 효용");
  assert.equal(caseRow.status,"REVIEW_COMPLETE");assert.equal(reviews.length,2);
  const retry = await invoke("run_cross_review",{case_id:"case-1",review_round:1});
  assert.equal(retry.reused,true);assert.equal(calls.length,3);assert.equal(events.length,1);
  context.callStructuredJson=async()=>{throw new Error("model unavailable")};
  const failure=await invoke("run_cross_review",{case_id:"case-1",review_round:2});
  assert.equal(failure.status,502);assert.equal(failure.first_round_reviews_preserved,true);
  assert.equal(events.length,1);assert.equal(reviews.length,2);
  console.log("Boardroom cross-review: real prior-turn references, event save, retry reuse, review preservation PASS");
} finally {
  const resolved=path.resolve(temp),tempRoot=path.resolve(os.tmpdir())+path.sep;
  if(!resolved.startsWith(tempRoot)||!path.basename(resolved).startsWith("hani-boardroom-cross-test-"))throw new Error("Unsafe temporary cleanup path");
  fs.rmSync(resolved,{recursive:true,force:true});
}
