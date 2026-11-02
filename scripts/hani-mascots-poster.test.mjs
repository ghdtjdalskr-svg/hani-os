// Node-only real owner execution. No browser, Git, user data or network access.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {restoreResidentsSource} from './hani-office-residents-source.mjs';
import {createBannerFixture} from './hani-lounge-billboard.test.mjs';
const require=createRequire(import.meta.url);
const sharp=require(process.env.HANI_SHARP_PATH||os.homedir()+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
const hub=read('hani-organization-hub.js'),css=read('hani-organization-hub.css');
const ids=['hani','yuna','mir','seoyun','dohyun','serin','yuri','arin','gaeun','jieun','haru','naeun','hina','minji','sooyeon','sua','taeo','daon','yoonseul'];
const denied=()=>assert.fail('read-only mascot UI attempted write/network');
function fixture(){
  const nodes=new Map(),labels=[{},{}];
  const node=selector=>{
    if(nodes.has(selector))return nodes.get(selector);
    const value={dataset:{},value:selector==='#ogh-team-filter'?'all':'',hidden:false,textContent:'',innerHTML:'',open:false,
      style:{setProperty(){}},setAttribute(k,v){this[k]=v},addEventListener(){},append(){},after(){},insertAdjacentHTML(){},focus(){},
      showModal(){this.open=true},close(){this.open=false},querySelector:s=>node(selector+' '+s),querySelectorAll:()=>[]};
    nodes.set(selector,value);return value;
  };
  const root=node('root');root.dataset.hubTab='people';
  root.querySelector=node;
  root.querySelectorAll=s=>s==='#ogh-chart,#ogh-teams,.ogh-type-controls'?['#ogh-chart','#ogh-teams','.ogh-type-controls'].map(node):[];
  const c=vm.createContext({window:{dispatchEvent(){},addEventListener(){}},Event:class {},
    document:{getElementById:id=>id==='haniOrganizationHub'?root:null,querySelector:s=>s==='.organization-tabs'?{}:null,
      querySelectorAll:s=>s==='.sidebar-corporate-lockup small'?labels:[],createElement:()=>node('created-'+nodes.size)},
    localStorage:{setItem:denied,removeItem:denied,clear:denied},sessionStorage:{setItem:denied},save:denied,commit:denied,persist:denied,fetch:denied});
  vm.runInContext(hub,c);
  return {c,root,nodes,labels,node};
}
test('actual chart renders three noninteractive mascot cards outside the employee directory',()=>{
  const f=fixture(),html=f.root.innerHTML;
  const chart=html.slice(html.indexOf('<section id="ogh-chart"'),html.indexOf('<section id="ogh-teams"'));
  const mascots=chart.slice(chart.indexOf('<section class="ogh-mascots"'));
  assert.equal((mascots.match(/<article class="ogh-mascot">/g)||[]).length,3);
  for(const value of ['사내 마스코트','치즈','사내 고양이','도도하고 느긋하게, 어느새 곁에 와 있어요.','크림','사내 강아지','사람을 좋아하는, 밝고 동글동글한 친구예요.','모찌','사내 토끼','조용하고 섬세하게 지켜보다, 천천히 마음을 열고 발치에 앉아요.','함께 지내는 친구들을 소개합니다.'])assert.ok(mascots.includes(value),value);
  assert.doesNotMatch(mascots,/두 친구/);
  assert.equal((mascots.match(/role="img" aria-label=/g)||[]).length,3);
  assert.doesNotMatch(mascots,/<a\b|<button\b|data-person|data-card-person|data-team=/);
  assert.equal((html.match(/class="ogh-person"/g)||[]).length,19);
  assert.doesNotMatch(html.slice(html.indexOf('<section id="ogh-people"')),/ogh-mascot|사내 고양이|사내 강아지|사내 토끼/);
});
test('real roster, sidebar, directory and overview headcounts remain nineteen',()=>{
  const f=fixture(),roster=f.c.window.HaniOrganizationRoster;
  assert.deepEqual(Array.from(roster.people,p=>p.id).sort(),[...ids].sort());
  assert.ok(Object.isFrozen(roster)&&Object.isFrozen(roster.people));
  f.labels.forEach(l=>assert.equal(l.textContent,'PERSONAL AI COMPANY · 19 AGENTS'));
  assert.equal(f.node('#ogh-count').textContent,'19 PEOPLE');
  const model=f.c.window.HaniOrganizationHub.overviewData({boardPosts:['cheese','cream','mochi'].map(authorId=>({id:authorId,authorId,createdAt:'2026-11-02T00:00:00Z'}))},[],roster,Date.parse('2026-11-02T03:00:00Z'));
  assert.equal(model.stats.find(s=>s.label==='AI 직원').value,19);
  assert.equal(model.employee,null,'a mascot post cannot become employee of the month');
  const base=vm.createContext({window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]}});
  // Mount and no-DOM consumers must expose the same canonical staff registry.
  vm.runInContext(hub,base);
  assert.equal(JSON.stringify(roster),JSON.stringify(base.window.HaniOrganizationRoster));
});
test('canonical tab selection hides the chart and mascots together; no missing person routes',()=>{
  const f=fixture(),api=f.c.window.HaniOrganizationHub;
  assert.equal(f.node('#ogh-chart').hidden,false);
  api.selectTab('aiTeam');assert.equal(f.node('#ogh-chart').hidden,true);assert.equal(f.node('#ogh-count').textContent,'10 PEOPLE');
  api.selectTab('archive');assert.equal(f.node('#ogh-chart').hidden,true);
  api.selectTab('people');assert.equal(f.node('#ogh-chart').hidden,false);assert.equal(f.node('#ogh-count').textContent,'19 PEOPLE');
  for(const id of ['cheese','cream','mochi'])assert.equal(api.openPerson(id),false);
  assert.equal(f.node('dialog').open,false);
});
test('actual board polls, staff ballots and activity ranks exclude all three mascots',()=>{
  const f=createBannerFixture(Date.parse('2026-11-30T14:59:59Z'));
  const thread=f.c.HaniBoardLibrary.threads.find(t=>t.id==='queen-2026-11');
  const options=Array.from(thread.poll.options);
  assert.equal(options.length,19);assert.equal(new Set(options).size,19);
  for(const name of ['치즈','크림','모찌'])assert.ok(!options.includes(name));
  const post={id:'poll',libraryId:thread.id,createdAt:'2026-11-03T08:00:00+09:00',poll:{options,votes:{cheese:0,cream:1,mochi:2}}};
  const ballots=Array.from(f.c.queenStaffBallots(post));
  assert.equal(ballots.length,19);assert.ok(ballots.every(b=>ids.includes(b.authorId)));
  assert.equal(f.c.queenStandings(post).named,19);
  const ranks=Array.from(f.c.window.HaniBoard.weeklyActivity());
  assert.equal(ranks.length,19);assert.ok(ranks.every(r=>ids.includes(r.id)));
});
test('nine actual WebP portraits decode at staff dimensions and thumbnail dimensions',async()=>{
  for(const id of ['cheese','cream','mochi'])for(const size of [720,256,128]){
    const path=size===720?`assets/profiles/hani-profile-${id}.webp`:`assets/profiles/thumb/hani-profile-${id}-${size}.webp`;
    // URL file paths may contain non-ASCII Windows names; use Buffer for portability.
    const buffer=fs.readFileSync(new URL('../'+path,import.meta.url));
    const metadata=await sharp(buffer).metadata();
    assert.equal(metadata.format,'webp');assert.equal(metadata.width,size);assert.equal(metadata.height,size);
    assert.equal((await sharp(buffer).raw().toBuffer({resolveWithObject:true})).info.width,size);
  }
});
test('responsive portraits include Mochi; approved sprite joins residents and closure stays at most 160',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});
  assert.deepEqual(closure.missing,[]);assert.ok(closure.files.length<=160);
  for(const id of ['cheese','cream','mochi'])for(const size of [720,256,128]){
    const path=size===720?`assets/profiles/hani-profile-${id}.webp`:`assets/profiles/thumb/hani-profile-${id}-${size}.webp`;
    assert.ok(closure.files.includes(path),path);assert.ok(css.includes("url('./"+path+"')"));
  }
  assert.ok(!closure.files.some(p=>p.startsWith('artifacts/queen-poster/')),'poster art is not shipped yet');
  assert.ok(!closure.files.includes('artifacts/office-pets-npc/pet-rabbit.webp'));
  assert.ok(closure.files.includes('assets/sprites-v3/pet-rabbit.webp'));
  assert.equal(hash(fs.readFileSync(new URL('../assets/sprites-v3/pet-rabbit.webp',import.meta.url))),'dd0e60bde7eb949bac0d491b659d2d93720e042b172c328457a7e9f29975ec2f','only approved rabbit bytes shipped');
  console.log(JSON.stringify({closure:closure.files.length,limit:160,missing:closure.missing.length}));
});
test('Mochi atlas decodes ten contained left/right frames, distinct hop phases and translucent shadows',async()=>{
  const buffer=fs.readFileSync(new URL('../assets/sprites-v3/pet-rabbit.webp',import.meta.url));
  const metadata=await sharp(buffer).metadata();
  assert.equal(metadata.format,'webp');assert.equal(metadata.width,480);assert.equal(metadata.height,288);assert.ok(metadata.hasAlpha);
  assert.ok(buffer.length<50000,'same pet atlas byte budget as cat and dog');
  const frames=[];
  for(let row=0;row<2;row++)for(let col=0;col<5;col++){
    const raw=await sharp(buffer).extract({left:col*96,top:row*144,width:96,height:144}).ensureAlpha().raw().toBuffer();
    let visible=0,partialShadow=0;
    for(let y=0;y<144;y++)for(let x=0;x<96;x++){
      const a=raw[(y*96+x)*4+3];
      if(a>32)visible++;
      if(y>=128&&a>0&&a<240)partialShadow++;
      if(x===0||x===95||y===0||y>=136)assert.equal(a,0,`frame ${col},${row} clips cell edge ${x},${y}`);
    }
    assert.ok(visible>500,`nonempty frame ${col},${row}`);assert.ok(partialShadow>10,'generated translucent contact shadow retained');
    frames.push(raw);
  }
  for(let col=0;col<5;col++)for(let y=0;y<144;y++)for(let x=0;x<96;x++){
    // Alpha must mirror exactly; lossy WebP color planes need not be byte-identical.
    assert.equal(frames[col][(y*96+x)*4+3],frames[col+5][(y*96+95-x)*4+3]);
  }
  let changed=0;
  for(let i=3;i<frames[2].length;i+=4)if(Math.abs(frames[2][i]-frames[3][i])>32)changed++;
  assert.ok(changed>500,'hop-a and hop-b have distinct gathered / extended silhouettes');
});
// qa-b11c: execute the real board read and the mounted office owner, no browser.
import {fixture as officeFixture} from './hani-building-206-engine.test.mjs';
import {loadScene as posterScene,at as posterAt} from './hani-office-lively-fixture.mjs';
import {createHash} from 'node:crypto';
const officeSource=read('hani-office-live.js'),officeCss=read('hani-office-live.css');
const posterPath='assets/queen/poster-2026-10.webp';
const settlePoster=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
async function posterFixture({date='2026-11-02T10:00:00+09:00',art=true,board=true}={}){
  const canonical=createBannerFixture(),writes=[],pending=new Map();let timer=0;
  const deny=(...args)=>{writes.push(args);throw Error('poster attempted write/network')};
  const window=board?{HaniBoard:canonical.c.window.HaniBoard}:{};
  const f=officeFixture('10:00',true,()=>art,JSON.parse(read('assets/data/office-actions-221.json')),{
    window,setTimeout(fn,ms){pending.set(++timer,{fn,ms});return timer},clearTimeout:id=>pending.delete(id),
    localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},
    save:deny,persist:deny,commit:deny,fetch:async(url,options)=>{assert.ok(!options?.method||options.method==='GET');assert.match(String(url),/^\.\/assets\/data\//);return {ok:false}},supabase:{from:deny},
  });
  await settlePoster();f.setDateTime(date);f.click('1f');await settlePoster();
  const poster=f.map.querySelector('.hani-office-queen-poster'),bubble=f.map.querySelector('.hani-office-character-bubble');
  return {...f,poster,bubble,canonical,writes,pending};
}

test('poster: canonical board read shares the billboard winner/month and reads names from roster data',()=>{
  const f=createBannerFixture(),api=f.c.window.HaniBoard;
  for(const date of ['2026-10-31T23:59:59+09:00','2026-11-01T00:00:00+09:00','2026-11-30T23:59:59+09:00','2026-12-01T00:00:00+09:00','2027-01-01T00:00:00+09:00']){
    const now=Date.parse(date),award=api.queenWinner(now),slide=f.c.queenSlides(now).find(s=>s.kind==='queen-winner');
    assert.equal(Boolean(award),Boolean(slide),date);
    if(award){assert.equal(award.month,'2026-10');assert.ok(slide.href.endsWith('/'+award.id));assert.equal(slide.title,award.name+' · '+award.rank)}
  }
  const old=f.c.window.HaniOrganizationRoster;
  f.c.window.HaniOrganizationRoster={...old,people:old.people.map(p=>p.id==='seoyun'?{...p,name:'자료이름'}:p)};
  assert.equal(api.queenWinner(Date.parse('2026-11-02T10:00:00+09:00')).name,'자료이름');
});

test('poster: one persistent element is visible only on the loaded 1F map and survives every floor change',async()=>{
  const f=await posterFixture(),slot=f.poster,actors=[...f.ids.get('haniOfficeActors').children];assert.ok(slot);assert.equal(slot.tagName,'button');assert.equal(slot.hidden,false);
  for(const floor of ['2f','3f','4f','5f','1f','4f','1f']){
    f.click(floor);await settlePoster();assert.equal(slot.hidden,floor!=='1f',floor);
    assert.equal(f.map.querySelector('.hani-office-queen-poster'),slot);assert.equal(f.map.querySelectorAll('.hani-office-queen-poster').length,1);
    assert.deepEqual(f.ids.get('haniOfficeActors').children,actors);
  }
});

test('poster: October award is shown throughout November KST, never in October, December or an unknown month',async()=>{
  const f=await posterFixture();
  for(const [date,visible]of [['2026-10-31T23:59:59+09:00',false],['2026-11-01T00:00:00+09:00',true],['2026-11-30T23:59:59+09:00',true],['2026-12-01T00:00:00+09:00',false],['2027-01-01T00:00:00+09:00',false]]){
    f.setDateTime(date);f.click('1f');await settlePoster();assert.equal(f.poster.hidden,!visible,date);
    assert.equal(f.poster.querySelector('img'),null,'CSS image has no broken-image glyph');
  }
  f.canonical.c.window.HaniBoard={queenWinner:()=>({month:'2099-01',name:'미등록',id:'hani'})};
  f.context.window.HaniBoard=f.canonical.c.window.HaniBoard;f.click('1f');await settlePoster();assert.equal(f.poster.hidden,true);
});

test('poster: missing board source or fallback art shows nothing; stale background completion cannot leak to another floor',async()=>{
  for(const options of [{board:false},{art:false}]){const f=await posterFixture(options);assert.equal(f.poster.hidden,true);f.poster.onclick();assert.equal(f.bubble.hidden,true)}
  const f=await posterFixture();f.click('1f');f.click('5f');await settlePoster();assert.equal(f.poster.hidden,true);assert.equal(f.map.dataset.floor,'5f');
});

test('poster: art-map percent bounds clear the entire app sign box, elevator and existing frame; scale behind actors',async()=>{
  const f=await posterFixture(),s=f.poster.style,b=[parseFloat(s.left),parseFloat(s.top),parseFloat(s.width),parseFloat(s.height)];
  assert.deepEqual(b.slice(0,2),[41,19]);assert.ok(Math.abs(b[2]-60/1672*100)<1e-10);assert.ok(Math.abs(b[3]-90/941*100)<1e-10);
  const overlap=([x,y,w,h],[l,t,r,bottom])=>x<r&&x+w>l&&y<bottom&&y+h>t;
  for(const [name,box]of [['HANI GROUP sign',[40,10,58,17.5]],['elevator',[17,2,29,29]],['art frame',[69,5,82,21]]])assert.equal(overlap(b,box),false,name);
  for(const width of [360,390,416,1440]){const height=width*941/1672,px=b[2]/100*width,py=b[3]/100*height;assert.ok(Math.abs(px/py-2/3)<1e-10);assert.ok(b[0]+b[2]<100&&b[1]+b[3]<100)}
  const block=officeCss.match(/\.hani-office-queen-poster\{([^}]+)\}/)[1];
  assert.match(block,/position:absolute/);assert.match(block,/z-index:2/);assert.match(officeCss,/\.hani-office-sprite\{[^}]*z-index:4/);
  assert.match(officeCss,/\.hani-office-queen-poster\[hidden\]\{display:none\}/);
});

test('poster: tapping uses the existing bubble, current data name, native button and close timer without a profile or zoom',async()=>{
  const f=await posterFixture(),roster=f.canonical.c.window.HaniOrganizationRoster;
  f.canonical.c.window.HaniOrganizationRoster={...roster,people:roster.people.map(p=>p.id==='seoyun'?{...p,name:'당선자료'}:p)};
  f.poster.onclick();assert.equal(f.bubble.hidden,false);assert.equal(f.bubble.querySelector('p').textContent,'👑 10월의 퀸 · 당선자료');
  assert.equal(f.poster.getAttribute('aria-label'),'👑 10월의 퀸 · 당선자료');assert.equal(f.bubble.querySelector('a').hidden,true);
  assert.equal(f.bubble.querySelector('.hani-office-bubble-sprite').hidden,true);assert.equal(f.bubble.dataset.zoom,'false');
  assert.equal(f.map.querySelectorAll('.hani-office-character-bubble').length,1);assert.equal(f.poster.type,'button');
  const timer=[...f.pending.values()].find(t=>t.ms===3000);assert.ok(timer);timer.fn();assert.equal(f.bubble.hidden,true);
  f.poster.onclick();f.poster.onkeydown({key:'Escape'});assert.equal(f.bubble.hidden,true);
  f.poster.onclick();f.click('2f');assert.equal(f.bubble.hidden,true);assert.equal(f.writes.length,0);
});

test('poster: steady frames add no layout reads or persistence/network paths; staff/visitor/resident plans stay byte-identical',async()=>{
  const f=await posterFixture();let reads=0;
  for(const node of [f.map,...f.root.querySelectorAll('*')])node.getBoundingClientRect=()=>{reads++;throw Error('unexpected frame layout read')};
  for(let i=0;i<20;i++){f.setDateTime('2026-11-02T10:00:00.'+String(i*5).padStart(3,'0')+'+09:00');f.timers.find(t=>t.ms===100).fn()}
  assert.equal(reads,0);assert.equal(f.writes.length,0);
  // The checked-in delta verifies every source byte before restoring the pre-resident owner.
  const old=posterScene({transform:restoreResidentsSource}).scene,current=posterScene().scene;
  const mounted=f.context.HaniBuildingScene;
  for(const day of ['2026-10-31','2026-11-01','2026-11-02','2026-11-30','2026-12-01'])for(const chairmanPresent of [false,true]){
    const options={chairmanPresent},plan=current.scheduler.plan(day,options),previous=old.scheduler.plan(day,options);
    assert.equal(JSON.stringify(plan),JSON.stringify(previous));assert.equal(JSON.stringify(current.scheduler.blockPlan(day,0,plan,options)),JSON.stringify(old.scheduler.blockPlan(day,0,previous,options)));
    for(const seconds of [1,7200,25200,36000,50400,79200,86399]){
      const now=posterAt(day,seconds),snap=current.snapshot(now,options),before=old.snapshot(now,options);
      assert.equal(JSON.stringify(snap),JSON.stringify(before));
      assert.equal(JSON.stringify(current.residents.snapshot(now,snap,true)),JSON.stringify(mounted.residents.snapshot(now,before,true)),'poster UI leaves all resident schedules unchanged');
    }
  }
});

test('poster: shipped WebP decodes under 120KB, retains approved ratio and is in the literal runtime closure',async()=>{
  const file=fs.readFileSync(new URL('../'+posterPath,import.meta.url)),meta=await sharp(file).metadata();
  assert.equal(meta.format,'webp');assert.deepEqual([meta.width,meta.height],[360,540]);assert.ok(file.length<120000);
  const closure=await resolveRuntimeClosure({exists:fs.existsSync,read:fs.readFileSync});assert.ok(closure.files.includes(posterPath));assert.ok(closure.files.length<=160);assert.deepEqual(closure.missing,[]);
  // Frozen shipped inventory from the supplied main 476210c; no local artifact baseline.
  assert.equal(hash(JSON.stringify([...closure.files].sort())),'27e69a83e1d076a2ec278876ab8fe6041846a958af64a91a70c438a522f3a799','exact shipped closure');
  assert.equal(hash(fs.readFileSync(new URL('../index.html',import.meta.url))),'529a83691c5fb522636738add9ffb9e546a1f09665c2ed0de7ecb17d0c2c14ca','frozen shipped index');
  assert.equal(hash(fs.readFileSync(new URL('../hani-main.js',import.meta.url))),'642e9ff30e37f334295a3a019ce5583f2043e10c1b24d5fd5e3e2ffaa3eb78b8','frozen shipped main');
  console.log(JSON.stringify({poster:{left:41,top:19,width:60/1672*100,height:90/941*100,bytes:file.length},closure:closure.files.length,limit:160,missing:0}));
});
