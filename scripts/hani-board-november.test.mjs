// Approved November content through the real builder/runtime; synthetic state only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {api,handlers as h,context,roster,plain,inspection} from './hani-board.test.mjs';
import {buildLibrary,validateLibrary} from './hani-board-library-build.mjs';
import {cleanLibrary} from './hani-board-vocative-clean.mjs';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const authored=JSON.parse(read('data/board-library/part-c.json')).threads;
const built=vm.createContext({});
vm.runInContext(read('hani-board-library.js'),built);
const library=plain(built.HaniBoardLibrary.threads);
for(const file of ['hani-character-archive-data.js','hani-relationship-seed.js'])vm.runInContext(read(file),context);
const editorial=read('hani-ui-v02992.js');
vm.runInContext(editorial.slice(editorial.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),editorial.indexOf('const SPORTS_LINES')),context);
const reset=threads=>{
  api.setState({...plain(api.freshState()),books:[{id:'november-test',title:'Synthetic baseline'}]});
  context.HaniBoardLibrary={threads};
};
const generated=now=>h.generateDaily(now).filter(p=>p.libraryId);
const midnight=date=>Date.parse(date+'T00:00:00+09:00');

test('builder appends 40 stable IDs after all 180 existing entries and includes active new staff',async()=>{
  await buildLibrary({check:true});
  const existing=['part-a','part-b'].flatMap(part=>JSON.parse(read('data/board-library/'+part+'.json')).threads);
  assert.deepEqual(library.slice(0,180),plain(validateLibrary(existing,roster)));
  assert.equal(library.length,220);
  assert.deepEqual(authored.map(t=>t.id),Array.from({length:40},(_,i)=>'part-c-'+String(i+1).padStart(3,'0')));
  assert.deepEqual(library.slice(180),plain(validateLibrary(authored,roster)));
  assert.equal(new Set(authored.map(t=>t.authorId)).size,19);
});

test('approved titles/authors, staff mentions, one reply per post, nickname and vocative rules',async()=>{
  const drafts=[...read('docs/drafts/lounge-posts-2026-11-v2.md').matchAll(/^### \d+\. [^\r\n]+\r?\n([\s\S]*?)(?=\r?\n---)/gm)];
  assert.equal(drafts.length,40);
  for(const [i,thread] of authored.entries()){
    const draft=drafts[i][1];
    assert.equal(thread.title,draft.match(/^- \*\*제목\*\*: ([^\r\n]+)/m)[1]);
    assert.equal(thread.authorId,draft.match(/^- \*\*작성자\*\*: .*?`([^`]+)`/m)[1]);
    assert.ok(roster.people.some(p=>p.id!==thread.authorId&&p.id!=='seongmin'&&p.name.split(' · ').some(name=>(thread.title+' '+thread.body).includes(name))),thread.id+' mentions a colleague');
    assert.equal(thread.comments.length,1);
    const [comment]=thread.comments;
    assert.equal(comment.authorId,draft.match(/^- \*\*어울리는 댓글\*\*: \*\*.*?`([^`]+)`/m)[1]);
    assert.equal(comment.replyTo,null);
    assert.ok(comment.afterMin>=0&&Number.isFinite(comment.afterMin));
    assert.ok(!/오빠/.test(thread.title+' '+thread.body+' '+comment.body));
    assert.ok(!/^(?:씨가|연구원님|책임님|대리가|과장님은|매니저님이|사원님이)/.test(comment.body),thread.id+' has no stranded title');
  }
  assert.equal((await cleanLibrary({check:true})).changed,0);
});

test('November dates cover 30 days at one or two posts per day and match Friday/weekend topics',()=>{
  const days=new Map();
  for(const thread of authored){
    assert.match(thread.date,/^2026-11-(?:0[1-9]|[12]\d|30)$/);
    days.set(thread.date,(days.get(thread.date)||0)+1);
    const weekday=new Date(midnight(thread.date)+9*3600000).getUTCDay();
    if(thread.weekday==='fri')assert.equal(weekday,5);
    if(thread.weekday==='weekend')assert.ok([0,6].includes(weekday));
  }
  assert.equal(days.size,30);
  assert.ok([...days.values()].every(count=>count===1||count===2));
});

test('each new post is excluded before its KST date and scheduled no earlier than that date',()=>{
  const queues=inspection().queues;
  for(const thread of library.slice(180)){
    const start=midnight(thread.date);
    reset([thread]);
    assert.equal(generated(start-1).length,0,thread.id+' before midnight');
    const rows=generated(start);
    assert.equal(rows.length,1,thread.id+' on its date');
    assert.ok(Date.parse(rows[0].scheduledAt)>=start);
    assert.equal(rows[0].pending,true,'midnight does not publish the daytime slot');
    assert.equal(rows[0].libraryId,thread.id);
    assert.equal(api.getState().boardPosts.length,0,'generation only returns a projection');
  }
  assert.equal(inspection().queues,queues,'date eligibility never queues a save');
});

test('full library excludes future posts across every November day; date-less posts keep eligibility',()=>{
  const dated=new Map(authored.map(t=>[t.id,t.date]));
  for(let day=1;day<=30;day++){
    const date='2026-11-'+String(day).padStart(2,'0');
    reset(library);
    const rows=generated(midnight(date)+23*3600000);
    assert.ok(rows.length>=2&&rows.length<=4);
    for(const row of rows)assert.ok(!dated.has(row.libraryId)||dated.get(row.libraryId)<=date);
  }
  reset([{...library[0],season:[],weekday:[]}]);
  assert.equal(generated(midnight('2026-10-01')).length,1,'existing undated content remains eligible');
  reset([{...library[180],season:[],weekday:[],date:'2026-11-31'}]);
  assert.equal(generated(midnight('2026-11-30')).length,0,'invalid date cannot publish early');
  reset([{...library[180],season:[],weekday:[],date:'2026-11-02'}]);
  assert.equal(generated(Date.parse('2026-11-01T14:59:59.999Z')).length,0,'UTC afternoon is still the prior KST date');
  assert.equal(generated(Date.parse('2026-11-01T15:00:00.000Z')).length,1,'KST midnight opens eligibility');
});
