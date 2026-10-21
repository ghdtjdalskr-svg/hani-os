// Isolated real-index comparison. No production connection, no operating records.
// node scripts/hani-simplify-225.browser.mjs <playwright/index.mjs> <browser.exe> [--before]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {delta,withoutSimplify225} from './hani-simplify-225-preservation.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/simplify-225');
const phase=process.argv.includes('--before')?'before':'after',origin='http://hani-simplify-225.local';
const scenarios=[['settings','settings'],['home','home'],['reading','reading'],['ledger','ledger'],['investment','investment'],['aiBudget','aiBudget'],['dev','dev'],['REMOTE','settings'],['drive','drive'],['annual','monthlyReport']];
const result={phase,status:'RUNNING',base:delta.base,sourceHashes:Object.fromEntries(Object.keys(delta.files).map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),views:[],tabs:[],screenshots:[],errors:[],assetFailures:[]};
fs.mkdirSync(out,{recursive:true});
let browser;
try{
 const {chromium}=await import(pathToFileURL(process.argv[2]).href);
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({status:200,body:''});
   const file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   let body=fs.readFileSync(file);const relative=path.relative(root,file).replaceAll('\\','/');
   if(phase==='before'&&delta.files[relative])body=Buffer.from(withoutSimplify225(relative,body.toString('utf8')));
   const contentType=({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream';
   return route.fulfill({status:200,body,contentType});
  });
  await context.addInitScript(()=>{
   const Native=Date;window.Date=class extends Native{constructor(...args){super(...(args.length?args:['2026-10-21T15:00:00+09:00']));}static now(){return new Native('2026-10-21T15:00:00+09:00').getTime();}};
   window.__simplifyWrites=[];for(const method of ['setItem','removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){window.__simplifyWrites.push({method,key:args[0]||null});return original.apply(this,args)};}
  });
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)result.assetFailures.push(r.url().slice(origin.length));});
  await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>window.HANI_CONTEXT_REMOTE_V1&&window.HANI_MAIN_CHARACTER_BANNER&&typeof showView==='function');
  await page.evaluate(()=>{unlockLoginGate();document.documentElement.dataset.finish='cream';window.__simplifyProtected=localStorage.getItem('hani_os_life_v23');window.__simplifyWrites=[];});
  const views=await page.locator('.nav-btn[data-view]').evaluateAll(es=>es.map(e=>({id:e.dataset.view,label:e.innerText.trim()})));
  for(const view of views){
   if(view.id==='work'){result.views.push({width,...view,retired:true});continue;}
   await page.evaluate(id=>showView(id),view.id);await page.waitForTimeout(180);
   const row=await page.locator('#'+view.id).evaluate(e=>({controls:e.querySelectorAll('button,input,select,textarea,a').length,text:e.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1}));result.views.push({width,...view,...row});
  }
  const tabs=[['settings','[data-settings-tab]'],['ledger','[data-panel]'],['investment','.investment-tabs-main button'],['investmentCommittee','[data-ic-section]'],['travel','[data-travel-tab]'],['game','[data-sports-tab]'],['study','[data-study-tab]'],['monthlyReport','[data-report-board]'],['organization','.organization-tabs button'],['aura','.aura-tabs button']];
  for(const [id,selector]of tabs){
   await page.evaluate(id=>showView(id),id);const buttons=page.locator('#'+id+' '+selector);
   for(let i=0;i<await buttons.count();i++){const button=buttons.nth(i);if(!await button.isVisible())continue;const tab=await button.innerText();await button.click();await page.waitForTimeout(100);result.tabs.push({width,id,tab,text:await page.locator('#'+id).innerText()});}
  }
  for(const [name,view]of scenarios){
   await page.evaluate(id=>showView(id),view);await page.waitForTimeout(180);
   if(name==='annual'){await page.locator('[data-report-board="annual"]').click();await page.waitForTimeout(180);}
   if(name==='settings'||name==='REMOTE'){const data=page.locator('#settings-tab-data');if(await data.isVisible())await data.click();}
   if(name==='REMOTE'&&width===390)await page.locator('.hani-remote-mobile-trigger').click();
   await page.locator('#'+view+' img').evaluateAll(async images=>Promise.all(images.filter(i=>i.getBoundingClientRect().height).map(i=>i.decode().catch(()=>{}))));
   await page.evaluate(()=>scrollTo(0,0));
   const filename=`${phase}-${name}-${width}.png`;
   if(name==='REMOTE')await page.locator('#haniContextRemote').screenshot({path:path.join(out,filename),animations:'disabled'});
   else{await page.screenshot({path:path.join(out,filename),animations:'disabled'});const full=`${phase}-${name}-${width}-full.png`;await page.screenshot({path:path.join(out,full),fullPage:true,animations:'disabled'});result.screenshots.push(full);}
   result.screenshots.push(filename);
   if(name==='REMOTE'&&width===390)await page.keyboard.press('Escape');
   if(phase==='after')assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name+' horizontal overflow');
  }
  // Verify info keyboard behavior and retained data/approval controls.
  await page.evaluate(()=>showView('dev'));const summary=page.locator('#haniDevelopmentHistory details summary').first();
  if(phase==='after'){await summary.focus();await page.keyboard.press('Enter');assert.equal(await summary.evaluate(e=>e.parentElement.open),true);await page.keyboard.press('Enter');assert.equal(await summary.evaluate(e=>e.parentElement.open),false);}
  assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===window.__simplifyProtected),true,'protected bytes');
  const writes=await page.evaluate(()=>window.__simplifyWrites.filter(r=>r.key==='hani_os_life_v23'||r.method==='clear'));assert.deepEqual(writes,[],'navigation and text details do not write protected records');
  await context.close();
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.assetFailures,[]);result.status='PASS';
}catch(error){result.status=/EPERM|EACCES/.test(String(error))?'BLOCKED':'FAIL';result.reason=String(error);process.exitCode=1;}
finally{await browser?.close();fs.writeFileSync(path.join(out,`browser-${phase}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify({phase,status:result.status,screenshots:result.screenshots.length,views:result.views.length,reason:result.reason}));}
