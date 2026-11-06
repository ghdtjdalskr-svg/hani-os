import {createHash} from 'node:crypto';
// Execute the existing label owner, scheduler and mounted renderer; no mock label logic.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {restoreResidentsSource} from './hani-office-residents-source.mjs';
import {readTlayoutPlans} from './hani-office-tlayout-fixture.mjs';

const source=fs.readFileSync('hani-office-live.js','utf8'),css=fs.readFileSync('hani-office-live.css','utf8');
const {scene,table}=loadScene(),s=scene.scheduler;
const owner=source.slice(source.indexOf('  function activityStatus('),source.indexOf('  // Batch reset'));
const ui=phone=>vm.runInNewContext(owner+';({label,activityStatus,headIcon})',{HaniBuildingScene:scene,matchMedia:()=>({matches:phone})});
function actorFor(p={}){
 const node=()=>({dataset:{},textContent:'',setAttribute(k,v){this[k]=v}}),status=node(),icon=node(),dot=node();
 const actor={dataset:{name:p.name||p.id||'수아',activity:p.activity||'work',walking:String(!!p.walking),zone:p.seat?.zone||'desk',place:p.placeId||'',behavior:p.state||'AT_HOME',line:p.line||'자료 확인 중',emoji:p.emoji||'',plain:String(!!p.plain)},setAttribute(k,v){this[k]=v},querySelector:q=>({'.hani-office-status':status,'.hani-office-activity-icon':icon,'.hani-office-status-dot':dot})[q]};
 return {actor,status,icon,dot};
}
const section=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i);assert.ok(i>=0&&j>i,a);return text.slice(i,j)};

test('icons: actual consulting and candidate pairs retain exact phone text and purple state at both widths',()=>{
 for(const chairmanPresent of [false,true]){
  const day='2026-11-02',options={chairmanPresent},formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options);
  for(const kind of ['client','candidate']){
   const guest=out.find(g=>g.visitor?.kind===kind&&out.some(h=>h.guestId===g.id));assert.ok(guest,kind);
   const host=out.find(h=>h.guestId===guest.id),snap=s.snapshot(at(day,(host.performStart+host.performEnd)/2),options);
   const pair=[snap.entries.find(p=>p.outingId===host.id),snap.visitors.find(p=>p.outingId===guest.id)];
   assert.ok(pair.every(p=>p.state==='AT_PLACE'&&!p.walking));
   for(const phone of [false,true])for(const [i,p]of pair.entries()){
    const {actor,status}=actorFor(p),api=ui(phone);api.label(actor,p.line);
    assert.equal(actor.dataset.status,'meeting',p.line);assert.equal(api.headIcon(actor),'💬');
    const expected=kind==='candidate'?(i?'면접 보기':'면접 진행'):(i?'상담 받기':'상담 중');
    assert.equal(status.textContent,'💬 '+(phone?expected.replaceAll(' ',''):expected));
    const exact=phone?expected.replaceAll(' ',''):expected,used=new Set([exact]);assert.equal(scene.labels.short(p.line,used,actor.dataset.status,phone),exact,'another actor cannot replace the required phrase');
   }
  }
 }
 assert.match(css,/\[data-status="meeting"\]\{--activity-bg:#7354ca;--activity-ink:#fff;--activity-border:#7354ca\}/);
});

test('icons: caught-out and reply lines keep the joke and are work, even at a lounge home',()=>{
 for(const [line,short,head]of [['급하게 인스타 끄는 중','인스타끄기','📱'],['급하게 창 닫는 중','창닫기','📱'],['회장님 질문 듣는 중','질문듣기',''],['회장님께 화면 설명 중','화면설명','']]){
  for(const phone of [false,true]){
   const {actor,status}=actorFor({line,seat:{zone:'lounge'}}),api=ui(phone);api.label(actor,line);
   assert.equal(actor.dataset.status,'work',line);assert.equal(status.textContent.replaceAll(' ',''),'💻'+short);assert.equal(api.headIcon(actor),head);
  }
 }
});

test('icons: ten frequent specific fallbacks have authored whole short phrases',()=>{
 for(const [line,short]of [['조용한 밤이라 메모가 잘 써지네요.','메모쓰기'],['오늘 기억할 장면을 적어둘게요.','장면기록'],['라운지에서 오늘 고생했다고 말하는 중','수고인사'],['소파에서 내일 할 일 적는 중','내일할일'],['라운지에서 마지막 버스 확인 중','막차확인'],['옥상 정원에서 화분 살피는 중','화분살피기'],['임원 라운지 소파에서 AI 오케스트레이션 메모 펼쳐 보는 중','AI메모'],['바뀐 범위부터 다시 확인할게요.','범위확인'],['다음 장도 천천히 볼까요.','다음장보기'],['자료 탭을 하나씩 맞춰볼게요.','자료맞추기']]){
  for(const state of ['work','rest'])for(const full of [line,'📝 '+line])assert.equal(scene.labels.short(full,new Set(),state,true),short,full);
 }
});

test('icons: semantic work/rest classification also covers errands, deliveries and personal idle lines',()=>{
 const api=ui(true);
 for(const line of ['사진첩 잠깐 넘기는 중','오늘 찍은 사진 고르는 중','다음 여행 사진 순서 바꾸는 중','내일 날씨 미리 보는 중','알람 소리 줄이는 중','물병 얼마나 남았나 보는 중','점심 후보 두 개로 줄이는 중','단백질 식단 사진 넘기는 중','퇴근 시간 카운트다운 중'])assert.equal(api.activityStatus(actorFor({line}).actor,line),'rest',line);
 for(const p of [{line:'택배 두고 갈게요',activity:'visit',seat:{zone:'lounge'}},{line:'배달 왔습니다!',activity:'visit',seat:{zone:'lounge'}},{line:'방문객 요청 확인 중',placeId:'visitor-host-approach_ilbo_board',seat:{zone:'lounge'}},{line:'회장님께 접수 메모 보고 중',placeId:'report-sua',seat:{zone:'lounge'}}])assert.equal(api.activityStatus(actorFor(p).actor,p.line),'work',p.line);
 const garden={line:'옥상 테라스에서 웃으며 대화 중',placeId:'terrace-5f',state:'AT_PLACE'};assert.equal(api.activityStatus(actorFor(garden).actor,garden.line),'rest');
 for(const state of ['GOING','RETURNING']){const p={line:'서버 콘솔로 가는 중',state};assert.equal(api.activityStatus(actorFor(p).actor,p.line),'moving','transport wait keeps travel classification')}
});

test('icons: special moment rules, combined-line precedence and existing performance emoji use the real helper',()=>{
 const api=ui(true);
 for(const [line,expected]of [['상담 중','💬'],['상담 받는 중','💬'],['면접 진행 중','💬'],['면접 보는 중','💬'],['면접 대기 중… 두근','💬'],['몰래 인스타 순찰 중','📱'],['급하게 창 닫는 중','📱'],['팬트리에서 커피 내리는 중','☕'],['카페 창가에서 창밖 구경 중','☕'],['HANI Coffee 주문 중','☕'],['점심 먹고 올게요','🍱'],['식사 중','🍱'],['도시락 먹는 중','🍱'],['저녁 먹는 중','🍱'],['옥상 정원에서 화분 살피는 중','🌿'],['테라스에서 쉬는 중','🌿'],['개발실 소파에서 쉬는 중','🛋️'],['로비 소파에서 커피 마시는 중','☕'],['협업 회의실에서 메모 정리 중','📋'],['회의 중','📋'],['로비 택배함에서 택배 확인 중','📦'],['배달 왔습니다!','📦']]){
  const {actor}=actorFor({line,state:'AT_PLACE'});assert.equal(api.headIcon(actor),expected,line);
  actor.dataset.emoji='⭐';assert.equal(api.headIcon(actor),'⭐','authored performance priority: '+line);
 }
 for(const line of ['자료 확인 중','보고서 작성 중','서버 점검 중','회의 자료 정리 중','회장님 질문 듣는 중','알 수 없는 행동'])assert.equal(api.headIcon(actorFor({line,plain:true}).actor),'',line);
 for(const extra of [{activity:'meeting'},{placeId:'meeting-1f'}])assert.equal(api.headIcon(actorFor({...extra,line:'메모 정리 중',state:'AT_PLACE'}).actor),'📋');
});

test('icons: walking, live travel and outbound/return elevator waits suppress every head icon',()=>{
 const api=ui(true);
 for(const line of ['상담 중','급하게 인스타 끄는 중','커피 마시는 중','점심 식사 중','옥상 정원','소파에서 쉬는 중','회의 중','택배 전달 중'])for(const emoji of ['', '⭐']){
  for(const state of [{walking:true},{state:'GOING'},{state:'RETURNING'}])assert.equal(api.headIcon(actorFor({line,emoji,...state}).actor),'',line);
  const {actor}=actorFor({line,emoji});actor.officeTravel={};assert.equal(api.headIcon(actor),'');
 }
});

test('icons: actual repeated phone/desktop/reduced renderer updates reuse nodes and skip unchanged prop writes',()=>{
 const day='2026-11-02',o={chairmanPresent:false},formal=s.plan(day,o),out=s.blockPlan(day,0,formal,o),guest=out.find(g=>g.visitor?.kind==='client'&&out.some(h=>h.guestId===g.id)),host=out.find(h=>h.guestId===guest.id),time=at(day,(host.performStart+host.performEnd)/2).toISOString();
 for(const phone of [false,true])for(const reduced of [false,true]){
  const f=fixture('09:00',reduced,()=>true,table,{matchMedia:q=>({matches:q==='(max-width:600px)'?phone:reduced,addEventListener(){}}),setTimeout:()=>0});
  const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
  f.map.getBoundingClientRect=()=>rect(0,0,phone?416:1440,phone?234:810);
  for(const [i,a]of f.ids.get('haniOfficeActors').children.entries()){
   a.getBoundingClientRect=()=>rect(20+i*15,120,30,40);a.querySelector('.hani-office-sprite').getBoundingClientRect=()=>a.getBoundingClientRect();
   a.querySelector('.hani-office-name').getBoundingClientRect=()=>rect(0,0,phone?85:120,10);a.querySelector('.hani-office-status').getBoundingClientRect=()=>rect(0,0,80,14);
  }
  f.setDateTime(time);f.click('1f');
  const layer=f.ids.get('haniOfficeActors'),slots=[...layer.children],all=f.root.querySelectorAll('*'),actor=f.visible().find(a=>a.dataset.person===host.people[0].id);assert.ok(actor);
  assert.equal(actor.dataset.status,'meeting');assert.ok(actor.officeCompact.textContent.includes(phone?'상담중':''));
  const prop=actor.querySelector('.hani-office-prop');assert.equal(prop.textContent,'💬');assert.equal(prop.getAttribute('aria-hidden'),'true');
  let writes=0,creates=0;const descriptor=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(prop),'textContent'),create=f.document.createElement;
  Object.defineProperty(prop,'textContent',{get(){return descriptor.get.call(this)},set(value){writes++;descriptor.set.call(this,value)}});
  f.document.createElement=(...args)=>{creates++;return create(...args)};
  for(let i=0;i<12;i++)f.click('1f');
  assert.equal(writes,0,'same icon never rewrites textContent');assert.equal(creates,0,'no DOM node per update');assert.deepEqual(layer.children,slots);assert.deepEqual(f.root.querySelectorAll('*'),all);
  f.setDateTime(at(day,host.end+1).toISOString());f.click('1f');assert.notEqual(prop.textContent,'💬','the persistent icon clears after consultation');
 }
 assert.match(css,/\.hani-office-prop\{[^}]*z-index:4;left:100%;top:2px;[^}]*border-radius:50%;background:#fff;[^}]*font-size:18px;[^}]*pointer-events:none;animation:none;transition:none/);
 assert.match(css,/@media\(max-width:600px\)\{\.hani-office-prop\{font-size:14px\}\}/);
 assert.match(css,/\.hani-office-actor \.hani-office-prop:not\(:empty\)\{display:block\}/);
 for(const pose of ['walk-a','walk-b'])assert.ok(css.includes('.hani-office-actor[data-pose="'+pose+'"] .hani-office-prop:not(:empty)'),'case-meeting travel is hidden immediately at its existing walking pose');
});

test('icons: scheduler, home clearance, public snapshots and both label geometry owners are byte identical to 15747bc',()=>{
 // Restore only the frozen, exact reviewed resident lines before the existing byte pins.
 const restored=restoreResidentsSource(source);
 const original=readAt('hani-office-live.js','15747bc');
 for(const [a,b]of [['  function createScheduler(','  // Read-only label geometry'],['  function snapshot(now=new Date()','  function profile('],['    function screenHomeClear(','    function stationaryStops('],['  function placeStatusLabels(','  const scheduler='],['  function fitStatusLabels(','  if(buildingChairmanSlot())people.push']])assert.equal(section(restored,a,b),section(original,a,b),a);
 // One tap bubble slot and its ✕ button, three lobby frame elements, one persistent heart per pet, the owner event button, panel and choice-button creation paths, the barista hotspot, the live prop layer with one prop creation path, and (v2.9.273) one night barista patch.
 for(const token of ['setInterval(','setTimeout(','document.createElement(','fetch('])assert.equal(source.split(token).length,original.split(token).length+(token==='document.createElement('?13:token==='setTimeout('?2:0),token);
 assert.equal(source.split(/event(?:End|Cooldown)Timer=setTimeout\(/).length-1,2,'owner events own exactly two new timeouts');assert.equal(source.split("const baristaNight=document.createElement('span')").length-1,1,'one night barista patch (v2.9.273)');assert.equal(source.split("eventButton=document.createElement('button')").length-1,1,'one persistent event button');assert.equal(source.split("eventPanel=document.createElement('div')").length-1,1,'one persistent event panel');assert.equal(source.split("const button=document.createElement('button');button.id=id==='snack'").length-1,1,'one choice button per event, created once');
 assert.equal(source.split("heart=document.createElement('span')").length-1,1,'one persistent heart creation path');assert.equal(source.split("bubbleClose=document.createElement('button')").length-1,1,'one bubble close button');assert.equal(source.split("baristaButton=document.createElement('button')").length-1,1,'one barista hotspot');assert.equal(source.split("livePropLayer=document.createElement('div')").length-1,1,'one live prop layer');assert.equal(source.split("const prop=document.createElement('span');prop.className='hani-office-live-prop'").length-1,1,'one live prop creation path');
 for(const listener of ["eventButton.addEventListener('click',","eventPanel.addEventListener('keydown',","button.addEventListener('click',()=>runOwnerEvent(id))"])assert.equal(source.split(listener).length-1,1,listener);
 assert.equal(source.split('addEventListener(').length,original.split('addEventListener(').length+3,'only the owner event button, panel and choice buttons add event listeners');
 assert.equal(source.split("bubbleSprite=document.createElement('div')").length,2);
 assert.doesNotMatch(source,/localStorage|sessionStorage|supabase/);
});

const digest=x=>createHash('sha256').update(x).digest('hex');
// G moved seats on purpose, so this guard follows the frozen G output instead of 15747bc.
test('icons: complete plan/blockPlan and sampled snapshot JSON match the approved G output',()=>{
 for(const r of readTlayoutPlans().records){
  const f=s.plan(r.day,r.options),o=s.blockPlan(r.day,0,f,r.options);
  assert.equal(digest(JSON.stringify(f)),r.formalSha256,r.label+' plan');assert.equal(digest(JSON.stringify(o)),r.outingsSha256,r.label+' blockPlan');
 }
});