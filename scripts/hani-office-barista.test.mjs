import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const table=JSON.parse(read('assets/data/office-actions-221.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const lines=['회장님, 오늘도 늘 드시던 걸로요?','원두는 오늘 아침에 새로 볶았어요.','라떼 아트는 하트가 제일 자신 있어요.','직원분들 주문 순서, 다 외웠답니다.','크림이가 또 쿠키 냄새 맡고 왔네요.','치즈는 창가 자리 단골손님이에요.','바쁜 날엔 샷 하나 추가해 드릴게요.','디카페인도 맛있게 내려 드려요.'];
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
async function mount({width=1280,reduced=false,art=true}={}){
 let next=0,locked=false;const pending=new Map(),history=[],writes=[];
 const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('10:00',reduced,()=>art,table,{
  HaniOfficeV2Assets:{...assets,spritesV3:manifest},
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout(fn,ms){const t={id:++next,fn,ms};pending.set(t.id,t);history.push(t);return t.id},clearTimeout:id=>pending.delete(id),
  localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny
 });
 f.ids.set('app',{classList:{contains:()=>locked}});f.context.window.HaniOfficePresence={chairman:'absent'};
 f.setDateTime(at('2026-11-06',36000).toISOString());f.click('1f');await flush();
 const button=f.ids.get('haniOfficeBarista'),panel=f.root.querySelector('.hani-office-character-bubble'),p=panel.querySelector('p'),link=panel.querySelector('a');
 const tap=()=>{f.document.events.pointerdown({target:button});button.onclick({target:button})};
 return {f,button,panel,p,link,tap,pending,history,writes,lock:v=>{locked=v;f.show()}};
}

test('barista: one transparent persistent map button, exact art box, 1F only including fallback',async()=>{
 const x=await mount();assert.equal(x.button.parentElement,x.f.map);assert.equal(x.button.hidden,false);assert.equal(x.button.type,'button');
 assert.equal(x.button.attributes['aria-label'],'바리스타 이슬 · 카페 운영 중');
 for(const [key,value]of Object.entries({left:1536/1672*100,top:650/941*100,width:45/1672*100,height:56/941*100}))assert.equal(parseFloat(x.button.style[key]),value,key);
 const nodes=x.f.root.querySelectorAll('*');let created=0;const create=x.f.document.createElement;x.f.document.createElement=(...a)=>{created++;return create(...a)};
 for(let n=0;n<3;n++)for(const floor of ['2f','3f','4f','5f','1f']){x.f.click(floor);await flush();assert.equal(x.button.hidden,floor!=='1f');assert.equal(x.f.ids.get('haniOfficeBarista'),x.button)}
 assert.equal(created,0);assert.deepEqual(x.f.root.querySelectorAll('*'),nodes);
 const fallback=await mount({art:false});assert.equal(fallback.button.hidden,true);fallback.tap();assert.equal(fallback.panel.hidden,true);
 const css=read('hani-office-live.css');assert.match(css,/\.hani-office-barista\{[^}]*z-index:2[^}]*background:transparent/);assert.match(css,/#app #haniOfficeMap \.hani-office-barista\{[^}]*min-width:0!important;min-height:0!important/);assert.doesNotMatch(css,/\.hani-office-barista::(?:before|after)/);
});

test('barista: exact rotating lines, shared bubble, phone status, reduced motion and zero writes',async()=>{
 for(const width of [1280,390])for(const reduced of [false,true]){
  const x=await mount({width,reduced});let previous=null;const used=new Set();
  for(let n=0;n<17;n++){x.tap();assert.equal(x.panel.hidden,false);assert.equal(x.link.hidden,true);assert.equal(x.panel.dataset.zoom,'false');assert.equal(x.panel.querySelector('.hani-office-bubble-sprite').hidden,true);
   const prefix='바리스타 이슬 · '+(width===390?'카페운영':'카페 운영 중')+' · ';assert.ok(x.p.textContent.startsWith(prefix));const line=x.p.textContent.slice(prefix.length);assert.ok(lines.includes(line));assert.ok([...line].length<=24);assert.notEqual(line,previous);previous=line;used.add(line);
   assert.equal(x.f.root.querySelectorAll('.hani-office-character-bubble').length,1);assert.equal(x.f.root.querySelector('.hani-office-character-bubble'),x.panel);
  }
  assert.equal(used.size,8);assert.deepEqual(x.writes,[]);assert.ok(x.history.every(t=>[450,3000].includes(t.ms)));assert.equal(x.pending.size,1);
 }
});

test('barista: outside tap, Escape, existing auto close, stale callbacks, floor changes and staff link restore',async()=>{
 const x=await mount();x.tap();const old=x.history.at(-1);assert.equal(old.ms,3000);
 x.f.document.events.pointerdown({target:x.panel});assert.equal(x.panel.hidden,false);
 x.f.document.events.pointerdown({target:x.f.map});assert.equal(x.panel.hidden,true);
 x.tap();x.button.onkeydown({key:'Escape'});assert.equal(x.panel.hidden,true);
 x.tap();x.history.at(-1).fn();assert.equal(x.panel.hidden,true);
 x.tap();const staff=x.f.visible().find(a=>!a.dataset.resident&&a.dataset.visitor!=='true'&&a.dataset.person!=='seongmin');assert.ok(staff);
 x.f.document.events.pointerdown({target:staff});x.f.ids.get('haniOfficeActors').events.click({target:staff});await flush();
 assert.equal(x.panel.hidden,false);assert.equal(x.link.hidden,false);assert.equal(x.link.href,'#organization/people/'+staff.dataset.person);assert.ok(x.p.textContent.includes(staff.dataset.name));old.fn();assert.equal(x.panel.hidden,false);
 x.tap();x.f.click('2f');assert.equal(x.panel.hidden,true);assert.equal(x.button.hidden,true);x.tap();assert.equal(x.panel.hidden,true);
 x.f.click('1f');await flush();x.lock(true);x.tap();assert.equal(x.panel.hidden,true);x.lock(false);x.f.hide();x.tap();assert.equal(x.panel.hidden,true);assert.deepEqual(x.writes,[]);
});

test('barista: plan, blockPlan, snapshot outputs and protected owner bytes preserve the pre-patch baseline',()=>{
 const baseline=JSON.parse(read('artifacts/cafe-barista/baseline.json')),source=read('hani-office-live.js'),hash=x=>createHash('sha256').update(x).digest('hex'),{scene}=loadScene();
 for(const {name,start,end,sha256}of baseline.sections){const i=source.indexOf(start),j=source.indexOf(end,i);assert.ok(i>=0&&j>i,name);assert.equal(hash(source.slice(i,j)),sha256,name)}
 for(const row of baseline.models){const s=scene.scheduler,plan=s.plan(row.day,row.options);assert.equal(hash(JSON.stringify(plan)),row.plan);assert.equal(hash(JSON.stringify(s.blockPlan(row.day,0,plan,row.options))),row.blockPlan);for(const snap of row.snapshots){assert.equal(hash(JSON.stringify(s.snapshot(at(row.day,snap.seconds),row.options))),snap.scheduler);assert.equal(hash(JSON.stringify(scene.snapshot(at(row.day,snap.seconds),row.options))),snap.view)}}
 const before=read('artifacts/cafe-barista/before-source.txt');for(const pattern of [/document\.addEventListener\(/g,/setInterval\(/g,/setTimeout\(/g])assert.equal([...source.matchAll(pattern)].length,[...before.matchAll(pattern)].length,pattern.toString());
 assert.doesNotMatch(source.slice(source.indexOf('  // Visible barista pixels only:'),source.indexOf('  // Each floor owns persistent decorative slots;')),/localStorage|sessionStorage|fetch\(|\.addEventListener\(|setTimeout\(|setInterval\(/);
});
