// Node-only real owner execution. No browser, Git, user data or network access.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {createBannerFixture} from './hani-lounge-billboard.test.mjs';
const require=createRequire(import.meta.url);
const sharp=require(process.env.HANI_SHARP_PATH||os.homedir()+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
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
test('actual chart renders exactly two noninteractive mascot cards outside the employee directory',()=>{
  const f=fixture(),html=f.root.innerHTML;
  const chart=html.slice(html.indexOf('<section id="ogh-chart"'),html.indexOf('<section id="ogh-teams"'));
  const mascots=chart.slice(chart.indexOf('<section class="ogh-mascots"'));
  assert.equal((mascots.match(/<article class="ogh-mascot">/g)||[]).length,2);
  for(const value of ['사내 마스코트','치즈','사내 고양이','도도하고 느긋하게, 어느새 곁에 와 있어요.','크림','사내 강아지','사람을 좋아하는, 밝고 동글동글한 친구예요.'])assert.ok(mascots.includes(value),value);
  assert.equal((mascots.match(/role="img" aria-label=/g)||[]).length,2);
  assert.doesNotMatch(mascots,/<a\b|<button\b|data-person|data-card-person|data-team=/);
  assert.equal((html.match(/class="ogh-person"/g)||[]).length,19);
  assert.doesNotMatch(html.slice(html.indexOf('<section id="ogh-people"')),/ogh-mascot|사내 고양이|사내 강아지/);
});
test('real roster, sidebar, directory and overview headcounts remain nineteen',()=>{
  const f=fixture(),roster=f.c.window.HaniOrganizationRoster;
  assert.deepEqual(Array.from(roster.people,p=>p.id).sort(),[...ids].sort());
  assert.ok(Object.isFrozen(roster)&&Object.isFrozen(roster.people));
  f.labels.forEach(l=>assert.equal(l.textContent,'PERSONAL AI COMPANY · 19 AGENTS'));
  assert.equal(f.node('#ogh-count').textContent,'19 PEOPLE');
  const model=f.c.window.HaniOrganizationHub.overviewData({boardPosts:[{id:'cat',authorId:'cheese',createdAt:'2026-11-02T00:00:00Z'}]},[],roster,Date.parse('2026-11-02T03:00:00Z'));
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
  for(const id of ['cheese','cream'])assert.equal(api.openPerson(id),false);
  assert.equal(f.node('dialog').open,false);
});
test('actual board polls, staff ballots and activity ranks exclude both mascots',()=>{
  const f=createBannerFixture(Date.parse('2026-11-30T14:59:59Z'));
  const thread=f.c.HaniBoardLibrary.threads.find(t=>t.id==='queen-2026-11');
  const options=Array.from(thread.poll.options);
  assert.equal(options.length,19);assert.equal(new Set(options).size,19);
  assert.ok(!options.includes('치즈')&&!options.includes('크림'));
  const post={id:'poll',libraryId:thread.id,createdAt:'2026-11-03T08:00:00+09:00',poll:{options,votes:{cheese:0,cream:1}}};
  const ballots=Array.from(f.c.queenStaffBallots(post));
  assert.equal(ballots.length,19);assert.ok(ballots.every(b=>ids.includes(b.authorId)));
  assert.equal(f.c.queenStandings(post).named,19);
  const ranks=Array.from(f.c.window.HaniBoard.weeklyActivity());
  assert.equal(ranks.length,19);assert.ok(ranks.every(r=>ids.includes(r.id)));
});
test('six actual WebP portraits decode at staff dimensions and thumbnail dimensions',async()=>{
  for(const id of ['cheese','cream'])for(const size of [720,256,128]){
    const path=size===720?`assets/profiles/hani-profile-${id}.webp`:`assets/profiles/thumb/hani-profile-${id}-${size}.webp`;
    // URL file paths may contain non-ASCII Windows names; use Buffer for portability.
    const buffer=fs.readFileSync(new URL('../'+path,import.meta.url));
    const metadata=await sharp(buffer).metadata();
    assert.equal(metadata.format,'webp');assert.equal(metadata.width,size);assert.equal(metadata.height,size);
    assert.equal((await sharp(buffer).raw().toBuffer({resolveWithObject:true})).info.width,size);
  }
});
test('responsive portraits are scoped and runtime closure adds only six assets, at most 160',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});
  assert.deepEqual(closure.missing,[]);assert.ok(closure.files.length<=160);
  for(const id of ['cheese','cream'])for(const size of [720,256,128]){
    const path=size===720?`assets/profiles/hani-profile-${id}.webp`:`assets/profiles/thumb/hani-profile-${id}-${size}.webp`;
    assert.ok(closure.files.includes(path),path);assert.ok(css.includes("url('./"+path+"')"));
  }
  assert.ok(!closure.files.some(p=>p.startsWith('artifacts/queen-poster/')),'poster art is not shipped yet');
  console.log(JSON.stringify({closure:closure.files.length,limit:160,missing:closure.missing.length}));
});
test('poster and comparisons decode, include a true 60x90 sample and leave original lobby pixels intact',async()=>{
  for(const [path,width,height] of [['artifacts/queen-poster/2026-10-poster.webp',720,1080],['artifacts/queen-poster/2026-10-poster-60x90.png',60,90],['artifacts/mascots-poster/staff-mascots-compare.png',1440,384],['artifacts/queen-poster/2026-10-lobby-compare.png',3368,1420]]){
    const m=await sharp(fs.readFileSync(new URL('../'+path,import.meta.url))).metadata();assert.equal(m.width,width);assert.equal(m.height,height);
  }
  const raw=async path=>sharp(fs.readFileSync(new URL('../'+path,import.meta.url))).removeAlpha().raw().toBuffer();
  const before=await raw('assets/building/floor-1f-217.webp'),after=await raw('artifacts/queen-poster/2026-10-on-1f-60x90.png');
  let changed=0;
  for(let y=0;y<941;y++)for(let x=0;x<1672;x++){
    const i=(y*1672+x)*3;
    if(x>=900&&x<960&&y>=100&&y<190){if(!before.subarray(i,i+3).equals(after.subarray(i,i+3)))changed++;}
    else assert.ok(before.subarray(i,i+3).equals(after.subarray(i,i+3)),`unexpected change at ${x},${y}`);
  }
  assert.ok(changed>5000,'poster fills its exact 60x90 rectangle');
});
