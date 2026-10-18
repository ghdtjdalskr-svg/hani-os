// Synthetic-only VM execution of the existing daily scheduling, publication and save paths.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {api,context,roster,plain,inspection,rest,saveFailure} from './hani-board.test.mjs';
import {fixtureLibrary} from './hani-board-library-fixture.mjs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const board=read('hani-board.js');
vm.runInContext(read('hani-character-archive-data.js'),context);
vm.runInContext(read('hani-relationship-seed.js'),context);
const editorial=read('hani-ui-v02992.js');
vm.runInContext(editorial.slice(editorial.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),editorial.indexOf('const SPORTS_LINES')),context);
// Test-only visibility; no runtime API or stored fields are added.
vm.runInContext(board.replace('generateDaily,realEvents,refreshLiving','generateDaily,realEvents,LOUNGE_FUN_POOL,dailyThread,publicationThread,loungeReactions,refreshLiving'),context);
const h=context.window.HaniBoard,day=86400000,now=Date.parse('2026-10-14T14:59:00Z');
const banned=/정치|선거|술\s*마시|음주|과음|몸매|연애\s*스캔들|동료.*(?:사귄|열애)/;
const jokes=/ㅋㅋ|ㅎㅎ|드립|농담|\p{Extended_Pictographic}/u;
const sentenceCount=body=>body.split(/(?<=[.!?])\s+/).filter(Boolean).length;
const fresh=()=>({...plain(api.freshState()),books:[{id:'retained-book',title:'Synthetic retained record'}],futureState:{kept:true},
  boardPosts:[{id:'fun-settings',boardMeta:true,draft:true,templateCleanupV4:true,replyMode:'auto',authorId:roster.chairman.id,title:'설정',body:'설정',category:'WORK'}]});
const content=rows=>plain(rows).map(({id,...row})=>row);
const casual=row=>row.topics?.includes('잡담');
const sourceFor=(month,index=0)=>{
  for(let d=1;d<=28;d++)for(let slot=0;slot<4;slot++){
    const source='daily:2026-'+String(month).padStart(2,'0')+'-'+String(d).padStart(2,'0')+':'+slot;
    const at=Date.parse(source.slice(6,16)+'T12:00:00Z'),p=h.dailyThread(fixtureLibrary(1)[0],source,at);
    if(casual(p)&&(!index||p.title===h.LOUNGE_FUN_POOL[index].title))return {source,at,p};
  }
  assert.fail('no selected source for month '+month);
};

test('casual pool has 40+ unique short seeds, 12+ topics and approved staff voices without factual prices/scores or banned content',()=>{
  assert.ok(h.LOUNGE_FUN_POOL.length>=40);assert.ok(new Set(h.LOUNGE_FUN_POOL.map(t=>t.topic)).size>=12);
  assert.equal(new Set(h.LOUNGE_FUN_POOL.map(t=>t.title)).size,h.LOUNGE_FUN_POOL.length);
  const authors=new Set(h.LOUNGE_FUN_POOL.map(t=>t.authorId));
  for(const id of ['hina','haru','jieun','yuna','minji','arin','sua','naeun'])assert.ok(authors.has(id)&&h.personaMap()[id]);
  for(const t of h.LOUNGE_FUN_POOL){
    assert.ok(roster.people.some(p=>p.id===t.authorId));assert.doesNotMatch(t.title+t.body,banned);
    assert.doesNotMatch(t.title+t.body,/\d|스포일러.*(?:공개|결말)|(?:승리|패배|급등|급락|최저가|최고가|확정|발표됐다)/);
    assert.ok(t.title.length<=60&&t.body.length<=170);assert.ok(sentenceCount(t.body)>=1&&sentenceCount(t.body)<=3);
  }
});

test('200 seeded days keep casual share near one third, deterministic content, ids/dedupe/schedules and unchanged inputs',()=>{
  api.setState(fresh());context.HaniBoardLibrary={threads:fixtureLibrary(900)};
  let rows=plain(api.getState().boardPosts),total=0,fun=0,one=0,long=0;
  const before=plain(api.getState()),saves=inspection().queues;
  for(let d=0;d<200;d++){
    const at=now+d*day,input=plain(rows),a=h.generateDaily(at,rows),b=h.generateDaily(at,rows);
    assert.deepEqual(content(a),content(b));assert.deepEqual(plain(rows),input);
    const next=a.slice(rows.length).filter(p=>p.libraryId);assert.ok(next.length>=2&&next.length<=4);
    assert.equal(new Set(next.map(p=>p.scheduledAt)).size,next.length);
    assert.deepEqual(plain(h.generateDaily(at,a)),plain(a),'existing same-day idempotence');
    for(const p of next){
      total++;
      if(!casual(p))continue;
      fun++;assert.equal(p.category,'LOUNGE');assert.equal(p.ownerTied,false);
      const t=h.publicationThread(p);assert.equal(t.title,p.title);
      assert.deepEqual(plain(h.publicationThread(p)),plain(t));
      for(const c of t.comments){assert.doesNotMatch(c.body,banned);if(sentenceCount(c.body)===1){one++;assert.ok(c.body.trim());}else {long++;assert.equal(sentenceCount(c.body),2);}}
    }
    rows=a;
  }
  assert.ok(fun/total>=.25&&fun/total<=.40,'casual share '+fun+'/'+total);
  assert.ok(one/(one+long)>=.35&&one/(one+long)<=.65,'one-liner share '+one+'/'+(one+long));
  assert.equal(new Set(rows.filter(p=>p.libraryId).map(p=>p.libraryId)).size,total,'original Library reuse rules retained');
  assert.deepEqual(plain(api.getState()),before);assert.equal(inspection().queues,saves);
  console.log('200-day sample:',JSON.stringify({total,casual:fun,casualShare:fun/total,oneLiners:one,comments:one+long,oneLinerShare:one/(one+long)}));
  // Check the shipped Library as well, using fresh synthetic days to avoid exhaustion bias.
  vm.runInContext(read('hani-board-library.js'),context);let runtimeTotal=0,runtimeFun=0;
  for(let d=0;d<200;d++)for(const p of h.generateDaily(now+d*day,plain(before.boardPosts)).filter(p=>p.libraryId)){
    runtimeTotal++;if(casual(p))runtimeFun++;
  }
  assert.ok(runtimeFun/runtimeTotal>=.25&&runtimeFun/runtimeTotal<=.40);
  console.log('shipped Library sample:',JSON.stringify({total:runtimeTotal,casual:runtimeFun,casualShare:runtimeFun/runtimeTotal}));
});

test('all months select only matching seasonal seeds, including the KST October boundary',()=>{
  const original=fixtureLibrary(1)[0];let seasonal=0;
  for(let month=1;month<=12;month++)for(let d=1;d<=28;d++)for(let slot=0;slot<4;slot++){
    const source='daily:2026-'+String(month).padStart(2,'0')+'-'+String(d).padStart(2,'0')+':'+slot;
    const at=Date.parse(source.slice(6,16)+'T12:00:00Z'),t=h.dailyThread(original,source,at),entry=h.LOUNGE_FUN_POOL.find(e=>e.title===t.title);
    if(entry?.month){seasonal++;assert.equal(entry.month,month);}
  }
  assert.ok(seasonal>=12);
  const {source}=sourceFor(10);
  const at=Date.parse('2026-09-30T15:00:00Z');assert.equal(h.dayKey(at),'2026-10-01');
  for(let i=0;i<400;i++){
    const t=h.dailyThread(original,source+':'+i,at),entry=h.LOUNGE_FUN_POOL.find(e=>e.title===t.title);
    if(entry?.month)assert.equal(entry.month,10);
  }
});

test('publication uses existing one-save path, delayed linked comments, rollback and review mode',()=>{
  vm.runInContext(read('hani-board-library.js'),context);
  const runtimeLibrary=context.HaniBoardLibrary;
  // Find an actual daily projection, then retain it as a synthetic scheduled post to isolate arrivals.
  let p,at;
  for(let d=0;d<40&&!p;d++){
    api.setState(fresh());at=now+d*day;p=h.generateDaily(at).find(casual);
  }
  assert.ok(p);const original=runtimeLibrary.threads.find(t=>t.id===p.libraryId);
  context.HaniBoardLibrary={threads:[original]};
  const state=fresh();state.boardPosts.push({...plain(p),createdAt:new Date(at-day).toISOString(),scheduledAt:new Date(at+day).toISOString(),draft:true});
  state.boardPosts[0].replyMode='review';api.setState(state);
  const before=plain(api.getState()),saves=inspection().queues;
  saveFailure(true);assert.equal(h.refreshLiving(at),false);saveFailure(false);assert.deepEqual(plain(api.getState()),before);
  assert.equal(inspection().queues,saves);
  api.setState(fresh());context.HaniBoardLibrary=runtimeLibrary;
  const count=inspection().queues;assert.equal(h.refreshLiving(at),true);assert.equal(inspection().queues,count+1);
  const post=api.getState().boardPosts.find(casual),thread=h.publicationThread(post),queued=api.getState().boardComments.filter(c=>c.postId===post.id);
  assert.ok(post);assert.equal(queued.length,3);assert.equal(queued[2].parentId,queued[0].id);
  queued.forEach((c,i)=>{assert.equal(c.body,thread.comments[i].body);assert.equal(Date.parse(c.scheduledAt)-Date.parse(post.scheduledAt),h.ADDRESS_RULES.delays[i]*60000);});
  assert.deepEqual(rest(api.getState()),rest(fresh()));
  const snapshot=plain(api.getState()),same=inspection().queues;
  assert.equal(h.refreshLiving(at),false);assert.deepEqual(plain(api.getState()),snapshot);assert.equal(inspection().queues,same);
  api.setState({...fresh(),boardPosts:[{...fresh().boardPosts[0],replyMode:'review'}]});
  assert.equal(h.refreshLiving(at),true);assert.ok(api.getState().boardPosts.filter(p=>p.libraryId).every(p=>p.draft));
});

test('historical Library posts and WORK/pinned/sensitive source selection retain their original content',()=>{
  const {source,at,p}=sourceFor(10),original=fixtureLibrary(1)[0];
  context.HaniBoardLibrary={threads:[original]};
  const row={...original,libraryId:original.id,sourceEventId:source,scheduledAt:new Date(at).toISOString()};
  const before=plain(row),projected=h.publicationThread(row);
  assert.deepEqual(plain(row),before,'saved original is not rewritten');
  for(const key of ['authorId','title','body'])assert.equal(projected[key],original[key],'historical post '+key);
  assert.equal(projected.comments.length,original.comments.length);
  for(const change of [{category:'WORK'},{pinned:true},{title:'건강이 걱정돼요'},{body:'반려동물을 떠나보내고 상실감을 느껴요'}]){
    const t={...original,...change},before=plain(t),next=h.dailyThread(t,source,at);
    assert.deepEqual(plain(t),before,'source remains intact');
    for(const key of ['authorId','title','body','category','pinned'])assert.equal(next[key],t[key]);
    for(const c of next.comments)assert.doesNotMatch(c.body,/언니|누나|오빠|형님/);
  }
  assert.notEqual(p.title,original.title);
});

test('sensitive threads never get joke comments, including laughter in fear/illness/loss/worry text and library publication',()=>{
  api.setState(fresh());
  for(const [title,body] of [['독서 AI 미래','AI 디스토피아가 너무 무서워 ㅋㅋ'],['AI 이야기','인공지능이 걱정돼 ㅎㅎ'],['운동 기록','몸이 아파서 병원에 갔어요 ㅋㅋ'],['반려동물 소식','반려동물을 떠나보냈어요'],['오늘 이야기','힘들고 우울해요 ㅎㅎ']]){
    for(let seed=0;seed<60;seed++){
      const post={id:'sensitive-'+seed,authorId:roster.chairman.id,category:'LOUNGE',title,body};
      const reactions=h.loungeReactions(post,seed);assert.ok(reactions.length);
      for(const c of reactions){assert.equal(c.intent,'fear');const text=/병원/.test(body)&&['hani','naeun','hina'].includes(c.authorId)?c.body.replaceAll('💜',''):c.body;assert.doesNotMatch(text,jokes);assert.equal(c.parentIndex,null);}
    }
    const original={...fixtureLibrary(1)[0],title,body};context.HaniBoardLibrary={threads:[original]};
    const row={...original,libraryId:original.id,sourceEventId:'daily:2026-10-14:0',createdAt:new Date(now).toISOString()};
    for(const c of h.publicationThread(row).comments)assert.doesNotMatch(c.body,jokes);
  }
  for(const change of [{category:'WORK'},{category:'LOUNGE',pinned:true}]){
    const post={id:'formal',authorId:roster.chairman.id,title:'업무 안내',body:'농담이야 ㅋㅋ',...change};
    for(const c of h.loungeReactions(post,0))assert.doesNotMatch(c.body,jokes);
  }
});

test('casual owner reactions mix kind one-liners and two sentences while record celebrations allow playful lines',()=>{
  api.setState(fresh());let short=0,long=0,celebration=false;
  for(let seed=0;seed<200;seed++){
    const post={id:'chatter-'+seed,authorId:roster.chairman.id,category:'LOUNGE',title:'점심 취향 이야기',body:'취향 얘기를 나눠요.'};
    for(const c of h.loungeReactions(post,seed)){if(sentenceCount(c.body)===1)short++;else long++;}
    const book={...post,id:'celebration-'+seed,title:'완독 소식',sourceEventId:'book:'+seed};
    if(h.loungeReactions(book,seed).some(c=>c.body.includes('독서왕')))celebration=true;
  }
  assert.ok(short/(short+long)>=.35&&short/(short+long)<=.65,short+'/'+(short+long));assert.ok(celebration);
});
