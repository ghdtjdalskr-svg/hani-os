import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
if(process.argv.includes('--node-only')){await import('./hani-context-remote.test.mjs');console.log('NOT RUN: remote UI browser AA/geometry/controls at 390/1440');process.exit(0);}
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const uri=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+(uri==='/'?'/index.html':decodeURIComponent(uri)));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,output=path.join(root,'artifacts/remote-206');fs.mkdirSync(output,{recursive:true});
let browser;
const metrics=[];
try{
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.waitForFunction(()=>!!window.HANI_CONTEXT_REMOTE_V1);
  await page.evaluate(f=>{unlockLoginGate();showView('board');document.documentElement.dataset.season='spring';document.documentElement.dataset.finish=f;document.body.dataset.finishActive='true';},finish);
  const rail=page.locator('#haniContextRemote');
  if(width<851)await page.locator('.hani-remote-mobile-trigger').click();
  const protectedBefore=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
  for(const file of fs.readdirSync(path.join(root,'assets/context-remote')).filter(f=>f.endsWith('.jpg'))){
   const image=await rail.locator('.hani-remote-media img').evaluate(async(img,file)=>{
    img.src=`./assets/context-remote/${file}`;await img.decode();const a=img.getBoundingClientRect(),card=img.parentElement.getBoundingClientRect(),s=getComputedStyle(img),c=getComputedStyle(img.parentElement);
    return {file,width:a.width,height:a.height,gapLeft:a.left-card.left-parseFloat(c.borderLeftWidth),gapRight:card.right-a.right-parseFloat(c.borderRightWidth),fit:s.objectFit,padding:parseFloat(s.paddingLeft),position:s.objectPosition};
   },file);
   assert.equal(image.fit,'cover');assert.equal(image.padding,0);assert.ok(Math.abs(image.gapLeft)<=2&&Math.abs(image.gapRight)<=2,JSON.stringify(image));
   assert.ok(Math.abs(image.height-(width===1440?408:202))<=1,JSON.stringify(image));metrics.push({width,finish,...image});
  }
  for(const state of ['rest','hover','focus']){
   const items=rail.locator('.hani-remote-item:visible');
   for(let i=0;i<await items.count();i++){
    const item=items.nth(i);if(state==='hover')await item.hover();if(state==='focus'){await page.keyboard.press('Tab');await item.focus();assert.equal(await item.evaluate(node=>node===document.activeElement&&node.matches(':focus-visible')),true,'keyboard focus activates the focus-visible style');}
    const colors=await item.evaluate(node=>{
     const luminance=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722};
     const bg=getComputedStyle(node).backgroundColor,b=luminance(bg);
     return [...node.querySelectorAll('b,small')].map(t=>{const s=getComputedStyle(t),a=luminance(s.color);return {text:t.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),font:parseFloat(s.fontSize),small:t.tagName==='SMALL',focus:getComputedStyle(node).outlineStyle};});
    });
    for(const c of colors){assert.ok(c.ratio>=4.5,`${finish}/${state}: ${JSON.stringify(c)}`);if(c.small)assert.ok(c.font>=12);if(state==='focus')assert.equal(c.focus,'solid');}metrics.push({width,finish,state,colors});
   }
  }
  assert.ok(await rail.evaluate(n=>n.scrollWidth<=n.clientWidth+1),'panel horizontal overflow');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page horizontal overflow');
  await rail.locator('.hani-remote-media img').evaluate(async img=>{img.src='./assets/context-remote/spring-2.jpg';await img.decode();});
  await rail.evaluate(n=>{n.scrollTop=0;});
  await rail.screenshot({path:path.join(output,`${width}-${finish}.png`)});
  if(width===1440){await rail.locator('.hani-remote-collapse').click();assert.ok(await page.locator('#app').evaluate(n=>n.classList.contains('hani-remote-mini')));assert.ok(await rail.evaluate(n=>n.scrollWidth<=n.clientWidth+1));await rail.locator('.hani-remote-collapse').click();}
  else{await rail.locator('.hani-remote-close').click();assert.equal(await rail.getAttribute('data-open'),'false');await page.locator('.hani-remote-mobile-trigger').click();await page.keyboard.press('Escape');assert.equal(await rail.getAttribute('data-open'),'false');await page.locator('.hani-remote-mobile-trigger').click();}
  await rail.locator('[data-remote-action="theme"]').click();await page.waitForFunction(()=>document.body.dataset.view==='aura');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),protectedBefore);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}/${finish}: 12 images edge-to-edge, AA titles/subtitles, hover/focus, overflow and controls`);
 }
 fs.writeFileSync(path.join(output,'metrics.json'),JSON.stringify(metrics,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
