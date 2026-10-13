// Synthetic records only: execute the existing renderer and sorting paths without persistence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {api,context,roster,plain,inspection} from './hani-board.test.mjs';

const board=fs.readFileSync(new URL('../hani-board.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const now=Date.parse('2026-10-13T03:00:00Z'),day=86400000;
class Clock extends Date {constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
context.Date=Clock;
const slots=new Map(),node=()=>({innerHTML:'',textContent:'',value:'',open:false,hidden:false,addEventListener(){},querySelector(){return null},focus(){},reset(){},setAttribute(){}});
for(const [,key] of index.match(/<section id="board"[\s\S]*?<\/section>/)[0].matchAll(/data-board="([^"]+)"/g))slots.set(key,node());
for(const key of ['postForm','commentForm']){
  slots.get(key).elements={};
  for(const field of ['title','body','category','pinned'])slots.get(key).elements[field]={value:'',checked:false,focus(){}};
}
const root={...node(),classList:{contains:()=>false},querySelector:s=>slots.get(s.match(/data-board="([^"]+)"/)?.[1]),querySelectorAll:()=>[],contains:()=>true};
context.document.getElementById=id=>id==='board'?root:null;
context.projectionPersistCalls=0;
vm.runInContext(board.replace('function persist(nextPosts,nextComments){','function persist(nextPosts,nextComments){ globalThis.projectionPersistCalls++;'),context);
const h=context.window.HaniBoard;
const fresh=()=>({...plain(api.freshState()),books:[{id:'baseline',title:'Existing local record'}]});
const post=(id,fields={})=>({id,authorId:roster.chairman.id,title:'합성 글 '+id,body:'합성 기록',category:'WORK',createdAt:new Date(now).toISOString(),views:1,likes:0,...fields});
const ids=readers=>Array.from(readers,p=>p.id);
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value};
const reset=(rows=[],history=[])=>api.setState({...fresh(),boardPosts:rows,boardComments:history});

test('stable per KST day, bounded by distinct roster, and additive to unchanged stored counters',()=>{
  reset();
  for(let i=0;i<250;i++){
    const p=freeze(post('det-'+i)),a=h.displayViews(p,now),likes=h.displayLikes(p,now),readers=h.boardReaders(p,now);
    assert.equal(a,h.displayViews(p,now));assert.equal(likes,h.displayLikes(p,now));
    assert.equal(a,h.displayViews(p,now+10*3600000),'same KST calendar day');
    assert.equal(likes,h.displayLikes(p,now+10*3600000));
    assert.ok(a>=1&&a<=roster.people.length+1);assert.ok(likes>=0&&likes<=readers.length);
    assert.equal(new Set(ids(readers)).size,readers.length);
    assert.ok(readers.every(p=>roster.people.some(r=>r.id===p.id&&r.name===p.name)));
    assert.equal(h.displayViews({...p,views:9},now),a+8,'legacy multi-session owner count remains additive');
    assert.equal(h.displayLikes({...p,likes:9},now),likes+9);
  }
  for(const createdAt of ['bad-date','2099-01-01T00:00:00Z']){
    const p=post('edge',{createdAt,views:-1,likes:NaN});
    assert.ok(h.displayViews(p,now)<=roster.people.length*4,'repeat reads stay bounded');assert.ok(h.displayLikes(p,now)>=0);
  }
  assert.equal(h.displayViews(post('max',{views:Number.MAX_SAFE_INTEGER}),now),Number.MAX_SAFE_INTEGER);
  assert.equal(h.displayLikes(post('max',{likes:Number.MAX_SAFE_INTEGER}),now),Number.MAX_SAFE_INTEGER);
});

test('reader and supporter sets never shrink with age; KST midnight is the daily boundary',()=>{
  reset();
  let totals=[0,0,0];
  for(let i=0;i<300;i++){
    const p=post('age-'+i);let previous=[],views=0,likes=0;
    for(let age=0;age<=30;age++){
      const current=ids(h.boardReaders(p,now+age*day));
      assert.ok(previous.every(id=>current.includes(id)));
      assert.ok(h.displayViews(p,now+age*day)>=views);assert.ok(h.displayLikes(p,now+age*day)>=likes);
      previous=current;views=h.displayViews(p,now+age*day);likes=h.displayLikes(p,now+age*day);
    }
    [0,2,7].forEach((age,n)=>totals[n]+=h.boardReaders(p,now+age*day).length);
    const late={...p,createdAt:'2026-10-12T14:59:59Z'};
    assert.deepEqual(ids(h.boardReaders(late,Date.parse('2026-10-12T15:00:00Z'))),ids(h.boardReaders(late,now)));
  }
  const rates=totals.map(n=>n/(300*roster.people.length));
  [.4,.7,.9].forEach((expected,i)=>assert.ok(Math.abs(rates[i]-expected)<.04,JSON.stringify(rates)));
});

test('authors, published commenters/repliers and identified reactors always count once',()=>{
  reset();const p=post('participation');
  const absent=roster.people.filter(r=>!ids(h.boardReaders(p,now)).includes(r.id));assert.ok(absent.length>=4);
  const [a,b,c,d]=absent;
  const rows=[{id:'c',postId:p.id,authorId:b.id,body:'확인할게요.'},
    {id:'reply',postId:p.id,authorId:c.id,parentId:'c',body:'저도요.'},
    {id:'duplicate',postId:p.id,authorId:b.id,body:'다시 읽어요.'},
    {id:'pending',postId:p.id,authorId:d.id,pending:true,body:'축하해요!'},
    {id:'unknown',postId:p.id,authorId:'outside-roster',body:'축하해요!'}];
  const row={...p,authorId:a.id,reactions:{'👍':{count:500,owner:true,staffIds:[b.id,'outside-roster']},'❤️':{authorId:c.id}}};
  reset([row],rows);
  const readers=ids(h.boardReaders(row,now));for(const r of [a,b,c])assert.ok(readers.includes(r.id));
  assert.ok(!readers.includes(d.id));assert.ok(!readers.includes('outside-roster'));assert.equal(readers.length,new Set(readers).size);
  reset([p],[]);assert.deepEqual(ids(h.boardReaders({...p,reactions:{'👍':{count:500,owner:true}}},now)),ids(h.boardReaders(p,now)),'anonymous counts never invent staff');
});

test('positive comments force staff empathy, negative comments do not; celebrations have a higher subset',()=>{
  const p=post('empathy',{authorId:'unknown'});
  const rows=roster.people.map((r,i)=>({id:'positive-'+i,postId:p.id,authorId:r.id,body:'축하해요! 응원할게요.'}));
  reset([p],rows);assert.equal(h.displayLikes(p,now),roster.people.length);
  reset([p],rows.map(r=>({...r,body:'동의하지 않아요. 추천하지 않아요.'})));
  const negative=h.displayLikes(p,now);reset([p],rows.map(r=>({...r,body:'검토할게요.'})));
  assert.equal(h.displayLikes(p,now),negative,'negative words do not force empathy');
  for(let i=0;i<100;i++){
    const ordinary=post('type-'+i,{authorId:'hani',title:'일반 업무'}),celebration={...ordinary,title:'완독 축하!'};
    reset([], [{id:'author-reader',postId:ordinary.id,authorId:'hani',body:'검토할게요.'}]);
    assert.ok(h.displayLikes(celebration,now)>=h.displayLikes(ordinary,now));
    assert.ok(h.displayLikes({...ordinary,authorId:roster.chairman.id},now)>=h.displayLikes(ordinary,now));
  }
});

test('real list/detail/button numbers and tooltip roster names agree; rendering makes zero persist calls',()=>{
  const p=post('render'),history=roster.people.slice(0,5).map((r,i)=>({id:'c-'+i,postId:p.id,authorId:r.id,body:'응원해요!',createdAt:p.createdAt}));
  const state=freeze({...fresh(),future:{keep:true},boardPosts:[freeze({...p,reactions:{'👍':{count:2,owner:true}},future:'keep'})],boardComments:history});
  api.setState(state);api.recovery.active=true;
  const before=plain(api.getState()),queues=inspection().queues,persist=context.projectionPersistCalls;
  h.openPost(p.id);h.render();
  api.recovery.active=false;h.render();h.render();
  const list=slots.get('list').innerHTML,detail=slots.get('article').innerHTML;
  const views=h.displayViews(p,now),likes=h.displayLikes(p,now);
  assert.match(list,new RegExp('board-mobile-label">조회 </span>'+views+'</td>'));
  assert.match(list,new RegExp('board-mobile-label">추천 </span>'+likes+'</td>'));
  assert.match(detail,new RegExp('조회 '+views+'</span>'));assert.match(detail,new RegExp('추천 '+likes+'</span>'));
  assert.match(detail,new RegExp('>👍 추천 '+likes+'</button>'));
  const tooltip=list.match(/board-cell-views" title="([^"]+)"/)[1];
  const readers=h.boardReaders(p,now),expected=Array.from(readers.slice(0,3),r=>r.name).join(', ');
  const reads=h.staffReads(p,now);assert.ok(tooltip.includes('직원 '+readers.length+'명이 '+reads+'번 읽었어요 · '+expected));assert.equal(reads+Number(p.views||0),views,'tooltip staff reads + owner opens = shown count');assert.ok(reads>=readers.length&&reads<=readers.length*4,'each staff reader reads 1-4 times');
  if(readers.length>3)assert.ok(tooltip.includes('외 '+(readers.length-3)+'명'));
  assert.ok(detail.includes('title="'+tooltip+'"'));assert.ok(!Number(p.views)||tooltip.includes('회장님 '+p.views+'회 조회'));
  const likeTitle=list.match(/board-cell-likes[^\"]*" title="([^"]+)"/)[1];assert.ok(detail.includes('title="'+likeTitle+'"'));
  assert.deepEqual(plain(api.getState()),before);assert.equal(inspection().queues,queues);assert.equal(context.projectionPersistCalls,persist);
  api.recovery.active=false;
});

test('popular tab and weeklyBest sort by projected likes then projected views, preserving pin priority',()=>{
  let winner;
  reset();
  const loser=post('raw-first',{likes:1});
  for(let i=0;i<500;i++){
    const candidate=post('staff-first-'+i);
    if(h.displayLikes(candidate,now)>h.displayLikes(loser,now)){winner=candidate;break}
  }
  assert.ok(winner,'staff projection can outrank a larger raw counter');
  const pinned=post('pinned',{pinned:true});reset([loser,winner,pinned]);
  const before=plain(api.getState()),queues=inspection().queues;
  assert.deepEqual(Array.from(h.listPosts('POPULAR','',now),p=>p.id),[pinned.id,winner.id,loser.id]);
  const sorted=[loser,winner,pinned].sort((a,b)=>h.displayLikes(b,now)-h.displayLikes(a,now)||h.displayViews(b,now)-h.displayViews(a,now)||b.createdAt.localeCompare(a.createdAt));
  assert.deepEqual(Array.from(h.weeklyBest(now),p=>p.id),sorted.map(p=>p.id));
  reset([loser,winner]);assert.equal(h.weeklyBest(now)[0].id,winner.id);
  const first=post('views-tie-a',{likes:40}),second=post('views-tie-b',{views:90});reset([first,second]);
  const tied={...second,likes:h.displayLikes(first,now)-h.displayLikes(second,now)};reset([first,tied]);
  assert.equal(h.displayLikes(first,now),h.displayLikes(tied,now));assert.equal(h.listPosts('POPULAR','',now)[0].id,tied.id);assert.equal(h.weeklyBest(now)[0].id,tied.id);
  reset(before.boardPosts,before.boardComments);h.render();
  assert.match(slots.get('best').innerHTML,new RegExp(winner.title+' · '+h.displayLikes(winner,now)));
  assert.deepEqual(plain(api.getState()).boardPosts,before.boardPosts);assert.equal(inspection().queues,queues);
});

test('absent roster adds nothing and duplicate/outsider members never inflate staff bounds',()=>{
  reset();const original=context.window.HaniOrganizationRoster,p=post('roster');
  try{
    context.window.HaniOrganizationRoster=undefined;assert.equal(h.boardReaders(p,now).length,0);assert.equal(h.displayViews(p,now),p.views);assert.equal(h.displayLikes(p,now),p.likes);
    context.window.HaniOrganizationRoster={...original,people:[...original.people,original.people[0],original.chairman]};
    assert.equal(new Set(ids(h.boardReaders(p,now))).size,h.boardReaders(p,now).length);
    assert.ok(h.displayViews(p,now)<=original.people.length*4+p.views);
  }finally{context.window.HaniOrganizationRoster=original}
});
