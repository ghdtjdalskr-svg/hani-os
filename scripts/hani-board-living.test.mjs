// Synthetic Board v4 through the real board/save/backup functions; no user data/network.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {api,handlers as h,context,roster,plain,rest,inspection,saveFailure} from "./hani-board.test.mjs";
import {fixtureLibrary} from "./hani-board-library-fixture.mjs";
const board=fs.readFileSync(new URL("../hani-board.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
vm.runInContext(fs.readFileSync(new URL("../hani-character-archive-data.js",import.meta.url),"utf8"),context);
vm.runInContext(fs.readFileSync(new URL("../hani-relationship-seed.js",import.meta.url),"utf8"),context);
const editorial=fs.readFileSync(new URL("../hani-ui-v02992.js",import.meta.url),"utf8");
vm.runInContext(editorial.slice(editorial.indexOf("// BEGIN CANONICAL TAB VOICE BUNDLE"),editorial.indexOf("const SPORTS_LINES")),context);
const now=Date.parse("2026-10-05T14:59:00Z"),day=86400000;
const fresh=(mode="auto")=>({...plain(api.freshState()),books:[{id:"baseline",title:"Existing local record"}],futureState:{kept:true},
  boardPosts:[{id:"settings",boardMeta:true,draft:true,replyMode:mode,authorId:"seongmin",title:"게시판 설정",body:"게시판 내부 설정",category:"WORK",createdAt:new Date(now-day).toISOString()}]});
const reset=(library=[],mode="auto")=>{api.setState(fresh(mode));context.HaniBoardLibrary={threads:library}};
const single=action=>{const saves=inspection().queues;assert.equal(action(),true);assert.equal(inspection().queues,saves+1,"one existing save");};
reset();const unchanged=rest(api.getState());
assert.equal(Object.keys(h.personaMap()).length,17);
for(const p of roster.people)assert.equal(h.personaMap()[p.id].source.member.id,p.id);
single(()=>h.refreshLiving(now));
assert.equal(h.listPosts().length,0,"empty library has no template fallback");
const quiet=plain(api.getState()),quietSaves=inspection().queues;
assert.equal(h.refreshLiving(now),false);assert.equal(inspection().queues,quietSaves);assert.deepEqual(plain(api.getState()),quiet);
assert.deepEqual(rest(api.getState()),unchanged);
api.setState({...api.getState(),boardPosts:[...api.getState().boardPosts,{id:"unknown-date",generated:true,ownerTied:true,createdAt:"invalid"},
  {id:"invalid-pending",libraryId:"retained",pending:true,createdAt:"invalid",scheduledAt:"invalid"}]});
assert.equal(h.refreshLiving(now),false,"invalid imported dates neither crash nor publish");
reset(fixtureLibrary(40));
for(let d=0;d<7;d++){
  const at=now+d*day;single(()=>h.refreshLiving(at));
  const rows=api.getState().boardPosts.filter(p=>p.libraryId&&h.dayKey(Date.parse(p.createdAt))===h.dayKey(at));
  assert.ok(rows.length>=2&&rows.length<=4);
  assert.equal(new Set(rows.map(p=>p.createdAt)).size,rows.length,"spread timestamps");
  assert.ok(Math.max(...rows.map(p=>Date.parse(p.createdAt)))-Math.min(...rows.map(p=>Date.parse(p.createdAt)))>=10*3600000);
  const snapshot=plain(api.getState());assert.equal(h.refreshLiving(at),false);assert.deepEqual(plain(api.getState()),snapshot);
}
const daily=api.getState().boardPosts.filter(p=>p.libraryId);
assert.equal(new Set(daily.map(p=>p.libraryId)).size,daily.length,"no reuse while unused library remains");
assert.ok(daily.every(p=>p.generated&&!p.draft&&!p.pending));
reset(fixtureLibrary(3));single(()=>h.refreshLiving(now));h.refreshLiving(now+day);
assert.equal(api.getState().boardPosts.filter(p=>p.libraryId).length,3);
assert.equal(h.refreshLiving(now+89*day),false,"exhausted library stays quiet for 90 days");
single(()=>h.refreshLiving(now+90*day));
assert.ok(api.getState().boardPosts.filter(p=>p.libraryId).length>3,"90-day reuse after exhaustion");
const restricted=fixtureLibrary(2).map((t,i)=>({...t,season:i?["winter"]:["autumn"],weekday:i?[]:[1]}));
reset(restricted);single(()=>h.refreshLiving(now));
assert.equal(api.getState().boardPosts.filter(p=>p.libraryId).length,1,"Monday/autumn only");
reset(fixtureLibrary(2).map((t,i)=>({...t,season:i?["summer"]:[]})));single(()=>h.refreshLiving(now));
assert.equal(h.refreshLiving(now+90*day),false,"unused summer thread blocks reuse before exhaustion");
console.log("PASS: empty library quiet, daily 2-4/spread/idempotence, no reuse, exhaustion/90 days, season/weekday");

// Publication and every afterMin boundary, including staff replies and overnight arrivals.
const timed=fixtureLibrary(1);timed[0].comments.push({authorId:"yuri",body:"明日もう一度見ますね。",replyTo:1,afterMin:1440});
reset(timed);single(()=>h.refreshLiving(now-20*3600000));
const scheduled=api.getState().boardPosts.find(p=>p.libraryId),at=Date.parse(scheduled.scheduledAt);
assert.equal(scheduled.pending,true);assert.equal(h.listPosts().length,0);
const queue=api.getState().boardComments;assert.equal(queue.length,timed[0].comments.length);
queue.forEach((c,i)=>assert.equal(Date.parse(c.scheduledAt),at+timed[0].comments[i].afterMin*60000));
assert.equal(h.refreshLiving(at-1,true),false,"force cannot publish early library content");
single(()=>h.refreshLiving(at));assert.equal(h.listPosts().length,1);assert.ok(api.getState().boardComments.every(c=>c.pending));
for(const c of queue){
  const due=Date.parse(c.scheduledAt);assert.equal(h.refreshLiving(due-1,true),false);
  single(()=>h.refreshLiving(due));const arrived=api.getState().boardComments.find(r=>r.id===c.id);
  assert.equal(arrived.pending,false);assert.equal(arrived.createdAt,c.scheduledAt);assert.equal(arrived.arrivedAt,c.scheduledAt);
}
assert.equal(api.getState().boardComments[1].parentId,queue[0].id);
const end=plain(api.getState());assert.equal(h.refreshLiving(at+day),false);assert.deepEqual(plain(api.getState()),end);
assert.equal(h.queueReplies(scheduled,scheduled,[],now).length,0,"no staff template generator");
assert.equal(await h.previewThread(scheduled.id),false,"no staff regeneration preview");
console.log("PASS: post scheduling, exact afterMin boundaries/overnight, linked staff comments, no force-early/duplicate");

// Cleanup is authorized only for exact generated/body-marker items; all other data survives.
reset();const old=(id,body,extra={})=>({id,body,authorId:"hani",generated:true,category:"WORK",title:id,createdAt:new Date(now).toISOString(),...extra});
const migration=fresh();migration.boardPosts.push(old("old-post","[사내 세계관 이야기] 옛 글"),old("old-draft","[기록 기반 초안] 옛 글",{draft:true}),
  old("old-thought","주제에 관한 제 생각: 옛 글"),old("owner-post","[사내 세계관 이야기] 직접 작성",{authorId:"seongmin"}),
  old("library-post","[사내 세계관 이야기] 보존",{libraryId:"existing"}),old("manual-post","[사내 세계관 이야기] 보존",{generated:false}),old("plain-post","자연스러운 기존 글"));
migration.boardComments=[old("old-comment","[기록 기반 초안] 옛 댓글",{postId:"plain-post"}),old("owner-comment","[기록 기반 초안] 직접 작성",{authorId:"seongmin",postId:"old-post"}),
  old("library-comment","에 관한 제 생각: 보존",{libraryId:"existing",postId:"library-post"}),old("manual-comment","에 관한 제 생각: 보존",{generated:false,postId:"old-post"})];
api.setState(migration);const before=plain(api.getState());saveFailure(true);
assert.equal(h.refreshLiving(now),false);assert.deepEqual(plain(api.getState()),before,"failed cleanup restores flag and originals");
saveFailure(false);single(()=>h.refreshLiving(now));
assert.deepEqual(plain(api.getState().boardPosts.map(p=>p.id)),["settings","owner-post","library-post","manual-post","plain-post"]);
assert.deepEqual(plain(api.getState().boardComments.map(c=>c.id)),["owner-comment","library-comment","manual-comment"]);
assert.equal(api.getState().boardPosts[0].templateCleanupV4,true);assert.deepEqual(rest(api.getState()),rest(before));
const cleaned=plain(api.getState());assert.equal(h.refreshLiving(now),false);assert.deepEqual(plain(api.getState()),cleaned);
api.setState({...api.getState(),boardPosts:[...api.getState().boardPosts,old("late-old","[기록 기반 초안] 이미 정리 후 동기화된 글")]});
assert.equal(h.refreshLiving(now),false,"cleanup never runs twice");
console.log("PASS: exact old markers/generated filter, owner/library/manual preservation, one save, one-time flag, rollback");

// Owner reactions never quote a 13-character span, never change subject, and reserve just once.
reset();single(()=>h.savePost({title:"일본어 퀴즈",body:"@히나 일본어 공부를 완료했어요!",category:"LIFE"}));
const own=api.getState().boardPosts.find(p=>p.authorId==="seongmin"&&!p.boardMeta),ownerQueue=api.getState().boardComments;
assert.ok(ownerQueue.length>=1&&ownerQueue.length<=3);assert.ok(ownerQueue.some(c=>c.authorId==="hina"));
assert.ok(ownerQueue.every(c=>c.pending&&c.toOwner&&c.intent==="cheer"&&c.body.length<90));
assert.equal(h.queueReplies(own,own,ownerQueue,now).length,0,"source reservation deduplication");
for(const [intent,text] of [["agree","저도 좋아요"],["question","왜 그럴까요?"],["joke","농담이에요 ㅋㅋ"],["cheer","오늘 해냈어요"],["care","조금 피곤하고 힘들어요"],["info","정보를 정리했어요"]]){
  assert.equal(h.replyIntent(text),intent);
  for(const member of roster.people){
    const source={...own,id:"intent-"+intent+member.id,body:"@"+member.name+" "+text};
    const replies=h.ownerReactions(source,source,[],1);assert.ok(replies.length>=1&&replies.length<=3);
    for(const c of replies){for(let i=0;i+13<=source.body.length;i++)assert.ok(!c.body.includes(source.body.slice(i,i+13)));assert.ok(!/「|“|탕비실|동아리|모임/.test(c.body));}
    const echo={...source,body:"@"+member.name+" "+replies.map(c=>c.body).join(" ")};
    for(const c of h.ownerReactions(echo,echo,[],1))for(let i=0;i+13<=echo.body.length;i++)assert.ok(!c.body.includes(echo.body.slice(i,i+13)),"phrase collision also cannot echo");
  }
}
single(()=>h.refreshLiving(Date.now(),true));single(()=>h.saveComment(own.id,"@MIR 왜 그렇게 생각했어요?"));
const ownerComment=api.getState().boardComments.findLast(c=>c.authorId==="seongmin");
assert.ok(api.getState().boardComments.some(c=>c.authorId==="mir"&&c.pending&&c.parentId===ownerComment.id));
single(()=>h.saveComment(own.id,"수정한 질문",ownerComment.id));single(()=>h.refreshLiving(Date.now(),true));
assert.ok(api.getState().boardComments.filter(c=>c.replySourceId===ownerComment.id).every(c=>c.disposition==="stale"));
api.recovery.active=true;const protectedSnapshot=plain(api.getState()),blockedSaves=inspection().queues;
assert.equal(h.refreshLiving(Date.now()+day,true),false);assert.equal(h.attendance(),false);assert.deepEqual(plain(api.getState()),protectedSnapshot);assert.equal(inspection().queues,blockedSaves);api.recovery.active=false;
console.log("PASS: persona/intent/mention/affinity, 1-3 short no-echo reactions, atomic reservation, edited source retirement, guard");

// Record posts are one per KST day, natural, deduplicated, and only verified values appear.
reset();const records=fresh();records.body=[{id:"weight",date:"2026-10-05",weight:83.25},{id:"invalid",date:"2026-10-05",weight:null}];
records.exercise=[{id:"steps",date:"2026-10-05",steps:12000},{id:"zero",date:"2026-10-05",steps:0}];
records.books.push({id:"book",status:"read",completedDate:"2026-10-05",title:"책 제목"},{id:"conflict",status:"read",completedDate:"2026-10-05",readDate:"2026-10-06"});
records.goalRegistry=[{goal_id:"not-achieved",revision:1,status:"active",value:999999}];
api.setState(records);const facts=plain(h.realEvents(now));
assert.ok(facts.some(e=>e.sourceEventId==="body:weight"&&e.detail==="83.25kg"));assert.ok(facts.some(e=>e.sourceEventId==="exercise:steps"&&e.detail==="12,000보"));
assert.ok(!facts.some(e=>/invalid|zero|conflict/.test(e.sourceEventId)));assert.ok(!JSON.stringify(facts).includes("999999"));
for(let d=0;d<7;d++){h.refreshLiving(now+d*day);h.refreshLiving(now+d*day);}
const tied=api.getState().boardPosts.filter(p=>p.ownerTied);
assert.equal(new Set(tied.map(p=>p.sourceEventId)).size,tied.length);assert.ok(tied.every(p=>!p.body.includes("[기록 기반 초안]")&&!p.body.includes("사실:")));
for(let d=0;d<7;d++)assert.ok(tied.filter(p=>h.dayKey(Date.parse(p.createdAt))===h.dayKey(now+d*day)).length<=1);
assert.deepEqual(rest(api.getState()),rest(records));
console.log("PASS: natural record one-liners, verified numbers only, event/date dedupe, one record post/day, source preservation");

// Review drafts/arrival, archive/restore/discard, manual polls, reactions and backup remain intact.
reset(fixtureLibrary(10),"review");single(()=>h.refreshLiving(now));
assert.equal(h.listPosts().length,0);const draft=h.postDrafts()[0];assert.ok(draft);
single(()=>h.draftAction("post",draft.id,"archive",now));single(()=>h.draftAction("post",draft.id,"restore",now));
single(()=>h.draftAction("post",draft.id,"publish",now));single(()=>h.refreshLiving(now+60*60000));
assert.ok(h.replyDrafts().length);single(()=>h.draftAction("comment",h.replyDrafts()[0].id,"publish",now));
const draft2=h.postDrafts()[0];single(()=>h.draftAction("post",draft2.id,"discard",now));assert.equal(h.draftAction("post",draft2.id,"publish",now),false);
single(()=>h.toggleReaction(draft.id,"🔥"));single(()=>h.toggleReaction(draft.id,"🔥"));assert.equal(api.getState().boardPosts.find(p=>p.id===draft.id).reactions["🔥"].count,0);
api.setState({...api.getState(),boardPosts:api.getState().boardPosts.map(p=>p.id===draft.id?{...p,poll:{options:["A","B"],votes:{}}}:p)});
single(()=>h.votePoll(draft.id,0));assert.equal(h.votePoll(draft.id,0),false);assert.equal(h.votePoll(draft.id,2),false);single(()=>h.votePoll(draft.id,1));
single(()=>h.attendance(now));assert.equal(h.attendance(now),false);
assert.equal(api.exportData({silent:true}),true);const backup=JSON.parse(inspection().files.at(-1).value),restored=api.normalizeState(api.validateBackup(backup).data);
assert.deepEqual(plain(restored.boardPosts),plain(api.getState().boardPosts));assert.deepEqual(plain(restored.boardComments),plain(api.getState().boardComments));
console.log("PASS: review drafts/comments, archive/restore/discard, polls/reactions/attendance, full board backup round-trip");

// Real renderer escapes content and strips labels in every board slot even before cleanup is allowed.
const markup=index.match(/<section id="board"[\s\S]*?<\/section>/)[0];
const slots=new Map(),node=()=>({innerHTML:"",textContent:"",value:"",open:false,listeners:{},addEventListener(t,f){this.listeners[t]=f},querySelector(){return null},focus(){},reset(){},setAttribute(){}});
for(const [,key] of markup.matchAll(/data-board="([^"]+)"/g))slots.set(key,node());
for(const key of ["postForm","commentForm"]){slots.get(key).elements={};for(const f of ["title","body","category","pinned"])slots.get(key).elements[f]={value:"",checked:false,focus(){}}}
const root={...node(),classList:{contains:()=>false},querySelector:s=>slots.get(s.match(/data-board="([^"]+)"/)?.[1]),querySelectorAll:()=>[],contains:()=>true};
context.document.getElementById=id=>id==="board"?root:null;
reset();api.setState({...fresh(),boardPosts:[...fresh().boardPosts,...["seongmin","hani","mir"].map(id=>old(id,"[기록 기반 초안] <script>bad()</script>",{authorId:id,title:"#1 · [사내 세계관 이야기] 제목"}))],
  boardComments:[old("render-comment","에 관한 제 생각: <img src=x onerror=bad()>",{authorId:"yuri",postId:"hani"})]});
api.recovery.active=true;vm.runInContext(board,context);const ui=context.window.HaniBoard;ui.openPost("hani");
for(const slot of slots.values())assert.ok(!/\[사내 세계관 이야기\]|\[기록 기반 초안\]|에 관한 제 생각\s*:|#1\s*·|<script>|<img src=x/.test(slot.innerHTML));
assert.ok(slots.get("article").innerHTML.includes("&lt;script&gt;"));assert.ok(slots.get("comments").innerHTML.includes("&lt;img"));
for(const [id,label] of [["seongmin","성민 · 회장 · HANI GROUP"],["hani","하니 · 전무 · 전략기획실"],["mir","MIR · AI ENTITY · 전략기획실"]]){
  assert.ok(slots.get("list").innerHTML.includes('title="'+label+'"'),id);ui.openPost(id);assert.ok(slots.get("article").innerHTML.includes('aria-label="'+label+' 소개"'),id);
  assert.ok(slots.get("article").innerHTML.includes('href="#organization/people/'+id+'"'),id+' author profile link');
}
ui.openPost("hani");assert.ok(slots.get("comments").innerHTML.includes('aria-label="유리 · QA 책임 · AI플랫폼개발실 소개"'));
api.recovery.active=false;
reset(fixtureLibrary(3));ui.render();assert.equal(api.getState().boardPosts.length,1,"inactive board never writes");
root.classList.contains=()=>true;single(()=>{ui.render();return true});assert.ok(api.getState().boardPosts.some(p=>p.libraryId));
const libraryIndex=index.indexOf('./hani-board-library.js');assert.ok(libraryIndex>0&&libraryIndex<index.indexOf('./hani-board.js'));
console.log("PASS: escaped/label-free rendered HTML, name/rank/team in list/detail/comment, readiness/inactive guard and script order");
