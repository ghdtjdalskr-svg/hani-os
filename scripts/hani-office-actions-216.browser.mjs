// Isolated real renderer + real assets. No app login, life records, or Cloud calls.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/l216-2');fs.mkdirSync(out,{recursive:true});
const status={result:'running',screenshots:[],checks:[],errors:[],writes:[],scope:'isolated real office renderer, catalog fetch, all five floors at 390/1440'};
const save=()=>fs.writeFileSync(path.join(out,'browser-status.json'),JSON.stringify(status,null,2));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;
assert.ok(start>0&&end>start);
const pageHTML=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><style>body{margin:0;padding:12px;background:#f5f2ec;font-family:'Malgun Gothic',sans-serif}.view{max-width:1350px;margin:auto}button{font:inherit}[hidden]{display:none!important}</style><div class="view active">${html.slice(start,end)}</div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script></html>`;
let browser,server;
try{
  const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const {chromium}=await import(pathToFileURL(runtime).href);
  browser=await chromium.launch({headless:true,executablePath:process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
    if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(pageHTML);return;}
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:1100},reducedMotion:'reduce'});
    await context.addInitScript(()=>{
      window.officeClock=Date.parse('2026-10-19T09:00:00+09:00');const RealDate=Date;
      window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[window.officeClock]))}static now(){return window.officeClock}};
      window.officeWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('office storage write forbidden')};
    });
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();page.on('pageerror',e=>status.errors.push(e.message));
    await page.goto(origin);await page.waitForFunction(()=>!!window.HaniBuildingScene?.scheduler&&document.querySelectorAll('.hani-office-actor').length===18);
    await page.evaluate(()=>{window.originalOfficeNodes=[...document.querySelector('#haniOfficeActors').children]});
    for(const floor of ['1f','2f','3f','4f','5f']){
      const picked=await page.evaluate(floor=>{
        const start=Date.parse('2026-10-19T00:00:00+09:00');
        for(let n=0;n<30;n++){
          const day=new Date(start+n*86400000+32400000).toISOString().slice(0,10),event=HaniBuildingScene.scheduler.plan(day).find(e=>e.floors.includes(floor));
          if(event){window.officeClock=Date.parse(day+'T00:00:00+09:00')+(event.performStart+1)*1000;return {day,action:event.actionId,people:event.people.map(p=>p.id)}}
        }throw Error('No eligible scene on '+floor);
      },floor);
      await page.locator(`[data-building-floor="${floor}"]`).click();
      await page.waitForFunction(({floor,action})=>document.querySelector('#haniOfficeMap').dataset.floor===floor&&document.querySelector('#haniOfficeMap').dataset.art==='floor'&&[...document.querySelectorAll('.hani-office-actor')].some(a=>!a.hidden&&a.dataset.action===action),{floor,action:picked.action});
      await page.waitForFunction(()=>[...document.querySelectorAll('.hani-office-actor')].filter(a=>!a.hidden).every(a=>a.dataset.avatar==='v2'));
      const actor=page.locator(`.hani-office-actor[data-action="${picked.action}"]:visible`).first();await actor.click();
      await assert.doesNotReject(()=>page.locator('.hani-office-character-bubble:visible').waitFor());
      assert.match(await page.locator('.hani-office-character-bubble').innerText(),/프로필/);
      assert.deepEqual(await page.evaluate(()=>officeWrites),[]);
      assert.equal(await page.evaluate(()=>originalOfficeNodes.every((n,i)=>document.querySelector('#haniOfficeActors').children[i]===n)),true);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
      const screenshot=`${width}-${floor}.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(out,screenshot)});status.screenshots.push(screenshot);status.checks.push({width,floor,...picked,result:'pass'});
    }
    await context.close();
  }
  assert.deepEqual(status.errors,[]);status.result='pass';
}catch(error){status.result=/EPERM|EACCES|spawn/.test(error.message)?'blocked':'fail';status.errors.push(error.message);process.exitCode=1;}
finally{save();await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve());}
console.log(JSON.stringify(status));
