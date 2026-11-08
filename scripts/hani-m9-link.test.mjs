import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import inverse from './hani-m9-link-source.cjs';
import {resolveRuntimeClosure,collectReferences} from './hani-runtime-closure.mjs';
const require=createRequire(import.meta.url),{delta,hash,restore}=inverse;
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const manifest=JSON.parse(read('data/hani-ilbo/issues.json')),extra=JSON.parse(read('data/hani-ilbo/extra-m9.json'));
const before=f=>restore(read(f),f),plain=x=>JSON.parse(JSON.stringify(x));
function api(code=read('hani-ilbo.js')){const window={};vm.runInNewContext(code,{window});return window.HaniIlbo;}
const current=api(),original=api(before('hani-ilbo.js'));
function harness({failExtra=false}={}){
  let now=Date.parse('2026-11-08T14:59:59Z'),active=false,click;
  const requests=[],events=[],registrations=[],writes=[];
  const slot={innerHTML:'',setAttribute(){},querySelector:()=>null,querySelectorAll:()=>[]},archive={innerHTML:''};
  const home={hidden:false,innerHTML:'',querySelector:()=>homeButton},homeButton={onclick:null};
  const host={classList:{contains:()=>active},querySelector:s=>s==='[data-ilbo-content]'?slot:archive,addEventListener:(type,fn)=>{registrations.push(type);if(type==='click')click=fn;}};
  const reject=()=>{writes.push('write');throw Error('unexpected write');};
  const context=vm.createContext({window:{dispatchEvent:e=>events.push(e.type),addEventListener:t=>registrations.push(t)},Event,
    document:{readyState:'complete',getElementById:()=>host,querySelector:()=>home,addEventListener:t=>registrations.push(t)},
    Date:class extends Date{static now(){return now;}},state:new Proxy({},{get(){throw Error('extra read personal data');}}),
    localStorage:{setItem:reject,removeItem:reject,clear:reject},sessionStorage:{setItem:reject,removeItem:reject,clear:reject},
    fetch:async(file,options)=>{assert.equal(options.credentials,'omit');requests.push(file);if(failExtra&&file.includes('extra-m9'))return {ok:false};return {ok:true,json:async()=>JSON.parse(read(file))};}});
  // Regular issues may read empty records; the proxy is installed only while opening extras.
  context.state={};vm.runInContext(read('hani-ilbo.js'),context);
  const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
  return {api:context.window.HaniIlbo,slot,archive,home,events,registrations,requests,writes,settle,
    clock:v=>{now=Date.parse(v);},active:v=>{active=v;},
    async choose(key,value){context.state=key==='ilboExtra'?new Proxy({},{get(){throw Error('extra read personal data');}}):{};click({target:{closest:s=>s===`[data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}]`?{dataset:{[key]:value}}:null}});await settle();},
    homeOpen:async()=>{context.state={};active=true;homeButton.onclick();await context.window.HaniIlbo.enter();await settle();}};
}
test('exact inverse restores every base byte and rejects unrelated edits',()=>{
  for(const row of delta.files){assert.equal(hash(before(row.file)),row.beforeSha256);assert.throws(()=>restore(read(row.file)+'\n',row.file));}
  const expected=JSON.parse(read('artifacts/m9-link/preservation-baseline.json'));
  for(const [f,digest] of Object.entries(expected))assert.equal(hash(fs.readFileSync(new URL('../'+f,import.meta.url))),digest,f);
  assert.deepEqual(manifest.issues,JSON.parse(before('data/hani-ilbo/issues.json')).issues);
});
test('regular parsing and full rendered HTML remain byte identical for all four issues',()=>{
  const entries=current.parseManifest(manifest);assert.deepEqual(plain(entries),plain(original.parseManifest(manifest)));
  assert.deepEqual(plain(entries).map(x=>x.number),[4,3,2,1]);assert.equal(Math.max(...entries.map(x=>x.number))+1,5);
  for(const entry of entries){const issue=JSON.parse(read(entry.file));current.parseIssue(issue,entry);
    for(const now of ['2026-11-08T14:59:59Z','2026-11-08T15:00:00Z'])assert.equal(current.markup(issue,{},null,[],Date.parse(now)),original.markup(issue,{},null,[],Date.parse(now)),entry.file);
  }
});
test('separate extras validate ID, date, path, fictional flag and six panels',()=>{
  const [entry]=current.parseExtras(manifest);assert.equal(entry.id,'seoyun-m9');assert.equal(entry.extra,true);current.parseIssue(extra,entry);
  for(const changed of [{id:'../bad'},{date:'2026-02-30'},{file:'../private.json'}])assert.throws(()=>current.parseExtras({extras:[{...entry,...changed}]}));
  assert.throws(()=>current.parseExtras({extras:[entry,entry]}));
  for(const changed of [{id:'bad'},{extra:false},{comic:{...extra.comic,captions:extra.comic.captions.slice(1)}},{news:[{...extra.news[0],fictional:false}]}])assert.throws(()=>current.parseIssue({...extra,...changed},entry));
});
test('extra captions are six visible ordered cells, child names are unambiguous, personal projections unused',()=>{
  const forbidden=new Proxy({},{get(){throw Error('private projection accessed');}});
  const html=current.markup(extra,forbidden,forbidden,forbidden,Date.parse('2026-11-08T03:00Z'));
  const visible=html.match(/<ol class="ilbo-extra-captions"[^>]*>([^]*?)<\/ol>/)[1];
  assert.equal((visible.match(/<li>/g)||[]).length,6);for(const caption of extra.comic.captions)assert.ok(visible.includes(caption));
  assert.match(visible,/꼬마 수연/);assert.match(visible,/꼬마 수현/);assert.match(visible,/지은·하루·나은·히나·민지·수연·수아·유나/);
  assert.ok(extra.news.every(x=>x.fictional));assert.match(html,/민지 대리\(📸\)/);assert.match(html,/M9 SPECIAL LISTING · Platform Architect/);
  assert.doesNotMatch(html,/숫자로 보는 한 주|라운지 베스트|마켓 한 줄|다음 주 예고|제 undefined호/);
  assert.equal((html.match(/class="ilbo-qa"/g)||[]).length,3);
});
test('real boot/click/cache/home/count path preserves November 9 selection and unread state',async()=>{
  const h=harness();await h.settle();assert.match(h.slot.innerHTML,/제 3호/);assert.equal(h.api.publishedCount(),3);
  assert.match(h.home.innerHTML,/제 3호/);assert.equal(h.home.hidden,false);
  assert.equal((h.archive.innerHTML.match(/data-ilbo-issue=/g)||[]).length,3);
  assert.equal((h.archive.innerHTML.match(/data-ilbo-extra=/g)||[]).length,1);assert.match(h.archive.innerHTML,/<section class="ilbo-extras" aria-label="호외">/);
  h.active(true);await h.choose('ilboExtra','seoyun-m9');assert.match(h.slot.innerHTML,/ilbo-extra-captions/);assert.equal(h.home.hidden,false,'reading extra cannot mark a regular issue read');assert.equal(h.api.publishedCount(),3);
  await h.choose('ilboIssue','1');assert.match(h.slot.innerHTML,/제 1호/);await h.choose('ilboExtra','seoyun-m9');
  assert.equal(h.requests.filter(f=>f.endsWith('extra-m9.json')).length,1,'extra cache stable and separate');
  h.clock('2026-11-08T15:00:00Z');h.api.homeCard();assert.equal(h.api.publishedCount(),4);assert.match(h.home.innerHTML,/제 4호/);assert.equal(h.home.hidden,false);
  await h.homeOpen();assert.match(h.slot.innerHTML,/제 4호/);assert.doesNotMatch(h.slot.innerHTML,/ilbo-extra-captions/);assert.equal(h.home.hidden,true);
  assert.equal((h.archive.innerHTML.match(/data-ilbo-issue=/g)||[]).length,4);assert.equal(h.requests.filter(f=>f.endsWith('issues.json')).length,1);
  assert.deepEqual(h.writes,[]);assert.deepEqual(h.events,['hani-ilbo-ready']);assert.deepEqual(h.registrations,['click','beforeprint','afterprint','visibilitychange']);
});
test('extra before publication is inaccessible; failed extra fetch keeps regular newspaper recoverable',async()=>{
  const h=harness({failExtra:true});await h.settle();h.clock('2026-11-07T03:00Z');await h.api.enter();assert.doesNotMatch(h.archive.innerHTML,/data-ilbo-extra/);
  await h.choose('ilboExtra','seoyun-m9');assert.equal(h.requests.some(f=>f.endsWith('extra-m9.json')),false);
  h.clock('2026-11-08T03:00Z');await h.api.enter();await h.choose('ilboExtra','seoyun-m9');assert.match(h.slot.innerHTML,/data-ilbo-retry/);
  await h.choose('ilboIssue','3');assert.match(h.slot.innerHTML,/제 3호/);assert.equal(h.api.publishedCount(),3);assert.deepEqual(h.writes,[]);
});
test('special card uses one existing delegated click owner, including button and image clicks',()=>{
  const ui=require('../hani-character-archive.js'),html=ui.page(),card=html.match(/<article class="ca-character-card" data-special-listing="seoyun"[^]*?<\/article>/)[0];
  assert.match(card,/seoyun-m9-special-cut.webp/);assert.match(card,/object-fit:contain;object-position:center/);assert.match(card,/data-special-profile="seoyun" aria-haspopup="dialog"/);
  const calls=[],listeners=[],host={dataset:{},innerHTML:'',contains:()=>true,addEventListener:(t,fn)=>listeners.push([t,fn])};
  const ctx={window:{HANI_CHARACTER_ARCHIVE_DATA:require('../hani-character-archive-data.js'),HaniOrganizationHub:{openPerson:id=>calls.push(id)},document:{getElementById:()=>host}}};
  vm.runInNewContext(read('hani-character-archive.js'),ctx);const click=listeners.find(x=>x[0]==='click')[1];
  for(const target of ['button','img','article'])click({target:{closest:s=>{assert.match(s,/data-special-listing/);return {dataset:{specialListing:'seoyun'}};}}});
  assert.deepEqual(calls,['seoyun','seoyun','seoyun']);assert.deepEqual(listeners.map(x=>x[0]),['error','click']);
  const baseUi={exports:{}};vm.runInNewContext(before('hani-character-archive.js'),{module:baseUi,require:createRequire(new URL('../hani-character-archive.js',import.meta.url))});
  assert.equal(ui.page().replace(card,''),baseUi.exports.page().replace(/<article class="ca-character-card" data-special-listing="seoyun"[^]*?<\/article>/,''),'all regular archive HTML unchanged');
});
test('existing hub openPerson navigates out of hidden archive ancestor then opens its original dialog',()=>{
  const source=read('hani-organization-hub.js'),start=source.indexOf('  function showDetail('),end=source.indexOf('  function selectTeam(',start);
  const opening=source.slice(source.indexOf('  function openPerson('),source.indexOf('  window.HaniOrganizationHub='));
  const detail={innerHTML:''},calls=[],dialog={open:false,style:{setProperty(){}},showModal(){calls.push('modal');this.open=true;}};
  const root={hidden:true,querySelector:s=>({focus:()=>calls.push(s)})};
  const people=[{id:'seoyun',name:'서윤',group:'AI STAFF',team:'platform',rank:'개발 리드',role:'설계',line:'반가워요',keywords:'설계 · 통합'},{id:'hani',name:'하니',group:'M9',team:'strategy',rank:'전무',keywords:'전략'}];
  const ctx=vm.createContext({root,dialog,detail,people,window:{showView:route=>{calls.push(route);root.hidden=false;}},teams:[],teamOf:()=>({id:'platform',en:'PLATFORM',color:'#77599a',tint:'#fff'}),DETAIL_TITLE_OPEN:'<h2 id="ogh-detail-title">',portrait:p=>'<img src="profile-'+p.id+'">',plannedBadge:()=>'',specialListingBadge:()=>'',tags:()=>''});
  vm.runInContext(source.slice(start,end)+opening,ctx);assert.equal(ctx.openPerson('seoyun'),true);assert.equal(calls[0],'organization/aiTeam');assert.equal(dialog.open,true);
  assert.match(detail.innerHTML,/ogh-special-cut/);assert.match(detail.innerHTML,/seoyun-m9-special-cut.webp/);assert.match(detail.innerHTML,/개구리 회장님과 서윤/);
  ctx.openPerson('hani');assert.match(detail.innerHTML,/profile-hani/);assert.doesNotMatch(detail.innerHTML,/seoyun-m9-special-cut/);assert.equal(ctx.openPerson('missing'),false);
  // The existing navigation owner excludes organization/ilbo from persistence.
  const main=read('hani-main.js'),writes=[];
  const nav=vm.createContext({localStorage:{setItem:(...args)=>writes.push(args)}});
  vm.runInContext(main.match(/const NAVIGATION_VIEWS=new Set\([^\n]+/)[0]+'\n'+main.slice(main.indexOf('function navigationPersist('),main.indexOf('function navigationInitialView('))+'\nnavigationPersist("organization",0);navigationPersist("ilbo",0);navigationPersist("",0);',nav);
  assert.deepEqual(writes,[]);
});
test('runtime additions introduce no storage, Cloud, timer or listener path',()=>{
  const effects=/\b(?:localStorage|sessionStorage|cloudClient|supabase|setTimeout|setInterval|addEventListener)\b|\.(?:setItem|removeItem|clear|insert|upsert|delete)\s*\(/g;
  for(const file of ['hani-ilbo.js','hani-character-archive.js','hani-organization-hub.js'])assert.deepEqual(read(file).match(effects),before(file).match(effects),file);
});
test('deployment closure includes every new static reference and the updated manifest',async()=>{
  const closure=await resolveRuntimeClosure({read:f=>fs.readFileSync(new URL('../'+f,import.meta.url)),exists:f=>fs.existsSync(new URL('../'+f,import.meta.url))});
  assert.deepEqual(closure.missing,[]);
  const required=['data/hani-ilbo/issues.json','data/hani-ilbo/extra-m9.json','assets/hani-ilbo/extra-m9-comic.webp','assets/character-archive/seoyun-m9-special-cut.webp'];
  const omitted=required.filter(f=>!closure.files.includes(f));
  const evidence={resolverFiles:closure.files.length,resolverMissing:closure.missing,required,omitted,packageStatus:omitted.length?'BLOCKED':'PASS',manifestReferences:collectReferences('data/hani-ilbo/issues.json',read('data/hani-ilbo/issues.json')),extraReferences:collectReferences('data/hani-ilbo/extra-m9.json',read('data/hani-ilbo/extra-m9.json')),note:'No gate, server or resolver changes authorized. Existing seeded assets remain in main; new manifest and JSON need release owner packaging decision.'};
  fs.writeFileSync(new URL('../artifacts/m9-link/closure.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
  assert.ok(required.every(f=>fs.existsSync(new URL('../'+f,import.meta.url))));
  assert.deepEqual(omitted,[],'Package inclusion is required; resolver missing=[] alone cannot certify it. Report this failure without changing gate/server contracts.');
});
