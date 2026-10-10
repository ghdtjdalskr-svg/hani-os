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
  const names=patched?["mediaHasRefs","mediaBackupState","exportDataWithMedia","exportData"]:["exportData"];
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
