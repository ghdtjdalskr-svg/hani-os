import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(new URL("../hani-main.js",import.meta.url),"utf8");
const officeSource=fs.readFileSync(new URL("../hani-office-live.js",import.meta.url),"utf8");
const personStart=officeSource.indexOf("function personKey(value){");
const personEnd=officeSource.indexOf("const statusPools=",personStart);
assert.ok(personStart>0&&personEnd>personStart,"office identity boundary must exist");
const personKey=vm.runInNewContext(`${officeSource.slice(personStart,personEnd)};personKey`);
assert.equal(personKey("SUYEON"),"sooyeon");
assert.equal(personKey("SOOYEON"),"sooyeon");
assert.equal(personKey("NAEUN"),"naeun");
assert.equal(personKey("JIEUN"),"jieun");
const start=source.indexOf("async function agentSubmitNewRequest(){");
const end=source.indexOf("async function agentReviewInit(){",start);
assert.ok(start>0&&end>start,"canonical submission owner must exist");
const submission=source.slice(start,end);

function deferred(){let resolve;const promise=new Promise(done=>{resolve=done});return {promise,resolve}}
function scenario({preflightStatus="READY",humanQuestions=[]}={}){
  const review=deferred(),stages=[],calls=[],input={value:"10월 여행 검토"},detail={innerHTML:""};
  const context={
    agentLiveCaseId:"",agentActiveCaseId:"",agentDetailCache:null,
    HANI_DISPLAY_VERSION:"test",AGENT_READINESS_LABELS:{},
    window:{haniOfficeLiveStage:payload=>stages.push(structuredClone(payload))},
    $:id=>({agentRequestInput:input,agentCaseDetail:detail}[id]||null),
    agentObj:value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{},
    agentArray:value=>Array.isArray(value)?value:[],
    agentBuildInternalContext:()=>({}),agentTitleFromText:value=>value,
    agentRouterLabel:()=>"test",agentSetBusy:()=>{},haniWorkHide:()=>{},toast:()=>{},
    confirm:()=>true,alert:message=>{throw new Error(message)},console,
    agentLoadCases:async()=>{context.agentDetailCache={case:{id:"case-1",status:humanQuestions.length?"HELD":"AWAITING_APPROVAL",verification:{decision_status:preflightStatus}},reviews:[]}},
    agentApi:async(action)=>{
      calls.push(action);
      if(action==="classify_request")return {router:{primary_intent:"GENERAL_REVIEW",external_research:"NONE"}};
      if(action==="create_case")return {case:{id:"case-1",title:"10월 여행 검토",status:"DRAFT"}};
      if(action==="route_case")return {case:{id:"case-1",status:"ANALYZING"},selected_agents:[{agent_key:"JIEUN"},{agent_key:"SOOYEON"}]};
      if(action==="run_reviews")return review.promise;
      if(action==="preflight_case")return {verification:{decision_status:preflightStatus},human_required_questions:humanQuestions,research_required_items:[]};
      if(action==="verify_and_synthesize")return {ok:true};
      throw new Error(`unexpected action ${action}`);
    }
  };
  vm.createContext(context);
  vm.runInContext(`${submission}\nthis.submit=agentSubmitNewRequest;`,context);
  return {context,review,stages,calls,input,detail};
}

for(const options of [{},{preflightStatus:"NEED_USER_INFO",humanQuestions:["여행 날짜는?"]}]){
  const test=scenario(options),run=test.context.submit();
  for(let i=0;i<20&&!test.calls.includes("run_reviews");i++)await new Promise(setImmediate);
  assert.deepEqual(test.calls.slice(0,4),["classify_request","create_case","route_case","run_reviews"]);
  assert.ok(test.stages.some(item=>item.stage==="SUMMONING"&&item.selected_agents.length===2));
  assert.ok(test.stages.some(item=>item.stage==="MEETING_ROUND_1"));
  assert.ok(test.stages.every(item=>item.reviews.length===0),"no opinion may appear before review completion");
  test.review.resolve({reviews:[{agent_key:"JIEUN",review_round:1,summary:"실제 저장된 응답"}]});
  await run;
  assert.ok(test.stages.some(item=>item.stage==="REVIEW_COMPLETE"&&item.reviews.length===1));
  assert.equal(test.stages.at(-1).stage,options.humanQuestions?.length?"NEED_USER_INFO":"READY");
  assert.equal(test.context.agentLiveCaseId,"");
}

const answerStart=source.indexOf("async function agentSubmitAnswers(){");
assert.ok(answerStart>0&&answerStart<start,"same-case answer owner must exist");
const answerSource=source.slice(answerStart,start);
{
  const stages=[],calls=[],previous={case:{id:"case-1",context:{router_v2:{external_research:"NONE"}}},reviews:[{agent_key:"JIEUN",review_round:1,summary:"기존 검토"}]};
  const context={
    agentDetailCache:previous,agentActiveCaseId:"case-1",agentLiveCaseId:"",agentSetBusy:()=>{},
    window:{haniOfficeLiveStage:payload=>stages.push(structuredClone(payload))},
    document:{querySelectorAll:()=>[{dataset:{agentQuestion:"숙소 지역은?"},value:"하카타역 근처"}]},
    $:id=>id==="agentAdditionalCondition"?{value:""}:null,
    agentArray:value=>Array.isArray(value)?value:[],agentObj:value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{},
    agentLatestReviewRound:reviews=>Math.max(0,...reviews.map(review=>review.review_round)),
    agentLoadCases:async({selectId})=>{assert.equal(selectId,"case-1");context.agentDetailCache={case:{id:"case-1",status:"AWAITING_APPROVAL",verification:{decision_status:"READY"}},reviews:[...previous.reviews,{agent_key:"SOOYEON",review_round:2,summary:"추가 답변 반영"}]}},
    agentApi:async(action,payload)=>{calls.push({action,payload});if(action==="run_reviews")return {reviews:[{agent_key:"SOOYEON",review_round:2,summary:"추가 답변 반영"}]};return {ok:true}},
    confirm:()=>true,alert:message=>{throw new Error(message)},console,
    stageLabelsFallback:()=>"REVIEW_COMPLETE"
  };
  vm.createContext(context);
  vm.runInContext(`${answerSource}\nthis.submitAnswer=agentSubmitAnswers;`,context);
  await context.submitAnswer();
  assert.deepEqual(calls.map(call=>call.action),["apply_representative_context","run_reviews","verify_and_synthesize"]);
  assert.ok(calls.every(call=>call.payload.case_id==="case-1"),"representative answer must stay in the same Case");
  assert.equal(calls[0].payload.representative_context.qa[0].answer,"하카타역 근처");
  assert.equal(calls[1].payload.review_round,2);
  assert.ok(stages.some(item=>item.stage==="REVIEW_COMPLETE"&&item.reviews.length===2));
  assert.equal(stages.at(-1).stage,"READY");
  assert.equal(context.agentLiveCaseId,"");
}
console.log("Boardroom live meeting: routed summon, identity aliases, honest review timing, same-case answers PASS");
