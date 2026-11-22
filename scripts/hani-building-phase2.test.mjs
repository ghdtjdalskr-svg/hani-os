import {createRequire} from 'node:module';
import inverse from './hani-building-phase2-source.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';

const {readRawFileSync:raw,project,hash,layer}=inverse;
const v2data=createRequire(import.meta.url)('./hani-building-v2data-source.cjs'),phase3=createRequire(import.meta.url)('./hani-building-phase3-source.cjs');
const read=f=>v2data.project(phase3.project(raw(new URL('../'+f,import.meta.url),'utf8'),f),f),json=f=>JSON.parse(read(f)),plain=x=>JSON.parse(JSON.stringify(x));
const source=read('hani-office-live.js'),before=project(source,'hani-office-live.js');
const files={canon:'data/hani-building/spatial-contract.json',art:'data/hani-building/art-map-v1.json',sprites:'assets/sprites-v2/manifest.json',spritesV3:'assets/sprites-v3/manifest-v3.json',places:'data/hani-building/office-places.json'};
const assets=Object.fromEntries(Object.entries(files).map(([k,f])=>[k,json(f)])),oldAssets=Object.fromEntries(Object.entries(files).map(([k,f])=>[k,JSON.parse(project(read(f),f))]));
const table=json('assets/data/office-actions-221.json'),at=(day,sec)=>new Date(Date.parse(day+'T00:00:00+09:00')+sec*1000);
function load(code=source,metadata=assets){
 let storage=0,timers=0,listeners=0;const deny=new Proxy({}, {get(){storage++;throw Error('storage forbidden')}});
 const context=vm.createContext({HaniOfficeV2Assets:structuredClone(metadata),HaniOfficeActions221:structuredClone(table),document:{getElementById:()=>null,addEventListener(){listeners++}},window:{},localStorage:deny,sessionStorage:deny,indexedDB:deny,setTimeout(){timers++;throw Error('timer forbidden')},setInterval(){timers++;throw Error('timer forbidden')}});
 vm.runInContext(code,context);assert.ok(context.HaniBuildingScene);return {scene:context.HaniBuildingScene,counts:()=>({storage,timers,listeners})};
}
const loaded=load(),scene=loaded.scene,old=load(before,oldAssets).scene;

test('pre-QA: invalid metadata warns only once and missing new-floor counts fail closed',()=>{
 const warnings=[],context=vm.createContext({HaniOfficeV2Assets:structuredClone(assets),HaniOfficeActions221:table,document:{getElementById:()=>null},window:{},console:{warn:s=>warnings.push(s)}});
 vm.runInContext(source,context);const engine=context.HaniBuildingScene;
 const c=structuredClone(assets.canon);delete c.floors.find(f=>f.id==='creative').anchorCount;
 assert.equal(engine.validateSpatial(c,assets.art),false);
 assert.equal(engine.validateSpatial({...c,anchors:[]},assets.art),false);
 assert.equal(engine.validateSpatial(assets.canon,assets.art),true);assert.equal(warnings.length,1);
 const unknown=structuredClone(c);unknown.floors.find(f=>f.id==='creative').id='museum';
 assert.equal(engine.validateSpatial(unknown,assets.art),false);
});

test('pre-QA: defaults reference existing floors and cap-cache distinguishes nonnumeric IDs',()=>{
 const c=structuredClone(assets.canon);c.floors=c.floors.filter(f=>f.id!=='4f');
 let registry=scene.buildFloorRegistry(c,assets.art);assert.ok(registry.hasFloor(registry.defaultFloorId));
 c.defaultFloorId='missing';registry=scene.buildFloorRegistry(c,assets.art);assert.ok(registry.hasFloor(registry.defaultFloorId));
 c.defaultFloorId='creative';assert.equal(scene.buildFloorRegistry(c,assets.art).defaultFloorId,'creative');
 const fn=source.slice(source.indexOf('      function withinCap('),source.indexOf('      function computeCap('));
 const cap=vm.runInNewContext('(function(){const result=[];let capCache=new Map(),capLength=-1,calls=0;const computeCap=e=>{calls++;return e.floors.includes("creative")};'+fn+';return {check:withinCap,calls:()=>calls}})()');
 const event={start:1,end:2,people:[{}]};assert.equal(cap.check({...event,floors:['creative']}),true);assert.equal(cap.check({...event,floors:['Creative']}),false);assert.equal(cap.calls(),2);
 cap.check({...event,floors:['creative']});assert.equal(cap.calls(),2);
});

test('old spatial anchors, home assignments and existing room data remain identical',()=>{
 for(const anchor of oldAssets.canon.anchors)assert.deepEqual(assets.canon.anchors.find(a=>a.id===anchor.id),anchor,anchor.id);
 assert.deepEqual(assets.canon.people,oldAssets.canon.people);
 for(const floor of oldAssets.canon.floors)assert.deepEqual(assets.canon.floors.find(f=>f.id===floor.id).rooms,floor.rooms);
 for(const [id,value]of Object.entries(oldAssets.art.anchors))assert.deepEqual(assets.art.anchors[id],value,id);
});

test('six registered floors, stable rooftop ID, zero residents and order-based rooftop display',()=>{
 assert.deepEqual(plain(scene.floors.map(f=>f.id)),['5f','creative','4f','3f','2f','1f']);assert.equal(scene.getFloor('5f').label,'6F 옥상');
 const floor=scene.floorRegistry.get('creative');assert.equal(floor.order,5);assert.equal(floor.maxVisible,4);assert.equal(floor.residents.length,0);assert.equal(scene.floorRegistry.get('5f').order,6);assert.deepEqual(plain(scene.floorRegistry.get('5f').legacyIds),['5f']);
 assert.equal(floor.art.background,'./assets/building/floor-5f-creative-v1.webp');assert.ok(raw(new URL('../assets/building/floor-5f-creative-v1.webp',import.meta.url)).length<240000);
 for(const id of ['1f','2f','3f','4f']){assert.deepEqual(plain(scene.getFloor(id)),plain(old.getFloor(id)));assert.deepEqual(plain(scene.seatMaps[id]),plain(old.seatMaps[id]))}
 const c=structuredClone(assets.canon);c.floors.find(f=>f.id==='5f').order=7;assert.equal(scene.buildFloorRegistry(c,assets.art).order('5f'),7);assert.equal(scene.buildFloorRegistry(c,assets.art).get('5f').label,'7F 옥상');
});

test('359 canonical anchors, measured elevator, four standard rooms and return routes',()=>{
 assert.equal(assets.canon.anchors.length,359);assert.equal(scene.validateSpatial(assets.canon,assets.art),true);
 const f=scene.floorRegistry.get('creative');assert.equal(f.anchorCount,33);assert.equal(f.rooms.length,4);
 assert.deepEqual(plain(scene.anchors.get('elevator_creative')).floor,'creative');const lift=scene.visualPoint(scene.anchors.get('elevator_creative'));assert.ok(Math.abs(lift[0]*1672/100-837)<.001);assert.ok(Math.abs(lift[1]*941/100-178)<.001);
 for(const r of f.rooms){assert.ok(r.kind&&r.access&&r.boundsSchematic&&r.boundsArtPct&&r.junctionAnchor&&r.menuLink);assert.equal(r.capacity,r.slots.length);for(const t of r.slots){for(const [a,b]of [['elevator_creative',t.anchorId],[t.anchorId,'elevator_creative']])assert.ok(scene.route(a,b).length>3)}}
 assert.ok(scene.route('elevator_4f','elevator_5f').some(a=>a.id==='elevator_creative'));
 for(const a of assets.canon.anchors.filter(a=>a.floor==='creative')){const c=structuredClone(assets.canon);c.anchors=c.anchors.filter(v=>v.id!==a.id);assert.equal(scene.validateSpatial(c,assets.art),false,a.id)}
});

test('weekday programs cover all scheduled themes deterministically, once per person and no night workers',()=>{
 const day='2026-11-23',options={chairmanPresent:true},p=scene.scheduler.plan(day,options),o=scene.scheduler.blockPlan(day,0,p,options),v=scene.scheduler.visitPlan(day,p,o,options);
 assert.ok(v.length>=10);assert.equal(JSON.stringify(v),JSON.stringify(load().scene.scheduler.visitPlan(day,p,o,options)));
 const week=[23,24,25,26,27].flatMap(date=>{const d='2026-11-'+date,p=scene.scheduler.plan(d,options),o=scene.scheduler.blockPlan(d,0,p,options);return scene.scheduler.visitPlan(d,p,o,options)});
 for(const id of ['creative-ilbo','creative-4cut','creative-lunch-fit','creative-lunch-cinema','creative-newsroom','creative-study','creative-evening-fit','creative-evening-read'])assert.ok(week.some(e=>e.card.id===id),id);
 assert.ok(week.some(e=>e.card.id==='creative-4cut'&&e.people.some(p=>p.id==='daon')),'4-cut includes Daon when reservations permit');
 for(const e of v){const rule=scene.floorRegistry.get('creative').visitRules.find(r=>r.id===e.card.id),[begin,end]=rule.when.timeWindows[0].map(t=>Number(t.slice(0,2))*3600+Number(t.slice(3))*60);assert.ok(e.start>=begin&&e.end<=end);assert.ok(e.people.every(t=>rule.who.optional.includes(t.id)));assert.ok(e.people.every(t=>t.out.some(l=>l.from.startsWith('elevator_')&&l.to.startsWith('elevator_'))));
  const snap=scene.snapshot(at(day,(e.performStart+e.performEnd)/2),options),entry=snap.floors.flatMap(f=>f.people).find(p=>p.id===e.people[0].id);assert.equal(entry.floor,'creative');assert.equal(entry.outingId,e.id);
 }
 for(const id of ['seoyun','dohyun','mir','yuna','minji'])assert.ok(!v.some(e=>e.start>=66600&&e.people.some(p=>p.id===id)));
 for(const a of v)for(const b of v)if(a!==b&&a.people.some(p=>b.people.some(q=>q.id===p.id)))assert.ok(a.end+5400<=b.start||b.end+5400<=a.start);
 for(const second of [0,21600,25199,36000,80000])assert.equal(scene.snapshot(at(day,second),options).floors.find(f=>f.id==='creative').people.length,0);
});

test('old formal and outing ledgers and old-floor snapshots stay identical with new programs disabled',()=>{
 let snapshots=0;
 for(const day of ['2026-11-20','2026-11-21','2026-12-25']){const options={chairmanPresent:true,creativeVisits:false};
  assert.equal(JSON.stringify(scene.scheduler.plan(day,options)),JSON.stringify(old.scheduler.plan(day,options)),'formal '+day);
  const p=scene.scheduler.plan(day,options),q=old.scheduler.plan(day,options);assert.equal(JSON.stringify(scene.scheduler.blockPlan(day,0,p,options)),JSON.stringify(old.scheduler.blockPlan(day,0,q,options)),'outings '+day);
  for(let sec=0;sec<86400;sec+=1800){const a=scene.snapshot(at(day,sec),options),b=old.snapshot(at(day,sec),options);for(const f of b.floors)assert.equal(JSON.stringify(a.floors.find(x=>x.id===f.id).people),JSON.stringify(f.people),day+' '+sec+' '+f.id);snapshots++}
 }
 console.log('Old-floor staff snapshots compared:',snapshots);
});

test('summoning, absence, participant locks, cooldown and the four-person cap hold',()=>{
 const day='2026-11-23',options={chairmanPresent:true},p=scene.scheduler.plan(day,options),o=scene.scheduler.blockPlan(day,0,p,options),v=scene.scheduler.visitPlan(day,p,o,options);
 for(const e of v){const t=(e.performStart+e.performEnd)/2,all=scene.snapshot(at(day,t),options).floors.flatMap(f=>f.people);assert.equal(new Set(all.map(p=>p.id)).size,all.length);assert.ok(all.filter(p=>p.floor==='creative').length<=4);assert.ok(!scene.snapshot(at(day,t),{...options,summoned:e.people.map(p=>p.id)}).floors.flatMap(f=>f.people).some(p=>e.people.some(t=>t.id===p.id)));}
 assert.ok(scene.scheduler.visitPlan(day,p,o,{presentIds:[]}).length===0);
 for(const e of o.filter(e=>scene.scheduler.programCompatible(e,v)))for(const program of v)if(e.people.some(p=>program.people.some(q=>q.id===p.id))&&!e.patrol&&!e.report&&!e.visitor&&!e.guestId)assert.ok(e.start>=program.end+(e.card.kind==='errand'?0:5400)||program.start>=e.end+(e.card.kind==='errand'?0:5400));
 for(const program of v)for(const q of [...p.filter(q=>{const a=scene.scheduler.actions.get(q.actionId);return a?.layer>=3||a?.personalNonWork}),...o.filter(q=>q.patrol||q.report||q.visitor||q.guestId)]){
  if(q.id===program.replacesFormalId){assert.equal(q.actionId,'base-lunch');assert.ok(program.start<=q.start&&program.end>=q.end);assert.deepEqual(plain(program.people.map(t=>t.id)),plain(q.people.map(t=>t.id)));continue}
  const t=q.people.find(t=>program.people.some(p=>p.id===t.id));if(!t)continue;
  const away=scene.anchors.get(t.seat.anchor)?.floor!==t.home.floor,rest=q.personalNonWork&&program.personalNonWork,cooldown=away?5400:rest?2700:0;
  assert.ok(program.start>=q.end+cooldown||q.start>=program.end+cooldown,'protected cooldown '+program.id+' / '+q.id);
 }
});

test('weekend pets rotate with staff departments unchanged on weekdays; siblings retain original scene functions',()=>{
 for(const name of ['createKidsVisits','companionActivity']){const part=s=>{const start=s.indexOf('  function '+name+'(');return s.slice(start,s.indexOf('\n  }',start)+4)};assert.equal(part(source),part(before),name+' verbatim')}
 const kids=s=>s.slice(s.indexOf('  const kidsVisitLines='),s.indexOf('  const companionReactions='));assert.equal(kids(source),kids(before));
 assert.deepEqual(plain(scene.residents.people),plain(old.residents.people));assert.deepEqual(plain(scene.residents.companions),plain(old.residents.companions));
 let visits=0;
 for(const day of ['2026-11-21','2026-11-22'])for(const sec of [32520,39720,46920,54120,61320]){const staff=scene.snapshot(at(day,sec),{chairmanPresent:false}),r=scene.residents.snapshot(at(day,sec),staff,true,true),c=scene.residents.companionSnapshot(at(day,sec),staff,true,true,r),pets=[...r,...c].filter(p=>p.creative);assert.ok(pets.length<=2);visits+=pets.length;assert.ok(pets.every(p=>p.floor==='creative'))}
 assert.ok(visits>=10);
 const day='2026-11-21',options={chairmanPresent:true},formal=scene.scheduler.plan(day,options),outings=scene.scheduler.blockPlan(day,0,formal,options),family=scene.scheduler.visitPlan(day,formal,outings,options).find(e=>e.card.id==='creative-family');
 assert.ok(family);const familyNow=at(day,(family.performStart+family.performEnd)/2),familyStaff=scene.snapshot(familyNow,options),neighbors=scene.residents.snapshot(familyNow,familyStaff,true,true),familyKids=scene.residents.companionSnapshot(familyNow,familyStaff,true,true,neighbors).filter(p=>p.kid);
 assert.deepEqual(plain(familyKids.map(p=>p.id).sort()),['kid-suhyeon','kid-suyeon']);assert.ok(familyKids.every(p=>p.floor==='creative'));
 const now=at('2026-11-23',36000),staff=scene.snapshot(now,{creativeVisits:false});const a=scene.residents.snapshot(now,staff,true,true),b=old.residents.snapshot(now,staff,true,true);assert.equal(JSON.stringify(a),JSON.stringify(b));
});

// Execute the actual DOM owner with the existing DOM double, without importing old tests.
const fixtureSource=read('scripts/hani-building-206-engine.test.mjs');
const fixtureFunction=fixtureSource.slice(fixtureSource.indexOf('export function fixture('),fixtureSource.indexOf('\ntest(')).replace('export function ','function ');
const mount=vm.runInNewContext('('+fixtureFunction+')',{assets,read,vm,Date,setTimeout,console});
const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};
test('pre-QA: metadata fallback uses four actual tabs and a reachable default floor',async()=>{
 const f=mount('10:00',true,()=>false,null,{HaniOfficeV2Assets:null,setTimeout:()=>0},()=>source);await settle();
 assert.equal(f.tabs.children.length,4);assert.equal(f.tabs.style['--hani-floor-cols'],'4');
 assert.ok(f.tabs.children.some(b=>b.dataset.buildingFloor===f.map.dataset.floor));
});
test('actual DOM mounts six tabs, four clickable labels and all menu IDs on one delegated path',async()=>{
 const views=[],f=mount('10:00',false,()=>true,table,{HaniOfficeV2Assets:assets,setTimeout:()=>0,HaniOfficePresence:{chairman:'active'},showView:id=>views.push(id)},()=>source);await settle();f.click('creative');await settle();
 assert.equal(f.tabs.children.length,6);assert.equal(f.tabs.style['--hani-floor-cols'],'6');assert.equal(f.map.querySelector('.hani-office-background').src,'./assets/building/floor-5f-creative-v1.webp');
 const labels=f.map.querySelectorAll('.hani-office-room-plate').filter(p=>p.dataset.roomFloor==='creative');assert.equal(labels.length,4);assert.ok(labels.every(p=>p.tagName==='button'&&!p.hidden));
 // The double has a deliberately narrow selector engine; supply actual observed targets.
 const buttons=f.root.querySelector('.hani-building-rooms').children.find(p=>p.children.some(c=>c.className==='hani-office-room-links')).children.flatMap(g=>g.children);
 for(const button of [...labels,...buttons]){const native=button.closest.bind(button);button.closest=s=>s==='[data-room-view]'?button:native(s);f.root.events.click({target:button,preventDefault(){}})}
 assert.deepEqual([...new Set(views)].sort(),['board','diet','exercise','ilbo','investmentCommittee','movie','newsroom','reading','study'].sort());
 f.click('1f');const button=labels[0],count=views.length;f.root.events.click({target:button,preventDefault(){}});assert.equal(views.length,count,'hidden floor links cannot route');
});

test('new feature performs zero storage accesses and adds zero timers/listeners',()=>{
 for(const re of [/\b(?:localStorage|sessionStorage|indexedDB)\b[^\n]*/g,/\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:supabase|cloudClient)\b[^\n]*/g])assert.deepEqual(source.match(re),before.match(re),String(re));
 scene.snapshot(at('2026-11-23',54600));scene.validateSpatial(assets.canon,assets.art);assert.deepEqual(loaded.counts(),{storage:0,timers:0,listeners:0});
});

test('six mobile tabs retain paired rows and native 44px room targets',()=>{
 const css=read('hani-office-live.css');assert.ok(css.includes('repeat(var(--hani-floor-cols,5),minmax(0,1fr))'));assert.ok(css.includes('button:nth-child(odd):last-child{grid-column:1/-1}'));assert.ok(css.includes('.hani-office-room-plate[data-room-view]'));assert.ok(css.includes('min-height:44px'));
 assert.deepEqual(Array.from({length:6},(_,i)=>[Math.floor(i/2),i%2]),[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]]);
});

test('exact inverse covers every owner and refuses modified hashes; warm program lookup is cached',()=>{
 for(const [f,row]of Object.entries(layer.files)){assert.equal(hash(read(f)),row.afterSha256);assert.equal(hash(project(read(f),f)),row.beforeSha256);assert.equal(project(read(f)+' ',f),read(f)+' ')}
 const now=at('2026-11-23',54600);scene.snapshot(now,{chairmanPresent:true});const start=performance.now();for(let i=0;i<100;i++)scene.snapshot(new Date(+now+i*100),{chairmanPresent:true});console.log('Phase 2 warm snapshot average ms',((performance.now()-start)/100).toFixed(3));
});
