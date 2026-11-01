// Node-only execution of the real billboard, publication build and poll owners.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {publicationBulletins} from './hani-board-library-build.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const board=read('hani-board.js'),hub=read('hani-organization-hub.js');
const slice=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start);return s.slice(start,end)};
const plain=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x};
const denied=()=>assert.fail('billboard attempted a write or network call');

export function createBannerFixture(){
  const fields=new Map(),node=()=>({attrs:{},dataset:{},textContent:'',hidden:false,setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]}});
  for(const key of ['link','image','kicker','title','copy','pause','ad'])fields.set('[data-board-banner-'+key+']',node());
  const dots={children:[],appendChild(n){this.children.push(n);n.remove=()=>this.children.splice(this.children.indexOf(n),1)},get lastElementChild(){return this.children.at(-1)}};
  fields.set('[data-board-banner-dots]',dots);
  const slot={querySelector:s=>fields.get(s),contains:n=>[...fields.values(),...dots.children].includes(n)};
  const timers=new Map(),events={},media={matches:false,addEventListener:(key,fn)=>events.media=fn};let seq=0,active=true;
  const now=Date.parse('2026-11-01T03:00:00Z');
  class Clock extends Date {static now(){return now}}
  const root={classList:{contains:()=>active},querySelector:s=>s==='[data-board="unread"]'?slot:null};
  const c=vm.createContext({Date:Clock,state:freeze({boardPosts:[{id:'p',authorId:'hani',title:'라운지 이야기',body:'함께 읽어요.',createdAt:new Date(now).toISOString()}],boardComments:[]}),
    document:{getElementById:id=>id==='board'?root:null,querySelectorAll:()=>[],createElement:node,visibilityState:'visible',activeElement:null,addEventListener:(key,fn)=>events[key]=fn},
    window:{matchMedia:()=>media,addEventListener:(key,fn)=>events[key]=fn},setTimeout:(fn,ms)=>{assert.equal(ms,6000);timers.set(++seq,fn);return seq},clearTimeout:id=>timers.delete(id),
    localStorage:{setItem:denied,removeItem:denied,clear:denied},save:denied,persist:denied,fetch:denied,showView:route=>c.route=route});
  vm.runInContext(hub,c);
  // The hub's overview owner is below its DOM guard. Execute the real function.
  vm.runInContext(slice(hub,'  function organizationOverviewData(', '  // Curated moments'),c);
  c.window.HaniOrganizationHub={overviewData:c.organizationOverviewData};
  vm.runInContext(read('hani-board-library.js'),c);
  const lifecycle=slice(board,'  function init(){','    if(!get("syncNotice")){');
  // Retain the actual module's lexical dependencies; initialize lifecycle listeners only.
  const click=slice(board,"      const bannerLink=event.target.closest('[data-board-banner-link]');",'      const profile=')
    .replace('resetEditor();openPost(','globalThis.openBillboardPost(');
  c.openBillboardPost=id=>c.opened=id;
  const source=board.replace('    if(!get("syncNotice")){','    return;\n    if(!get("syncNotice")){')
    .replace('  init();','  Object.assign(globalThis,{paintLoungeBanner,syncBanner,loungeBannerItems,dailyLoungeAds,publicationReplies});\n globalThis.click=event=>{'+click+'};\n init();');
  vm.runInContext(source,c);
  assert.ok(lifecycle.includes('visibilitychange'));
  // The event branch retains the module's lexical timer and selection state.
  const press=(selector,index=0)=>c.click({preventDefault(){},target:{closest:s=>s!==selector?null:selector==='[data-board-banner-link]'?fields.get(s):selector==='[data-board-banner-dot]'?dots.children[index]:node()}});
  const run=code=>vm.runInContext(code,c);
  const tick=()=>{assert.equal(timers.size,1);const [id,fn]=[...timers][0];timers.delete(id);fn()};
  return {c,fields,dots,timers,events,media,slot,run,tick,press,now,setActive:v=>active=v};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
test('slide order uses published module sources, actual employee and weeklyBest',()=>{
  const f=createBannerFixture(),rows=f.c.loungeBannerItems(f.now);
  assert.deepEqual(plain(rows.map(x=>x.kind)),['employee','ilbo','best','market','ad','ad']);
  const issue=JSON.parse(read('data/hani-ilbo/002.json'));
  assert.equal(rows[1].copy,issue.headline);assert.equal(rows[1].href,'#ilbo');
  assert.equal(rows[2].postId,'p');assert.equal(rows[3].href,'#newsroom');
  assert.equal(rows[0].title,'하니');assert.equal(rows[0].image,'./assets/profiles/hani-profile-hani.webp');
});

test('missing, future and draft data are skipped without fabricated news',()=>{
  const f=createBannerFixture();f.c.state=freeze({boardPosts:[],boardComments:[]});
  f.c.HaniBoardLibrary={bulletins:{ilbo:[{date:'2026-11-02',number:3,title:'future'},{date:'2026-10-31',title:'draft',draft:true}],market:[]}};
  assert.deepEqual(plain(f.c.loungeBannerItems().map(x=>x.kind)),['ad','ad']);
});

test('daily ads are stable in KST, distinct and rotate through all six choices',()=>{
  const f=createBannerFixture(),seen=new Set();
  for(let day=0;day<12;day++){
    const at=f.now+day*86400000,a=plain(f.c.dailyLoungeAds(at));
    assert.deepEqual(a,plain(f.c.dailyLoungeAds(at)));assert.equal(new Set(a.map(x=>x.title)).size,2);
    a.forEach(x=>seen.add(x.title));
    for(const x of a)assert.ok(read('index.html').includes('data-view="'+x.href.slice(1)+'"'),'real navigation target');
  }
  assert.equal(seen.size,6);
  assert.deepEqual(plain(f.c.dailyLoungeAds(Date.parse('2026-11-01T14:59:59Z'))),plain(f.c.dailyLoungeAds(f.now)));
  assert.notDeepEqual(plain(f.c.dailyLoungeAds(Date.parse('2026-11-01T15:00:00Z'))),plain(f.c.dailyLoungeAds(f.now)));
});

test('only ads have the chip; dots select slides and keep persistent nodes',()=>{
  const f=createBannerFixture();f.c.paintLoungeBanner();const link=f.fields.get('[data-board-banner-link]'),dots=[...f.dots.children];
  const rows=f.c.loungeBannerItems();
  assert.equal(dots.length,rows.length);
  rows.forEach((row,i)=>{
    f.press('[data-board-banner-dot]',i);
    assert.equal(f.fields.get('[data-board-banner-ad]').hidden,!row.ad);
    assert.equal(f.dots.children[i].attrs['aria-pressed'],'true');
    assert.equal(f.fields.get('[data-board-banner-link]'),link);assert.deepEqual(f.dots.children,dots);
    f.press('[data-board-banner-link]');
    if(row.postId)assert.equal(f.c.opened,row.postId);else assert.equal(f.c.route,row.href.slice(1));
  });
});

test('painting, daily selection and timer lifecycle write nothing',()=>{
  const f=createBannerFixture(),before=JSON.stringify(f.c.state),library=JSON.stringify(f.c.HaniBoardLibrary);
  f.run('paintLoungeBanner();syncBanner();syncBanner()');assert.equal(f.timers.size,1);
  f.tick();f.press('[data-board-banner-pause]');assert.equal(f.timers.size,0);
  f.press('[data-board-banner-dot]',0);assert.equal(f.timers.size,0);
  f.press('[data-board-banner-pause]');assert.equal(f.timers.size,1);
  f.c.document.visibilityState='hidden';f.events.visibilitychange();assert.equal(f.timers.size,0);
  f.c.document.visibilityState='visible';f.events.visibilitychange();assert.equal(f.timers.size,1);
  f.setActive(false);f.c.syncBanner();assert.equal(f.timers.size,0);
  f.setActive(true);f.events.pageshow();f.events.pagehide();assert.equal(f.timers.size,0);
  f.events.pageshow();f.media.matches=true;f.events.media();assert.equal(f.timers.size,0);
  assert.equal(f.fields.get('[data-board-banner-pause]').disabled,true);
  assert.equal(JSON.stringify(f.c.state),before);assert.equal(JSON.stringify(f.c.HaniBoardLibrary),library);
  assert.doesNotMatch(slice(board,'  // Read-only lounge promotion.','  function paintLiving('),/\b(save|persist|setItem|removeItem|fetch)\s*\(/);
});

test('focus stops advancement and reduced motion still permits manual dots',()=>{
  const f=createBannerFixture();f.c.paintLoungeBanner();f.c.syncBanner();
  f.c.document.activeElement=f.dots.children[0];f.tick();assert.equal(f.dots.children[0].attrs['aria-pressed'],'true');
  f.media.matches=true;f.events.media();f.press('[data-board-banner-dot]',2);
  assert.equal(f.dots.children[2].attrs['aria-pressed'],'true');assert.equal(f.timers.size,0);
  f.c.state=freeze({boardPosts:[],boardComments:[]});f.c.HaniBoardLibrary={bulletins:{}};
  f.c.paintLoungeBanner();assert.equal(f.dots.children.length,2);assert.equal(f.dots.children.filter(x=>x.attrs['aria-pressed']==='true').length,1);
});

test('build reuses the actual publication sources and keeps nested data immutable',async()=>{
  const projected=await publicationBulletins(fileURLToPath(new URL('../',import.meta.url)));
  const f=createBannerFixture();assert.deepEqual(plain(f.c.HaniBoardLibrary.bulletins),projected);
  assert.ok(Object.isFrozen(f.c.HaniBoardLibrary.bulletins.ilbo[0]));
});

test('all billboard images are in the unchanged 128-file runtime closure',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});
  assert.equal(closure.files.length,128);assert.deepEqual(closure.missing,[]);
  const f=createBannerFixture();for(let day=0;day<6;day++)for(const row of f.c.loungeBannerItems(f.now+day*86400000))
    assert.ok(closure.files.includes(row.image.replace(/^\.\//,'')),row.image);
  const css=read('hani-board.css');assert.match(css,/height:200px/);assert.match(css,/height:168px/);
  assert.match(css,/width:44px;height:44px/);assert.doesNotMatch(read('index.html'),/data-board-banner-next/);
  // White under the weakest (.72) black scrim, even over pure white.
  const channel=(1-.72),linear=channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;
  assert.ok(1.05/(linear+.05)>=4.5);
});

test('queen fallback evidence: library poll fields and deadline enforcement are absent',()=>{
  const f=createBannerFixture(),c=f.c;
  Object.assign(c,{cloudUser:{id:'fixture'},cloudAutoSyncReady:true,cloudRuntime:{sync:'ON'},loadRecovery:{active:false},
    importSyncHold:false,cloudRecoveryMode:false,cloudHasMeaningfulLocalData:()=>true,uid:(()=>{let n=0;return ()=>'fixture-'+(++n)})()});
  c.window.HaniRelationshipSeed={people:[],relations:[]};
  c.HaniBoardLibrary={threads:[{id:'fixture-monthly',authorId:'hani',category:'LOUNGE',title:'사내 인기상 투표',body:'고마운 동료에게 한 표를 보내요.',
    topics:[],season:[],weekday:[],date:'2026-11-03',poll:{options:['하니','히나'],votes:{}},
    comments:[{authorId:'hina',body:'함께 일해서 든든했어요.',voteChoice:0,afterMin:3,replyTo:null}]}]};
  const generated=c.window.HaniBoard.generateDaily(Date.parse('2026-11-03T12:00:00Z'),[]),row=generated.find(p=>p.libraryId==='fixture-monthly');
  assert.ok(row);assert.equal(row.poll,undefined,'real generated post drops the authored poll');
  const queued=c.publicationReplies(row,generated,[]);
  assert.ok(queued.length);assert.equal(queued[0].voteChoice,undefined,'real publication queue drops the staff vote');
  const generator=slice(board,'  function generateDaily(', '  function cleanupTemplates(');
  const replies=slice(board,'  function publicationReplies(', '  function draftAction(');
  const vote=slice(board,'  function votePoll(', '  function toggleReaction(');
  assert.doesNotMatch(generator,/\bpoll\s*:/);assert.doesNotMatch(replies,/voteChoice/);
  assert.doesNotMatch(vote,/Date\.now|closed|deadline|endsAt/);
  assert.match(vote,/return persist\(/,'owner poll persistence is preserved');
});
}
