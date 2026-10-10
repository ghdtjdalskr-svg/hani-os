// node scripts/hani-board.test.mjs (after applying M5; no user data or network)
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {webcrypto} from "node:crypto";

const main=fs.readFileSync(new URL("../hani-main.js",import.meta.url),"utf8");
const board=fs.readFileSync(new URL("../hani-board.js",import.meta.url),"utf8");
const hub=fs.readFileSync(new URL("../hani-organization-hub.js",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../hani-board.css",import.meta.url),"utf8");
function fn(name){
  const match=new RegExp("(^|\\n)((?:async )?function "+name+"\\()").exec(main);
  assert.ok(match,name+" exists");
  const start=match.index+match[1].length,end=main.indexOf("\n}",start);
  assert.ok(end>start,name+" has a stable function boundary");
  return main.slice(start,end+2);
}
const start=main.indexOf("const freshState=()=>({");
const fresh=main.slice(start,main.indexOf("\n});",start)+4);
assert.ok(start>=0);
new vm.Script(main);new vm.Script(board);new vm.Script(hub);
const directory=vm.createContext({window:{},document:{getElementById:()=>null}});
vm.runInContext(hub,directory);
const roster=directory.window.HaniOrganizationRoster;
assert.ok(roster);
assert.equal(roster.teams.length,5);
assert.equal(new Set(roster.people.map(p=>p.id)).size,roster.people.length);
assert.ok(roster.people.some(p=>p.id==="dohyun"&&p.name==="도연"));
assert.ok(roster.people.some(p=>p.id==="taeo"&&p.name==="채원"));
assert.ok(roster.people.some(p=>p.id==="gaeun"));
assert.ok(Object.isFrozen(roster.people)&&Object.isFrozen(roster.people[0]));

let fail=false,serial="",queues=0,sequence=0;
const files=[];
const context=vm.createContext({
  window:{HaniOrganizationRoster:roster},document:{getElementById:()=>null},
  VERSION:"2.9.15-safe-baseline-bootstrap",STORAGE_KEY:"hani_os_life_v23",
  seedAccounts:[{id:"account-a",openingCash:0}],structuredClone,TextEncoder,Uint8Array,
  crypto:webcrypto,console:{...console,error(){}},
  n:x=>Number(x)||0,uid:()=>"board-"+(++sequence),today:()=>"2026-10-10",
  monthKeyNow:()=>"2026-10",formatDateTime:String,
  normalizeBodyRecord:x=>x,legacyExercise:()=>[],
  localStorage:{getItem:key=>{assert.equal(key,"hani_os_life_v23");return serial}},
  writeProtectedState:value=>{if(fail)throw Error("quota");serial=value},
  updateStorageStatus(){},cloudQueueSync(){queues++},cloudApplyingRemote:false,
  cloudUser:{id:"sandbox-owner"},cloudAutoSyncReady:true,cloudRuntime:{sync:"ON"},
  importSyncHold:false,cloudRecoveryMode:false,
  isQuotaError:()=>false,serializedBytes:value=>value.length,
  mediaHasRefs:()=>false,renderStoragePanel(){},toast(){},downloadRecoveryOriginal(){},
  alert:message=>assert.fail("unexpected modal: "+message),
  downloadJson:(value,name)=>files.push({value,name})
});
// Only unrelated legacy record normalizers are stubbed; board/save/backup/Cloud are real.
for(const match of fn("normalizeState").matchAll(/\.map\((\w+)\)/g))
  context[match[1]]=x=>x;
const names=["normalizeState","validateStoredRecords","validateBackup","save","buildBackupPayload","exportData",
  "cloudCanonical","cloudSame","cloudComparableState","cloudSyncFingerprintState",
  "cloudHasMeaningfulLocalData","cloudRecordCount","cloudStateHash","cloudSyncDecision"];
vm.runInContext(fresh+"\n"+names.map(fn).join("\n")+
  "\nlet state=freshState();const loadRecovery={active:false};\n"+board+
  "\nthis.api={freshState,normalizeState,validateStoredRecords,validateBackup,exportData,"+
  "cloudComparableState,cloudHasMeaningfulLocalData,cloudRecordCount,cloudStateHash,cloudSyncDecision,"+
  "getState:()=>state,setState:x=>state=x,recovery:loadRecovery};",context);
const api=context.api,handlers=context.window.HaniBoard;
const plain=x=>JSON.parse(JSON.stringify(x));
const rest=x=>{const d=plain(x);delete d.boardPosts;delete d.boardComments;delete d.meta;return d};
const original=plain(api.freshState());
delete original.boardPosts;delete original.boardComments;
original.books=[{id:"book",title:"kept",future:{v:1}}];
original.diaries=[{id:"diary",date:"2026-10-10",title:"kept",content:"unchanged",mood:"neutral",createdAt:"old",updatedAt:"old"}];
original.futureState={keep:["yes"]};
api.validateStoredRecords(original);
const normalized=api.normalizeState(original);
assert.deepEqual(plain(normalized.boardPosts),[]);
assert.deepEqual(plain(normalized.boardComments),[]);
api.setState(normalized);
const before=rest(normalized);
assert.equal(handlers.savePost({title:"회의",body:"내용",category:"WORK",pinned:true}),true);
const post=plain(api.getState().boardPosts[0]);
assert.equal(post.authorId,roster.chairman.id);
assert.equal(post.pinned,true);
assert.equal(handlers.saveComment(post.id,"회장 댓글"),true);
const comment=plain(api.getState().boardComments[0]);
assert.equal(comment.authorId,roster.chairman.id);
assert.equal(api.cloudRecordCount(api.getState())-api.cloudRecordCount(normalized),2);
assert.deepEqual(rest(api.getState()),before,"unrelated state unchanged by handlers");
assert.equal(JSON.parse(serial).boardComments[0].id,comment.id,"real save read-back");
assert.equal(queues,2,"real save queues existing Cloud path");
const withFuture=plain(api.getState());
withFuture.boardPosts[0].futurePost={nested:true};
withFuture.boardComments[0].futureComment="keep";
withFuture.boardPosts.push({...post,id:"staff",authorId:"hani"});
withFuture.boardComments.push({...comment,id:"staff-comment",authorId:"mir"});
api.setState(withFuture);
const protectedBefore=plain(api.getState());
assert.equal(handlers.deleteOwn("post","staff"),false);
assert.equal(handlers.deleteOwn("comment","staff-comment"),false);
assert.equal(handlers.savePost({title:"bad",body:"bad",category:"LIFE"},"staff"),false);
assert.equal(handlers.saveComment(post.id,"bad","staff-comment"),false);
assert.deepEqual(plain(api.getState()),protectedBefore);
assert.equal(handlers.savePost({title:"bad",body:"bad",category:"OTHER"}),false);
assert.equal(handlers.saveComment("missing","no"),false);
assert.equal(handlers.savePost({title:"수정",body:"본문",category:"MEMORY",pinned:false},post.id),true);
assert.equal(api.getState().boardPosts[0].createdAt,post.createdAt);
assert.deepEqual(plain(api.getState().boardPosts[0].futurePost),{nested:true});
assert.equal(handlers.saveComment(post.id,"수정 댓글",comment.id),true);
assert.equal(api.getState().boardComments[0].futureComment,"keep");
const snapshot=plain(api.getState());
fail=true;
assert.equal(handlers.deleteOwn("post",post.id),false);
assert.equal(handlers.saveComment(post.id,"failure"),false);
assert.deepEqual(plain(api.getState()),snapshot,"save failure restores state");
fail=false;api.recovery.active=true;
assert.equal(handlers.savePost({title:"locked",body:"locked",category:"WORK"}),false);
assert.deepEqual(plain(api.getState()),snapshot,"recovery lock preserves state");
api.recovery.active=false;
assert.equal(api.exportData({silent:true}),true);
const backup=JSON.parse(files[0].value),validated=api.validateBackup(backup);
api.validateStoredRecords(validated.data);
const restored=api.normalizeState(validated.data);
assert.deepEqual(plain(restored.boardPosts),plain(api.getState().boardPosts));
assert.deepEqual(plain(restored.boardComments),plain(api.getState().boardComments));
assert.deepEqual(rest(restored),rest(api.getState()),"backup round-trip preserves other state");
for(const key of ["boardPosts","boardComments"]){
  for(const bad of [null,{},[null],[[]],["text"]]){
    assert.throws(()=>api.validateStoredRecords({...original,[key]:bad}));
    assert.throws(()=>api.validateBackup({...original,[key]:bad}));
  }
}
assert.deepEqual(plain(api.cloudComparableState(restored)).boardPosts,plain(restored.boardPosts));
const empty=api.freshState(),onlyBoard={...empty,boardPosts:[post]};
assert.equal(api.cloudHasMeaningfulLocalData(empty),false);
assert.equal(api.cloudHasMeaningfulLocalData(onlyBoard),true);
assert.equal(api.cloudHasMeaningfulLocalData({...empty,boardComments:[comment]}),true);
assert.equal(api.cloudRecordCount(onlyBoard),1);
const baseHash=await api.cloudStateHash(empty),localHash=await api.cloudStateHash(onlyBoard);
const remoteHash=await api.cloudStateHash({...empty,boardComments:[comment]});
assert.notEqual(baseHash,localHash);assert.notEqual(baseHash,remoteHash);
const decision={hasBaseline:true,localMeaningful:true,remoteMeaningful:true,
  localHash,remoteHash,baselineHash:baseHash,appliedRevision:3,remoteRevision:4};
assert.equal(api.cloudSyncDecision(decision).action,"conflict");
assert.equal(api.cloudSyncDecision({...decision,remoteHash:baseHash,remoteRevision:3}).action,"push");
assert.equal(api.cloudSyncDecision({...decision,localHash:baseHash}).action,"pull");
const commentsBefore=plain(api.getState().boardComments);
assert.equal(handlers.deleteOwn("post",post.id),true);
assert.deepEqual(plain(api.getState().boardComments),commentsBefore,"post deletion never cascades");
assert.deepEqual(rest(api.getState()),before);
assert.equal(handlers.deleteOwn("comment",comment.id),true);
assert.ok(api.getState().boardComments.some(c=>c.id==="staff-comment"));
const boardMarkup=html.slice(html.indexOf('<section id="board"'),html.indexOf('<section id="settings"'));
assert.ok(boardMarkup.includes("<dialog")&&boardMarkup.includes("직원 반응 받기"));
assert.ok(/data-board="react"[^>]*>직원 반응 받기/.test(boardMarkup));
assert.ok(boardMarkup.includes('data-board="preview"'));
assert.equal((html.match(/id="board"/g)||[]).length,1);
assert.ok(html.indexOf('./hani-board.js')>html.indexOf('./hani-organization-hub.js'));
assert.ok(css.includes("midnight-black")&&css.includes("titanium-graphite"));
assert.equal(handlers.boardDate("2026-10-09T15:05:00Z",Date.parse("2026-10-10T01:00:00Z")),"00:05","today uses KST time across the UTC boundary");
assert.equal(handlers.boardDate("2026-10-09T14:59:00Z",Date.parse("2026-10-10T01:00:00Z")),"10.09","previous KST day uses month.day");
assert.equal(handlers.boardDate("invalid"),"시간 미상");
assert.ok(css.includes("@media(max-width:600px)")&&css.includes(".board-mobile-two-line")&&css.includes(".board-mobile-label"));
assert.ok(css.includes("text-overflow:ellipsis")&&css.includes("height:40px"));
assert.ok(boardMarkup.indexOf('data-board="detail"')<boardMarkup.indexOf('data-board="list"'),"content view stays above the list");
assert.deepEqual([...boardMarkup.matchAll(/data-board-filter="([^"]+)"/g)].map(m=>m[1]),["POPULAR","ALL","WORK","LIFE","MEMORY","LOUNGE"]);
assert.ok(boardMarkup.includes("직원 새 글·답글"));
// Exercise the canonical view owner, so a reload with a post hash cannot fall back to home.
const routeNodes=new Map(),routeWrites=[];let boardRenders=0;
const routeNode=id=>{if(!routeNodes.has(id))routeNodes.set(id,{classList:{add(){},remove(){},toggle(){}}});return routeNodes.get(id)};
const routeContext=vm.createContext({
  $:routeNode,document:{body:{dataset:{}},querySelectorAll:()=>[],querySelector:()=>null},
  window:{scrollTo(){},HaniBoard:{render(){boardRenders++}}},
  history:{replaceState(_state,_title,url){routeWrites.push(url)}},
  location:{hash:"#board/post%2Fwith%20spaces",href:"https://example.test/#board/post%2Fwith%20spaces"},
  NAVIGATION_VIEWS:new Set(["board","home"]),navigationTimer:null,navigationCurrent:"",
  navigationBooted:false,loginGateUnlocked:false,pageMeta:{},clearTimeout(){},setBanner(){},updateFinishScope(){},cloudUser:null
});
vm.runInContext(fn("showView")+'\nshowView("board/post%2Fwith%20spaces");',routeContext);
assert.equal(routeContext.document.body.dataset.view,"board");assert.equal(boardRenders,1);
assert.equal(routeWrites.at(-1),"#board/post%2Fwith%20spaces","post hash survives canonical showView");
vm.runInContext('showView("board");',routeContext);assert.equal(routeWrites.at(-1),"#board/post%2Fwith%20spaces");
vm.runInContext('showView("home");',routeContext);assert.equal(routeContext.document.body.dataset.view,"home");
assert.equal(routeWrites.at(-1),"https://example.test/","other views keep their existing hash behavior");
assert.ok(!/\.(?:clear|insert|update|delete|upsert)\s*\(/.test(board));
assert.ok(!/\b(?:alert|confirm)\s*\(/.test(board));
console.log("PASS: real handlers/save, rollback, ownership, normalization, backup, unknown fields, Cloud conflict/hash/count, static UI contract");

// Reuse the real persistence/backup fixture for Phase 2 behavior checks.
export {api,handlers,context,roster,plain,rest};
export const inspection=()=>({queues,serial,files});
export const saveFailure=value=>{fail=value};
