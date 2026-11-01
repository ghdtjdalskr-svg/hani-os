// Actual production owner with DOM/Image doubles. No browser or saved data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {loadScene} from './hani-office-lively-fixture.mjs';

const {scene}=loadScene(),fx=scene.atmosphere;
const at=time=>new Date('2026-11-01T'+time+':00+09:00');
const day='./assets/building/floor-5f-217.webp',night='./assets/building/floor-5f-night-243.webp';
const rooftop=scene.floors.find(f=>f.id==='5f');
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
const frame=f=>f.timers.find(t=>t.ms===100).fn();
const layer=f=>f.map.querySelector('.hani-office-atmosphere');
const glow=f=>f.map.querySelector('.hani-office-monitor-glow');
const bg=f=>f.map.querySelector('.hani-office-background');
const washes=f=>Object.fromEntries(['morning','evening','night'].map(p=>[p,layer(f).querySelector('.hani-office-wash-'+p).style.opacity]));

test('motion2: phase/tint boundaries follow the KST light schedule regardless of device timezone',()=>{
 for(const [time,phase,tint] of [['00:00','night','night'],['05:59','night','night'],['06:00','morning','night'],['06:10','morning','morning'],['10:59','morning','morning'],['11:00','day','morning'],['11:10','day',null],['16:59','day',null],['17:00','evening',null],['17:10','evening','evening'],['18:29','evening','evening'],['18:30','night','evening'],['18:40','night','night'],['23:59','night','night']]){
  const light=fx.light(at(time));assert.equal(light.phase,phase,time);
  assert.deepEqual(Object.keys(light.tint).filter(k=>light.tint[k]>0),tint?[tint]:[],time);
  assert.ok(Object.values(light.tint).every(a=>a>=0&&a<=.2));
 }
 assert.deepEqual(fx.light(new Date('2026-11-01T00:00:00Z')),fx.light(new Date('2026-10-31T17:00:00-07:00')));
});

test('motion2: each wash moves continuously and monotonically for ten minutes',()=>{
 for(const [time,previous,next] of [['06:00','night','morning'],['11:00','morning',null],['17:00',null,'evening'],['18:30','evening','night']]){
  const boundary=at(time),samples=Array.from({length:11},(_,m)=>fx.light(new Date(+boundary+m*60000)).tint);
  for(let i=1;i<samples.length;i++){if(previous)assert.ok(samples[i][previous]<samples[i-1][previous]);if(next)assert.ok(samples[i][next]>samples[i-1][next]);}
  if(previous)assert.equal(samples[10][previous],0);if(next)assert.ok(samples[5][next]>0&&samples[5][next]<samples[10][next]);
  const before=fx.light(new Date(+boundary-1)).tint,after=fx.light(new Date(+boundary+1)).tint;
  for(const phase of Object.keys(before))assert.ok(Math.abs(before[phase]-after[phase])<.00001);
 }
});

test('motion2: rooftop image switches at 18:30 and 06:00 with the night light',()=>{
 for(const [time,src] of [['05:59',night],['06:00',day],['09:00',day],['14:00',day],['18:00',day],['18:29',day],['18:30',night],['19:00',night],['23:59',night],['00:00',night],['01:00',night]])assert.equal(fx.background(rooftop,at(time)),src,time);
 for(const floor of scene.floors.filter(f=>f.id!=='5f'))assert.equal(fx.background(floor,at('01:00')),floor.background);
});

test('motion2: shared clock switches open 5F without reload and reuses the correct cached variant',async()=>{
 const requests=[],f=fixture('18:29',false,src=>{requests.push(src);return true});f.click('5f');await flush();assert.equal(bg(f).src,day);
 f.setTime('18:30');frame(f);assert.equal(bg(f).hidden,true,'old daytime art hidden during replacement');await flush();assert.equal(bg(f).src,night);assert.equal(f.map.dataset.art,'floor');
 f.setTime('06:00');frame(f);assert.equal(bg(f).hidden,true,'old night art hidden during replacement');await flush();assert.equal(bg(f).src,day);
 f.setTime('19:00');frame(f);await flush();assert.equal(bg(f).src,night);assert.equal(requests.filter(p=>p===night).length,1);assert.equal(requests.filter(p=>p===day).length,1);
 assert.equal(f.timers.filter(t=>t.ms===100).length,1);assert.equal(f.timers.length,2,'existing clocks only');
});

test('motion2: delayed night result cannot overwrite a new daytime request or another floor',async()=>{
 const pending=[];class DeferredImage{set src(src){pending.push({src,ok:()=>this.onload(),fail:()=>this.onerror()})}}
 const f=fixture('18:29',false,null,null,{Image:DeferredImage});f.click('5f');pending.find(p=>p.src===day).ok();await flush();assert.equal(bg(f).src,day);
 f.setTime('18:30');frame(f);const late=pending.find(p=>p.src===night);
 f.setTime('06:00');frame(f);await flush();assert.equal(bg(f).src,day);late.ok();await flush();assert.equal(bg(f).src,day);
 f.setTime('19:00');frame(f);f.click('3f');pending.find(p=>p.src.includes('floor-3f')).ok();await flush();assert.equal(bg(f).src,scene.floors.find(p=>p.id==='3f').background);
});

test('motion2: result rechecks Korea time even before the next clock tick',async()=>{
 const pending=[];class DeferredImage{set src(src){pending.push({src,ok:()=>this.onload()})}}
 const f=fixture('19:00',false,null,null,{Image:DeferredImage});f.click('5f');f.setTime('06:00');pending.find(p=>p.src===night).ok();await flush();assert.notEqual(bg(f).src,night);
 frame(f);pending.find(p=>p.src===day).ok();await flush();assert.equal(bg(f).src,day);
});

test('motion2: delayed daytime result cannot replace cached night art after the reverse boundary',async()=>{
 const pending=[];class DeferredImage{set src(src){pending.push({src,ok:()=>this.onload()})}}
 const f=fixture('05:59',false,null,null,{Image:DeferredImage});f.click('5f');pending.find(p=>p.src===night).ok();await flush();
 f.setTime('06:00');frame(f);const late=pending.find(p=>p.src===day);f.setTime('18:30');frame(f);await flush();assert.equal(bg(f).src,night);
 late.ok();await flush();assert.equal(bg(f).src,night);assert.equal(f.map.dataset.art,'floor');
});

test('motion2: failed night image falls back to day art, retaining floor identity and plates',async()=>{
 const f=fixture('19:00',false,src=>src!==night);f.click('5f');await flush();assert.equal(bg(f).src,day);assert.equal(bg(f).hidden,false);assert.equal(f.map.dataset.art,'floor');
 assert.ok(f.map.querySelectorAll('.hani-office-room-plate').filter(p=>!p.hidden).length>0);
 assert.ok(f.map.querySelectorAll('.hani-office-foreground').every(p=>p.hidden));assert.equal(f.map.dataset.mask,'none');
 f.click('4f');await flush();assert.ok(f.map.querySelectorAll('.hani-office-desk-props').some(p=>!p.hidden&&p.src));
});

test('motion2: failed night and day art retain production fallback and the rest of the floor',async()=>{
 const f=fixture('19:00',false,()=>false);f.click('5f');await flush();assert.equal(f.map.dataset.art,'fallback');assert.equal(bg(f).hidden,false);assert.equal(glow(f).hidden,true);
 assert.equal(f.map.querySelectorAll('.hani-office-room-plate').filter(p=>!p.hidden).length,0);f.click('3f');await flush();assert.equal(f.visible().length,5);
});

const owner=(id='seoyun',floor='3f')=>({id,seat:scene.seatMaps[floor].find(s=>s.owner===id),activity:'work',pose:'sitting',state:'AT_HOME'});
test('motion2: glow requires the seated, working owner at a visible monitor',()=>{
 const p=owner();assert.equal(fx.monitors('3f',[p]).length,1);
 for(const change of [{id:'other'},{activity:'rest'},{activity:'meeting'},{pose:'standing'},{pose:'walk-a'},{walking:true},{travel:true},{called:true},{state:'GOING'},{state:'RETURNING'},{deskPartner:'yuri'},{behaviorKind:'chairman-greeting'}])assert.equal(fx.monitors('3f',[{...p,...change}]).length,0,JSON.stringify(change));
 assert.equal(fx.monitors('3f',[]).length,0);assert.equal(fx.monitors('5f',[p]).length,0);assert.equal(fx.monitors('4f',[owner('mir','4f')]).length,0,'pod is not a monitor');
 const monitors=fx.monitors('3f',[p]);const bounds=scene.art.floors['3f'].homeFurniture[p.seat.anchor].deskBounds;
 assert.ok(monitors[0].x*scene.art.width/100>=bounds[0]&&monitors[0].x*scene.art.width/100<=bounds[2]);
});

test('motion2: each authored monitor belongs to an existing desk, with no glow at unowned/spare seats',()=>{
 for(const floor of scene.floors){
  const seated=scene.seatMaps[floor.id].map(seat=>({id:seat.owner==='chairman'?'seongmin':seat.owner,seat,activity:'work',pose:'sitting'}));
  for(const monitor of fx.monitors(floor.id,seated)){assert.ok(scene.art.floors[floor.id].homeFurniture[monitor.anchor]?.deskBounds);assert.ok([monitor.x,monitor.y,monitor.width,monitor.height].every(Number.isFinite));}
  assert.equal(fx.monitors(floor.id,seated.filter(p=>!p.id)).length,0);
 }
});

test('motion2: one persistent glow element follows actual actors and disappears at empty desks',async()=>{
 const f=fixture('09:00',false,()=>true);f.click('3f');await flush();const persistent=layer(f),g=glow(f),actors=f.visible();
 assert.equal(persistent.children.length,4);assert.equal(f.map.querySelectorAll('.hani-office-monitor-glow').length,1);assert.equal(g.hidden,false);
 for(const actor of actors)actor.hidden=true;frame(f);assert.equal(g.hidden,true);
 actors[0].hidden=false;actors[0].dataset.pose='sitting';frame(f);assert.equal(g.hidden,false);
 actors[0].dataset.walking='true';frame(f);assert.equal(g.hidden,true);
 f.click('5f');await flush();assert.equal(g.hidden,true);f.click('3f');await flush();assert.equal(layer(f),persistent);assert.equal(glow(f),g);
});

test('motion2: reduced motion keeps static phase tint, static glow and night art',async()=>{
 const f=fixture('07:00',true,()=>true);f.click('3f');await flush();assert.equal(washes(f).morning,'0.12000');assert.equal(washes(f).night,'0.00000');
 const first=glow(f).style.opacity;f.setTime('07:01');frame(f);assert.equal(glow(f).style.opacity,first);assert.equal(first,'0.4200');
 f.setTime('19:00');f.click('5f');await flush();assert.equal(bg(f).src,night);assert.equal(washes(f).night,'0.20000');
 f.setReduced(false);f.setTime('06:05');f.click('3f');await flush();assert.equal(washes(f).morning,'0.06000');
});

test('motion2: hidden tab and inactive view stop updates; resume samples current phase/image',async()=>{
 const f=fixture('14:00',false,()=>true);f.click('5f');await flush();f.hide();const before=washes(f),opacity=glow(f).style.opacity;
 f.setTime('19:00');for(let i=0;i<5;i++)frame(f);assert.deepEqual(washes(f),before);assert.equal(glow(f).style.opacity,opacity);assert.equal(bg(f).src,day);
 f.show();await flush();assert.equal(layer(f).dataset.phase,'night');assert.equal(bg(f).src,night);
 f.document.hidden=true;f.document.events.visibilitychange();f.setTime('09:00');frame(f);assert.equal(layer(f).dataset.phase,'night');
 f.document.hidden=false;f.document.events.visibilitychange();await flush();assert.equal(layer(f).dataset.phase,'morning');assert.equal(bg(f).src,day);
});

test('motion2: offscreen intersection pauses pulse, then refreshes tint and rooftop on resume',async()=>{
 let intersection;class Intersection{constructor(cb){intersection=cb}observe(){}}
 const f=fixture('14:00',false,()=>true,null,{IntersectionObserver:Intersection});f.click('5f');await flush();intersection([{isIntersecting:false}]);
 const previous=washes(f);f.setTime('01:00');frame(f);assert.equal(f.root.dataset.paused,'true');assert.deepEqual(washes(f),previous);
 intersection([{isIntersecting:true}]);await flush();assert.equal(f.root.dataset.paused,'false');assert.equal(washes(f).night,'0.20000');assert.equal(bg(f).src,night);
});

test('motion2: calm pulse varies only while visible and motion is allowed',()=>{
 assert.notEqual(fx.opacity(0),fx.opacity(3000));assert.equal(fx.opacity(0,true),fx.opacity(3000,true));assert.equal(fx.opacity(0,false,false),fx.opacity(3000,false,false));
 for(let ms=0;ms<=12000;ms+=100)assert.ok(fx.opacity(ms)>=.33&&fx.opacity(ms)<=.51);
});

test('motion2: catalog references one allowed, bounded WebP asset for the release owner',()=>{
 const file='data/hani-building/art-map-v1.json',text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert.equal(JSON.parse(text).floors['5f'].nightBackground,night);
 const contract=JSON.parse(fs.readFileSync(new URL('../dev-center/one-pass-gate-contract.json',import.meta.url),'utf8'));
 assert.ok(contract.allowed_paths.some(pattern=>new RegExp(pattern,'i').test(night.slice(2))));
 const bytes=fs.readFileSync(new URL('../assets/building/floor-5f-night-243.webp',import.meta.url));assert.ok(bytes.length<=250000);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.equal(bytes.subarray(12,16).toString(),'VP8 ');assert.equal(bytes.readUInt16LE(26)&0x3fff,1672);assert.equal(bytes.readUInt16LE(28)&0x3fff,941);
});

test('motion2: phase changes, pulses and floor switching never write to storage or Cloud',async()=>{
 let writes=0;const deny=()=>{writes++;throw Error('forbidden write')},store={setItem:deny,removeItem:deny,clear:deny};
 const f=fixture('09:00',false,()=>true,null,{localStorage:store,sessionStorage:store,supabase:{from:deny}});
 for(const time of ['09:00','14:00','18:00','19:00','01:00']){f.setTime(time);for(const floor of ['1f','2f','3f','4f','5f']){f.click(floor);await flush();frame(f)}}
 f.hide();f.setTime('06:00');frame(f);f.show();await flush();f.setReduced(true);frame(f);assert.equal(writes,0);
});
