// node scripts/hani-ilbo-banner-215.test.mjs [playwright/index.mjs] [browser.exe]
// Real app, synthetic clock, disposable browser storage; no account or external requests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/ilbo-banner-215');
fs.mkdirSync(out,{recursive:true});
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const report={cases:[],errors:[],baseline:'50cdb270',result:'NOT_RUN'};
const code=read('hani-ilbo.js'),ctx=vm.createContext({window:{},document:{readyState:'loading',addEventListener(){}}});
vm.runInContext(code,ctx);
const classes=new Set(),banner={hidden:true,complete:false,naturalWidth:0,closest:()=>({classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}})};
ctx.window.HaniIlbo.bindImage({querySelector:s=>s==='[data-ilbo-banner]'?banner:null,querySelectorAll:()=>[]});
assert.equal(banner.hidden,true);assert.equal(classes.size,0);
banner.complete=true;banner.naturalWidth=1600;banner.onload();assert.equal(banner.hidden,false);assert.equal(classes.size,1);
banner.naturalWidth=0;banner.onerror();assert.equal(banner.hidden,true);assert.equal(classes.size,0);
assert.ok(fs.statSync(path.join(root,'assets/hani-ilbo/masthead-v1.webp')).size<=120000);
console.log('PASS pending/load/error nameplate lifecycle and <=120KB asset');
const pw=process.argv[2]||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const exe=process.argv[3]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;
try{
 const {chromium}=await import(pathToFileURL(pw).href);browser=await chromium.launch({executablePath:exe,headless:true});
 for(const width of [360,412,884,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1100},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await context.addInitScript(()=>{const Native=Date,fixed=new Native('2026-10-19T03:00:00Z').getTime();window.Date=class extends Native{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}};});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.waitForFunction(()=>!!window.HaniIlbo&&typeof unlockLoginGate==='function');
  await page.evaluate(theme=>{unlockLoginGate();cloudStopAutoSync();document.documentElement.dataset.theme=theme;document.documentElement.dataset.finish=theme==='dark'?'midnight-black':'pure-white';document.body.dataset.finishActive='true';},theme);
  const home=page.locator('[data-ilbo-home]');await home.waitFor({state:'visible'});assert.match(await home.textContent(),/HANI 일보 제 1호/);assert.doesNotMatch(await home.textContent(),/HANI\s*HANI 일보/);
  await page.evaluate(()=>{window.bannerWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=(...args)=>{bannerWrites.push({method,key:args[0]});throw Error('Unexpected storage write');};save=commit=()=>{throw Error('Unexpected save');};window.beforeBannerState=JSON.stringify(state);});
  await home.locator('button').click();const view=page.locator('section#ilbo');await view.waitFor({state:'visible'});
  const head=view.locator('.ilbo-masthead'),plate=head.locator('.ilbo-nameplate'),image=head.locator('[data-ilbo-banner]');
  await page.waitForFunction(()=>document.querySelector('.ilbo-nameplate-illustrated [data-ilbo-banner]')?.naturalWidth===1600);
  assert.equal(await head.locator('h2').textContent(),'HANI 일보');assert.equal(await head.locator('.ilbo-eyebrow').textContent(),'HANI GROUP · THE WEEKLY CHRONICLE');
  assert.match(await head.locator('.ilbo-meta').textContent(),/제 1호 · 민지 대리 취재.*2026\.10\.19/);
  assert.equal(await image.getAttribute('alt'),'');assert.equal(await image.evaluate(x=>x.naturalHeight),360);
  const measure=()=>head.evaluate(el=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const paint=canvas.getContext('2d',{willReadFrequently:true});
   const lum=c=>{paint.fillStyle=c;paint.fillRect(0,0,1,1);return [...paint.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);};
   const ratios=[...el.querySelectorAll('h2,.ilbo-eyebrow,.ilbo-meta span,time')].map(x=>{let n=x,bg;while(n){bg=getComputedStyle(n).backgroundColor;if(!['transparent','rgba(0, 0, 0, 0)'].includes(bg))break;n=n.parentElement;}const a=lum(getComputedStyle(x).color),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
   const p=el.querySelector('.ilbo-nameplate'),copy=el.querySelector('.ilbo-nameplate-copy').getBoundingClientRect(),title=el.querySelector('h2').getBoundingClientRect(),meta=el.querySelector('.ilbo-meta').getBoundingClientRect(),r=p.getBoundingClientRect();
   return {height:r.height,overflow:document.documentElement.scrollWidth>innerWidth,ratios,titleFits:title.left>=r.left&&title.right<=r.right&&title.top>=r.top&&title.bottom<=r.bottom,copyHeight:copy.height,metaBelow:meta.top>=r.bottom};
  });
  const normal=await measure();assert.equal(normal.overflow,false);assert.ok(normal.ratios.every(r=>r>=4.5),JSON.stringify(normal));assert.ok(normal.titleFits&&normal.metaBelow);
  if(width<=412)assert.ok(normal.height>=120&&normal.height<=160);else assert.ok(normal.height>160);
  await plate.scrollIntoViewIfNeeded();await view.screenshot({path:path.join(out,`${width}-${theme}.png`)});await head.screenshot({path:path.join(out,`${width}-${theme}-masthead.png`)});
  // Real 404 followed by a real successful reload on the same persistent node.
  await context.route('**/masthead-v1.webp?missing',r=>r.fulfill({status:404,body:''}));
  await image.evaluate(x=>{x.src='assets/hani-ilbo/masthead-v1.webp?missing';});
  await page.waitForFunction(()=>{const x=document.querySelector('[data-ilbo-banner]');return x.complete&&x.naturalWidth===0&&x.hidden&&!x.closest('.ilbo-nameplate').classList.contains('ilbo-nameplate-illustrated');});
  const fallback=await measure();assert.ok(fallback.height<normal.height);assert.ok(fallback.ratios.every(r=>r>=4.5));assert.equal(fallback.overflow,false);assert.ok(await head.locator('h2').isVisible());
  await head.screenshot({path:path.join(out,`${width}-${theme}-fallback.png`)});
  await image.evaluate(x=>{x.src='assets/hani-ilbo/masthead-v1.webp';});await page.waitForFunction(()=>document.querySelector('.ilbo-nameplate-illustrated [data-ilbo-banner]')?.naturalWidth===1600);
  await view.locator('[data-ilbo-issue="2"]').count().then(n=>assert.equal(n,0,'future issue stays hidden'));
  await view.locator('[data-ilbo-issue="1"]').click();await page.waitForFunction(()=>document.querySelector('.ilbo-nameplate-illustrated [data-ilbo-banner]')?.naturalWidth===1600);
  const safety=await page.evaluate(()=>({writes:bannerWrites,unchanged:JSON.stringify(state)===beforeBannerState}));assert.deepEqual(safety,{writes:[],unchanged:true});assert.deepEqual(errors,[]);
  report.cases.push({width,theme,normal,fallback,safety,errors});console.log('PASS banner, fallback/reload/archive, AA, no overflow/writes',width,theme);await context.close();
 }
 report.result='PASS';
}catch(e){report.result=browser?'FAIL':'BLOCKED';report.failure=e.stack;process.exitCode=1;console.error(report.result,e.message)}finally{await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'status.json'),JSON.stringify(report,null,2));}
