import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/fix-218');
const before=process.argv.includes('--before');
const result={phase:before?'before':'after',views:[],tabs:[],screenshots:[],errors:[],failedAssets:[]};
const heroSelector='.ds-main-character-banner,.hani-master-hero,.ogh-hero,.intake-hero,.monthly-report-hero,.deploy-hero,.budget-hero,.seasonal-life-banner,.aura-preview';
let server,browser;
try{
  const {chromium}=await import(pathToFileURL(process.argv[2]).href);
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  server=http.createServer((req,res)=>{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
    if(before&&path.dirname(file)===root){const baseline=path.join(out,'followup-baseline',path.basename(file));if(fs.existsSync(baseline))file=baseline;}
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  for(const width of (before?[1440]:[390,1440])){
    const context=await browser.newContext({viewport:{width,height:1100},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
    await context.addInitScript(()=>{const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:['2026-10-18T19:31:00+09:00']));}static now(){return new D('2026-10-18T19:31:00+09:00').getTime();}};});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
    const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)result.failedAssets.push(r.url().replace(origin,''));});
    await page.goto(origin);await page.waitForFunction(()=>window.HaniBuildingScene?.scheduler&&window.HaniOrganizationHub);
    await page.evaluate(()=>{unlockLoginGate();document.documentElement.dataset.finish='cream';});
    // Use the source nav inventory, including work even if legacy cleanup removes its button.
    const views=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<button class="nav-btn[^>]*data-view="([^"]+)"[^>]*>[\s\S]*?<span class="txt">([^<]+)<\/span>/g)].map(m=>({id:m[1],label:m[2]}));
    for(const view of views){
      await page.evaluate(id=>showView(id),view.id);
      await page.waitForTimeout(350);
      const row=await page.evaluate(({view,selector})=>{
        const root=document.getElementById(view.id);
        if(!root)return {...view,heroes:[],visible:0,retired:true,overflow:false};
        const heroes=[...root.querySelectorAll(selector)].map(h=>({class:h.className,visible:!!(h.getBoundingClientRect().width&&h.getBoundingClientRect().height)&&getComputedStyle(h).display!=='none',title:h.querySelector('h1,h2,h3')?.textContent,image:h.querySelector('img')?.getAttribute('src')}));
        return {...view,heroes,visible:heroes.filter(h=>h.visible).length,overflow:document.documentElement.scrollWidth>innerWidth};
      },{view,selector:heroSelector});
      result.views.push({width,...row});
      if(!before){
        if(row.retired)assert.equal(view.id,'work','only the pre-existing retired view has no hero');
        else assert.equal(row.visible,1,`${width}/${view.id}: ${JSON.stringify(row.heroes)}`);
        if(['ilbo','organization','investmentCommittee','agentReview','board'].includes(view.id))assert.equal(row.overflow,false,view.id+' no horizontal overflow');
        if(['ilbo','organization','investmentCommittee','agentReview'].includes(view.id)){
          await page.locator(`#${view.id} > .ds-main-character-banner img`).evaluate(i=>i.decode());
          await page.evaluate(()=>scrollTo(0,0));
          const name=`${view.id}-218-${width}.png`;await page.screenshot({path:path.join(out,name),animations:'disabled'});result.screenshots.push(name);
        }
      }
    }
    if(before){
      await page.evaluate(()=>showView('settings'));
      await page.locator('[data-settings-tab="policy"]').click();await page.waitForTimeout(100);
      const count=await page.locator('#settings').evaluate((root,selector)=>[...root.querySelectorAll(selector)].filter(h=>h.getBoundingClientRect().width&&h.getBoundingClientRect().height).length,heroSelector);
      result.tabs.push({width,id:'settings',tab:'policy',heroes:count});
    }
    if(!before){
      const names=await page.evaluate(()=>{
        const pairs=[['agentReview','HANI 본사','하니 본사'],['board','HANI 라운지','하니 라운지'],['ilbo','HANI 일보','하니일보'],['investmentCommittee','HANI 투자 리포트','하니 투자 리포트']];
        return pairs.map(([id,name,old])=>({id,name,label:document.querySelector(`#sidebar [data-view="${id}"] .txt`).textContent,aria:document.querySelector(`#sidebar [data-view="${id}"]`).getAttribute('aria-label'),aliases:[name,old].map(q=>quickJumpMatches(q).map(r=>[r[0],r[1]]))}));
      });
      for(const n of names){assert.equal(n.label,n.name);assert.equal(n.aria,n.name);for(const a of n.aliases)assert.deepEqual(a,[[n.id,n.name]]);}
      for(const [id,selector] of [['organization','.organization-tabs button'],['monthlyReport','[data-report-board]'],['investmentCommittee','.ic-section-tabs button'],['settings','[data-settings-tab]'],['aura','.aura-tabs button']]){
        await page.evaluate(id=>showView(id),id);
        const buttons=page.locator('#'+id+' '+selector);
        for(let n=0;n<await buttons.count();n++){
          await buttons.nth(n).click();await page.waitForTimeout(100);
          const count=await page.locator('#'+id).evaluate((root,selector)=>[...root.querySelectorAll(selector)].filter(h=>h.getBoundingClientRect().width&&h.getBoundingClientRect().height).length,heroSelector);
          result.tabs.push({width,id,tab:n,heroes:count});assert.equal(count,1,`${width}/${id} tab ${n}`);
        }
      }
      await page.evaluate(()=>showView('home'));
      assert.equal(await page.locator('#home #seasonalLifeArtwork').count(),1,'seasonal scene folded into canonical hero');
      await page.evaluate(()=>showView('agentReview'));
      if(width===390){await page.locator('#mobileMenu').click();await page.waitForTimeout(350);}
      const left=await page.locator('#sidebar').evaluate(e=>e.getBoundingClientRect().left);assert.ok(left>=-1,'fully opened sidebar');
      const name=`sidebar-218-${width}.png`;await page.screenshot({path:path.join(out,name),animations:'disabled'});result.screenshots.push(name);
    }
    await context.close();
  }
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.failedAssets,[]);result.result='passed';
}catch(error){result.result=/EPERM|EACCES/.test(error.message)?'blocked':'failed';result.reason=error.stack;process.exitCode=1;}
finally{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,`heroes-${result.phase}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify({result:result.result,views:result.views.length,screenshots:result.screenshots.length,reason:result.reason}));}
