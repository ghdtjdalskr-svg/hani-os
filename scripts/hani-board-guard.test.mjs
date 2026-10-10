// node scripts/hani-board-guard.test.mjs — isolated state; no storage or network.
import assert from "node:assert/strict";
import fs from "node:fs";

const read=name=>fs.readFileSync(new URL("../"+name,import.meta.url),"utf8");
const board=read("hani-board.js"),main=read("hani-main.js"),hub=read("hani-organization-hub.js");
function fn(name){
  const match=new RegExp("(^|\\n)function "+name+"\\(").exec(main);
  assert.ok(match,name);const start=match.index+match[1].length,end=main.indexOf("\n}",start);
  assert.ok(end>start);return main.slice(start,end+2);
}
const start=main.indexOf("const freshState=()=>({");
assert.ok(start>=0);
const helpers=main.slice(start,main.indexOf("\n});",start)+4)+"\n"+
  ["cloudCanonical","cloudSame","cloudHasMeaningfulLocalData"].map(fn).join("\n");
function setup(changes={}){
  const slots=new Map(),listeners=[];
  const slot=()=>({textContent:"",innerHTML:"",hidden:false,disabled:false,open:false,
    addEventListener:(...args)=>listeners.push(args),querySelector:()=>null});
  const keys=["counts","author","status","postSubmit","commentSubmit","preview","react","replyContext",
    "detail","more","listCount","confirm","search","postForm","commentForm","replyMode","attendance","arriveNow"];
  keys.forEach(key=>slots.set(key,slot()));
  const root={classList:{contains:()=>true},querySelector:selector=>slots.get(selector.match(/data-board="([^"]+)"/)?.[1])||null,
    querySelectorAll:()=>[],addEventListener:(...args)=>listeners.push(args)};
  slots.get("author").insertAdjacentElement=(_,node)=>slots.set(node.dataset.board,node);
  let saves=0,ids=0;
  const env={window:{},document:{getElementById:id=>id==="board"?root:null,
    createElement:()=>({...slot(),dataset:{}})},VERSION:"2.9.15-safe-baseline-bootstrap",seedAccounts:[],monthKeyNow:()=>"2026-10",
    state:{books:[{id:"meaningful",title:"existing"}],boardPosts:[],boardComments:[]},
    cloudUser:{id:"owner"},cloudAutoSyncReady:true,cloudRuntime:{sync:"ON"},loadRecovery:{active:false},
    importSyncHold:false,cloudRecoveryMode:false,loginGateUnlocked:true,
    sessionStorage:{getItem:()=>null,setItem(){}},uid:()=>"living-"+(++ids),
    save:()=>{saves++;return {ok:true}},...changes};
  // The with scope is fixture-only: global lexical bindings remain live across renders.
  const api=new Function("env","with(env){"+helpers+"\nstate={...freshState(),...state};\n"+hub+"\n"+
    'window.HANI_CHARACTER_ARCHIVE_DATA={characters:[]};window.HaniEditorialSources={};\n'+board+
    "\nreturn window.HaniBoard;}")(env);
  return {env,api,slots,listeners,saves:()=>saves};
}
const input={title:"회장님 이야기",body:"함께 이야기해요",category:"LIFE"};
const blocked=[
  ["sync STOP",{cloudRuntime:{sync:"STOP",message:"이 기기의 동기화 기준이 없고 Local과 Cloud 내용이 다릅니다"}}],
  ["no meaningful data",{state:{boardPosts:[],boardComments:[]}}],
  ["not logged in",{cloudUser:null}],
  ["sync not ready",{cloudAutoSyncReady:false}],
  ["missing sync readiness",{cloudAutoSyncReady:undefined}],
  ["missing sync runtime",{cloudRuntime:undefined}],
  ["sync readiness must be true",{cloudAutoSyncReady:1}],
  ["sync OFF",{cloudRuntime:{sync:"OFF"}}],
  ["local recovery",{loadRecovery:{active:true}}],
  ["import hold",{importSyncHold:true}],
  ["cloud recovery",{cloudRecoveryMode:true}]
];
for(const [label,changes] of blocked){
  const t=setup(changes),before=JSON.stringify(t.env.state),events=t.listeners.length,notice=t.slots.get("syncNotice");
  assert.equal(t.saves(),0,label+": initial render must not save");
  assert.equal(t.api.generateDaily().length,0,label+": no drafts");
  assert.equal(t.api.refreshLiving(),false);
  assert.equal(t.api.refreshLiving(Date.now(),true),false);
  assert.equal(t.api.savePost(input),false);
  assert.equal(t.api.saveComment("missing","댓글"),false);
  assert.equal(t.api.attendance(),false);
  t.api.render();t.api.render();
  assert.equal(t.saves(),0,label+": zero saves");
  assert.equal(JSON.stringify(t.env.state),before,label+": state preserved");
  assert.equal(t.slots.get("postSubmit").disabled,true);
  assert.equal(t.slots.get("replyMode").disabled,true);
  assert.equal(notice.hidden,false);
  assert.equal(notice.textContent,"Cloud 동기화가 준비되면 새 글과 답글이 도착해요.");
  assert.ok(t.slots.get("status").textContent,label+": explains why");
  assert.equal(t.slots.get("syncNotice"),notice,"persistent notice");
  assert.equal(t.listeners.length,events,"no extra event layer on render");
}
// A stopped fresh profile stays empty until both sync and its meaningful baseline arrive.
const t=setup({state:{boardPosts:[],boardComments:[]},cloudRuntime:{sync:"STOP"}});
t.env.cloudRuntime.sync="ON";t.api.render();assert.equal(t.saves(),0);
t.env.state.books=[{id:"restored",title:"Cloud baseline"}];t.api.render();
assert.equal(t.saves(),1,"next existing render generates daily drafts");
assert.equal(t.api.postDrafts().length,0,"ready default publishes staff posts");
assert.equal(t.api.listPosts().length,3,"ready default keeps all three daily posts");
assert.equal(t.slots.get("syncNotice").hidden,true);
assert.equal(t.slots.get("postSubmit").disabled,false);
t.api.render();assert.equal(t.saves(),1,"daily generation remains idempotent");
assert.equal(t.api.savePost(input),true);
const post=t.env.state.boardPosts.find(p=>!p.draft);
assert.ok(post);
assert.equal(t.api.saveComment(post.id,"회장님 댓글"),true);
assert.equal(t.api.attendance(),true);assert.equal(t.api.attendance(),false);
// A deterministic due reply exercises materialization independent of the random story length.
t.env.state.boardComments.push({id:"due",postId:post.id,authorId:"hani",body:"도착할 답글",generated:true,
  pending:true,scheduledAt:new Date(Date.now()-60000).toISOString(),createdAt:new Date().toISOString()});
t.env.cloudRuntime.sync="STOP";
const before=JSON.stringify(t.env.state),saved=t.saves();
t.api.render();t.api.openPost(post.id);t.api.refreshLiving(Date.now(),true);
assert.equal(t.api.savePost(input),false);assert.equal(t.api.saveComment(post.id,"막힌 댓글"),false);
assert.equal(t.api.attendance(),false);assert.equal(t.api.toggleLike(post.id),false);
assert.equal(t.api.setReplyMode("review"),false);
assert.equal(t.api.toggleReaction(post.id,"👍"),false);
assert.equal(t.api.deleteOwn("post",post.id),false);
assert.equal(t.saves(),saved,"stopped view counters and due replies never save");
assert.equal(JSON.stringify(t.env.state),before,"pending replies and views preserved");
t.env.cloudRuntime.sync="ON";t.api.render();
assert.equal(t.env.state.boardComments.find(c=>c.id==="due").pending,false,"due reply arrives on next render");
const views=t.env.state.boardPosts.find(p=>p.id===post.id).views||0;
assert.equal(t.api.openPost(post.id),true);
assert.equal(t.env.state.boardPosts.find(p=>p.id===post.id).views,views+1);
t.api.openPost(post.id);
assert.equal(t.env.state.boardPosts.find(p=>p.id===post.id).views,views+1,"view counted once per session");
console.log("PASS: board sync readiness, zero blocked writes/drafts, persistent read-only UI, render recovery, drafts/replies/attendance/views");
