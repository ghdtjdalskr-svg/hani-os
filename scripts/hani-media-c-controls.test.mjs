// node scripts/hani-media-c-controls.test.mjs [candidate-main.js]
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(process.argv[2]||new URL("../hani-main.js",import.meta.url),"utf8");
const start=source.indexOf("let mediaCBusy=");
const end=source.indexOf("function renderMediaPreview(){",start);
assert.ok(start>=0&&end>start,"C controls owner range present");
const candidate=source.slice(start,end);
const check=(ok,label)=>assert.ok(ok,label);
const makeApi=(sandbox,script)=>vm.runInContext("(function(){"+script+"})()",vm.createContext(sandbox));

function harness(verify=async()=>({count:1})){
  const elements=Object.fromEntries(["mediaRunC","mediaRollbackC","mediaCResult","mediaCDialog",
    "mediaCDevices","mediaCApprove","mediaCTitle","mediaCDescription"].map(id=>[id,{textContent:""}]));
  let checks=0,dialogs=0;
  elements.mediaCDevices.closest=()=>({hidden:false});
  elements.mediaCDialog.showModal=()=>{
    dialogs++;elements.mediaCDialog.returnValue="";elements.mediaCDialog.onclose();
  };
  const ctx={window:{HANI_MEDIA:{
      verifyRefs:async options=>{
        checks++;check(options.localOnly===true,"localOnly eligibility");
        check(options.guard()===true,"live identity guard");return verify(options)
      },
      digest:async data=>data==="data:image/png;base64,QQ=="?"ref":"different"
    }},state:{books:[{cover:"data:image/png;base64,QQ==",coverRef:"ref"}],movies:[]},
    cloudClient:{},cloudUser:{id:"owner"},cloudAutoSyncReady:true,cloudRuntime:{sync:"ON"},
    navigator:{onLine:true},mediaBBusy:false,loadRecovery:{active:false},
    importSyncHold:false,cloudRecoveryMode:false,
    $:id=>elements[id],mediaHasRefs:value=>value.books.some(row=>row.coverRef&&!row.cover)};
  const script=`function mediaBCanRun(){
    return !!(window.HANI_MEDIA&&cloudClient&&cloudUser?.id&&navigator.onLine!==false&&
      cloudAutoSyncReady&&cloudRuntime.sync==="ON"&&
      !loadRecovery.active&&!importSyncHold&&!cloudRecoveryMode);
  }
  `+candidate+`
  function renderMediaPreview(){renderMediaCControls()}
  return {render:renderMediaCControls,run:mediaRunC};
  `;
  const api=makeApi(ctx,script);
  return {ctx,api,elements,checks:()=>checks,dialogs:()=>dialogs};
}
const reject=message=>async()=>{throw Error(message)};
let pending;
const slow=harness(()=>new Promise(resolve=>{pending=resolve}));
slow.api.render();
check(slow.elements.mediaRunC.disabled===false,"unknown enabled");
const click=slow.elements.mediaRunC.onclick();
check(slow.checks()===1,"one verify");
check(slow.elements.mediaRunC.disabled===true,"busy disabled");
slow.api.render();slow.api.render();
await slow.api.run();
check(slow.checks()===1,"rerender/double click does not restart");
pending({count:1});await click;
check(slow.dialogs()===1,"success opens existing dialog");
check(slow.elements.mediaCResult.textContent.includes("이미지 보관을 확인했어요"),"success status");
slow.api.render();
check(slow.elements.mediaRunC.disabled===false,"rerender enabled");
for(const [message,expected] of [
  ["기기에 검증된 참조 이미지가 없습니다.","브라우저 저장공간"],
  ["Cloud 이미지 보관 목록이 누락됐습니다.","Cloud 보관함 목록"],
  ["잘못된 이미지 참조가 있습니다.","잘못된 이미지 참조"]
]){
  const env=harness(reject(message));
  env.api.render();await env.api.run();
  check(env.dialogs()===0,"failure no dialog");
  check(env.elements.mediaCResult.textContent.includes(expected),"specific reason");
  const reason=env.elements.mediaCResult.textContent;
  env.api.render();env.api.render();
  check(env.elements.mediaRunC.disabled===false,"failure still retryable");
  check(env.elements.mediaCResult.textContent===reason,"cached failure preserved");
  check(env.checks()===1,"render does not verify");
  env.ctx.state=JSON.parse(JSON.stringify(env.ctx.state));env.api.render();
  check(!env.elements.mediaCResult.textContent.includes(expected),"new identity invalidates");
}
const mismatch=harness(reject("기기에 검증된 참조 이미지가 없습니다."));
mismatch.ctx.state.books[0].cover="data:image/png;base64,Qg==";
await mismatch.api.run();
check(mismatch.elements.mediaCResult.textContent==="이미지 1장이 기록과 일치하지 않아요.","digest mismatch count");
check(mismatch.dialogs()===0,"mismatch no dialog");
const off=harness();off.ctx.cloudRuntime.sync="OFF";off.api.render();
check(off.elements.mediaRunC.disabled===false,"Cloud OFF responsive");
check(off.elements.mediaCResult.textContent.includes("Cloud 로그인/동기화"),"Cloud OFF reason");
await off.elements.mediaRunC.onclick();
check(off.elements.mediaCResult.textContent.includes("Cloud 로그인/동기화"),"Cloud OFF click reason");
check(off.checks()===0,"Cloud OFF no verify");
off.ctx.cloudRuntime.sync="ON";off.api.render();
check(off.elements.mediaRunC.disabled===false,"Cloud restored enabled");
off.ctx.state.books[0].cover="";off.api.render();
check(off.elements.mediaRunC.disabled===false,"no inline responsive");
await off.elements.mediaRunC.onclick();
check(off.elements.mediaCResult.textContent.includes("먼저 B단계"),"no inline click reason");
check(off.elements.mediaRollbackC.disabled===false,"rollback remains available");
let finish;
const drift=harness(()=>new Promise(resolve=>{finish=resolve}));
const driftClick=drift.api.run();
drift.ctx.state.books[0].cover="data:image/png;base64,Qg==";
finish({count:1});await driftClick;
check(drift.dialogs()===0,"in-place mutation aborts");
check(drift.elements.mediaCResult.textContent.includes("계정·기록·Cloud 상태가 변경"),"abort reason survives final render");

for(const [change,expected] of [
  [ctx=>{ctx.window.HANI_MEDIA=null},"이미지 보관 기능"],
  [ctx=>{ctx.navigator.onLine=false},"인터넷 연결"],
  [ctx=>{ctx.loadRecovery.active=true},"기록 복구·가져오기"],
  [ctx=>{ctx.importSyncHold=true},"기록 복구·가져오기"],
  [ctx=>{ctx.cloudUser=null},"Cloud 로그인/동기화"]
]){
  const blocked=harness();change(blocked.ctx);blocked.api.render();
  check(blocked.elements.mediaRunC.disabled===false,"blocked button responsive");
  await blocked.elements.mediaRunC.onclick();
  check(blocked.elements.mediaCResult.textContent.includes(expected),"blocked click Korean reason");
  check(blocked.checks()===0&&blocked.dialogs()===0,"blocked click has no verification or approval");
}
const retry=harness(reject("Cloud 이미지 보관 목록이 누락됐습니다."));
await retry.api.run();await retry.elements.mediaRunC.onclick();
check(retry.checks()===2,"explicit retry rechecks eligibility");
retry.ctx.cloudUser={id:"new-owner"};retry.api.render();
check(!retry.elements.mediaCResult.textContent.includes("목록을 확인하지"),"new owner invalidates cached failure");

console.log("media C controls: PASS");
