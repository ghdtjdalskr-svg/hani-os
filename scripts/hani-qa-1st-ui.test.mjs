import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../', import.meta.url)));
if(!process.argv[2]||!process.argv[3])throw Error('Usage: node scripts/hani-qa-1st-ui.test.mjs <playwright index.mjs> <browser exe>');
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const output=path.join(root,'artifacts/qa-1st');fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,metrics=[];
// Keep native smooth scrolling; a fixed 80ms delay can sample a previous view's scroll.
async function settleScroll(page){
  return page.evaluate(()=>new Promise((resolve,reject)=>{
    let previous=scrollY,stable=0,frames=0;
    const tick=()=>{const y=scrollY;stable=Math.abs(y-previous)<.25?stable+1:0;previous=y;
      if(stable>=8)return resolve({scrollY:y,frames});
      if(++frames>=180)return reject(Error('document scroll did not settle'));
      requestAnimationFrame(tick);
    };requestAnimationFrame(tick);
  }));
}
async function controlGeometry(page,selector){
  return page.evaluate(selector=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const intersects=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
    const field=document.querySelector(selector),bar=document.querySelector('header.top'),trigger=document.querySelector('.hani-remote-mobile-trigger');
    const control=rect(field),header=rect(bar),launcher=rect(trigger),painted=bar.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
    return {scrollY,focus:document.activeElement?.id,control,header,launcher,painted,hidden:bar.classList.contains('is-mobile-hidden'),headerPosition:getComputedStyle(bar).position,triggerPosition:getComputedStyle(trigger).position,overlap:painted&&intersects(control,launcher),headerOverlap:painted&&intersects(control,header),scrollPadding:getComputedStyle(document.documentElement).scrollPaddingTop,scrollMargin:getComputedStyle(field).scrollMarginTop};
  },selector);
}
let browser,lastDiagnostic;
try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [390,412,1440])for(const finish of ['porcelain-cream','midnight-black']){
    const context=await browser.newContext({viewport:{width,height:width<=768?844:900},reducedMotion:'reduce',serviceWorkers:'block'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin);await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&!!window.HANI_CONTEXT_REMOTE_V1);
    await page.evaluate(f=>{unlockLoginGate();document.documentElement.dataset.finish=f;document.body.dataset.finishActive='true';showView('home');},finish);
    const before=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    for(const view of ['home','tasks','certificate','investmentIntake','intake','asset','investment','ledger','diet','exercise','monthlyReport','dev','aiBudget','settings','university','study']){
      await page.evaluate(view=>{showView(view);if(view==='settings'){document.querySelector('[data-settings-tab="data"]')?.click();document.getElementById('settingsData').hidden=false;document.getElementById('settingsData').classList.add('active');}window.scrollTo(0,0);},view);
      await page.waitForTimeout(80);
      const early=await page.evaluate(view=>{
        const trigger=document.querySelector('.hani-remote-mobile-trigger').getBoundingClientRect();
        const overlap=[...document.getElementById(view).querySelectorAll('input:not([type="hidden"]),select,textarea,button')].filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden').filter(node=>{const r=node.getBoundingClientRect();return r.x<trigger.right&&r.right>trigger.x&&r.y<trigger.bottom&&r.bottom>trigger.y}).map(node=>node.id||node.textContent.trim());
        return {scrollY,focus:document.activeElement?.id,overlap};
      },view);
      const settled=await settleScroll(page);
      const result=await page.evaluate(({view,width})=>{
        const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
        const visible=node=>!!node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden';
        const intersects=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
        const section=document.getElementById(view),trigger=document.querySelector('.hani-remote-mobile-trigger'),r=rect(trigger);
        const fields=[...section.querySelectorAll('input:not([type="hidden"]),select,textarea,button')].filter(visible);
        const overlap=width<=768?fields.filter(node=>intersects(rect(node),r)).map(node=>node.id||node.textContent.trim()):[];
        const dateWidths=[...section.querySelectorAll('input[data-date-kind="date"]')].filter(visible).map(node=>{const style=getComputedStyle(node),wrap=node.closest('.date-flex-control'),grid=wrap&&getComputedStyle(wrap);return {id:node.id,width:node.clientWidth,scrollWidth:node.scrollWidth,borderBox:rect(node).w,borders:[style.borderLeftWidth,style.borderRightWidth],padding:[style.paddingLeft,style.paddingRight],wrapper:wrap&&rect(wrap).w,tracks:grid?.gridTemplateColumns,gap:grid?.columnGap,parentTracks:wrap&&getComputedStyle(wrap.parentElement).gridTemplateColumns}});
        const money=[...section.querySelectorAll('.stat .value:not(:has(.amount-unit)),.amount-unit,.ledger-breaker-line strong,.ledger-support-kpis b,.portfolio-summary strong')].filter(visible).map(node=>({text:node.textContent,nowrap:getComputedStyle(node).whiteSpace,width:node.clientWidth,scrollWidth:node.scrollWidth}));
        const luminance=rgb=>{const c=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
        const color=value=>(value.match(/[\d.]+/g)||[]).map(Number);
        const background=node=>{let value=[255,255,255];const parents=[];for(let el=node;el;el=el.parentElement)parents.unshift(el);for(const el of parents){const c=color(getComputedStyle(el).backgroundColor),a=c.length>3?c[3]:1;if(c.length>=3)value=value.map((v,i)=>c[i]*a+v*(1-a));}return value;};
        const contrast=[...section.querySelectorAll('.stat .label,.stat .value,.asset-dashboard-card h3,.task-calendar-hub h3,.task-calendar-hub .sub,.hani-dev-history-overview h3,.hani-dev-history-overview p,.asset-capture-intro p,.budget-plan,.ledger-jispi-head span,.ledger-support-kpis span,.ledger-support-kpis b,.earnings-controls label,.earnings-report>.sub')].filter(visible).map(node=>{const fg=luminance(color(getComputedStyle(node).color)),bg=luminance(background(node));return {text:node.textContent,ratio:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};});
        let homeOverlap=false;if(view==='home'){const quote=document.getElementById('homeDialogueText'),actions=document.querySelector('.home-welcome-actions');homeOverlap=intersects(rect(quote),rect(actions));}
        const clip=view==='settings'?[...section.querySelectorAll('#group-backup .feature p')].filter(visible).filter(node=>node.scrollHeight>node.clientHeight+1).map(node=>node.textContent):[];
        return {view,overlap,dateWidths,money,contrast,homeOverlap,clip,scrollY,focus:document.activeElement?.id,triggerRect:r,headerRect:rect(document.querySelector('header.top')),viewWidth:section.clientWidth,viewScroll:section.scrollWidth,pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,triggerPosition:getComputedStyle(trigger).position,headerPosition:getComputedStyle(document.querySelector('header.top')).position};
      },{view,width});
      lastDiagnostic={width,finish,phase:'initial',early,settled,...result};
      if(width<=768&&['investmentIntake','intake'].includes(view))console.log('DIAGNOSTICS Remote controls',JSON.stringify(lastDiagnostic));
      assert.deepEqual(result.overlap,[],`${width}/${view}: Remote covers controls`);assert.equal(result.homeOverlap,false,'home sentence/button overlap');assert.deepEqual(result.clip,[],'backup explanation clipping');
      assert.ok(result.pageWidth<=result.viewport+1,`${width}/${view}: page overflow`);
      if(width===412&&['home','tasks'].includes(view))assert.ok(result.viewScroll<=result.viewWidth+1,`${width}/${view}: view overflow`);
      if(width<=768){assert.equal(result.triggerPosition,'static');assert.equal(result.headerPosition,'sticky',`${width}/${view}: closed Remote retains sticky header`);}
      for(const date of result.dateWidths)assert.ok(date.width>=140&&date.scrollWidth<=date.width+1,`${width}/${view}: date ${JSON.stringify(date)}`);
      for(const value of result.money){assert.equal(value.nowrap,'nowrap',JSON.stringify(value));assert.ok(value.scrollWidth<=value.width+1,`${width}/${view}: amount overflow ${JSON.stringify(value)}`);}
      for(const value of result.contrast)assert.ok(value.ratio>=4.5,`${width}/${finish}/${view}: contrast ${JSON.stringify(value)}`);
      await page.screenshot({path:path.join(output,`${width}-${finish}-${view}.png`)});
      if(width<=768){
        if(['investmentIntake','intake'].includes(view)){
          const field=view==='investmentIntake'?page.locator('#assetCaptureAccount'):page.locator('#intake select:visible,#intake textarea:visible').first();
          const selector='#'+await field.getAttribute('id');
          for(const phase of ['anchor','scroll-up']){
            if(phase==='anchor')await field.evaluate(node=>node.scrollIntoView({behavior:'smooth',block:'start'}));
            else await page.evaluate(()=>window.scrollBy({top:-24,behavior:'smooth'}));
            await settleScroll(page);
            const geometry=await controlGeometry(page,selector);
            lastDiagnostic={width,finish,view,phase,...geometry};console.log('DIAGNOSTICS Remote controls',JSON.stringify(lastDiagnostic));
            assert.equal(geometry.overlap,false,JSON.stringify(lastDiagnostic));
            assert.equal(geometry.headerOverlap,false,JSON.stringify(lastDiagnostic));
            assert.equal(geometry.headerPosition,'sticky');assert.equal(geometry.triggerPosition,'static');
            assert.equal(geometry.header.h,48);assert.ok(geometry.launcher.h>=44,'Remote touch target');
            assert.ok(geometry.control.y>=0&&geometry.control.bottom<=844,'anchor control reachable: '+JSON.stringify(lastDiagnostic));
            if(phase==='scroll-up'){assert.equal(geometry.hidden,false,'scroll up reveals header');assert.equal(geometry.painted,true,'revealed header is painted');}
            metrics.push(lastDiagnostic);await page.screenshot({path:path.join(output,width+'-'+finish+'-'+view+'-'+phase+'.png')});
          }
        }
        await page.locator('.hani-remote-mobile-trigger').click();
        const panel=await page.locator('#haniContextRemote').evaluate(node=>({position:getComputedStyle(node).position,display:getComputedStyle(node).display,headerPosition:getComputedStyle(node.parentElement).position,bottom:node.getBoundingClientRect().bottom,contentTop:document.querySelector('.view.active').getBoundingClientRect().top}));assert.equal(panel.position,'static');assert.equal(panel.display,'grid');assert.equal(panel.headerPosition,'relative','open Remote participates in header flow');assert.ok(panel.bottom<=panel.contentTop+1,`${width}/${view}: open Remote must precede form controls`);await page.locator('.hani-remote-close').click();
        assert.equal(await page.locator('header.top').evaluate(node=>getComputedStyle(node).position),'sticky','closing Remote restores sticky owner');
        // Last control can be scrolled fully into the viewport above bottom safe space.
        const last=page.locator(`#${view} button:visible`).last();if(await last.count()){await last.scrollIntoViewIfNeeded();await settleScroll(page);const box=await last.boundingBox();assert.ok(box.y+box.height<=844,`${view}: last button unreachable`);}
      }
      metrics.push({width,finish,early,settled,...result});
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),before,'read-only UI test changed protected records');assert.deepEqual(errors,[],'runtime errors');await context.close();
  }
  fs.writeFileSync(path.join(output,'ui-results.json'),JSON.stringify(metrics,null,2));console.log('PASS: Edge 390×844/412×844/1440 light/dark Remote, dates, contrast, home, amounts, backup text');
}catch(error){fs.writeFileSync(path.join(output,'ui-results.json'),JSON.stringify({status:'NOT_PASS',error:error.message.split('\n')[0],lastDiagnostic,completed:metrics},null,2));throw error;}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
