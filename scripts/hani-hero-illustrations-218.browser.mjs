import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/fix-218/heroes');
const before=process.argv.includes('--before'),phase=before?'before':'after';
const fresh=['ilbo','organization','investmentCommittee'];
const selector='.ds-main-character-banner,.hani-master-hero,.ogh-hero,.intake-hero,.monthly-report-hero,.deploy-hero,.budget-hero,.seasonal-life-banner,.aura-preview';
const result={phase,views:[],tabs:[],screenshots:[],errors:[],failedAssets:[]};
let server,browser;
try{
  const {chromium}=await import(pathToFileURL(process.argv[2]).href);
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  const views=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<button class="nav-btn[^>]*data-view="([^"]+)"[^>]*>[\s\S]*?<span class="txt">([^<]+)<\/span>/g)].map(m=>({id:m[1],label:m[2]}));
  assert.equal(views.length,36,'Milestones v1 adds one sidebar view');
  assert.equal(views.filter(view=>view.id==='milestones').length,1);
  assert.equal(new Set(views.map(view=>view.id)).size,36,'no duplicate nav view');
  for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:1100},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
    await context.addInitScript(()=>{const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:['2026-10-18T19:31:00+09:00']));}static now(){return new D('2026-10-18T19:31:00+09:00').getTime();}};});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
    const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)result.failedAssets.push(r.url().replace(origin,''));});
    await page.goto(origin);await page.waitForFunction(()=>window.HaniBuildingScene?.scheduler&&window.HaniOrganizationHub);
    await page.evaluate(()=>{unlockLoginGate();document.documentElement.dataset.finish='cream';window.heroProtected=localStorage.getItem('hani_os_life_v23');});
    for(const view of views){
      await page.evaluate(id=>showView(id),view.id);await page.waitForTimeout(350);
      const row=await page.evaluate(async({view,selector})=>{
        const root=document.getElementById(view.id);
        if(!root)return {...view,retired:true,heroes:[]};
        const visible=e=>!!(e.getBoundingClientRect().width&&e.getBoundingClientRect().height)&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
        const heroes=[];
        for(const h of [...root.querySelectorAll(selector)].filter(visible)){
          const images=[];
          for(const i of [...h.querySelectorAll('img')].filter(visible)){
            try{await i.decode();}catch{}
            const c=getComputedStyle(i),b=i.getBoundingClientRect();
            images.push({src:i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight,decoded:i.complete&&i.naturalWidth>0,opacity:c.opacity,fit:c.objectFit,position:c.objectPosition,mask:c.maskImage,rect:{width:b.width,height:b.height}});
          }
          heroes.push({class:h.className,title:h.querySelector('h1,h2,h3')?.textContent,images});
        }
        return {...view,heroes,overflow:document.documentElement.scrollWidth>innerWidth,protectedSame:heroProtected===localStorage.getItem('hani_os_life_v23')};
      },{view,selector});
      result.views.push({width,...row});
      if(row.retired){assert.equal(view.id,'work');continue;}
      assert.equal(row.heroes.length,view.id==='organization'?2:1,view.id+' canonical banner and approved overview hero');
      if(view.id==='organization'){
        assert.equal(await page.locator('#organization > .ds-main-character-banner:visible').count(),1);
        assert.equal(await page.locator('.ogh-overview > .ogh-hero:visible').count(),1);
        assert.ok(row.heroes[1].images.some(i=>i.src==='./assets/team/hani-org-demo-day-v1.webp'&&i.decoded),'restored Demo Day image decodes');
      }
      assert.ok(row.heroes[0].images.some(i=>i.decoded&&Number(i.opacity)>0),view.id+' visible decoded illustration');
      if(fresh.includes(view.id)){
        assert.equal(row.overflow,false);assert.equal(row.protectedSame,true);
        if(!before){
          const scene=row.heroes[0].images[0];assert.equal(scene.src,view.id==='investmentCommittee'?'./assets/banner-preview-v1/investment-market-room-v1.webp':`./assets/heroes/${view.id}-226w.webp`);assert.ok(scene.width/scene.height>2.8&&scene.width/scene.height<3.2);
          assert.equal(scene.fit,'cover','wide image without letterbox');assert.notEqual(scene.mask,'none','soft left fade');assert.equal(+scene.opacity,1);
          assert.ok(scene.rect.width>scene.rect.height,'wide mobile image area');
          const slot=await page.locator(`#${view.id} > .ds-main-character-banner`).elementHandle();
          await page.evaluate(()=>scrollTo(0,0));const name=`${view.id}-${width}.png`;
          await page.screenshot({path:path.join(out,name),animations:'disabled'});result.screenshots.push(name);
          if(view.id!=='ilbo'){
            const tabs=page.locator(view.id==='organization'?'#organization .organization-tabs button':'#investmentCommittee .ic-section-tabs button');
            for(let n=0;n<await tabs.count();n++){
              await tabs.nth(n).click();
              const same=await slot.evaluate((node,src)=>node===node.parentElement.querySelector(':scope > .ds-main-character-banner')&&node.querySelector('.ds-main-character-banner__scene img').getAttribute('src')===src,scene.src);
              assert.equal(same,true,'same slot and illustration after internal tab change');result.tabs.push({width,id:view.id,tab:n,persistent:same});
            }
          }
        }
      }
    }
    await context.close();
  }
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.failedAssets,[]);result.result='passed';
}catch(error){result.result=/EPERM|EACCES/.test(error.message)?'blocked':'failed';result.reason=error.stack;process.exitCode=1;}
finally{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,`audit-${phase}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify({result:result.result,views:result.views.length,tabs:result.tabs.length,screenshots:result.screenshots.length,reason:result.reason}));}
