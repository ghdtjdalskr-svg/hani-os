// Raw runtime integration: no preservation projection or user data.
// Preserve raw Ieum integration; remove only the unrelated exact chibi delta.
import './hani-chibi-pack-1-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {monthlyQueenThread} from './hani-board-library-build.mjs';
const require=createRequire(import.meta.url),read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),json=f=>JSON.parse(read(f));
const releases=require('./hani-release-version-layers.cjs'),featureRead=file=>releases.projectPreRelease290Source(read(file),file);
const office=read('hani-office-live.js'),assets={canon:json('data/hani-building/spatial-contract.json'),art:json('data/hani-building/art-map-v1.json'),places:json('data/hani-building/office-places.json'),sprites:json('assets/sprites-v2/manifest.json'),spritesV3:json('assets/sprites-v3/manifest-v3.json')};
const table=json('assets/data/office-actions-221.json'),data=require('../hani-character-archive-data.js'),album=require('../hani-character-archive.js');
const context=vm.createContext({HaniOfficeV2Assets:assets,HaniOfficeActions221:table,window:{},document:{getElementById:()=>null}});
vm.runInContext(read('hani-organization-hub.js'),context);vm.runInContext(office,context);
const scene=context.HaniBuildingScene,roster=context.window.HaniOrganizationRoster,plain=x=>JSON.parse(JSON.stringify(x));
const at=(time,day='2026-11-12')=>new Date(`${day}T${time}+09:00`),flush=async()=>{for(let i=0;i<35;i++)await Promise.resolve()};
// Reuse only the existing DOM fixture factory, without importing its historical tests.
const fixtureFile=read('scripts/hani-building-206-engine.test.mjs');
const fixture=vm.runInNewContext(fixtureFile.slice(fixtureFile.indexOf('export function fixture'),fixtureFile.indexOf("test('actual owner")).replace('export function','function')+';fixture;',{assets,read,vm,setTimeout,console});
function mounted(time=at('11:00'),actions=null){
 const writes=[],deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('11:00',true,()=>true,actions,{HaniOfficeV2Assets:assets,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},save:deny});
 f.ids.set('app',{classList:{contains:()=>false}});f.context.window.HaniOfficePresence={chairman:'absent'};f.setDateTime(time.toISOString());f.click('4f');return {f,writes};
}
test('raw roster, main card and archive use the confirmed canon and 4F strategy membership',()=>{
 assert.equal(roster.people.length,20);const p=roster.people.find(p=>p.id==='ieum');assert.equal(p.name,'이음');assert.equal(p.rank,'사원');assert.equal(p.team,'strategy');assert.equal(p.floor,'4F');assert.equal(p.registration,'registered');
 const c=data.characters.find(c=>c.id==='ieum');assert.equal(c.mbti,'INFJ');assert.equal(c.birthday,'06-03');assert.equal(c.coreIdentity,'흩어진 기록의 맥락을 연결하고, 열린 상태를 끝까지 닫는 꼼꼼한 신입.');assert.match(c.canon,/비공식 첫 선배/);assert.match(album.page(),/이음/);assert.match(album.detail(c),/Records &amp; Knowledge Ops|Records & Knowledge Ops/);
 const main=read('hani-main.js'),images=main.slice(main.indexOf('const canonicalProfileImages='),main.indexOf('const pageAgentImage=')),cards=main.slice(main.indexOf('// Identity and navigation stay local;'),main.indexOf('// ===== v2.9.0 Campus MVP'));
 const ctx=vm.createContext({team:[],document:{querySelectorAll:()=>[]},$:()=>null,esc:String,AbortController,setTimeout,clearTimeout});vm.runInContext(images+main.slice(main.indexOf('const team=['),main.indexOf('// Identity and navigation stay local;'))+cards,ctx);
 const html=vm.runInContext("teamCard(team.find(p=>p.key==='ieum'))",ctx);assert.match(html,/이음/);assert.match(html,/hani-profile-ieum/);assert.doesNotMatch(html,/입사 예정|undefined/);
});
test('4F home seat and connected route preserve all existing 326 contract anchors',()=>{
 assert.equal(assets.canon.anchors.length,326);const seat=scene.homeSeat('ieum');assert.equal(seat.anchor,'desk_ieum');assert.equal(seat.owner,'ieum');assert.ok(scene.floors.find(f=>f.id==='4f').residents.includes('ieum'));
 for(const id of ['desk_ieum','side_desk_ieum','approach_desk_ieum']){assert.ok(scene.anchors.has(id));assert.ok(assets.places.edges.some(e=>e.from===id||e.to===id))}
 const route=scene.route('elevator_4f','desk_ieum');assert.ok(route.length>=4);assert.equal(route.at(-1).id,'desk_ieum');assert.ok(route.every(a=>a.floor==='4f'));
 assert.ok(Math.hypot((seat.x-scene.homeSeat('hani').x)*16.72,(seat.y-scene.homeSeat('hani').y)*9.41)>=120);
 const before=JSON.parse(require('./hani-join-ieum-source.cjs').restore(featureRead('data/hani-building/spatial-contract.json'),'data/hani-building/spatial-contract.json'));assert.deepEqual(assets.canon.anchors,before.anchors);assert.deepEqual(assets.canon.people.filter(p=>p.id!=='ieum'),before.people);
});
test('raw organization chart, team, directory and person dialog render Ieum through the canonical owner',()=>{
 const nodes=new Map();class Node{constructor(){this.dataset={};this.style={setProperty(){}};this.events={};this.value='';this.innerHTML='';}querySelector(s){if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s)}querySelectorAll(){return []}addEventListener(k,fn){this.events[k]=fn}setAttribute(){}append(){}after(){}insertAdjacentHTML(){}contains(){return true}focus(){}showModal(){this.open=true}close(){this.open=false}}
 const root=new Node();root.dataset.hubTab='people';const deny=()=>{throw Error('unexpected persistence')};
 const ctx={window:{HANI_CHARACTER_ARCHIVE_DATA:data,addEventListener(){}},document:{getElementById:()=>root,querySelector:s=>s==='.organization-tabs'?{}:null,querySelectorAll:()=>[],createElement:()=>new Node()},localStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny,commit:deny};
 vm.runInNewContext(read('hani-organization-hub.js'),ctx);
 assert.equal((root.innerHTML.match(/data-person="ieum"/g)||[]).length,3,'chart, team and directory');
 ctx.window.HaniOrganizationHub.selectTab('aiTeam');assert.equal(nodes.get('[data-card-person="ieum"]').hidden,false);
 assert.equal(ctx.window.HaniOrganizationHub.openPerson('ieum'),true);assert.equal(nodes.get('dialog').open,true);
 for(const value of [/이음/,/4F/,/Records &amp; Knowledge Ops|Records & Knowledge Ops/,/흩어진 기록의 맥락/])assert.match(nodes.get('.ogh-detail').innerHTML,value);
 assert.match(album.detail(data.characters.find(c=>c.id==='ieum')),/비공식 첫 선배/,'mentor canon is shown by the existing full archive detail');
 assert.doesNotMatch(nodes.get('.ogh-detail').innerHTML,/undefined|입사 예정/);
});
test('existing staff portraits, seats, tap pools and organization membership remain unchanged with no new persistence, timer or event path',()=>{
 const {restore,delta}=require('./hani-join-ieum-source.cjs'),before=file=>JSON.parse(restore(featureRead(file),file));
 const oldRoster={window:{},document:{getElementById:()=>null}};vm.runInNewContext(restore(featureRead('hani-organization-hub.js'),'hani-organization-hub.js'),oldRoster);
 assert.deepEqual(plain(roster.people.filter(p=>p.id!=='ieum')),plain(oldRoster.window.HaniOrganizationRoster.people));
 assert.deepEqual(assets.spritesV3.entries.filter(p=>p.id!=='ieum'),before('assets/sprites-v3/manifest-v3.json').entries);
 const tap=json('assets/data/office-tap-lines-v1.json'),oldTap=before('assets/data/office-tap-lines-v1.json');for(const id of Object.keys(oldTap.staff))assert.deepEqual(tap.staff[id],oldTap.staff[id],id+' tap pool');
 for(const row of delta.files.filter(r=>/\.js$/.test(r.file)))for(const pattern of [/\b(?:setTimeout|setInterval|addEventListener)\s*\(/g,/\b(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem|clear)\s*\(/g,/\b(?:insert|upsert|update|delete)\s*\(/g])assert.deepEqual(read(row.file).match(pattern),restore(featureRead(row.file),row.file).match(pattern),row.file+' unchanged operation count');
});
test('existing scheduler really includes Ieum at work and in motion, in both action catalogs',()=>{
 for(const version of ['216','221']){const t=json(`assets/data/office-actions-${version}.json`);assert.equal(t.people.filter(p=>p.id==='ieum').length,1);const base=t.actions.find(a=>a.id==='base-work');assert.ok(base.participants.includes('ieum'));assert.ok(base.places.some(p=>p.anchorId==='desk_ieum'))}
 let present=0,moving=0;for(let minute=9*60;minute<18*60;minute+=5){const snap=scene.snapshot(at(`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`),{chairmanPresent:false});for(const f of snap.floors){const p=f.people.find(p=>p.id==='ieum');if(p){present++;if(p.walking||p.travel)moving++;assert.ok(Number.isFinite(p.seat?.x??p.position?.[0]))}}}
 assert.ok(present>60,'actual workday snapshots');assert.ok(moving>0,'actual walking schedule');
});
test('tap catalog validates and existing tap cursor emits both catchphrases',async()=>{
 const bank=json('assets/data/office-tap-lines-v1.json');assert.equal(scene.tapLines.validate(bank,assets.canon.people),true);
 const ctx=vm.createContext({HaniOfficeV2Assets:assets,HaniOfficeActions221:table,window:{},document:{getElementById:()=>null},fetch:async()=>({ok:true,json:async()=>bank})});vm.runInContext(office,ctx);const tap=ctx.HaniBuildingScene.tapLines.create(assets.canon.people);await tap.load();assert.equal(tap.tap('ieum',at('14:00')).line,'이거… 끝난 거 맞죠?');assert.equal(tap.tap('ieum',at('19:00')).line,'그럼 완료로 닫아둘게요.');
 for(const values of Object.values(bank.staff.ieum))for(const line of Array.isArray(values)?values:[values])assert.ok([...line].length<=28);
});
test('three dialogue scenes resolve actual Hani/Seoyun/Ieum IDs in the canonical chat owner',()=>{
 const chats=scene.scheduler.staffChatLines.filter(p=>p.id.startsWith('chat-ieum'));assert.equal(chats.length,3);for(const p of chats){assert.ok([p.aId,p.bId].includes('ieum'));assert.ok([p.aId,p.bId].some(id=>['hani','seoyun'].includes(id)));assert.ok(p.lines.length>=3)}
 assert.ok(scene.scheduler.errandPlaces.some(p=>p.targetPerson==='ieum'));assert.ok(assets.places.behavior.deskVoice.ieum.length>=4);
});
test('existing board author/avatar and monthly poll builder accept the raw 20-person roster',()=>{
 const board=read('hani-board.js'),start=board.indexOf('  function recentAuthors('),end=board.indexOf('  function themeFor(',start);
 const authors=vm.runInNewContext(board.slice(start,end)+';selectAuthors(99,[],[],Date.now(),"test")',{roster:()=>roster,posts:()=>[],comments:()=>[],person:id=>roster.people.find(p=>p.id===id),hash:()=>0});assert.equal(authors.length,20);assert.ok(authors.some(p=>p.id==='ieum'));
 const avatar=vm.runInNewContext(board.slice(board.indexOf('  function avatar('),board.indexOf('  function authorCard('))+';avatar;',{person:id=>roster.people.find(p=>p.id===id),actor:()=>roster.chairman.id,escape:String});assert.match(avatar('ieum'),/hani-profile-ieum-128.webp/);
 const poll=monthlyQueenThread({id:'queen-2026-11',date:'2026-11-01'},roster,{people:[],relations:[]});assert.equal(poll.comments.length,20);assert.ok(poll.poll.options.includes('이음'));assert.match(poll.comments.find(c=>c.authorId==='ieum').body,/끝난 거 맞죠/);
});
test('actual persistent actor, HD atlas and pose paths work without a legacy sprite',async()=>{
 const {f,writes}=mounted();await flush();const all=f.ids.get('haniOfficeActors').children,actor=all.find(a=>a.dataset.person==='ieum');assert.ok(actor);assert.equal(actor.hidden,false);assert.equal(actor.dataset.avatar,'v2');assert.equal(actor.dataset.spriteScale,'3');assert.match(actor.querySelector('.hani-office-sprite').style.backgroundImage,/sprites-v3\/ieum.webp/);assert.match(actor.querySelector('.hani-office-name').textContent,/이음/);
 for(const floor of ['3f','2f','1f','4f'])f.click(floor);assert.equal(f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person==='ieum'),actor);assert.equal(writes.length,0);
});
test('June 3 birthday button and event execute through the existing owner path',async()=>{
 const {f,writes}=mounted(at('12:00','2027-06-03'));await flush();const birthday=f.ids.get('haniOfficeEvent-birthday');assert.equal(birthday.hidden,false);birthday.events.click();const actor=f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person==='ieum');assert.equal(actor.querySelector('.hani-office-status').dataset.full,'생일 축하 중');assert.match(f.root.querySelector('.hani-office-character-bubble').textContent,/이음|제 생일/);assert.equal(writes.length,0);
 const next=mounted(at('12:00','2027-06-04'));assert.equal(next.f.ids.get('haniOfficeEvent-birthday').hidden,true);
});
test('all four final image assets decode, match frame/pivot/alpha and existing size budgets',async()=>{
 const sharp=require(process.env.HANI_SHARP_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')),entry=assets.spritesV3.entries.find(e=>e.id==='ieum');assert.equal(require('./hani-join-ieum-source.cjs').hash(fs.readFileSync(new URL('../assets/sprites-v3/ieum.webp',import.meta.url))),entry.sha256);
 for(const [file,size,budget]of [['assets/sprites-v3/ieum.webp',[1152,1536],100000],['assets/profiles/hani-profile-ieum.webp',[720,720],73844],['assets/profiles/thumb/hani-profile-ieum-128.webp',[128,128],6000],['assets/profiles/thumb/hani-profile-ieum-256.webp',[256,256],18000]]){const b=fs.readFileSync(new URL('../'+file,import.meta.url)),meta=await sharp(b).metadata();assert.deepEqual([meta.width,meta.height],size);assert.equal(meta.format,'webp');assert.ok(b.length<=budget);if(file.includes('sprites'))assert.equal(meta.hasAlpha,true)}
 assert.deepEqual(entry.frames.map(f=>f.pivot),[[72,183],[72,183],[72,183],[72,183]]);assert.ok(entry.alpha.transparent>1700000);
});
test('decoded sitting figures have zero alpha overlap at phone/PC widths using actual CSS sizing',async()=>{
 const sharp=require(process.env.HANI_SHARP_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
 for(const width of [300,342,390,1000,1280]){
  const height=Math.round(width*941/1672),actorHeight=Math.max(40,width*.068),w=Math.round(actorHeight*.75),h=Math.round(actorHeight),figures=[];
  for(const id of ['hani','ieum']){const e=assets.spritesV3.entries.find(e=>e.id===id),frame=e.frames.find(f=>f.name==='sitting'),seat=scene.homeSeat(id),alpha=await sharp(fs.readFileSync(new URL('../assets/sprites-v3/'+e.file,import.meta.url))).extract({left:frame.rect[0],top:frame.rect[1],width:144,height:192}).resize(w,h).ensureAlpha().raw().toBuffer();figures.push({alpha,w,h,left:Math.round(seat.x*width/100-w*.5),top:Math.round(seat.y*height/100-actorHeight*183/192)})}
  let overlap=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(figures.every(f=>{const xx=x-f.left,yy=y-f.top;return xx>=0&&yy>=0&&xx<f.w&&yy<f.h&&f.alpha[(yy*f.w+xx)*4+3]>32}))overlap++;
  assert.equal(overlap,0,'nontransparent figure overlap at map width '+width);
 }
});
test('exact inverse rejects mutation, duplicate fragments and repeated application for every owner',()=>{
 const {delta,restore,hash}=require('./hani-join-ieum-source.cjs');for(const row of delta.files){const source=featureRead(row.file),lower=restore(source,row.file);assert.equal(hash(lower),row.beforeSha256);assert.throws(()=>restore(source+' ',row.file));assert.throws(()=>restore(source+row.edits[0].after,row.file));assert.throws(()=>restore(lower,row.file));}
});
test('290 projection composes the frozen inverse for every owner and never blesses unknown bytes',()=>{
 const {delta,restore,project,hash}=require('./hani-join-ieum-source.cjs');
 for(const row of delta.files){
  const disk=read(row.file),feature=featureRead(row.file),before=restore(feature,row.file);
  assert.equal(project(disk,row.file),before);
  assert.deepEqual(project(Buffer.from(disk),row.file),Buffer.from(before));
  assert.equal(hash(project(disk,row.file)),row.beforeSha256);
  assert.equal(project(before,row.file),before,'already projected reads stay exact');
  for(const bad of [disk+'\n',disk.slice(1),disk+disk,disk.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.equal(project(bad,row.file),bad,'drift passes unchanged to the strict lower oracle');
   assert.throws(()=>restore(bad,row.file));
  }
 }
 assert.equal(project('unknown bytes','not-an-owner'),'unknown bytes');
});
test('read-only changes preserve storage calls, internal baseline and release version',()=>{
 const {restore}=require('./hani-join-ieum-source.cjs');for(const file of ['hani-main.js','hani-office-live.js']){const source=featureRead(file),lower=restore(source,file);const calls=s=>s.match(/(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(/g)||[];assert.deepEqual(calls(source),calls(lower));assert.equal((source.match(/hani_os_life_v23/g)||[]).length,(lower.match(/hani_os_life_v23/g)||[]).length);}
 assert.match(featureRead('index.html'),/2\.9\.289/);assert.match(read('hani-main.js'),/2\.9\.15-safe-baseline-bootstrap/);
});
test('pre-existing release 289 peels to independent 288 pins without relaxing older oracles',()=>{
 const frozen=require('./fixtures/join-ieum-release289-outer.json'),join=require('./hani-join-ieum-source.cjs');
 assert.equal(join.hash(fs.readFileSync(new URL('./fixtures/join-ieum-release289-outer.json',import.meta.url))),'54be6aa5c6a1c6ac548e7a4ffe3238ec0710fa0872c34d29d2195dba73904003','frozen supplied 289 delta');
 const layer={delta:frozen,restore:(source,file)=>releases.restoreVersionLayer(source,file,'2.9.289'),project:releases.projectPreRelease289Source};
 for(const row of frozen.files){const canonical=releases.getLayer('2.9.289').files[row.file];assert.equal(canonical.before,row.beforeSha256);assert.equal(canonical.after,row.afterSha256);assert.equal(row.beforeSha256,releases.getLayer('2.9.288').files[row.file].after,'independent 288 oracle');assert.equal(canonical.count,row.count||1);}
 for(const row of layer.delta.files){const raw=featureRead(row.file),source=join.delta.files.some(r=>r.file===row.file)?join.restore(raw,row.file):raw,lower=layer.restore(source,row.file);assert.equal(join.hash(lower),row.beforeSha256);assert.throws(()=>layer.restore(source+' ',row.file));assert.throws(()=>layer.restore(lower,row.file));assert.equal(layer.project(source+' ',row.file),source+' ')}
});
test('raw runtime closure stays within the gate file limit with no missing assets',async()=>{
 const r=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read:f=>fs.readFileSync(new URL('../'+f,import.meta.url))});assert.deepEqual(r.missing,[]);const contract=json('dev-center/one-pass-gate-contract.json');assert.ok(r.files.length<=200);assert.ok(r.files.length<=contract.limits.max_files);const sizes=r.files.map(f=>fs.statSync(new URL('../'+f,import.meta.url)).size);assert.ok(sizes.reduce((sum,n)=>sum+n,0)<=contract.limits.max_total_bytes);assert.ok(sizes.every(n=>n<=contract.limits.max_single_file_bytes));assert.ok(r.files.includes('assets/sprites-v3/ieum.webp'));assert.ok(r.files.includes('assets/profiles/hani-profile-ieum.webp'));console.log('raw closure files',r.files.length,'contract max',JSON.stringify(contract.limits||contract.max_files));
 const inverse=require('./hani-join-ieum-source.cjs'),old=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read:f=>{const b=fs.readFileSync(new URL('../'+f,import.meta.url));return inverse.project(b,f)}});assert.deepEqual(old.missing,[]);assert.deepEqual(old.files.filter(f=>!r.files.includes(f)),[]);assert.deepEqual(r.files.filter(f=>!old.files.includes(f)).sort(),['assets/profiles/hani-profile-ieum.webp','assets/profiles/thumb/hani-profile-ieum-128.webp','assets/profiles/thumb/hani-profile-ieum-256.webp','assets/sprites-v3/ieum.webp'].sort());
});
