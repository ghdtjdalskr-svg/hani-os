// node scripts/hani-office-zoom.test.mjs
// Real CSS/layout QA: node scripts/hani-office-zoom.test.mjs --browser <playwright/index.mjs> [browser.exe]
// DOM doubles below exercise the mounted owner; only the browser test claims pixel layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';

const source=fs.readFileSync('hani-office-live.js','utf8');
const manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json','utf8'));
const {scene,table}=loadScene();
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
async function mount({width=390,reduced=false,loaded=true}={}){
  let serial=0;const pending=new Map(),writes=[];
  const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence/network')};
  const f=fixture('10:00',reduced,()=>loaded,table,{
    HaniOfficeV2Assets:{...assets,spritesV3:manifest},
    matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
    setTimeout(fn,ms){pending.set(++serial,{fn,ms});return serial},clearTimeout:id=>pending.delete(id),
    localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny,fetch:async()=>({ok:false}),
  });
  f.ids.set('app',{classList:{contains:()=>false}});f.document.visibilityState='visible';
  await flush();
  const panel=f.root.querySelector('.hani-office-character-bubble');
  const slot=panel.querySelector('.hani-office-bubble-sprite');
  const tap=actor=>f.ids.get('haniOfficeActors').events.click({target:actor.querySelector('.hani-office-sprite')});
  const run=ms=>{for(const [id,t]of [...pending])if(t.ms===ms){pending.delete(id);t.fn()}};
  return {...f,panel,slot,tap,run,pending,writes};
}
function sameSprite(f,actor){
  assert.equal(f.panel.hidden,false);assert.equal(f.slot.hidden,false);assert.equal(f.panel.dataset.zoom,'true');
  for(const property of ['backgroundImage','backgroundSize','backgroundPosition'])assert.equal(f.slot.style[property],actor.querySelector('.hani-office-sprite').style[property],property);
  assert.equal(f.slot.dataset.pose,actor.dataset.pose);
  assert.ok(Number(f.slot.style['--bubble-sprite-ratio'])>0);
}

test('zoom: staff/visitor/NPC/pet taps copy the currently loaded atlas frame into one persistent decorative slot',async()=>{
  for(const reduced of [false,true]){
    const f=await mount({reduced}),nodes=f.root.querySelectorAll('*'),slot=f.slot;
    const staff=f.visible().find(a=>!a.dataset.resident&&a.dataset.visitor!=='true');assert.ok(staff);f.tap(staff);sameSprite(f,staff);
    // Open again after a different existing atlas frame, without advancing its owner.
    staff.querySelector('.hani-office-sprite').style.backgroundPosition='100% 100%';staff.dataset.pose='walk-b';
    f.tap(staff);sameSprite(f,staff);assert.equal(slot.style.backgroundPosition,'100% 100%');
    const s=scene.scheduler,day='2026-11-02',o={chairmanPresent:false},formal=s.plan(day,o);
    const guest=s.blockPlan(day,0,formal,o).find(e=>e.visitor);assert.ok(guest);
    const now=at(day,(guest.performStart+guest.performEnd)/2);
    const state=s.snapshot(now,o).visitors.find(p=>p.id===guest.people[0].id);assert.ok(state);
    f.setDateTime(now.toISOString());f.click(state.floor);await flush();
    const visitor=f.visible().find(a=>a.dataset.person===state.id);assert.ok(visitor);f.tap(visitor);sameSprite(f,visitor);
    assert.equal(f.panel.querySelector('a').hidden,true);
    for(const kind of ['npc','pet']){
      f.setDateTime('2026-11-02T10:02:00+09:00');let actor;
      for(const floor of scene.floors){f.click(floor.id);await flush();actor=f.visible().find(a=>a.dataset.resident===kind);if(actor)break}
      assert.ok(actor,kind);f.tap(actor);sameSprite(f,actor);assert.equal(f.panel.querySelector('a').hidden,true);
    }
    assert.equal(f.slot,slot);assert.deepEqual(f.root.querySelectorAll('*'),nodes,'opens never create or replace nodes');
    assert.equal(slot.getAttribute('aria-hidden'),'true');assert.equal(slot.textContent,'');
    assert.equal(f.panel.getAttribute('aria-live'),'polite');assert.equal(f.panel.getAttribute('aria-atomic'),'false');
    assert.equal(f.panel.querySelector('p').getAttribute('aria-atomic'),'true');assert.equal(f.panel.querySelector('a').getAttribute('aria-live'),'off');
    assert.equal(f.writes.length,0);
  }
});

test('zoom: automatic floor bubble stays small, including after a previous manual zoom',async()=>{
  const f=await mount();
  const icons=()=>{for(const a of f.visible()){a.officeTravel=null;a.dataset.walking='false';a.dataset.pose='sitting';a.querySelector('.hani-office-prop').textContent='💬'}};
  icons();f.run(450);assert.equal(f.panel.hidden,false);assert.equal(f.slot.hidden,true);assert.equal(f.panel.dataset.zoom,'false');
  f.run(4000);f.tap(f.visible()[0]);assert.equal(f.slot.hidden,false);
  f.setDateTime('2026-11-02T10:03:00+09:00');f.click('3f');await flush();icons();f.run(450);
  assert.equal(f.panel.hidden,false);assert.equal(f.slot.hidden,true);assert.equal(f.panel.dataset.zoom,'false');
  f.setDateTime('2026-11-02T10:05:00+09:00');f.click('2f');await flush();
  for(const a of f.visible())a.querySelector('.hani-office-prop').textContent='';
  const resident=f.visible().find(a=>a.dataset.resident);assert.ok(resident);
  resident.hidden=false;resident.officeTravel=null;resident.dataset.walking='false';resident.dataset.pose='standing';resident.querySelector('.hani-office-prop').textContent='💬';
  f.run(450);assert.equal(f.panel.hidden,false);assert.equal(f.slot.hidden,true);assert.equal(f.panel.dataset.zoom,'false');
  assert.ok([...f.pending.values()].some(t=>t.ms===3000),'resident lifetime remains three seconds');
  assert.equal(f.root.querySelectorAll('.hani-office-bubble-sprite').length,1);
});

test('zoom: missing or failed sprite hides the slot and preserves the old bubble and line',async()=>{
  const f=await mount({loaded:false}),actor=f.visible()[0];f.tap(actor);
  assert.equal(f.panel.hidden,false);assert.equal(f.slot.hidden,true);assert.equal(f.panel.dataset.zoom,'false');
  assert.ok(f.panel.querySelector('p').textContent.includes(actor.querySelector('.hani-office-status').dataset.full));
  const ready=await mount(),a=ready.visible()[0];ready.tap(a);assert.equal(ready.slot.hidden,false);
  a.dataset.avatar='pending';ready.tap(a);assert.equal(ready.slot.hidden,true);assert.equal(ready.panel.dataset.zoom,'false');
});

test('zoom: fitBubble clamps all edges at 360/390/416/1280 widths',async()=>{
  for(const width of [360,390,416,1280]){
    const f=await mount({width}),mapWidth=width-48,mapHeight=mapWidth*941/1672;
    f.map.getBoundingClientRect=()=>rect(31,47,mapWidth,mapHeight);
    // Measured dimensions supplied by a DOM double; browser test below checks actual CSS dimensions.
    const bw=Math.min(mapWidth-8,380),bh=Math.min(mapHeight-8,width<=700?132:160);
    f.panel.getBoundingClientRect=()=>rect(31+(parseFloat(f.panel.style.left)||0),47+(parseFloat(f.panel.style.top)||0),bw,bh);
    for(const a of f.ids.get('haniOfficeActors').children){
      a.getBoundingClientRect=()=>rect(31+parseFloat(a.style.left)/100*mapWidth,47+parseFloat(a.style.top)/100*mapHeight,24,40);
      for(const n of a.querySelectorAll('*'))n.getBoundingClientRect=()=>rect(31,47,60,14);
    }
    const a=f.visible()[0];
    for(const [x,y]of [[0,0],[100,0],[0,100],[100,100],[50,50]]){
      a.style.left=x+'%';a.style.top=y+'%';f.tap(a);
      const left=parseFloat(f.panel.style.left),top=parseFloat(f.panel.style.top);
      assert.ok(left>=4&&left+bw<=mapWidth-4,`${width}: horizontal`);
      assert.ok(top>=4&&top+bh<=mapHeight-4,`${width}: vertical`);
      assert.equal(f.panel.style['--bubble-max-height'],mapHeight-8+'px');
    }
  }
});

test('zoom: waiting client/candidate labels use 대기 중 instead of rest on phone and desktop',async()=>{
  const labelSource=source.slice(source.indexOf('  function activityStatus('),source.indexOf('  // Batch reset'));
  for(const width of [390,1280]){
    const f=await mount({width}),actor=f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person==='visitor');
    f.map.getBoundingClientRect=()=>rect(0,0,width,width*941/1672);
    for(const [i,a]of f.ids.get('haniOfficeActors').children.entries()){
      a.getBoundingClientRect=()=>rect(20+i*4,120,24,40);
      for(const n of a.querySelectorAll('*'))n.getBoundingClientRect=()=>rect(0,0,60,14);
    }
    assert.ok(actor);actor.hidden=false;
    Object.assign(actor.dataset,{visitor:'true',name:'방문 고객',activity:'visit',zone:'lounge',place:'sofa-1f',walking:'false',behavior:'AT_PLACE',action:'base-work',event:'',emoji:''});
    actor.officeTravel=null;
    const api=vm.runInNewContext(labelSource+';({label,activityStatus})',{HaniBuildingScene:scene,matchMedia:()=>({matches:width<=600})});
    for(const [line,short]of [['상담 대기 중','상담 대기'],['면접 대기 중… 두근','면접 대기']]){
      actor.dataset.line=line;api.label(actor,line);assert.equal(actor.dataset.status,'waiting');
      const expected='💬 '+(width<=600?short.replaceAll(' ',''):short);
      assert.equal(actor.querySelector('.hani-office-status').textContent,expected);
      assert.equal(actor.querySelector('.hani-office-status-dot').title,'대기 중');
      assert.equal(scene.labels.short(line,new Set([short,short.replaceAll(' ','')]),'waiting',width<=600),width<=600?short.replaceAll(' ',''):short);
      f.tap(actor);assert.equal(f.panel.querySelector('p').textContent,'방문 고객 · 대기 중 · '+line);
      // Existing fitStatusLabels also copies the short label into the phone pill.
      actor.officeRow.events.click();if(width<=600)assert.equal(actor.officeCompact.textContent,' · '+expected);
      actor.dataset.walking='true';assert.equal(api.activityStatus(actor,line),'moving');actor.dataset.walking='false';
    }
  }
});

test('zoom: scheduler, snapshots and all three protected geometry functions stay byte identical to task base',()=>{
  // Pre-edit bytes verified against the e2cd3fd GitHub blob 5957499bd25d544a8ff6504afc2a2afa67f7a936.
  const baseline=fs.readFileSync(new URL('../artifacts/office-zoom/source-before.txt',import.meta.url),'utf8');
  assert.equal(createHash('sha256').update(baseline).digest('hex'),'d8f377329117914108645270e598d6d963cc640900f412203d3450aca679e68c');
  const section=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i);assert.ok(i>=0&&j>i,a);return text.slice(i,j)};
  for(const [a,b]of [['  function createScheduler(','  // Read-only label geometry'],['  function snapshot(now=new Date()','  function profile('],['    function screenHomeClear(','    function stationaryStops('],['  function placeStatusLabels(','  const scheduler='],['  function fitStatusLabels(','  if(buildingChairmanSlot())people.push']])assert.equal(section(source,a,b),section(baseline,a,b),a);
  const old=loadScene({transform:()=>baseline}).scene;
  for(const day of ['2026-11-02','2026-11-07'])for(const chairmanPresent of [false,true]){
    const o={chairmanPresent},a=scene.scheduler.plan(day,o),b=old.scheduler.plan(day,o);
    assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(JSON.stringify(scene.scheduler.blockPlan(day,0,a,o)),JSON.stringify(old.scheduler.blockPlan(day,0,b,o)));
    for(const seconds of [1,32400,36000,43200,64800,82800]){
      assert.equal(JSON.stringify(scene.scheduler.snapshot(at(day,seconds),o)),JSON.stringify(old.scheduler.snapshot(at(day,seconds),o)));
      assert.equal(JSON.stringify(scene.snapshot(at(day,seconds),o)),JSON.stringify(old.snapshot(at(day,seconds),o)));
    }
  }
  for(const token of ['setInterval(','setTimeout(','fetch('])assert.equal(source.split(token).length,baseline.split(token).length,token);
  assert.doesNotMatch(source,/localStorage|sessionStorage|supabase/);
});

const browserArg=process.argv.indexOf('--browser');
test('zoom: real browser CSS keeps manual/automatic bubbles inside the map at every requested viewport', {skip:browserArg<0},async()=>{
  const modulePath=process.argv[browserArg+1];assert.ok(modulePath,'supply playwright/index.mjs');
  const {chromium}=await import(pathToFileURL(path.resolve(modulePath)).href);
  const root=fileURLToPath(new URL('../',import.meta.url));
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.argv[browserArg+2]?{executablePath:process.argv[browserArg+2]}:{})});
    const base=`http://127.0.0.1:${server.address().port}/`;
    for(const width of [360,390,416,1280]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'no-preference'});
      // Test-owned clock/timers let us compare the same actor's original small bubble.
      await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
      await page.setContent(`<base href="${base}"><link rel="stylesheet" href="hani-office-live.css"><style>body{margin:0;padding:16px}.hani-office-live{padding:0;border:0}</style><div id="app"><section class="view active"><div class="hani-office-live" id="haniOfficeLive"><div class="hani-building-tabs"></div><div class="hani-office-scroll"><div class="hani-office-map" id="haniOfficeMap"><img class="hani-office-background"><img class="hani-office-foreground"><img class="hani-office-foreground"><img class="hani-office-foreground"><div id="haniOfficeActors"></div></div></div>${['haniOfficeConversation','haniOfficeMeeting','haniOfficeParticipants','haniOfficeQuestions','haniOfficeMeetingOpen','haniOfficeReturn','haniOfficeCaseState','haniOfficeReportLink','haniOfficeMeetingTitle','haniOfficeMeetingMeta','agentCaseDetail'].map(id=>`<div id="${id}" hidden></div>`).join('')}</div></section></div>`);
      await page.evaluate(({assets,manifest,table})=>{
        const RealDate=Date,instant=Date.parse('2026-11-02T10:02:00+09:00');
        window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[instant]))}static now(){return instant}};
        window.HaniOfficeV2Assets={...assets,spritesV3:manifest};window.HaniOfficeActions221=table;
        window.zoomTimers=[];window.setTimeout=(fn,ms)=>{window.zoomTimers.push({fn,ms});return window.zoomTimers.length};window.clearTimeout=id=>{if(window.zoomTimers[id-1])window.zoomTimers[id-1].cancelled=true};window.setInterval=()=>0;
      },{assets,manifest,table});
      await page.addScriptTag({url:base+'hani-organization-hub.js'});await page.addScriptTag({url:base+'hani-office-live.js'});
      await page.waitForFunction(()=>[...document.querySelectorAll('.hani-office-actor')].some(a=>!a.hidden&&a.dataset.avatar==='v2')&&window.zoomTimers.some(t=>t.ms===450&&!t.cancelled));
      const result=await page.evaluate(()=>{
        const map=document.getElementById('haniOfficeMap'),panel=map.querySelector('.hani-office-character-bubble'),slot=panel.querySelector('.hani-office-bubble-sprite');
        const actor=[...document.querySelectorAll('.hani-office-actor')].find(a=>!a.hidden&&a.dataset.avatar==='v2'&&!a.dataset.resident);
        for(const a of document.querySelectorAll('.hani-office-actor'))a.querySelector('.hani-office-prop').textContent='';
        actor.officeTravel=null;actor.dataset.walking='false';actor.dataset.pose='sitting';actor.querySelector('.hani-office-prop').textContent='💬';
        window.zoomTimers.find(t=>t.ms===450&&!t.cancelled).fn();
        const small=panel.getBoundingClientRect(),autoHidden=slot.hidden,autoZoom=panel.dataset.zoom;
        const original=document.createElement('div');original.className='hani-office-character-bubble';original.append(panel.querySelector('p').cloneNode(true),panel.querySelector('a').cloneNode(true));map.append(original);
        const old=original.getBoundingClientRect();original.remove();
        actor.click();const first=slot,checks=[];
        for(const [x,y]of [[0,0],[100,0],[0,100],[100,100],[50,50]]){
          actor.style.left=x+'%';actor.style.top=y+'%';actor.click();const m=map.getBoundingClientRect(),b=panel.getBoundingClientRect();
          checks.push({inside:b.left>=m.left&&b.top>=m.top&&b.right<=m.right&&b.bottom<=m.bottom,same:slot===first});
        }
        const height=slot.getBoundingClientRect().height,sprite=actor.querySelector('.hani-office-sprite');
        const copied=['backgroundImage','backgroundSize','backgroundPosition'].every(p=>slot.style[p]===sprite.style[p]);
        const text=panel.querySelector('p').textContent;
        return {autoHidden,autoZoom,small:[small.width,small.height],old:[old.width,old.height],checks,height,copied,text};
      });
      assert.equal(result.autoHidden,true);assert.equal(result.autoZoom,'false');assert.deepEqual(result.small,result.old,'automatic bubble dimensions remain original');
      assert.equal(result.height,width<=700?96:120);assert.ok(result.copied);assert.ok(result.checks.every(c=>c.inside&&c.same));
      const panel=page.locator('.hani-office-character-bubble');
      const bounds=await panel.evaluate(node=>{
        const actor=document.querySelector('.hani-office-actor[data-speaking="true"]');actor.dataset.event='zoom-long-line';
        actor.querySelector('.hani-office-status').dataset.full='방문 고객 · 대기 중 · 상담 대기 중 '.repeat(30);actor.click();
        const b=node.getBoundingClientRect(),m=node.parentElement.getBoundingClientRect();return b.right<=m.right&&b.bottom<=m.bottom&&b.left>=m.left&&b.top>=m.top;
      });
      assert.ok(bounds,'long line stays within capped bubble');
      fs.mkdirSync('artifacts/office-zoom',{recursive:true});await page.screenshot({path:`artifacts/office-zoom/zoom-${width}.png`});
      await page.close();
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
});
