import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/fix-218');
fs.mkdirSync(out,{recursive:true});
const status={result:'running',scope:'real index.html and local production assets; no roster/metadata/action/scheduler fixtures',checks:[],screenshots:[],errors:[],failedAssets:[]};
let server,browser;
try{
  const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
    if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  for(const width of [390,1440])for(const time of ['19:31','23:00','07:00','12:30','02:00']){
    const context=await browser.newContext({viewport:{width,height:1400},timezoneId:'Asia/Seoul',reducedMotion:'reduce',colorScheme:'light'});
    await context.addInitScript(instant=>{const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:[instant]));}static now(){return new D(instant).getTime();}};},`2026-10-18T${time}:00+09:00`);
    // Keep the real local app/assets; suppress external auth/Cloud/network side effects.
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
    const page=await context.newPage(),requests=[];
    page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>status.errors.push({width,time,error:e.message}));
    page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)status.failedAssets.push({url:r.url().replace(origin,''),status:r.status()});});
    await page.goto(origin);await page.waitForFunction(()=>window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);
    await page.evaluate(()=>{
      unlockLoginGate();document.documentElement.dataset.finish='cream';showView('agentReview');
      window.fix218Actors=[...document.querySelector('#haniOfficeActors').children];window.fix218Writes=[];
      window.fix218Protected=localStorage.getItem('hani_os_life_v23');
      for(const key of ['setItem','removeItem','clear']){const old=Storage.prototype[key];Storage.prototype[key]=function(...a){fix218Writes.push(key+':'+(a[0]||''));return old.apply(this,a);};}
    });
    for(const floor of ['1f','2f','3f','4f','5f']){
      await page.locator(`[data-building-floor="${floor}"]`).click();
      await page.waitForFunction(floor=>{
        const m=document.querySelector('#haniOfficeMap'),bg=m.querySelector('.hani-office-background');
        return m.dataset.floor===floor&&m.dataset.art==='floor'&&bg.complete&&bg.naturalWidth===1672&&[...document.querySelector('#haniOfficeActors').children].filter(a=>!a.hidden).every(a=>a.dataset.avatar==='v2');
      },floor);
      const check=await page.evaluate(()=>{
        const map=document.querySelector('#haniOfficeMap'),box=map.getBoundingClientRect(),s=HaniBuildingScene.snapshot(),floor=s.floors.find(f=>f.id===map.dataset.floor);
        const actors=[...document.querySelector('#haniOfficeActors').children].filter(a=>!a.hidden);
        return {floor:floor.id,expected:floor.visible.map(p=>p.id).sort(),overflow:document.documentElement.scrollWidth>innerWidth,
          persistent:fix218Actors.every((a,i)=>a===document.querySelector('#haniOfficeActors').children[i]),writes:fix218Writes,protectedSame:fix218Protected===localStorage.getItem('hani_os_life_v23'),
          note:{hidden:document.querySelector('.hani-building-presence-note').hidden,text:document.querySelector('.hani-building-presence-note').textContent},
          actors:actors.map(a=>{const r=a.getBoundingClientRect(),style=getComputedStyle(a),sprite=a.querySelector('.hani-office-sprite'),sp=getComputedStyle(sprite),cx=r.left+r.width/2,cy=r.top+r.height/2;
            return {id:a.dataset.person,avatar:a.dataset.avatar,action:a.dataset.action,line:a.dataset.line,seat:a.dataset.seat,display:style.display,visibility:style.visibility,opacity:style.opacity,z:style.zIndex,spriteOpacity:sp.opacity,background:sp.backgroundImage,width:r.width,height:r.height,inside:r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom,hit:document.elementsFromPoint(cx,cy).some(el=>el===a||a.contains(el))};})};
      });
      status.checks.push({width,time,...check});
      assert.equal(check.overflow,false);assert.ok(check.persistent&&check.protectedSame);assert.deepEqual(check.writes,[]);
      assert.deepEqual(check.actors.map(a=>a.id).sort(),check.expected);
      if(time!=='02:00'&&floor!=='5f')assert.ok(check.actors.length>0,`${time} ${floor} cannot be empty`);
      if(time==='02:00'){
        assert.equal(check.note.hidden,false);assert.match(check.note.text,/심야.*라운지/);
        assert.deepEqual(check.actors.map(a=>a.id).sort(),floor==='3f'?['dohyun','seoyun']:floor==='4f'?['mir']:floor==='1f'?['minji','yuna']:[]);
      }else assert.equal(check.note.hidden,true);
      for(const a of check.actors){assert.equal(a.avatar,'v2');assert.notEqual(a.display,'none');assert.equal(a.visibility,'visible');assert.equal(+a.opacity,1);assert.equal(+a.spriteOpacity,1);assert.ok(+a.z>=4);assert.ok(a.width>0&&a.height>0&&a.inside&&a.hit,`${a.id} visible on floor`);assert.match(a.background,/sprites-v2/);assert.equal(a.action,'base-work');}
      if(time==='19:31'||time==='12:30'||time==='23:00'&&floor==='3f'){
        const filename=`${time.replace(':','')}-${floor}-${width}.png`;
        await page.locator('#haniOfficeLive').screenshot({path:path.join(out,filename)});status.screenshots.push(filename);
      }
    }
    for(const asset of ['data/hani-building/spatial-contract.json','assets/sprites-v2/manifest.json','data/hani-building/art-map-v1.json','assets/data/office-actions-216.json'])assert.ok(requests.some(url=>url.endsWith('/'+asset)),asset+' fetched by production bootstrap');
    assert.ok(requests.some(url=>url.endsWith('/hani-office-live.js?v=2.9.217')),'production script/cache URL');
    await context.close();
  }
  assert.deepEqual(status.errors,[]);assert.deepEqual(status.failedAssets,[]);status.result='passed';
}catch(error){status.result=/EPERM|EACCES|executable.*exist/i.test(error.message)?'blocked':'failed';status.reason=error.stack;process.exitCode=1;}
finally{await browser?.close();if(server?.listening)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'browser-status.json'),JSON.stringify(status,null,2));console.log(JSON.stringify({result:status.result,checks:status.checks.length,screenshots:status.screenshots.length,reason:status.reason}));}
