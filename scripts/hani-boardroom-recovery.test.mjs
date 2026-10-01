import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(new URL("../hani-main.js",import.meta.url),"utf8");
const start=source.indexOf("function agentCrossReviewResumeHtml(");
const end=source.indexOf("function agentApprovedWishDraft(",start);
assert.ok(start>0&&end>start,"cross-review recovery owner must exist");

const calls=[],stages=[];
const savedReviews=[{agent_key:"JIEUN",review_round:1,summary:"stored review"}];
const context={
  agentDetailCache:{case:{id:"case-1",status:"REVIEW_COMPLETE",context:{router_v2:{external_research:"NONE"}}},reviews:savedReviews,events:[]},
  agentLiveCaseId:"",agentSetBusy:()=>{},console,
  agentObj:value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{},
  agentArray:value=>Array.isArray(value)?value:[],
  agentLatestReviewRound:reviews=>Math.max(0,...reviews.map(review=>review.review_round)),
  window:{haniOfficeLiveStage:payload=>stages.push(payload)},
  agentApi:async(action,payload)=>{
    calls.push({action,payload});
    if(action==="run_cross_review")return {conversation:{review_round:1,turns:[{speaker:"JIEUN",content:"stored cross review"}]}};
    if(action==="preflight_case")return {verification:{decision_status:"READY"},human_required_questions:[],research_required_items:[]};
    if(action==="verify_and_synthesize")return {ok:true};
    throw new Error(`Unexpected recovery action: ${action}`);
  },
  agentLoadCases:async({selectId})=>{assert.equal(selectId,"case-1");context.agentDetailCache={...context.agentDetailCache,case:{...context.agentDetailCache.case,status:"AWAITING_APPROVAL"}}},
  alert:message=>{throw new Error(message)},
};
vm.createContext(context);
vm.runInContext(`${source.slice(start,end)}\nthis.resumeHtml=agentCrossReviewResumeHtml;this.resume=agentResumeCrossReview;`,context);
assert.match(context.resumeHtml(context.agentDetailCache.case,{},savedReviews,[]),/agentResumeCrossReview/);
assert.equal(context.resumeHtml({...context.agentDetailCache.case,status:"AWAITING_APPROVAL"},{},savedReviews,[]),"");
await context.resume();
assert.deepEqual(calls.map(call=>call.action),["run_cross_review","preflight_case","verify_and_synthesize"]);
assert.ok(calls.every(call=>call.payload.case_id==="case-1"));
assert.equal(stages.at(-1).stage,"READY");
assert.equal(context.agentLiveCaseId,"");
assert.equal(context.agentDetailCache.reviews,savedReviews,"stored independent reviews must be preserved");
console.log("Boardroom recovery: saved review continuation and same-case synthesis PASS");
