import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const json=f=>JSON.parse(read(f));
const plain=x=>JSON.parse(JSON.stringify(x));

const source=read('hani-office-live.js');
const files={
  canon:'data/hani-building/spatial-contract-v3.json',
  art:'data/hani-building/art-map-v3.json',
  sprites:'assets/sprites-v2/manifest.json',
  spritesV3:'assets/sprites-v3/manifest-v3.json',
  places:'data/hani-building/office-places-v3.json'
};
const assets=Object.fromEntries(Object.entries(files).map(([k,f])=>[k,json(f)]));
const table=json('assets/data/office-actions-315.json');
const at=(day,sec)=>new Date(Date.parse(day+'T00:00:00+09:00')+sec*1000);

function load(code=source,metadata=assets){
  let storage=0,timers=0,listeners=0;
  const deny=new Proxy({},{get(){storage++;throw Error('storage forbidden')}});
  const context=vm.createContext({
    HaniOfficeV2Assets:structuredClone(metadata),
    HaniOfficeActions221:structuredClone(table),
    document:{getElementById:()=>null,addEventListener(){listeners++}},
    window:{},
    localStorage:deny,
    sessionStorage:deny,
    indexedDB:deny,
    setTimeout(){timers++;throw Error('timer forbidden')},
    setInterval(){timers++;throw Error('timer forbidden')}
  });
  vm.runInContext(code,context);
  assert.ok(context.HaniBuildingScene);
  return {scene:context.HaniBuildingScene,counts:()=>({storage,timers,listeners})};
}

const loaded=load(),scene=loaded.scene;
const fixtureSource=read('scripts/hani-building-206-engine.test.mjs');
const fixtureFunction=fixtureSource.slice(fixtureSource.indexOf('export function fixture('),fixtureSource.indexOf('\ntest(')).replace('export function ','function ');
const mount=vm.runInNewContext('('+fixtureFunction+')',{assets,read,vm,Date,setTimeout,console});
const settle=async()=>{for(let i=0;i<24;i++)await Promise.resolve()};

test('1F background uses floor-1f-v2.webp in metadata, registry, fallback and live DOM',async()=>{
  assert.equal(assets.art.floors['1f'].background,'./assets/building/floor-1f-v2.webp');
  assert.equal(scene.floorRegistry.get('1f').art.background,'./assets/building/floor-1f-v2.webp');
  assert.equal(scene.getFloor('1f').background,'./assets/building/floor-1f-v2.webp');
  assert.equal(scene.getFloor('1f').production,'./assets/building/floor-1f-v2.webp');
  assert.equal(load(source,null).scene.getFloor('1f').background,'./assets/building/floor-1f-v2.webp');

  const views=[],f=mount('10:00',false,()=>true,table,{HaniOfficeV2Assets:assets,setTimeout:()=>0,HaniOfficePresence:{chairman:'active'},showView:id=>views.push(id)},()=>source);
  await settle();
  f.click('1f');
  await settle();
  assert.equal(f.map.querySelector('.hani-office-background').src,'./assets/building/floor-1f-v2.webp');

  const fallback=mount('10:00',true,()=>true,null,{HaniOfficeV2Assets:null,setTimeout:()=>0},()=>source);
  await settle();
  fallback.click('1f');
  await settle();
  assert.equal(fallback.map.querySelector('.hani-office-background').src,'./assets/building/floor-1f-v2.webp');
});

test('1F mounts four HTML room plates and convenience store routes to ledger via delegated click',async()=>{
  const views=[],f=mount('10:00',false,()=>true,table,{HaniOfficeV2Assets:assets,setTimeout:()=>0,HaniOfficePresence:{chairman:'active'},showView:id=>views.push(id)},()=>source);
  await settle();
  f.click('1f');
  await settle();

  const plates=f.map.querySelectorAll('.hani-office-room-plate').filter(p=>!p.hidden);
  assert.equal(plates.length,4);
  assert.deepEqual(plain(plates.map(p=>p.dataset.label)),['HANI 24 편의점','안내데스크','로비','HANI Coffee']);

  const conveniencePlate=plates[0];
  assert.equal(conveniencePlate.tagName,'button');
  assert.equal(conveniencePlate.dataset.room,'convenience');
  assert.equal(conveniencePlate.dataset.roomView,'ledger');
  assert.equal(conveniencePlate.dataset.roomFloor,'1f');

  for(const plainPlate of plates.slice(1)){
    assert.equal(plainPlate.tagName,'span');
    assert.equal(plainPlate.dataset.roomView,undefined);
    assert.equal(plainPlate.dataset.brand,undefined);
  }

  const nativeClosest=conveniencePlate.closest.bind(conveniencePlate);
  conveniencePlate.closest=selector=>selector==='[data-room-view]'?conveniencePlate:nativeClosest(selector);
  f.root.events.click({target:conveniencePlate,preventDefault(){}});
  assert.deepEqual(views,['ledger']);

  f.click('2f');
  await settle();
  f.root.events.click({target:conveniencePlate,preventDefault(){}});
  assert.deepEqual(views,['ledger'],'hidden 1F convenience button cannot route when viewing 2F');
});

test('sua and taeo home seats move to 2F spare desks while preserving affinity personIds',()=>{
  const sua=assets.canon.people.find(p=>p.id==='sua');
  const taeo=assets.canon.people.find(p=>p.id==='taeo');
  assert.equal(sua.homeAnchor,'finance-row-spare');
  assert.equal(sua.workAnchor,'finance-row-spare');
  assert.equal(taeo.homeAnchor,'finance-row-spare-east');
  assert.equal(taeo.workAnchor,'finance-row-spare-east');

  assert.equal(assets.art.floors['2f'].freeDesks.length,0);
  assert.ok(assets.art.floors['2f'].homeFurniture['finance-row-spare']);
  assert.ok(assets.art.floors['2f'].homeFurniture['finance-row-spare-east']);
  assert.equal(scene.homeSeat('sua').anchor,'finance-row-spare');
  assert.equal(scene.homeSeat('taeo').anchor,'finance-row-spare-east');
  assert.ok(scene.getFloor('2f').residents.includes('sua'));
  assert.ok(scene.getFloor('2f').residents.includes('taeo'));
  // 11/24 회장님 decision: 유나 leaves the 1F desk for a third 4F secretariat desk; 소담 (NPC) staffs the counter.
  assert.deepEqual(plain(scene.getFloor('1f').residents),[]);
  assert.ok(scene.getFloor('4f').residents.includes('yuna'));
  assert.equal(scene.homeSeat('yuna').anchor,'desk_yuna_east');

  const dayWork=scene.snapshot(at('2026-11-23',36000));
  const f2=dayWork.floors.find(f=>f.id==='2f');
  assert.equal(f2.people.find(p=>p.id==='sua')?.seat?.anchor,'finance-row-spare');
  assert.equal(f2.people.find(p=>p.id==='taeo')?.seat?.anchor,'finance-row-spare-east');

  const f1=dayWork.floors.find(f=>f.id==='1f');
  assert.ok(!f1.people.some(p=>['sua','taeo'].includes(p.id)));

  for(const id of ['sua','taeo']){
    const person=table.people.find(p=>p.id===id);
    assert.equal(person.home.floor,'2f');
    assert.equal(person.home.room,'finance');
    assert.ok(source.includes(id+':['),'affinity personId '+id+' remains unchanged');
  }
  const ambient1f=table.actions.find(a=>a.id==='night-lobby-note');
  const ambient2f=table.actions.find(a=>a.id==='night-life-bookmark');
  assert.ok(!ambient1f.participants.includes('sua')&&!ambient1f.participants.includes('taeo'));
  assert.ok(ambient2f.participants.includes('sua')&&ambient2f.participants.includes('taeo'));
});

test('1F consult booth is visit-only and supports hosting from 2F (sua/taeo)',()=>{
  assert.ok(assets.canon.people.every(p=>{
    const room=assets.canon.anchors.find(a=>a.id===p.homeAnchor)?.room;
    return room!=='consult'&&room!=='convenience';
  }));

  const day='2026-11-23';
  const formal=scene.scheduler.plan(day);
  const outings=scene.scheduler.blockPlan(day,0,formal);
  const consultGuests=outings.filter(e=>['client','candidate'].includes(e.visitor?.kind));
  assert.ok(consultGuests.length>0);
  assert.ok(consultGuests.every(e=>e.people[0].seat.anchor==='client_booth_slot_1'||scene.anchors.get(e.people[0].seat.anchor)?.room==='cafe'));
  const consultHosts=outings.filter(e=>e.guestId&&scene.anchors.get(e.people[0].seat.anchor)?.floor==='1f'&&e.people[0].seat.anchor==='junction_consult');
  assert.ok(consultHosts.length>0,'at least one consultation host uses junction_consult');

  const only2f={presentIds:['sua','taeo']};
  const formal2f=scene.scheduler.plan(day,only2f);
  const outings2f=scene.scheduler.blockPlan(day,0,formal2f,only2f);
  const descendingHost=outings2f.find(e=>e.guestId&&['sua','taeo'].includes(e.people[0].id)&&e.people[0].seat.anchor==='junction_consult');
  assert.ok(descendingHost,'2F business staff can descend to 1F junction_consult to host guests');
  assert.equal(descendingHost.people[0].out[0].from.startsWith('finance-row-spare')||descendingHost.people[0].home.floor==='2f',true);
});

test('1F and 2F spatial anchors pass Phase 1 validateSpatial and routing',()=>{
  assert.equal(scene.validateSpatial(assets.canon,assets.art),true);
  assert.equal(scene.floorRegistry.get('1f').anchorCount,52);
  assert.equal(scene.floorRegistry.get('2f').anchorCount,80);
  assert.equal(assets.canon.anchors.length,363);
  assert.equal(scene.floorRegistry.get('4f').anchorCount,84);
  assert.ok(scene.route('elevator_4f','desk_yuna_east').length>0);

  assert.ok(scene.route('elevator_1f','convenience_browse').length>0);
  assert.ok(scene.route('elevator_1f','client_booth_slot_1').length>0);
  assert.ok(scene.route('elevator_1f','junction_consult').length>0);
  assert.ok(scene.route('elevator_2f','finance-row-spare').length>0);
  assert.ok(scene.route('elevator_2f','finance-row-spare-east').length>0);
  assert.ok(scene.route('finance-row-spare','junction_consult').length>0);

  const validAnchorIds=new Set([...assets.canon.anchors.map(a=>a.id),...(assets.places.anchors||[]).map(a=>a.id)]);
  for(const p of assets.places.places)for(const s of p.slots)assert.ok(validAnchorIds.has(s),'place slot '+s);
  for(const action of table.actions)for(const p of action.places)assert.ok(validAnchorIds.has(p.anchorId),'action anchor '+p.anchorId+' in '+action.id);
});

test('1F residentSafe and companionSafe reject furniture overlap and keep clear spots valid',()=>{
  const w=assets.art.width,h=assets.art.height;
  const pct=(px,py)=>[px/w*100,py/h*100];

  for(const id of ['resident_cat_lobby','resident_dog_lobby','resident_rabbit_lobby_a','resident_bori_lobby_a','resident_bori_stroll_lobby','resident_cleaner_1f','resident_cat_night_a','resident_dog_night_a','resident_rabbit_night_a','resident_bori_night_a']){
    assert.ok(scene.residents.spot(id),'1F residentSpot valid: '+id);
  }

  const obstacles=[
    [220,620,'convenience shelves'],
    [820,535,'security gate'],
    [800,320,'reception desk'],
    [1140,330,'consult booth'],
    [1550,680,'cafe counter'],
    [1275,350,'lounge armchair'],
    [1445,470,'lounge armchair SE']
  ];
  for(const [px,py,label] of obstacles){
    const v=pct(px,py);
    assert.equal(scene.residents.safe('1f',[500,330],v,true),false,'residentSafe rejects '+label);
    assert.equal(scene.residents.companionSafe('1f',v,true),false,'companionSafe rejects '+label);
  }

  for(const clearPct of [[44,74],[56,74],[68,72],[79.5,72],[32.9,68]]){
    assert.equal(scene.residents.safe('1f',[500,330],clearPct,true),true,'residentSafe allows clear lobby '+clearPct);
    assert.equal(scene.residents.companionSafe('1f',clearPct,true),true,'companionSafe allows clear lobby '+clearPct);
  }

  const night=at('2026-11-23',79200);
  const nightStaff=scene.snapshot(night,{chairmanPresent:true});
  const nightResidents=scene.residents.snapshot(night,nightStaff,true,false);
  const nightCompanions=scene.residents.companionSnapshot(night,nightStaff,true,false,nightResidents);
  for(const actor of [...nightResidents,...nightCompanions].filter(p=>p.floor==='1f'&&!String(p.anchor).startsWith('resident_post_'))){
    if(actor.id.startsWith('kid-')||actor.id.startsWith('companion-')){
      assert.equal(scene.residents.companionSafe('1f',actor.position,actor.id.startsWith('kid-')),true,'live companion clear: '+actor.id);
    }else{
      assert.equal(scene.residents.safe('1f',actor.point||[500,330],actor.position,!!actor.pet),true,'live resident clear: '+actor.id);
    }
  }
});

test('kids scenes stay intact, zero storage accesses, zero extra timers or listeners',()=>{
  for(const name of ['createKidsVisits','companionActivity']){
    assert.ok(source.includes('  function '+name+'('),'missing '+name);
  }
  assert.ok(source.includes('  const kidsVisitLines='));
  assert.equal(typeof scene.residents.createKidsVisits,'function');
  assert.equal(typeof scene.residents.companionReactions,'object');
  assert.ok(Object.keys(scene.residents.kidsVisitLines).length>=4);

  assert.ok(!/localStorage\.setItem\s*\(\s*['"]hani_os_life_v23/.test(source));
  assert.ok(!/localStorage\.(?:removeItem|clear)\b/.test(source));
  assert.equal((source.match(/\bsetInterval\s*\(/g)||[]).length,2);
  scene.snapshot(at('2026-11-23',36000),{chairmanPresent:true});
  scene.validateSpatial(assets.canon,assets.art);
  assert.deepEqual(loaded.counts(),{storage:0,timers:0,listeners:0});
});

test('1F counter posts: 다솜/나래 HANI 24, 소담/하람 안내데스크, 이슬/은하 cafe stand behind painted counters by the clock',()=>{
  const ids=t=>scene.residents.snapshot(t,scene.snapshot(t),true,false).filter(p=>p.floor==='1f'&&String(p.anchor).startsWith('resident_post_')).map(p=>p.id+'@'+p.anchor+':'+p.pose).sort();
  assert.deepEqual(plain(ids(at('2026-11-23',10*3600+1800))),['npc-barista-iseul@resident_post_cafe:standing','npc-clerk-day@resident_post_store:standing','npc-guide@resident_post_reception:standing']);
  assert.deepEqual(plain(ids(at('2026-11-23',22*3600+2400))),['npc-barista-eunha@resident_post_cafe:standing','npc-clerk-night@resident_post_store:standing','npc-desk-night@resident_post_reception:standing']);
  assert.deepEqual(plain(ids(at('2026-11-24',3*3600+600))),['npc-barista-eunha@resident_post_cafe:sitting','npc-clerk-night@resident_post_store:standing','npc-desk-night@resident_post_reception:standing']);
  // The desk hand-over: 소담 until 18:00, 하람 from 18:00 to 09:00, never both.
  const desk=h=>plain(ids(at('2026-11-23',h*3600)).filter(x=>x.includes('reception')));
  assert.deepEqual(desk(8.5),['npc-desk-night@resident_post_reception:standing']);assert.deepEqual(desk(9),['npc-guide@resident_post_reception:standing']);assert.deepEqual(desk(17.9),['npc-guide@resident_post_reception:standing']);assert.deepEqual(desk(18),['npc-desk-night@resident_post_reception:standing']);
  for(const id of ['resident_post_store','resident_post_reception','resident_post_cafe']){const spot=scene.residents.spot(id);assert.ok(spot&&spot.post&&spot.floor==='1f',id)}
  // Posts belong to the new painted counters only; the old 1F art keeps its painted barista.
  const old=structuredClone(assets);old.art.floors['1f'].background='./assets/building/floor-1f-217.webp';
  const legacy=load(source,old).scene;assert.equal(legacy.residents.spot('resident_post_cafe'),null);
  // Posts use the resident fallback atlas (<id>.webp, row 0); manifest-v3 is not edited.
  for(const p of scene.residents.people.filter(p=>p.post)){const atlas=scene.residents.atlas(p);assert.equal(atlas.file,p.id+'.webp');assert.equal(atlas.frames[0].name,'standing');assert.ok(fs.existsSync(new URL('../assets/sprites-v3/'+atlas.file,import.meta.url)),atlas.file);assert.ok(!assets.spritesV3.entries.some(e=>e.id===p.id),'no manifest entry '+p.id)}
});
