// Read-only full index DOM/CSS with only office owners enabled. No login/app/storage code.
// node scripts/hani-office-top-labels.browser.mjs [playwright/index.mjs] [msedge.exe]
// Optional baseline: artifacts/office-top-labels/before-hani-office-live.js (unchanged origin/main).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {untilOffice,waitForOfficeLabels} from './hani-office-label-browser-ready.mjs';
import {readPhoneLabels,assertPhoneLabels} from './hani-office-obr18-browser-geometry.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-top-labels');
fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const baseline=path.join(out,'before-hani-office-live.js');
const result={status:'running',scope:'Full index DOM/CSS, office owners only; no authenticated app bootstrap or external fonts',checks:[],summary:[],errors:[],writes:[],network:[]};
let browser,server;
try{
 const runtime=process.argv[2]||path.join(process.env.NODE_PATH,'playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(runtime).href);
 browser=await chromium.launch({headless:true,executablePath:process.argv[3]||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
 result.browser=await browser.version();
 server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://fixture');
  if(u.pathname==='/'){
   const setup=`<script>document.getElementById('loginGate').hidden=true;document.getElementById('loginGate').classList.add('is-hidden');const app=document.getElementById('app');app.classList.remove('login-locked');app.removeAttribute('inert');app.removeAttribute('aria-hidden');document.querySelectorAll('.view').forEach(n=>n.classList.toggle('active',n.id==='agentReview'));</script>`;
   res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html.replace('</body>',setup+`<script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js?stage=${u.searchParams.get('stage')}"></script><script src="/hani-desk-mascots.js"></script></body>`));
  }
  const file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
  if(!file.startsWith(root)||u.pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(u.pathname==='/hani-office-live.js'&&u.searchParams.get('stage')==='before'?baseline:file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 for(const stage of fs.existsSync(baseline)?['before','after']:['after'])for(const width of [360,390,416]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  await context.addInitScript(()=>{
   window.officeClock=Date.parse('2026-10-22T00:00:00+09:00');const RealDate=Date;
   window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[officeClock]))}static now(){return officeClock}};
   window.HaniOfficePresence={chairman:'absent'};window.officeWrites=[];
   for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('forbidden storage write')};
  });
  await context.route('**/*',r=>{const q=r.request();if(new URL(q.url()).origin!==origin)return r.abort();if(!['GET','HEAD'].includes(q.method())){result.network.push(q.method()+' '+q.url());return r.abort()}return r.continue()});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push({stage,width,message:e.message}));await page.goto(origin+'/?stage='+stage);
  await untilOffice(page,()=>window.HaniBuildingScene?.scheduler);
  const nodes=await page.evaluate(()=>{window.officeOriginalNodes=[...document.querySelector('#haniOfficeActors').children].flatMap(a=>[a,a.querySelector('.hani-office-name'),a.querySelector('.hani-office-status')]);return officeOriginalNodes.length});
  for(const presence of ['absent','active']){
   const times=await page.evaluate(presence=>{
    const s=HaniBuildingScene.scheduler,day='2026-10-22',o={chairmanPresent:presence==='active'},times=new Set(Array.from({length:144},(_,i)=>i*600));
    // Include reported 19:14 plus dialogue/report/greeting endpoints and midpoints.
    times.add(19*3600+14*60);
    for(const e of [...s.plan(day,o),...s.blockPlan(day,0,s.plan(day,o),o)])for(const sec of [e.start+.001,(e.start+e.end)/2,e.end-.001,e.performStart+.001,e.performEnd-.001])if(Number.isFinite(sec)&&sec>=0&&sec<86400)times.add(sec);
    return [...times].sort((a,b)=>a-b);
   },presence);
   for(const sec of times)for(const floor of ['1f','2f','3f','4f','5f']){
    await page.evaluate(({sec,presence})=>{officeClock=Date.parse('2026-10-22T00:00:00+09:00')+sec*1000;HaniOfficePresence={chairman:presence}}, {sec,presence});
    await page.locator(`[data-building-floor="${floor}"]`).click();await waitForOfficeLabels(page,floor);
    const r=await page.evaluate(readPhoneLabels);
    const viewport=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,innerWidth,clientWidth:document.documentElement.clientWidth,visualScale:visualViewport.scale,floorTop:document.getElementById('haniOfficeMap').getBoundingClientRect().top}));
    const row={stage,width,presence,sec,floor,...viewport,people:r.rows.length,names:r.rows.filter(p=>p.mode==='name').map(p=>p.id),dots:r.rows.filter(p=>p.mode==='dot').map(p=>p.id),heads:r.rows.map(p=>({id:p.id,mode:p.mode,head:p.head,box:p.box,topSpace:p.head.top-viewport.floorTop,distance:p.distance})),geometry:Object.fromEntries(['missing','ambiguous','distant','overlap','spriteOverlap','mascotOverlap','outside'].map(k=>[k,r[k]]))};
    result.checks.push(row);assertPhoneLabels(r);
    if(sec===19*3600+14*60&&['2f','4f'].includes(floor))await page.screenshot({path:path.join(out,`${stage}-${width}-${presence}-${floor}-1914.png`),fullPage:true});
   }
  }
  assert.ok(await page.evaluate(()=>officeOriginalNodes.every(n=>n.isConnected)),'persistent slots');assert.ok(nodes>0);
  result.writes.push(...await page.evaluate(()=>officeWrites));await context.close();
 }
 for(const stage of ['before','after'])for(const width of [360,390,416])for(const floor of ['1f','2f','3f','4f','5f']){
  const rows=result.checks.filter(r=>r.stage===stage&&r.width===width&&r.floor===floor);if(!rows.length)continue;
  result.summary.push({stage,width,floor,samples:rows.length,actorObservations:rows.reduce((n,r)=>n+r.people,0),nameObservations:rows.reduce((n,r)=>n+r.names.length,0),dotObservations:rows.reduce((n,r)=>n+r.dots.length,0),maxDots:Math.max(...rows.map(r=>r.dots.length)),overflowMin:Math.min(...rows.map(r=>r.overflow)),overflowMax:Math.max(...rows.map(r=>r.overflow))});
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.writes,[]);assert.deepEqual(result.network,[]);result.status='PASS';
}catch(e){result.status='FAIL';result.failure=e.stack;process.exitCode=1}finally{
 await browser?.close();await new Promise(r=>server?server.close(r):r());fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,samples:result.checks.length,summary:result.summary,failure:result.failure}));
}
