import inverse from './hani-building-phase1-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';

const {readRawFileSync:raw,restoreStage,layer,hash}=inverse;
const read=file=>raw(new URL('../'+file,import.meta.url),'utf8'),json=file=>JSON.parse(read(file));
const current=read('hani-office-live.js'),previous=restoreStage(current,'hani-office-live.js','building-phase1');
const canon=json('data/hani-building/spatial-contract.json'),art=json('data/hani-building/art-map-v1.json'),sprites=json('assets/sprites-v2/manifest.json'),places=json('data/hani-building/office-places.json'),table=json('assets/data/office-actions-221.json');
const assets={canon,art,sprites,places,spritesV3:json('assets/sprites-v3/manifest-v3.json')};
const plain=x=>JSON.parse(JSON.stringify(x)),at=(day,sec)=>new Date(Date.parse(day+'T00:00:00+09:00')+sec*1000);
function load(source=current,metadata=assets){
 let storage=0,timers=0;const deny=new Proxy({}, {get(){storage++;throw Error('storage access forbidden')}});
 const context=vm.createContext({HaniOfficeV2Assets:structuredClone(metadata),HaniOfficeActions221:structuredClone(table),document:{getElementById:()=>null},window:{},
  localStorage:deny,sessionStorage:deny,indexedDB:deny,setTimeout(){timers++;throw Error('timer forbidden')},setInterval(){timers++;throw Error('timer forbidden')}});
 vm.runInContext(source,context);return {scene:context.HaniBuildingScene,context,counts:()=>({storage,timers})};
}
const loaded=load(),scene=loaded.scene;

test('registry schema: immutable indexed five-floor view, unchanged legacy labels/assets/capacities',()=>{
 const r=scene.floorRegistry;assert.equal(r.schemaVersion,'floor-registry-v1');assert.equal(r.defaultFloorId,'4f');assert.deepEqual(plain(r.floors.map(f=>f.id)),['5f','4f','3f','2f','1f']);
 assert.equal(r.get('5f').category,'rooftop');assert.equal(r.order('5f'),5);assert.deepEqual(plain(r.get('5f').legacyIds),['5f']);assert.equal(r.hasFloor('creative'),false);
 for(const f of r.floors){assert.ok(Object.isFrozen(f)&&Object.isFrozen(f.art)&&Object.isFrozen(f.connectors));assert.equal(r.get(f.id),f);assert.equal(f.label,canon.floors.find(c=>c.id===f.id).label);assert.equal(f.art.background,art.floors[f.id].background);assert.equal(f.art.nightBackground,art.floors[f.id].nightBackground);assert.deepEqual(plain(f.art.plates),art.floors[f.id].plates);assert.equal(r.elevatorAnchor(f.id),'elevator_'+f.id);assert.equal(f.maxVisible,Math.max(6,scene.getFloor(f.id).residents.length))}
 assert.deepEqual(plain(scene.floors),plain(load(previous).scene.floors));assert.equal(r.get('3f').art.production,'./assets/building/floor-3f-215.webp','existing degraded-art fallback retained');
});

test('326 data passes floor sums, explicit graph and art bijection; every removed anchor fails',()=>{
 assert.equal(canon.anchors.length,326);assert.equal(scene.validateSpatial(canon,art),true);
 assert.equal(scene.buildFloorRegistry(canon,art).floors.reduce((n,f)=>n+f.anchorCount,0),326);
 for(let i=0;i<canon.anchors.length;i++){const c=structuredClone(canon);c.anchors.splice(i,1);assert.equal(scene.validateSpatial(c,art),false,'missing '+canon.anchors[i].id)}
 for(const mutate of [
  c=>c.anchors.push({...c.anchors[0]}),c=>c.anchors[0].floor='missing',c=>c.edges.push({from:'missing',to:c.anchors[0].id}),
  c=>{c.edges=c.edges.filter(e=>e.from!=='elevator_4f'||e.to!=='elevator_5f')},
  c=>{c.edges=c.edges.filter(e=>e.from!=='stairs_4f'||e.to!=='stairs_5f')},
  c=>{c.edges.find(e=>e.from==='elevator_4f'&&e.to==='elevator_5f').bidirectional=false},
  c=>{c.edges.find(e=>e.from==='stairs_4f'&&e.to==='stairs_5f').bidirectional=false},
  c=>{const id=c.anchors.find(a=>a.rendererSeat&&a.walkTarget!==false).id;c.edges=c.edges.filter(e=>e.from!==id&&e.to!==id)},
  c=>c.edges.push({from:'elevator_1f',to:'elevator_3f',kind:'elevator',bidirectional:true}),
  c=>{c.anchors.splice(0,1);delete c.artIgnored}
 ]){const c=structuredClone(canon);mutate(c);assert.equal(scene.validateSpatial(c,art),false)}
 const a=structuredClone(art);delete a.anchors[canon.anchors[0].id];assert.equal(scene.validateSpatial(canon,a),false);
 a.anchors[canon.anchors[0].id]=art.anchors[canon.anchors[0].id];a.anchors.unowned={x:1,y:1};assert.equal(scene.validateSpatial(canon,a),false);
 const c=structuredClone(canon),a2=structuredClone(art),removed=c.anchors.pop();delete a2.anchors[removed.id];c.edges=c.edges.filter(e=>e.from!==removed.id&&e.to!==removed.id);assert.equal(scene.validateSpatial(c,a2),false,'floor count catches simultaneous canon/art removal');
});

test('actual asynchronous metadata gate accepts current data and rejects damaged canon/art',async()=>{
 async function fetchScene(source,metadata){
  let storage=0,timers=0;const urls=[],deny=new Proxy({}, {get(){storage++;throw Error('storage forbidden')}});
  const context=vm.createContext({document:{getElementById:()=>null},window:{},HaniOfficeActions221:table,
   localStorage:deny,sessionStorage:deny,setInterval(){timers++;throw Error('timer forbidden')},setTimeout(){timers++;throw Error('timer forbidden')},
   fetch:async url=>{urls.push(url);const key=url.includes('spatial-contract')?'canon':url.includes('art-map')?'art':url.includes('manifest-v3')?'spritesV3':url.includes('office-places')?'places':'sprites';return {ok:true,json:async()=>structuredClone(metadata[key])}}});
  vm.runInContext(source,context);for(let i=0;i<32;i++)await Promise.resolve();
  assert.ok(context.HaniBuildingScene);assert.equal(storage,0);assert.equal(timers,0);return {scene:context.HaniBuildingScene,urls};
 }
 const before=await fetchScene(previous,assets),after=await fetchScene(current,assets);
 assert.deepEqual(after.urls,before.urls);assert.equal(JSON.stringify(after.scene.snapshot(at('2026-11-21',36000))),JSON.stringify(before.scene.snapshot(at('2026-11-21',36000))));
 for(const key of ['canon','art']){const damaged=structuredClone(assets);if(key==='canon')damaged.canon.anchors.pop();else delete damaged.art.anchors[canon.anchors[0].id];
  const result=await fetchScene(current,damaged);assert.equal(result.scene.canon,undefined);assert.equal(result.scene.floors.length,4,'released degraded fallback retained');
 }
});

test('synthetic sixth floor uses order and custom connectors without parsing stable IDs',()=>{
 const c=structuredClone(canon),a=structuredClone(art);c.floors.find(f=>f.id==='5f').order=6;
 c.floors.push({id:'creative',order:5,code:'5F',label:'5F 라이프',anchorCount:3,maxVisible:7,legacyIds:['studio-floor'],rooms:[],connectors:{hallAnchor:'creative-hall',elevatorAnchor:'creative-lift',stairsAnchor:'creative-stair'}});
 for(const [id,type]of [['creative-hall','junction'],['creative-lift','elevator'],['creative-stair','stairs']]){c.anchors.push({id,type,floor:'creative',x:925,y:330});a.anchors[id]={x:51,y:52}}
 a.floors.creative={background:'synthetic.webp',plates:[]};
 c.edges=c.edges.filter(e=>!(e.from.endsWith('_4f')&&e.to.endsWith('_5f')));
 for(const kind of ['elevator','stairs']){const middle=kind==='elevator'?'creative-lift':'creative-stair';c.edges.push({from:kind+'_4f',to:middle,kind,bidirectional:true},{from:middle,to:kind+'_5f',kind,bidirectional:true},{from:'creative-hall',to:middle,kind:'walk',bidirectional:true})}
 assert.equal(scene.validateSpatial(c,a),true);const r=scene.buildFloorRegistry(c,a);assert.deepEqual(plain(r.floors.map(f=>f.id)),['5f','creative','4f','3f','2f','1f']);assert.equal(r.get('creative').maxVisible,7);assert.equal(r.get('studio-floor'),r.get('creative'));assert.equal(r.elevatorAnchor('creative'),'creative-lift');
 const engine=load(current,{...assets,canon:c,art:a}).scene;assert.ok(engine.route('elevator_4f','elevator_5f').some(p=>p.id==='creative-lift'));
 assert.equal(engine.tapLines.validateDrama({...json('assets/data/office-drama-v1.json'),weeks:json('assets/data/office-drama-v1.json').weeks.map(w=>({...w,days:w.days.map(d=>({...d,lines:d.lines.map(row=>({...row,floor:'creative'}))}))}))},c.people),true);
});

test('same KST input gives byte-identical full staff schedules, positions, lines, residents and companions',()=>{
 const before=load(previous).scene,after=load().scene;let count=0;
 for(const day of ['2026-11-20','2026-11-21','2026-12-25']){
  assert.equal(JSON.stringify(after.scheduler.plan(day)),JSON.stringify(before.scheduler.plan(day)),day+' formal schedule');
  const seconds=new Set([0,21599.9,21600,25199.9,25200,66599.9,66600,86399.9]);
  for(let t=0;t<86400;t+=1800)seconds.add(t);
  const formal=before.scheduler.plan(day),trips=before.scheduler.blockPlan(day,0,formal);
  assert.equal(JSON.stringify(after.scheduler.blockPlan(day,0,after.scheduler.plan(day))),JSON.stringify(trips),day+' complete outing ledger');
  for(const e of trips.slice(0,12))for(const t of [e.start-.1,e.start,e.start+.1,e.performStart,e.end-.1,e.end,e.end+.1])if(Number.isFinite(t))seconds.add(t);
  for(const sec of [...seconds].sort((a,b)=>a-b)){
   const now=at(day,sec),b=before.snapshot(now,{chairmanPresent:true}),a=after.snapshot(now,{chairmanPresent:true});
   assert.equal(JSON.stringify(a),JSON.stringify(b),day+' '+sec+' full snapshot');
   const br=before.residents.snapshot(now,b,true,false),ar=after.residents.snapshot(now,a,true,false);
   assert.equal(JSON.stringify(ar),JSON.stringify(br),day+' '+sec+' residents');
   assert.equal(JSON.stringify(after.residents.companionSnapshot(now,a,true,false,ar)),JSON.stringify(before.residents.companionSnapshot(now,b,true,false,br)),day+' '+sec+' companions');
   for(const floor of after.floors)assert.equal(after.atmosphere.background(floor,now),before.atmosphere.background(before.floors.find(f=>f.id===floor.id),now));count++;
  }
 }
 console.log('Phase 1 identical temporal snapshots',count,'(staff + residents + companions)');
});

// Reuse the repository DOM double without registering historical test cases or
// installing their byte readers. Its sourceTransform hook runs each raw owner.
const fixtureSource=read('scripts/hani-building-206-engine.test.mjs');
const fixtureFunction=fixtureSource.slice(fixtureSource.indexOf('export function fixture('),fixtureSource.indexOf("\ntest(")).replace('export function ','function ');
const mount=vm.runInNewContext('('+fixtureFunction+')',{assets,read,vm,Date,setTimeout,console});
const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};
function domState(f){return {floor:f.map.dataset.floor,art:f.map.dataset.art,tabs:f.tabs.children.map(b=>({id:b.dataset.buildingFloor,label:b.textContent,selected:b.getAttribute('aria-selected')})),actors:f.ids.get('haniOfficeActors').children.map(a=>({id:a.dataset.person,hidden:a.hidden,dataset:a.dataset,style:a.style,line:a.officeText?.textContent})),plates:f.map.querySelectorAll('.hani-office-room-plate').map(p=>({hidden:p.hidden,text:p.textContent,style:p.style})),background:f.map.querySelector('.hani-office-background').src,foreground:f.map.querySelectorAll('.hani-office-foreground').map(p=>({hidden:p.hidden,src:p.src})),rooms:f.root.querySelector('.hani-building-rooms').textContent}}

test('actual DOM owner keeps five tabs, mounted actors, labels, art, foregrounds and coordinates identical',async()=>{
 let storage=0;const deny=new Proxy({}, {get(){storage++;throw Error('unexpected storage access')}}),options={HaniOfficeV2Assets:assets,localStorage:deny,sessionStorage:deny,setTimeout:()=>0,HaniOfficePresence:{chairman:'active'}};
 const before=mount('10:00',false,()=>true,table,options,()=>previous),after=mount('10:00',false,()=>true,table,options,()=>current);
 await settle();assert.deepEqual(plain(before.timers.map(t=>t.ms)),plain(after.timers.map(t=>t.ms)));
 for(const day of ['2026-11-20','2026-11-21'])for(const time of ['06:00','10:00','12:30','18:30','22:00'])for(const floor of ['5f','4f','3f','2f','1f']){
  for(const f of [before,after]){f.setDateTime(day+'T'+time+':00+09:00');f.click(floor)}await settle();assert.equal(JSON.stringify(domState(after)),JSON.stringify(domState(before)),day+' '+time+' '+floor);
 }
 assert.equal(storage,0);assert.equal(after.tabs.children.length,5);assert.equal(after.tabs.style['--hani-floor-cols'],'5');
 const fallbackBefore=mount('10:00',true,()=>false,null,{...options,HaniOfficeV2Assets:null},()=>previous),fallbackAfter=mount('10:00',true,()=>false,null,{...options,HaniOfficeV2Assets:null},()=>current);await settle();assert.equal(JSON.stringify(domState(fallbackAfter)),JSON.stringify(domState(fallbackBefore)),'legacy degraded fallback unchanged');
});

test('storage/Cloud access and new timer/event registrations are zero',()=>{
 for(const pattern of [/\b(?:localStorage|sessionStorage|indexedDB)\b[^\n]*/g,/\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:supabase|cloudClient)\b[^\n]*/g])assert.deepEqual(current.match(pattern),previous.match(pattern),String(pattern));
 for(const f of scene.floorRegistry.floors){scene.floorRegistry.get(f.id);scene.floorRegistry.elevatorAnchor(f.id)}scene.validateSpatial(canon,art);scene.snapshot(at('2026-11-20',36000));assert.deepEqual(loaded.counts(),{storage:0,timers:0});
});

test('mobile five-tab geometry is unchanged and six tabs occupy three paired rows',()=>{
 const css=read('hani-office-live.css'),old=restoreStage(css,'hani-office-live.css','building-phase1');
 assert.ok(css.includes('repeat(var(--hani-floor-cols,5),minmax(0,1fr))'));assert.ok(css.includes('button:nth-child(odd):last-child{grid-column:1/-1}'));
 const slots=(n,odd)=>Array.from({length:n},(_,i)=>({row:Math.floor(i/2),column:i%2,span:i===n-1&&(!odd||n%2)?2:1}));
 assert.deepEqual(slots(5,true),slots(5,false));assert.deepEqual(slots(6,true).map(s=>s.span),[1,1,1,1,1,1]);
 assert.equal(css.replace('repeat(var(--hani-floor-cols,5),minmax(0,1fr))','repeat(5,minmax(0,1fr))').replace('button:nth-child(odd):last-child','button:last-child').replace('[data-foreground="floor"][data-art="floor"]','[data-floor="3f"][data-art="floor"]'),old,'all other CSS bytes retained');
});

test('exact inverse has ordered frozen boundaries and rejects altered, duplicate and partial inputs',()=>{
 for(const stage of layer.stages)for(const [file,row]of Object.entries(stage.files)){
  let source=read(file);for(const upper of layer.stages){if(upper.name===stage.name)break;if(upper.files[file]&&hash(source)===upper.files[file].afterSha256)source=restoreStage(source,file,upper.name)}
  assert.equal(hash(source),row.afterSha256);const restored=restoreStage(source,file,stage.name);assert.equal(hash(restored),row.beforeSha256);assert.equal(Buffer.byteLength(restored),row.beforeBytes);
  const ref=stage.name==='building-phase1'?layer.base:stage.name==='office-motion'?layer.release306:layer.pre306;
  assert.equal(restored,repository.read(ref,file),'independent Git object boundary '+stage.name+' '+file);
  for(const bad of [source+'\n',source.slice(1),source+source,restored])assert.throws(()=>restoreStage(bad,file,stage.name));
  const edit=row.replacements[0],partial=source.slice(0,edit.afterStart)+edit.before+source.slice(edit.afterStart+edit.after.length);assert.throws(()=>restoreStage(partial,file,stage.name));
  assert.ok(Buffer.isBuffer(restoreStage(Buffer.from(source),file,stage.name)));
 }
});

test('raw scene warm snapshot cost: interleaved same-input benchmark (report only, no new timing loop)',()=>{
 const before=load(previous).scene,after=load().scene,now=at('2026-11-20',50400);before.snapshot(now);after.snapshot(now);
 const samples={before:[],after:[]};for(let round=0;round<5;round++)for(const key of round%2?['after','before']:['before','after']){const engine=key==='before'?before:after,start=performance.now();for(let i=0;i<200;i++)engine.snapshot(at('2026-11-20',50400+i/10));samples[key].push((performance.now()-start)/200)}
 console.log('Phase 1 raw warm snapshot ms',samples);
});
