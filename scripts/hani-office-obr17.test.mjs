import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fixture} from './hani-building-206-engine.test.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {waitForOfficeLabels} from './hani-office-label-browser-ready.mjs';

const day='2026-10-22',table=JSON.parse(fs.readFileSync('assets/data/office-actions-221.json'));
const {scene}=loadScene(),s=scene.scheduler,options={chairmanPresent:true};
const report=s.blockPlan(day,0,s.plan(day,options),options).find(e=>e.report&&e.people[0].home.floor!=='4f');
assert.ok(report,'same cross-floor report selection as obr15 browser');
const second=report.performStart+1;
function setup(){
 const f=fixture('09:00',false,null,table),nodes=[...f.ids.get('haniOfficeActors').children];
 const show=(sec,presence,floor='4f')=>{f.setDateTime(at(day,sec));f.context.window.HaniOfficePresence={chairman:presence};f.click(floor)};
 // Like obr15, establish arrival before the report departure; late first presence cancels it.
 show(32400,'active');
 return {f,nodes,show,actor:id=>nodes.find(a=>a.dataset.person===id)};
}
test('obr17 reporting -> same timestamp absent clears hidden persistent partner, greeting and facing',()=>{
 const {f,nodes,show,actor}=setup(),staff=actor(report.report),chair=actor('seongmin');
 const absentBefore=JSON.stringify(s.snapshot(at(day,second),{chairmanPresent:false}));
 show(second,'active');assert.equal(staff.dataset.partner,'seongmin');assert.equal(chair.dataset.partner,report.report);
 assert.equal(staff.hidden,false);assert.ok(staff.dataset.facing);assert.ok(chair.dataset.facing);
 const absent=s.snapshot(at(day,second),{chairmanPresent:false}),person=absent.entries.find(p=>p.id===report.report);
 assert.equal(JSON.stringify(absent),absentBefore,'presence toggles preserve exact absent snapshot bytes');
 assert.equal(absent.entries.some(p=>p.id==='seongmin'),false);assert.equal(person.deskPartner,undefined);assert.notEqual(person.floor,'4f');
 show(second,'absent');
 console.log('obr17 same-time evidence',JSON.stringify({second,staff:report.report,presentFloor:'4f',absentFloor:person.floor,snapshotPartner:person.deskPartner??'',actorHidden:staff.hidden,actorPartner:staff.dataset.partner,actorGreeting:staff.dataset.greeting,actorFacing:staff.dataset.facing}));
 assert.equal(staff.hidden,true);assert.equal(chair.hidden,true);
 for(const a of [staff,chair]){assert.equal(a.dataset.partner,'');assert.equal(a.dataset.greeting,'false');assert.equal(a.dataset.facing,'')}
 show(second,'active');assert.equal(staff.dataset.partner,'');assert.equal(chair.dataset.partner,'','late re-entry cancels a report whose departure predates presence');
 show(32400,'absent');show(32400,'active');show(second,'active');assert.equal(staff.dataset.partner,'seongmin');assert.equal(chair.dataset.partner,report.report);
 // Preserve obr15's time reversal after the report ends, too.
 show(report.end+1,'active');show(second,'absent');assert.equal(staff.dataset.partner,'');
 assert.deepEqual([...f.ids.get('haniOfficeActors').children],nodes);assert.equal(f.timers.length,2);
});
test('obr17 floor switches and existing update timer keep all persistent pair attributes on current visible entries',()=>{
 const {f,nodes,show}=setup();
 const check=floor=>{
  const people=s.snapshot(at(day,second),options).entries.filter(p=>p.floor===floor),byId=new Map(people.map(p=>[p.id,p]));
  for(const a of nodes){const p=byId.get(a.dataset.person);assert.equal(a.dataset.partner,p?.deskPartner||'',a.dataset.person+' partner');assert.equal(a.dataset.facing,p?.facing||'',a.dataset.person+' facing');assert.equal(a.dataset.greeting,String(!!p&&(p.behaviorKind==='chairman-greeting'||p.id==='seongmin'&&people.some(q=>q.behaviorKind==='chairman-greeting'))),a.dataset.person+' greeting')}
 };
 show(second,'active');check('4f');show(second,'active','2f');check('2f');show(second,'active');check('4f');
 // Cached layout: pair state must still be written from this snapshot on each update.
 const staff=nodes.find(a=>a.dataset.person===report.report);staff.dataset.partner='stale';staff.dataset.greeting='true';staff.dataset.facing='stale';
 f.timers.find(t=>t.ms===4200).fn();check('4f');
 let greeting;
 for(let sec=32400;sec<33000&&!greeting;sec++){
  const stamp=at(day,sec).getTime(),snap=s.snapshot(at(day,sec),{chairmanPresent:true,chairmanSince:stamp,chairmanArrivalAt:stamp});
  const p=snap.entries.find(p=>p.behaviorKind==='chairman-greeting');if(p)greeting={sec,id:p.id};
 }
 assert.ok(greeting);const fresh=setup();fresh.show(greeting.sec,'active');assert.equal(fresh.actor(greeting.id).dataset.greeting,'true');
 fresh.show(greeting.sec,'active','2f');assert.equal(fresh.actor(greeting.id).dataset.greeting,'false');fresh.show(greeting.sec,'absent');assert.equal(fresh.actor(greeting.id).dataset.greeting,'false');
});
test('obr17 readiness requires exactly the runtime emoji and line, rejects arbitrary prefixes and stale text',async()=>{
 async function ready(full,emoji,line){
  const status={dataset:{full},officeLabelPlacement:{}},name={officeLabelPlacement:{}},actor={hidden:false,dataset:{avatar:'v2',emoji,line},querySelector:s=>s==='.hani-office-status'?status:name};
  const map={dataset:{floor:'4f',art:'floor',labelsReady:'4f',labelsAt:'1'},querySelector:s=>s==='.hani-office-background'?{complete:true,naturalWidth:100}:{hidden:false,querySelectorAll:()=>[{dataset:{ready:'true'}}]}};
  const context=vm.createContext({officeClock:1,document:{fonts:{ready:Promise.resolve()},getElementById:()=>map,querySelectorAll:()=>[actor]}}),results=[];
  let clicks=0;
  await waitForOfficeLabels({evaluate:async(fn,arg)=>{const result=await vm.runInContext('('+fn.toString()+')',context)(arg);if(typeof result==='boolean')results.push(result);return true},locator:()=>({click:async()=>{clicks++}})},'4f');
  assert.equal(clicks,1);assert.equal(results[1],true,'layout readiness preserved');return results[0];
 }
 for(const emoji of ['',...new Set(table.actions.flatMap(a=>[a.performance?.emoji,...Object.values(a.actorOverrides||{}).map(o=>o.emoji)]).filter(Boolean))]){
  const line='자료 확인 중';assert.equal(await ready((emoji?emoji+' ':'')+line,emoji,line),true,emoji);
 }
 for(const [full,emoji,line]of [['가짜 자료 확인 중','','자료 확인 중'],['💭 자료 확인 중','💻','자료 확인 중'],['자료 확인 중','💻','자료 확인 중'],['💻 자료 확인 중','','자료 확인 중'],['💻  자료 확인 중','💻','자료 확인 중'],['💻 이전 문구','💻','자료 확인 중']])assert.equal(await ready(full,emoji,line),false,full);
});
