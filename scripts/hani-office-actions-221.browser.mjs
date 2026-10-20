// Isolated actual renderer/assets. Fake KST starts at 01:40 and advances in real time.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/night-actions-221');
fs.mkdirSync(out,{recursive:true});
const status={result:'running',checks:[],screenshots:[],errors:[],scope:'real Edge, 01:40 KST, 3F, 390/1440, actual timers <=90s'};
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;
assert.ok(start>0&&end>start);
const fixture=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><style>body{margin:0;padding:12px;background:#f5f2ec;font-family:'Malgun Gothic',sans-serif}[hidden]{display:none!important}.view{max-width:1350px;margin:auto}</style><div class="view active">${html.slice(start,end)}</div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script></html>`;
let browser,server;
try{
  const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const {chromium}=await import(pathToFileURL(runtime).href);
  browser=await chromium.launch({headless:true,executablePath:process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
    if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return}
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
    res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  await Promise.all([390,1440].map(async width=>{
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
    await context.addInitScript(()=>{
      const RealDate=Date,began=performance.now(),instant=RealDate.parse('2026-10-21T01:40:00+09:00');
      window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[instant+performance.now()-began]))}static now(){return instant+performance.now()-began}};
      window.officeWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('office write forbidden')};
    });
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();page.on('pageerror',e=>status.errors.push(e.message));
    await page.goto(origin);await page.waitForFunction(()=>window.HaniBuildingScene?.scheduler?.actions.size===120);
    await page.locator('[data-building-floor="3f"]').click();const began=Date.now();
    await page.waitForFunction(()=>[...document.querySelectorAll('.hani-office-actor')].some(a=>!a.hidden&&a.dataset.action!=='base-work'&&(a.dataset.emoji||a.dataset.walking==='true')),{},{timeout:90000});
    const visible=await page.locator('.hani-office-actor:visible').evaluateAll(nodes=>nodes.map(a=>({person:a.dataset.person,action:a.dataset.action,emoji:a.dataset.emoji,line:a.dataset.line,iconVisible:!a.querySelector('.hani-office-activity-icon').hidden})));
    assert.ok(visible.some(a=>a.emoji&&a.iconVisible));assert.ok(visible.every(a=>['seoyun','dohyun'].includes(a.person)));
    const actor=page.locator('.hani-office-actor:visible').filter({has:page.locator('.hani-office-activity-icon:not([hidden])')}).first();await actor.click();
    await page.locator('.hani-office-character-bubble:visible').waitFor();
    const bubble=await page.locator('.hani-office-character-bubble').innerText();assert.match(bubble,/프로필/);
    assert.deepEqual(await page.evaluate(()=>officeWrites),[]);
    const screenshot=`01-40-3f-${width}.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(out,screenshot)});
    status.screenshots.push(screenshot);status.checks.push({width,delaySeconds:(Date.now()-began)/1000,visible,bubble,result:'pass'});await context.close();
  }));
  assert.deepEqual(status.errors,[]);status.result='pass';
}catch(error){status.result=/EPERM|EACCES|spawn/.test(error.message)?'blocked':'fail';status.errors.push(error.message);process.exitCode=1}
finally{fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(status,null,2));await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve())}
console.log(JSON.stringify(status));
