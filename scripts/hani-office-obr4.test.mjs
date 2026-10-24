import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {assets} from './hani-office-v2-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assertOnboardedCanon} from './hani-office-onboarding-232-assertions.mjs';
import {readAt,loadScene} from './hani-office-lively-fixture.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const ids=['daon','yoonseul'];

test('obr4: all 326 canon anchors/coordinates stay frozen; both registered owners render in 2F with no planned rows',()=>{
 assertOnboardedCanon();
 const f=fixture('09:00',true,()=>true);f.click('2f');
 assert.equal(f.visible().length,8);assert.equal(f.ids.get('haniOfficeActors').children.length,19);
 assert.equal(f.root.querySelectorAll('*').filter(n=>n.dataset.plannedPerson).length,0);
 for(const id of ids){
  const actor=f.visible().find(a=>a.dataset.person===id);assert.ok(actor,id);
  const home=f.context.HaniBuildingScene.homeSeat(id);assert.equal(home.owner,id);
  assert.equal(actor.dataset.seat,home.id);assert.equal(actor.style.left,home.x+'%');assert.equal(actor.style.top,home.y+'%');
 }
 const {scene}=loadScene();assert.deepEqual([...scene.floors].map(f=>[f.id,f.residents.length]),[['5f',0],['4f',4],['3f',5],['2f',8],['1f',2]]);
});

test('obr4: released 2.9.232 runtime tolerates canon arriving first, with all 326 art coordinates and both home seats',()=>{
 const old=JSON.parse(readAt('data/hani-building/art-map-v1.json','4ac6b6c'));
 const canon=JSON.parse(read('data/hani-building/spatial-contract.json'));
 assert.equal(canon.anchors.length,326);assert.equal(Object.keys(old.anchors).length,326);
 for(const a of canon.anchors)assert.ok(Number.isFinite(old.anchors[a.id]?.x)&&Number.isFinite(old.anchors[a.id]?.y),a.id);
 const context=vm.createContext({HaniOfficeV2Assets:{...assets,canon,art:old},HaniOfficeActions221:JSON.parse(readAt('assets/data/office-actions-221.json','4ac6b6c')),window:{},document:{getElementById:()=>null}});
 vm.runInContext(readAt('hani-office-live.js','4ac6b6c'),context);
 const api=context.HaniBuildingScene;
 for(const id of ids)assert.equal(api.homeSeat(id).owner,id);
 for(const instant of ['2026-10-23T09:00:00+09:00','2026-10-23T12:30:00+09:00','2026-10-23T23:00:00+09:00']){
  const snapshot=api.snapshot(instant);assert.ok(snapshot.floors.every(f=>f.people.every(p=>p.seat&&Number.isFinite(p.seat.x)&&Number.isFinite(p.seat.y))));
 }
});

test('obr4: untouched mascot runtime derives data-planned=false for both onboarded people and preserves home coordinates',async()=>{
 const f=fixture('09:00',true,()=>true);await new Promise(resolve=>setImmediate(resolve));f.click('2f');
 const proto=Object.getPrototypeOf(f.map);proto.hasAttribute=function(k){return k==='src'?!!this.src:this.getAttribute(k)!==null};
 f.map.clientWidth=1440;f.map.dataset.art='floor';
 f.context.window.HaniBuildingScene=f.context.HaniBuildingScene;
 f.context.getComputedStyle=()=>({display:'block'});
 f.context.MutationObserver=class{observe(){}};f.context.ResizeObserver=class{observe(){}};
 const catalog=JSON.parse(read('assets/data/desk-mascots-v1.json'));
 f.context.fetch=async()=>({ok:true,json:async()=>catalog});
 vm.runInContext(read('hani-desk-mascots.js'),f.context);await new Promise(resolve=>setImmediate(resolve));
 const images=f.map.querySelectorAll('.hani-desk-mascot');assert.equal(images.length,19);
 for(const id of ids){
  const image=images.find(p=>p.dataset.person===id),entry=catalog.staff[id],home=assets.art.anchors[entry.anchor];
  assert.ok(image);assert.equal(image.dataset.planned,'false');assert.equal(image.parentElement.hidden,false);
  assert.equal(image.style.left,(home.x+entry.offset[0])+'%');assert.equal(image.style.top,(home.y+entry.offset[1])+'%');
 }
});

test('obr4: both people participate in generic actions and all place cards carry sourced safe preferences/arrival lines',()=>{
 for(const catalog of [216,221]){
  const table=JSON.parse(read('assets/data/office-actions-'+catalog+'.json'));
  for(const id of ids){
   assert.equal(table.people.find(p=>p.id===id)?.registration,'registered');
   for(const row of [...table.actions,...table.families.map(f=>f.parent)].filter(a=>a.participantSelector==='active_registered_including_chairman_and_mir'))assert.ok(row.participants.includes(id),row.id);
   if(catalog===221)for(const action of ['night-life-bookmark','night-life-note','night-life-idea','night-coffee-chat','night-window-view'])assert.ok(table.actions.find(a=>a.id===action).participants.includes(id));
  }
 }
 const places=JSON.parse(read('data/hani-building/office-places.json'));
 for(const id of ids){
  const seed=JSON.parse(read('data/hani-relationship-seed-v1.json')).people.find(p=>p.id===id);
  assert.equal(places.affinityEvidence[id].source,seed?undefined:'character-archive-232');
  for(const p of places.places){assert.ok(p.affinity[id]>=1&&p.affinity[id]<=5);assert.ok(p.atByPerson[id].length>=2);const location=p.at[0].split('에서')[0];assert.ok(p.atByPerson[id].every(s=>(s.includes(location+'에서')||p.kind==='board'&&s.startsWith(location+'에'))&&!/\.(?:json|js|webp|png)\b/i.test(s)));}
 }
});
