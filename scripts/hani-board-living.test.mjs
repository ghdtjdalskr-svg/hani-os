// Synthetic Phase 3 behavior through real board handlers/save/backup; no network/user data.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {api,handlers,context,roster,plain,rest,inspection,saveFailure} from "./hani-board.test.mjs";

const board=fs.readFileSync(new URL("../hani-board.js",import.meta.url),"utf8");
const archive=fs.readFileSync(new URL("../hani-character-archive-data.js",import.meta.url),"utf8");
const editorial=fs.readFileSync(new URL("../hani-ui-v02992.js",import.meta.url),"utf8");
const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
vm.runInContext(archive,context);
vm.runInContext(editorial.slice(editorial.indexOf("// BEGIN CANONICAL TAB VOICE BUNDLE"),editorial.indexOf("const SPORTS_LINES")),context);
const h=handlers;
const now=Date.parse("2026-10-05T01:00:00Z"),day=86400000;
const fresh=(mode="review")=>({...plain(api.freshState()),books:[{id:"sandbox-baseline",title:"Existing local record"}],
  boardPosts:[{id:"sandbox-settings",boardMeta:true,draft:true,replyMode:mode,authorId:roster.chairman.id,
    category:"WORK",title:"게시판 설정",body:"게시판 내부 설정",createdAt:"2026-10-01T00:00:00Z"}],futureState:{kept:true}});
const reset=(mode="review")=>api.setState(fresh(mode));
const single=action=>{const before=inspection().queues;assert.equal(action(),true);assert.equal(inspection().queues,before+1,"exactly one real save");};
reset();
assert.equal(roster.people.length,17);
assert.equal(Object.keys(h.personaMap()).length,17);
for(const p of roster.people){
  const persona=h.personaMap()[p.id];assert.ok(persona.voice.length&&persona.topics.length>=8);
  assert.equal(persona.source.member.id,p.id);assert.ok(persona.quirks.length);
  if(p.group==="M9")assert.ok(persona.source.archive,"archive referenced for M9");
}
assert.ok(h.personaMap().hani.close&&h.personaMap().naeun.close&&h.personaMap().hina.close&&h.personaMap().seoyun.close);
assert.equal(h.personaMap().yuna.close,false);
const base=rest(api.getState());
for(let d=0;d<7;d++){
  single(()=>h.refreshLiving(now+d*day));
  const snapshot=plain(api.getState());assert.equal(h.refreshLiving(now+d*day),false);assert.deepEqual(plain(api.getState()),snapshot);
}
const world=api.getState().boardPosts.filter(p=>p.generated&&!p.ownerTied&&!p.boardMeta);
assert.equal(world.length,21);
for(const p of roster.people)assert.ok(world.some(r=>r.authorId===p.id),"7 day rotation includes "+p.id);
assert.equal(h.listPosts().length,0,"drafts are private to tray");
assert.equal(new Set(world.map(p=>p.templateId)).size,world.length);
assert.equal(new Set(world.map(p=>p.body)).size,world.length);
for(const p of world){
  assert.ok(p.body.includes("[사내 세계관 이야기]"));
  assert.ok(h.personaMap()[p.authorId].voice.some(v=>p.body.includes(v.replace(/[.!?]$/,""))),"persona voice used");
}
assert.deepEqual(rest(api.getState()),base);
console.log("PASS: all 17 personas, 7-day fair rotation, date/season topics, private drafts, no repeated templates");

// Real events read canonical fields, reject conflicting completion dates, never invent numeric facts.
reset();const events=fresh();
events.body=[{id:"weight-new",date:"2026-10-05",weight:83.25,bodyFat:19.1}];
events.books=[{id:"book-new",status:"read",completedDate:"2026-10-05",title:'책 <script>bad()</script>'},
  {id:"book-conflict",status:"read",completedDate:"2026-10-05",readDate:"2026-10-06",title:"conflict"},
  {id:"unread",status:"reading",completedDate:"2026-10-05",title:"unfinished"}];
events.movies=[{id:"movie-new",status:"watched",watchedDate:"2026-10-05",title:"시청 작품"}];
events.tasks=[{id:"goal-new",status:"done",completedAt:"2026-10-05T00:00:00Z",title:"완료 할 일"}];
events.goalRegistry=[{goal_id:"goal",revision:1,status:"active",value:999999,effective_from:"2026-10-01"}];
events.ledgerMonths=[{month:"2026-10",updatedAt:"2026-10-05T00:00:00Z",amount:777777}];
api.setState(events);
const facts=plain(h.realEvents(now));
for(const id of ["body:weight-new","book:book-new","movie:movie-new","goal:goal-new","ledger:2026-10","quarter:2026-Q4"])assert.ok(facts.some(e=>e.sourceEventId===id),id);
assert.ok(!facts.some(e=>/book-conflict|unread/.test(e.sourceEventId)));
assert.ok(!JSON.stringify(facts).includes("83.25")&&!JSON.stringify(facts).includes("777777"));
context.HANI_DISPLAY_VERSION="2.9.test";
context.window.HANI_DEVELOPMENT_HISTORY_V1={entries:[{id:"dev-report",date:"2026-10-05",title:"개발 보고 제목",status:"preview"}]};
context.window.HANI_GOAL_PROGRESS={read:()=>[
  {definition:{metric_id:"books_completed_count"},actual:{status:"PARTIAL"},progress:{goal_id:"goal-book",goal_revision:2,goal_status:"RESOLVED",actual:3,target:3,interpretation:"on_target",semantics:"cumulative_total"}},
  {definition:{metric_id:"body_weight_kg"},actual:{status:"NO_DATA"},progress:{goal_id:"missing",goal_status:"RESOLVED",actual:null,target:1,interpretation:"favorable"}},
  {definition:{metric_id:"spending_jispi_krw"},actual:{status:"PARTIAL",period_end:"2026-12-31"},progress:{goal_id:"budget",goal_status:"RESOLVED",actual:3,target:3,interpretation:"favorable",semantics:"monthly_budget"}}
]};
const enriched=plain(h.realEvents(now));
assert.ok(enriched.some(e=>e.sourceEventId==="release:2.9.test"));assert.ok(enriched.some(e=>e.sourceEventId==="dev:dev-report"));
assert.ok(enriched.some(e=>e.sourceEventId==="progress:goal-book:2:2026-Q4"&&e.page==="reading"));
assert.ok(!enriched.some(e=>e.sourceEventId.startsWith("progress:missing")||e.sourceEventId.startsWith("progress:budget")));
delete context.window.HANI_GOAL_PROGRESS;delete context.window.HANI_DEVELOPMENT_HISTORY_V1;delete context.HANI_DISPLAY_VERSION;
const records=rest(events);
for(let d=0;d<7;d++)h.refreshLiving(now+d*day);
const tied=api.getState().boardPosts.filter(p=>p.ownerTied);
assert.equal(new Set(tied.map(p=>p.sourceEventId)).size,tied.length);
assert.ok(tied.every(p=>p.draft));
for(const p of tied)assert.equal(p.authorId,context.window.HaniEditorialSources.lines[p.sourcePage].speakerId);
assert.ok(tied.length<=9,"weekly 30/70 record budget, at most two per day");
assert.deepEqual(rest(api.getState()),records,"source records untouched");
const draft=h.postDrafts()[0];single(()=>h.draftAction("post",draft.id,"publish",now+7*day));
assert.ok(h.listPosts().some(p=>p.id===draft.id));assert.equal(h.draftAction("post",draft.id,"publish"),false);
const draft2=h.postDrafts()[0];single(()=>h.draftAction("post",draft2.id,"archive"));
assert.ok(!h.postDrafts().some(p=>p.id===draft2.id));single(()=>h.draftAction("post",draft2.id,"restore"));
single(()=>h.draftAction("post",draft2.id,"discard"));
assert.ok(api.getState().boardPosts.some(p=>p.id===draft2.id&&p.disposition==="discarded"),"tombstone keeps dedupe/rotation");
const trial=h.postDrafts()[0],beforeFail=plain(api.getState());saveFailure(true);
assert.equal(h.draftAction("post",trial.id,"publish"),false);assert.deepEqual(plain(api.getState()),beforeFail);
saveFailure(false);single(()=>h.draftAction("post",trial.id,"publish"));
console.log("PASS: canonical record events, dedupe, page owners, facts safety, tray single save, archive/restore/discard, rollback");

reset();const mixed=fresh();
for(let d=0;d<7;d++){
  const date=h.dayKey(now+d*day);
  mixed.body.push({id:"body-"+d,date,weight:80});mixed.books.push({id:"book-"+d,status:"read",completedDate:date,title:"테스트 책"});
  mixed.movies.push({id:"movie-"+d,status:"watched",watchedDate:date,title:"테스트 작품"});
}
api.setState(mixed);for(let d=0;d<7;d++)h.refreshLiving(now+d*day);
const mixPosts=api.getState().boardPosts.filter(p=>p.generated);
assert.equal(mixPosts.filter(p=>p.ownerTied).length,9);assert.equal(mixPosts.filter(p=>!p.ownerTied).length,21);
for(let d=0;d<7;d++){
  const rows=mixPosts.filter(p=>p.ownerTied&&h.dayKey(Date.parse(p.createdAt))===h.dayKey(now+d*day));
  assert.ok(rows.length<=2);assert.equal(new Set(rows.map(p=>p.sourceEventId.split(":")[0])).size,rows.length,"once per day per trigger kind");
}
console.log("PASS: week content mix 30% real-record drafts / 70% staff-world drafts, no facts fabricated when absent");

// Queue replies atomically with chairman's write; delayed materialization and force arrival.
reset();single(()=>h.savePost({title:"러닝 크루 질문",body:"@나은 @서윤 함께 산책하고 싶어요",category:"LIFE"}));
const ownPost=api.getState().boardPosts.find(p=>!p.boardMeta&&p.authorId===roster.chairman.id),queued=api.getState().boardComments.filter(c=>c.pending);
assert.ok(queued.length>=2&&queued.length<=h.replySafetyBound);
assert.ok(queued.some(c=>c.authorId==="naeun")&&queued.some(c=>c.authorId==="seoyun"));
assert.ok(queued.every(c=>c.createdAt<c.scheduledAt));
assert.ok(new Set(queued.map(c=>c.scheduledAt)).size===queued.length);
assert.ok(queued.every(c=>!c.parentId||queued.some(p=>p.id===c.parentId)));
const queueTime=Date.parse(queued[0].createdAt);
single(()=>h.refreshLiving(queueTime)); // only daily drafts arrive, queued comments still hidden
assert.ok(api.getState().boardComments.filter(c=>c.pending).length===queued.length);
single(()=>h.setReplyMode("auto")); // Review posts remain drafts; arrivals now exercise automatic replies.
single(()=>h.refreshLiving(queueTime+4*60000));
assert.equal(api.getState().boardComments.filter(c=>c.generated&&!c.pending&&!c.draft).length,1);
assert.equal(h.unreadCount(ownPost),1);
single(()=>h.refreshLiving(queueTime+4*60000,true));
assert.equal(api.getState().boardComments.filter(c=>c.pending).length,0);
assert.ok(api.getState().boardPosts.filter(p=>p.generated).every(p=>p.draft),"force never publishes staff posts");
single(()=>h.openPost(ownPost.id));assert.equal(h.unreadCount(api.getState().boardPosts.find(p=>p.id===ownPost.id)),0);
single(()=>h.saveComment(ownPost.id,"@MIR 次の音楽も知りたいです"));
const ownComment=api.getState().boardComments.findLast(c=>c.authorId===roster.chairman.id);
const nested=api.getState().boardComments.filter(c=>c.pending);
assert.ok(nested.some(c=>c.authorId==="mir"&&c.parentId===ownComment.id));
assert.ok(nested.filter(c=>c.toOwner).every(c=>c.parentId===ownComment.id));
single(()=>h.setReplyMode("review"));single(()=>h.refreshLiving(Date.now(),true));
assert.ok(h.replyDrafts().some(c=>c.parentId===ownComment.id));
const previewReply=h.replyDrafts()[0];single(()=>h.draftAction("comment",previewReply.id,"publish"));
assert.ok(!h.replyDrafts().some(c=>c.id===previewReply.id));
const protectedSnapshot=plain(api.getState());api.recovery.active=true;
assert.equal(h.refreshLiving(Date.now()+day,true),false);assert.equal(h.setReplyMode("auto"),false);
assert.equal(h.attendance(),false);assert.deepEqual(plain(api.getState()),protectedSnapshot);api.recovery.active=false;
console.log("PASS: atomic variable replies, mentions including MIR, staggered arrival, nested chairman replies, unread, review mode, protection guard");

// Failed materialization is retryable; editing/deleting a source retires outdated replies.
reset();h.savePost({title:"확인 요청",body:"@유리 확인해 주세요",category:"WORK"});
let sourcePost=api.getState().boardPosts.find(p=>!p.boardMeta);
const queuedBefore=plain(api.getState());saveFailure(true);
assert.equal(h.refreshLiving(Date.now(),true),false);assert.deepEqual(plain(api.getState()),queuedBefore);
saveFailure(false);single(()=>h.refreshLiving(Date.now(),true));
single(()=>h.saveComment(sourcePost.id,"처음 질문"));
let sourceComment=api.getState().boardComments.findLast(c=>c.authorId===roster.chairman.id);
single(()=>h.saveComment(sourcePost.id,"변경한 질문",sourceComment.id));
single(()=>h.refreshLiving(Date.now(),true));
assert.ok(api.getState().boardComments.filter(c=>c.replySourceId===sourceComment.id).every(c=>c.disposition==="stale"));
single(()=>h.saveComment(sourcePost.id,"삭제할 질문"));
sourceComment=api.getState().boardComments.findLast(c=>c.authorId===roster.chairman.id);
single(()=>h.deleteOwn("comment",sourceComment.id));single(()=>h.refreshLiving(Date.now(),true));
assert.ok(api.getState().boardComments.filter(c=>c.replySourceId===sourceComment.id).every(c=>c.disposition==="stale"));
console.log("PASS: materialization rollback/retry, edited/deleted source retires stale replies without deleting history");

reset();
for(let d=0;d<14;d++){
  h.refreshLiving(now+d*day);
  for(let i=0;i<6;i++)h.savePost({title:"음악 이야기",body:"같이 음악을 추천해 주세요",category:"LOUNGE"});
}
const recent=api.getState().boardPosts.filter(p=>p.generated);
assert.equal(new Set(recent.map(p=>p.templateId)).size,recent.length);
const replyTemplates=api.getState().boardComments.filter(c=>c.generated);
assert.equal(new Set(replyTemplates.map(c=>c.templateId)).size,replyTemplates.length);
assert.equal(new Set(replyTemplates.map(c=>c.body)).size,replyTemplates.length);
console.log("PASS: 14-day post/reply template and complete-body non-repetition under repeated user topics");

// A simulated month uses actual daily drafts, publication, arrivals and existing save.
reset("auto");
const monthStart=Date.parse("2026-09-01T01:00:00Z");
for(let d=0;d<30;d++){
  const at=monthStart+d*day;h.refreshLiving(at);
  for(const p of h.postDrafts())single(()=>h.draftAction("post",p.id,"publish",at));
  h.refreshLiving(at+12*3600000);
}
// Drain the tail at realistic later times, preserving each scheduled arrival date.
for(let d=30;d<45;d++)h.refreshLiving(monthStart+d*day);
const monthPosts=api.getState().boardPosts.filter(p=>p.generated&&h.dayKey(Date.parse(p.publishedAt||p.createdAt))<"2026-10-01");
const counts=monthPosts.map(p=>api.getState().boardComments.filter(c=>c.postId===p.id&&c.generated&&!c.pending&&!c.draft&&!c.disposition).length);
assert.ok(counts.some(n=>n===0),"quiet zero-reply threads in a month");
assert.ok(counts.filter(n=>n>=1&&n<=3).length>=counts.length*.3,"many short threads");
assert.ok(counts.some(n=>n>10),"lively threads exceed ten replies");
assert.ok(api.getState().boardComments.some(c=>c.generated&&!c.pending&&h.dayKey(Date.parse(c.createdAt))>h.dayKey(Date.parse(api.getState().boardPosts.find(p=>p.id===c.postId)?.publishedAt||c.createdAt))),"replies arrive on later days");
assert.ok(api.getState().boardComments.some(c=>c.generated&&c.parentId&&api.getState().boardComments.some(p=>p.id===c.parentId&&p.authorId!==roster.chairman.id)),"staff back-and-forth continues");
const quietPost=monthPosts[counts.indexOf(0)],beforeEnergy=h.threadEnergy(quietPost);
const energyComment={id:"energy-probe",postId:quietPost.id,authorId:roster.chairman.id,body:"함께 이야기해요"};
assert.ok(h.threadEnergy(quietPost,[{...energyComment,body:"@나은 함께 이야기해요"}])>h.threadEnergy(quietPost,[energyComment]),"mentions add energy");
assert.ok(h.threadEnergy(quietPost,[{...energyComment,body:"찬반 토론을 이어가요"}])>h.threadEnergy(quietPost,[energyComment]),"controversy adds energy");
single(()=>h.saveComment(quietPost.id,"@나은 회장도 같이 이야기하고 싶어요"));
assert.ok(h.threadEnergy(quietPost)>beforeEnergy,"chairman participation raises thread energy even while replies are pending");
const energySnapshot=plain(api.getState()),energized=h.threadEnergy(quietPost);
single(()=>h.refreshLiving(Date.now(),true));assert.ok(h.threadEnergy(quietPost)<energized,"arrived replies consume energy");
api.setState(energySnapshot);
const beforeRollback=plain(api.getState());saveFailure(true);
assert.equal(h.saveComment(quietPost.id,"@유리 다시 참여합니다"),false);
assert.deepEqual(plain(api.getState()),beforeRollback,"failed owner comment restores energy and reply reservations");saveFailure(false);
console.log("PASS: simulated month zero/short/>10 threads, staff banter, multi-day arrivals, chairman energy rise/decay and rollback",JSON.stringify({threads:counts.length,zero:counts.filter(n=>n===0).length,short:counts.filter(n=>n>=1&&n<=3).length,long:counts.filter(n=>n>10).length,max:Math.max(...counts)}));

// Huge participation exercises the technical work limit, then resumes above 60 total.
reset();const hot={id:"hot-energy",authorId:"hani",category:"LOUNGE",title:"토론",body:"논쟁과 찬반",generated:true,createdAt:new Date(now).toISOString()};
const joined=Array.from({length:30},(_,i)=>({id:"chair-energy-"+i,postId:hot.id,authorId:roster.chairman.id,body:"@나은 함께 논의해요",createdAt:new Date(now).toISOString()}));
api.setState({...fresh(),boardPosts:[...fresh().boardPosts,hot],boardComments:joined});
// Keep this work-bound fixture isolated from new automatically published daily threads.
for(const at of [now,now+90*day,now+120*day])
  api.setState({...api.getState(),boardPosts:h.generateDaily(at)});
single(()=>h.setReplyMode("auto"));
const hotQueue=h.queueReplies(hot,hot,joined,now);assert.equal(hotQueue.length,60);
api.setState({...api.getState(),boardComments:[...joined,...hotQueue]});
const earlySaves=inspection().queues;
assert.equal(h.refreshLiving(now),false);assert.equal(inspection().queues,earlySaves,"primed fixture never saves before replies are due");
assert.equal(api.getState().boardComments.filter(c=>c.generated&&!c.pending).length,0,"queues never arrive early");
const horizon=now+90*day;
single(()=>h.refreshLiving(horizon));
assert.equal(api.getState().boardComments.filter(c=>c.generated&&!c.pending).length,60,"one materialization handles at most 60");
single(()=>h.refreshLiving(horizon));
assert.equal(api.getState().boardComments.filter(c=>c.pending).length,60,"technical stop schedules another batch on next refresh");
const reserved=plain(api.getState());assert.equal(h.refreshLiving(horizon),false);assert.deepEqual(plain(api.getState()),reserved,"repeated refresh cannot duplicate reservations");
single(()=>h.refreshLiving(horizon+30*day));
assert.ok(api.getState().boardComments.filter(c=>c.generated&&!c.pending).length>60,"60 is not a lifetime thread cap");
console.log("PASS: 60-operation work bound, resumable energy above 60 total, no early/duplicate arrivals");

// Honorifics: only founding M9 + Seoyun, casual context, hard cumulative <=15% cap.
for(const p of roster.people){
  let previous=[];
  for(let i=0;i<250;i++){
    const casual={category:"LOUNGE",title:"주말 음악",body:"취향 질문"};
    const address=h.staffAddress(p.id,roster.chairman.id,casual,i,previous);
    if(address==="오빠")assert.equal(h.personaMap()[p.id].close,true,p.id);
    previous.push({authorId:p.id,toOwner:true,address});
    assert.ok(previous.filter(r=>r.address==="오빠").length<=Math.floor(previous.length*.15));
    for(const post of [{...casual,category:"WORK"},{...casual,pinned:true},{...casual,title:"투자 스터디"}]){
      assert.equal(h.staffAddress(p.id,roster.chairman.id,post,i,previous),"회장님");
      const replies=h.queueReplies({...post,id:"work",authorId:roster.chairman.id},
        {id:"source"+i,body:"@"+p.name+" 확인해 주세요",authorId:roster.chairman.id},previous,now);
      assert.ok(replies.filter(c=>c.toOwner).every(c=>c.body.includes("회장님")&&!c.body.includes("오빠")&&!/(?:하자|해라|해봐|보자|할게|한다)[.!?]?(?:\s|$)/.test(c.body)));
    }
  }
  if(h.personaMap()[p.id].close)assert.ok(previous.some(r=>r.address==="오빠"),"occasional allowed casual address");
}
assert.equal(h.staffAddress("yuna","hani",{category:"WORK"}),"하니 전무님");
assert.equal(h.staffAddress("seoyun","yuri",{category:"WORK"}),"유리 QA 책임님");
assert.equal(h.staffAddress("sooyeon","minji",{category:"WORK"}),"민지 대리님");
console.log("PASS: centralized honorifics, WORK/notice/investment chair address, allowed casual set and <=15%, polite generated replies");

reset();h.refreshLiving(now);
let poll=h.postDrafts().find(p=>p.poll);
for(let d=1;!poll&&d<7;d++){h.refreshLiving(now+d*day);poll=h.postDrafts().find(p=>p.poll)}
assert.ok(poll);single(()=>h.setReplyMode("auto"));single(()=>h.draftAction("post",poll.id,"publish",now));
single(()=>h.votePoll(poll.id,0));assert.equal(h.votePoll(poll.id,0),false);single(()=>h.votePoll(poll.id,1));
assert.equal(api.getState().boardPosts.find(p=>p.id===poll.id).poll.votes[roster.chairman.id],1);
assert.equal(h.votePoll(poll.id,-1),false);assert.equal(h.votePoll(poll.id,100),false);
single(()=>h.refreshLiving(now+3*3600000));
const voted=api.getState().boardPosts.find(p=>p.id===poll.id);
assert.ok(Object.keys(voted.poll.votes).length>=2,"staff votes counted after arrival");
assert.ok(api.getState().boardComments.some(c=>c.postId===poll.id&&c.voteChoice!==undefined&&!c.pending));
single(()=>h.toggleReaction(poll.id,"🔥"));single(()=>h.toggleReaction(poll.id,"🔥"));
assert.equal(api.getState().boardPosts.find(p=>p.id===poll.id).reactions["🔥"].count,0);
single(()=>h.toggleReaction(poll.id,"❤️"));assert.equal(h.toggleReaction(poll.id,"<img>"),false);
const alt=h.postDrafts().find(p=>!p.poll);single(()=>h.draftAction("post",alt.id,"publish",now));
single(()=>h.toggleLike(alt.id));single(()=>h.toggleReaction(alt.id,"😂"));
assert.equal(h.weeklyBest(now+3*3600000)[0].id,alt.id);
assert.ok(h.weeklyActivity(now+3*3600000).some(p=>p.posts+p.comments>0));
single(()=>h.attendance(now));assert.equal(h.attendance(now),false);single(()=>h.attendance(now+day));
assert.equal(api.exportData({silent:true}),true);
const backup=JSON.parse(inspection().files.at(-1).value),restored=api.normalizeState(api.validateBackup(backup).data);
assert.deepEqual(plain(restored.boardPosts),plain(api.getState().boardPosts));assert.deepEqual(plain(restored.boardComments),plain(api.getState().boardComments));
assert.deepEqual(rest(api.getState()),base);
console.log("PASS: poll owner/staff ballots, reaction toggle, weekly BEST/activity, daily attendance, complete backup round-trip");

// Default staff posts publish atomically, including poll ballots and reply reservations.
api.setState({...plain(api.freshState()),books:[{id:"sandbox-baseline",title:"Existing local record"}]});
assert.equal(h.replyMode(),"auto");
single(()=>h.refreshLiving(now));
assert.equal(h.listPosts().length,3);assert.equal(h.postDrafts().length,0);
assert.ok(h.listPosts().every(p=>p.generated&&!p.draft&&p.publishedAt===p.createdAt));
const autoSnapshot=plain(api.getState()),autoSaves=inspection().queues;
assert.equal(h.refreshLiving(now),false);assert.equal(inspection().queues,autoSaves);
assert.deepEqual(plain(api.getState()),autoSnapshot,"automatic publication is idempotent");
for(let d=1;!h.listPosts().some(p=>p.poll)&&d<7;d++)single(()=>h.refreshLiving(now+d*day));
const autoPoll=h.listPosts().find(p=>p.poll);assert.ok(autoPoll);
assert.ok(api.getState().boardComments.some(c=>c.postId===autoPoll.id&&c.pending&&c.voteChoice!==undefined),"automatic polls reserve staff ballots");
const autoBeforeFail=plain(api.getState());saveFailure(true);
assert.equal(h.refreshLiving(now+8*day),false);assert.deepEqual(plain(api.getState()),autoBeforeFail);
saveFailure(false);single(()=>h.refreshLiving(now+8*day));
assert.ok(h.listPosts().length>3);assert.deepEqual(rest(api.getState()),rest(autoBeforeFail),"automatic publication preserves unrelated records");
reset();h.refreshLiving(now);
console.log("PASS: staff auto-publication default, single save, poll reservations, idempotence, rollback and retry");

// Real delegated UI slots, escaping, hidden queues/drafts and event ownership.
const markup=index.slice(index.indexOf('<section id="board"'),index.indexOf('<section id="characterArchive"'));
const slots=new Map();
const node=()=>({innerHTML:"",textContent:"",value:"",open:false,listeners:{},addEventListener(t,f){this.listeners[t]=f},
  querySelector(){return null},setAttribute(){},focus(){},showModal(){this.open=true},close(){this.open=false},reset(){}});
for(const [,key] of markup.matchAll(/data-board="([^"]+)"/g)){assert.ok(!slots.has(key),key);slots.set(key,node())}
for(const key of ["postForm","commentForm"]){slots.get(key).elements={};for(const f of ["title","body","category","pinned"])slots.get(key).elements[f]={value:"",checked:false,focus(){}}}
const root={...node(),classList:{contains:()=>false},querySelector:s=>slots.get(s.match(/data-board="([^"]+)"/)?.[1]),querySelectorAll:()=>[],contains:()=>true};
context.document.getElementById=id=>id==="board"?root:null;vm.runInContext(board,context);
const ui=context.window.HaniBoard;
const click=dataset=>root.listeners.click({target:{closest:()=>({dataset,hasAttribute:()=>false})}});
const xss=api.getState().boardPosts.find(p=>p.draft&&!p.boardMeta&&!p.disposition);
api.setState({...api.getState(),boardPosts:api.getState().boardPosts.map(p=>p.id===xss.id?{...p,title:'<img src=x onerror="bad()">',body:'<script>bad()</script>',poll:{options:['<svg onload="bad()">',"safe"],votes:{}}}:p)});
ui.render();assert.ok(!/<script>|<img src=x|<svg onload/.test(slots.get("tray").innerHTML));
assert.equal(slots.get("trayPanel").hidden,false,"review mode shows tray");
for(const label of ["올리기","나중에","삭제"])assert.ok(slots.get("tray").innerHTML.includes(">"+label+"</button>"),label);
assert.ok(slots.get("tray").innerHTML.includes("&lt;script&gt;"));assert.ok(!slots.get("list").innerHTML.includes("onerror"));
single(()=>{click({boardDraft:"publish",kind:"post",key:xss.id});return true});click({boardOpen:xss.id});
assert.ok(!/<script>|<img src=x|<svg onload/.test(slots.get("article").innerHTML));
single(()=>{click({boardVote:"0",key:xss.id});return true});single(()=>{click({boardReaction:"🔥",key:xss.id});return true});
slots.get("replyMode").listeners.change({target:{value:"auto"}});assert.equal(ui.replyMode(),"auto");
assert.equal(slots.get("trayPanel").hidden,true);assert.equal(slots.get("tray").innerHTML,"","auto mode hides the tray");
single(()=>ui.saveComment(xss.id,'<img src=x onerror="bad()"> @나은'));
assert.ok(!slots.get("comments").innerHTML.includes("직원 반응"),"pending replies stay invisible");
single(()=>{click({board:"arriveNow"});return true});assert.ok(slots.get("trayCount").textContent.includes("새 댓글"));
assert.ok(!/<img src=x|<script>|<svg onload/.test(slots.get("comments").innerHTML));
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
assert.ok(!/\.(?:clear|insert|update|delete|upsert)\s*\(/.test(board));
console.log("PASS: real delegated tray/poll/reaction/settings/arrival actions, pending visibility, escaped XSS, unique slots/IDs");

// Existing navigation/render owner invokes living refresh only on an active board.
reset();ui.render();assert.equal(api.getState().boardPosts.length,1,"off-board render preserves only the fixture settings row");
root.classList.contains=()=>true;single(()=>{ui.render();return true});
assert.equal(ui.postDrafts().length,3);
let renders=inspection().queues;ui.render();assert.equal(inspection().queues,renders,"opening twice dedupes daily drafts");
single(()=>ui.savePost({title:"自分の記録",body:"@나은 운동 의견",category:"LIFE"}));
renders=inspection().queues;ui.render();assert.equal(inspection().queues,renders,"new scheduled replies do not arrive before time");
console.log("PASS: active-board open refresh, off-board no write, daily dedupe, render never stacks saves onto user action");

// An initial post hash and daily auto-publication share one existing save.
const linked={id:"direct-link",authorId:"hani",category:"LOUNGE",title:"직접 링크",body:"본문",createdAt:new Date().toISOString()};
api.setState({...fresh("auto"),boardPosts:[linked]});
context.location??={hash:"#board",href:"https://example.test/#board"};
context.history??={pushState(_state,_title,url){context.location.hash=url},replaceState(_state,_title,url){context.location.hash=url}};
context.location.hash="#board/direct-link";
single(()=>{ui.render();return true});
assert.equal(api.getState().boardPosts.find(p=>p.id===linked.id).views,1);
assert.equal(ui.listPosts().length,4);assert.equal(ui.postDrafts().length,0);
assert.equal(slots.get("detail").hidden,false);
const hashSaves=inspection().queues;ui.render();assert.equal(inspection().queues,hashSaves,"hash reload does not stack saves");
const retryLink={...linked,id:"retry-link"};api.setState({...api.getState(),boardPosts:[...api.getState().boardPosts,retryLink]});
context.location.hash="#board/retry-link";const retrySnapshot=plain(api.getState());saveFailure(true);ui.render();
assert.deepEqual(plain(api.getState()),retrySnapshot,"failed hash view retains state");
saveFailure(false);single(()=>{ui.render();return true});
assert.equal(api.getState().boardPosts.find(p=>p.id==="retry-link").views,1,"next existing render retries the pending hash view");
context.location.hash="#board/missing-post";const missingSaves=inspection().queues;ui.render();
assert.equal(slots.get("detail").hidden,true,"a missing hash never displays the previous post");
assert.equal(inspection().queues,missingSaves,"missing hash has no view write");
console.log("PASS: canonical hash render, atomic daily generation/view, no stacked saves, failed view retry");

// The community command also runs these Phase 3 regressions.
export const livingTestsPassed=true;
