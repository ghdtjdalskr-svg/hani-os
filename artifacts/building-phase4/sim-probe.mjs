// Scratch probe (not committed): measure overlap/teleport on the real renderer by stepping the fake clock.
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const json=f=>JSON.parse(read(f));
const files={canon:'data/hani-building/spatial-contract-v3.json',art:'data/hani-building/art-map-v3.json',sprites:'assets/sprites-v2/manifest.json',spritesV3:'assets/sprites-v3/manifest-v3.json',places:'data/hani-building/office-places-v3.json'};
const assets=Object.fromEntries(Object.entries(files).map(([k,f])=>[k,json(f)]));
const table=json('assets/data/office-actions-315.json');
const src=read('scripts/hani-building-206-engine.test.mjs');
const fx=src.slice(src.indexOf('export function fixture('),src.indexOf('\ntest(')).replace('export function ','function ');
const mount=vm.runInNewContext('('+fx+')',{assets,read,vm,Date,setTimeout,console});
const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};
const [floor='4f',day='2026-11-24',from='08:00',to='20:00',stepMs='500']=process.argv.slice(2);
const f=mount('10:00',false,()=>true,table,{HaniOfficeV2Assets:assets,setTimeout:()=>0,HaniOfficePresence:{chairman:'active'}},s=>s);
await settle();f.click(floor);await settle();
const tick=f.timers.find(t=>t.ms<=100)||f.timers[0];
const t0=Date.parse(day+'T'+from+':00+09:00'),t1=Date.parse(day+'T'+to+':00+09:00'),step=+stepMs;
const W=1672,H=941,prev=new Map();let n=0,overlapPairs=new Map(),jumps=new Map(),worstJump=0,started=performance.now(),bubbles=new Map();
const px=a=>{const l=parseFloat(a.style.left),t=parseFloat(a.style.top);return Number.isFinite(l)&&Number.isFinite(t)?[l/100*W,t/100*H]:null};
for(let t=t0;t<=t1;t+=step){
  f.setDateTime(t);for(const tm of f.timers)if(tm.ms<=1000)tm.fn();
  const vis=f.visible().map(a=>({id:a.dataset.person||a.dataset.sprite||'?',p:px(a),walking:a.dataset.walking==='true'||/walk/.test(a.dataset.pose||''),a})).filter(x=>x.p);
  for(let i=0;i<vis.length;i++)for(let j=i+1;j<vis.length;j++){const d=Math.hypot(vis[i].p[0]-vis[j].p[0],vis[i].p[1]-vis[j].p[1]);if(d<30){const k=[vis[i].id,vis[j].id].sort().join('+');overlapPairs.set(k,(overlapPairs.get(k)||0)+1)}}
  for(const v of vis){const q=prev.get(v.id);if(q&&t-q.t===step){const d=Math.hypot(v.p[0]-q.p[0],v.p[1]-q.p[1]),sp=d/(step/1000);if(sp>400){jumps.set(v.id,(jumps.get(v.id)||0)+1);worstJump=Math.max(worstJump,d)}}prev.set(v.id,{p:v.p,t})}
  for(const v of vis){const b=v.a.children?.find?.(c=>/bubble/.test(c.className||''));const txt=b&&!b.hidden&&b.textContent;if(txt){const k=v.id+'|'+txt;bubbles.set(k,(bubbles.get(k)||0)+1)}}
  n++;
}
const ms=performance.now()-started;
console.log(JSON.stringify({floor,day,from,to,samples:n,msPerTick:+(ms/n).toFixed(2),overlapSamples:[...overlapPairs].sort((a,b)=>b[1]-a[1]).slice(0,12),jumps:[...jumps].sort((a,b)=>b[1]-a[1]).slice(0,12),worstJumpPx:Math.round(worstJump),distinctBubbleLines:bubbles.size},null,1));
