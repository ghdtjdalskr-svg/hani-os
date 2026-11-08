import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import inverse from './hani-seoyun-m9-source.cjs';
<<<<<<< HEAD
import kidsPoseB from './hani-office-kids-pose-b-source.cjs';
=======
import capInverse from './hani-office-affinity-cap-source.cjs';
>>>>>>> origin/main
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const require=createRequire(import.meta.url),{delta,hash,restoreSeoyunM9Source:restore}=inverse;
<<<<<<< HEAD
const read=f=>kidsPoseB.projectPreKidsPoseBSource(fs.readFileSync(f,'utf8'),f),plain=x=>JSON.parse(JSON.stringify(x));
const readBytes=f=>kidsPoseB.delta.files.some(row=>row.file===f)?Buffer.from(read(f)):fs.readFileSync(f);
=======
const read=f=>capInverse.projectPreAffinityCapSource(fs.readFileSync(f,'utf8'),f),plain=x=>JSON.parse(JSON.stringify(x));
>>>>>>> origin/main
const originalBytes=fs.readFileSync('artifacts/seoyun-m9/originals.json');
// 2.9.280 release advanced only the index.html/hani-main.js version strings; their pinned digests were refreshed to main 985cc15.
// 2.9.281 release likewise advanced only those version strings; digests refreshed to main 43eda9e.
// 2.9.282 release likewise advanced only those version strings; digests refreshed to main 86feee3.
// 2.9.283 + life-bundle are exact outer inverses installed by the polish
// preload. Keep these lower-layer pins and the 161-file closure assertion.
assert.equal(hash(originalBytes),'358c6a3db4d1bea61751d7ed4d62d44c63c50103802c5125e9007f382162aa1a');
const original=JSON.parse(originalBytes),ui=require('../hani-character-archive.js'),data=require('../hani-character-archive-data.js');
const lines=["M9 합류했어요. 시가총액은… 천천히 따라갈게요 💜","전무님이 '아직?'이라고 하셨어요. 무기한이래요…","M9에 온 걸 환영해요, 서윤아♡ 시총은 천천히 따라오세요.","M9 합류 확인. 검증 결과 PASS입니다.","M10 개편 비용 0원. 좋은 결정이었어요.","신규상장 첫 표정, 아직 제 폴더에 있어요📸","서윤 언니~♡ 이제 M9이야? 축하해!","…서윤 이모, 축하해요. 그냥 하는 말 아니에요.","박스 공급 조건은 유지됩니다.","…멍. (꼬리를 툭 한 번)"];
const {scene,table}=loadScene();

test('exact outer inverse restores fixed bytes and rejects missing, duplicated, partial and unrelated edits',()=>{
 for(const row of delta.files){const current=read(row.file),before=restore(current,row.file);let forward=before;
  assert.equal(hash(before),row.beforeSha256);for(const r of row.replacements){assert.notEqual(r.before,r.after);assert.equal(forward.split(r.before).length-1,1);forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restore(current.replace(r.after,()=>r.before),row.file));assert.throws(()=>restore(current+r.after,row.file));}
  assert.equal(forward,current);for(const bad of [current+'\n',current.slice(1),before,current+current])assert.throws(()=>restore(bad,row.file));
 }assert.throws(()=>restore(read('hani-main.js'),'hani-main.js'));
});

test('one special presentation card follows all nine unchanged M9 cards; MIR and original profiles keep their bytes/order',()=>{
 assert.deepEqual(data.characters.filter(c=>c.type==='m9_member'),original.members);
 const cards=[...ui.page().matchAll(/<article class="ca-character-card[\s\S]*?<\/article>/g)].map(m=>m[0]);
 assert.equal(cards.length,13);const special=cards.filter(c=>c.includes('data-special-listing="seoyun"'));assert.equal(special.length,1);assert.equal(cards.indexOf(special[0]),9);
 assert.deepEqual(cards.filter(c=>!special.includes(c)),original.cards);assert.match(cards[10],/data-character-card="mir"/);assert.match(cards[10],/ca-cover-number">10</);
 for(const text of ['M9 특별 합류 · Platform Architect','M9 SPECIAL LISTING','Technology Integration · Architecture · Delivery','회장님의 아이디어와 M9의 전문성을 실제로 작동하는 시스템으로 연결하는 기술 파트너.','AI STAFF · AI플랫폼개발실 · 팀장'])assert.ok(special[0].includes(text));
 assert.match(special[0],/src="\.\/assets\/profiles\/hani-profile-seoyun.webp"/);
 for(const [file,digest]of Object.entries({...original.assets,...original.files}))assert.equal(hash(readBytes(file)),digest,file+' unchanged');
});

function organization(){
 const nodes=new Map();class Node{constructor(){this.dataset={};this.style={setProperty(){}};this.events={};this.value='';this.innerHTML='';}querySelector(s){if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s)}querySelectorAll(){return []}addEventListener(k,fn){this.events[k]=fn}setAttribute(){}append(){}after(){}insertAdjacentHTML(){}contains(){return true}focus(){}showModal(){this.open=true}close(){this.open=false}}
 const root=new Node();root.dataset.hubTab='people';const deny=()=>{throw Error('forbidden persistence')};
 const context={window:{addEventListener(){}},document:{getElementById:()=>root,querySelector:s=>s==='.organization-tabs'?{}:null,querySelectorAll:()=>[],createElement:()=>new Node()},localStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny,commit:deny};
 vm.runInNewContext(read('hani-organization-hub.js'),context);return {context,root,nodes};
}
test('canonical organization renderer renders badge in chart/team/directory and existing person modal; classification and filter stay unchanged',()=>{
 const {context,root,nodes}=organization(),roster=context.window.HaniOrganizationRoster;
 const p=roster.people.find(p=>p.id==='seoyun');assert.equal(p.group,'AI STAFF');assert.equal(p.team,'platform');assert.equal(p.rank,'개발 리드');assert.equal(roster.people.filter(p=>p.group==='M9').length,9);assert.equal(roster.people.length,19);
 assert.equal((root.innerHTML.match(/M9 특별 합류 · Platform Architect/g)||[]).length,3,'chart, team and directory use same renderer helper');
 const current=plain(roster.people);const old={window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]}};vm.runInNewContext(restore(read('hani-organization-hub.js'),'hani-organization-hub.js'),old);assert.deepEqual(current,plain(old.window.HaniOrganizationRoster.people));
 context.window.HaniOrganizationHub.selectTab('aiTeam');assert.equal(nodes.get('[data-card-person="seoyun"]').hidden,false);assert.equal(nodes.get('[data-card-person="hani"]').hidden,true);
 assert.ok(context.window.HaniOrganizationHub.openPerson('seoyun'));assert.match(nodes.get('.ogh-detail').innerHTML,/M9 특별 합류 · Platform Architect/);assert.match(nodes.get('.ogh-detail').innerHTML,/AI STAFF \/ AI PLATFORM/);
});

test('all six staff lines reach the existing friend slot without changing normal/triple-tap cadence or old dialogue pools',async()=>{
 const bank=JSON.parse(read('assets/data/office-tap-lines-v1.json')),roster=assets.canon.people;
 const source=read('hani-office-live.js');for(const line of lines)assert.equal(source.split(line).length-1,1,line);
 const c=vm.createContext({HaniOfficeV2Assets:assets,HaniOfficeActions221:table,document:{getElementById:()=>null},window:{},fetch:async url=>({ok:url.includes('tap-lines'),json:async()=>bank})});vm.runInContext(source,c);
 for(const [id,wanted] of [['seoyun',lines.slice(0,2)],['hani',[lines[2]]],['yuri',[lines[3]]],['jieun',[lines[4]]],['minji',[lines[5]]]]){
  const owner=c.HaniBuildingScene.tapLines.create(roster);await owner.load();const shown=[];
  for(let i=0;i<35;i++){const result=owner.tap(id,at('2026-11-08',43200+i*3));shown.push(result.line);assert.equal(result.speaker,id);if(i%5!==4)assert.ok([...bank.staff[id].day,...bank.staff[id].toChairman].includes(result.line));}
  for(const text of [bank.staff[id].friend,...wanted])assert.ok(shown.includes(text),id+': '+text);
  const fresh=c.HaniBuildingScene.tapLines.create(roster);await fresh.load();let burst;for(let i=0;i<3;i++)burst=fresh.tap(id,at('2026-11-08',43200+i));assert.equal(burst.line,bank.staff[id].tripleTap);
 }
});

test('siblings speak both new lines through the existing Seoyun visit, on the same floor and after unchanged original lines',()=>{
 const r=scene.residents,owner=r.createKidsVisits(),now=at('2026-11-07',36000),staff=scene.snapshot(now,{chairmanPresent:true});
 const people=staff.floors.flatMap(f=>f.people),chair=people.find(p=>p.id==='seongmin');chair.floor='3f';chair.walking=false;chair.position=[58,60];
 const seoyun=people.find(p=>p.id==='seoyun');seoyun.floor='3f';seoyun.walking=false;seoyun.position=[52,64];seoyun.state='AT_HOME';
 const only={floors:[{id:'3f',people:[chair,seoyun]}]};let visit=null;
 for(let i=0;i<2;i++){const states=r.companionSnapshot(now,only,true,true);visit=owner.request(now,only,states,'kid-suyeon',true);assert.ok(visit);assert.equal(visit.actorId,'seoyun');assert.equal(visit.floor,'3f');}
 const pair=r.kidsVisitLines.find(p=>p.actorId==='seoyun');assert.deepEqual(plain(visit.lines.slice(0,4).map(l=>l.text)),plain(pair.lines.map(l=>l.text)));assert.deepEqual(plain(visit.lines.slice(-2).map(l=>l.text)),lines.slice(6,8));
 const observed=[];for(let sec=0;sec<25;sec+=.2){const states=r.companionSnapshot(now,only,true,true),v=owner.update(new Date(now.getTime()+sec*1000),only,states,true);if(v?.line&&!observed.includes(v.line.text))observed.push(v.line.text);}for(const text of lines.slice(6,8))assert.ok(observed.includes(text));
});

test('both Seoyun lines reach the real delegated trusted tap bubble before the existing affinity secret takeover',async()=>{
 const bank=JSON.parse(read('assets/data/office-tap-lines-v1.json')),writes=[],requests=[];
 const f=fixture('09:00',false,()=>true,table,{setTimeout:()=>0,fetch:async url=>{requests.push(url);return {ok:url.includes('tap-lines'),json:async()=>bank}},localStorage:{getItem:()=>null,setItem:(...args)=>writes.push(args)}});
 for(let i=0;i<12;i++)await Promise.resolve();f.click('3f');
 const layer=f.ids.get('haniOfficeActors'),actor=layer.children.find(a=>a.dataset.person==='seoyun'),bubble=f.map.children.find(a=>a.className==='hani-office-character-bubble'),shown=[];
 for(let i=0;i<12;i++){f.setDateTime(at('2026-11-08',32400+i*3).toISOString());actor.hidden=false;actor.dataset.action='base-work';actor.dataset.walking='false';delete actor.dataset.event;actor.officeTravel=null;
  layer.events.click({type:'click',target:actor,isTrusted:true});for(let j=0;j<12;j++)await Promise.resolve();shown.push(bubble.children[0].textContent);assert.ok(layer.children.filter(a=>a.dataset.speaking==='true').length<=1);
 }for(const text of lines.slice(0,2))assert.ok(shown.some(s=>s.includes(text)),text+' reaches mounted bubble: '+JSON.stringify({shown,requests,dataset:actor.dataset,valid:f.context.HaniBuildingScene.tapLines.validate(bank,f.context.HaniBuildingScene.canon.people)}));assert.deepEqual(writes,[],'tap test never flushes existing delayed affinity storage');
});

test('Cheese retains all tap lines with one addition; Bori new affection line requires a nearby, same-floor Seoyun',()=>{
 const r=scene.residents,old=loadScene({transform:s=>restore(s)}).scene.residents;
 assert.deepEqual(plain(r.people.find(p=>p.id==='pet-cat').lines),[...plain(old.people.find(p=>p.id==='pet-cat').lines),lines[8]]);
 let near=false,other=false;for(let sec=36000;sec<36500;sec++){
  const pet={id:'pet-bori',pet:true,floor:'1f',position:[50,70],walking:false,pose:'sitting'};
  const peer={id:'seoyun',floor:'1f',position:[62,70],walking:false,activity:'work',state:'AT_HOME'};
  const v=r.affection(at('2026-11-08',sec),[pet],[peer])[0];if(v.affection?.petLine===lines[9])near=true;
  for(const p of [{...peer,id:'yuna'},{...peer,floor:'3f'},{...peer,position:[90,70]}]){const otherPet={...pet};delete otherPet.affection;const result=r.affection(at('2026-11-08',sec),[otherPet],[p])[0];if(result.affection?.petLine===lines[9])other=true;}
 }assert.ok(near,'real affection owner emits Bori line');assert.equal(other,false);
});

test('raw mounted PC/phone preserves one persistent bubble, listeners/timers, zero writes and unchanged phone geometry owner',()=>{
 const deny=()=>{throw Error('unexpected storage write')};const env={setTimeout:()=>0,localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny}};
 for(const width of [1280,390]){const a=fixture('12:00',false,()=>true,table,{...env,innerWidth:width}),b=fixture('12:00',false,()=>true,table,{...env,innerWidth:width},s=>restore(s));assert.deepEqual(a.timers.map(t=>t.ms),b.timers.map(t=>t.ms));assert.deepEqual(Object.keys(a.document.events),Object.keys(b.document.events));
  const actors=a.ids.get('haniOfficeActors'),slots=actors.children.slice();for(const floor of ['1f','2f','3f','4f','5f']){a.click(floor);a.timers.find(t=>t.ms===100).fn();assert.ok(actors.children.filter(x=>x.dataset.speaking==='true').length<=1);}assert.deepEqual(actors.children,slots);assert.equal(a.map.children.filter(x=>x.className==='hani-office-character-bubble').length,1);
 }
 const src=read('hani-office-live.js'),before=restore(src);for(const re of [/\bsetTimeout\s*\(/g,/\bsetInterval\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal([...src.matchAll(re)].length,[...before.matchAll(re)].length);
 const cut=s=>s.slice(s.indexOf('  function fitBubble('),s.indexOf('  function closeBubble('));assert.equal(cut(src),cut(before));
});

test('runtime closure stays identical with zero missing files; new code adds no storage, Cloud, timer or listener operations',async()=>{
 const raw=f=>fs.readFileSync(f),a=await resolveRuntimeClosure({exists:fs.existsSync,read:raw}),b=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>delta.files.some(r=>r.file===f)?Buffer.from(restore(read(f),f)):raw(f)});
 assert.deepEqual(a.files,b.files);assert.deepEqual(a.missing,[]);assert.equal(a.files.length,161);
 for(const row of delta.files)for(const r of row.replacements){const added=r.after;for(const re of [/\b(?:localStorage|sessionStorage|cloudClient|supabase)\b/,/\b(?:setInterval|setTimeout|addEventListener)\s*\(/,/\b(?:save|commit)\s*\(/])assert.doesNotMatch(added,re);}
});
