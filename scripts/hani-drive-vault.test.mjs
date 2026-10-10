// node scripts/hani-drive-vault.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {createHash,webcrypto} from "node:crypto";
import {inspectHaniBackupBuffer} from "./hani-drive-vault-precheck.mjs";

const source=fs.readFileSync(new URL("../hani-drive-vault.js",import.meta.url),"utf8");
const main=fs.readFileSync(new URL("../hani-main.js",import.meta.url),"utf8");
const window={crypto:webcrypto};
const ctx=vm.createContext({window,TextEncoder,TextDecoder,Uint8Array,Date});
vm.runInContext(source,ctx);
const core=window.HANI_DRIVE_VAULT_CORE;
const now=Date.parse("2026-10-10T15:04:00Z");
assert.equal(core.filename(now),"HANI_OS_backup_2026-10-11_0004.json");

function directory({corrupt=false}={}){
  const files=new Map(),calls={write:0,request:0};
  const handle={name:"HANI OS Vault",permission:"granted",
    async queryPermission(){return this.permission},
    async requestPermission(){calls.request++;return this.permission},
    async getFileHandle(name,options={}){
      if(!files.has(name)){
        if(!options.create)throw Object.assign(Error("missing"),{name:"NotFoundError"});
        files.set(name,Buffer.alloc(0));
      }
      return {
        async getFile(){
          const data=files.get(name);
          return {size:data.length,async arrayBuffer(){return Uint8Array.from(data).buffer}};
        },
        async createWritable(){
          let pending;
          return {async write(bytes){calls.write++;pending=Buffer.from(bytes)},
            async close(){const data=Buffer.from(pending);if(corrupt)data[0]^=1;files.set(name,data)},
            async abort(){}};
        }
      };
    }
  };
  return {handle,files,calls};
}
const fixture={version:"2.9.15-safe-baseline-bootstrap",accounts:[],instruments:[],
  books:[],movies:[],meta:{lastSavedAt:"unchanged"}};
const original=JSON.stringify(fixture);
const hookStart=main.indexOf("function buildBackupPayload(");
const hookEnd=main.indexOf("async function exportDataWithMedia(",hookStart);
assert.ok(hookStart>=0&&hookEnd>hookStart,"shared builder and read-only adapter present");
const mediaStart=main.indexOf("function mediaHasRefs(");
const mediaEnd=main.indexOf("let mediaBBusy=",mediaStart);
assert.ok(mediaStart>=0&&mediaEnd>mediaStart);
vm.runInContext(`
  const VERSION="2.9.15-safe-baseline-bootstrap",STORAGE_KEY="hani_os_life_v23";
  let state=${original},cloudUser={id:"owner-a"},cloudOwnerVerificationEpoch=1;
  let cloudAutoSyncReady=true,loadRecovery={active:false},cloudRecoveryMode=false;
  let importSyncHold=false,cloudSyncBusy=false,cloudApplyingRemote=false;
  function alert(){throw Error("unexpected alert")}
`+main.slice(main.indexOf("function validateBackup("),main.indexOf("function backupSummary("))+
  main.slice(main.indexOf("function validateStoredRecords("),main.indexOf("function writeProtectedState("))+
  main.slice(mediaStart,mediaEnd)+main.slice(hookStart,hookEnd),ctx);
const bridge=window.HANI_DRIVE_BACKUP;
const ticket=bridge.context(),build=()=>bridge.build(ticket);
const validate=text=>{
  bridge.validate(text);
  inspectHaniBackupBuffer(Buffer.from(text));
};
const dir=directory();
const first=await core.writeBackup({handle:dir.handle,build,validate,now});
assert.equal(first.name,core.filename(now));
const saved=dir.files.get(first.name);
assert.equal(first.bytes,saved.length);
assert.equal(first.sha256,createHash("sha256").update(saved).digest("hex"));
assert.equal(vm.runInContext("JSON.stringify(state)",ctx),original,"source unchanged");
const second=await core.writeBackup({handle:dir.handle,build,validate,now});
assert.match(second.name,/_1\.json$/);
assert.deepEqual(dir.files.get(first.name),saved,"collision preserves existing bytes");
const corrupt=directory({corrupt:true});
await assert.rejects(core.writeBackup({handle:corrupt.handle,build,validate,now}),/HASH/);
assert.equal(corrupt.files.values().next().value.length,saved.length,"same-size hash mismatch");
const incomplete=directory();
vm.runInContext('state.books=[{id:"b",coverRef:"media:sha256:"+"a".repeat(64)}]',ctx);
window.HANI_MEDIA={async reembed(){return {complete:false}}};
await assert.rejects(core.writeBackup({handle:incomplete.handle,build,validate,now}),/INCOMPLETE/);
assert.equal(incomplete.calls.write,0);
assert.equal(incomplete.files.size,0,"incomplete backup creates no file");
window.HANI_MEDIA={async reembed(data){return {complete:true,data:{...data,
  books:data.books.map(row=>({...row,cover:"data:image/png;base64,QQ=="}))}}}};
const embedded=JSON.parse(await build());
assert.equal(embedded.books[0].cover,"data:image/png;base64,QQ==");
assert.equal(vm.runInContext("state.books[0].cover",ctx),undefined,"re-embed is export-only");
vm.runInContext("loadRecovery.active=true",ctx);
await assert.rejects(build(),/OWNER/);
vm.runInContext('loadRecovery.active=false;cloudUser={id:"owner-b"}',ctx);
await assert.rejects(build(),/OWNER/);
assert.equal(core.due(null,now),true);
assert.equal(core.due({at:new Date(now-7*86400000).toISOString()},now),true);
assert.equal(core.due({at:new Date(now-7*86400000+1).toISOString()},now),false);
assert.equal(core.due({at:new Date(now+1).toISOString()},now),false);
assert.equal(core.due({at:"invalid"},now),false);
const prompt=directory();prompt.handle.permission="prompt";
const decision=core.weeklyDecision({ready:true,handle:prompt.handle,
  permission:await prompt.handle.queryPermission({mode:"readwrite"}),last:null,now});
assert.equal(decision,"reminder");
assert.equal(prompt.calls.write,0);assert.equal(prompt.calls.request,0);
for(const ready of [false,true]){
  assert.equal(core.weeklyDecision({ready,handle:dir.handle,permission:"denied",now}),"idle");
}
assert.equal(core.weeklyDecision({ready:false,handle:dir.handle,permission:"granted",now}),"idle");
assert.equal(core.weeklyDecision({ready:true,handle:dir.handle,permission:"granted",now}),"write");
assert.equal(core.weeklyDecision({ready:true,handle:null,permission:"granted",now}),"idle");
console.log("Drive Vault core + shared backup adapter: PASS");
