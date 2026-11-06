import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadScene} from '../../scripts/hani-office-lively-fixture.mjs';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
const folder='artifacts/office-xmas-live/',read=f=>fs.readFileSync(f,'utf8');
const before=read(folder+'round2-before.js'),cssBefore=read(folder+'round2-before.css');
const js=read('hani-office-live.js'),css=read('hani-office-live.css');
assert.equal(js,before
 .replace("['xmas-snow','event-window','1f',1600,146,88,112,'center',false]","['xmas-snow','event-window','1f',1580,230,160,204,'center',false]")
 .replace("['xmas-gifts','event-floor','1f',548,450,80,60,'bottom-center',false]","['xmas-gifts','event-floor','1f',520,443,48,36,'bottom-center',false]"));
const eol=cssBefore.match(/\.hani-office-live-props\{[^}]+\}(\r?\n)/)[1];
assert.equal(css,cssBefore
 .replace('.hani-office-live-props{position:absolute;inset:0;z-index:2;pointer-events:none}',
 '.hani-office-live-props{position:absolute;inset:0;z-index:2;pointer-events:none}'+eol+
 '/* Keep the existing actor host (including every name/status label) above all'+eol+
 '   live props, even while an actor temporarily creates its own stacking context. */'+eol+
 '#haniOfficeActors{position:absolute;inset:0;z-index:4;pointer-events:none}')
 .replace('--event-end:24.309392%;--event-static:6.077348%}',
 '--event-end:24.309392%;--event-static:6.077348%;filter:brightness(0) invert(1) drop-shadow(0 0 .08cqw #fff) drop-shadow(.6cqw 1cqw 0 #fff) drop-shadow(-.7cqw 1.4cqw 0 #fff);clip-path:inset(0)}'));
const baseline=JSON.parse(read(folder+'round2-baseline.json'));
for(const row of baseline.files.filter(r=>!['hani-office-live.js','hani-office-live.css'].includes(r.file)))
 assert.equal(createHash('sha256').update(fs.readFileSync(row.file)).digest('hex').toUpperCase(),row.sha256,row.file+' preserved');
const {scene}=loadScene(),r=scene.residents;
const gifts={left:496,top:407,right:544,bottom:443};
const distance=p=>Math.hypot(Math.max(gifts.left-p[0],0,p[0]-gifts.right),Math.max(gifts.top-p[1],0,p[1]-gifts.bottom));
const stops=[];
for(const match of js.matchAll(/\['(resident_(?:cat|dog|rabbit)_[^']+)','1f',([\d.]+),([\d.]+),true\]/g)){
 const spot=r.spot(match[1]);assert.ok(spot,match[1]);
 const native=[spot.visual[0]*1672/100,spot.visual[1]*941/100],gap=distance(native);
 assert.ok(gap>70,'gift must clear pet stop: '+spot.id);
 stops.push({id:spot.id,native,gap});
}
let routeSamples=0,minRouteGap=Infinity;
for(const a of stops)for(const b of stops){
 const route=r.path(a.id,b.id);if(!route.length)continue;
 for(let i=0;i<=100;i++){
  const first=route[0].visual,last=route.at(-1).visual,t=i/100;
  const point=[(first[0]+(last[0]-first[0])*t)*1672/100,(first[1]+(last[1]-first[1])*t)*941/100];
  const gap=distance(point);assert.ok(gap>70,'gift must clear pet route');minRouteGap=Math.min(minRouteGap,gap);routeSamples++;
 }
}
const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(f),read:f=>fs.readFileSync(f)});
assert.deepEqual(closure.missing,[]);assert.ok(closure.files.length<=160);
let staffRouteSamples=0,minStaffRouteGap=Infinity,nearestStaffEdge;
for(const edge of scene.canon.edges){
 const a=scene.anchors.get(edge.from),b=scene.anchors.get(edge.to);
 if(edge.kind==='stairs'||a?.floor!=='1f'||b?.floor!=='1f')continue;
 const va=scene.visualPoint(a),vb=scene.visualPoint(b);
 for(let i=0;i<=100;i++){
  const t=i/100,gap=distance([(va[0]+(vb[0]-va[0])*t)*1672/100,(va[1]+(vb[1]-va[1])*t)*941/100]);
  assert.ok(gap>8,'gift intersects staff path: '+edge.from+' -> '+edge.to);
  if(gap<minStaffRouteGap){minStaffRouteGap=gap;nearestStaffEdge=[edge.from,edge.to]}
  staffRouteSamples++;
 }
}
const result={head:baseline.head,main:baseline.main,exactPatch:true,preservedFiles:baseline.files.length-2,atlasBytes:fs.statSync('assets/office-season/xmas.webp').size,stops,routeSamples,minRouteGap,staffRouteSamples,minStaffRouteGap,nearestStaffEdge,closure:{files:closure.files.length,missing:closure.missing},notes:'Gaps measure native floor coordinates; actual rendered sprite/label clearance is checked separately in Chrome. Entire scheduler, pet walks, storage/Cloud, version and existing assertions are byte-preserved.'};
fs.writeFileSync(folder+'round2-source-check.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,stops:stops.length}));
