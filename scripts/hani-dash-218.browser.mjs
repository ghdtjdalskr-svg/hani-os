// Full application with disposable synthetic records; no real account or Cloud.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {source,goals,makeRuntime,expectedCards} from './hani-dash-217-fixture.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/fix-218/dash');
const before=process.argv.includes('--before'),phase=before?'before':'after';
const evidence={phase,cards:[],reports:[],errors:[],assets:[],screenshots:[]};
let server,browser;
try{
 fs.mkdirSync(out,{recursive:true});
 const {chromium}=await import(pathToFileURL(process.argv[2]).href);
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  if(before&&['hani-main.js','index.html'].includes(path.relative(root,file)))file=path.join(out,'baseline',path.basename(file));
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const reportFiles=fs.readdirSync(path.join(root,'docs/gemini-reports')).filter(f=>/^2026-10-(?:11|16|18).*\.md$/.test(f)).sort().reverse();
 assert.equal(reportFiles.length,6);
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1100},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
  await context.addInitScript(()=>{const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:['2026-10-18T19:31:00+09:00']));}static now(){return new D('2026-10-18T19:31:00+09:00').getTime();}};});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
  const page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)evidence.assets.push(r.url().replace(origin,''));});
  await page.goto(origin);await page.waitForFunction(()=>window.HANI_DATA_HUB&&window.HaniOrganizationHub);
  await page.evaluate(({records,targets,factory})=>{
   unlockLoginGate();document.documentElement.dataset.finish='porcelain-cream';
   state=freshState();Object.assign(state,structuredClone(records));renderAll();showView('home');
   window.dash218Protected=localStorage.getItem('hani_os_life_v23');window.dash218State=JSON.stringify(state);window.dash218Writes=[];
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,...args){window.dash218Writes.push(key);if(key!=='hani_os_navigation_v1')throw Error('Unexpected storage write');return original.call(this,key,...args)};
   const create=new Function('return ('+factory+')')();
   dataHubRuntime=create(window.HANI_DATA_HUB,{records,targets,onChange:dataHubRenderDashboard});
  },{records:source,targets:goals,factory:makeRuntime.toString()});
  await page.evaluate(async()=>{await dataHubRuntime.refresh();renderLifeMarket();});
  await page.waitForTimeout(250);
  const cards=page.locator('#lifeMarketGrid');
  const rows=await cards.locator('[data-life-index]').evaluateAll(nodes=>nodes.map(card=>({key:card.dataset.lifeIndex,value:card.querySelector('strong').textContent,change:card.querySelector('.life-card-move').textContent,tone:card.querySelector('.life-card-move').className,market:card.querySelector('.life-card-market').textContent,text:card.innerText,color:getComputedStyle(card.querySelector('.life-card-move')).color})));
  assert.equal(rows.length,6);
  for(const row of rows){const expected=expectedCards[row.key];assert.equal(row.value,expected.value);assert.equal(row.market,expected.market);assert.ok(row.tone.split(' ').includes(expected.tone));assert.doesNotMatch(row.text,/PARTIAL/);if(!before)assert.equal(row.change,'전월 대비 '+expected.change);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  const cardShot=`dashboard-${phase}-${width}.png`;await cards.screenshot({path:path.join(out,cardShot),animations:'disabled',style:'header.top,#haniContextRemote,.hani-remote-mobile-trigger{visibility:hidden!important}'});evidence.screenshots.push(cardShot);
  if(!before){
   const edge=await page.evaluate(()=>{
    const peek=dataHubRuntime.peek.bind(dataHubRuntime),view=structuredClone(peek());
    for(const metric of view.metrics){metric.monthComparison.baseline={value:0,status:'CONFIRMED'};metric.monthComparison.delta_percent=null;}
    dataHubRuntime.peek=()=>view;dataHubRenderDashboard();
    const zero=[...document.querySelectorAll('.life-card-move')].map(n=>n.textContent);
    for(const metric of view.metrics)metric.monthComparison.baseline=null;
    dataHubRenderDashboard();const missing=[...document.querySelectorAll('.life-card-move')].map(n=>n.textContent);
    dataHubRuntime.peek=peek;dataHubRenderDashboard();return {zero,missing};
   });
   assert.deepEqual(edge.zero,Array(6).fill(''));assert.deepEqual(edge.missing,Array(6).fill(''));
   // The existing goal label lives in the goal progress panel, outside these cards.
   assert.ok(await page.getByText('목표 미설정',{exact:false}).count()>0);
   evidence.cards.push({width,rows,edge});
   await page.evaluate(()=>showView('geminiReports'));await page.waitForFunction(()=>document.querySelectorAll('.gemini-report-item').length>0);
   const ids=await page.locator('.gemini-report-item').evaluateAll(nodes=>nodes.map(n=>n.dataset.reportId));
   const expected=await page.evaluate(()=>HaniGeminiReportCatalog.reports.map(r=>r.id).sort().reverse());assert.deepEqual(ids,expected);
   assert.deepEqual(ids.slice(0,6),reportFiles.map(f=>f.slice(0,-3)));
   await page.evaluate(()=>scrollTo(0,0));const menuShot=`reports-menu-${width}.png`;await page.screenshot({path:path.join(out,menuShot),animations:'disabled'});evidence.screenshots.push(menuShot);
   const listShot=`reports-list-${width}.png`;await page.locator('.gemini-reports-library').screenshot({path:path.join(out,listShot),animations:'disabled',style:'header.top,#haniContextRemote,.hani-remote-mobile-trigger{visibility:hidden!important}'});evidence.screenshots.push(listShot);
   for(const file of reportFiles){
    const id=file.slice(0,-3);await page.locator(`[data-report-id="${id}"].gemini-report-item`).click();
    const detail=page.locator('#geminiReportDetail');await detail.waitFor();assert.equal(await detail.getAttribute('aria-busy'),'false');
    const tables=await detail.locator('.gemini-report-table-wrap').evaluateAll(nodes=>nodes.map(w=>{const table=w.querySelector('table'),style=getComputedStyle(table);w.scrollLeft=50;return {width:w.clientWidth,scrollWidth:w.scrollWidth,scrollLeft:w.scrollLeft,overflow:getComputedStyle(w).overflowX,fontSize:style.fontSize,cells:table.querySelectorAll('td').length};}));
    assert.ok(tables.length>0,file);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' page fits');
    for(const t of tables){assert.equal(t.overflow,'auto');assert.ok(t.cells>0);if(width===390){assert.ok(t.scrollWidth>t.width,file);assert.ok(t.scrollLeft>0,file+' actually scrolls');} }
    evidence.reports.push({width,file,tables});
   }
   await page.locator('[data-report-id="2026-10-18-v2.9.149-217-october-monthly-summary"].gemini-report-item').click();
   const wrap=page.locator('#geminiReportDetail .gemini-report-table-wrap').first();await wrap.scrollIntoViewIfNeeded();
   const tableShot=`reports-table-${width}.png`;await wrap.screenshot({path:path.join(out,tableShot),animations:'disabled',style:'header.top,#haniContextRemote,button{visibility:hidden!important}'});evidence.screenshots.push(tableShot);
   if(width===390){await wrap.evaluate(w=>w.scrollLeft=w.scrollWidth);await wrap.screenshot({path:path.join(out,'reports-table-390-scrolled.png'),animations:'disabled',style:'header.top,#haniContextRemote,button{visibility:hidden!important}'});evidence.screenshots.push('reports-table-390-scrolled.png');}
   await page.locator('#geminiReportSearch').fill('10월');assert.ok(await page.locator('.gemini-report-item').count()>0);await page.locator('#geminiReportSearch').fill('');
   await page.locator('#geminiReportFilter').selectOption('approved');assert.equal(await page.locator('.gemini-report-item').count(),ids.length);
   await page.locator('#geminiReportRefresh').click();assert.equal(await page.locator('.gemini-report-item').count(),ids.length);
  }else evidence.cards.push({width,rows});
  assert.equal(await page.evaluate(()=>JSON.stringify(state)===dash218State),true,'memory source unchanged');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===dash218Protected),true,'protected storage unchanged');
  assert.deepEqual(await page.evaluate(()=>dash218Writes.filter(k=>k!=='hani_os_navigation_v1')),[]);
  await context.close();
 }
 assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.assets,[]);evidence.result='PASS';
}catch(e){evidence.result=/EPERM|EACCES/.test(e.message)?'BLOCKED':'FAIL';evidence.reason=e.stack;process.exitCode=1;}
finally{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,`browser-${phase}.json`),JSON.stringify(evidence,null,2));console.log(JSON.stringify({result:evidence.result,cards:evidence.cards.length,reports:evidence.reports.length,screenshots:evidence.screenshots.length,reason:evidence.reason}));}
