// node scripts/hani-staff-floors-214.test.mjs [playwright index.mjs] [browser exe]
// Synthetic local preview only; external requests are blocked and no account is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import vm from 'node:vm';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {withoutDeskMascots} from './hani-desk-mascots-preservation.mjs';
import {fixture as officeFixture} from './hani-building-206-engine.test.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const staff = ['seoyun','dohyun','serin','yuri','arin','gaeun','taeo','mir'];
const profiles = staff.flatMap(id => [720,256,128].map(size => ({
  file: `assets/profiles/${size === 720 ? '' : 'thumb/'}hani-profile-${id}${size === 720 ? '' : '-'+size}.webp`,
  width: size, height: size, limit: size === 720 ? 73844 : size === 256 ? 18000 : 6000
})));
const floors = [1,2,3,4].map(n => ({file:`assets/building/floor-${n}f-215.webp`,width:1672,height:941,limit:350000}));
const assets = [...profiles, ...floors];
const context = vm.createContext({document:{getElementById:()=>null},window:{}});
vm.runInContext(read('hani-organization-hub.js'), context);
vm.runInContext(read('hani-office-live.js'), context);
const roster = context.window.HaniOrganizationRoster;
const building = context.HaniBuildingScene;
const refs = html => [...html.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]);
const exists = ref => fs.existsSync(path.join(root, ref));

function webpSize(bytes) {
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.readUInt32LE(4)+8, bytes.length);
  for (let offset=12; offset+8<=bytes.length;) {
    const type=bytes.toString('ascii',offset,offset+4), length=bytes.readUInt32LE(offset+4), start=offset+8;
    if(type==='VP8X') return [1+bytes.readUIntLE(start+4,3),1+bytes.readUIntLE(start+7,3)];
    if(type==='VP8 ') { assert.equal(bytes.toString('hex',start+3,start+6),'9d012a'); return [bytes.readUInt16LE(start+6)&16383,bytes.readUInt16LE(start+8)&16383]; }
    if(type==='VP8L') { const bits=bytes.readUInt32LE(start+1); return [(bits&16383)+1,((bits>>>14)&16383)+1]; }
    offset=start+length+(length%2);
  }
  throw Error('No WebP dimensions');
}

test('28 art files exist, have the expected WebP dimensions and bounded sizes', () => {
  for(const {file,width,height,limit} of assets) {
    const bytes=fs.readFileSync(path.join(root,file));
    assert.ok(bytes.length>1000 && bytes.length<=limit, file+' reasonable bytes');
    assert.deepEqual(webpSize(bytes),[width,height],file);
  }
  assert.ok(assets.reduce((n,a)=>n+fs.statSync(path.join(root,a.file)).size,0)<=1800000,'portrait + edited floor download budget');
});

test('existing organization, board, remote and office render paths resolve every staff portrait', () => {
  // Execute the unchanged owner helpers with canonical roster input, without mounting or saving.
  const portraitLine=read('hani-organization-hub.js').split('\n').filter(s=>s.includes('const portraitFiles=')||s.includes('const portrait =')).join('\n');
  const portrait=vm.runInNewContext(portraitLine+'; portrait;');
  const board=read('hani-board.js'), start=board.indexOf('  function avatar('), end=board.indexOf('  function authorCard(',start);
  const avatar=vm.runInNewContext(board.slice(start,end)+'; avatar;',{
    person:id=>id===roster.chairman.id?roster.chairman:roster.people.find(p=>p.id===id),
    actor:()=>roster.chairman.id, escape:String
  });
  const ui=read('hani-ui-v02992.js'), ps=ui.indexOf('const PAGE_CHARACTER_PROFILES='), pe=ui.indexOf('// Session-memory only:',ps);
  const pageProfiles=vm.runInNewContext(ui.slice(ps,pe)+'; PAGE_CHARACTER_PROFILES;');
  for(const p of roster.people) {
    const suffix=({daon:'-v2',yoonseul:'-v2',sua:'-id'})[p.id]||'';
    const full=`./assets/profiles/hani-profile-${p.id}${suffix}.webp`;
    assert.deepEqual(refs(portrait(p)),[full]);
    assert.deepEqual(refs(avatar(p.id)),[`./assets/profiles/thumb/hani-profile-${p.id}${suffix}-128.webp`]);
    assert.equal(building.profile(p.id),`./assets/profiles/thumb/hani-profile-${p.id}${suffix}-256.webp`);
    for(const ref of [...refs(portrait(p)),...refs(avatar(p.id)),building.profile(p.id)]) assert.ok(exists(ref),ref);
  }
  for(const [id,p] of Object.entries(pageProfiles)) {
    assert.equal(p.image,`./assets/profiles/hani-profile-${id}${['daon','yoonseul'].includes(id)?'-v2':''}.webp`);
    assert.ok(exists(p.image));
  }
  const archive=read('hani-character-archive.js');
  const archivePortrait=vm.runInNewContext(archive.slice(archive.indexOf('  function portrait('),archive.indexOf('  function ',archive.indexOf('  function portrait(')+3))+'; portrait;', {esc:String});
  assert.deepEqual(refs(archivePortrait({id:'mir'})),['./assets/profiles/hani-profile-mir.webp']);
  assert.deepEqual(refs(avatar('unknown-staff')),[],'unknown author retains initials fallback');
  assert.deepEqual(refs(avatar(roster.chairman.id)),['./assets/sprites-v2/seongmin.webp']);
  assert.ok(exists(refs(avatar(roster.chairman.id))[0]),'chairman sprite exists');
  for(const floor of building.floors) assert.ok(exists(floor.background)&&exists(floor.fallback),floor.id);
});

test('pre-mascot runtime closure has no missing references; dynamic art also exists and fits 25MB budget', async () => {
  // Exclude only the two exactly-once approved tags; mascot packaging requires separate verification.
  const closure=await resolveRuntimeClosure({exists,read:file=>file==='index.html'?Buffer.from(withoutDeskMascots(read(file))):fs.readFileSync(path.join(root,file))});
  assert.deepEqual(closure.missing,[]);
  const union=new Set([...closure.files,...assets.map(a=>a.file)]);
  const bytes=[...union].reduce((n,file)=>n+fs.statSync(path.join(root,file)).size,0);
  const contract=JSON.parse(read('dev-center/one-pass-gate-contract.json'));
  assert.equal(contract.contract_version,'2.0.9');
  assert.equal(contract.limits.max_total_bytes,25000000);
  assert.ok(bytes<=contract.limits.max_total_bytes);
  assert.ok(closure.files.length<=contract.limits.max_files);
  console.log(JSON.stringify({closureFiles:closure.files.length,closureBytes:[...closure.contents.values()].reduce((n,b)=>n+b.length,0),closurePlusNewArtBytes:bytes}));
  // Dynamic art is seeded separately; this does not build or certify a release package.
});

test('actual office renderer applies 217 plate-free backgrounds without mismatched masks and reuses actor slots', async () => {
  const f=officeFixture('09:00',true,exists);
  const actors=[...f.ids.get('haniOfficeActors').children];
  for(const floor of ['4f','3f','2f','1f','5f','4f']) {
    f.click(floor);
    await new Promise(resolve=>setImmediate(resolve));
    const src=['1f','2f','4f','5f'].includes(floor)?`./assets/building/floor-${floor}-217.webp`:`./assets/building/floor-${floor}-215.webp`;
    assert.equal(f.map.dataset.art,'floor');
    assert.equal(f.map.querySelector('.hani-office-background').src,src);
    const patches=f.map.querySelectorAll('.hani-office-foreground').filter(image=>!image.hidden);
    assert.equal(f.map.dataset.mask,'none');assert.equal(patches.length,0);
    assert.deepEqual(f.ids.get('haniOfficeActors').children,actors);
    for(const actor of f.visible()) {
      const image=actor.querySelector('.hani-office-avatar');
      if(image) assert.ok(exists(image.src));
    }
  }
});

test('real browser: 217 plate-free backgrounds, staff portraits and no overflow at 412/884/1440', async t => {
  if(process.argv.includes('--static')){t.skip('Node-only run requested; real browser belongs to Seoyun');return;}
  const modulePath=process.argv[2]||process.env.HANI_PLAYWRIGHT_MODULE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const executablePath=process.argv[3]||process.env.HANI_CHROME||[
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe'
  ].find(p=>fs.existsSync(p));
  const evidence=path.join(root,'.ai-budget-private/staff-floors-214');
  fs.mkdirSync(evidence,{recursive:true});
  const status={browser:'not started',viewports:[],errors:[],missing:[]};
  const save=()=>fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(status,null,2)+'\n');
  if(!fs.existsSync(modulePath)||!executablePath) {status.browser='unavailable';save();t.skip('Playwright or browser executable unavailable');return;}
  const {chromium}=await import(pathToFileURL(modulePath).href);
  let browser;
  try {browser=await chromium.launch({executablePath,headless:true});}
  catch(error) {
    if(!/EPERM|EACCES|sandbox|not permitted|Access is denied/i.test(String(error))) throw error;
    status.browser='blocked: '+String(error).slice(0,600);save();t.skip(status.browser);return;
  }
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
  const server=http.createServer((req,res)=>{
    const uri=decodeURIComponent(new URL(req.url,'http://local').pathname);
    const file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
    if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin=`http://127.0.0.1:${server.address().port}`;
    for(const width of [412,884,1440]) {
      const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
      await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:200,body:'',contentType:'text/plain'}));
      const page=await ctx.newPage();
      page.on('pageerror',error=>status.errors.push(error.message));
      page.on('response',response=>{if(response.status()===404)status.missing.push(response.url());});
      await page.goto(origin);
      await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&typeof showView==='function'&&!!window.HaniBuildingScene);
      await page.evaluate(()=>unlockLoginGate());
      const storage=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
      const noOverflow=async selector=>assert.ok(await page.evaluate(selector=>[document.documentElement,document.querySelector(selector)].every(e=>e&&e.scrollWidth<=e.clientWidth+2),selector),`${width} overflow: ${selector}`);
      await page.evaluate(()=>showView('organization/people'));
      await page.waitForSelector('[data-card-person="seoyun"] img');
      for(const id of staff) {
        const img=page.locator(`[data-card-person="${id}"] img`);
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(image=>image.decode());
        assert.equal(await img.getAttribute('src'),`./assets/profiles/hani-profile-${id}.webp`);
      }
      await noOverflow('#haniOrganizationHub');
      await page.screenshot({path:path.join(evidence,`${width}-organization.png`),fullPage:true});
      await page.evaluate(()=>showView('agentReview'));
      await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.floor==='4f');
      const host=await page.locator('#haniOfficeMap').elementHandle();
      for(const floor of ['4f','3f','2f','1f','5f']) {
        await page.locator(`[data-building-floor="${floor}"]`).click();
        await page.waitForFunction(f=>{const map=document.querySelector('#haniOfficeMap'),img=map.querySelector('.hani-office-background');return map.dataset.floor===f&&map.dataset.art==='floor'&&['none','interior'].includes(map.dataset.mask)&&img.getAttribute('src')===(['1f','2f','4f','5f'].includes(f)?`./assets/building/floor-${f}-217.webp`:`./assets/building/floor-${f}-215.webp`)&&img.complete&&img.naturalWidth===1672;},floor);
        assert.equal(await host.evaluate(node=>node===document.querySelector('#haniOfficeMap')),true,'persistent map slot');
        await page.locator('#haniOfficeMap .hani-office-foreground:visible').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
        await page.locator('#haniOfficeActors .hani-office-avatar:visible').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
        await page.waitForFunction(()=>[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden).every(a=>a.dataset.spriteScale==='3'));
        const geometry=await page.locator('#haniOfficeActors .hani-office-actor:visible').evaluateAll(actors=>actors.map(actor=>{
          const box=actor.getBoundingClientRect(),sprite=actor.querySelector('.hani-office-sprite').getBoundingClientRect(),hit=getComputedStyle(actor,'::before');
          return {id:actor.dataset.person,width:box.width,height:box.height,spriteWidth:sprite.width,spriteHeight:sprite.height,hitWidth:parseFloat(hit.width),hitHeight:parseFloat(hit.height),pointer:hit.pointerEvents};
        }));
        for(const actor of geometry){
          assert.ok(Math.abs(actor.width/actor.height-.75)<.005,JSON.stringify(actor)+' 3:4 sprite box');
          assert.ok(Math.abs(actor.spriteWidth-actor.width)<=1&&Math.abs(actor.spriteHeight-actor.height)<=1,JSON.stringify(actor)+' sprite fills actor');
          assert.ok(actor.hitWidth>=40&&actor.hitHeight>=40,JSON.stringify(actor)+' transparent hit target');assert.equal(actor.pointer,'auto');
        }
        await noOverflow('#haniOfficeLive');await noOverflow('.hani-office-scroll');
        await page.screenshot({path:path.join(evidence,`${width}-${floor}.png`),fullPage:true});
      }
      // Existing board renderer receives synthetic in-memory posts, never a save call.
      await page.evaluate(ids=>{state.boardPosts=ids.map((id,i)=>({id:'staff-art-'+i,authorId:id,category:'WORK',title:'합성 이미지 확인',body:'로컬 UI 검사',createdAt:new Date().toISOString()}));state.boardComments=[];showView('board');},staff);
      for(const id of staff) {
        const img=page.locator(`.board-author[data-board-person="${id}"] img`).first();
        await img.scrollIntoViewIfNeeded();await img.evaluate(image=>image.decode());
        assert.equal(await img.getAttribute('src'),`./assets/profiles/thumb/hani-profile-${id}-128.webp`);
      }
      await noOverflow('#board');
      assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),storage,'read-only preview');
      status.viewports.push(width);await ctx.close();save();
    }
    assert.deepEqual(status.missing,[],'no local 404 requests');
    assert.deepEqual(status.errors,[],'no runtime exceptions');
    status.browser='passed';save();
  } finally {await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));save();}
});
