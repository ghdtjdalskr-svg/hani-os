import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import inverse from './hani-office-affinity-cap-source.cjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {stripApprovedAffinityStorage} from './hani-office-affinity-storage.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const source=read('hani-office-live.js'),key='hani_office_affinity_v1';
const owner=source.slice(source.indexOf('  function createOfficeAffinity(){'),source.indexOf('  function createTapLines('));
const user={type:'click',isTrusted:true},enter={type:'keydown',key:'Enter',isTrusted:true};
const ids=['hani','gaeun','yuna','jieun','haru','naeun','hina','minji','sooyeon','sua','taeo','seoyun','dohyun','serin','yuri','arin','daon','yoonseul','mir','pet-cat','pet-dog','pet-rabbit','pet-bori','iseul','eunha'];
const plain=x=>JSON.parse(JSON.stringify(x));
function storage(raw=null){
 const rows=new Map([['hani_os_life_v23','PROTECTED'],['other','KEEP']]),reads=[],writes=[];
 if(raw!==null)rows.set(key,raw);
 const api={getItem(k){reads.push(k);return rows.get(k)??null},setItem(k,v){assert.equal(k,key);writes.push([k,v]);rows.set(k,v)},removeItem(){assert.fail('remove')},clear(){assert.fail('clear')}};
 return {rows,reads,writes,api};
}
function model(raw=null,{shared=storage(raw),now='2026-11-08T12:00:00+09:00'}={}){
 let clock=+new Date(now);const warnings=[];
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
 const c=vm.createContext({localStorage:shared.api,Date:Clock,console:{warn:m=>warnings.push(m)}});
 vm.runInContext(owner+';globalThis.a=createOfficeAffinity()',c);
 return {...shared,a:c.a,warnings,advance:ms=>clock+=ms,set:t=>clock=+new Date(t),saved:()=>JSON.parse(shared.rows.get(key))};
}
test('raw v1 -> v2 keeps all known counts including 9999, unchanged key, no other writes',()=>{
 const counts=Object.fromEntries(ids.map((id,i)=>[id,i===0?9999:i*51]));
 const x=model(JSON.stringify({v:1,counts}));for(const id of ids)assert.equal(x.a.get(id).count,counts[id]);
 assert.equal(x.writes.length,0,'read-only load waits for a normal dirty flush');
 x.a.tap('mir',user);x.advance(2000);x.a.flush();
 assert.deepEqual(x.saved(),{v:2,counts:{...counts,mir:counts.mir+1},day:'2026-11-08',today:{mir:1}});
 const reloaded=model(x.rows.get(key));for(const id of ids)assert.equal(reloaded.a.get(id).count,id==='mir'?counts[id]+1:counts[id]);
 assert.ok(x.reads.every(k=>k===key));assert.ok(x.writes.every(([k])=>k===key));assert.equal(x.rows.get('hani_os_life_v23'),'PROTECTED');assert.equal(x.rows.get('other'),'KEEP');
});
test('raw daily cap applies separately to every staff, pet and barista; only trusted click/Enter count',()=>{
 const x=model();for(const id of ids){
  for(const e of [null,{...user,isTrusted:false},{...user,type:'mouseover'},{...enter,repeat:true},{...enter,key:' '}])assert.equal(x.a.tap(id,e),null);
  assert.equal(x.a.tap(id,user).added,true);assert.equal(x.a.tap(id,enter).added,true);
  for(let i=0;i<30;i++)assert.equal(x.a.tap(id,user).added,false);
  assert.equal(x.a.get(id).count,2);
 }
 for(const id of ['__proto__','constructor','seongmin','visitor','unknown'])assert.equal(x.a.tap(id,user),null);
 x.a.flush();assert.equal(x.writes.length,0);x.advance(1999);x.a.flush();assert.equal(x.writes.length,0);x.advance(1);x.a.flush();assert.equal(x.writes.length,1);
 assert.deepEqual(x.saved().today,Object.fromEntries(ids.map(id=>[id,2])));
 const y=model(x.rows.get(key));for(const id of ids){assert.equal(y.a.tap(id,user).added,false);assert.equal(y.a.get(id).count,2)}
});
test('raw KST 23:59 -> 00:00 resets today and one-time notice, never lifetime counts',()=>{
 const x=model(null,{now:'2026-11-08T23:59:00+09:00'});
 x.a.tap('hani',user);x.a.tap('hani',user);assert.match(x.a.tap('hani',user).line,/내일/);x.a.flush(true);
 assert.equal(x.saved().day,'2026-11-08');
 x.advance(60000);assert.equal(x.a.get('hani').count,2);assert.equal(x.a.tap('hani',user).added,true);x.a.tap('hani',user);assert.match(x.a.tap('hani',user).line,/내일/);x.a.flush(true);
 assert.deepEqual(x.saved(),{v:2,counts:{hani:4},day:'2026-11-09',today:{hani:2}});
 const y=model(JSON.stringify({v:2,counts:{hani:70,mir:9999},day:'2026-11-07',today:{hani:2,mir:2}}));
 assert.equal(y.a.tap('hani',user).count,71);y.a.flush(true);assert.deepEqual(y.saved().today,{hani:1});assert.equal(y.saved().counts.mir,9999);
 // A pending award before midnight flushes after midnight with a fresh allowance.
 const z=model(null,{now:'2026-11-08T23:59:59+09:00'});z.a.tap('hani',user);z.advance(2000);z.a.flush();assert.equal(z.saved().day,'2026-11-09');assert.deepEqual(z.saved().today,{});assert.equal(z.saved().counts.hani,1);
 const lazy=model(JSON.stringify({v:2,counts:{hani:2},day:'2026-11-09',today:{hani:2}}),{now:'2026-11-08T23:59:00+09:00'});
 lazy.advance(60000);assert.equal(lazy.a.tap('hani',user).added,false,'first lazy load after midnight must retain the current stored allowance');
});
test('raw invalid v1/v2/unknown versions remain byte-identical with memory-only cap and one warning',()=>{
 const bad=['{bad','null','[]','{"v":3,"counts":{}}',
  {v:1,counts:[]},{v:1,counts:{hani:-1}},{v:1,counts:{hani:1.5}},{v:1,counts:{hani:4,mir:-1}},
  {v:1,counts:{},extra:1},{v:2,counts:{}},
  ...['2026-02-30','2026-13-01','2026-1-01',null,8].map(day=>({v:2,counts:{},day,today:{}})),
  ...[[],null,{hani:3},{hani:-1},{hani:1.5},{hani:1}].map(today=>({v:2,counts:{},day:'2026-11-08',today})),
  {v:2,counts:{hani:-1},day:'2026-11-08',today:{}},{v:2,counts:{},day:'2026-11-08',today:{},extra:1},
  {v:2,counts:{},day:'2026-11-08',today:{constructor:1}},'{"v":2,"counts":{},"day":"2026-11-08","today":{"__proto__":1}}'];
 for(const value of bad){const raw=typeof value==='string'?value:JSON.stringify(value),x=model(raw);
  for(let i=0;i<12;i++){x.a.tap('hani',user);x.advance(2000);x.a.flush(true)}
  assert.equal(x.rows.get(key),raw);assert.equal(x.writes.length,0);assert.equal(x.warnings.length,1);assert.equal(x.a.get('hani').count,2);
 }
});
test('raw flush revalidates storage: newly malformed/read failure/quota never overwrites or retries',()=>{
 for(const mode of ['malformed','read','quota']){
  const x=model();x.a.tap('hani',user);const raw='{"v":9,"keep":"untouched"}';
  if(mode==='malformed')x.rows.set(key,raw);
  if(mode==='read')x.api.getItem=()=>{throw Error('denied')};
  let attempts=0;if(mode==='quota')x.api.setItem=()=>{attempts++;throw Error('quota')};
  x.advance(2000);x.a.flush();x.advance(2000);x.a.flush(true);
  assert.equal(x.writes.length,0);assert.equal(x.warnings.length,1);assert.equal(attempts,mode==='quota'?1:0);
  if(mode==='malformed')assert.equal(x.rows.get(key),raw);
  assert.equal(x.a.tap('hani',user).count,2);assert.equal(x.a.tap('hani',user).added,false);
 }
});
test('raw two live instances flush in either order: counts/day maxima preserve different ids and larger stored values',()=>{
 for(const reverse of [false,true]){
  const shared=storage(JSON.stringify({v:2,counts:{hani:50,mir:15,'pet-bori':9999},day:'2026-11-08',today:{hani:1}}));
  const a=model(null,{shared}),b=model(null,{shared});a.a.get('hani');b.a.get('hani');
  a.a.tap('hani',user);a.a.tap('yuri',user);b.a.tap('mir',user);b.a.tap('mir',user);b.a.tap('yuri',user);
  const list=reverse?[b,a]:[a,b];for(const x of list){x.advance(2000);x.a.flush()}
  assert.deepEqual(a.saved(),{v:2,counts:{hani:51,mir:17,'pet-bori':9999,yuri:1},day:'2026-11-08',today:{hani:2,mir:2,yuri:1}});
  const last=list[1];assert.equal(last.a.tap('hani',user).added,false);assert.equal(last.a.tap('mir',user).added,false);
 }
 const shared=storage(),a=model(null,{shared}),b=model(null,{shared});a.a.tap('hani',user);b.a.tap('mir',user);a.a.flush(true);b.a.flush(true);assert.deepEqual(a.saved().counts,{hani:1,mir:1});
});
test('raw cap notice only on first blocked tap per id/day; all secret pools and level thresholds survive',()=>{
 for(const id of ids){
  const base={v:1,counts:{[id]:70}},x=model(JSON.stringify(base));
  const first=x.a.tap(id,user).line,second=x.a.tap(id,user).line,notice=x.a.tap(id,user);
  assert.match(notice.line,/내일/);assert.equal(notice.added,false);assert.equal(notice.up,false);
  const tail=Array.from({length:3},()=>x.a.tap(id,user).line),cycle=x.a.tap(id,user).line;
  assert.equal(new Set([first,second,...tail]).size,5);assert.equal(cycle,first);assert.notEqual(cycle,notice.line);
  if(id.startsWith('pet-'))assert.notEqual(notice.line,'오늘은 충분히 친해졌어요. 내일 또 만나요!');
  x.advance(86400000);x.a.tap(id,user);x.a.tap(id,user);assert.equal(x.a.tap(id,user).line,notice.line);
 }
 for(const [count,level]of [[0,1],[4,1],[5,2],[14,2],[15,3],[34,3],[35,4],[69,4],[70,5],[9999,5]])assert.equal(model(JSON.stringify({v:1,counts:{hani:count}})).a.get('hani').level,level);
 for(const count of [4,14,34,69]){const x=model(JSON.stringify({v:1,counts:{hani:count}}));const r=x.a.tap('hani',user);assert.equal(r.up,true);assert.match(r.line,/회장님/)}
});

const table=JSON.parse(read('assets/data/office-actions-221.json')),manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const settle=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
async function mount(width,reduced,floor='4f',hour=12){
 const shared=storage(),listeners={};
 const f=fixture(`${hour}:00`,reduced,()=>true,table,{localStorage:shared.api,HaniOfficeV2Assets:{...assets,spritesV3:manifest},innerWidth:width,setTimeout:()=>0,clearTimeout(){},
  fetch:async url=>url.endsWith('/office-tap-lines-v1.json')?{ok:true,json:async()=>JSON.parse(read('assets/data/office-tap-lines-v1.json'))}:{ok:false},
  addEventListener:(type,fn)=>{assert.ok(!listeners[type]);listeners[type]=fn},
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}})
 });
 f.ids.set('app',{classList:{contains:()=>false}});f.context.window.HaniOfficePresence={chairman:'absent'};
 f.setDateTime(`2026-11-07T${hour}:00:00+09:00`);f.click(floor);await settle();
 const panel=f.root.querySelector('.hani-office-character-bubble'),layer=f.ids.get('haniOfficeActors');
 const tap=(a,e=user)=>{const event={...e,target:a,preventDefault(){}};if(a===f.ids.get('haniOfficeBarista'))a.onclick(event);else layer.events[e.type==='keydown'?'keydown':'click'](event)};
 return {...shared,f,panel,layer,tap,listeners,actor:id=>layer.children.find(a=>a.dataset.person===id)};
}
for(const width of [1280,390])for(const reduced of [false,true])test(`raw mounted cap uses existing single bubble/float and resumes normal dialogue ${width}/${reduced}`,async()=>{
 const x=await mount(width,reduced),a=x.actor('hani'),slots=x.layer.children.slice(),p=x.panel.querySelector('p'),float=x.panel.querySelector('.hani-office-affinity-float');
 x.tap(a);assert.equal(float.hidden,false);x.tap(a,enter);assert.equal(float.hidden,false);x.tap(a);assert.match(p.textContent,/오늘 친밀도는 여기까지/);assert.equal(float.hidden,true);
 const notice=p.textContent;await settle();assert.equal(p.textContent,notice);x.tap(a);assert.notEqual(p.textContent,notice);assert.equal(float.hidden,true);
 assert.equal(x.f.context.window.HaniOfficeAffinity.get('hani').count,2);assert.equal(x.f.root.querySelectorAll('.hani-office-character-bubble').length,1);assert.equal(x.f.root.querySelectorAll('.hani-office-affinity').length,1);assert.deepEqual(x.layer.children,slots);
 assert.deepEqual(Object.keys(x.listeners),['pagehide']);x.listeners.pagehide();assert.deepEqual(JSON.parse(x.writes[0][1]).today,{hani:2});
});
test('raw mounted all pets and both baristas receive two points, one cap notice, then existing lines',async()=>{
 for(const [id,floor,hour]of [['pet-cat','1f',10],['pet-dog','2f',10],['pet-rabbit','3f',10],['pet-bori','1f',10],['iseul','1f',12],['eunha','1f',21]]){
  const x=await mount(390,true,floor,hour),a=id==='iseul'||id==='eunha'?x.f.ids.get('haniOfficeBarista'):x.actor(id);assert.ok(!a.hidden,id);
  x.tap(a);x.tap(a);x.tap(a);const notice=x.panel.querySelector('p').textContent;assert.match(notice,/내일/);x.tap(a);assert.notEqual(x.panel.querySelector('p').textContent,notice,id);assert.equal(x.f.context.window.HaniOfficeAffinity.get(id).count,2);
  x.listeners.pagehide();assert.deepEqual(JSON.parse(x.writes[0][1]).today,{[id]:2});assert.equal(x.f.root.querySelectorAll('.hani-office-character-bubble').length,1);
 }
});
test('raw safety boundary and exact inverse: only owner changed, zero new timers/listeners/runtime files, reject tampering',()=>{
 const before=inverse.restoreAffinityCapSource(source);assert.equal(inverse.hash(before),inverse.delta.beforeSha256);
 for(const re of [/\bsetTimeout\s*\(/g,/\bsetInterval\s*\(/g,/\baddEventListener\s*\(/g,/\brequestAnimationFrame\s*\(/g,/\bfetch\s*\(/g])assert.equal([...source.matchAll(re)].length,[...before.matchAll(re)].length);
 assert.equal((source.match(/localStorage\.getItem/g)||[]).length,1);assert.equal((source.match(/localStorage\.setItem/g)||[]).length,1);
 assert.doesNotMatch(source,/hani_os_life_v23|supabase|sessionStorage|localStorage\.(?:clear|removeItem)/);
 assert.doesNotMatch(stripApprovedAffinityStorage(source),/localStorage|sessionStorage|supabase/);
 for(const changed of [source+'\n',source.replace(key,'other_key'),source.replace('v:2,counts,day,today','v:2,counts,day,today,extra'),source.replace('today[id]=(today[id]||0)+1','today[id]=0')])assert.throws(()=>inverse.restoreAffinityCapSource(changed));
 assert.equal(plain(model().a.get('hani')).count,0);
});
