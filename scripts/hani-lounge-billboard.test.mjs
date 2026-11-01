// Node-only execution of the real billboard, publication build and poll owners.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {publicationBulletins,validateLibrary,renderLibrary,monthlyQueenThread} from './hani-board-library-build.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const board=read('hani-board.js'),hub=read('hani-organization-hub.js');
const slice=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start);return s.slice(start,end)};
const plain=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x};
const denied=()=>assert.fail('billboard attempted a write or network call');

export function createBannerFixture(now=Date.parse('2026-11-01T03:00:00Z')){
  const fields=new Map(),node=()=>({attrs:{},dataset:{},textContent:'',hidden:false,setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]}});
  for(const key of ['link','image','kicker','title','copy','pause','ad'])fields.set('[data-board-banner-'+key+']',node());
  const dots={children:[],appendChild(n){this.children.push(n);n.remove=()=>this.children.splice(this.children.indexOf(n),1)},get lastElementChild(){return this.children.at(-1)}};
  fields.set('[data-board-banner-dots]',dots);
  const slot={querySelector:s=>fields.get(s),contains:n=>[...fields.values(),...dots.children].includes(n)};
  const timers=new Map(),events={},media={matches:false,addEventListener:(key,fn)=>events.media=fn};let seq=0,active=true;
  class Clock extends Date {static now(){return now}}
  const root={classList:{contains:()=>active},querySelector:s=>s==='[data-board="unread"]'?slot:null};
  const c=vm.createContext({Date:Clock,state:freeze({boardPosts:[{id:'p',authorId:'hani',title:'라운지 이야기',body:'함께 읽어요.',createdAt:new Date(now).toISOString()}],boardComments:[]}),
    document:{getElementById:id=>id==='board'?root:null,querySelectorAll:()=>[],createElement:node,visibilityState:'visible',activeElement:null,addEventListener:(key,fn)=>events[key]=fn},
    window:{matchMedia:()=>media,addEventListener:(key,fn)=>events[key]=fn},setTimeout:(fn,ms)=>{assert.equal(ms,6000);timers.set(++seq,fn);return seq},clearTimeout:id=>timers.delete(id),
    localStorage:{setItem:denied,removeItem:denied,clear:denied},save:denied,persist:denied,fetch:denied,showView:route=>c.route=route});
  vm.runInContext(hub,c);
  // The hub's overview owner is below its DOM guard. Execute the real function.
  vm.runInContext(slice(hub,'  function organizationOverviewData(', '  // Curated moments'),c);
  c.window.HaniOrganizationHub={overviewData:c.organizationOverviewData,portraitSource:id=>'./assets/profiles/hani-profile-'+id+'.webp'};
  vm.runInContext(read('hani-board-library.js'),c);
  const lifecycle=slice(board,'  function init(){','    if(!get("syncNotice")){');
  // Retain the actual module's lexical dependencies; initialize lifecycle listeners only.
  const click=slice(board,"      const bannerLink=event.target.closest('[data-board-banner-link]');",'      const profile=')
    .replace('resetEditor();openPost(','globalThis.openBillboardPost(');
  c.openBillboardPost=id=>c.opened=id;
  const source=board.replace('    if(!get("syncNotice")){','    return;\n    if(!get("syncNotice")){')
    .replace('  init();','  Object.assign(globalThis,{paintLoungeBanner,syncBanner,loungeBannerItems,dailyLoungeAds,publicationReplies,applyStaffVotes,interactiveMarkup,queenTally,queenSlides});\n globalThis.click=event=>{'+click+'};\n init();');
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
  assert.deepEqual(plain(rows.map(x=>x.kind)),['queen-winner','employee','ilbo','best','market','ad','ad']);
  const issue=JSON.parse(read('data/hani-ilbo/002.json'));
  assert.equal(rows[2].copy,issue.headline);assert.equal(rows[2].href,'#ilbo');
  assert.equal(rows[3].postId,'p');assert.equal(rows[4].href,'#newsroom');
  assert.equal(rows[1].title,'하니');assert.equal(rows[1].image,'./assets/profiles/hani-profile-hani.webp');
  assert.equal(rows[0].kicker,'👑 10월의 퀸');assert.match(rows[0].image,/^\.\/assets\/profiles\//);
});

test('missing, future and draft data are skipped without fabricated news',()=>{
  const f=createBannerFixture();f.c.state=freeze({boardPosts:[],boardComments:[]});
  f.c.HaniBoardLibrary={bulletins:{ilbo:[{date:'2026-11-02',number:3,title:'future'},{date:'2026-10-31',title:'draft',draft:true}],market:[]}};
  assert.deepEqual(plain(f.c.loungeBannerItems().map(x=>x.kind)),['queen-winner','ad','ad']);
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
  f.c.paintLoungeBanner();assert.equal(f.dots.children.length,3);assert.equal(f.dots.children.filter(x=>x.attrs['aria-pressed']==='true').length,1);
});

test('build reuses the actual publication sources and keeps nested data immutable',async()=>{
  const projected=await publicationBulletins(fileURLToPath(new URL('../',import.meta.url)));
  const f=createBannerFixture();assert.deepEqual(plain(f.c.HaniBoardLibrary.bulletins),projected);
  assert.ok(Object.isFrozen(f.c.HaniBoardLibrary.bulletins.ilbo[0]));
});

test('billboard adds no runtime file and every image exists on the published site',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});
  assert.equal(closure.files.length,128);assert.deepEqual(closure.missing,[]);
  const f=createBannerFixture();for(let day=0;day<6;day++)for(const row of f.c.loungeBannerItems(f.now+day*86400000))
    assert.ok(fs.existsSync(new URL('../'+row.image.replace(/^\.\//,''),import.meta.url)),row.image);
  const members=f.c.window.HaniOrganizationRoster.people;
  for(let pick=0;pick<members.length;pick++){
    f.c.state=freeze({boardPosts:[{libraryId:'queen-2026-11',createdAt:'2026-11-03T00:00:00+09:00',poll:{options:members.map(p=>p.name),votes:{seongmin:pick}}}],boardComments:[]});
    const winner=f.c.queenSlides(Date.parse('2026-12-01T12:00:00+09:00'))[0];
    assert.ok(fs.existsSync(new URL('../'+winner.image.replace(/^\.\//,''),import.meta.url)),'every possible winner uses an existing portrait');
  }
  const css=read('hani-board.css');assert.match(css,/height:200px/);assert.match(css,/height:168px/);
  assert.match(css,/width:44px;height:44px/);assert.doesNotMatch(read('index.html'),/data-board-banner-next/);
  // White under the weakest (.72) black scrim, even over pure white.
  const channel=(1-.72),linear=channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;
  assert.ok(1.05/(linear+.05)>=4.5);
});

test('library poll survives builder, real owner vote/save, protected read-back and reload',async()=>{
  const {api,context:c,roster,handlers:h}=await import('./hani-board.test.mjs');
  const main=read('hani-main.js');
  const fn=name=>{
    const start=main.indexOf('function '+name+'(');
    assert.ok(start>=0);return main.slice(start,main.indexOf('\n}',start)+2);
  };
  // Run the actual protected writer and loader against synthetic memory storage.
  let serial=null,writes=0;
  c.localStorage={getItem:key=>{assert.equal(key,'hani_os_life_v23');return serial},
    setItem:(key,value)=>{assert.equal(key,'hani_os_life_v23');serial=value;writes++}};
  vm.runInContext(fn('writeProtectedState')+'\n'+fn('loadState'),c);
  vm.runInContext(read('hani-relationship-seed.js'),c);
  const authored=[{id:'fixture-monthly',authorId:'hani',category:'LOUNGE',title:'사내 인기상 투표',body:'고마운 동료에게 한 표를 보내요.',
    topics:[],season:[],weekday:[],date:'2026-11-03',poll:{options:['하니','히나'],votes:{}},
    comments:[{authorId:'hina',body:'함께 일해서 든든했어요.',voteChoice:0,afterMin:3,replyTo:null}]}];
  vm.runInContext(renderLibrary(validateLibrary(authored,roster)),c);
  api.setState({...plain(api.freshState()),books:[{id:'fixture',title:'synthetic'}]});
  const generated=h.generateDaily(Date.parse('2026-11-03T12:00:00Z'),[]),row=generated.find(p=>p.libraryId==='fixture-monthly');
  assert.ok(row);assert.deepEqual(plain(row.poll),authored[0].poll);
  api.setState({...api.getState(),boardPosts:[row]});
  assert.equal(h.votePoll(row.id,1),true);
  assert.equal(writes,1);
  assert.equal(JSON.parse(serial).boardPosts[0].poll.votes[roster.chairman.id],1);
  const saved=serial;
  api.setState(vm.runInContext('loadState()',c));
  assert.equal(api.getState().boardPosts[0].poll.votes[roster.chairman.id],1);
  assert.equal(serial,saved);assert.equal(writes,1,'reload does not write');
  assert.equal(h.votePoll(row.id,1),false);assert.equal(writes,1,'same choice does not write');
  assert.deepEqual(plain(c.HaniBoardLibrary.threads[0].poll.votes),{});
  assert.ok(Object.isFrozen(c.HaniBoardLibrary.threads[0].poll.options));
  const f=createBannerFixture();f.c.HaniBoardLibrary=c.HaniBoardLibrary;f.c.uid=()=> 'synthetic-comment';
  const queued=f.c.publicationReplies(row,[row],[]);
  assert.equal(queued[0].voteChoice,0,'real publication queue retains staff vote');
  vm.runInContext(read('hani-board-library.js'),c);
  api.setState({...plain(api.freshState()),books:[{id:'fixture',title:'synthetic'}]});
  assert.equal(h.refreshLiving(Date.parse('2026-11-03T12:00:00Z')),true);
  const monthly=api.getState().boardPosts.find(p=>p.libraryId==='queen-2026-11');
  assert.ok(monthly.poll);
  assert.equal(Object.keys(monthly.poll.votes).length,roster.people.length,'real materialize/applyStaffVotes collects every generated ballot');
  assert.equal(h.votePoll(monthly.id,0),true);
  api.setState(vm.runInContext('loadState()',c));
  const reloaded=api.getState().boardPosts.find(p=>p.id===monthly.id);
  assert.equal(reloaded.poll.votes[roster.chairman.id],0);
  assert.equal(Object.keys(reloaded.poll.votes).length,roster.people.length+1);
  assert.equal(h.generateDaily(Date.parse('2026-11-03T12:00:00Z')).find(p=>p.id===monthly.id).poll.votes[roster.chairman.id],0,'generation never recreates an existing poll');
});

test('monthly static ballots use canon and stable seed, roster options and no self vote',()=>{
  const f=createBannerFixture(),roster=f.c.window.HaniOrganizationRoster;
  const template=JSON.parse(read('data/board-library/part-d.json')).threads[0],canon=JSON.parse(read('data/hani-relationship-seed-v1.json'));
  const built=plain(f.c.HaniBoardLibrary.threads.find(t=>t.id===template.id));
  const authored=monthlyQueenThread(template,roster,canon);
  assert.deepEqual(built,plain(validateLibrary([authored],roster)[0]));
  assert.deepEqual(authored,monthlyQueenThread(template,roster,canon));
  assert.equal(built.title,'👑 11월의 퀸 투표');assert.equal(built.date,'2026-11-03');
  assert.deepEqual(built.poll.options,plain(roster.people.map(p=>p.name)));
  assert.ok(!built.poll.options.includes(roster.chairman.name));
  assert.equal(new Set(built.comments.map(c=>c.authorId)).size,roster.people.length);
  for(const c of built.comments){
    assert.notEqual(built.poll.options[c.voteChoice],roster.people.find(p=>p.id===c.authorId).name);
    assert.ok(c.body.includes(built.poll.options[c.voteChoice]));
    assert.ok(c.afterMin>=0&&c.afterMin<1440);
    assert.doesNotMatch(c.body,/외모|몸매|섹시|얼굴|미모|예쁘/);
  }
  assert.throws(()=>validateLibrary([{...authored,comments:[{...authored.comments[0],voteChoice:999}]}],roster),/voteChoice/);
});

test('display tally includes owner and resolves ties by owner then roster order',()=>{
  const f=createBannerFixture(),members=f.c.window.HaniOrganizationRoster.people;
  const post={poll:{options:[members[1].name,members[0].name],votes:{hani:0,hina:1}}};
  assert.equal(f.c.queenTally(post).member.id,members[0].id,'roster order wins even when option order is reversed');
  post.poll.votes.seongmin=0;
  assert.equal(f.c.queenTally(post).member.id,members[1].id,'owner contributes a vote');
  post.poll.votes.yuri=1;
  assert.equal(f.c.queenTally(post).member.id,members[1].id,'owner breaks equal totals');
  delete post.poll.votes.seongmin;
  assert.equal(f.c.queenTally(post).member.id,members[0].id,'most votes wins');
  assert.equal(f.c.queenTally({}),null);
});

test('KST month end removes vote buttons without changing saved ballots or writing',()=>{
  const open=createBannerFixture(Date.parse('2026-11-30T14:59:59.999Z')),closed=createBannerFixture(Date.parse('2026-11-30T15:00:00Z'));
  const post=freeze({id:'queen-post',libraryId:'queen-2026-11',createdAt:'2026-11-03T00:00:00+09:00',poll:{options:['하니','히나'],votes:{seongmin:1,hina:0}}});
  for(const f of [open,closed]){
    f.c.state=freeze({boardPosts:[post],boardComments:[]});
    const before=JSON.stringify(f.c.state),html=f.c.interactiveMarkup(post,true);
    const poll=html.slice(html.indexOf('<fieldset'));
    if(f===open)assert.match(poll,/data-board-vote/);
    else {assert.doesNotMatch(poll,/<button|data-board-vote/);assert.match(poll,/마감/);assert.match(poll,/2표/)}
    f.c.paintLoungeBanner();f.c.queenTally(post);
    assert.equal(JSON.stringify(f.c.state),before);
  }
  const normal={...post,libraryId:'ordinary'};
  assert.match(closed.c.interactiveMarkup(normal,true),/data-board-vote/,'ordinary polls keep their existing behavior');
});

test('winner appears only in following month, with vote second and employee third',()=>{
  const f=createBannerFixture(Date.parse('2026-11-03T12:00:00+09:00')),members=f.c.window.HaniOrganizationRoster.people;
  const post=freeze({id:'queen-post',authorId:'hani',libraryId:'queen-2026-11',createdAt:'2026-11-03T00:00:00+09:00',poll:{options:[members[0].name,members[1].name],votes:{seongmin:1}}});
  f.c.state=freeze({boardPosts:[post],boardComments:[]});
  const at=date=>Date.parse(date+'T12:00:00+09:00');
  assert.equal(f.c.queenSlides(at('2026-10-31')).length,0);
  assert.deepEqual(plain(f.c.queenSlides(at('2026-11-02')).map(s=>s.kind)),['queen-winner']);
  const rows=f.c.loungeBannerItems(at('2026-11-03'));
  assert.deepEqual(plain(rows.slice(0,3).map(s=>s.kind)),['queen-winner','queen-vote','employee']);
  assert.equal(rows[1].title,'👑 11월의 퀸 투표 중');assert.equal(rows[1].postId,post.id);
  const december=f.c.queenSlides(at('2026-12-01'));
  assert.equal(december.length,1);assert.equal(december[0].kicker,'👑 11월의 퀸');
  assert.ok(december[0].title.includes(members[1].name));assert.ok(december[0].title.includes(members[1].rank));
  assert.equal(f.c.queenSlides(at('2027-01-01')).length,0);
  assert.equal(rows[0].queenSeason,'autumn');
  f.c.paintLoungeBanner();assert.equal(f.fields.get('[data-board-banner-link]').attrs['data-board-queen-season'],'autumn');
  f.press('[data-board-banner-dot]',1);f.press('[data-board-banner-link]');assert.equal(f.c.opened,post.id);
  for(const key of ['pending','draft','disposition']){
    f.c.state=freeze({boardPosts:[{...post,[key]:true}],boardComments:[]});
    assert.equal(f.c.queenSlides(at('2026-11-03')).filter(s=>s.kind==='queen-vote').length,0);
    assert.equal(f.c.queenSlides(at('2026-12-01')).length,0);
  }
});
}
