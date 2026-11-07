import {restoreCompanions276Source} from './hani-office-companions-276-source.mjs';
import {stripApprovedAffinityStorage} from './hani-office-affinity-storage.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {spriteBox,boxesOverlap} from './hani-office-obr21-geometry.mjs';
import {tlayoutDelta,restoreTlayoutSource,readTlayoutPlans} from './hani-office-tlayout-fixture.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
const {scene}=loadScene(),art=scene.art,canon=scene.canon;
const intersect=(a,b,r)=>{let lo=0,hi=1;for(let axis=0;axis<2;axis++){const d=b[axis]-a[axis];if(!d){if(a[axis]<r[axis]||a[axis]>r[axis+2])return false;continue}let u=(r[axis]-a[axis])/d,v=(r[axis+2]-a[axis])/d;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>hi)return false}return true};
test('G image is the exact approved WebP; old background and other staff seats remain',()=>{
 const f=art.floors['3f'];assert.equal(f.background,'./assets/building/floor-3f-218.webp');const b=fs.readFileSync(f.background);assert.equal(hash(b),f.backgroundSha256);assert.equal(hash(b),'3529aea428e077dfd3e1c8fa929a471b125d8ef71b87ed47511878f475a1d56c');assert.equal(b.length,256468);assert.equal(hash(fs.readFileSync('assets/building/floor-3f-215.webp')),'0dca7fdfa3aa8793591f652c5f8c1f48cbfb642a1b4160ca8594a030efaddd93');
 for(const[id,x,y]of [['dev-build',24.5,61.5],['dev-research',37.5,61.5],['dev-design',24,83.5]])assert.deepEqual([art.anchors[id].x,art.anchors[id].y],[x,y]);
 assert.deepEqual([art.anchors['dev-lead'].x,art.anchors['dev-lead'].y,art.anchors['dev-lead'].facing],[9.1,68.5,'right']);assert.deepEqual([art.anchors['dev-qa'].x,art.anchors['dev-qa'].y],[37.7,84.5]);assert.equal(scene.seatMaps['3f'].some(s=>s.id==='dev-spare'),false);assert.equal(scene.anchors.get('dev-spare').type,'junction');
 for(const s of scene.seatMaps['3f'].filter(s=>s.owner)){const r=f.homeFurniture[s.anchor].seatBounds;assert.ok(s.x*16.72>=r[0]&&s.x*16.72<=r[2]&&s.y*9.41>=r[1]&&s.y*9.41<=r[3],s.id+' shoe pivot in real chair');}
});
test('every effective 3F edge avoids the 32px gap; lead walk goes around north and left',()=>{
 const pixels=a=>scene.visualPoint(a).map((n,i)=>n*(i?9.41:16.72)),gap=[264,390,297,724];
 for(const e of canon.edges){const a=scene.anchors.get(e.from),b=scene.anchors.get(e.to);if(a.floor==='3f'&&b.floor==='3f')assert.equal(intersect(pixels(a),pixels(b),gap),false,e.from+' -> '+e.to+' must not enter 32px gap');}
 const route=scene.route('junction_platform','dev-lead');assert.deepEqual(plain(route.map(a=>a.id)),['junction_platform','path_dev-lounge-a_71','dev-spare','approach_desk_seoyun','side_desk_seoyun','dev-lead']);
 for(let i=1;i<route.length;i++)assert.equal(intersect(pixels(route[i-1]),pixels(route[i]),[156,423,264,798]),false,'lead route avoids desk/partition');
 const arin=scene.route('dev-design','junction_platform');for(let i=1;i<arin.length;i++)assert.equal(intersect(pixels(arin[i-1]),pixels(arin[i]),[529,820,766,926]),false,'Arin passes below/right of front cabinet');
 for(const id of ['seoyun','yuri'])for(const target of ['elevator_3f','window_3f_1','server-console','dev-lounge-a'])assert.ok(scene.route(scene.homeSeat(id).anchor,target).length>1,id+' reachable '+target);
});
test('360/390/416 phone boxes have zero overlap involving either new seat',()=>{
 const rows=[];for(const width of [360,390,416]){const mapWidth=width-48,people=scene.seatMaps['3f'].filter(s=>s.owner).map(s=>({id:s.owner,seat:s})),pairs=people.flatMap((a,i)=>people.slice(i+1).filter(b=>boxesOverlap(spriteBox(a,mapWidth),spriteBox(b,mapWidth))).map(b=>[a.id,b.id]));assert.deepEqual(plain(pairs.filter(p=>p.some(id=>['seoyun','yuri'].includes(id)))),[]);rows.push({viewport:width,mapWidth,pairs});}
 fs.mkdirSync('artifacts/office-tlayout-apply',{recursive:true});fs.writeFileSync('artifacts/office-tlayout-apply/phone-boxes.json',JSON.stringify(rows,null,2));
});
test('real DOM owner seats all five at 10:00/12:00, carries lead facing and retains existing mask slot',async()=>{
 for(const time of ['10:00','12:00']){let writes=0;const deny=()=>{writes++;throw Error('forbidden write')},f=fixture(time,true,()=>true,null,{localStorage:{setItem:deny,removeItem:deny,clear:deny},fetch:async()=>({ok:false})});for(let i=0;i<30;i++)await Promise.resolve();f.setDateTime('2026-11-03T'+time+':00+09:00');f.click('3f');await new Promise(r=>setTimeout(r,0));assert.equal(f.map.dataset.art,'floor');assert.equal(f.visible().length,5);for(const a of f.visible()){const home=scene.homeSeat(a.dataset.person);assert.equal(a.dataset.seat,home.id);assert.equal(a.dataset.pose,'sitting');assert.equal(a.style.left,home.x+'%');assert.equal(a.style.top,home.y+'%');}assert.equal(f.visible().find(a=>a.dataset.person==='seoyun').dataset.facing,'right');assert.equal(f.map.querySelectorAll('.hani-office-foreground').length,3);assert.equal(f.map.querySelectorAll('.hani-office-foreground')[0].src,'./assets/building/floor-3f-218.webp');assert.equal(writes,0);}
});
test('only the five pinned source fragments change; protected home and label owners are byte identical',()=>{
 const source=fs.readFileSync('hani-office-live.js','utf8'),restored=restoreTlayoutSource(source);assert.equal(hash(restored),tlayoutDelta.source.beforeSha256);
 for(const p of [{"a":"    function screenHomeClear(","b":"    function stationaryStops(","sha256":"3ca18b4e6f2b302d445b29d3d47c17a5743129ebcfe892deb1f4124cae10bc0a"},{"a":"  function placeStatusLabels(","b":"  const scheduler=","sha256":"5070f7e62556b89410bc7588600fefe80ba99579e945ae49bab89def98bec6f0"}]){const a=source.indexOf(p.a),b=source.indexOf(p.b,a);assert.ok(a>0&&b>a);assert.equal(hash(source.slice(a,b)),p.sha256,p.a+' exact bytes');}
 assert.doesNotMatch(stripApprovedAffinityStorage(source),/localStorage|sessionStorage|supabase/);assert.equal((source.match(/fetch\(/g)||[]).length,(restored.match(/fetch\(/g)||[]).length);
 assert.throws(()=>restoreTlayoutSource(source.replace('function visualPoint','function changedVisualPoint')));
});
test('16 separately authored complete plan/outings/reverse-snapshot outputs have no exclusions',()=>{
 const frozen=readTlayoutPlans();assert.equal(frozen.records.length,16);for(const[file,pin]of Object.entries(frozen.inputs))assert.equal(hash(['hani-office-live.js','hani-office-live.css'].includes(file)?restoreCompanions276Source(fs.readFileSync(file,'utf8'),file):fs.readFileSync(file)),pin,file+' exact input');
 for(const r of frozen.records){const s=loadScene().scene.scheduler,f=s.plan(r.day,r.options),o=s.blockPlan(r.day,0,f,r.options);assert.equal(JSON.stringify(f),JSON.stringify(r.formal));assert.equal(hash(JSON.stringify(f)),r.formalSha256);assert.equal(hash(JSON.stringify(o)),r.outingsSha256);for(const row of r.snapshots.toReversed())assert.equal(hash(JSON.stringify(s.snapshot(at(r.day,row.seconds),r.options))),row.sha256,r.label+' '+row.seconds);}
});

test('G keeps all five 3F resident stops, complete body routes and weekly resident separation',()=>{
 const r=scene.residents,expected=['resident_cleaner_3f','resident_temp_a_3f','resident_temp_b_3f','resident_rabbit_quiet_a','resident_rabbit_quiet_b'];
 const ids=[...new Set(r.people.flatMap(p=>p.places['3f']||[]))];assert.deepEqual(plain(ids).sort(),expected.slice().sort());
 for(const person of r.people)for(const id of person.places['3f']||[]){const a=r.spot(id);assert.ok(a,id+' retained and safe');assert.equal(a.floor,'3f');const px=[a.visual[0]*16.72,a.visual[1]*9.41],half=person.pet?46:56,height=person.pet?88:164;const boxes=[...r.furniture['3f'],...Object.values(scene.art.floors['3f'].homeFurniture).flatMap(f=>[f.seatBounds,f.deskBounds])];for(const box of boxes)assert.equal(intersect(px,px,[box[0]-half-8,box[1]-8,box[2]+half+8,box[3]+height+8]),false,id+' visible body');for(const to of person.places['3f'])assert.ok(r.path(id,to).length,id+' -> '+to);}
 for(let day=1;day<=7;day++)for(let sec=0;sec<86400;sec+=900)for(const offset of [.1,.5,2,5,120]){const states=r.snapshot(at('2026-11-'+String(day).padStart(2,'0'),sec+offset));for(const p of states)assert.ok(r.safe(p.floor,p.point,p.position,p.pet));for(let i=0;i<states.length;i++)for(const p of states.slice(i+1))if(p.floor===states[i].floor)assert.ok(Math.hypot((p.position[0]-states[i].position[0])*16.72,(p.position[1]-states[i].position[1])*9.41)>=96);}
});
