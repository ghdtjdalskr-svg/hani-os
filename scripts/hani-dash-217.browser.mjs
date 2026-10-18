// Optional full-app browser QA with synthetic memory data and all external traffic blocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {source,goals,makeRuntime,expectedCards} from './hani-dash-217-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/dash-217');
fs.mkdirSync(out,{recursive:true});
const status={result:'RUNNING',scope:'full app, synthetic memory records, external traffic blocked',screenshots:[],checks:[]};
let browser,server,lastPage;
try{
  const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const {chromium}=await import(pathToFileURL(runtime).href);
  browser=await chromium.launch({headless:true,executablePath:process.argv[3]||process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  for(const width of [390,884,1440])for(const finish of ['porcelain-cream','midnight-black']){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    await context.addInitScript(()=>{const Native=Date;window.Date=class extends Native{constructor(...args){super(...(args.length?args:['2026-10-18T03:00:00Z']))}static now(){return new Native('2026-10-18T03:00:00Z').getTime()}}});
    const page=await context.newPage(),errors=[];lastPage=page;page.on('pageerror',error=>errors.push(error.message));
    page.on('dialog',dialog=>dialog.dismiss());
    await page.goto(origin);await page.waitForFunction(()=>!!window.HANI_DATA_HUB&&typeof unlockLoginGate==='function');
    await page.evaluate(({records,finish})=>{
      unlockLoginGate();document.documentElement.dataset.finish=finish;document.body.dataset.finishActive='true';
      state=freshState();Object.assign(state,structuredClone(records));renderAll();showView('home');
      window.dash217State=JSON.stringify(state);
      window.dash217Writes=[];
      // Existing scroll/navigation persistence is intercepted without touching storage.
      for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(key){dash217Writes.push({method,key});if(method==='setItem'&&key==='hani_os_navigation_v1')return;throw Error('Fixture must never write storage');};
      dataHubRuntime=null;dataHubRenderDashboard();renderSettlementCheck();
    },{records:source,finish});
    await page.locator('#homeMixDonut').scrollIntoViewIfNeeded();
    assert.match(await page.locator('#homeMixDonut').innerText(),/로그인·원본 확인이 필요해요/);
    assert(!/OWNER_BINDING_BLOCKED/.test(await page.locator('#homeMixDonut').innerText()));
    assert((await page.locator('#homeMixDonut [title]').getAttribute('title')).includes('OWNER_BINDING_BLOCKED'));
    const suffix=finish==='porcelain-cream'?'':`-${finish}`;
    const blocked=`comparison-blocked-${width}${suffix}.png`;
    await page.locator('#homeMixDonut').screenshot({path:path.join(out,blocked)});status.screenshots.push(blocked);
    const settlement=page.locator('#settlementQuickCheck');await settlement.scrollIntoViewIfNeeded();assert.equal(await settlement.isVisible(),true);
    assert.equal(await settlement.locator('[data-check-go]').count(),4);
    const rows=await settlement.locator('[data-check-go]').evaluateAll(nodes=>nodes.map(el=>{
      const text=el.querySelector('div'),action=el.querySelector('span'),r=text.getBoundingClientRect(),a=action.getBoundingClientRect();
      return {width:el.clientWidth,scrollWidth:el.scrollWidth,textWidth:r.width,textLeft:r.left,textRight:r.right,actionLeft:a.left,actionRight:a.right,actionTop:a.top,textTop:r.top,textBottom:r.bottom};
    }));
    for(const row of rows){assert(row.scrollWidth<=row.width+1,JSON.stringify(row));assert(row.textWidth>=150,JSON.stringify(row));assert(row.actionLeft>=row.textRight,JSON.stringify(row));assert(row.actionTop>=row.textTop&&row.actionTop<=row.textBottom,JSON.stringify(row));}
    const checkShot=`settlement-${width}${suffix}.png`;await settlement.screenshot({path:path.join(out,checkShot)});status.screenshots.push(checkShot);
    await page.evaluate(async({records,targets,runtimeFactory})=>{
      dataHubSelectedMonth='2026-09';
      const create=new Function('return ('+runtimeFactory+')')();
      dataHubRuntime=create(window.HANI_DATA_HUB,{records,targets,onChange:dataHubRenderDashboard});
      await dataHubRuntime.refresh();renderLifeMarket();
      window.dash217Slots=[...document.querySelectorAll('#lifeMarketGrid .life-card-move,#lifeMarketGrid .life-card-market,#lifeMarketGrid .life-card-quality')];
    },{records:source,targets:goals,runtimeFactory:makeRuntime.toString()});
    await page.waitForTimeout(400);
    const cards=page.locator('#lifeMarketGrid [data-life-index]');assert.equal(await cards.count(),6);
    await page.locator('#lifeMarketGrid').scrollIntoViewIfNeeded();
    for(const [key,expected] of Object.entries(expectedCards)){
      const card=page.locator(`#lifeMarketGrid [data-life-index="${key}"]`);
      assert.equal(await card.locator('strong').innerText(),expected.value,key);
      assert.equal(await card.locator('.life-card-move').innerText(),'전월 대비 '+expected.change,key);
      assert.equal(await card.locator('.life-card-market').innerText(),expected.market,key);
      assert((await card.locator('.life-card-move').getAttribute('class')).split(' ').includes(expected.tone),key);
    }
    for(const card of await cards.all()){
      assert.equal(await card.locator('.life-card-move').count(),1);
      assert(!/PARTIAL|관측 \d+일/.test(await card.innerText()));
      assert(await card.getAttribute('title'));
      await card.click();
    }
    assert.equal(await page.evaluate(()=>document.querySelector('[data-life-index="hinkei"]').classList.contains('is-selected')),true);
    assert.equal(await page.evaluate(()=>dash217Slots.every(el=>el.isConnected)),true,'selection reuses slots');
    // Center the whole grid after clicks so the fixed mobile header does not cover the capture.
    await page.locator('#lifeMarketGrid').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    const geometry=await cards.evaluateAll(cards=>cards.map(card=>{
      const rect=card.getBoundingClientRect(),value=card.querySelector('strong').getBoundingClientRect(),move=card.querySelector('.life-card-move').getBoundingClientRect();
      return {key:card.dataset.lifeIndex,width:card.clientWidth,scrollWidth:card.scrollWidth,height:card.clientHeight,scrollHeight:card.scrollHeight,
        valueBottom:value.bottom,moveTop:move.top,content:[...card.children].filter(el=>getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect();return {cls:el.className,left:r.left-rect.left,right:r.right-rect.left,top:r.top-rect.top,bottom:r.bottom-rect.top,scrollWidth:el.scrollWidth,width:el.clientWidth};})};
    }));
    // The existing clipped decorative ::after circle intentionally exceeds the card box.
    // Check visible content bounds and its own text overflow instead of that decoration.
    for(const card of geometry){for(const el of card.content){assert(el.left>=0&&el.right<=card.width+2&&el.top>=0&&el.bottom<=card.height+2,JSON.stringify({card:card.key,el}));assert(el.scrollWidth<=el.width+1,JSON.stringify({card:card.key,el}));}assert(card.moveTop>=card.valueBottom-1,JSON.stringify(card));}
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page horizontal overflow');
    assert.deepEqual(await page.evaluate(()=>dash217Writes.filter(x=>x.method!=='setItem'||x.key!=='hani_os_navigation_v1')),[]);
    assert.equal(await page.evaluate(()=>JSON.stringify(state)===dash217State),true,'read-only state');
    const screenshot=`cards-${width}${suffix}.png`;
    const clip=await cards.evaluateAll(nodes=>{const rs=nodes.map(n=>n.getBoundingClientRect()),left=Math.min(...rs.map(r=>r.left)),top=Math.min(...rs.map(r=>r.top));return {x:left+scrollX,y:top+scrollY,width:Math.max(...rs.map(r=>r.right))-left,height:Math.max(...rs.map(r=>r.bottom))-top};});
    // Capture just the six cards; hide the fixed header only during the crop.
    await page.screenshot({path:path.join(out,screenshot),fullPage:true,clip,style:'.top{visibility:hidden!important}'});status.screenshots.push(screenshot);
    await page.evaluate(()=>{dataHubRuntime.invalidate();dataHubRenderDashboard();});
    assert.equal(await page.locator('#homeAsset').innerText(),'—');
    assert.equal(await page.locator('[data-life-index="hasdaq"] .life-card-market').innerText(),'⏳ 검증 대기');
    assert(!/OWNER_BINDING_BLOCKED/.test(await page.locator('#homeMixDonut').textContent()));
    assert.deepEqual(await page.evaluate(()=>dash217Writes.filter(x=>x.method!=='setItem'||x.key!=='hani_os_navigation_v1')),[]);
    assert.deepEqual(errors,[]);
    await settlement.locator('[data-check-go="ledger"]').click();
    await page.locator('#ledger').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>JSON.stringify(state)===dash217State),true,'settlement navigation preserves records');
    assert.deepEqual(await page.evaluate(()=>dash217Writes.filter(x=>x.method!=='setItem'||x.key!=='hani_os_navigation_v1')),[]);
    status.checks.push({width,finish,result:'PASS',geometry,rows,errors,interceptedNavigationWrites:await page.evaluate(()=>dash217Writes.length),protectedWrites:0});await context.close();
  }
  status.result='PASS';
}catch(error){status.result=/spawn EPERM/.test(error.message)?'BLOCKED':'FAIL';status.reason=error.message;status.stack=error.stack;
  if(lastPage&&!lastPage.isClosed()){await lastPage.locator('#lifeMarketGrid').screenshot({path:path.join(out,'failure-cards.png')}).catch(()=>{});status.cardDebug=await lastPage.locator('[data-life-index="hasdaq"]').evaluate(el=>[el,...el.children].map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {cls:n.className,width:r.width,height:r.height,scrollWidth:n.scrollWidth,display:s.display,position:s.position,minWidth:s.minWidth,grid:s.gridTemplateColumns,rows:s.gridTemplateRows,heightCss:s.height,padding:s.padding,overflow:s.overflow};}));}
  if(lastPage&&!lastPage.isClosed())status.debug=await lastPage.evaluate(()=>{let el=document.querySelector('#homeMixDonut');const ancestors=[];for(let p=el;p;p=p.parentElement)ancestors.push({tag:p.tagName,id:p.id,cls:p.className,display:getComputedStyle(p).display,visibility:getComputedStyle(p).visibility});return {secondary:el?.outerHTML,ancestors};});
  process.exitCode=1;}
finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'browser-status.json'),JSON.stringify(status,null,2));console.log(JSON.stringify(status));}
