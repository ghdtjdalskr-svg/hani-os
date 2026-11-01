import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
import {assertResources} from './hani-office-place-assertions.mjs';
import {spriteBox,boxesOverlap} from './hani-office-obr21-geometry.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import path from 'node:path';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';

const base='b653a173079323217bcd5e338e82c50d40d578e1',days=['2026-11-02','2026-11-04','2026-11-07','2026-11-08'];
const {scene,table,context}=loadScene(),s=scene.scheduler,options={chairmanPresent:true},records=[];
let forbidden=0;const deny=()=>{forbidden++;throw Error('forbidden persistence/network')};
context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
const business=e=>['client','candidate'].includes(e.visitor?.kind);
const plain=x=>JSON.parse(JSON.stringify(x));
for(const day of days)test('consult: sofa host coverage, real round trips and matching words '+day,()=>{
 const formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),guests=out.filter(business),hosts=out.filter(e=>e.guestId&&guests.some(g=>g.id===e.guestId));
 const counts=Object.fromEntries(['client','candidate','courier'].map(kind=>[kind,out.filter(e=>e.visitor?.kind===kind).length]));
 assert.ok(counts.client>=64);assert.ok(counts.courier>=125);if(days.indexOf(day)<2)assert.ok(counts.candidate>=33);else assert.equal(counts.candidate,0);
 const hosted=Object.fromEntries(['client','candidate'].map(kind=>[kind,hosts.filter(e=>guests.find(g=>g.id===e.guestId).visitor.kind===kind).length]));
 for(const kind of ['client','candidate'])if(counts[kind])assert.ok(hosted[kind]>=Math.ceil(counts[kind]/2),kind+' at least half');
 for(const guest of guests){
  assert.match(guest.people[0].seat.anchor,/^lobby-/);assert.equal(guest.people[0].seat.posture,'sitting');
  assert.equal(guest.people[0].outbound[0].id,'arrival_gate');assert.equal(guest.people[0].inbound.at(-1).id,'arrival_gate');
  const host=hosts.find(e=>e.guestId===guest.id),sec=host?(host.performStart+host.performEnd)/2:(guest.performStart+guest.performEnd)/2,snap=s.snapshot(at(day,sec),options),v=snap.visitors.find(p=>p.id===guest.people[0].id);
  assert.ok(v);if(!host){assert.equal(v.hostId,undefined);assert.equal(v.line,guest.visitor.at);continue;}
  assert.ok(['sua','taeo'].includes(host.people[0].id));assert.ok(host.start>=guest.performStart&&host.end<=guest.performEnd);
  const t=host.people[0],p=snap.entries.find(p=>p.id===t.id);assert.equal(p.state,'AT_PLACE');assert.equal(v.state,'AT_PLACE');assert.equal(v.hostId,p.id);assert.equal(p.visitorPartner,guest.id);
  assert.equal(p.line,guest.visitor.kind==='candidate'?'면접 진행 중':'상담 중');assert.equal(v.line,guest.visitor.kind==='candidate'?'면접 보는 중':'상담 받는 중');
  assert.equal(t.outbound[0].id,t.home.anchorId);assert.equal(t.inbound.at(-1).id,t.home.anchorId);assert.ok(!/^lobby-|^client_booth/.test(t.seat.anchor));
  assert.ok(host.performEnd-host.performStart>=8&&host.performEnd-host.performStart<=25);assert.ok(host.end-host.start<=60);
  for(const sec of [host.start+.002,host.performStart-.002,host.performStart+.002,host.performEnd-.002,host.performEnd+.002,host.end-.002]){
   const q=s.snapshot(at(day,sec),options),staff=q.entries.find(p=>p.id===t.id),visitor=q.visitors.find(p=>p.id===guest.people[0].id),talk=sec>=host.performStart&&sec<host.performEnd;
   assert.equal(visitor.hostId===t.id,talk);assert.equal(staff.visitorPartner===guest.id,talk);
   const stationary=q.entries.filter(p=>p.floor==='1f'&&!p.walking);
   if(talk)for(const other of stationary)if(other.id!==t.id)assert.ok(!boxesOverlap(spriteBox(staff),spriteBox(other)),t.id+' vs '+other.id);
   if(talk)assert.ok(!boxesOverlap(spriteBox(staff),spriteBox(visitor)));
  }
  for(const other of [...formal,...out])if(other!==host&&host.start<other.end&&other.start<host.end){assert.ok(!other.people.some(p=>p.id===t.id),'host actor reservation');assertResources(s,host,other);}
  assert.equal(s.snapshot(at(day,host.end+.001),options).entries.find(p=>p.id===t.id).seat.anchor,t.home.anchorId);
  assert.deepEqual(plain(s.snapshot(at(day,sec),options)),plain(snap));
 }
 records.push({day,formal,out,counts,hosted});console.log({day,counts,hosted});assert.equal(forbidden,0);
});

test('consult: weekday client and candidate host shares also stay at least half when chairman is absent',()=>{
 for(const day of days.slice(0,2)){
  const o={chairmanPresent:false},formal=s.plan(day,o),out=s.blockPlan(day,0,formal,o);
  for(const [kind,min] of [['client',64],['candidate',33],['courier',125]]){
   const guests=out.filter(e=>e.visitor?.kind===kind);assert.ok(guests.length>=min);
   if(kind==='courier')continue;
   const hosted=guests.filter(g=>out.some(e=>e.guestId===g.id));assert.ok(hosted.length>=Math.ceil(guests.length/2));
   for(const guest of hosted){const host=out.find(e=>e.guestId===guest.id),snap=s.snapshot(at(day,(host.performStart+host.performEnd)/2),o);assert.equal(snap.visitors.find(p=>p.outingId===guest.id).line,kind==='candidate'?'면접 보는 중':'상담 받는 중');assert.equal(snap.entries.find(p=>p.outingId===host.id).line,kind==='candidate'?'면접 진행 중':'상담 중');}
  }
 }
 assert.equal(forbidden,0);
});

test('consult: weekday rest means and rooftop minutes retain the existing bounds',()=>{
 for(const chairmanPresent of [true,false]){
 const rows=[],options={chairmanPresent};for(const day of days.slice(0,2)){
  const formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options);
  const events=new Map([...formal,...out].map(e=>[e.id,e]));for(let sec=32400;sec<64800;sec+=60){const people=s.snapshot(at(day,sec),options).entries.filter(p=>{if(p.id==='mir')return false;const e=events.get(p.outingId||p.eventId);return e?e.card?['coffee','sofa','garden','terrace','window'].includes(e.card.kind):!!s.actions.get(e.actionId)?.personalNonWork:p.floor==='5f'||p.activity==='rest'});rows.push({lunch:sec>=41400&&sec<46800,n:people.length,roof:people.some(p=>p.floor==='5f')});}
 }
 assert.equal(rows.length,1080);const outside=rows.filter(r=>!r.lunch),lunch=rows.filter(r=>r.lunch),mean=rs=>rs.reduce((n,r)=>n+r.n,0)/rs.length,roof=outside.filter(r=>r.roof).length/outside.length;
 console.log({chairmanPresent,outside:mean(outside),lunch:mean(lunch),rooftop:roof});assert.ok(mean(outside)>=3.4&&mean(outside)<=3.85);assert.ok(mean(lunch)>=6.7&&mean(lunch)<=7.2);assert.ok(roof>=.45&&roof<=.55);
 }
});

test('consult: absent booth owners never make booth seats eligible, and guests without a host keep waiting',()=>{
 const day=days[0],options={presentIds:['seoyun','dohyun']},formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),guests=out.filter(business);assert.ok(guests.length>0);assert.equal(out.some(e=>e.guestId),false);
 for(const e of guests){assert.match(e.people[0].seat.anchor,/^lobby-/);const p=s.snapshot(at(day,(e.performStart+e.performEnd)/2),options).visitors.find(p=>p.outingId===e.id);assert.ok(p);assert.equal(p.hostId,undefined);assert.equal(p.line,e.visitor.kind==='client'?'상담 대기 중':'면접 대기 중… 두근');}
});

test('consult: sofa wording, counter words, safety owners and runtime timers',async()=>{
 const source=fs.readFileSync('hani-office-live.js','utf8'),original=readAt('hani-office-live.js',base),data=fs.readFileSync('data/hani-building/office-places.json','utf8'),old=readAt('data/hani-building/office-places.json',base);
 assert.equal(data,old.replaceAll('카페 좌석으로','로비 소파로').replaceAll('카페 좌석','로비 소파').replace('"visitorHosts": [\n      "yuna",','"visitorHosts": [\n      "sua",'));
 const section=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
 assert.equal(section(source,'    function screenHomeClear(','    function stationaryStops('),section(original,'    function screenHomeClear(','    function stationaryStops('));
 assert.equal(section(source,'  function placeStatusLabels(','  const scheduler='),section(original,'  function placeStatusLabels(','  const scheduler='));
 assert.equal((source.match(/setInterval\(/g)||[]).length,2);assert.doesNotMatch(source,/localStorage|sessionStorage|supabase/);assert.equal((source.match(/fetch\(/g)||[]).length,(original.match(/fetch\(/g)||[]).length);
 assert.match(scene.places.find(c=>c.id==='cafe-1f').go,/로비 소파/);assert.equal(scene.places.find(c=>c.id==='cafe-1f').go,'로비 소파로 가는 중');assert.ok(scene.places.find(c=>c.id==='coffee-1f').at.every(line=>line.includes('카운터')));
 assert.equal(scene.places.find(c=>c.id==='cafe-1f').name,'로비 소파로');assert.ok(scene.places.find(c=>c.id==='cafe-1f').at.includes('로비 소파에서 커피 마시는 중'));
 assert.deepEqual(JSON.parse(data).behavior.visitorHosts,['sua','taeo']);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(f),read:f=>fs.readFileSync(f)});
 assert.deepEqual(closure.missing,[]);
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 for(const file of new Set([...closure.files,...walk('data')]))if(/\.(?:js|mjs|json|css|html)$/.test(file))assert.doesNotMatch(fs.readFileSync(file,'utf8'),/로비 라운지/,file);
 assert.doesNotMatch(source,/회장님 오셔서 창 닫는 중|면접 이야기 나누는 중|면접 질문하는 중/);
 for(const [full,short] of [['급하게 인스타 끄는 중','인스타 끄는 중'],['급하게 창 닫는 중','창 닫는 중'],['회장님 질문 듣는 중','질문 듣는 중'],['회장님께 화면 설명 중','화면 설명 중']])assert.equal(s.shortLine(full),short);
});

test('consult: separately authored full plans and reverse snapshots retain exact identity in both presence states',()=>{
 const hash=x=>createHash('sha256').update(x).digest('hex'),bytes=gunzipSync(fs.readFileSync('scripts/fixtures/office-consult-v7-plans.json.gz'));
 assert.equal(hash(bytes),'1a0acf4ae695ccb93b315b59bea9804273ca7cee4eb024dcd84bab90bd4579db');const frozen=JSON.parse(bytes);
 assert.equal(hash(fs.readFileSync('hani-office-live.js')),frozen.sourceSha256);assert.equal(hash(fs.readFileSync('data/hani-building/office-places.json')),frozen.placesSha256);assert.equal(frozen.records.length,16);
 for(const r of frozen.records){const api=loadScene().scene.scheduler,f=api.plan(r.day,r.options),out=api.blockPlan(r.day,0,f,r.options);assert.equal(hash(JSON.stringify(f)),r.formalSha256,r.label+' complete formal JSON');assert.equal(hash(JSON.stringify(out)),r.outingsSha256,r.label+' complete outings JSON');for(const row of r.snapshots.toReversed())assert.equal(hash(JSON.stringify(api.snapshot(at(r.day,row.seconds),r.options))),row.sha256,r.label+' complete snapshot JSON '+row.seconds);}
});

test('consult: chairman desk visit replies only during a real visit, including a secret-play first reply',()=>{
 let visits=0,secret=0;const lines=new Set();
 for(let i=0;i<28;i++){
  const day=new Date(Date.UTC(2026,10,2+i)).toISOString().slice(0,10),f=s.plan(day,options),out=s.blockPlan(day,0,f,options);
  for(const e of out.filter(e=>e.card.errandKind==='colleague'&&e.people[0].id==='seongmin')){
   const atStart=s.snapshot(at(day,e.performStart+.001),options),a=atStart.entries.find(p=>p.id===e.card.targetPerson),b=s.snapshot(at(day,e.performEnd-.001),options).entries.find(p=>p.id===e.card.targetPerson);
   assert.equal(a.behaviorKind,'chairman-desk-reply');assert.equal(b.behaviorKind,'chairman-desk-reply');assert.equal(a.deskPartner,'seongmin');assert.equal(a.walking,false);assert.equal(a.seat.anchor,table.people.find(p=>p.id===a.id).home.anchorId);assert.ok(['급하게 인스타 끄는 중','급하게 창 닫는 중','회장님 질문 듣는 중','회장님께 화면 설명 중'].includes(a.line));
   lines.add(a.line);assert.ok(new Set([a.line,b.line]).size<=2);if(a.line==='급하게 창 닫는 중'||a.line==='급하게 인스타 끄는 중'){secret++;assert.match(b.line,/질문 듣는|화면 설명/);assert.equal(a.shortLine,a.line==='급하게 인스타 끄는 중'?'인스타 끄는 중':'창 닫는 중');}
   for(const sec of [e.performStart-.002,e.performEnd+.002])assert.notEqual(s.snapshot(at(day,sec),options).entries.find(p=>p.id===a.id).behaviorKind,'chairman-desk-reply');
   for(const cancelled of [new Set([e.id])])assert.notEqual(s.snapshot(at(day,e.performStart+.001),{...options,cancelled}).entries.find(p=>p.id===a.id).behaviorKind,'chairman-desk-reply');
   assert.deepEqual(plain(s.snapshot(at(day,e.performStart+.001),options)),plain(atStart));visits++;
  }
  if(secret&&visits>=10)break;
 }
 assert.ok(visits>=10);assert.ok(secret>0,'real deterministic secret-play witness');console.log({deskVisits:visits,secretFirstReplies:secret,lines:[...lines]});assert.equal(forbidden,0);
});

test('consult: November 2–13 real desk visits show 12–45 Instagram first replies, identical on reverse reads',()=>{
 const visits=[],weeks=[{week:'2026-11-02–08',visits:0,instagram:0},{week:'2026-11-09–13',visits:0,instagram:0}];
 for(let i=0;i<12;i++){
  const day=new Date(Date.UTC(2026,10,2+i)).toISOString().slice(0,10),formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),week=weeks[i<7?0:1];
  for(const e of out.filter(e=>e.card.errandKind==='colleague'&&e.people[0].id==='seongmin')){
   const first=s.snapshot(at(day,e.performStart+.001),options).entries.find(p=>p.id===e.card.targetPerson);
   assert.equal(first.behaviorKind,'chairman-desk-reply');assert.equal(first.deskPartner,'seongmin');
   visits.push({day,event:e.id,seconds:e.performStart+.001,target:e.card.targetPerson,line:first.line,shortLine:first.shortLine});week.visits++;
   if(first.line==='급하게 인스타 끄는 중'){week.instagram++;assert.equal(first.shortLine,'인스타 끄는 중');}
  }
 }
 const count=weeks.reduce((n,w)=>n+w.instagram,0);assert.ok(count>=12,'at least twelve visible Instagram reactions');assert.ok(count<=45,'at most forty-five visible Instagram reactions');
 const reverse=loadScene().scene.scheduler;
 for(const v of visits.toReversed()){
  const actor=reverse.snapshot(at(v.day,v.seconds),options).entries.find(p=>p.id===v.target);
  assert.equal(actor.line,v.line,v.day+' '+v.event+' reverse line');assert.equal(actor.shortLine,v.shortLine,v.day+' '+v.event+' reverse shortLine');
 }
 console.log({deskVisits:visits.length,instagramFirstReplies:count,weeks});assert.equal(forbidden,0);
});

test('consult: actual desk reply path distinguishes an Instagram idle line from other secret play',()=>{
 const day=days[0],formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),e=out.find(e=>e.card.errandKind==='colleague'&&e.people[0].id==='seongmin');assert.ok(e);
 for(const [idle,expected,short] of [['몰래 인스타 보는 중','급하게 인스타 끄는 중','인스타 끄는 중'],['몰래 게임 보는 중','급하게 창 닫는 중','창 닫는 중'],['업무 정리 중',null,null]]){
  // Supply just the idle-line input; execute the actual booking, snapshot,
  // secret classification, two reply phases and shortLine owners unchanged.
  let replacements=0;
  const api=loadScene({transform:source=>source.replace(/const idle=own\?[^\r\n]+;/,()=>{replacements++;return 'const idle='+JSON.stringify(idle)+';'})}).scene.scheduler;
  assert.equal(replacements,1);
  const first=api.snapshot(at(day,e.performStart+.001),options).entries.find(p=>p.id===e.card.targetPerson),last=api.snapshot(at(day,e.performEnd-.001),options).entries.find(p=>p.id===e.card.targetPerson);
  assert.equal(first.behaviorKind,'chairman-desk-reply');assert.equal(last.behaviorKind,'chairman-desk-reply');
  if(expected){assert.equal(first.line,expected);assert.equal(first.shortLine,short)}else assert.ok(['회장님 질문 듣는 중','회장님께 화면 설명 중'].includes(first.line));
  assert.ok(['회장님 질문 듣는 중','회장님께 화면 설명 중'].includes(last.line));
 }
});

test('consult: caught-out visit takes Instagram priority for secret and ordinary idle lines, then keeps the chairman reply',()=>{
 const day=days[0],formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),e=out.find(e=>e.card.errandKind==='colleague'&&e.people[0].id==='seongmin'&&s.seed(day+'|'+e.id+'|caught-out')%12===0);assert.ok(e);
 for(const idle of ['몰래 인스타 보는 중','몰래 게임 보는 중','업무 정리 중']){
  let replacements=0;
  const api=loadScene({transform:source=>source.replace(/const idle=own\?[^\r\n]+;/,()=>{replacements++;return 'const idle='+JSON.stringify(idle)+';'})}).scene.scheduler;assert.equal(replacements,1);
  const middle=(e.performStart+e.performEnd)/2,secondHalf=Math.ceil(middle*1000)/1000+.001;
  for(const seconds of [e.performStart+.001,middle-.001]){
   const first=api.snapshot(at(day,seconds),options).entries.find(p=>p.id===e.card.targetPerson);
   assert.equal(first.behaviorKind,'chairman-desk-reply');assert.equal(first.line,'급하게 인스타 끄는 중');assert.equal(first.shortLine,'인스타 끄는 중');
  }
  for(const seconds of [secondHalf,e.performEnd-.001]){
   const snap=api.snapshot(at(day,seconds),options),staff=snap.entries.find(p=>p.id===e.card.targetPerson),chair=snap.entries.find(p=>p.id==='seongmin');
   assert.equal(staff.line,chair.line.includes('화면')?'회장님께 화면 설명 중':'회장님 질문 듣는 중');
  }
 }
});

test('consult: existing persistent actor slots render both sides without another timer',()=>{
 const {day,out}=records[0],e=out.find(e=>e.guestId&&out.find(g=>g.id===e.guestId)?.visitor.kind==='client'),guest=out.find(g=>g.id===e.guestId),f=fixture('10:00',false,null,table),nodes=[...f.ids.get('haniOfficeActors').children];
 f.context.window.HaniOfficePresence={chairman:'active'};f.setDateTime(at(day,(e.performStart+e.performEnd)/2));f.click('1f');
 const staff=f.visible().find(a=>a.dataset.person===e.people[0].id),visitor=f.visible().find(a=>a.dataset.person===guest.people[0].id);
 assert.ok(staff&&visitor);assert.equal(staff.officeText.textContent,'상담 중');assert.equal(visitor.officeText.textContent,'상담 받는 중');assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);assert.equal(f.timers.length,2);
});
