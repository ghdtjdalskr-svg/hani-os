// Local evidence only; no new runtime assets. Run with the supplied Playwright module and Edge.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=path.join(root,'artifacts/helper-drag');
const {chromium}=await import(pathToFileURL(process.argv[2]));
const sharp=createRequire(import.meta.url)(path.join(path.dirname(process.argv[2]),'../sharp'));
const images={};
for(const file of ['assets/launch/chibi-launch-v1-day.webp','assets/sprites-v3/daon.webp','assets/sprites-v3/yoonseul.webp',...['cheese','cream','mochi','bori'].map(id=>`assets/profiles/thumb/hani-profile-${id}-256.webp`)]){
  const m=await sharp(path.join(root,file)).metadata();images[file]={width:m.width,height:m.height};
}
fs.writeFileSync(path.join(out,'image-resolution.json'),JSON.stringify(images,null,2));
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
  if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
const results=[];
try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  const origin='http://127.0.0.1:'+server.address().port;
  for(const [width,height] of [[1280,900],[390,844]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:width===390,deviceScaleFactor:width===390?2:1,timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
    await context.addInitScript(()=>{
      window.helperStorageCalls=[];
      window.helperEvents=[];
      for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','click'])document.addEventListener(type,e=>{
        if(e.target.closest?.('#haniHelperBot'))helperEvents.push({type,id:e.pointerId,target:e.target.className,hidden:document.getElementById('haniHelperSpeech')?.hidden});
      },true);
      const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
      Storage.prototype.getItem=function(key){if(key==='hani_helper_pos_v1')helperStorageCalls.push({op:'get',key});return get.call(this,key);};
      Storage.prototype.setItem=function(key,value){helperStorageCalls.push({op:'set',key,value});return set.call(this,key,value);};
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-11-07T12:30:00+09:00'));
    async function load(){
      await page.goto(origin);
      await page.waitForFunction(()=>!!window.HaniHelperBot&&!!window.HaniOrganizationRoster);
      await page.evaluate(()=>{
        document.body.classList.remove('login-locked','login-scroll-locked');
        document.getElementById('app')?.classList.remove('login-locked');
        const gate=document.getElementById('loginGate');if(gate){gate.hidden=true;gate.style.display='none';}
        showView('home');HaniHelperBot.update();
      });
      await page.waitForFunction(()=>!document.getElementById('haniLaunchGreeting'));
      await page.locator('#haniHelperBot').waitFor({state:'visible'});
      await page.waitForFunction(()=>document.querySelector('.hani-helper-news').textContent!=='소식을 확인하는 중이에요.');
    }
    await load();
    const face=page.locator('#haniHelperBot .hani-helper-face'),panel=page.locator('#haniHelperSpeech');
    const rect=()=>face.boundingBox();
    const initial=await rect();assert.equal(initial.width,width>850?90:78);assert.equal(initial.height,initial.width);
    await page.screenshot({path:path.join(out,`${width}-default.png`)});
    const cdp=width===390?await context.newCDPSession(page):null;
    async function dragTo(x,y){
      const b=await rect(),start={x:b.x+b.width/2,y:b.y+b.height/2};
      if(cdp){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
        for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(x-start.x)*i/5,y:start.y+(y-start.y)*i/5}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(x,y,{steps:5});await page.mouse.up();}
    }
    const beforeWrites=await page.evaluate(()=>helperStorageCalls.filter(c=>c.op==='set'&&c.key==='hani_helper_pos_v1').length);
    await dragTo(100,200);assert.equal(await panel.isVisible(),false,'drag does not open');
    const moved=await rect();assert.ok(Math.abs(moved.x-initial.x)>6);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_helper_pos_v1')));
    assert.deepEqual(Object.keys(stored).sort(),['v','x','y']);assert.equal(stored.v,1);assert.ok([stored.x,stored.y].every(n=>n>=0&&n<=1));
    assert.equal(await page.evaluate(()=>helperStorageCalls.filter(c=>c.op==='set'&&c.key==='hani_helper_pos_v1').length),beforeWrites+1);
    await page.screenshot({path:path.join(out,`${width}-dragged.png`)});
    await load();const reloaded=await rect();assert.ok(Math.abs(reloaded.x-moved.x)<1&&Math.abs(reloaded.y-moved.y)<1,'reload retains position');
    if(cdp)await face.tap();else await face.click();assert.equal(await panel.isVisible(),true,'tap opens');
    const opened=await panel.boundingBox();assert.ok(opened.x>=0&&opened.y>=0&&opened.x+opened.width<=width&&opened.y+opened.height<=height);
    const font=await page.locator('.hani-helper-help').evaluate(e=>getComputedStyle(e).fontSize);if(width>850)assert.equal(font,'16px');
    await page.screenshot({path:path.join(out,`${width}-reloaded-open.png`)});
    await page.keyboard.press('Escape');
    await dragTo(width-1,height-1);const edge=await rect();assert.ok(edge.x>=0&&edge.y>=0&&edge.x+edge.width<=width+0.1&&edge.y+edge.height<=height+0.1);
    await page.setViewportSize({width:320,height:500});await page.waitForTimeout(300);const resized=await rect();assert.ok(resized.x>=0&&resized.y>=0&&resized.x+resized.width<=320.1&&resized.y+resized.height<=500.1,JSON.stringify({width,resized,viewport:await page.evaluate(()=>({width:innerWidth,height:innerHeight,vw:visualViewport.width,vh:visualViewport.height}))}));
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    if(cdp)await face.tap();else await face.click();
    await panel.waitFor({state:'visible',timeout:5000}).catch(async()=>{throw Error('reset tap did not open: '+JSON.stringify(await page.evaluate(()=>helperEvents)));});
    await panel.locator('[data-helper-reset]').click();await page.keyboard.press('Escape');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_helper_pos_v1'))),{x:1,y:1,v:1});
    await load();const reset=await rect();assert.ok(Math.abs(reset.x-initial.x)<1&&Math.abs(reset.y-initial.y)<1,'reset persists default');
    // Exercise every existing source crop at the larger size and retain a contact sheet screenshot.
    await page.evaluate(()=>{
      const host=document.createElement('div');host.id='helperCropEvidence';host.style.cssText='position:fixed;inset:16px;z-index:10000;background:white;display:grid;grid-template-columns:repeat(auto-fit,110px);align-content:start;gap:12px;overflow:auto;padding:12px';
      const ids=[...HaniOrganizationRoster.people.map(p=>p.id),'pet-cat','pet-dog','pet-rabbit','pet-bori'];
      for(const id of ids){const item=document.createElement('div'),clone=document.getElementById('haniHelperBot').cloneNode(true);clone.hidden=false;clone.dataset.staff=id;clone.style.cssText='position:relative;left:0;top:0';clone.querySelector('.hani-helper-speech').remove();item.append(clone,document.createTextNode(id));host.append(item);}document.body.append(host);
    });
    await page.screenshot({path:path.join(out,`${width}-all-faces.png`)});
    results.push({width,height,initial,moved,reloaded,opened,font,stored,edge,resized,reset,errors});
    assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));
  console.log('PASS: Edge desktop mouse + phone native touch, size/click/drag/reload/clamp/resize/reset/panel; page errors 0');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
