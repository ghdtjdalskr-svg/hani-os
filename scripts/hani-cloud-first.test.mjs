// Real decision/cycle/apply/choice guards in a VM; synthetic data only, no external requests.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(process.argv[2]||new URL("../hani-main.js",import.meta.url),"utf8");
function block(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start+" anchor");return source.slice(a,b)}
const functions=[
  block("function cloudMeta(","function cloudSetRuntime("),
  block("function cloudHasMeaningfulLocalData(","function cloudLocalStatusLabel("),
  block("function cloudSaveSyncMeta(","async function cloudReadRow("),
  block("async function cloudSaveSafetySnapshot(","function cloudEmergencyResolved("),
  block("async function cloudApplyRemoteRow(","async function cloudPushLocalRow("),
  block("function cloudSyncDecision(","function cloudSyncSelfTest("),
  block("async function cloudSyncCycle(","function cloudBindLifecycle("),
  block("function cloudNeedsRestoreChoice(","function cloudClearComparison(")
].join("\n");
const clone=structuredClone,hash=x=>JSON.stringify(x),base={books:[{id:"baseline"}]};
let cases=0;
function fixture({local={books:[{id:"local",unknown:{kept:true}}]},remote={books:[{id:"cloud"}]},baseline=false,policy,revision=8}={}){
  const events=[],storage=new Map(),nodes=new Map();
  const node=()=>({hidden:false,open:false,textContent:"",children:[],replaceChildren(){this.children=[]},append(x){this.children.push(x)},close(){this.open=false}});
  const row={state:clone(remote),revision,updated_at:"2026-10-11T00:00:00Z",device:"phone"};
  const ctx=vm.createContext({console:{error(){},warn(){}},structuredClone,Date,Promise,JSON,Set,Map,Number,
    state:clone(local),cloudClient:{},cloudUser:{id:"owner"},cloudChoicePreview:null,
    cloudRecoveryMode:false,loadRecovery:{active:false},importSyncHold:false,lastLoadError:"held",
    cloudComparisonEpoch:0,cloudSyncBusy:false,cloudSyncPending:false,cloudApplyingRemote:false,cloudAutoSyncReady:false,
    cloudNetworkRetryPending:false,cloudVerifiedRemote:null,cloudRuntime:{},
    STORAGE_KEY:"protected",CLOUD_META_KEY:"meta",CLOUD_SAFETY_KEY:"safety",CLOUD_SYNC_ENGINE:5,CLOUD_HASH_SCHEMA:4,
    cloudLoadJson:(key,fallback)=>storage.has(key)?JSON.parse(storage.get(key)):fallback,
    cloudSaveJson:(key,value)=>{if(ctx.metaFailure)return false;storage.set(key,JSON.stringify(value));return true},
    localStorage:{getItem:key=>storage.get(key)??null,
      setItem(key,value){if(key==="safety"&&ctx.failSnapshot)throw Error("snapshot storage denied");storage.set(key,value)},
      removeItem:key=>storage.delete(key)},
    normalizeState:clone,cloudComparableState:x=>clone(x||{}),cloudMergeProtectedMedia:clone,
    cloudSyncFingerprintState:clone,cloudSame:(a,b)=>hash(a)===hash(b),freshState:()=>({accounts:[],goals:{},profile:{}}),
    cloudStateHash:async x=>hash(x),cloudSummaryText:()=>"synthetic",serializedBytes:x=>x.length,
    assertCloudSourceReady(){if(ctx.loadRecovery.active||ctx.importSyncHold)throw Error("held")},
    cloudReadRow:async()=>{events.push("read");if(ctx.onRead)await ctx.onRead();return clone(row)},
    cloudFetchMeta:async()=>{events.push("meta");return {revision:row.revision,updated_at:row.updated_at,device:row.device}},
    cloudRevisionNumber:x=>x===null||x===undefined?NaN:Number(x),
    cloudSyncSelfTest:()=>true,cloudIsLifecycleCheck:r=>["poll","focus","visible"].includes(r),
    cloudShouldFetchFullState:()=>!ctx.skipFull,cloudCanUseVerifiedRemote:()=>false,cloudIsNetworkFailure:()=>false,
    cloudRememberVerifiedRemote(){},cloudStartPolling(){events.push("polling")},
    cloudSetRuntime(status,message,tone,extra={}){ctx.cloudRuntime={status,message,...extra};ctx.cloudComparisonEpoch++;ctx.renderCloudChoice()},
    cloudStopAutoSync(message){ctx.cloudAutoSyncReady=false;ctx.cloudSetRuntime("stop",message,"warn",{sync:"STOP"})},
    safetyArchiveStatus:"",renderSafetyArchive(){},
    safetyArchiveWrite:async payload=>{events.push(["snapshot",clone(payload.state)]);if(ctx.onSnapshot)await ctx.onSnapshot();return {saved:!ctx.failSnapshot,retentionApplied:true}},
    writeProtectedState(raw){events.push("write");if(ctx.failWrite){ctx.failWrite=false;throw Error("write denied")}storage.set("protected",raw)},
    removeProtectedState(){events.push("rollback-remove");storage.delete("protected")},
    cloudPushLocalRow:async(remote,value)=>{assert.ok(ctx.cloudHasMeaningfulLocalData(value));events.push(["push",clone(value)]);row.state=clone(value);row.revision++;ctx.cloudSaveSyncMeta(row,hash(value));ctx.cloudRuntime.sync="ON"},
    cloudClearComparison(){ctx.cloudComparisonEpoch++},renderCloudPanel(){},renderAll(){},
    toast:x=>events.push(["toast",x]),setTimeout(){},
    formatDateTime:x=>x,cloudDeviceLabel:()=>"synthetic",$:(id)=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},document:{createElement:node}
  });
  vm.runInContext(functions,ctx);
  storage.set("protected",JSON.stringify(local));
  if(policy)storage.set("meta",JSON.stringify({syncPolicy:policy}));
  if(baseline)ctx.cloudSaveSyncMeta({revision:7},hash(base),{appliedRevision:7});
  return {ctx,row,events,storage,nodes};
}
const pushes=x=>x.events.filter(e=>Array.isArray(e)&&e[0]==="push");
const snapshots=x=>x.events.filter(e=>Array.isArray(e)&&e[0]==="snapshot");
async function adopt(options){
  const x=fixture(options),before=clone(x.ctx.state);
  x.ctx.onSnapshot=()=>{x.ctx.renderCloudChoice();assert.equal(x.nodes.get("cloudChoicePanel").hidden,true);assert.equal(x.nodes.get("cloudChoiceDialog").open,false)};
  await x.ctx.cloudSyncCycle("manual");
  assert.deepEqual(snapshots(x).map(e=>e[1]),[before],"entire Local archived once");
  assert.ok(x.events.findIndex(e=>Array.isArray(e)&&e[0]==="snapshot")<x.events.indexOf("write"),"snapshot before protected write");
  assert.deepEqual(x.ctx.state,x.row.state);assert.equal(x.ctx.cloudMeta().lastSyncedHash,hash(x.row.state));
  assert.equal(x.ctx.cloudMeta().appliedRevision,x.row.revision);assert.equal(x.ctx.cloudAutoSyncReady,true);
  assert.equal(x.ctx.cloudChoicePreview,null);assert.equal(x.nodes.get("cloudChoicePanel").hidden,true,"no prompt");
  assert.equal(pushes(x).length,0);assert.equal(x.row.revision,options?.revision??8,"Cloud unchanged");
  assert.equal(x.events.filter(e=>Array.isArray(e)&&e[0]==="toast").length,1);cases++;return x;
}
await adopt(); // No baseline, different nonempty states.
await adopt({baseline:true}); // Concurrent edits: Cloud wins, Local archived.
await adopt({local:{},baseline:false}); // Empty new device.
await adopt({local:{books:[],accounts:[],goals:{},profile:{},ui:{view:"home"}},baseline:true}); // Near-empty never pushes.
await adopt({local:clone(base),baseline:true}); // Remote-only edit.
let x=fixture();const before=x.storage.get("protected");x.ctx.failSnapshot=true;await x.ctx.cloudSyncCycle();
assert.equal(x.ctx.cloudRuntime.sync,"STOP");assert.equal(x.events.includes("write"),false);assert.equal(x.storage.get("protected"),before);assert.equal(x.storage.has("meta"),false);cases++;
x=fixture({local:{books:[{id:"local-new"}]},remote:clone(base),baseline:true,revision:7});await x.ctx.cloudSyncCycle("local-save");
assert.deepEqual(pushes(x).map(e=>e[1]),[x.ctx.state]);assert.equal(snapshots(x).length,0);assert.equal(x.row.revision,8);cases++;
x=fixture({local:{books:[{id:"local-new"}]},remote:clone(base),baseline:true,revision:9});await x.ctx.cloudSyncCycle("local-save");
assert.equal(pushes(x).length,1,"revision-only change preserves real Local work");cases++;
for(const options of [{baseline:true},{local:{}}]){
  x=fixture({...options,policy:"manual"});await x.ctx.cloudSyncCycle();
  assert.equal(x.ctx.cloudRuntime.sync,"STOP");assert.ok(x.ctx.cloudChoicePreview);assert.equal(x.nodes.get("cloudChoicePanel").hidden,false);
  assert.equal(snapshots(x).length,0);assert.equal(x.events.includes("write"),false);cases++;
}
x=fixture({policy:"manual"});await x.ctx.cloudSyncCycle();assert.equal(x.ctx.cloudRuntime.sync,"STOP");assert.equal(x.events.includes("write"),false);cases++;
for(const flag of ["cloudRecoveryMode","importSyncHold","loadRecovery"]){
  x=fixture();if(flag==="loadRecovery")x.ctx.loadRecovery.active=true;else x.ctx[flag]=true;
  await x.ctx.cloudSyncCycle();assert.deepEqual(x.events,[]);assert.equal(pushes(x).length,0);cases++;
}
for(const mutate of [
  x=>{x.row.revision++},x=>{x.row.updated_at="changed"},x=>{x.row.device="other"},
  x=>{x.ctx.cloudUser.id="other"},x=>{x.ctx.cloudClient={}},x=>{x.ctx.cloudComparisonEpoch++},
  x=>{x.ctx.state.books.push({id:"during-backup"})},x=>{x.storage.set("protected","changed")},
  x=>{x.storage.set("meta",JSON.stringify({syncPolicy:"manual"}))},
  x=>{x.ctx.loadRecovery.active=true},x=>{x.ctx.importSyncHold=true},x=>{x.ctx.cloudRecoveryMode=true}
]){
  x=fixture();x.ctx.onSnapshot=()=>mutate(x);await x.ctx.cloudSyncCycle();
  assert.equal(x.events.includes("write"),false,"backup race stops before write");assert.equal(x.ctx.cloudRuntime.sync,"STOP");assert.equal(pushes(x).length,0);cases++;
}
x=fixture();x.ctx.onRead=()=>{x.ctx.cloudUser.id="other"};await x.ctx.cloudSyncCycle();assert.equal(snapshots(x).length,0);cases++;
for(const revision of [null,6,7]){
  x=fixture({local:{},baseline:true,revision});await x.ctx.cloudSyncCycle();
  assert.equal(x.ctx.cloudRuntime.sync,"STOP","invalid/rollback/same-revision hash mismatch guard");assert.equal(x.events.includes("write"),false);assert.equal(pushes(x).length,0);cases++;
}
for(const options of [{local:{},remote:{}},{remote:{}},{local:{},remote:null}]){
  x=fixture(options);await x.ctx.cloudSyncCycle();assert.equal(pushes(x).length,0);assert.equal(x.events.includes("write"),false);cases++;
}
x=fixture();x.ctx.failWrite=true;await x.ctx.cloudSyncCycle();assert.deepEqual(x.ctx.state,snapshots(x)[0][1]);assert.equal(x.ctx.cloudRuntime.sync,"STOP");assert.equal(x.storage.get("protected"),JSON.stringify(x.ctx.state));cases++;
x=fixture();x.ctx.metaFailure=true;await x.ctx.cloudSyncCycle();assert.equal(x.ctx.cloudRuntime.sync,"STOP");assert.equal(snapshots(x).length,1);assert.equal(x.events.some(e=>Array.isArray(e)&&e[0]==="toast"),false);cases++;
x=fixture();x.nodes.set("cloudChoiceDialog",{open:true,close(){this.open=false}});await x.ctx.cloudSyncCycle();assert.equal(x.nodes.get("cloudChoiceDialog").open,false);cases++;
x=fixture({baseline:true,local:clone(base),remote:clone(base),revision:7});x.ctx.skipFull=true;await x.ctx.cloudSyncCycle("poll");
assert.deepEqual(x.events,["meta"],"unchanged lifecycle check remains metadata-only");cases++;
x=fixture({policy:"manual"});x.ctx.cloudUser=null;x.ctx.cloudChangeSyncPolicy("cloud-first");assert.equal(x.ctx.cloudSyncPolicy(),"cloud-first");assert.deepEqual([...x.storage.keys()].sort(),["meta","protected"]);cases++;
x=fixture();x.ctx.metaFailure=true;x.ctx.cloudChangeSyncPolicy("manual");assert.equal(x.ctx.cloudSyncPolicy(),"cloud-first");cases++;
x=fixture();x.ctx.cloudSyncBusy=true;x.ctx.cloudChangeSyncPolicy("manual");assert.equal(x.ctx.cloudSyncPolicy(),"cloud-first");cases++;
console.log(`PASS ${cases} Cloud-first cases: snapshot-first adoption, manual choice, Local-only push, empty protection, guards, rollback, metadata-only and policy persistence.`);
