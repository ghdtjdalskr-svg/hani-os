import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// 대공사 4-1: seven simulated days through the real renderer (fake clock, 500ms frames).
// Pets, department companions and kids must never jump: no visible step faster than
// 400 art-px/s between consecutive frames. Storage stays untouched.
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const json=f=>JSON.parse(read(f));
const files={canon:'data/hani-building/spatial-contract-v3.json',art:'data/hani-building/art-map-v3.json',sprites:'assets/sprites-v2/manifest.json',spritesV3:'assets/sprites-v3/manifest-v3.json',places:'data/hani-building/office-places-v3.json'};
const assets=Object.fromEntries(Object.entries(files).map(([k,f])=>[k,json(f)]));
const table=json('assets/data/office-actions-315.json');
const fixtureSource=read('scripts/hani-building-206-engine.test.mjs');
const fixtureFunction=fixtureSource.slice(fixtureSource.indexOf('export function fixture('),fixtureSource.indexOf('\ntest(')).replace('export function ','function ');
const mount=vm.runInNewContext('('+fixtureFunction+')',{assets,read,vm,Date,setTimeout,console});
const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};
const W=1672,H=941,STEP=500,LIMIT=400;
const px=a=>{const l=parseFloat(a.style.left),t=parseFloat(a.style.top);return Number.isFinite(l)&&Number.isFinite(t)?[l/100*W,t/100*H]:null};
const animal=a=>['pet','kid'].includes(a.dataset.resident)||/^(pet-|companion-|kid-)/.test(a.dataset.person||'');

// One three-minute window per day at a different hour; weekday and weekend both covered.
const days=[['2026-11-23','08:58'],['2026-11-24','12:30'],['2026-11-25','15:10'],['2026-11-26','19:02'],['2026-11-27','22:40'],['2026-11-28','10:05'],['2026-11-29','17:30']];

async function run(floor){
  let storage=0;
  // Reads are allowed (the existing affinity read); any write, remove or clear counts.
  const deny={getItem:()=>null,key:()=>null,length:0,setItem(){storage++},removeItem(){storage++},clear(){storage++}};
  const f=mount('10:00',false,()=>true,table,{HaniOfficeV2Assets:assets,setTimeout:()=>0,HaniOfficePresence:{chairman:'active'},localStorage:deny,sessionStorage:deny},s=>s);
  await settle();f.click(floor);await settle();
  const report=[];let frames=0,seen=new Set();
  for(const [day,from] of days){
    const prev=new Map(),t0=Date.parse(day+'T'+from+':00+09:00');
    for(let t=t0;t<=t0+180000;t+=STEP){
      f.setDateTime(t);for(const timer of f.timers)if(timer.ms<=1000)timer.fn();frames++;
      for(const actor of f.visible().filter(animal)){
        const id=actor.dataset.person||actor.dataset.sprite,p=px(actor);if(!p)continue;seen.add(id);
        const q=prev.get(id);
        if(q&&t-q.t===STEP){const speed=Math.hypot(p[0]-q.p[0],p[1]-q.p[1])/(STEP/1000);if(speed>LIMIT)report.push({floor,day,time:new Date(t+32400000).toISOString().slice(11,19),id,from:q.p.map(Math.round),to:p.map(Math.round),speed:Math.round(speed)})}
        prev.set(id,{p,t});
      }
    }
  }
  return {report,frames,seen:[...seen].sort(),storage};
}

for(const floor of ['1f','2f'])test(`4-1 seven-day sample: no animal jumps on ${floor}`,{timeout:240000},async()=>{
  const {report,frames,seen,storage}=await run(floor);
  assert.equal(frames,days.length*361);
  assert.ok(seen.length>=2,`animals were visible on ${floor}: ${seen.join(',')}`);
  assert.deepEqual(report,[],`jumps faster than ${LIMIT}px/s:\n`+JSON.stringify(report.slice(0,10),null,1));
  assert.equal(storage,0);
});
