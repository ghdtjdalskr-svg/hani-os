// node scripts/hani-cloud-conflict-choice.test.mjs [candidate-main.js]
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(process.argv[2]||new URL("../hani-main.js",import.meta.url),"utf8");
function block(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>=0&&b>a,start+" anchor");
  return source.slice(a,b);
}
const helpers=block("function cloudNeedsRestoreChoice(","function cloudClearComparison(");
const meaningful=block("function cloudHasMeaningfulLocalData(","function cloudLocalStatusLabel(");
const apply=block("async function cloudApplyRemoteRow(","async function cloudPushLocalRow(");
const clone=structuredClone;
function fixture(){
  const events=[],nodes=new Map(),client={};
  const node=()=>({hidden:false,open:false,textContent:"",children:[],
    replaceChildren(){this.children=[]},append(x){this.children.push(x)},close(){this.open=false}});
  const local={books:[{id:"local"}]},remote={revision:7,updated_at:"2026-10-10T00:00:00Z",device:"PC",state:{books:[{id:"cloud"}]}};
  const p={owner:"owner",client,mode:"conflict",local:clone(local),localRaw:"raw",localHash:"local-hash",remoteHash:"remote-hash",remote:clone(remote)};
  const ctx=vm.createContext({
    console,structuredClone,Date,Set,Number,Promise,JSON,
    state:clone(local),cloudClient:client,cloudUser:{id:"owner"},cloudChoicePreview:p,
    cloudRecoveryMode:false,loadRecovery:{active:false},importSyncHold:false,
    STORAGE_KEY:"protected",localStorage:{getItem:()=>"raw"},
    assertCloudSourceReady(){if(ctx.importSyncHold||ctx.loadRecovery.active)throw Error("held")},
    cloudComparableState:x=>clone(x||{}),
    cloudSyncFingerprintState:x=>{const y=clone(x||{});delete y.meta;return y},
    cloudSame:(a,b)=>JSON.stringify(a)===JSON.stringify(b),
    freshState:()=>({accounts:[],goals:{},profile:{}}),
    cloudFetchMeta:async()=>({revision:7,updated_at:remote.updated_at,device:remote.device}),
    cloudRevisionNumber:x=>x===null||x===undefined?NaN:Number(x),
    formatDateTime:x=>x||"미확인",cloudDeviceLabel:()=>"이 기기",
    $:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},
    document:{createElement:node}
  });
  vm.runInContext(meaningful+helpers,ctx);
  let snapshots=0;
  const ops={
    verify:async()=>{events.push("verify");await ctx.cloudVerifyChoice(p)},
    snapshot:async(reason,value)=>{snapshots++;events.push([reason,clone(value)]);return snapshots!==ops.failSnapshot},
    verifySnapshots:async()=>{events.push("archive");if(ops.archiveFailure)throw Error("archive")},
    push:async(row,local,hash)=>events.push(["push",row.revision,clone(local),hash]),
    apply:async(row,hash,options)=>{await options.verifyRemote();events.push(["apply",row.revision,hash])}
  };
  return {ctx,p,events,ops,nodes};
}
const writes=x=>x.events.filter(e=>Array.isArray(e)&&["push","apply"].includes(e[0]));
let x=fixture();
assert.equal(await x.ctx.cloudExecuteChoice(x.p,"local",x.ops),true);
assert.deepEqual(x.events,["verify",["choice_remote_r7",x.p.remote.state],["choice_local_r7",x.p.local],"archive","verify",["push",7,x.p.local,"local-hash"]]);
x=fixture();
await x.ctx.cloudExecuteChoice(x.p,"cloud",x.ops);
assert.deepEqual(x.events,["verify",["choice_local_r7",x.p.local],"verify","verify",["apply",7,"remote-hash"]]);
x=fixture();
assert.equal(await x.ctx.cloudExecuteChoice(x.p,"pause",x.ops),false);
assert.deepEqual(x.events,[]);
for(const after of [0,1,2]){
  x=fixture();let checks=0;
  x.ctx.cloudFetchMeta=async()=>({revision:++checks>after?8:7,updated_at:x.p.remote.updated_at,device:x.p.remote.device});
  await assert.rejects(x.ctx.cloudExecuteChoice(x.p,after===2?"cloud":"local",x.ops),/Cloud 기록이 바뀌/);
  assert.equal(writes(x).length,0);
}
for(const [choice,n] of [["local",1],["local",2],["cloud",1]]){
  x=fixture();x.ops.failSnapshot=n;
  await assert.rejects(x.ctx.cloudExecuteChoice(x.p,choice,x.ops),/안전 백업/);
  assert.equal(writes(x).length,0);
}
x=fixture();x.ops.archiveFailure=true;
await assert.rejects(x.ctx.cloudExecuteChoice(x.p,"local",x.ops),/archive/);
assert.equal(writes(x).length,0);
for(const change of [
  x=>{x.ctx.state.books.push({id:"edited"})},
  x=>{x.ctx.cloudUser.id="other"},
  x=>{x.ctx.cloudClient={}},
  x=>{x.ctx.importSyncHold=true}
]){
  x=fixture();change(x);
  await assert.rejects(x.ctx.cloudExecuteChoice(x.p,"local",x.ops));
  assert.equal(writes(x).length,0);
}
for(const [local,remote,shown] of [
  [{},{state:{books:[{id:"cloud"}]}},true],
  [{books:[{id:"local"}]},{state:{books:[{id:"cloud"}]}},false],
  [{},{state:{}},false],[{},null,false]
]){
  x=fixture();x.ctx.state=clone(local);x.p.local=clone(local);x.p.mode="restore";
  x.p.remote=remote||{state:{}};
  assert.equal(x.ctx.cloudNeedsRestoreChoice(local,remote),shown);
  x.ctx.renderCloudChoice();
  assert.equal(x.nodes.get("cloudChoicePanel").hidden,!shown);
}
// Exercise the existing apply path: its own snapshot must finish before the final meta guard.
for(const snapshotOk of [false,true]){
  x=fixture();const events=[];
  Object.assign(x.ctx,{
    normalizeState:clone,cloudMergeProtectedMedia:y=>y,
    cloudSaveSafetySnapshot:async()=>{events.push("snapshot");return snapshotOk},
    writeProtectedState:()=>events.push("write")
  });
  vm.runInContext(apply,x.ctx);
  await assert.rejects(x.ctx.cloudApplyRemoteRow(x.p.remote,"remote-hash",{
    verifyRemote:async()=>{events.push("meta");throw Error("revision changed")}
  }));
  assert.deepEqual(events,snapshotOk?["snapshot","meta"]:["snapshot"]);
}
console.log("PASS: choice ordering, revision races, snapshot/archive denial, pause, owner/local/hold guards, restore visibility and apply pre-write guard.");
