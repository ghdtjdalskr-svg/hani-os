// Behavioral simulation of the Cloud Sync save path against a fake Supabase table.
// Runs the real hani-main.js sync functions in a sandbox and measures response bytes (egress).
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const file=process.argv[2]||new URL("../hani-main.js",import.meta.url);
const source=fs.readFileSync(file,"utf8");

function extractFunction(name){
  const m=new RegExp(`(^|\\n)((?:async )?function ${name}\\()`).exec(source);
  assert.ok(m,`function ${name} present`);
  const start=m.index+m[1].length;
  let i=source.indexOf("{",source.indexOf(")",start)),depth=0;
  for(;i<source.length;i++){
    const c=source[i];
    if(c==='"'||c==="'"||c==="`"){const q=c;for(i++;i<source.length&&source[i]!==q;i++){if(source[i]==="\\")i++}continue}
    if(c==="/"&&source[i+1]==="/"){i=source.indexOf("\n",i);continue}
    if(c==="{")depth++;
    else if(c==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`unterminated ${name}`);
}
const constant=name=>source.match(new RegExp(`const ${name}=([^;\\n]+)`))[0];

const names=["cloudCanonical","cloudSame","cloudComparableState","cloudSyncFingerprintState","cloudHasMeaningfulLocalData","cloudMergeProtectedMedia","cloudStateHash","cloudSaveSyncMeta","cloudReadRow","cloudStopAutoSync","cloudStartPolling","cloudApplyRemoteRow","cloudPushLocalRow","cloudSyncDecision","cloudSyncSelfTest","cloudShouldFetchFullState","cloudSyncCycle","cloudFetchMeta","cloudMeta","cloudSaveJson","cloudLoadJson"];
const optional=["cloudCanUseVerifiedRemote","cloudRememberVerifiedRemote","cloudIsLifecycleCheck","cloudRevisionNumber","cloudIsNetworkFailure","cloudRetryAfterNetwork"];
const fns=[...names,...optional.filter(n=>source.includes(`function ${n}(`))].map(extractFunction).join("\n");
const hasCache=source.includes("let cloudVerifiedRemote=");

const ls=new Map();
const sandbox={console,structuredClone,TextEncoder,crypto:globalThis.crypto,Promise,Date,JSON,Map,Set,Number,String,Array,Object,Math,Error,Uint8Array,
  localStorage:{getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v)),removeItem:k=>ls.delete(k)},
  document:{visibilityState:"visible"},navigator:{platform:"Sim"},setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{}};
vm.createContext(sandbox);
vm.runInContext(`
${constant("STORAGE_KEY")};${constant("CLOUD_META_KEY")};${constant("CLOUD_HASH_SCHEMA")};${constant("CLOUD_SYNC_ENGINE")};
const HANI_DISPLAY_VERSION="sim";
var state={},cloudClient=null,cloudUser=null,cloudRuntime={},cloudAutoSyncReady=false,cloudApplyingRemote=false,cloudSyncBusy=false,cloudSyncPending=false,cloudSyncTimer=null,cloudPollTimer=null${hasCache?",cloudVerifiedRemote=null":""}${source.includes("let cloudSessionFullReads")?",cloudSessionFullReads=0,cloudSessionMetaChecks=0;function renderCloudTransferUsage(){}":";"}
var loadRecovery={active:false},importSyncHold=false,lastLoadError="",brokerDraft=null,monthlyDraft=null,lastSaveResult=null,runtimeLog=[];
function normalizeState(x){return x}
function writeProtectedState(s){localStorage.setItem(STORAGE_KEY,s)}
function removeProtectedState(){localStorage.removeItem(STORAGE_KEY)}
function renderAll(){} function renderCloudPanel(){} function toast(){} function dataHubAuditSource(){}
function serializedBytes(s){return s.length}
function assertCloudSourceReady(){}
function cloudDeviceLabel(){return "SIM"}
function cloudSetRuntime(status,message){runtimeLog.push(status+": "+message)}
function cloudRecordCount(){return 0}
async function cloudSaveSafetySnapshot(){return true}
function cloudSummaryText(){return ""}
${fns}
this.api={cloudSyncCycle,cloudSyncSelfTest,get:()=>({state,cloudAutoSyncReady,runtimeLog${hasCache?",cache:cloudVerifiedRemote":""}}),set:(k,v)=>{if(k==="state")state=v;if(k==="client")cloudClient=v;if(k==="user")cloudUser=v;if(k==="ready")cloudAutoSyncReady=v}};
`,sandbox);
const api=sandbox.api;

// Fake Supabase table hani_state with one row per user; counts response bytes.
function makeDb(){
  const db={row:null,egress:0,fullReads:0,beforeUpdate:null};
  const pick=(row,cols)=>Object.fromEntries(cols.split(",").map(c=>[c,structuredClone(row[c])]));
  db.client={from(){
    const q={filters:{},op:"select",cols:"",payload:null};
    const b={select(cols){q.cols=cols;return b},eq(k,v){q.filters[k]=v;return b},limit(){return b},
      update(p){q.op="update";q.payload=p;return b},
      then(res,rej){return Promise.resolve().then(()=>{
        let rows=[];
        if(q.op==="update"){
          if(db.beforeUpdate){const f=db.beforeUpdate;db.beforeUpdate=null;f(db)}
          if(db.row&&db.row.user_id===q.filters.user_id&&db.row.revision===q.filters.revision){
            db.row={...db.row,...structuredClone(q.payload),revision:db.row.revision+1,updated_at:new Date().toISOString()};rows=[db.row];
          }
        }else if(db.row&&db.row.user_id===q.filters.user_id)rows=[db.row];
        const data=rows.map(r=>pick(r,q.cols));
        if(q.cols.includes("state"))db.fullReads+=q.op==="select"?1:0;
        db.egress+=JSON.stringify(data).length;
        return {data,error:null};
      }).then(res,rej)}};
    return b;
  }};
  return db;
}

const big="x".repeat(200000); // stands in for the ~2MB state payload
const base={instruments:[{id:"i1",name:"A"}],transactions:[{id:"t1",amount:1}],notes:big};
const db=makeDb();
db.row={user_id:"u1",state:structuredClone(base),revision:10,updated_at:"t0",device:"other"};
api.set("client",db.client);api.set("user",{id:"u1"});
api.set("state",structuredClone(base));
localStorage_set(JSON.stringify(base));
function localStorage_set(v){sandbox.localStorage.setItem(vm.runInContext("STORAGE_KEY",sandbox),v)}
const edit=n=>{const s=structuredClone(api.get().state);s.transactions=[...s.transactions,{id:"t"+n,amount:n}];api.set("state",s);localStorage_set(JSON.stringify(s))};

assert.equal(api.cloudSyncSelfTest(),true,"in-app self test passes");

// 1. Establish baseline from identical Local/Cloud.
await api.cloudSyncCycle("manual");
assert.equal(api.get().cloudAutoSyncReady,true,"baseline established");
assert.equal(db.row.revision,10);

// 2. Three local saves with no other device activity.
const before=db.egress,readsBefore=db.fullReads;
for(const n of [2,3,4]){edit(n);await api.cloudSyncCycle("local-save");assert.equal(api.get().cloudAutoSyncReady,true,`save ${n} keeps sync ON: ${api.get().runtimeLog.at(-1)}`)}
assert.equal(db.row.revision,13,"three saves reached Cloud");
assert.deepEqual(db.row.state.transactions.map(t=>t.id),["t1","t2","t3","t4"],"Cloud holds every local save");
const saveEgress=db.egress-before,saveFullReads=db.fullReads-readsBefore;

// 3. Another device writes; then a local save must NOT overwrite it.
db.row={...db.row,state:{...structuredClone(db.row.state),instruments:[...db.row.state.instruments,{id:"i2",name:"other device"}]},revision:14,device:"phone"};
edit(5);await api.cloudSyncCycle("local-save");
assert.equal(api.get().cloudAutoSyncReady,false,"both-sides change stops auto sync");
assert.equal(db.row.revision,14,"other device row is not overwritten");
assert.ok(db.row.state.instruments.some(i=>i.id==="i2"),"other device data preserved");
assert.ok(api.get().state.transactions.some(t=>t.id==="t5"),"local edit preserved");
if(hasCache)assert.equal(api.get().cache,null,"memory row dropped on stop");

// 4. Race: Cloud changes between the metadata check and the update.
const db2=makeDb();db2.row={user_id:"u1",state:structuredClone(base),revision:20,updated_at:"t0",device:"other"};
api.set("client",db2.client);api.set("state",structuredClone(base));localStorage_set(JSON.stringify(base));
sandbox.localStorage.removeItem(vm.runInContext("CLOUD_META_KEY",sandbox));
await api.cloudSyncCycle("manual");assert.equal(api.get().cloudAutoSyncReady,true);
edit(6);
db2.beforeUpdate=d=>{d.row={...d.row,state:{...d.row.state,instruments:[{id:"race"}]},revision:21,device:"phone"}};
await api.cloudSyncCycle("local-save");
assert.equal(api.get().cloudAutoSyncReady,false,"revision lock stops the racing save");
assert.equal(db2.row.revision,21);assert.deepEqual(db2.row.state.instruments,[{id:"race"}],"racing device data preserved");

// 5. Account switch never reuses another account's memory row.
if(hasCache){
  const db3=makeDb();db3.row={user_id:"u1",state:structuredClone(base),revision:30,updated_at:"t0",device:"x"};
  api.set("client",db3.client);api.set("state",structuredClone(base));localStorage_set(JSON.stringify(base));
  sandbox.localStorage.removeItem(vm.runInContext("CLOUD_META_KEY",sandbox));
  await api.cloudSyncCycle("manual");
  api.set("user",{id:"u2"});db3.row={...db3.row,user_id:"u2"};
  const r=db3.fullReads;edit(7);await api.cloudSyncCycle("local-save");
  assert.ok(db3.fullReads>r,"different account forces a full read");
}

console.log(JSON.stringify({file:String(file),cacheBuild:hasCache,threeSavesEgressBytes:saveEgress,threeSavesFullReads:saveFullReads,stateBytes:JSON.stringify(base).length}));
console.log("HANI Cloud Egress Save Simulation: PASS");
