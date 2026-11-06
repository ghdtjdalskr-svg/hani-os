import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';import {at} from './hani-office-lively-fixture.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const source=read('hani-office-live.js'),table=JSON.parse(read('assets/data/office-actions-221.json')),manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const ids=['hani','gaeun','yuna','jieun','haru','naeun','hina','minji','sooyeon','sua','taeo','seoyun','dohyun','serin','yuri','arin','daon','yoonseul','mir','pet-cat','pet-dog','pet-rabbit','pet-bori','iseul','eunha'];
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
const user={type:'click',isTrusted:true},enter={type:'keydown',key:'Enter',isTrusted:true};
function storage(raw=null,{readError=false,writeError=false}={}){
 const rows=new Map([['hani_os_life_v23','PROTECTED'],['another_key','KEEP']]);if(raw!==null)rows.set('hani_office_affinity_v1',raw);
 const reads=[],writes=[],warnings=[];
 return {rows,reads,writes,warnings,api:{getItem(k){reads.push(k);if(readError)throw Error('denied');return rows.get(k)??null},setItem(k,v){writes.push([k,v]);if(writeError)throw Error('quota');rows.set(k,v)},removeItem(){assert.fail('remove forbidden')},clear(){assert.fail('clear forbidden')}}};
}
function model(raw=null,opts={}){
 let clock=10000;const s=storage(raw,opts);class Clock extends Date{static now(){return clock}}
 const c=vm.createContext({localStorage:s.api,Date:Clock,console:{warn:x=>s.warnings.push(x)}});
 const a=source.indexOf('  function createOfficeAffinity(){'),b=source.indexOf('  function createTapLines(',a);assert.ok(a>0&&b>a);
 vm.runInContext(source.slice(a,b)+'\nglobalThis.affinity=createOfficeAffinity();',c);
 return {...s,affinity:c.affinity,advance:ms=>{clock+=ms},plain:x=>JSON.parse(JSON.stringify(x))};
}
async function mount({raw=null,width=1280,reduced=false,seconds=36000,floor='4f'}={}){
 let clock=+at('2026-11-07',seconds),next=0;const pending=new Map(),listeners={},s=storage(raw);
 const f=fixture('10:00',reduced,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},innerWidth:width,
  fetch:async url=>url.endsWith('/office-tap-lines-v1.json')?{ok:true,json:async()=>JSON.parse(read('assets/data/office-tap-lines-v1.json'))}:{ok:false},
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout(fn,ms){const t={id:++next,fn,at:clock+ms};pending.set(t.id,t);return t.id},clearTimeout:id=>pending.delete(id),
  localStorage:s.api,console:{...console,warn:x=>s.warnings.push(x)},addEventListener:(type,fn)=>{assert.ok(!listeners[type]);listeners[type]=fn}
 });
 f.ids.set('app',{classList:{contains:()=>false}});f.context.window.HaniOfficePresence={chairman:'absent'};
 f.setDateTime(new Date(clock).toISOString());f.click(floor);await flush();
 const panel=f.root.querySelector('.hani-office-character-bubble'),badge=panel.querySelector('.hani-office-affinity'),float=panel.querySelector('.hani-office-affinity-float');
 const tap=(actor,event=user)=>{const e={...event,target:actor,preventDefault(){}};if(actor===f.ids.get('haniOfficeBarista'))actor.onclick(e);else f.ids.get('haniOfficeActors').events[event.type==='keydown'?'keydown':'click'](e)};
 async function advance(ms){clock+=ms;f.setDateTime(new Date(clock).toISOString());for(const t of [...pending.values()])if(pending.has(t.id)&&t.at<=clock){pending.delete(t.id);t.fn()}f.timers.find(t=>t.ms===100).fn();await flush()}
 return {f,panel,badge,float,tap,advance,listeners,...s,actor:id=>f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person===id)};
}
test('affinity storage: load, read-only get, fake click, hover, repeat and unknown ids never write',()=>{
 const x=model();for(const id of ids){assert.equal(x.affinity.get(id).count,0);for(const e of [{...user,isTrusted:false},{...user,type:'mouseover'},{...enter,repeat:true},{...enter,key:' '},null])assert.equal(x.affinity.tap(id,e),null)}
 for(const id of ['visitor','visitor-2','seongmin','npc-cleaner','__proto__','constructor','unknown'])assert.equal(x.affinity.tap(id,user),null);
 x.advance(100000);x.affinity.flush();x.affinity.flush(true);assert.deepEqual(x.writes,[]);assert.ok(x.reads.every(k=>k==='hani_office_affinity_v1'));
});
test('affinity storage: only the one exact key/counts payload; debounced <= one write per 2s',()=>{
 const x=model();for(const id of ids)for(let n=0;n<3;n++)x.affinity.tap(id,user);
 x.affinity.flush();x.advance(1999);x.affinity.flush();assert.equal(x.writes.length,0);x.advance(1);x.affinity.flush();assert.equal(x.writes.length,1);
 const saved=JSON.parse(x.writes[0][1]);assert.deepEqual(Object.keys(saved).sort(),['counts','v']);assert.equal(saved.v,1);assert.deepEqual(Object.keys(saved.counts).sort(),ids.toSorted());assert.ok(Object.values(saved.counts).every(n=>n===3));
 x.affinity.tap('hani',enter);x.affinity.flush(true);assert.equal(x.writes.length,1);x.advance(1999);x.affinity.flush(true);assert.equal(x.writes.length,1);x.advance(1);x.affinity.flush(true);assert.equal(x.writes.length,2);
 assert.ok(x.writes.every(([k])=>k==='hani_office_affinity_v1'));assert.equal(x.rows.get('hani_os_life_v23'),'PROTECTED');assert.equal(x.rows.get('another_key'),'KEEP');
});
test('affinity storage: malformed values preserved byte-for-byte with one warning and memory-only clicks',()=>{
 for(const raw of ['{bad','null','[]','{"v":2,"counts":{}}','{"v":1,"counts":[]}','{"v":1,"counts":{"hani":-1}}','{"v":1,"counts":{"hani":1.5}}','{"v":1,"counts":{},"extra":"no"}']){
  const x=model(raw);for(let n=0;n<20;n++){x.affinity.tap('hani',user);x.advance(2000);x.affinity.flush(true)}assert.equal(x.affinity.get('hani').count,20);assert.deepEqual(x.writes,[]);assert.equal(x.rows.get('hani_office_affinity_v1'),raw);assert.equal(x.warnings.length,1);
 }
});
test('affinity storage: read denied, quota and storage getter failure remain usable in memory',()=>{
 for(const opts of [{readError:true},{writeError:true}]){const x=model(null,opts);for(let i=0;i<3;i++){x.affinity.tap('hani',user);x.advance(2000);x.affinity.flush()}assert.equal(x.affinity.get('hani').count,3);assert.equal(x.warnings.length,1);assert.equal(x.writes.length,opts.writeError?1:0)}
 const c=vm.createContext({console:{warn(){}}});Object.defineProperty(c,'localStorage',{get(){throw Error('disabled')}});const a=source.indexOf('  function createOfficeAffinity(){'),b=source.indexOf('  function createTapLines(',a);vm.runInContext(source.slice(a,b)+';globalThis.a=createOfficeAffinity()',c);assert.equal(c.a.tap('hani',user).count,1);assert.doesNotThrow(()=>c.a.flush(true));
});
test('affinity levels: every threshold, per-id isolation, unknown stored ids ignored, cap 9999 and reload',()=>{
 for(const [count,level,name]of [[0,1,'처음 만남'],[4,1,'처음 만남'],[5,2,'인사하는 사이'],[14,2,'인사하는 사이'],[15,3,'편한 동료'],[34,3,'편한 동료'],[35,4,'단짝'],[69,4,'단짝'],[70,5,'최애 콤비'],[9999,5,'최애 콤비']]){const x=model(JSON.stringify({v:1,counts:{hani:count}})),got=x.affinity.get('hani');assert.equal(got.level,level);assert.equal(got.name,name);assert.equal(got.hearts,'♥'.repeat(level)+'♡'.repeat(5-level))}
 const x=model('{"v":1,"counts":{"hani":9998,"unknown":500,"seongmin":9}}');x.affinity.tap('hani',user);x.affinity.tap('hani',user);x.affinity.tap('mir',enter);x.affinity.flush(true);assert.equal(x.affinity.get('hani').count,9999);const raw=x.rows.get('hani_office_affinity_v1'),saved=JSON.parse(raw);assert.deepEqual(saved.counts,{hani:9999,mir:1});assert.equal(model(raw).affinity.get('mir').count,1);
});
test('affinity voices: 25 ids each unlock exactly three Lv3 and two additional Lv5 lines; no early leaks',()=>{
 const all=[];
 for(const id of ids){const low=model();assert.equal(low.affinity.tap(id,user).line,'');
  const level3=model(JSON.stringify({v:1,counts:{[id]:15}})),first=Array.from({length:3},()=>level3.affinity.tap(id,user).line);assert.equal(new Set(first).size,3,id);assert.equal(level3.affinity.tap(id,user).line,first[0]);
  const level5=model(JSON.stringify({v:1,counts:{[id]:70}})),five=Array.from({length:5},()=>level5.affinity.tap(id,user).line);assert.equal(new Set(five).size,5,id);assert.deepEqual(five.slice(0,3),first);all.push(...five);
  const up=model(JSON.stringify({v:1,counts:{[id]:14}})).affinity.tap(id,user);assert.equal(up.up,true);assert.ok(up.line.includes('회장님'));assert.ok(up.line.includes('편한 동료'));
 }
 assert.equal(all.length,125);for(const line of all){assert.doesNotMatch(line,/성민|대표님|개구리|자산|잔고|수익|체중|혈압|진료|개인 기록/);assert.ok(line.length<60)}
});
for(const width of [1280,390])for(const reduced of [false,true]){
 test(`affinity actual owner: Lv1 -> Lv2 -> Lv3, secret stability, float and one persistent slot ${width}/${reduced}`,async()=>{
  const x=await mount({width,reduced}),a=x.actor('hani');assert.ok(!a.hidden);x.tap(a);await flush();assert.equal(x.panel.hidden,false);assert.match(x.badge.textContent,/하니.*Lv1 처음 만남 ♥♡♡♡♡/);assert.equal(x.float.hidden,false);assert.equal(x.float.textContent,'+1 ♡');assert.equal(x.writes.length,0);
  for(let n=1;n<15;n++)x.tap(a);assert.match(x.panel.querySelector('p').textContent,/회장님.*편한 동료/);assert.match(x.badge.textContent,/Lv3 편한 동료 ♥♥♥♡♡/);const up=x.panel.querySelector('p').textContent;await flush();assert.equal(x.panel.querySelector('p').textContent,up);
  x.tap(a,enter);assert.match(x.panel.querySelector('p').textContent,/회의 끝나면|제 책상 메모|사무실이 조금 더/);const secret=x.panel.querySelector('p').textContent;await x.advance(100);assert.equal(x.panel.querySelector('p').textContent,secret);
  assert.equal(x.f.root.querySelectorAll('.hani-office-affinity').length,1);await x.advance(1900);assert.equal(JSON.parse(x.writes.at(-1)[1]).counts.hani,16);x.f.click('3f');assert.equal(x.badge.hidden,true);
 });
}
test('affinity actual owner: automatic bubbles/load/floors do not write; synthetic clicks do not count',async()=>{
 const x=await mount();for(const floor of ['1f','2f','3f','4f','5f']){x.f.click(floor);await flush();await x.advance(60000)}x.f.click('4f');await flush();x.tap(x.actor('hani'),{...user,isTrusted:false});await x.advance(60000);assert.deepEqual(x.writes,[]);assert.equal(x.f.context.window.HaniOfficeAffinity.get('hani').count,0);
});
test('affinity actual owner: reused visibility lifecycle plus exactly one pagehide listener, no timer added',async()=>{
 const x=await mount();assert.deepEqual(Object.keys(x.listeners),['pagehide']);x.tap(x.actor('hani'));x.f.document.hidden=true;x.f.document.events.visibilitychange();assert.equal(x.writes.length,1);assert.equal(JSON.parse(x.writes[0][1]).counts.hani,1);x.listeners.pagehide();assert.equal(x.writes.length,1);
 const y=await mount();y.tap(y.actor('hani'));y.listeners.pagehide();assert.equal(y.writes.length,1);assert.equal(y.f.timers.filter(t=>t.ms===100).length,1);
});
test('affinity actual owner: day/night baristas independent and each pet id counted through the canonical tap',async()=>{
 for(const [seconds,id]of [[43200,'iseul'],[75600,'eunha']]){const x=await mount({seconds,floor:'1f'});x.tap(x.f.ids.get('haniOfficeBarista'));assert.match(x.badge.textContent,new RegExp((id==='iseul'?'이슬':'은하')+'.*Lv1'));await x.advance(2000);assert.deepEqual(JSON.parse(x.writes[0][1]).counts,{[id]:1})}
 for(const [id,floor]of [['pet-cat','1f'],['pet-dog','2f'],['pet-rabbit','3f'],['pet-bori','1f']]){const x=await mount({floor,raw:JSON.stringify({v:1,counts:{[id]:14}})}),a=x.actor(id);assert.ok(!a.hidden,id);x.tap(a);assert.match(x.panel.querySelector('p').textContent,/회장님.*편한 동료/);await x.advance(100);assert.match(x.panel.querySelector('p').textContent,/회장님.*편한 동료/);await x.advance(1900);assert.equal(JSON.parse(x.writes[0][1]).counts[id],15)}
});
test('affinity actual owner: hidden/locked actor and non-Enter keyboard do not increase',async()=>{
 const x=await mount(),a=x.actor('hani');x.tap(a,{...enter,key:' '});x.tap(a,{...enter,repeat:true});a.hidden=true;x.tap(a);a.hidden=false;x.f.ids.set('app',{classList:{contains:()=>true}});x.tap(a);await x.advance(3000);assert.deepEqual(x.writes,[]);
});
test('affinity CSS motion and source boundaries: no new timers, network, protected state or other storage',()=>{
 const css=read('hani-office-live.css'),before=read('artifacts/office-affinity/baseline-hani-office-live.js.txt');assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.hani-office-affinity-float\{display:none;animation:none!important\}\}/);
 assert.match(css,/\.hani-office-character-bubble:has\(>\.hani-office-affinity:not\(\[hidden\]\)\)\{flex-wrap:wrap\}/);assert.match(css,/\.hani-office-affinity\{[^}]*grid-column:1 \/ -1;flex:0 0 100%[^}]*white-space:nowrap/);
 for(const pattern of [/setInterval\(/g,/setTimeout\(/g,/requestAnimationFrame\(/g,/\bfetch\(/g])assert.equal([...source.matchAll(pattern)].length,[...before.matchAll(pattern)].length);
 assert.equal([...source.matchAll(/addEventListener/g)].length,[...before.matchAll(/addEventListener/g)].length+1);assert.equal([...source.matchAll(/localStorage\.setItem/g)].length,1);assert.equal([...source.matchAll(/localStorage\.getItem/g)].length,1);assert.doesNotMatch(source,/hani_os_life_v23|localStorage\.(?:clear|removeItem)|supabase|sessionStorage/);
});
