// Synthetic records only. Exercise existing generation, queue, save and renderer paths.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {api,context,roster,plain,inspection,rest,saveFailure} from './hani-board.test.mjs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const board=read('hani-board.js');
vm.runInContext(read('hani-character-archive-data.js'),context);
vm.runInContext(read('hani-relationship-seed.js'),context);
const editorial=read('hani-ui-v02992.js');
vm.runInContext(editorial.slice(editorial.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),editorial.indexOf('const SPORTS_LINES')),context);
// Expose private pure builders in the test VM only; production keeps its existing public interface.
vm.runInContext(board.replace('generateDaily,realEvents,refreshLiving','generateDaily,realEvents,eventDraft,loungeReactions,refreshLiving'),context);
const h=context.window.HaniBoard,now=Date.parse('2026-10-05T14:59:00Z'),date='2026-10-05';
const notice=/기록이 등록됐어요|완료 표시된|달성으로 기록된/;
const opener=body=>String(body).replace(/^(회장님|대표님|오빠)[,!]?\s*/,'').split(/[.!?。\n]/)[0].trim();
const fresh=()=>({...plain(api.freshState()),books:[{id:'baseline',title:'Existing local record'}],
  boardPosts:[{id:'settings',authorId:roster.chairman.id,boardMeta:true,draft:true,templateCleanupV4:true,title:'설정',body:'설정',category:'WORK'}]});
const stable=row=>{const {id,...fields}=plain(row);return fields};
const types=['book','movie','exercise','body','goal','achieved','progress','ledger','release','quarter','dev'];
const details={book:'인간 vs 기계',movie:'테스트 영화',exercise:'12,345보',body:'83.25kg',goal:'발표 준비',achieved:'독서 목표',
  progress:'목표 진행 화면의 같은 읽기 결과예요. 일부 기록 기준이며 확정 결산과는 구분해요.',ledger:'2026-10',release:'v2.9.209',quarter:'',dev:'라운지 문구 검토 · 검증 대기'};
const pages={book:'reading',movie:'movie',exercise:'exercise',body:'diet',goal:'tasks',achieved:'home',progress:'reading',ledger:'ledger',release:'dev',quarter:'home',dev:'dev'};

test('each event has at least three titles, no notices, deterministic content and at most one emoji',()=>{
  const before=inspection().queues;
  for(const type of types){
    const titles=new Set();
    for(let seed=0;seed<64;seed++){
      api.setState({...fresh(),books:[{id:String(seed),title:details.book,author:'김대식',status:'read',completedDate:date}]});
      const event={sourceEventId:type+':'+seed,date,page:pages[type],label:'old label',detail:details[type]};
      const a=h.eventDraft(event,now),b=h.eventDraft(event,now);
      assert.ok(a,type+' has an existing page owner');assert.deepEqual(stable(a),stable(b));
      assert.doesNotMatch(a.title,notice);assert.equal(a.authorId,context.window.HaniEditorialSources.lines[event.page].speakerId);
      if(type==='book'){
        assert.ok(a.title.includes('인간 vs 기계'));assert.ok(a.body.includes('인간 vs 기계'));assert.ok(a.body.includes('김대식'));
        assert.doesNotMatch(a.title+a.body,/베스트셀러|명작|걸작|감동적|추천하셨|어제|매일/);
      }
      assert.ok((a.title+a.body).match(/\p{Extended_Pictographic}/gu)?.length<=1||!(a.title+a.body).match(/\p{Extended_Pictographic}/gu));
      assert.ok(a.body.split(/[.!?]/).filter(x=>x.trim()).length>=2);
      assert.ok(a.body.split(/(?<=[.!?])\s+/).length<=3,'record post stays within three short sentences');
      titles.add(a.title);
    }
    assert.ok(titles.size>=3,type+': '+[...titles].join(' / '));
  }
  assert.equal(inspection().queues,before,'wording builder never saves');
});

test('real record builder echoes only supplied titles, author, steps and goal name',()=>{
  const state={...fresh(),books:[{id:'b',status:'read',completedDate:date,title:'테스트 <제목> vs 기계',author:'실제 저자'}],
    movies:[{id:'m',status:'watched',watchedDate:date,title:'기록 속 영화'}],exercise:[{id:'e',date,steps:12345}],
    tasks:[{id:'t',status:'done',completedAt:date,title:'실제 할 일'}],
    goalRegistry:[{goal_id:'g',revision:1,status:'achieved',achievedAt:date,title:'실제 목표'}]};
  api.setState(state);
  for(const [id,title] of [['book:b',state.books[0].title],['movie:m',state.movies[0].title],['goal:t',state.tasks[0].title],['achieved:g:1',state.goalRegistry[0].title]]){
    const event=h.realEvents(now).find(e=>e.sourceEventId===id);assert.ok(event,id);
    const post=h.eventDraft(event,now);assert.ok(post.title.includes(title));assert.ok(post.body.includes(title));
    assert.doesNotMatch(post.title+post.body,/김대식|인간 vs 기계|테스트 영화|베스트셀러|명작|걸작|별점|감동적|재밌게 보|추천하셨|매일|어제|최고 기록/);
    if(id==='book:b')assert.ok(post.body.includes('실제 저자'));
  }
  const steps=h.eventDraft(h.realEvents(now).find(e=>e.sourceEventId==='exercise:e'),now);
  assert.ok(steps.title.includes('12,345보'));assert.ok(steps.body.includes('12,345보'));
  api.setState({...state,books:[{id:'b',status:'read',completedDate:date,title:'제목만 있는 책'}]});
  const withoutAuthor=h.eventDraft(h.realEvents(now).find(e=>e.sourceEventId==='book:b'),now);
  assert.doesNotMatch(withoutAuthor.title+withoutAuthor.body,/실제 저자|김대식|저자는|undefined|null/);
  assert.deepEqual(rest(api.getState()),rest({...state,books:[{id:'b',status:'read',completedDate:date,title:'제목만 있는 책'}]}));
});

test('generated lounge threads vary length, avoid repeated openers and use staff replies with chip-only addressing',()=>{
  let peerThreads=0,short=0,long=0;
  api.setState(fresh());
  for(const type of ['book','movie','exercise','goal'])for(let seed=0;seed<100;seed++){
    const post={id:'thread-'+type+seed,sourceEventId:type+':'+seed,authorId:roster.chairman.id,category:'LIFE',title:details[type],body:'소식을 나눠요. 목표 완료 이야기도 나눠요.'};
    const a=h.loungeReactions(post,seed),b=h.loungeReactions(post,seed);
    assert.deepEqual(plain(a),plain(b));assert.ok(a.length>=1&&a.length<=3);
    assert.equal(new Set(a.map(c=>opener(c.body))).size,a.length,JSON.stringify(plain(a)));
    a.forEach(c=>{if(c.parentIndex!==null)assert.doesNotMatch(c.body,/^(?:@[가-힣]+|회장님[,!]|대표님[,!]|하루[,!]|하니[,!])/);if(c.body.length<30)short++;else long++;});
    if(a.length>=3){const last=a.at(-1);assert.equal(last.parentIndex,0);assert.equal(last.toOwner,false);assert.notEqual(last.authorId,a[0].authorId);peerThreads++;}
  }
  assert.ok(peerThreads>0);assert.ok(short>0&&long>0);
});

test('automatic replies persist peer parentId via the existing single save and retain delays, dedupe, rollback and source fields',()=>{
  api.setState(fresh());
  let post;
  for(let seed=0;seed<100;seed++){
    const candidate={id:'automatic-'+seed,authorId:roster.chairman.id,category:'LOUNGE',title:'독서 서재 영화 추천 이야기',body:'책을 다 읽었어요. 목표 완료 소식도 나눠요.'};
    if(h.loungeReactions(candidate,0,candidate,[]).length===3){post=candidate;break;}
  }
  assert.ok(post);api.setState({...fresh(),boardPosts:[...fresh().boardPosts,post]});
  const before=plain(api.getState()),saves=inspection().queues;
  const rows=h.queueReplies(post,post,[],now);
  assert.equal(rows.length,3);assert.equal(rows.at(-1).parentId,rows[0].id);assert.equal(rows.at(-1).toOwner,false);
  assert.ok(rows.every(c=>'parentIndex' in c),'existing queue field retained');
  rows.forEach((row,i)=>assert.equal(Date.parse(row.scheduledAt)-now,h.ADDRESS_RULES.delays[i]*60000));
  assert.deepEqual(plain(api.getState()),before);assert.equal(inspection().queues,saves);
  assert.equal(h.queueReplies(post,post,rows,now).length,0);
  // Existing preview post command writes the whole thread once and preserves unrelated state.
  // Preview has its own regeneration seed; exercise the same adapter with a three-person seed.
  return (async()=>{
    let previewed=false;
    for(let round=1;round<=30;round++){
      assert.equal(await h.previewThread(post.id),true);
      if(h.loungeReactions(post,round).length===3){previewed=true;break;}
    }
    assert.ok(previewed);assert.equal(inspection().queues,saves);
    saveFailure(true);assert.equal(h.postPreview(),false);saveFailure(false);assert.deepEqual(plain(api.getState()),before);
    assert.equal(h.postPreview(),true);assert.equal(inspection().queues,saves+1);
    const saved=api.getState().boardComments;assert.equal(saved.length,3);assert.equal(saved[2].parentId,saved[0].id);
    const html=h.commentMarkup(saved[2],true),name=roster.people.find(p=>p.id===saved[0].authorId).name;
    assert.ok(html.includes('board-mention">@'+name+'</span>'));assert.ok(html.includes(saved[2].body));
    assert.equal((html.match(/board-mention/g)||[]).length,1);assert.deepEqual(rest(api.getState()),rest(before));
  })();
});

test('QA-210 direct chairman intent × topic paths retain pools, avoid repeated openers and use no render-time randomness',()=>{
  api.setState(fresh());const saves=inspection().queues;
  for(const [topic,title] of [['book','독서 책 이야기'],['ai','AI 이야기'],['stock','주식 이야기'],['exercise','운동 이야기']])
    for(const body of ['너무 무서워 ㅋㅋ','고마워요','어떻게 생각해요?','드립 ㅋㅋ','공감해요','이야기해요'])for(let seed=0;seed<30;seed++){
      const post={id:'chairman-'+seed,authorId:roster.chairman.id,title,body,category:'LOUNGE'};
      const rows=h.ownerReactions(post,post,[],seed);
      assert.equal(new Set(rows.map(c=>opener(c.body))).size,rows.length,JSON.stringify(plain(rows)));
      for(const c of rows){assert.equal(c.topic,topic);assert.ok(h.CHAIRMAN_TOPIC_REPLIES[topic][c.intent].some(line=>c.body.includes(line)));}
    }
  assert.equal(inspection().queues,saves);
  assert.doesNotMatch(board,/Math\.random\s*\(|\.clear\s*\(/);
});

test('daily post count, source dedupe, progress caveat and developer status stay unchanged',()=>{
  api.setState({...fresh(),books:[{id:'daily',status:'read',completedDate:date,title:'독서 제목'}]});
  context.HaniBoardLibrary={threads:[]};
  const input=plain(api.getState()),saves=inspection().queues,once=h.generateDaily(now),twice=h.generateDaily(now,once);
  assert.equal(once.filter(p=>p.ownerTied).length,1);assert.deepEqual(plain(twice),plain(once));
  assert.deepEqual(plain(api.getState()),input);assert.equal(inspection().queues,saves);
  for(let i=0;i<12;i++){
    const p=h.eventDraft({sourceEventId:'progress:'+i,page:'reading',date,detail:details.progress},now);
    assert.ok(p.body.includes(details.progress));assert.doesNotMatch(p.title,/달성|확정/);
    const dev=h.eventDraft({sourceEventId:'dev:'+i,page:'dev',date,detail:details.dev},now);
    assert.ok(dev.body.includes('검증 대기'));assert.doesNotMatch(dev.body,/배포 완료|운영 반영|검증 완료/);
  }
});
