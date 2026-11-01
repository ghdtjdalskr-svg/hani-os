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
test('responsive portraits include Mochi; sprite remains art-only and closure stays at most 160',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});
  assert.deepEqual(closure.missing,[]);assert.ok(closure.files.length<=160);
  for(const id of ['cheese','cream','mochi'])for(const size of [720,256,128]){
    const path=size===720?`assets/profiles/hani-profile-${id}.webp`:`assets/profiles/thumb/hani-profile-${id}-${size}.webp`;
    assert.ok(closure.files.includes(path),path);assert.ok(css.includes("url('./"+path+"')"));
  }
  assert.ok(!closure.files.some(p=>p.startsWith('artifacts/queen-poster/')),'poster art is not shipped yet');
  assert.ok(!closure.files.includes('artifacts/office-pets-npc/pet-rabbit.webp'));
  assert.equal(fs.existsSync(new URL('../assets/sprites-v3/pet-rabbit.webp',import.meta.url)),false,'rabbit runtime connection needs a separate manifest PR');
  console.log(JSON.stringify({closure:closure.files.length,limit:160,missing:closure.missing.length}));
});
test('Mochi atlas decodes ten contained left/right frames, distinct hop phases and translucent shadows',async()=>{
  const buffer=fs.readFileSync(new URL('../artifacts/office-pets-npc/pet-rabbit.webp',import.meta.url));
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
test('Mochi comparison uses the real lobby at CSS-equivalent desktop/phone sizes with all three mascots',async()=>{
  const evidence=JSON.parse(read('artifacts/mascots-poster/mochi/compare-evidence.json'));
  const file=fs.readFileSync(new URL('../artifacts/mascots-poster/mochi-compare.png',import.meta.url));
  const m=await sharp(file).metadata();assert.equal(m.width,1200);assert.equal(m.height,1220);
  const floor=fs.readFileSync(new URL('../assets/building/floor-1f-217.webp',import.meta.url));
  for(const panel of evidence.panels){
    assert.equal(panel.cellHeight,Math.round(Math.max(40,panel.width*.068)));
    assert.deepEqual(panel.actors.map(a=>a.name),['치즈','크림','모찌']);
    const base=await sharp(floor).resize(panel.width,panel.height).png().toBuffer();
    const layers=[];
    for(const actor of panel.actors){
      const input=await sharp(fs.readFileSync(new URL('../'+actor.file,import.meta.url))).extract({left:96,top:0,width:96,height:144}).resize(Math.round(panel.cellHeight*96/144),panel.cellHeight).png().toBuffer();
      layers.push({input,left:actor.left,top:actor.top});
    }
    const expected=await sharp(base).composite(layers).removeAlpha().raw().toBuffer();
    const actual=await sharp(file).extract({left:panel.left,top:panel.top,width:panel.width,height:panel.height}).removeAlpha().raw().toBuffer();
    assert.ok(expected.equals(actual),'comparison retains real floor pixels outside the exact sprite cells');
  }
  assert.equal(evidence.browserCapture,false,'static composition, not a live browser claim');
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
