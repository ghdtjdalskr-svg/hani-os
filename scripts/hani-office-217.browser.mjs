import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';

export async function runOffice217Browser(playwrightPath,executablePath){
 const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),out=path.join(root,'artifacts/office-217');
 fs.mkdirSync(out,{recursive:true});
 const status={result:'running',scope:'actual application · 390/1440 light · all five floors',screenshots:[],checks:[],errors:[]};
 let browser,server;
 try{
  const {chromium}=await import(pathToFileURL(path.resolve(playwrightPath)).href);
  browser=await chromium.launch({executablePath,headless:true});
  server=http.createServer((req,res)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
   res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:1400},reducedMotion:'reduce',colorScheme:'light'});
   await context.addInitScript(()=>{const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:['2026-10-16T09:00:00+09:00']))}static now(){return new D('2026-10-16T09:00:00+09:00').getTime()}}});
   await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
   const page=await context.newPage(),requests=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>status.errors.push(e.message));
   await page.goto(origin);await page.waitForFunction(()=>window.HaniBuildingScene&&document.querySelectorAll('[data-building-floor]').length===5);
   await page.evaluate(()=>{
    unlockLoginGate();document.documentElement.dataset.finish='cream';showView('agentReview');
    window.office217Slots=[...document.querySelectorAll('.hani-office-desk-props')];window.office217Actors=[...document.querySelector('#haniOfficeActors').children];
    window.office217Writes=[];window.office217Protected=localStorage.getItem('hani_os_life_v23');
    for(const key of ['setItem','removeItem','clear']){const old=Storage.prototype[key];Storage.prototype[key]=function(...a){office217Writes.push(key+':'+(a[0]||''));return old.apply(this,a)}}
   });
   for(const floor of ['4f','3f','2f','1f','5f']){
    await page.locator(`[data-building-floor="${floor}"]`).click();
    await page.waitForFunction(id=>{const m=document.querySelector('#haniOfficeMap'),bg=m.querySelector('.hani-office-background');return m.dataset.floor===id&&m.dataset.art==='floor'&&bg.complete&&bg.naturalWidth===1672&&[...m.querySelectorAll('.hani-office-desk-props')].filter(i=>!i.hidden).every(i=>i.complete&&i.naturalWidth>0)},floor);
    const shot=`${floor}-${width}-light.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(out,shot)});status.screenshots.push(shot);
    const check=await page.evaluate(()=>{
     const m=document.querySelector('#haniOfficeMap'),box=m.getBoundingClientRect(),f=HaniBuildingScene.art.floors[m.dataset.floor],actors=[...document.querySelector('#haniOfficeActors').children].filter(a=>!a.hidden);
     const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
     const plates=[...m.querySelectorAll('.hani-office-room-plate')].filter(p=>!p.hidden&&getComputedStyle(p).visibility!=='hidden'&&p.getBoundingClientRect().width>0);
     return {floor:m.dataset.floor,mapWidth:box.width,overflow:document.documentElement.scrollWidth>innerWidth,
      slots:office217Slots.every((p,i)=>p===m.querySelectorAll('.hani-office-desk-props')[i]),actors:office217Actors.every((p,i)=>p===document.querySelector('#haniOfficeActors').children[i]),writes:office217Writes,protectedSame:office217Protected===localStorage.getItem('hani_os_life_v23'),
      props:[...m.querySelectorAll('.hani-office-desk-props')].filter(p=>!p.hidden).map(p=>{const s=getComputedStyle(p),r=p.getBoundingClientRect();return {id:p.dataset.person,alpha:s.opacity,z:+s.zIndex,loaded:p.naturalWidth>0,inside:r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom}}),expectedProps:f.deskProps.length,
      plates:plates.map(p=>{const r=p.getBoundingClientRect(),s=getComputedStyle(p);return {room:p.dataset.room,brand:p.dataset.brand==='true',background:s.backgroundColor,border:s.borderTopWidth,shadow:s.boxShadow,english:p.querySelector('b')?.textContent,korean:p.querySelector('small')?.textContent,font:parseFloat(getComputedStyle(p.querySelector('b')).fontSize),linesFit:[...p.querySelectorAll('b,small')].every(l=>l.scrollWidth<=l.clientWidth+1),inside:r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom,overlap:actors.filter(a=>overlap(r,a.getBoundingClientRect())).map(a=>a.dataset.person)}}),
      foregrounds:[...m.querySelectorAll('.hani-office-foreground')].filter(i=>!i.hidden).length,ceoLabel:m.querySelector('.hani-office-ceo-nameplate')!==null,
      homeSeats:actors.every(a=>a.dataset.action!=='base-work'||HaniBuildingScene.homeSeat(a.dataset.person)?.id===a.dataset.seat),actorSeats:actors.map(a=>({id:a.dataset.person,seat:a.dataset.seat,action:a.dataset.action,home:HaniBuildingScene.homeSeat(a.dataset.person)?.id})),
      brandImages:[...m.querySelectorAll('[data-brand="true"] img')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0}))};
    });
    status.checks.push({width,...check});
    assert.equal(check.overflow,false);assert.ok(check.slots&&check.actors&&check.protectedSame&&check.homeSeats);assert.deepEqual(check.writes,[]);assert.equal(check.foregrounds,0);assert.equal(check.ceoLabel,false);assert.equal(check.props.length,check.expectedProps);
    for(const prop of check.props){assert.ok(prop.loaded&&prop.inside);assert.ok(prop.z<4);if(['daon','yoonseul'].includes(prop.id))assert.equal(+prop.alpha,.38)}
    if(width<=412)assert.ok(check.plates.every(p=>p.brand));
    for(const p of check.plates){assert.ok(p.inside);assert.deepEqual(p.overlap,[]);if(!p.brand){assert.equal(p.background,'rgb(63, 68, 74)');assert.equal(p.border,'0px');assert.equal(p.shadow,'none');assert.ok(p.english&&p.korean&&p.linesFit);assert.ok(p.font>=9&&p.font<=10)}}
    if(floor==='1f'){assert.equal(check.brandImages.length,1);assert.ok(check.brandImages[0].loaded);assert.equal(check.brandImages[0].src,'./assets/brand/hani-group-ci-lobby-217.webp')}
   }
   assert.ok(!requests.some(u=>u.includes('/signs-')));await context.close();
  }
  assert.deepEqual(status.errors,[]);status.result='passed';
 }catch(e){status.result=/EPERM|EACCES|executable.*exist/i.test(e.message)?'blocked':'failed';status.reason=e.stack;throw e}
 finally{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'browser-status.json'),JSON.stringify(status,null,2))}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await runOffice217Browser(process.argv[2],process.argv[3]);
