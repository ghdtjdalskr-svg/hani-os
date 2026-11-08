import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL('C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href);
const root=process.cwd(),out=path.join(root,'artifacts/newsroom-layout/after');fs.mkdirSync(out,{recursive:true});
const catalog=JSON.parse(fs.readFileSync('assets/data/newsroom-4cut/issues.json','utf8'));
const channels=['semiconductor','lg','infra','frontier','world'];
const fixture=[{id:'layout-synthetic',post_type:'WEEKLY',period_key:'2026-11-W1',published_at:'2026-11-08T03:00:00Z',payload:{company_followup:{version:1,week_label:'11월 1주차',headlines:{},channels:Object.fromEntries(channels.map((key,i)=>[key,[{topic:'합성 검증 주제',importance:'핵심',sentiment:'NEUTRAL',title:`합성 채널 ${i+1}의 주요 변화`,summary:'레이아웃 검증용 합성 뉴스입니다.',change:'공식 발표 확인',next_check:'다음 주 후속 확인',sources:[],comments:[]}]]))}}}];
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=process.env.HANI_CDP_ENDPOINT?await chromium.connectOverCDP(process.env.HANI_CDP_ENDPOINT):await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const results=[];
try{
 for(const [width,finish] of [[1280,'pure-white'],[390,'pure-white'],[1280,'midnight-black'],[390,'midnight-black']]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1000},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
  let externalBlocked=0,catalogFetches=0;
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin!==origin){externalBlocked++;await route.fulfill({status:200,contentType:'application/javascript',body:''});return;}
   if(u.pathname==='/assets/data/newsroom-4cut/issues.json')catalogFetches++;
   await route.continue();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-11-08T12:00:00+09:00'));
  await page.goto(origin,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof showView==='function'&&window.HaniNewsroom4cut);
  assert.equal(catalogFetches,0);
  await page.evaluate(({finish,fixture})=>{
   document.querySelectorAll('.login-gate,.login-recovery-gate').forEach(e=>e.style.display='none');
   const app=document.getElementById('app');app.classList.remove('login-locked');app.inert=false;app.removeAttribute('aria-hidden');
   document.body.classList.remove('login-scroll-locked');document.documentElement.classList.remove('login-scroll-locked');
   document.documentElement.dataset.finish=finish;
   investmentNewsMaybeRefresh=()=>{};
   window.__layoutWrites=[];
   for(const key of ['setItem','removeItem','clear']){const old=Storage.prototype[key];Storage.prototype[key]=function(...a){window.__layoutWrites.push(key);return old.apply(this,a);};}
   showView('newsroom');window.HANI_COMPANY_FOLLOWUP_RENDER(fixture,new Set(),false,'',()=>{});
  },{finish,fixture});
  await page.evaluate(()=>window.HaniNewsroom4cut.enter());
  const newsroom=page.locator('#newsroom'),slot=newsroom.locator('.newsroom-4cut');
  await slot.waitFor({state:'visible'});
  const archive=slot.locator('.newsroom-4cut-archive');
  assert.equal(await archive.getAttribute('open'),'');assert.match(await archive.innerText(),/제2호.*최신/s);
  for(const number of [2,1]){
   if(number===1)await slot.locator('.newsroom-4cut-past button').click();
   await slot.locator('.newsroom-4cut-image').scrollIntoViewIfNeeded();
   await page.waitForFunction(n=>{const i=document.querySelector('.newsroom-4cut-image');return i.complete&&i.naturalWidth===1200&&i.src.endsWith(`/00${n}.webp`);},number);
   assert.equal(await slot.locator('.newsroom-4cut-title').innerText(),catalog.issues[number-1].title);
   assert.equal(await slot.locator('.newsroom-4cut-context section').count(),1,'only index table, no duplicate summary');
   assert.equal(await slot.locator('.newsroom-4cut-footnote:visible').count(),0);
   const rows=await slot.locator('tbody tr').evaluateAll(rows=>rows.map(r=>[...r.children].map(e=>e.textContent)));
   assert.equal(rows.length,4);
   assert.deepEqual(rows.map(r=>r[1]),number===2?['5,059.69','644.27','7,376.86','24,579.42']:['5,730.74','724.38','','']);
   const layout=await newsroom.evaluate(el=>{
    const rect=s=>{const e=el.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,width:r.width,bottom:r.bottom,top:r.top,radius:getComputedStyle(e).borderRadius};};
    return {overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,ownOverflow:el.scrollWidth-el.clientWidth,comic:rect('.newsroom-4cut'),image:rect('.newsroom-4cut-open'),comicColumn:rect('.newsroom-4cut-comic'),nav:rect('.ds-news-navigation'),followup:rect('.company-followup-preview'),channels: [...el.querySelectorAll('.company-followup-channels label')].map(e=>({width:e.clientWidth,overflow:e.scrollWidth-e.clientWidth})),grid:getComputedStyle(el.querySelector('.company-followup-channels')).gridTemplateColumns};
   });
   assert.ok(layout.overflow<=2&&layout.ownOverflow<=2,JSON.stringify(layout));
   assert.ok(Math.abs(layout.image.width-layout.comicColumn.width)<1,'image fills its column');
   for(const card of [layout.nav,layout.followup]){assert.ok(Math.abs(card.width-layout.comic.width)<1,JSON.stringify(layout));assert.equal(card.radius,layout.comic.radius);assert.equal(card.x,layout.comic.x);}
   assert.ok(Math.abs(layout.followup.top-layout.nav.bottom-16)<1,'16px vertical rhythm');
   assert.ok(layout.channels.every(c=>c.overflow<=2&&c.width>100));
   assert.equal(layout.grid.split(' ').length,width===390?2:3);
   if(number===1){assert.equal(await slot.locator('.newsroom-4cut-past button').getAttribute('aria-pressed'),'true');assert.equal(await slot.locator('.newsroom-4cut-latest').isVisible(),true);}
   const name=`${width}-${finish}-issue00${number}`;
   await newsroom.screenshot({path:path.join(out,name+'.png'),style:'header.top,.hani-context-remote,.hani-remote-mobile-trigger{visibility:hidden!important}'});
   await slot.locator('.newsroom-4cut-open').click();await slot.locator('dialog[open]').waitFor();
   assert.equal(await slot.locator('dialog .newsroom-4cut-footnote').isVisible(),false);
   assert.equal(await slot.locator('.newsroom-4cut-full').getAttribute('src'),`assets/newsroom-4cut/00${number}.webp`);
   await page.keyboard.press('Escape');
   results.push({width,finish,issue:number,edge:browser.version(),...layout,rows,externalBlocked});
  }
  if(width===1280&&finish==='pure-white'){
   // Match the supplied before shot: issue 1, interest tab, empty F/U, global chrome.
   await page.evaluate(()=>window.HANI_COMPANY_FOLLOWUP_RENDER([],new Set(),false,'',()=>{}));
   assert.ok(await newsroom.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'empty followup layout');
   await newsroom.screenshot({path:path.join(out,'comparison-1280-issue001.png')});
  }
  await slot.locator('.newsroom-4cut-latest').click();assert.match(await archive.innerText(),/제2호.*최신/s);
  for(const key of channels){await page.locator(`label[for="followup-${key}"]`).click();assert.equal(await page.locator(`.company-followup-panel.panel-${key}`).isVisible(),true);}
  await page.evaluate(()=>{showView('reading');showView('newsroom');});await page.evaluate(()=>window.HaniNewsroom4cut.enter());
  assert.equal(catalogFetches,1);assert.deepEqual(await page.evaluate(()=>window.__layoutWrites),[]);assert.deepEqual(errors,[]);
  await context.close();
 }
 const hashes=Object.fromEntries(['hani-newsroom-4cut.js','hani-design-system.css','assets/data/newsroom-4cut/issues.json','index.html','hani-main.js'].map(f=>[f,createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({status:'PASS',login:'isolated test-only bypass',news:'synthetic followup',externalRequests:'intercepted; no remote traffic',storageWrites:0,pageErrors:[],hashes,results},null,2)+'\n');
 console.log(`Edge layout: ${results.length} scenes PASS`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
