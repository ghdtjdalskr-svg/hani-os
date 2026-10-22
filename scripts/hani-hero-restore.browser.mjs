// Disposable local browser; real index and existing navigation/event owners.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {localBrowser} from './hani-contrast-audit.mjs';
import {withoutHeroRestore} from './hani-hero-restore-preservation.mjs';
import {remote217Oracle,remote217Seed,remote217BrowserEntropy} from './hani-remote-217-oracle.mjs';
const out=path.resolve('artifacts/hero-restore'),before=process.argv.includes('--before'),phase=before?'before':'after';
const files=['hani-ui-v02992.js','hani-design-system.css','hani-context-remote-v1.js'];
const report={phase,base:'925d9e181564770594d2e1a98fa5bc1d59433914',sourceHashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),status:'running',views:[],screenshots:[],errors:[]};
let env;
try{
 env=await localBrowser(process.env.HANI_PLAYWRIGHT||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs',process.env.HANI_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
 const {page,origin}=env;page.on('pageerror',e=>report.errors.push(e.message));
 if(!before)await remote217BrowserEntropy(page);
 if(before)for(const file of files)await page.route('**/'+file+'?*',r=>r.fulfill({status:200,body:withoutHeroRestore(file,fs.readFileSync(file,'utf8')),contentType:file.endsWith('.css')?'text/css':'text/javascript'}));
 await page.goto(origin);await page.waitForFunction(()=>window.HANI_CONTEXT_REMOTE_V1&&window.HANI_MAIN_CHARACTER_BANNER);
 let current=await page.evaluate(()=>({view:document.body.dataset.view||'home',season:document.documentElement.dataset.season||'spring'}));
 const oracle=remote217Oracle(()=>remote217Seed(current.view,current.season));oracle.select(current.view,current.season);
 await page.evaluate(()=>{unlockLoginGate();applySignatureFinish('porcelain-cream',false);applySeasonTheme('autumn',false);window.heroProtected=localStorage.getItem('hani_os_life_v23');});
 const changed=current.season!=='autumn';current.season='autumn';oracle.select(current.view,current.season,{changed});
 const navigate=async id=>{current.view=id;oracle.select(id,current.season);await page.evaluate(id=>showView(id),id)};
 const ids=await page.locator('#sidebar [data-view]').evaluateAll(ns=>ns.map(n=>n.dataset.view));
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1100});
  for(const id of ids){
   if(['work','aura'].includes(id))continue;
   await navigate(id);await page.waitForTimeout(250);
   const hero=page.locator(`#${id} > .ds-main-character-banner`);
   const row=await hero.evaluate(async h=>{const i=h.querySelector('.ds-main-character-banner__scene img');await i.decode();const s=getComputedStyle(i);return {count:h.parentElement.querySelectorAll(':scope > .ds-main-character-banner').length,src:i.getAttribute('src'),ratio:i.naturalWidth/i.naturalHeight,fit:s.objectFit,mask:s.maskImage,eyebrow:!!h.querySelector('.ds-main-character-banner__eyebrow')?.textContent,subtitle:!!h.querySelector('.ds-main-character-banner__description')?.textContent,bubble:!!h.querySelector('.ai-quote b')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,protectedSame:heroProtected===localStorage.getItem('hani_os_life_v23')};});
   report.views.push({width,id,...row});
   if(!before){assert.equal(row.count,1,id);assert.ok(row.ratio>2.8&&row.ratio<3.2,id+' wide scene');assert.equal(row.fit,'cover');assert.notEqual(row.mask,'none');assert.ok(row.eyebrow&&row.subtitle&&row.bubble,id+' complete hero text');assert.equal(row.overflow,false);assert.equal(row.protectedSame,true);}
   if(['movie','reading','organization','monthlyReport','university'].includes(id)){
    await page.evaluate(()=>scrollTo(0,0));const file=`${phase}-${id}-${width}.png`;await page.screenshot({path:path.join(out,file),animations:'disabled'});report.screenshots.push(file);
   }
  }
  for(const id of ['movie','reading','organization','monthlyReport','university']){
   await navigate(id);
   if(width===390)await page.locator('.hani-remote-mobile-trigger').click();
   const card=page.locator('.hani-remote-media');await card.locator('img').evaluate(i=>i.decode());
   const src=await card.locator('img').getAttribute('src');
   if(!before){assert.match(src,/^\.\/assets\/context-remote\//);assert.equal(src,oracle.select(id,'autumn'),'217 screen/season selection');assert.ok(await card.locator('img').evaluate(i=>i.naturalHeight/i.naturalWidth>=1.6),'tall portrait');}
   if(id==='reading'){const file=`${phase}-remote-${width}.png`;await page.screenshot({path:path.join(out,file),animations:'disabled'});report.screenshots.push(file);}
  }
 }
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status=/EPERM|EACCES/.test(e.message)?'blocked':'failed';report.reason=e.stack;process.exitCode=1;}
finally{await env?.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,`browser-${phase}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,views:report.views.length,screenshots:report.screenshots.length,reason:report.reason}));}
