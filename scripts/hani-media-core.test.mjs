// node scripts/hani-media-core.test.mjs [candidate-main.js] [baseline-main.js]
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {webcrypto} from "node:crypto";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const repo=fileURLToPath(new URL("../",import.meta.url));
const source=fs.readFileSync(process.argv[2]||new URL("../hani-main.js",import.meta.url),"utf8");
const baseline=process.argv[3]?fs.readFileSync(process.argv[3],"utf8"):
  execFileSync("git",["show","6b18534a1e2a53e2ad7b5062355dbe8607229c0c:hani-main.js"],
    {cwd:repo,encoding:"utf8",maxBuffer:8*1024*1024});
const core=fs.readFileSync(new URL("../hani-media-core.js",import.meta.url),"utf8");
function extractFunction(text,name){
  const m=new RegExp("(^|\\n)((?:async )?function "+name+"\\()").exec(text);
  assert.ok(m,"function "+name+" present");
  const start=m.index+m[1].length;
  let i=text.indexOf("{",text.indexOf(")",start)),depth=0;
  for(;i<text.length;i++){
    const c=text[i];
    if(c==='"'||c==="'"||c===String.fromCharCode(96)){
      const q=c;for(i++;i<text.length&&text[i]!==q;i++){if(text[i]==="\\")i++}
      continue;
    }
    if(c==="/"&&text[i+1]==="/"){i=text.indexOf("\n",i);continue}
    if(c==="{")depth++;
    else if(c==="}"&&--depth===0)return text.slice(start,i+1);
  }
  throw new Error("unterminated "+name);
}
function fakeIdb(){
  const records=new Map(),db={objectStoreNames:{contains:()=>true},close(){},
    transaction(){
      const tx={abort(){tx.onabort?.()},objectStore:()=>({
        get(key){return request(()=>records.get(key))},
        put(row){return request(()=>{
          if(db.quota)throw Error("quota");
          records.set(row.key,structuredClone(db.corrupt?{...row,bytes:0}:row));return row.key;
        })}
      })};
      function request(action){
        const req={};queueMicrotask(()=>{
          try{req.result=action();req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())}
          catch(_){req.onerror?.();tx.onabort?.()}
        });return req;
      }
      return tx;
    }};
  return {db,records,open(){const req={};queueMicrotask(()=>{req.result=db;req.onsuccess?.()});return req}};
}
function loadMedia(indexedDB){
  const window={crypto:webcrypto,indexedDB};
  const ctx=vm.createContext({window,TextEncoder,Uint8Array,Map,Promise,setTimeout,clearTimeout});
  vm.runInContext(core,ctx);
  let owner="account-a";
  window.HANI_MEDIA.setAccountProvider(()=>owner);
  return {media:window.HANI_MEDIA,window,setOwner:v=>{owner=v}};
}
const idb=fakeIdb(),env=loadMedia(idb),media=env.media;
const image="data:image/png;base64,"+"QQ==".repeat(64),other="data:image/png;base64,Qg==";
const ref=await media.digest(image);
assert.match(ref,/^media:sha256:[a-f0-9]{64}$/);
assert.equal(ref,await media.digest(image));
assert.notEqual(ref,await media.digest(other));
assert.equal(await media.digest("https://example.invalid/image"),null);
assert.equal(media.isRef(ref),true);
assert.equal(media.isRef("media:sha256:abc"),false);
assert.equal(await media.put(ref,image),image,"committed data verified in independent read");
assert.equal(await media.has(ref),true);
assert.equal(media.resolve({coverRef:ref},"cover"),image);
assert.equal(media.resolve({cover:other,coverRef:ref},"cover"),other,"inline wins");
assert.equal(media.resolve({posterRef:"bad"},"poster"),"");
env.setOwner("account-b");
assert.equal(media.resolve({coverRef:ref},"cover"),"","cache isolated by account");
assert.equal(await media.get(ref),null);
env.setOwner("account-a");
assert.equal(await media.get(ref),image);
const fixture={version:"unchanged",meta:{lastSavedAt:"old"},ui:{view:"reading"},accounts:[],
  books:[{id:"b1",title:"책",author:"A",cover:image}],
  movies:[{id:"m1",title:"영화",poster:other}]};
const serialized=JSON.stringify(fixture),report=media.dryRunReport(fixture);
assert.equal(report.count,2);
assert.equal(report.inlineBytes,Buffer.byteLength(image)+Buffer.byteLength(other));
assert.equal(JSON.stringify(fixture),serialized,"dry run pure");
const estimated=structuredClone(fixture);
for(const [kind,field] of [["books","cover"],["movies","poster"]]){
  estimated[kind][0][field]="";estimated[kind][0][field+"Ref"]="media:sha256:"+"0".repeat(64);
}
assert.equal(report.estimatedAfterBytes,Buffer.byteLength(JSON.stringify(estimated)));
assert.equal(media.dryRunReport({books:[],movies:[]}).count,0);
assert.equal((await media.reembed(fixture)).data,fixture,"inline export object unchanged");
const linked={accounts:[],books:[{id:"b1",coverRef:ref}],movies:[]};
const embedded=await media.reembed(linked);
assert.equal(embedded.complete,true);
assert.equal(embedded.data.books[0].cover,image);
assert.equal(linked.books[0].cover,undefined,"export does not mutate state");
const missing=await media.reembed({books:[{coverRef:"media:sha256:"+"0".repeat(64)}]});
assert.equal(missing.complete,false);
assert.equal(missing.missing.length,1);
idb.db.quota=true;
assert.equal(await media.put(await media.digest(other),other),null);
idb.db.quota=false;idb.db.corrupt=true;
assert.equal(await media.put(await media.digest(other),other),null,"read-back mismatch fails soft");
const unavailable=loadMedia(undefined);
assert.equal(await unavailable.media.get(ref),null);
assert.equal(await unavailable.media.put(ref,image),null);
unavailable.window.crypto={subtle:{digest:async()=>{throw Error("private mode")}}};
assert.equal(await unavailable.media.digest(image),null);

const cloudNames=["cloudCanonical","cloudComparableState","cloudSyncFingerprintState","cloudStateHash"];
function cloud(text,crypto=webcrypto){
  const ctx=vm.createContext({structuredClone,TextEncoder,Uint8Array,crypto,console});
  vm.runInContext(cloudNames.map(name=>extractFunction(text,name)).join("\n")+
    "\nthis.hash=cloudStateHash;",ctx);
  return ctx.hash;
}
// BEFORE and AFTER execute real functions from the pinned approved base and candidate.
for(const engine of [webcrypto,{}]){
  assert.equal(await cloud(source,engine)(fixture),await cloud(baseline,engine)(fixture),"HASH-UNCHANGED");
}
await media.digest(image);await media.get(ref);
assert.equal(await cloud(source)(fixture),await cloud(baseline)(fixture),"HASH-UNCHANGED after cache warm-up");
assert.notEqual(await cloud(source)({...fixture,books:[{...fixture.books[0],cover:other}]}),
  await cloud(source)(fixture),"real media change changes hash");

const validation=vm.createContext({});
vm.runInContext(["validateBackup","validateStoredRecords"].map(n=>extractFunction(source,n)).join("\n")+
  "\nthis.validate=(x)=>{const r=validateBackup(x);validateStoredRecords(r.data);return r.kind};",validation);
for(const value of [fixture,linked,{...fixture,books:[{...fixture.books[0],coverRef:ref}]}])
  assert.equal(validation.validate(value),"current");

function renderers(text){
  const ctx=vm.createContext({window:{HANI_MEDIA:media},TOPIC_COLORS:{"기타":"#000"},
    esc:v=>String(v??""),stars:v=>String(v??""),movieContentType:v=>v||"기타",
    ratingValue:v=>v==null?null:Number(v),movieViewingUnits:rows=>rows.length,movieReviewBody:v=>v});
  const names=["bookCard","movieCard","movieWorkCard"];
  const fns=names.map(n=>text.split(/\r?\n/).find(line=>line.startsWith("function "+n+"(")));
  vm.runInContext('function mediaImage(item,field){return window.HANI_MEDIA.resolve(item,field)}\n'+
    fns.join("\n")+"\nthis.api={bookCard,movieCard,movieWorkCard};",ctx);return ctx.api;
}
const before=renderers(baseline),after=renderers(source),movie=fixture.movies[0];
assert.equal(after.bookCard(fixture.books[0]),before.bookCard(fixture.books[0]),"book HTML byte identical");
assert.equal(after.movieCard(movie),before.movieCard(movie),"movie HTML byte identical");
const group={title:movie.title,type:"영화",rows:[{record:movie}]};
assert.equal(after.movieWorkCard(group),before.movieWorkCard(group),"work HTML byte identical");
async function exported(text,value,patched){
  const files=[],messages=[];
  const FixedDate=class extends Date{constructor(...args){super(...(args.length?args:["2026-10-10T00:00:00Z"]))}};
  const ctx=vm.createContext({state:structuredClone(value),VERSION:"baseline",STORAGE_KEY:"hani_os_life_v23",
    loadRecovery:{active:false},Date:FixedDate,window:{HANI_MEDIA:media},cloudUser:{id:"account-a"},
    cloudSyncBusy:false,cloudApplyingRemote:false,JSON,console,
    freshState:()=>({meta:{}}),save:()=>({ok:true}),today:()=>"2026-10-10",
    renderStoragePanel(){},toast:v=>messages.push(v),alert:v=>messages.push(v),
    downloadJson:(data,name)=>files.push({data,name})});
  const names=patched?["mediaHasRefs","mediaBackupState","exportDataWithMedia",...(text.includes("function buildBackupPayload(")?["buildBackupPayload"]:[]),"exportData"]:["exportData"];
  vm.runInContext(names.map(n=>extractFunction(text,n)).join("\n")+"\nthis.export=exportData;",ctx);
  const result=ctx.export();
  if(!patched||!media.hasRefs(value))assert.equal(result,true,"inline synchronous export contract");
  return {ok:await result,files,messages};
}
const baselineExport=await exported(baseline,fixture,false),candidateExport=await exported(source,fixture,true);
assert.deepEqual(candidateExport.files,baselineExport.files,"inline export bytes and filename unchanged");
const linkedExport=await exported(source,linked,true);
assert.equal(linkedExport.ok,true);
assert.equal(JSON.parse(linkedExport.files[0].data).books[0].cover,image);
const incompleteExport=await exported(source,{...linked,books:[{coverRef:"media:sha256:"+"0".repeat(64)}]},true);
assert.equal(incompleteExport.ok,false);
assert.equal(incompleteExport.files.length,0);
assert.ok(incompleteExport.messages.some(v=>v.includes("불완전 백업")));
console.log("PASS: digest, verified IDB, account isolation, resolve, pure dry run, reembed, import, HTML parity, HASH-UNCHANGED");

function fakeCloud(){
  const rows=new Map(),requests=[],client={rows,requests,failInsert:false,corrupt:false};
  client.auth={getUser:async()=>({data:{user:{id:"account-a"}},error:null})};
  client.from=table=>{
    assert.equal(table,"hani_media");
    let columns,owner,ids,range;
    const query={
      select(value){columns=value;return query},
      eq(key,value){assert.equal(key,"user_id");owner=value;return query},
      order(key){assert.equal(key,"media_id");return query},
      range(start,end){range=[start,end];return query},
      in(key,value){assert.equal(key,"media_id");ids=[...value];return query},
      insert(row){
        requests.push({insert:structuredClone(row)});
        if(client.failInsert)return Promise.resolve({error:{code:"42501"}});
        const key=JSON.stringify([row.user_id,row.media_id]);
        if(rows.has(key))return Promise.resolve({error:{code:"23505"}});
        rows.set(key,structuredClone(row));return Promise.resolve({error:null});
      },
      then(resolve,reject){
        requests.push({columns,owner,ids,range});
        let data=[...rows.values()].filter(row=>row.user_id===owner&&(!ids||ids.includes(row.media_id)))
          .sort((a,b)=>a.media_id.localeCompare(b.media_id));
        if(range)data=data.slice(range[0],range[1]+1);
        if(ids&&client.omitBodies)data=[];
        data=data.map(row=>Object.fromEntries(columns.split(",").map(key=>[key,
          key==="data"&&client.corrupt?other:row[key]])));
        return Promise.resolve({data,error:null}).then(resolve,reject);
      }
    };
    return query;
  };
  return client;
}
async function runBCase({failInsert=false,corrupt=false,snapshot=true,conflict=false,saveOk=true,busyMs=0}={}){
  const local=loadMedia(fakeIdb()),client=fakeCloud();
  client.failInsert=failInsert;client.corrupt=corrupt;
  const value=structuredClone(fixture);
  if(conflict)value.books[0].coverRef="media:sha256:"+"f".repeat(64);
  let saves=0,snapshots=0,queued=0,pushes=0;
  const messages=[];
  const ctx=vm.createContext({
    window:local.window,state:value,cloudClient:client,cloudUser:{id:"account-a"},
    cloudOwnerVerificationEpoch:1,navigator:{onLine:true},cloudAutoSyncReady:true,
    cloudRuntime:{sync:"ON"},cloudSyncBusy:false,cloudApplyingRemote:false,
    loadRecovery:{active:false},importSyncHold:false,cloudRecoveryMode:false,
    structuredClone,JSON,Error,$:()=>null,renderMediaPreview(){},
    CLOUD_SYNC_ENGINE:"test",CLOUD_HASH_SCHEMA:"test",cloudVerifiedRemote:null,
    cloudSyncPending:false,cloudNetworkRetryPending:false,
    cloudSyncSelfTest:()=>true,cloudIsLifecycleCheck:()=>false,
    cloudFetchMeta:async()=>({revision:5}),cloudCanUseVerifiedRemote:()=>false,
    cloudReadRow:async()=>({state:structuredClone(fixture),revision:5}),
    assertCloudSourceReady(){},cloudHasMeaningfulLocalData:()=>true,
    cloudStateHash:async()=>"same",cloudRevisionNumber:Number,
    cloudMeta:()=>({syncEngine:"test",hashSchema:"test",lastSyncedHash:"same",appliedRevision:5}),
    cloudPushLocalRow:async(remote,outgoing)=>{
      pushes++;assert.equal(remote.revision,5);assert.equal(outgoing.books[0].cover,image);
      assert.ok(outgoing.movies[0].posterRef);return {revision:6,state:outgoing};
    },
    cloudSaveSyncMeta:()=>({verifiedAt:"test"}),cloudRememberVerifiedRemote(){},
    cloudSetRuntime(){},cloudSummaryText:()=>"",cloudStartPolling(){},
    cloudStopAutoSync(message){throw Error(message)},cloudIsNetworkError:()=>false,setTimeout,
    cloudSaveSafetySnapshot:async(reason,full)=>{
      snapshots++;assert.equal(reason,"before_media_stage_b");
      assert.equal(full.books[0].cover,image);return snapshot;
    },
    cloudQueueSync(){queued++},
    save(){saves++;return {ok:saveOk}},renderAll(){},toast(){}
  });
  vm.runInContext("let mediaBBusy=false,mediaCBusy=false;\n"+
    ["mediaBCanRun","mediaBWaitIdle","mediaBStatus","mediaBConfirm","mediaRunB"]
      .map(name=>extractFunction(source,name)).join("\n")+
    "\nmediaBConfirm=async()=>true;mediaBStatus=m=>messages.push(m);"+
    "\nthis.run=mediaRunB;",Object.assign(ctx,{messages}));
  if(busyMs){ctx.cloudSyncBusy=true;setTimeout(()=>{ctx.cloudSyncBusy=false},busyMs)}
  await Promise.all([ctx.run(),ctx.run()]); // Double-click must execute once.
  return {ctx,client,saves,snapshots,queued,messages,value,pushCount:()=>pushes};
}
const happy=await runBCase();
assert.equal(happy.saves,1);assert.equal(happy.snapshots,1);
assert.equal(happy.ctx.state.books[0].coverRef,ref);
assert.equal(happy.ctx.state.books[0].cover,image);
assert.equal(happy.ctx.state.movies[0].poster,other);
const busy=await runBCase({busyMs:400});
assert.equal(busy.saves,1,"a focus/poll Cloud check during the click waits instead of aborting");
assert.equal(busy.ctx.state.books[0].coverRef,ref);
for(const options of [{failInsert:true},{corrupt:true},{snapshot:false},{saveOk:false}]){
  const result=await runBCase(options);
  assert.equal(JSON.stringify(result.ctx.state),JSON.stringify(fixture),"failure leaves no new refs");
  assert.equal(result.saves,options.saveOk===false?1:0);
  if(options.snapshot===false)assert.equal(result.client.requests.length,0,"snapshot failure before media queries");
}
const conflict=await runBCase({conflict:true});
assert.equal(conflict.ctx.state.books[0].coverRef,"media:sha256:"+"f".repeat(64));
assert.ok(conflict.messages.some(m=>m.includes("충돌 1건")));
const duplicate=fakeCloud(),record={media_id:ref,mime:"image/png",bytes:Buffer.byteLength(image),data:image};
assert.equal(await media.cloudPut(duplicate,"account-a",record),true);
assert.equal(await media.cloudPut(duplicate,"account-a",record),true,"duplicate insert succeeds");
const otherRef=await media.digest(other);
assert.equal(await media.cloudPut(duplicate,"account-a",{
  media_id:otherRef,mime:"image/png",bytes:Buffer.byteLength(other),data:other
}),true);
const asked=await media.cloudGet(duplicate,"account-a",[ref]);
assert.equal(asked.size,1);assert.equal(asked.get(ref),image);
const getRequest=duplicate.requests.findLast(r=>r.ids);
assert.deepEqual(getRequest.ids,[ref],"Cloud only requests asked IDs");
await media.cloudList(duplicate,"account-a");
assert.equal(duplicate.requests.at(-1).columns,"media_id","list never requests bodies");
assert.equal((await media.cloudGet(duplicate,"other-owner",[ref])).size,0,"owner-scoped reads");

const withRefs=structuredClone(fixture);
withRefs.books[0].coverRef=ref;withRefs.movies[0].posterRef=await media.digest(other);
for(const engine of [webcrypto,{}]){
  assert.notEqual(await cloud(source,engine)(withRefs),await cloud(source,engine)(fixture),
    "added refs are ordinary data and sync through the normal hash/push path");
  assert.equal(await cloud(source,engine)(fixture),await cloud(baseline,engine)(fixture),"HASH-UNCHANGED");
}

const hydrated=loadMedia(fakeIdb()),hydrationClient=fakeCloud();
hydrationClient.rows.set(JSON.stringify(["account-a",ref]),{...record,user_id:"account-a"});
let ready=0;
hydrated.window.Event=class{constructor(type){this.type=type}};
hydrated.window.dispatchEvent=event=>{if(event.type==="hani-media-ready")ready++};
hydrated.media.setCloudProvider(()=>({client:hydrationClient,userId:"account-a"}));
for(let i=0;i<4;i++)assert.equal(hydrated.media.resolve({coverRef:ref},"cover"),"");
await new Promise(resolve=>setTimeout(resolve,150));
assert.equal(hydrated.media.resolve({coverRef:ref},"cover"),image);
assert.equal(hydrationClient.requests.filter(r=>r.ids).length,1,"debounced fetch, once per session");
assert.ok(ready>0,"existing media-ready event after verified cache");
console.log("PASS B: busy-sync wait, snapshot gate, upload/read-back failures, one save, conflicts, duplicate insert, refs change hash, inline-only hash unchanged, scoped reads, hydration");

async function runCCase({rollback=false,snapshot=true,saveOk=true,missing=false,corrupt=false,
  warm=true,missingBody=false,mismatch=false,busyMs=0,cancel=false,race=false,ownerChange=false}={}){
  const local=loadMedia(fakeIdb()),client=fakeCloud(),value=structuredClone(fixture);
  const otherRef=await local.media.digest(other);
  value.books[0].coverRef=ref;value.movies[0].posterRef=otherRef;
  if(rollback){value.books[0].cover="";value.movies[0].poster="";
    value.meta.minMediaWriterVersion="2.9.197"}
  if(mismatch)value.books[0].cover=other;
  for(const [id,data] of [[ref,image],[otherRef,other]]){
    if(warm)assert.equal(await local.media.put(id,data),data);
    if(!missing||id!==otherRef)client.rows.set(JSON.stringify(["account-a",id]),{
      user_id:"account-a",media_id:id,data,mime:"image/png",bytes:Buffer.byteLength(data)});
  }
  client.corrupt=corrupt;client.omitBodies=missingBody;
  local.media.setCloudProvider(()=>({client,userId:"account-a"}));
  const before=JSON.stringify(value),messages=[],events=[];
  let saves=0,snapshots=0;
  const ctx=vm.createContext({
    window:local.window,state:value,cloudClient:client,cloudUser:{id:"account-a"},
    navigator:{onLine:true},cloudAutoSyncReady:true,cloudRuntime:{sync:"ON"},
    cloudSyncBusy:false,cloudApplyingRemote:false,loadRecovery:{active:false},
    importSyncHold:false,cloudRecoveryMode:false,HANI_DISPLAY_VERSION:"2.9.197",
    structuredClone,JSON,Error,Date,setTimeout,$:()=>null,renderMediaPreview(){},toast(){},renderAll(){},
    cloudSaveSafetySnapshot:async(reason,full)=>{
      snapshots++;events.push("snapshot");
      assert.equal(reason,rollback?"before_media_stage_c_rollback":"before_media_stage_c");
      assert.equal(full.books[0].cover,mismatch?other:image);
      assert.equal(full.movies[0].poster,other);
      if(race)ctx.state.books[0].title="edited during snapshot";
      if(ownerChange)ctx.cloudUser={id:"other-owner"};
      return snapshot;
    },
    save(){saves++;events.push("save");return {ok:saveOk}}
  });
  vm.runInContext("let mediaBBusy=false,mediaCBusy=false,mediaCEligibility=null;\n"+
    ["mediaBCanRun","mediaBWaitIdle","mediaCBlockedReason","mediaCEligibilityReason","mediaCStatus","mediaCConfirm","mediaRunC"]
      .map(name=>extractFunction(source,name)).join("\n")+
    "\nmediaCConfirm=async()=>!cancel;mediaCStatus=m=>messages.push(m);"+
    "\nthis.run=mediaRunC;",Object.assign(ctx,{messages,cancel}));
  if(busyMs){ctx.cloudSyncBusy=true;setTimeout(()=>{ctx.cloudSyncBusy=false},busyMs)}
  await Promise.all([ctx.run(rollback),ctx.run(rollback)]);
  return {ctx,client,local,before,messages,events,saves,snapshots};
}
const cHappy=await runCCase({busyMs:350});
assert.equal(cHappy.saves,1);assert.equal(cHappy.snapshots,1);
assert.deepEqual(cHappy.events,["snapshot","save"]);
assert.equal(cHappy.ctx.state.books[0].cover,"");assert.equal(cHappy.ctx.state.movies[0].poster,"");
assert.equal(cHappy.ctx.state.books[0].coverRef,ref);
assert.equal(cHappy.ctx.state.meta.minMediaWriterVersion,"2.9.197");
assert.equal(cHappy.local.media.resolve(cHappy.ctx.state.books[0],"cover"),image);
assert.equal((await cHappy.local.media.reembed(cHappy.ctx.state)).data.books[0].cover,image);
assert.equal(cHappy.client.requests.some(r=>r.insert),false,"C adds no Cloud writes");
const cMismatch=await runCCase({mismatch:true});
assert.equal(cMismatch.saves,0,"eligibility mismatch stops before any save");
assert.equal(cMismatch.ctx.state.books[0].cover,other);
assert.equal(cMismatch.ctx.state.movies[0].poster,other,"all inline images preserved when eligibility fails");
assert.ok(cMismatch.messages.some(m=>m.includes("이미지 1장이 기록과 일치하지 않아요")));
for(const options of [{missing:true},{missingBody:true},{corrupt:true},{snapshot:false},{saveOk:false},{cancel:true}]){
  const result=await runCCase(options);
  assert.equal(JSON.stringify(result.ctx.state),result.before,"failure/cancel preserves inline and meta");
  assert.equal(result.saves,options.saveOk===false?1:0);
  if(options.cancel)assert.equal(result.snapshots,0);
  if(options.snapshot===false)assert.equal(result.client.requests.some(r=>r.insert),false,"eligibility reads are allowed, no media writes before backup");
}
for(const options of [{race:true},{ownerChange:true}]){
  const result=await runCCase(options);
  assert.equal(result.saves,0,"changed owner/state cannot commit a prepared plan");
  assert.equal(result.ctx.state.books[0].cover,image);
}
const coldC=await runCCase({warm:false});
assert.equal(coldC.saves,1,"verified inline copies seed missing IDB before C mutation");
const cRollback=await runCCase({rollback:true,warm:false});
assert.equal(cRollback.saves,1);assert.equal(cRollback.snapshots,1);
assert.equal(cRollback.ctx.state.books[0].cover,image);assert.equal(cRollback.ctx.state.movies[0].poster,other);
assert.equal(cRollback.ctx.state.meta.minMediaWriterVersion,"2.9.197");
const failedRollback=await runCCase({rollback:true,warm:false,missing:true});
assert.equal(failedRollback.saves,0);
assert.equal(JSON.stringify(failedRollback.ctx.state),failedRollback.before);

const guardVm=vm.createContext({structuredClone});
vm.runInContext(["cloudMediaSignature","cloudMergeProtectedMedia"].map(n=>extractFunction(source,n)).join("\n")+
  "\nthis.merge=cloudMergeProtectedMedia;",guardVm);
const dual=structuredClone(fixture);dual.books[0].coverRef=ref;
const refOnly=structuredClone(dual);refOnly.books[0].cover="";
assert.equal(guardVm.merge(refOnly,dual).books[0].cover,"","pull/push accepts ref-only media");
assert.equal(guardVm.merge(dual,refOnly).books[0].cover,image);
const lost=structuredClone(refOnly);delete lost.books[0].coverRef;
assert.equal(guardVm.merge(lost,dual).books[0].cover,image,"real loss restores inline");
assert.equal(guardVm.merge(lost,refOnly).books[0].coverRef,ref,"real loss restores a ref-only source");
const different=structuredClone(refOnly);different.books[0].coverRef=await media.digest(other);
assert.equal(guardVm.merge(different,dual).books[0].cover,"","new valid ref is preserved");
const malformed=structuredClone(lost);malformed.books[0].coverRef="invalid";
assert.equal(guardVm.merge(malformed,dual).books[0].cover,image);
assert.equal(JSON.stringify(dual),JSON.stringify({...fixture,books:[{...fixture.books[0],coverRef:ref}]}),
  "merge never mutates source");

const eligibility=loadMedia(fakeIdb()),eligibilityCloud=fakeCloud();
eligibilityCloud.rows.set(JSON.stringify(["account-a",ref]),{
  user_id:"account-a",media_id:ref,data:image,mime:"image/png",bytes:Buffer.byteLength(image)});
const preflight={state:linked,client:eligibilityCloud,userId:"account-a",guard:()=>true,localOnly:true};
await assert.rejects(()=>eligibility.media.verifyRefs(preflight),/기기에/);
assert.equal(eligibilityCloud.requests.length,0,"eligibility never hydrates");
await eligibility.media.put(ref,image);
assert.equal((await eligibility.media.verifyRefs(preflight)).count,1);
assert.equal(eligibilityCloud.requests.at(-1).columns,"media_id");
eligibilityCloud.rows.delete(JSON.stringify(["account-a",ref]));
await assert.rejects(()=>eligibility.media.verifyRefs(preflight),/Cloud/);

// A browser that never ran stage B: empty cache, but the record still carries the inline copy.
const fresh=loadMedia(fakeIdb()),freshCloud=fakeCloud();
freshCloud.rows.set(JSON.stringify(["account-a",ref]),{
  user_id:"account-a",media_id:ref,data:image,mime:"image/png",bytes:Buffer.byteLength(image)});
const dualOnly={accounts:[],books:[{id:"b1",cover:image,coverRef:ref}],movies:[]};
assert.equal((await fresh.media.verifyRefs({state:dualOnly,client:freshCloud,userId:"account-a",guard:()=>true,localOnly:true})).count,1,
  "fresh browser seeds its cache from the matching inline copy");
assert.equal(await fresh.media.get(ref),image,"seeded cache holds the verified image");
const tampered=loadMedia(fakeIdb());
await assert.rejects(()=>tampered.media.verifyRefs({state:{accounts:[],books:[{id:"b1",cover:other,coverRef:ref}],movies:[]},
  client:freshCloud,userId:"account-a",guard:()=>true,localOnly:true}),/기기에/,"inline that does not match the ref is never cached");

const checkbox={checked:false,required:false,closest:()=>({hidden:false})},approve={};
let dialog;
const dialogVm=vm.createContext({$:id=>({
  mediaCDialog:dialog,mediaCDevices:checkbox,mediaCApprove:approve,
  mediaCTitle:{},mediaCDescription:{}
})[id]});
vm.runInContext(extractFunction(source,"mediaCConfirm")+"\nthis.confirm=mediaCConfirm;",dialogVm);
dialog={showModal(){}};
let confirmation=dialogVm.confirm();
assert.equal(approve.disabled,true);assert.equal(checkbox.required,true);
dialog.returnValue="approve";dialog.onclose();
assert.equal(await confirmation,false,"unchecked checkbox cannot approve even by synthetic close");
confirmation=dialogVm.confirm();checkbox.checked=true;checkbox.onchange();
assert.equal(approve.disabled,false);dialog.returnValue="approve";dialog.onclose();
assert.equal(await confirmation,true);
confirmation=dialogVm.confirm();dialog.returnValue="";dialog.onclose();
assert.equal(await confirmation,false,"ESC/cancel makes no mutation");
console.log("PASS C: snapshot gate, single save, wait-idle, mismatch, Cloud missing/corrupt, rollback, owner/state race, resolver/export, ref-only guard, eligibility, checkbox");

