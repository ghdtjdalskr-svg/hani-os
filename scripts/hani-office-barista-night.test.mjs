import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {at} from './hani-office-lively-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {restoreBarista273Source} from './hani-office-barista-night-273-source.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const table=JSON.parse(read('assets/data/office-actions-221.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
async function mount({width=1280,reduced=false,seconds=75600,art=true}={}){
 let clock=+at('2026-11-07',seconds),next=0,locked=false;const pending=new Map(),history=[],writes=[];
 const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('10:00',reduced,()=>art,table,{
  HaniOfficeV2Assets:{...assets,spritesV3:manifest},innerWidth:width,
  fetch:async()=>({ok:false}),
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout(fn,ms){const t={id:++next,fn,ms,at:clock+ms};pending.set(t.id,t);history.push(t);return t.id},clearTimeout:id=>pending.delete(id),
  localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny
 });
 f.ids.set('app',{classList:{contains:()=>locked}});f.context.window.HaniOfficePresence={chairman:'absent'};
 f.setDateTime(new Date(clock).toISOString());f.click('1f');await flush();
 const patch=f.map.querySelector('.hani-office-barista-night'),button=f.ids.get('haniOfficeBarista'),panel=f.root.querySelector('.hani-office-character-bubble');
 const down=target=>f.document.events.pointerdown({target,pointerType:'mouse',isPrimary:true});
 const tap=()=>{down(button);button.onclick({target:button})};
 async function advance(ms){clock+=ms;f.setDateTime(new Date(clock).toISOString());for(const t of [...pending.values()].sort((a,b)=>a.at-b.at))if(pending.has(t.id)&&t.at<=clock){pending.delete(t.id);t.fn()}f.timers.find(t=>t.ms===100).fn();await flush()}
 return {f,patch,button,panel,tap,down,pending,history,writes,advance,lock:v=>{locked=v}};
}

test('night barista: exact KST shift and frame boundaries, including clock-only rollover',async()=>{
 for(const reduced of [false,true])for(const [h,m,name,frame] of [[18,59,'이슬',null],[19,0,'은하',1],[1,59,'은하',1],[2,0,'은하',2],[6,59,'은하',2],[7,0,'이슬',null]]){
  const x=await mount({reduced,seconds:h*3600+m*60});assert.equal(x.patch.hidden,frame===null);assert.ok(x.button.getAttribute('aria-label').includes(name));if(frame)assert.equal(x.patch.dataset.frame,String(frame));assert.deepEqual(x.writes,[]);
 }
 for(const [seconds,frame]of [[18*3600+59*60+59,1],[7199,2],[25199,null]]){const x=await mount({seconds});await x.advance(1000);assert.equal(x.patch.hidden,frame===null);if(frame)assert.equal(x.patch.dataset.frame,String(frame));}
});

test('night barista: one persistent exact art rectangle, floor/loading/fallback scoped and tap-through',async()=>{
 const x=await mount(),nodes=x.f.root.querySelectorAll('*');assert.equal(x.patch.parentElement,x.f.map);assert.equal(x.patch.getAttribute('aria-hidden'),'true');
 for(const [key,n,d]of [['left',1500,1672],['top',610,941],['width',120,1672],['height',110,941]])assert.equal(x.patch.style[key],n/d*100+'%');
 let created=0;const create=x.f.document.createElement;x.f.document.createElement=(...a)=>{created++;return create(...a)};
 for(let i=0;i<3;i++)for(const floor of ['2f','3f','4f','5f','1f']){x.f.click(floor);assert.equal(x.patch.hidden,true,'hidden while floor changes');await flush();assert.equal(x.patch.hidden,floor!=='1f');assert.equal(x.f.map.querySelectorAll('.hani-office-barista-night').length,1)}
 assert.equal(created,0);assert.deepEqual(x.f.root.querySelectorAll('*'),nodes);
 const fallback=await mount({art:false});assert.equal(fallback.patch.hidden,true);assert.equal(fallback.button.hidden,true);fallback.down(fallback.f.map);fallback.tap();assert.equal(fallback.panel.hidden,true);
 const css=read('hani-office-live.css');assert.match(css,/\.hani-office-barista-night\{[^}]*z-index:2[^}]*pointer-events:none[^}]*background-size:300% 100%[^}]*animation:none/);assert.match(css,/\.hani-office-barista-night\[hidden\]\{display:none\}/);assert.match(css,/#haniOfficeActors\{[^}]*z-index:4/);assert.match(css,/\.hani-office-character-bubble\{[^}]*z-index:10/);assert.deepEqual(x.writes,[]);
});

test('night barista: 03:00 tap pours for 3s through shared timer; phone bubble keeps its 5s duration',async()=>{
 for(const width of [1280,390])for(const reduced of [false,true]){
  const x=await mount({width,reduced,seconds:10800});assert.equal(x.patch.dataset.frame,'2');x.tap();assert.equal(x.patch.dataset.frame,'3');assert.equal(x.patch.style.backgroundPosition,'100% 0');assert.equal(x.panel.hidden,false);assert.equal(x.panel.querySelector('p').textContent,'은하 · 야간 카페 · 앗, 회장님! 졸지 않았어요… 커피 드릴게요.');assert.equal(x.history.at(-1).ms,3000);assert.equal(x.pending.size,1);
  await x.advance(2999);assert.equal(x.patch.dataset.frame,'3');await x.advance(1);assert.equal(x.patch.dataset.frame,'2');assert.equal(x.panel.hidden,width>480);if(width<=480){assert.equal(x.history.at(-1).ms,2000);await x.advance(2000);assert.equal(x.panel.hidden,true)}assert.deepEqual(x.writes,[]);
 }
});

test('night barista: dismissal, Escape, floor/view changes and stale timer preserve 268 close behavior',async()=>{
 const x=await mount({seconds:10800});
 for(const close of [()=>x.down(x.f.map),()=>x.button.onkeydown({key:'Escape'}),()=>x.f.click('2f'),()=>x.f.hide()]){
  x.f.show();x.f.click('1f');await flush();x.tap();const stale=x.history.at(-1);close();assert.equal(x.panel.hidden,true);assert.equal(x.patch.dataset.frame,'2');stale.fn();assert.equal(x.panel.hidden,true);
 }
 x.f.show();x.f.click('1f');await flush();x.lock(true);x.tap();assert.equal(x.panel.hidden,true);assert.equal(x.patch.dataset.frame,'2');x.lock(false);x.tap();x.down(x.panel);assert.equal(x.panel.hidden,false);assert.equal(x.f.root.querySelectorAll('.hani-office-character-bubble').length,1);assert.deepEqual(x.writes,[]);
});

test('night barista: eight calm night lines and exact original day lines, independent rotations',async()=>{
 const lines=['회장님, 오늘도 늘 드시던 걸로요?','원두는 오늘 아침에 새로 볶았어요.','라떼 아트는 하트가 제일 자신 있어요.','직원분들 주문 순서, 다 외웠답니다.','크림이가 또 쿠키 냄새 맡고 왔네요.','치즈는 창가 자리 단골손님이에요.','바쁜 날엔 샷 하나 추가해 드릴게요.','디카페인도 맛있게 내려 드려요.'];
 for(const width of [1280,390]){const x=await mount({width,seconds:43200});for(let i=0;i<8;i++){x.tap();assert.equal(x.panel.querySelector('p').textContent,'바리스타 이슬 · '+(width===390?'카페운영':'카페 운영 중')+' · '+lines[i]);assert.equal(x.patch.hidden,true)}
  await x.advance(9*3600000);const night=new Set();for(let i=0;i<8;i++){x.tap();night.add(x.panel.querySelector('p').textContent);assert.equal(x.patch.dataset.frame,'1');assert.ok(x.panel.textContent.includes('은하 · 야간 카페'))}assert.equal(night.size,8);assert.ok([...night].some(s=>s.includes('보리가 문 앞에서 지켜 줘서 든든해요.')));await x.advance(15*3600000);x.tap();assert.equal(x.panel.querySelector('p').textContent,'바리스타 이슬 · '+(width===390?'카페운영':'카페 운영 중')+' · '+lines[0]);assert.deepEqual(x.writes,[]);
 }
});

test('night barista: byte-exact 360x110 opaque atlas; sole new runtime file 158 -> 159/160',async()=>{
 const require=createRequire(import.meta.url),sharp=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
 const file='assets/office-season/barista-night.webp',bytes=fs.readFileSync(new URL('../'+file,import.meta.url));assert.deepEqual(bytes,fs.readFileSync(new URL('../../barista-night/artifacts/barista-night/counter-night.webp',import.meta.url)));const meta=await sharp(bytes).metadata();assert.deepEqual([meta.width,meta.height],[360,110]);const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=3;i<data.length;i+=info.channels)assert.equal(data[i],255);
 const options={exists:f=>fs.existsSync(f),read:f=>fs.readFileSync(f)},current=await resolveRuntimeClosure(options),before=await resolveRuntimeClosure({...options,read:f=>['hani-office-live.js','hani-office-live.css'].includes(f)?restoreBarista273Source(read(f),f):fs.readFileSync(f)});
 assert.deepEqual(current.missing,[]);assert.deepEqual(before.missing,[]);assert.equal(before.files.length,158);assert.equal(current.files.length,159);assert.ok(current.files.length<=160);assert.deepEqual(current.files.filter(f=>!before.files.includes(f)),[file]);
});

test('night barista: unchanged scheduler/labels/pets/props, timer and listener counts, no storage/Cloud paths',()=>{
 const source=read('hani-office-live.js'),before=restoreBarista273Source(source);assert.equal(before,read('artifacts/barista-night-live/baseline-hani-office-live.js.txt'));
 for(const regex of [/document\.addEventListener\(/g,/addEventListener\(/g,/setInterval\(/g,/setTimeout\(/g,/requestAnimationFrame\(/g,/\bfetch\(/g])assert.equal([...source.matchAll(regex)].length,[...before.matchAll(regex)].length);
 assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|\bsave\s*\(/);
});
