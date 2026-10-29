// node scripts/hani-office-tap-lines.test.mjs [--browser [playwright/index.mjs] [browser.exe]]
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assets} from './hani-office-v2-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const bank=JSON.parse(read('assets/data/office-tap-lines-v1.json')),source=read('hani-office-live.js');
const actions=JSON.parse(read('assets/data/office-actions-221.json'));
const roster=assets.canon.people;
function model(fetch){
 const c=vm.createContext({HaniOfficeV2Assets:assets,HaniOfficeActions221:actions,document:{getElementById:()=>null},window:{},fetch});
 vm.runInContext(source,c);return c.HaniBuildingScene;
}
const api=model().tapLines;
const at=(time,day='2026-10-21')=>new Date(`${day}T${time}+09:00`);
const success=async()=>({ok:true,json:async()=>structuredClone(bank)});
async function catalog(){const instance=model(success).tapLines.create(roster);await instance.load();return instance;}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};

test('schema: every roster id, exact bucket sizes, 28 codepoints, safe content and real staff names',()=>{
 assert.ok(api.validate(bank,roster));
 assert.deepEqual(Object.keys(bank.staff).sort(),roster.filter(p=>p.id!=='seongmin').map(p=>p.id).sort());
 const names=new Set(roster.map(p=>p.id==='seongmin'?'회장님':p.name.split('/')[0]));
 const lines=[];
 for(const [id,row] of Object.entries(bank.staff)){
  assert.deepEqual(Object.keys(row).sort(),['morning','day','evening',...(['seoyun','dohyun','mir','minji','yuna'].includes(id)?['night']:[]),'toChairman','tripleTap','friend'].sort());
  for(const [field,value] of Object.entries(row))for(const line of Array.isArray(value)?value:[value]){
   lines.push(line);assert.ok([...line].length<=28&&line.trim(),`${id}.${field}: ${line}`);
  }
  assert.ok([...names].filter(n=>n!=='회장님').some(n=>row.friend.includes(n)),id+' friend names a real colleague');
 }
 for(const r of bank.chairman.staffReactions){assert.ok(bank.staff[r.staffId]);lines.push(r.line);}
 for(const line of lines){
  assert.doesNotMatch(line,/\d|성민|대표님|자기야|오빠|여보|회장(?!님)|매수|매도|종목|수익률|투자|의료|진단|처방|치료|약물|질환|혈압|혈당|체중|검진|@|https?:|\b(?:PASS|통과)\s*\d/);
  for(const m of line.matchAll(/([가-힣]{2,3})\s+(?:전무|부장|차장|과장|대리|주임|선임|책임|매니저|리드)님?/g))assert.ok(m[1]==='만년'||names.has(m[1]),m[1]);
 }
 for(const [field,value] of [['morning',['길'.repeat(29),'짧음','짧음']],['night',['없는 심야']]]){
  const bad=structuredClone(bank);bad.staff.hani[field]=value;assert.equal(api.validate(bad,roster),false);
 }
 const invented=structuredClone(bank);invented.staff.unknown=invented.staff.hani;assert.equal(api.validate(invented,roster),false);
 const badReaction=structuredClone(bank);badReaction.chairman.staffReactions[0].staffId='invented';assert.equal(api.validate(badReaction,roster),false);
});

test('fake clock: KST boundaries including UTC host, midnight, and night-only presence',async()=>{
 for(const [time,bucket] of [['00:00:00','night'],['06:59:59','night'],['07:00:00','morning'],['10:59:59','morning'],['11:00:00','day'],['17:59:59','day'],['18:00:00','evening'],['23:59:59','evening']]){
  assert.equal(api.bucket(at(time)),bucket);
  const c=await catalog();assert.equal(c.tap('dohyun',at(time)).line,bank.staff.dohyun[bucket][0]);
 }
 const c=await catalog();assert.equal(c.tap('hani',at('02:00:00')),'');assert.equal(c.tap('daon',at('02:00:00')),'');
 assert.ok(c.tap('yuna',at('02:00:00')).line);assert.ok(c.tap('minji',at('02:00:00')).line);
});

test('cycles all bucket/chairman lines, one-in-five friend, then resets after 10s or bucket change',async()=>{
 const c=await catalog(),row=bank.staff.hani;
 const expected=[row.day[0],row.toChairman[0],row.day[1],row.toChairman[1],row.friend,row.day[2],row.toChairman[2],row.day[0],row.toChairman[0],row.friend];
 for(let i=0;i<expected.length;i++)assert.equal(c.tap('hani',at(`12:00:${String(i*3).padStart(2,'0')}`)).line,expected[i]);
 assert.equal(c.tap('hani',at('12:00:37')).line,row.day[1],'10s still continues');
 assert.equal(c.tap('hani',at('12:00:48')).line,row.day[0],'more than 10s resets');
 assert.equal(c.tap('hani',at('18:00:00')).line,row.evening[0]);
 assert.equal(c.tap('yuri',at('18:00:00')).line,bank.staff.yuri.evening[0],'independent staff cursor');
 assert.equal(c.tap('hani',at('11:00:00')).line,row.day[0],'clock rollback resets');
});

test('three taps within 2s override friend/normal selection, exact boundary, and reset the burst',async()=>{
 const c=await catalog(),row=bank.staff.hani;
 assert.equal(c.tap('hani',at('12:00:00')).line,row.day[0]);
 assert.equal(c.tap('hani',at('12:00:01')).line,row.toChairman[0]);
 assert.equal(c.tap('hani',at('12:00:02')).line,row.tripleTap);
 assert.equal(c.tap('hani',at('12:00:02.100')).line,row.day[1]);
 assert.equal(c.tap('hani',at('12:00:02.200')).line,row.friend);
 assert.equal(c.tap('hani',at('12:00:02.300')).line,row.tripleTap,'triple takes precedence over all ordinary output');
 const slow=await catalog();slow.tap('hani',at('12:00:00'));slow.tap('hani',at('12:00:01'));assert.notEqual(slow.tap('hani',at('12:00:02.001')).line,row.tripleTap);
});

test('chairman remains the official frog: five reactions from actual staff, no invented speaker',async()=>{
 const c=await catalog();
 for(let i=0;i<6;i++){const reaction=c.tap('seongmin',at(`12:00:${String(i*3).padStart(2,'0')}`)),expected=bank.chairman.staffReactions[i%5];assert.equal(reaction.line,expected.line);assert.equal(reaction.speaker,expected.staffId);}
});

test('lazy catalog is loaded only once; missing, invalid and network failures retain status speech',async()=>{
 for(const fetch of [async()=>({ok:false}),async()=>{throw Error('missing')},async()=>({ok:true,json:async()=>({schemaVersion:'bad'})})]){
  let count=0;const instance=model(async(...args)=>{count++;return fetch(...args)}).tapLines.create(roster);
  assert.equal(count,0);assert.equal(instance.tap('hani',at('12:00:00')),'');
  await Promise.all([instance.load(),instance.load()]);await instance.load();assert.equal(count,1);assert.equal(instance.tap('hani',at('12:00:00')),'');
 }
 let count=0;const f=fixture('10:00',true,null,actions,{fetch:async()=>{count++;return {ok:false}},setTimeout:()=>{}});await flush();
 f.click('3f');f.show();await flush();assert.equal(count,1);
 const actor=f.visible()[0],dot=actor.querySelector('.hani-office-status-dot');
 f.ids.get('haniOfficeActors').events.click({target:actor});
 const panel=f.root.querySelector('.hani-office-character-bubble');assert.ok(panel.querySelector('p').textContent.includes(actor.dataset.line));assert.ok(dot.getAttribute('aria-label'));
});

test('real delegated taps and keyboard reuse one slot, preserve labels, latest 3s timeout and no storage writes',async()=>{
 let writes=0;const timeouts=[];const storage={setItem(){writes++},removeItem(){writes++},clear(){writes++}};
 const f=fixture('10:00',true,null,actions,{fetch:success,localStorage:storage,sessionStorage:storage,setTimeout:(fn,ms)=>timeouts.push({fn,ms})});await flush();f.click('3f');
 const panel=f.root.querySelector('.hani-office-character-bubble'),nodes=[...f.ids.get('haniOfficeActors').children],actor=f.visible().find(a=>!a.dataset.event),status=actor.querySelector('.hani-office-status'),original=status.textContent;
 const tap=()=>f.ids.get('haniOfficeActors').events.click({target:actor.querySelector('.hani-office-sprite')});
 tap();assert.ok(panel.querySelector('p').textContent.includes(bank.staff[actor.dataset.person].morning[0]));
 f.ids.get('haniOfficeActors').events.keydown({key:'Enter',preventDefault(){},target:actor});
 assert.ok(panel.querySelector('p').textContent.includes(bank.staff[actor.dataset.person].toChairman[0]));
 tap();assert.ok(panel.querySelector('p').textContent.includes(bank.staff[actor.dataset.person].tripleTap));
 assert.equal(status.textContent,original);assert.ok(actor.querySelector('.hani-office-status-dot').getAttribute('aria-label'));
 assert.equal(panel.getAttribute('aria-live'),'polite');assert.equal(panel.parentElement,f.map);assert.equal(f.root.querySelectorAll('.hani-office-character-bubble').length,1);
 assert.ok(timeouts.every(t=>t.ms===3000));timeouts[0].fn();assert.equal(panel.hidden,false);timeouts.at(-1).fn();assert.equal(panel.hidden,true);
 actor.officeRow.events.click();assert.equal(panel.hidden,false);f.click('2f');assert.equal(panel.hidden,true);assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);
 assert.equal(writes,0);assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(|\.clear\(/);
});

test('216/221 action and travel speech take priority; latest queued line shows only after action and expires after 3s',async()=>{
 const timeouts=[];const f=fixture('10:00',true,null,actions,{fetch:success,setTimeout:(fn,ms)=>timeouts.push({fn,ms})});await flush();
 const plan=f.context.HaniBuildingScene.scheduler.plan('2026-10-21'),event=plan.find(e=>e.layer===2&&e.performEnd+1<18*3600&&e.performStart>11*3600);
 assert.ok(event);const instant=seconds=>new Date(Date.parse('2026-10-21T00:00:00+09:00')+seconds*1000).toISOString();
 f.setDateTime(instant((event.performStart+event.performEnd)/2));f.click(event.floors[0]);
 const actor=f.visible().find(a=>a.dataset.event===event.id);assert.ok(actor);
 const panel=f.root.querySelector('.hani-office-character-bubble'),tap=()=>f.ids.get('haniOfficeActors').events.click({target:actor});
 tap();tap();assert.ok(panel.querySelector('p').textContent.includes(actor.dataset.line));assert.ok(!panel.querySelector('p').textContent.includes(bank.staff[actor.dataset.person].toChairman[0]));
 timeouts.at(-1).fn();assert.equal(panel.hidden,true,'activity bubble also <=3s');
 f.setDateTime(instant(event.end+.01));f.timers.find(t=>t.ms===4200).fn();
 assert.equal(panel.hidden,false);assert.ok(panel.querySelector('p').textContent.includes(bank.staff[actor.dataset.person].toChairman[0]));
 timeouts.at(-1).fn();assert.equal(panel.hidden,true);
 f.setDateTime(instant(event.performStart));f.click(event.floors[0]);tap();f.click('5f');f.setDateTime(instant(event.end+1));f.timers.find(t=>t.ms===4200).fn();assert.equal(panel.hidden,true,'floor switch drops deferred line');
});

test('rapid first-view taps survive a slow catalog and keep floor bounds at 390 and 1440 (supplied geometry)',async()=>{
 let deliver;const f=fixture('10:00',true,null,actions,{fetch:()=>new Promise(resolve=>{deliver=resolve}),setTimeout:()=>{}});f.click('3f');
 const actor=f.visible().find(a=>!a.dataset.event),panel=f.root.querySelector('.hani-office-character-bubble');
 for(let i=0;i<3;i++)f.ids.get('haniOfficeActors').events.click({target:actor});
 deliver(await success());await flush();assert.ok(panel.querySelector('p').textContent.includes(bank.staff[actor.dataset.person].tripleTap));
 for(const width of [390,1440]){
  const floor={left:15,top:20,width:width-30,height:(width-30)*941/1672};floor.right=floor.left+floor.width;floor.bottom=floor.top+floor.height;
  f.map.getBoundingClientRect=()=>floor;
  panel.getBoundingClientRect=()=>({left:floor.left+(parseFloat(panel.style.left)||0),top:floor.top+(parseFloat(panel.style.top)||0),width:Math.min(285,floor.width-8),height:68});
  actor.getBoundingClientRect=()=>({left:floor.right-16,right:floor.right+16,top:floor.top+8,bottom:floor.top+48,width:32,height:40});
  // Synthetic labels remain incidental to the bubble bounds assertion. Grouped
  // placement also reads every actor box, including actors other than the tapped one.
  for(const a of f.visible()){
   if(a!==actor)a.getBoundingClientRect=()=>({left:80,top:60,right:112,bottom:100,width:32,height:40});
   for(const cls of ['.hani-office-name','.hani-office-status'])a.querySelector(cls).getBoundingClientRect=()=>({left:80,top:60,right:100,bottom:76,width:20,height:16});
  }
  actor.officeRow.events.click();const box=panel.getBoundingClientRect();
  assert.ok(box.left>=floor.left&&box.top>=floor.top&&box.left+box.width<=floor.right&&box.top+box.height<=floor.bottom);
 }
});

if(process.argv.includes('--browser'))test('real browser: sprite tap from bank, floor bounds, lifetime and zero writes at 390/1440',browserChecks);
async function browserChecks(){
 const args=process.argv.slice(process.argv.indexOf('--browser')+1);
 const runtime=args[0]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const executablePath=args[1]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
 const out=path.join(root,'artifacts/office-tap-lines');fs.mkdirSync(out,{recursive:true});
 const report={result:'running',checks:[],errors:[]};let browser,server;
 try{
  const {chromium}=await import(pathToFileURL(runtime).href);browser=await chromium.launch({headless:true,executablePath});
  server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:1100},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
   await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
   const page=await context.newPage(),requests=[];page.on('request',r=>{if(r.url().endsWith('/office-tap-lines-v1.json'))requests.push(r.url())});page.on('pageerror',e=>report.errors.push(e.message));
   await page.clock.install({time:new Date('2026-10-21T10:00:00+09:00')});await page.clock.pauseAt(new Date('2026-10-21T10:00:00+09:00'));
   await page.goto(origin);await page.waitForFunction(()=>typeof showView==='function'&&window.HaniBuildingScene&&document.querySelector('#haniOfficeActors')?.children.length>0);
   assert.equal(requests.length,0,'no tap catalog until office visible');
   const response=page.waitForResponse(r=>r.url().endsWith('/office-tap-lines-v1.json'));
   await page.evaluate(()=>{unlockLoginGate();showView('agentReview')});await response;await page.waitForTimeout(60);
   await page.locator('[data-building-floor="3f"]').click();
   const id=await page.evaluate(()=>[...document.querySelectorAll('.hani-office-actor')].find(a=>!a.hidden&&!a.dataset.event).dataset.person);
   await page.evaluate(()=>{window.tapWrites=[];for(const k of ['setItem','removeItem','clear']){const previous=Storage.prototype[k];Storage.prototype[k]=function(...args){tapWrites.push(k);return previous.apply(this,args)}}});
   const sprite=page.locator(`.hani-office-actor[data-person="${id}"] .hani-office-sprite`);await sprite.click();
   const panel=page.locator('.hani-office-character-bubble');await panel.waitFor({state:'visible'});assert.ok((await panel.locator('p').innerText()).includes(bank.staff[id].morning[0]));
   const box=await panel.boundingBox(),floor=await page.locator('#haniOfficeMap').boundingBox();
   assert.ok(box.x>=floor.x&&box.y>=floor.y&&box.x+box.width<=floor.x+floor.width&&box.y+box.height<=floor.y+floor.height,JSON.stringify({width,box,floor}));
   assert.equal(await page.locator(`.hani-office-actor[data-person="${id}"] .hani-office-status-dot`).getAttribute('aria-label')!==null,true);
   await page.screenshot({path:path.join(out,`tap-${width}.png`),fullPage:true});
   // Use the canonical keyboard path for later taps if the bubble covers the sprite.
   await page.locator(`.hani-office-actor[data-person="${id}"]`).press('Enter');assert.ok((await panel.locator('p').innerText()).includes(bank.staff[id].toChairman[0]));
   await page.locator(`.hani-office-actor[data-person="${id}"]`).press('Enter');assert.ok((await panel.locator('p').innerText()).includes(bank.staff[id].tripleTap));
   await page.clock.runFor(3001);assert.equal(await panel.isVisible(),false);assert.deepEqual(await page.evaluate(()=>tapWrites),[]);assert.equal(requests.length,1);
   report.checks.push({width,id,text:bank.staff[id].morning[0],box,floor,requests:requests.length,writes:0});await context.close();
  }
  assert.deepEqual(report.errors,[]);report.result='passed';
 }catch(error){report.result='failed-or-blocked';report.errors.push(String(error));throw error}
 finally{fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2));await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));}
}
