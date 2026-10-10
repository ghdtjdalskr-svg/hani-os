// node scripts/hani-board-community.test.mjs — synthetic records, no network/user data.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {api,handlers,context,roster,plain,rest,inspection,saveFailure} from "./hani-board.test.mjs";

const board=fs.readFileSync(new URL("../hani-board.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const markup=index.slice(index.indexOf('<section id="board"'),index.indexOf('<section id="characterArchive"'));
const initial={...plain(api.freshState()),futureState:{preserve:"yes"}};
initial.books=[{id:"sandbox-baseline",title:"Existing local record"}];
initial.boardPosts=[{id:"legacy",title:'회의 <img src=x onerror="bad()">',body:"첫 줄\n사실: 테스트 일정 논의",authorId:roster.chairman.id,category:"WORK",pinned:true,createdAt:"2026-10-09T00:00:00Z",future:{keep:true}}];
api.setState(initial);
const unrelated=rest(initial);
const noWrite=inspection().queues;
assert.equal(handlers.postFields(initial.boardPosts[0]).views,0);
assert.equal(handlers.postFields({views:-3,likes:Infinity,likedByOwner:"true"}).likes,0);
assert.equal(handlers.postFields({views:3.8}).views,3);
assert.equal(handlers.postFields({likedByOwner:"true"}).likedByOwner,false);
assert.deepEqual(plain(handlers.commentFields({future:1})),{future:1,parentId:"",generated:false,threadId:""});
assert.equal(inspection().queues,noWrite,"default projections never save");
assert.equal(api.getState().boardPosts[0].views,undefined,"no eager migration");
assert.equal(handlers.openPost("legacy"),true);
assert.equal(api.getState().boardPosts[0].views,1);
assert.equal(handlers.openPost("legacy"),true);
assert.equal(inspection().queues,noWrite+1,"opening again has no save");
assert.equal(handlers.toggleLike("legacy"),true);
assert.equal(api.getState().boardPosts[0].likes,1);
assert.equal(api.getState().boardPosts[0].likedByOwner,true);
assert.equal(handlers.toggleLike("legacy"),true);
assert.equal(api.getState().boardPosts[0].likes,0);
assert.equal(api.getState().boardPosts[0].likedByOwner,false);
assert.deepEqual(plain(api.getState().boardPosts[0].future),{keep:true});
assert.equal(handlers.saveComment("legacy","원댓글"),true);
const parent=api.getState().boardComments.at(-1);
assert.equal(parent.generated,false);assert.equal(parent.threadId,"");
assert.equal(handlers.saveComment("legacy","답글","",parent.id),true);
const reply=api.getState().boardComments.at(-1);
assert.equal(reply.parentId,parent.id);
assert.equal(handlers.saveComment("legacy","두 단계 금지","",reply.id),false);
assert.equal(handlers.saveComment("legacy","없는 부모","","missing"),false);
assert.equal(handlers.saveComment("legacy","답글 수정",reply.id),true);
assert.equal(api.getState().boardComments.at(-1).parentId,parent.id);
assert.equal(handlers.savePost({title:"생활",body:"산책",category:"LIFE"}),true);
const life=api.getState().boardPosts.at(-1);
assert.equal(handlers.saveComment(life.id,"다른 글 부모 금지","",parent.id),false);
api.setState({...api.getState(),boardPosts:[...api.getState().boardPosts,
  {id:"popular",authorId:"yuri",title:"점검",body:"체크",category:"WORK",likes:9,views:3,createdAt:"2026-10-09"},
  {id:"viewed",authorId:"hani",title:"열람",body:"많은 조회",category:"MEMORY",likes:9,views:30,createdAt:"2026-10-08"}]});
assert.deepEqual(plain(handlers.listPosts("POPULAR").map(p=>p.id)),["legacy","viewed","popular",life.id]);
assert.equal(handlers.listPosts("LIFE").length,1);
assert.equal(handlers.listPosts("ALL","유리")[0].id,"popular");
assert.equal(handlers.listPosts("ALL","QA 책임")[0].id,"popular");
assert.equal(handlers.listPosts("ALL","테스트 일정")[0].id,"legacy");
assert.equal(handlers.listPosts("ALL","없는검색").length,0);
const sortBefore=plain(api.getState());handlers.listPosts("POPULAR","전략기획실");
assert.deepEqual(plain(api.getState()),sortBefore,"sort/search do not mutate state");
assert.equal(handlers.relativeTime("invalid"),"시간 미상");
assert.equal(handlers.relativeTime("2026-10-10T00:00:00Z",Date.parse("2026-10-10T00:02:00Z")),"2분 전");
console.log("PASS: defaults without migration, session views, likes, one-level replies, search/filter/popular, unknown fields");

const failedView=plain(api.getState().boardPosts.find(p=>p.id==="popular"));
saveFailure(true);handlers.openPost("popular");saveFailure(false);
assert.deepEqual(plain(api.getState().boardPosts.find(p=>p.id==="popular")),failedView);
handlers.openPost("popular");assert.equal(api.getState().boardPosts.find(p=>p.id==="popular").views,failedView.views+1);
const viewSaves=inspection().queues;handlers.openPost("popular");
assert.equal(inspection().queues,viewSaves,"successful retry consumes one session view");

for(const category of ["WORK","LIFE","MEMORY","LOUNGE"]){
  const input={...initial.boardPosts[0],category};
  const a=handlers.storyTemplate(input,1),b=handlers.storyTemplate(input,2);
  assert.ok(a.length>0&&a.length<=handlers.replySafetyBound);
  assert.equal(a[0].stage,"발단");if(a.length>=3)assert.equal(a.at(-2).stage,"반전");if(a.length>1)assert.equal(a.at(-1).stage,"마무리");
  assert.ok(a.every(c=>roster.people.some(p=>p.id===c.authorId)));
  assert.ok(a.every(c=>handlers.candidateScore(c.authorId,input,input,[]).relevant),"preview participants fit the topic");
  assert.notDeepEqual(plain(a),plain(b),"regeneration varies the thread");
  assert.deepEqual(plain(a),plain(handlers.storyTemplate(input,1)),"deterministic for same input/round");
  if(category!=="LOUNGE")assert.ok(!a.some(c=>/가상의 탕비실|상상 속 휴게실/.test(c.body)));
  else if(a.length>1)assert.ok(a.some(c=>/가상의 탕비실|상상 속 휴게실/.test(c.body)));
}
let before=inspection().queues;
assert.equal(await handlers.previewThread("legacy"),true);
assert.equal(await handlers.previewThread("legacy"),true);
assert.equal(inspection().queues,before,"preview/regenerate never save");
handlers.cancelPreview();assert.equal(handlers.postPreview(),false);
assert.equal(inspection().queues,before,"cancel never saves");
const cancelled=handlers.previewThread("legacy");handlers.cancelPreview();
assert.equal(await cancelled,false);assert.equal(handlers.postPreview(),false,"late response after cancellation ignored");
assert.equal(await handlers.previewThread("legacy"),true);
const countBefore=api.getState().boardComments.length;
assert.equal(handlers.postPreview(),true);
assert.equal(inspection().queues,before+1,"one real save queues Cloud once for the entire thread");
const generated=api.getState().boardComments.slice(countBefore);
assert.ok(generated.length>0&&generated.length<=handlers.replySafetyBound);
assert.equal(new Set(generated.map(c=>c.threadId)).size,1);
assert.ok(generated[0].threadId);assert.equal(generated[0].parentId,"");
assert.ok(generated.slice(1).every(c=>c.parentId===generated[0].id));
assert.ok(generated.every(c=>c.generated===true&&c.postId==="legacy"&&roster.people.some(p=>p.id===c.authorId)));
assert.equal(handlers.postPreview(),false,"double posting blocked");
assert.deepEqual(rest(api.getState()),unrelated,"no new top-level state or unrelated writes");
assert.equal(await handlers.previewThread("legacy"),true);
const rollback=plain(api.getState());saveFailure(true);
assert.equal(handlers.postPreview(),false);assert.deepEqual(plain(api.getState()),rollback);
saveFailure(false);assert.equal(handlers.postPreview(),true,"failed save keeps retryable draft");
assert.equal(await handlers.previewThread("legacy"),true);
assert.equal(handlers.savePost({title:"본문 변경",body:"새 사실",category:"WORK"},"legacy"),true);
before=inspection().queues;assert.equal(handlers.postPreview(),false,"changed source blocks stale draft");assert.equal(inspection().queues,before);
handlers.cancelPreview();
api.recovery.active=true;
assert.equal(await handlers.previewThread("legacy"),false);
assert.equal(handlers.toggleLike("legacy"),false);assert.equal(inspection().queues,before);
api.recovery.active=false;
assert.equal(api.exportData({silent:true}),true);
const backup=JSON.parse(inspection().files.at(-1).value),restored=api.normalizeState(api.validateBackup(backup).data);
assert.deepEqual(plain(restored.boardPosts),plain(api.getState().boardPosts));
assert.deepEqual(plain(restored.boardComments),plain(api.getState().boardComments));
assert.equal(JSON.parse(inspection().serial).boardComments.at(-1).generated,true,"real storage read-back retains new fields");
console.log("PASS: roster/story/category variation, preview/regenerate/cancel no write, atomic post, failure retry, stale/recovery guard, backup round-trip");

// Minimal DOM records HTML/events; CSS layout and native dialog behavior require browser QA.
const slots=new Map();
function node(){
  return {innerHTML:"",textContent:"",disabled:false,hidden:false,open:false,returnValue:"",listeners:{},
    addEventListener(type,fn){this.listeners[type]=fn},focus(){},setAttribute(){},querySelector(){return null},
    showModal(){assert.equal(this.open,false);this.open=true},close(){this.open=false;this.listeners.close?.()},
    reset(){for(const field of Object.values(this.elements||{})){field.value="";field.checked=false}}};
}
for(const [,key] of markup.matchAll(/data-board="([^"]+)"/g)){assert.ok(!slots.has(key),"unique slot "+key);slots.set(key,node())}
for(const key of ["postForm","commentForm"]){slots.get(key).elements={};for(const name of ["title","body","category","pinned"])slots.get(key).elements[name]={value:"",checked:false,focus(){}}}
const filters=["ALL","WORK","LIFE","MEMORY","LOUNGE","POPULAR"].map(tab=>({...node(),dataset:{boardFilter:tab}}));
const root={...node(),querySelector:selector=>slots.get(selector.match(/data-board="([^"]+)"/)?.[1]),querySelectorAll:()=>filters,contains:()=>true};
root.classList={contains:()=>false};
const historyListeners={},historyWrites=[];
context.location={hash:"#board",href:"https://example.test/#board"};
context.history={
  pushState(_state,_title,url){historyWrites.push(url);context.location.hash=url},
  replaceState(_state,_title,url){context.location.hash=url}
};
context.window.addEventListener=(type,fn)=>{historyListeners[type]=fn};
context.window.scrollY=320;
let restoredScroll=null;context.window.scrollTo=options=>{restoredScroll=options.top};
context.document.getElementById=id=>id==="board"?root:null;
const sessionRecords=new Map();context.sessionStorage={getItem:key=>sessionRecords.get(key)||null,setItem:(key,value)=>sessionRecords.set(key,value)};
vm.runInContext(board,context);let ui=context.window.HaniBoard;
const click=dataset=>root.listeners.click({target:{closest:()=>({dataset,hasAttribute:()=>false})}});
const flush=async()=>{await Promise.resolve();await Promise.resolve()};
assert.equal(ui.savePost({title:"목록 공지",body:"상단 고정 확인",category:"WORK",pinned:true}),true);
assert.equal(ui.savePost({title:'<script>bad()</script>',body:'A\n<img src=x onerror="bad()">',category:"LOUNGE"}),true);
const xss=api.getState().boardPosts.at(-1);click({boardOpen:xss.id});
assert.ok(slots.get("article").innerHTML.includes("&lt;script&gt;bad()&lt;/script&gt;"));
assert.ok(slots.get("article").innerHTML.includes('A\n&lt;img'));
assert.ok(!/<script>|<img src=x/.test(slots.get("article").innerHTML));
assert.equal(slots.get("detail").hidden,false,"title click opens content");
assert.equal(context.location.hash,"#board/"+encodeURIComponent(xss.id));
assert.ok(slots.get("list").innerHTML.includes('class="board-row board-current"'),"open row highlighted");
assert.deepEqual([...slots.get("list").innerHTML.matchAll(/<th scope="col">([^<]+)<\/th>/g)].map(m=>m[1]),["탭(말머리)","제목","글쓴이","날짜","조회","추천"]);
const pinnedRow=slots.get("list").innerHTML.indexOf('board-row board-pinned'),normalRow=slots.get("list").innerHTML.indexOf('class="board-row"');
assert.ok(pinnedRow>=0&&normalRow>pinnedRow,"pinned notice precedes normal rows");
assert.ok(slots.get("list").innerHTML.includes('board-mobile-two-line'));
assert.ok(slots.get("list").innerHTML.includes('title="성민 · 회장"'));
assert.ok(/<img[^>]+loading="lazy"[^>]+decoding="async"[^>]+width="28"[^>]+height="28"/.test(slots.get("list").innerHTML));
assert.ok(/<img[^>]+width="40"[^>]+height="40"/.test(slots.get("article").innerHTML));
const sessionViews=api.getState().boardPosts.find(p=>p.id===xss.id).views;
vm.runInContext(board,context);ui=context.window.HaniBoard;ui.openPost(xss.id);
assert.equal(api.getState().boardPosts.find(p=>p.id===xss.id).views,sessionViews,"sessionStorage prevents view increment after module reload");
click({board:"react"});await flush();
assert.equal(slots.get("preview").open,true);assert.equal(slots.get("previewPost").disabled,false);
assert.equal(slots.get("previewLabel").textContent,"AI 연결 전 미리보기");
assert.ok(!/<script>|<img src=x/.test(slots.get("previewComments").innerHTML));
before=inspection().queues;slots.get("preview").listeners.cancel();slots.get("preview").close();
assert.equal(ui.postPreview(),false);assert.equal(inspection().queues,before);
click({board:"react"});await flush();click({board:"previewPost"});
assert.equal(inspection().queues,before+1);assert.equal(slots.get("preview").open,false);
const first=api.getState().boardComments.find(c=>c.postId===xss.id&&!c.parentId);click({boardReply:first.id});
assert.ok(slots.get("replyContext").textContent.includes("에게 답글"));
slots.get("commentForm").elements.body.value="이벤트 답글";
slots.get("commentForm").listeners.submit({preventDefault(){},currentTarget:slots.get("commentForm")});
assert.equal(api.getState().boardComments.at(-1).parentId,first.id);
assert.ok(slots.get("comments").innerHTML.includes("board-reply"));
assert.ok(/<strong class="board-comment-count">\d+<\/strong>/.test(slots.get("list").innerHTML),"comment count is a bold number");
click({boardLike:xss.id});assert.equal(api.getState().boardPosts.find(p=>p.id===xss.id).likes,1);
for(let i=0;i<24;i++)ui.savePost({title:"목록"+i,body:"본문",category:"WORK"});
click({boardFilter:"ALL"});assert.equal((slots.get("list").innerHTML.match(/data-board-open=/g)||[]).length,20);
assert.equal(slots.get("more").hidden,false);click({board:"more"});
assert.equal(slots.get("more").hidden,true);
slots.get("search").listeners.input({target:{value:"목록"}});
assert.equal((slots.get("list").innerHTML.match(/data-board-open=/g)||[]).length,20);
click({boardFilter:"LIFE"});assert.ok(slots.get("list").innerHTML.includes("검색 결과가 없습니다."));
assert.ok(!/\.(?:clear|insert|update|delete|upsert)\s*\(/.test(board));
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
assert.ok(!/<(?:article|div|span|h[1-6]|button|form|dialog)\b[^>]*\sid=["']/.test(board),"no duplicate dynamic DOM id literals");
console.log("PASS: delegated events, preview dialog/cancel/post, reply/like/search/pagination, escaped title/body/preview, unique DOM slots/IDs");

// Closing and browser history restore the same list position without saving.
ui.closePost();context.window.scrollY=640;
click({boardOpen:xss.id});const closeSaves=inspection().queues;
click({board:"closePost"});assert.equal(context.location.hash,"#board");
assert.equal(slots.get("detail").hidden,true);assert.equal(restoredScroll,640);
assert.equal(inspection().queues,closeSaves,"closing never saves");
root.classList.contains=()=>true;
context.location.hash="#board/"+encodeURIComponent(xss.id);historyListeners.popstate();
assert.equal(slots.get("detail").hidden,false,"forward restores the content");
context.location.hash="#board";historyListeners.popstate();
assert.equal(slots.get("detail").hidden,true,"back returns to list");
assert.equal(inspection().queues,closeSaves,"history never counts the same post twice");
context.location.hash="#board/"+encodeURIComponent(xss.id);
vm.runInContext(board,context);
assert.equal(slots.get("detail").hidden,false,"module reload restores hash selection");
assert.equal(inspection().queues,closeSaves,"refresh preserves session view count");
root.classList.contains=()=>false;context.location.hash="#board";
const broken={hidden:false,hasAttribute:key=>key==="data-board-avatar"};
root.listeners.error({target:broken});assert.equal(broken.hidden,true,"failed portrait reveals the letter fallback");
console.log("PASS: table columns/pinned/current row, KST dates, avatars/fallback, title/hash/close/back/refresh, mobile class contract");

api.setState({...api.getState(),boardPosts:[roster.chairman,...roster.people].map((p,i)=>({
  id:"avatar-"+p.id,authorId:p.id,category:"LIFE",title:p.name+" 프로필",body:"예시",createdAt:new Date().toISOString(),likes:i
})),boardComments:[]});
vm.runInContext(board,context);
for(const p of [roster.chairman,...roster.people]){
  const expected=p.id===roster.chairman.id?"assets/team/hani-org-chair-v1.webp":
    p.group==="M9"?"assets/profiles/thumb/hani-profile-"+p.id+"-128.webp":
    "assets/profiles/hani-staff-"+p.id+(p.id==="seoyun"?"-v7.webp":"-v5.webp");
  assert.ok(slots.get("list").innerHTML.includes(expected),p.id+" uses its existing static portrait");
}
assert.equal((slots.get("list").innerHTML.match(/loading="lazy" decoding="async" width="28" height="28"/g)||[]).length,18);
console.log("PASS: all 18 roster portraits use static assets with bounded dimensions and lazy decoding");

await import("./hani-board-living.test.mjs");
