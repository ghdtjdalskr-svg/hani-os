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
  const root={classList:{contains:()=>active},querySelector:s=>s==='[data-board="unread"]'?slot:fields.get(s),querySelectorAll:()=>[]};
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
    .replace('  init();','  Object.assign(globalThis,{paintLoungeBanner,syncBanner,loungeBannerItems,dailyLoungeAds,publicationReplies,applyStaffVotes,interactiveMarkup,queenTally,queenSlides,queenStandings,queenStaffBallots,visibleComments,queenResultThreads,displayPosts,listPosts,libraryEligible,dailyThread,publicationThread,openPost,render});\n globalThis.click=event=>{'+click+'};\n init();');
  vm.runInContext(source,c);
  assert.ok(lifecycle.includes('visibilitychange'));
  // The event branch retains the module's lexical timer and selection state.
  const press=(selector,index=0)=>c.click({preventDefault(){},target:{closest:s=>s!==selector?null:selector==='[data-board-banner-link]'?fields.get(s):selector==='[data-board-banner-dot]'?dots.children[index]:node()}});
  const run=code=>vm.runInContext(code,c);
  const tick=()=>{assert.equal(timers.size,1);const [id,fn]=[...timers][0];timers.delete(id);fn()};
  return {c,fields,dots,timers,events,media,slot,run,tick,press,now,setActive:v=>active=v,setNow:v=>now=v};
}

const at=date=>Date.parse(date+'T23:59:59.999+09:00');
function monthlyPost(f){
  const thread=f.c.HaniBoardLibrary.threads.find(t=>t.id==='queen-2026-11');
  return {id:'queen-post',libraryId:thread.id,authorId:thread.authorId,title:thread.title,body:thread.body,
    generated:true,createdAt:'2026-11-03T08:00:00+09:00',poll:{options:plain(thread.poll.options),votes:{}}};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
test('slide order uses published module sources, actual employee and weeklyBest',()=>{
  const f=createBannerFixture(),rows=f.c.loungeBannerItems(f.now);
  assert.deepEqual(plain(rows.map(x=>x.kind)),['queen-winner','employee','ilbo','best','market','ad','ad']);
  const issue=JSON.parse(read('data/hani-ilbo/002.json'));
  assert.equal(rows[2].copy,issue.headline);assert.equal(rows[2].href,'#ilbo');
  assert.equal(rows[3].postId,'p');assert.equal(rows[4].href,'#newsroom');
  assert.equal(rows[1].title,'하니');assert.equal(rows[1].image,'./assets/profiles/hani-profile-hani.webp');
  assert.equal(rows[0].kicker,'👑 10월의 퀸');assert.equal(rows[0].image,'./assets/queen/2026-10.webp');
  assert.equal(rows[0].queenImage,'solo');
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

test('solo artwork is traced in runtime closure and all fallback portraits exist',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});
  assert.ok(closure.files.length<=200);assert.deepEqual(closure.missing,[]);
  assert.ok(closure.files.includes('assets/queen/2026-10.webp'));
  assert.ok(fs.statSync(new URL('../assets/queen/2026-10.webp',import.meta.url)).size<200000);
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
  assert.equal(Object.keys(monthly.poll.votes).length,0,'future staff ballots do not materialize on publication day');
  h.refreshLiving(Date.parse('2026-11-03T12:00:00Z'),true);
  assert.equal(Object.keys(api.getState().boardPosts.find(p=>p.id===monthly.id).poll.votes).length,0,'force refresh cannot publish future library ballots');
  const projection=createBannerFixture(),before=projection.c.queenStandings(monthly,at('2026-11-03'));
  assert.equal(h.votePoll(monthly.id,0),true);
  const after=projection.c.queenStandings(api.getState().boardPosts.find(p=>p.id===monthly.id),at('2026-11-03'));
  assert.equal(after.total,before.total+1,'real votePoll changes the display tally');
  assert.equal(after.counts[0],before.counts[0]+1);
  api.setState(vm.runInContext('loadState()',c));
  const reloaded=api.getState().boardPosts.find(p=>p.id===monthly.id);
  assert.equal(reloaded.poll.votes[roster.chairman.id],0);
  assert.equal(Object.keys(reloaded.poll.votes).length,1);
  assert.equal(h.generateDaily(Date.parse('2026-11-03T12:00:00Z')).find(p=>p.id===monthly.id).poll.votes[roster.chairman.id],0,'generation never recreates an existing poll');
  assert.equal(h.refreshLiving(at('2026-11-30')),true);
  const final=api.getState().boardPosts.find(p=>p.id===monthly.id);
  assert.equal(Object.keys(final.poll.votes).length,roster.people.length+1,'real dated reply mechanism eventually materializes all named votes');
  assert.equal(projection.c.queenStandings(final,at('2026-11-30')).total,roster.people.length+41);
  assert.equal(api.getState().boardComments.filter(c=>c.postId===final.id&&c.generated&&!c.pending).length,roster.people.length,'anonymous votes create no comments');
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
    assert.ok(c.afterMin>=0&&c.afterMin<28*1440);
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
    else {assert.doesNotMatch(poll,/<button|data-board-vote/);assert.match(poll,/마감/);assert.ok(poll.includes(f.c.queenStandings(post).total+'표'))}
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
  const expected=f.c.queenTally(post,at('2026-11-30')).member;
  assert.ok(december[0].title.includes(expected.name));assert.ok(december[0].title.includes(expected.rank));
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

test('named ballots never count before their seeded date, including legacy saved early votes',()=>{
  const f=createBannerFixture(),post=monthlyPost(f),ballots=f.c.queenStaffBallots(post);
  for(const b of ballots)post.poll.votes[b.authorId]=b.choice;
  freeze(post);f.c.state=freeze({boardPosts:[post],boardComments:[]});
  const before=JSON.stringify(f.c.state),start=Date.parse(post.createdAt),end=at('2026-11-30');
  assert.ok(new Set(ballots.map(b=>Math.floor(b.at/86400000))).size>10);
  for(const b of ballots){
    assert.ok(b.at>=start&&b.at<=end);
    assert.equal(f.c.queenStandings(post,b.at-1).named,ballots.filter(x=>x.at<b.at).length);
    assert.equal(f.c.queenStandings(post,b.at).named,ballots.filter(x=>x.at<=b.at).length);
  }
  assert.equal(f.c.queenStandings(post,start-1).total,0);
  assert.equal(f.c.queenStandings(post,end).named,19);
  assert.equal(JSON.stringify(f.c.state),before);
});

test('live standings grow through the month, repeat exactly and permit a changing leader',()=>{
  const f=createBannerFixture(),other=createBannerFixture(),post=freeze(monthlyPost(f));
  let previous=0;const leaders=new Set();
  for(let day=3;day<=30;day++){
    const now=at('2026-11-'+String(day).padStart(2,'0')),a=plain(f.c.queenStandings(post,now));
    assert.deepEqual(a,plain(f.c.queenStandings(post,now)));
    assert.deepEqual(a,plain(other.c.queenStandings(post,now)));
    assert.ok(a.total>=previous);previous=a.total;
    assert.equal(a.counts.reduce((x,y)=>x+y,0),a.total);
    assert.equal(a.total,a.named+a.anonymous);
    if(a.total)leaders.add(f.c.queenTally(post,now).member.id);
  }
  assert.ok(f.c.queenStandings(post,at('2026-11-03')).total<10);
  assert.equal(previous,59);assert.ok(leaders.size>1);
});

test('dated comments use the same ballot dates and legacy comments project without rewriting',()=>{
  const f=createBannerFixture(),post=freeze(monthlyPost(f));let id=0;f.c.uid=()=> 'queued-'+(++id);
  const queued=f.c.publicationReplies(post,[post],[]),ballots=f.c.queenStaffBallots(post);
  queued.forEach(c=>assert.equal(Date.parse(c.scheduledAt),ballots.find(b=>b.authorId===c.authorId).at));
  // Already-published legacy comments keep their saved bytes, but display on the new dates.
  const legacy=queued.map(c=>({...c,pending:false,createdAt:post.createdAt}));
  f.c.state=freeze({boardPosts:[post],boardComments:legacy});const before=JSON.stringify(f.c.state);
  for(const ballot of ballots){
    f.setNow(ballot.at-1);
    assert.ok(!f.c.visibleComments().some(c=>c.authorId===ballot.authorId));
    f.setNow(ballot.at);
    const visible=f.c.visibleComments().find(c=>c.authorId===ballot.authorId);
    assert.ok(visible);assert.equal(Date.parse(visible.createdAt),ballot.at);
  }
  assert.equal(JSON.stringify(f.c.state),before);
});

test('anonymous staff stay read-only and their monthly leaning is stable but varies by month',()=>{
  const f=createBannerFixture(),post=freeze(monthlyPost(f));
  f.c.state=freeze({boardPosts:[post],boardComments:[]});const before=JSON.stringify(f.c.state),lib=JSON.stringify(f.c.HaniBoardLibrary);
  const november=plain(f.c.queenStandings(post,at('2026-11-30')));
  assert.equal(november.anonymous,40);assert.equal(november.named,19);
  const december={...post,libraryId:'queen-2026-12',createdAt:'2026-12-01T08:00:00+09:00'};
  const next=plain(f.c.queenStandings(december,at('2026-12-31')));
  assert.equal(next.anonymous,40);assert.notDeepEqual(november.counts,next.counts);
  f.setNow(at('2026-11-15'));const markup=f.c.interactiveMarkup(post,true);
  assert.match(markup,/익명 직원 \d+명 포함/);assert.match(markup,/<progress/);
  assert.equal(JSON.stringify(f.c.state),before);assert.equal(JSON.stringify(f.c.HaniBoardLibrary),lib);
});

test('final day standings, closed poll and next-month award share the exact tally',()=>{
  const f=createBannerFixture(),post=monthlyPost(f);post.poll.votes.seongmin=0;freeze(post);
  f.c.state=freeze({boardPosts:[post],boardComments:[]});
  const last=at('2026-11-30'),final=plain(f.c.queenStandings(post,last)),winner=plain(f.c.queenTally(post,last));
  assert.equal(final.total,60);assert.equal(winner.count,final.counts[winner.index]);
  for(const now of [last+1,at('2026-12-01'),at('2026-12-31')]){
    assert.deepEqual(plain(f.c.queenStandings(post,now)),final);
    assert.deepEqual(plain(f.c.queenTally(post,now)),winner);
  }
  const award=f.c.queenSlides(at('2026-12-01'))[0];assert.ok(award.title.includes(winner.member.name));
  f.setNow(last+1);assert.match(f.c.interactiveMarkup(post,false),new RegExp('지금까지 '+final.total+'명 참여'));
});

test('vote billboard and poll both report the live participant count for the date',()=>{
  const f=createBannerFixture(),post=freeze(monthlyPost(f));f.c.state=freeze({boardPosts:[post],boardComments:[]});
  for(const day of ['2026-11-03','2026-11-15','2026-11-30']){
    const now=at(day);f.setNow(now);const total=f.c.queenStandings(post,now).total;
    const expected='지금까지 '+total+'명 참여 · 11월 30일 마감';
    assert.equal(f.c.queenSlides(now).find(s=>s.kind==='queen-vote').copy,expected);
    assert.ok(f.c.interactiveMarkup(post,true).includes(expected));
  }
});

test('October uses solo art, later months contain whole fallback portraits at all widths',()=>{
  const f=createBannerFixture(),post=freeze(monthlyPost(f));f.c.state=freeze({boardPosts:[post],boardComments:[]});
  f.c.paintLoungeBanner();assert.equal(f.fields.get('[data-board-banner-image]').attrs.src,'./assets/queen/2026-10.webp');
  assert.equal(f.fields.get('[data-board-banner-link]').attrs['data-board-queen-image'],'solo');
  f.setNow(at('2026-12-01'));f.c.paintLoungeBanner();
  assert.equal(f.fields.get('[data-board-banner-link]').attrs['data-board-queen-image'],'portrait');
  const css=read('hani-board.css');
  // Resolve actual matching fit declarations in cascade order, including mobile rules.
  const fit=mode=>{
    let result;
    for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
      const [,,rules]=match,selector=match[1];
      if(!selector.includes('.board-promo')||!selector.includes('img'))continue;
      const attr=/\[data-board-queen-image(?:="([^"]*)")?\]/.exec(selector);
      if(attr&&attr[1]!==undefined&&attr[1]!==mode)continue;
      const value=/object-fit:([^;}]*)/.exec(rules);if(value)result=value[1];
    }
    return result;
  };
  assert.equal(fit('solo'),'contain');assert.equal(fit('portrait'),'contain');assert.equal(fit(''),'cover');
  assert.match(css,/data-board-queen-image="portrait"\] img\{left:56%;width:44%/);
});

const seasonSource=()=>JSON.parse(read('data/board-library/part-e.json')).threads;
const midnight=date=>Date.parse(date+'T00:00:00+09:00');
const copyText=t=>[t.title,t.body,...t.comments.map(c=>c.body)].join('\n');

test('all eight reviewed season threads and winner pattern meet editorial and roster rules',()=>{
  const f=createBannerFixture(),roster=f.c.window.HaniOrganizationRoster,source=seasonSource();
  const active=new Set(roster.people.filter(p=>p.status!=='planned'&&p.id!==roster.chairman.id).map(p=>p.id));
  assert.equal(source.length,9);
  assert.deepEqual(source.slice(0,8).map(t=>t.id),Array.from({length:8},(_,i)=>'queen-2026-11-s0'+(i+1)));
  assert.deepEqual(source.slice(0,8).map(t=>t.date),['05','08','12','16','20','24','27','30'].map(d=>'2026-11-'+d));
  assert.deepEqual(source,validateLibrary(source,roster));
  for(const t of source){
    assert.equal(t.category,'LOUNGE');assert.ok(active.has(t.authorId));
    assert.ok(t.topics.includes('이달의 퀸'));assert.match(copyText(t),/고마|감사|응원|함께/);
    assert.doesNotMatch(copyText(t),/외모|몸매|섹시|얼굴|미모|예쁘|귀여|손목|어깨|입꼬리|눈빛|체력/);
    assert.doesNotMatch(copyText(t),/오빠|성민|개구리|회장(?!님)|매수|매도|종목|수익률|투자|하방 위험/);
    assert.doesNotMatch(copyText(t),/1위|선두|중위권|뒤처|막판 추격|표 차이가|득표수는 소박|이름 옆 숫자/);
    assert.doesNotMatch(copyText(t),/일론|머스크|트럼프|테슬라|삼성|애플/);
    assert.equal(t.poll,undefined,'season copy does not create another election');
    for(const comment of t.comments){
      assert.ok(active.has(comment.authorId),t.id+' real staff commenter');
      assert.equal(comment.voteChoice,undefined,'copy never asserts a ballot');
      assert.doesNotMatch(comment.body,/(?:1위|선두|최다 득표)|(?:벌써|이미|방금).{0,12}투표(?:했|마쳤|완료)/);
    }
    assert.deepEqual(plain(f.c.HaniBoardLibrary.threads.find(row=>row.id===t.id)),t);
  }
});

test('every season thread is date-gated and keeps its own copy through daily and reply projections',()=>{
  const f=createBannerFixture(),before=JSON.stringify(f.c.state);
  let sequence=0;f.c.uid=()=> 'season-comment-'+(++sequence);
  for(const thread of seasonSource().slice(0,8)){
    const start=midnight(thread.date);
    assert.equal(f.c.libraryEligible(thread,start-1),false,thread.id+' hidden before KST date');
    assert.equal(f.c.libraryEligible(thread,start),true,thread.id+' available from date');
    assert.equal(f.c.libraryEligible(thread,midnight('2026-12-01')),false,'expired season does not generate in December');
    for(let slot=0;slot<4;slot++){
      const source='daily:'+thread.date+':'+slot,projected=f.c.dailyThread(thread,source,start);
      assert.deepEqual(plain(projected),thread,'season cannot turn into random fun copy');
      const row={...projected,id:'season-'+thread.id,libraryId:thread.id,sourceEventId:source,createdAt:new Date(start+12*3600000).toISOString()};
      const queued=f.c.publicationReplies(row,[row],[]);
      assert.deepEqual(plain(queued.map(c=>({authorId:c.authorId,body:c.body}))),thread.comments.map(c=>({authorId:c.authorId,body:c.body})));
      assert.ok(queued.every(c=>Date.parse(c.scheduledAt)>=start));
    }
  }
  assert.equal(JSON.stringify(f.c.state),before);
});

test('season comments remain neutral under every daily live leader and owner choice',()=>{
  const f=createBannerFixture(),post=monthlyPost(f),source=seasonSource().slice(0,8),leaders=new Set();
  for(let choice=-1;choice<post.poll.options.length;choice++){
    post.poll.votes=choice<0?{}:{seongmin:choice};
    for(let day=3;day<=30;day++){
      const now=at('2026-11-'+String(day).padStart(2,'0'));f.setNow(now);
      f.c.state=freeze({boardPosts:[structuredClone(post)],boardComments:[]});
      const live=f.c.queenTally(post,now);leaders.add(live.member.id);
      for(const thread of source.filter(t=>midnight(t.date)<=now)){
        for(const c of f.c.publicationThread({...thread,libraryId:thread.id}).comments){
          assert.doesNotMatch(c.body,/1위|선두|중위권|득표수|표 차이|순위가|왕관의 주인공은/);
          assert.equal(c.voteChoice,undefined);
        }
      }
    }
  }
  assert.ok(leaders.size>1,'neutral comments tested against changing computed leaders');
});

test('winner speech and crown handover appear at next KST month only with a computed result',()=>{
  const f=createBannerFixture(),post=monthlyPost(f),end=midnight('2026-12-01'),pattern=seasonSource().at(-1);
  f.c.state=freeze({boardPosts:[post],boardComments:[]});
  assert.equal(pattern.date,'2026-12-01');assert.match(pattern.title,/\{winner\}/);assert.match(pattern.body,/王冠|왕관/);
  assert.equal(pattern.comments.length,0);
  assert.equal(f.c.libraryEligible(pattern,end),false,'winner pattern never enters the save queue');
  assert.equal(f.c.queenResultThreads(end-1).length,0);
  const before=JSON.stringify(f.c.state),library=JSON.stringify(f.c.HaniBoardLibrary);
  const expected=f.c.queenTally(post,end-1).member,result=f.c.queenResultThreads(end)[0];
  assert.equal(result.authorId,expected.id);assert.equal(result.createdAt,new Date(end).toISOString());
  assert.ok(result.title.includes(expected.name));assert.ok(result.body.includes(expected.name));
  assert.match(result.body,/감사|고마/);assert.match(result.body,/왕관.*이어받/);
  assert.doesNotMatch(result.title+result.body,/\{winner(?:Id)?\}/);
  assert.deepEqual(plain(f.c.queenResultThreads(at('2027-01-01'))[0]),plain(result),'published result remains readable');
  assert.equal(f.c.listPosts('LOUNGE','',end-1).some(p=>p.queenResult),false);
  assert.equal(f.c.listPosts('LOUNGE',expected.name,end).find(p=>p.queenResult).authorId,expected.id);
  for(const bad of [null,{...post,pending:true},{...post,draft:true},{...post,disposition:'archived'},
    {...post,createdAt:new Date(end).toISOString()},{...post,poll:{options:[],votes:{}}},
    {...post,poll:{options:['unknown'],votes:{}}}]){
    f.c.state=freeze({boardPosts:bad?[bad]:[],boardComments:[]});
    assert.equal(f.c.queenResultThreads(end).length,0,'no published result, no speech');
  }
  f.c.state=freeze({boardPosts:[post],boardComments:[]});
  assert.equal(JSON.stringify(f.c.state),before);assert.equal(JSON.stringify(f.c.HaniBoardLibrary),library);
});

test('winner identity follows the computed result for different winners and months, never the template author',()=>{
  const f=createBannerFixture(),members=f.c.window.HaniOrganizationRoster.people,template=seasonSource().at(-1);
  const monthly=f.c.HaniBoardLibrary.threads.find(t=>t.id==='queen-2026-11');
  for(const month of ['2026-11','2026-12']){
    const end=Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),1)-9*3600000;
    f.c.HaniBoardLibrary={threads:[monthly,{...template,id:'queen-'+month+'-winner',date:new Date(end+9*3600000).toISOString().slice(0,10)}]};
    for(const candidate of members){
      const post={id:'poll',libraryId:'queen-'+month,createdAt:month+'-03T08:00:00+09:00',poll:{options:[candidate.name],votes:{seongmin:0}}};
      f.c.state=freeze({boardPosts:[post],boardComments:[]});
      const result=f.c.queenResultThreads(end)[0],expected=f.c.queenTally(post,end-1).member;
      assert.equal(result.authorId,expected.id);assert.equal(result.authorId,candidate.id);
      const name=expected.name.split(' · ').at(-1);
      assert.ok(result.title.includes(name));assert.ok(result.body.includes(name));
      assert.equal(f.c.queenResultThreads(end-1).length,0);
    }
  }
});

test('winner opens in canonical list/detail renderer without writes or interactive save controls',()=>{
  const f=createBannerFixture(),post=freeze(monthlyPost(f)),now=midnight('2026-12-01');f.setNow(now);
  f.c.state=freeze({boardPosts:[post],boardComments:[]});
  Object.assign(f.c,{cloudUser:{id:'synthetic-owner'},loadRecovery:{active:false},importSyncHold:false,
    cloudRecoveryMode:false,cloudAutoSyncReady:true,cloudRuntime:{sync:'ON'},cloudHasMeaningfulLocalData:()=>true});
  const node=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,open:false,value:'',setAttribute(){}});
  const markup=read('index.html').match(/<section id="board"[\s\S]*?<\/section>/)[0];
  for(const [,key] of markup.matchAll(/data-board="([^"]+)"/g)){
    if(key!=='unread')f.fields.set('[data-board="'+key+'"]',node());
  }
  const before=JSON.stringify(f.c.state),winner=f.c.queenTally(post,now-1).member,row=f.c.queenResultThreads(now)[0];
  assert.equal(f.c.openPost(row.id,false),true);
  const article=f.fields.get('[data-board="article"]').innerHTML,list=f.fields.get('[data-board="list"]').innerHTML;
  assert.ok(article.includes(row.title));assert.ok(article.includes(row.body));assert.ok(article.includes(winner.name));
  assert.ok(list.includes(row.id));assert.equal(f.fields.get('[data-board="detail"]').hidden,false);
  assert.match(article,/<button[^>]+data-board-like[^>]+ disabled/);
  assert.equal(f.fields.get('[data-board="commentSubmit"]').disabled,true);
  assert.doesNotMatch(article,/data-board-edit|data-board-delete|data-board-vote/);
  assert.equal(JSON.stringify(f.c.state),before);
  assert.equal(f.c.state.boardPosts.some(p=>p.queenResult),false,'display result was never stored');
});

test('writable daily owner excludes winner pattern and never persists a display result',async()=>{
  const {api,handlers:h,context,inspection}=await import('./hani-board.test.mjs');
  const f=createBannerFixture(),post=monthlyPost(f),pattern=seasonSource().at(-1),now=midnight('2026-12-01');
  context.HaniBoardLibrary={threads:[pattern]};
  api.setState({...plain(api.freshState()),books:[{id:'fixture',title:'Synthetic baseline'}],boardPosts:[post],boardComments:[]});
  const before=JSON.stringify(api.getState()),queues=inspection().queues;
  const rows=h.generateDaily(now);
  assert.deepEqual(plain(rows),[post],'daily publication owner cannot queue the winner pattern');
  const reusable={...pattern,id:'reusable',date:undefined,title:'함께 쉬는 시간',body:'함께 차 한 잔 나눠요.'};
  context.HaniBoardLibrary={threads:[pattern,reusable]};
  const earlier={id:'earlier',libraryId:'reusable',authorId:'hani',createdAt:new Date(now-91*86400000).toISOString()};
  const recycled=h.generateDaily(now,[earlier]);
  assert.equal(recycled.length,2,'display-only pattern must not block normal exhausted-library reuse after 90 days');
  assert.equal(recycled[1].libraryId,'reusable');
  assert.equal(JSON.stringify(api.getState()),before);assert.equal(inspection().queues,queues);
});
}
