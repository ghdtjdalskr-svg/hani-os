const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const J=require('../hani-street-journal.js');
const C=require('../hani-investment-committee.js');
const block=data=>'아침 인사\n<<<HSJ v1\n'+JSON.stringify(data)+'\nHSJ>>>\n마무리';
const data=()=>({edition:'2026-10-21',temperature:{score:0,prev:null},kr:{items:[{name:'지수',value:0,chg:0}]},portfolio:[]});
function harness(initial=null){
  let value=initial; const calls=[];
  const storage={getItem(key){calls.push(['read',key]);assert.equal(key,J.KEY);return value;},setItem(key,next){calls.push(['write',key]);assert.equal(key,J.KEY);value=next;}};
  let allow=true;const confirms=[];
  const archive=J.archive(storage,message=>{confirms.push(message);return allow;});
  return {archive,calls,confirms,get value(){return value;},set allow(v){allow=v;}};
}
test('parser: block, prose, fences, smart quotes, empty object and failures with readable location',()=>{
  assert.deepEqual(J.parse(block(data())),data());assert.deepEqual(J.parse('<<<HSJ v1\n```json\n{“edition”: “2026-10-21”}\n```\nHSJ>>>'),{edition:'2026-10-21'});
  assert.deepEqual(J.parse(block({})),{});assert.throws(()=>J.parse('본문'),/데이터 블록을 찾지 못했어요/);
  assert.throws(()=>J.parse('<<<HSJ v1\n{"edition":,}\nHSJ>>>'),/JSON.*줄.*번째/);
  for(const value of [null,[],1,'text'])assert.throws(()=>J.parse(block(value)),/JSON 객체/);
  assert.equal(J.parse(block({hani:{comment:'그는 “공포”라고 했다'}})).hani.comment,'그는 “공포”라고 했다');
});
test('No data distinguishes missing, null, whitespace, false, objects, and zero; changes use symbols and bp',()=>{
  for(const value of [null,undefined,'',' ',false,{},[]]){assert.ok(J.missing(value));assert.match(J.change(value),/hsj-nodata/);assert.doesNotMatch(J.change(value),/class="(?:up|down)"|▲|▼/);}
  assert.ok(!J.missing(0));assert.match(J.change(0),/>0%/);assert.match(J.change(-3,'bp'),/class="down">▼ 3bp/);assert.match(J.change(2),/class="up">▲ 2%/);
  const flows=J.render({kr:{flows:{foreign:'-5,300억',institution:null,retail:'+8,981억'}}});assert.match(flows,/hsj-down">▼ -5,300억/);assert.match(flows,/hsj-up">▲ \+8,981억/);
  const html=J.render(data());assert.match(html,/>0<\/div>/);assert.match(html,/0\.0/);assert.doesNotMatch(html,/NaN|undefined/);
  for(const partial of [{}, {kr:null,us:[],macro:{items:[null]},portfolio:[null],why:[null],hani:{actions:[null,{}]}}])assert.doesNotMatch(J.render(partial),/undefined|NaN/);
});
test('poses: cover, market moods, macro and temperature threshold',()=>{
  for(const [mood,expected]of [['up','cheer'],['down','worried'],['mixed','think'],['flat','think'],[undefined,'think']]){
    assert.equal(J.pose(mood),expected);const html=J.render({kr:{mood},us:{mood}});assert.match(html,new RegExp('p-jieun-'+expected));assert.match(html,new RegExp('p-minji-'+expected));assert.match(html,/p-hani-point/);assert.match(html,/p-seoyun-point/);
  }
  for(const [score,expected]of [[5,'cheer'],[4.9,'think'],[0,'think'],[null,'think'],[undefined,'think']])assert.equal(J.closingPose(score),expected);
});
test('all user strings escaped; links restricted to http(s); enum status whitelist',()=>{
  const evil='<img src=x onerror=alert(1)>', html=J.render({edition:evil,kr:{comment:evil,asOf:evil,items:[{name:evil,value:evil,chg:evil,unit:evil}]},temperature:{label:evil},portfolio:[{name:evil,status:evil,short:evil,long:evil}],why:[{fact:evil,interp:evil}],calendar:[{when:evil,what:evil}],hani:{comment:evil,actions:[evil]},sources:[{name:evil,url:'javascript:alert(1)'},{name:'safe',url:'https://example.com/?q="<>"'}]});
  assert.doesNotMatch(html,/<img|onerror=alert\(1\)>|href="javascript:/);assert.match(html,/&lt;img/);assert.match(html,/href="https:\/\/example.com/);assert.doesNotMatch(html,/class="hsj-badge"/);
});
test('read/render/parse failure writes zero; only the approved key is ever read or written',()=>{
  const h=harness();h.archive.read();J.render(data());assert.throws(()=>J.parse('no block'));assert.equal(h.calls.filter(c=>c[0]==='write').length,0);
  assert.ok(h.archive.store(block(data()),data()));assert.equal(h.calls.filter(c=>c[0]==='write').length,1);
  assert.deepEqual(Object.keys(JSON.parse(h.value)).sort(),['editions','schema']);assert.deepEqual(Object.keys(JSON.parse(h.value).editions['2026-10-21']).sort(),['data','raw','savedAt']);
  assert.ok(h.calls.every(c=>c[1]===J.KEY));
});
test('overwrite and delete require confirmation; cancel preserves exact bytes',()=>{
  const h=harness();h.archive.store(block(data()),data());const before=h.value;h.allow=false;
  assert.equal(h.archive.store('replacement',data()),false);assert.equal(h.archive.remove('2026-10-21'),false);assert.equal(h.value,before);assert.equal(h.confirms.length,2);
  h.allow=true;h.archive.store('replacement',data());assert.equal(JSON.parse(h.value).editions['2026-10-21'].raw,'replacement');assert.equal(h.archive.remove('2026-10-21'),true);assert.deepEqual(h.archive.read().editions,{});
});
test('400 ceiling refuses new date without deleting; existing replacement permitted',()=>{
  const editions={};for(let i=0;i<400;i++){const date=new Date(Date.UTC(2020,0,1+i)).toISOString().slice(0,10);editions[date]={savedAt:'test',raw:'raw',data:{edition:date}};}
  const h=harness(JSON.stringify({schema:1,editions})), before=h.value;assert.throws(()=>h.archive.store('new',data()),/400/);assert.equal(h.value,before);assert.equal(h.calls.filter(c=>c[0]==='write').length,0);
  assert.ok(h.archive.store('replace',{edition:Object.keys(editions)[0]}));assert.equal(Object.keys(h.archive.read().editions).length,400);
});
test('damaged/denied archive stays untouched while parsing and preview work; invalid dates refuse storage',()=>{
  for(const bad of ['{','null','{"schema":2,"editions":{}}','{"schema":1,"editions":[]}','{"schema":1,"editions":{"2026-10-21":null}}']){
    const h=harness(bad);assert.throws(()=>h.archive.read(),/보관함을 읽지 못했어요/);assert.throws(()=>h.archive.store('',data()),/보관함을 읽지 못했어요/);assert.equal(h.value,bad);assert.equal(h.calls.filter(c=>c[0]==='write').length,0);assert.ok(J.render(J.parse(block(data()))));
  }
  assert.throws(()=>J.archive({getItem(){throw Error('denied');}},()=>true).read(),/보관함을 읽지 못했어요/);
  const h=harness();for(const edition of [null,'2026-02-30','2026-1-1','<script>'])assert.throws(()=>h.archive.store('',{edition}),/YYYY-MM-DD/);assert.equal(h.calls.length,0);
  assert.throws(()=>J.archive({getItem(){return null;},setItem(){throw Error('quota');}},()=>true).store('',data()),/보관하지 못했어요/);
});
test('actual public openResearch body: unique ticker/name only, no cards/history/snapshot changes',()=>{
  const source=fs.readFileSync(require.resolve('../hani-investment-committee.js'),'utf8');
  const start=source.indexOf('function openResearch(key) {'),end=source.indexOf('\n  function openEditor',start);
  const state={investmentResearchCards:[{id:'one',name:'삼성전자우',ticker:'005935'},{id:'two',name:'Other',ticker:'ABC'}],investmentResearchHistory:[{original:true}],investmentCommitteeSnapshots:[{original:true}]};
  const before=JSON.stringify(state), opened=[], notices=[];
  const context=vm.createContext({state,UI:{research:'icResearch'},selectSection:key=>assert.equal(key,'icResearch'),researchMatches:C.researchMatches,openEditor:c=>opened.push(c.id),notice:s=>notices.push(s)});
  vm.runInContext(source.slice(start,end)+'\nthis.open=openResearch',context);
  assert.equal(context.open('005935'),true);assert.equal(context.open('삼성전자우'),true);assert.deepEqual(opened,['one','one']);assert.equal(context.open('missing'),false);assert.equal(notices.at(-1),'종목 리포트 없음');assert.equal(JSON.stringify(state),before);
  state.investmentResearchCards.push({id:'dup',ticker:'005935',name:'Duplicate'});const duplicateBefore=JSON.stringify(state);assert.equal(context.open('005935'),false);assert.equal(JSON.stringify(state),duplicateBefore);assert.equal(context.open(''),false);
  assert.equal(C.researchMatches([{ticker:'ABC',name:'Name'},{ticker:'ZZZ',name:'abc'}],'abc').length,2);
});
test('journal has no life key, commit/save/cloud calls, observer or other storage operations',()=>{
  const source=fs.readFileSync(require.resolve('../hani-street-journal.js'),'utf8');
  assert.doesNotMatch(source,/hani_os_life_v23|\b(?:save|commit|writeProtectedState)\s*\(|MutationObserver|\.removeItem\s*\(|\.clear\s*\(|supabase|cloudClient/);
  const keys=[...source.matchAll(/hani_[a-z_]+v\d/g)].map(m=>m[0]);assert.deepEqual([...new Set(keys)],[J.KEY]);
});
