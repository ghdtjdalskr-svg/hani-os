// Synthetic snapshot only. Usage: node <file> [playwright/index.mjs browser.exe]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url), C=require('../hani-investment-committee.js');
const root=path.resolve(import.meta.dirname,'..');
const fixture=require('./fixtures/investment-research-mock.json');
const cards=fixture.cards.slice(0,5).map((c,i)=>({...C.normalizeCard(c),id:'report-'+i,researchId:'report-'+i,rating:C.RATINGS[i],convictionScore:60+i*7,currentPrice:{value:[30000,45000,190000,130,200][i],currency:c.currency,asOf:'2026-10-10',source:'fixture'},executiveComment:'장기 경쟁력을 확인하고 다음 실적에서 가정을 점검합니다.',nextCheckpoints:['2026-11-02 실적 확인']}));
const base={id:'report-rev-1',reviewMonth:'2026-10',revision:1,confirmedAt:'2026-10-14T01:30:00Z',portfolioRating:'HOLD / SELECTIVE BUY',marketView:'변동성이 높아진 시장에서 현금 흐름과 기업 가치를 점검합니다.',executiveSummary:'좋은 기업을 보유하며 가정의 변화를 추적합니다.',haniRecommendation:'가격의 움직임보다 투자 논리의 변화를 먼저 확인하세요.',securitySnapshots:cards,holdingsRefs:[{currency:'KRW',evaluationAmount:1500000}],actionPlan:[],ratingChanges:[],newBuys:[],reductions:[],exits:[]};
const previous={...structuredClone(base),id:'report-sep',reviewMonth:'2026-09',securitySnapshots:cards.map((c,i)=>({...c,rating:C.RATINGS[i===0?1:i===4?3:i]}))};
const latest={...structuredClone(base),id:'report-rev-2',revision:2,confirmedAt:'2026-10-14T05:00:00Z'};
const before=JSON.stringify([base,previous,latest]);
// Hide unrelated fixed OS chrome only while capturing the report artifact.
const screenshotStyle='.hani-context-remote,.hani-remote-mobile-trigger,.ui26-top{visibility:hidden!important}';
const m=C.monthlyReportMetrics(base,previous);
assert.deepEqual(Object.values(m.distribution),[1,1,1,1,1]);
assert.deepEqual(m.changes,{up:1,down:1,compared:5,month:'2026-09'});
assert.equal(m.average,74);assert.deepEqual(m.evaluation,{currency:'KRW',value:1500000});
assert.equal(C.monthlyReportMetrics({}).average,null);
assert.equal(C.monthlyReportMetrics({}).changes,null);
assert.equal(C.monthlyReportMetrics({}).evaluation,null);
assert.equal(C.monthlyReportMetrics({...base,holdingsRefs:[{currency:'USD',evaluationAmount:1},{currency:'KRW',evaluationAmount:2}]}).evaluation,null);
assert.equal(C.monthlyReportMetrics({...base,holdingsRefs:[{currency:'KRW',evaluationAmount:null}]}).evaluation,null);
for(const price of [1,45000,65000,80000,500000]){
 const r=C.fairValueRange({...cards[0],currentPrice:{value:price,currency:'KRW'}});
 for(const k of ['lowPosition','midPosition','highPosition','pricePosition'])assert.ok(r[k]>=0&&r[k]<=100);
}
assert.equal(C.fairValueRange({...cards[0],currentPrice:null}),null);
assert.equal(C.fairValueRange({...cards[0],fairValueLow:null}),null);
assert.equal(C.fairValueRange({...cards[0],fairValueLow:999999}),null);
assert.equal(C.fairValueRange({...cards[0],currentPrice:{value:1,currency:'USD'}}),null);
assert.equal(C.fairValueRange({...cards[0],fairValueLow:1,fairValue:1,fairValueHigh:1,currentPrice:{value:1,currency:'KRW'}}).pricePosition,50);
assert.equal(JSON.stringify([base,previous,latest]),before);
console.log('PASS snapshot-only KPI/distribution/comparison/range bounds/missing values/immutability');

if(process.argv[2]&&process.argv[3]){
 const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
 const out=path.join(root,'artifacts/monthly-report-212');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let browser;const results=[];
 try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [412,884,1440])for(const finish of ['porcelain-cream','midnight-black']){
   const context=await browser.newContext({viewport:{width,height:1000}});
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin);await page.waitForFunction(()=>window.HaniInvestmentCommittee);
   await page.evaluate(({base,latest,previous,finish})=>{
    unlockLoginGate();showView('investmentCommittee');document.documentElement.dataset.finish=finish;document.documentElement.dataset.theme=finish==='midnight-black'?'dark':'light';document.body.dataset.finishActive='true';
    state=freshState();state.investmentResearchCards=structuredClone(base.securitySnapshots);state.investmentCommitteeSnapshots=[previous,base,latest];
    window.reportPersists=0;commit=save=()=>{reportPersists++;return true;};
    Storage.prototype.setItem=()=>{reportPersists++;};Storage.prototype.removeItem=()=>{reportPersists++;};Storage.prototype.clear=()=>{reportPersists++;};
    HaniInvestmentCommittee.render();window.reportBefore=JSON.stringify(state);
   },{base,latest,previous,finish});
   await page.locator('[data-ic-section]').nth(1).click();
   await page.locator('[data-monthly="month"][data-month="2026-10"]').click();
   const report=page.locator('.ic-monthly-report');
   assert.equal(await report.count(),1);assert.match(await report.locator('.ic-report-cover').innerText(),/HANI MONTHLY INVESTMENT REPORT[\s\S]*2026\.10[\s\S]*확정본 · 수정본 2/);
   assert.equal(await report.locator('[data-report-kpi]').count(),5);
   assert.equal(await report.locator('.ic-report-cover-headline').innerText(),C.conclusionLines(base)[0]);
   assert.match(await report.locator('.ic-report-cover-subtitle').innerText(),/10월 투자 보고서/);
   assert.match(await report.locator('.ic-report-cover-meta').innerText(),/2026.10.14[\s\S]*KST 확정[\s\S]*검토 5종목[\s\S]*수정본 2/);
   assert.equal(await report.locator('.ic-report-cover-art').evaluate(e=>e.complete&&e.naturalWidth>0),true);
   assert.equal(await report.locator('.ic-report-cover h2').evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length;}),1,'month stays on one line');
   assert.equal(await report.locator('.ic-role-table').count(),0);
   assert.equal(await report.locator('.ic-report-roles-empty').count(),1);
   assert.equal(await report.locator('.ic-report-score').count(),1);
   const layout=await report.locator('.ic-report-kpis').evaluate(e=>({columns:getComputedStyle(e).gridTemplateColumns.split(' ').length,heights:[...e.children].map(c=>c.getBoundingClientRect().height)}));
   assert.equal(layout.columns,width===1440?5:width===884?3:2);
   assert.ok(Math.max(...layout.heights)-Math.min(...layout.heights)<1,'equal KPI heights');
   assert.equal(await report.locator('.ic-report-kpi-icon').count(),5);
   assert.match(await report.locator('[data-report-kpi="changes"]').innerText(),/↑ 상향 1[\s\S]*↓ 하향 1/);
   for(const rating of C.RATINGS){
    const segment=report.locator('[data-report-rating="'+rating+'"]');
    assert.equal(await segment.getAttribute('data-count'),'1');assert.equal(await segment.innerText(),'1');
    assert.equal(await segment.evaluate(e=>e.style.width),'20%');
   }
   assert.equal(await report.locator('.ic-snapshot-security').count(),5);
   assert.equal(await report.locator('.ic-report-range').count(),5);
   assert.equal(await report.locator('.ic-report-conviction').count(),5);
   assert.equal(await report.locator('[data-monthly="revision"]').count(),2);
   assert.equal(await report.locator('[aria-current="step"]').getAttribute('data-snapshot'),latest.id);
   const visual=await page.evaluate(()=>{
    const el=document.querySelector('.ic-monthly-report'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;
    const rgb=c=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=c;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
    const lum=c=>c.slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
    const bg=e=>{for(;e;e=e.parentElement){const c=rgb(getComputedStyle(e).backgroundColor);if(c[3]===255)return c;}return [255,255,255,255];};
    const visibleText=[...el.querySelectorAll('*')].filter(e=>e.getClientRects().length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const colors=visibleText.filter(e=>!e.closest('.ic-report-cover')).map(e=>({tag:e.className||e.tagName,text:e.textContent.slice(0,60),ratio:ratio(rgb(getComputedStyle(e).color),bg(e))}));
    const mix=(a,b,w)=>a.map((v,i)=>i<3?v*(1-w)+b[i]*w:v);
    // Cover artwork stays outside the text column (on phones it fades above the headline).
    // Check every text color against both gradient endpoints; KPI cards against paper and tint.
    for(const e of visibleText){
     const cover=e.closest('.ic-report-cover'),tile=e.closest('.ic-report-kpi');
     if(cover){const st=getComputedStyle(cover);for(const token of ['--cover-start','--cover-end']){
      const ink=rgb(getComputedStyle(e).color),endpoint=rgb(st.getPropertyValue(token));
      colors.push({tag:'cover '+token,text:e.textContent.slice(0,60),ratio:ratio(ink,endpoint)});
      const art=cover.querySelector('img'),a=art.getBoundingClientRect(),t=e.getBoundingClientRect();
      if(t.right>a.left&&t.left<a.right&&t.bottom>a.top&&t.top<a.bottom)colors.push({tag:'art worst white pixel '+token,text:e.textContent.slice(0,60),ratio:ratio(ink,mix(endpoint,[255,255,255,255],Number(getComputedStyle(art).opacity)))});
     }}
     if(tile){const st=getComputedStyle(tile),paper=rgb(st.getPropertyValue('--report-paper')),tone=rgb(st.getPropertyValue('--kpi-accent'));colors.push({tag:'tile gradient',text:e.textContent.slice(0,60),ratio:ratio(rgb(getComputedStyle(e).color),mix(paper,tone,.06))});}
    }
    return {overflow:document.documentElement.scrollWidth>innerWidth,reportOverflow:el.scrollWidth>el.clientWidth+1,colors,positions:[...el.querySelectorAll('[data-range-point]')].map(e=>parseFloat(e.style.left))};
   });
   assert.equal(visual.overflow,false);assert.equal(visual.reportOverflow,false);
   assert.deepEqual(await report.evaluate(el=>[...el.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect(),p=el.getBoundingClientRect();return r.width>0&&(r.left<p.left-1||r.right>p.right+1);}).map(e=>e.className)),[],'no child overflow');
   assert.ok(visual.positions.every(v=>v>=0&&v<=100));
   assert.deepEqual(visual.colors.filter(c=>c.ratio<4.5),[],'AA text contrast');
   await report.screenshot({path:path.join(out,`confirmed-${width}-${finish}.png`),style:screenshotStyle});
   // A real assigned role keeps the table; meaningful frozen themes survive the compact empty state.
   await page.evaluate(()=>{
    const s=state.investmentCommitteeSnapshots.find(s=>s.id==='report-rev-2');
    s.portfolioSummary={roles:[{role:'핵심 보유',securities:[s.securitySnapshots[0]]}],themes:[],overlapWarnings:[]};HaniInvestmentCommittee.render();
   });
   assert.equal(await report.locator('.ic-role-table').count(),1);assert.match(await report.locator('.ic-role-table').innerText(),/핵심 보유/);
   await page.evaluate(()=>{
    const s=state.investmentCommitteeSnapshots.find(s=>s.id==='report-rev-2');
    s.portfolioSummary={roles:[{role:'역할 미지정',securities:s.securitySnapshots}],themes:[{theme:'공통 성장',securities:s.securitySnapshots.slice(0,3)}],overlapWarnings:[]};
    s.securitySnapshots[0].rating='BUY';HaniInvestmentCommittee.render();
   });
   assert.equal(await report.locator('.ic-role-table').count(),0);
   assert.match(await report.locator('.ic-theme-list').innerText(),/공통 성장/);
   assert.equal(await report.locator('[data-report-rating="BUY"]').innerText(),'2');
   assert.equal(await report.locator('[data-report-rating="BUY"]').evaluate(e=>e.style.width),'40%');
   assert.equal(await report.locator('[data-report-rating="STRONG BUY"]').count(),0);
   assert.equal(await report.locator('.ic-report-rating-track').evaluate(e=>e.scrollWidth>e.clientWidth),false);
   await page.evaluate(({base})=>{const s=state.investmentCommitteeSnapshots.find(s=>s.id==='report-rev-2');delete s.portfolioSummary;s.securitySnapshots=structuredClone(base.securitySnapshots);HaniInvestmentCommittee.render();},{base});
   await report.locator('[data-monthly="revision"]').first().click();assert.match(await report.locator('.ic-report-seal').innerText(),/수정본 1/);
   await report.locator('[data-monthly="latest"]').click();assert.match(await report.locator('.ic-report-seal').innerText(),/수정본 2/);
   await report.locator('[data-monthly="history"]').first().click();assert.equal(await page.locator('.ic-editor').evaluate(e=>e.open),true);
   await page.locator('.ic-editor [data-ic="close"]').first().click();
   assert.equal(await page.evaluate(()=>reportPersists),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)===reportBefore),true);
   await page.locator('[data-ic-section]').nth(1).click();
   await page.locator('[data-monthly="revise"]').click();assert.equal(await page.locator('.ic-monthly-board form').count(),1);
   await page.locator('[name="executiveSummary"]').fill('편집 가능한 초안');await page.locator('[data-monthly="cancel"]').click();
   assert.equal(await page.evaluate(()=>reportPersists),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)===reportBefore),true);
   await page.emulateMedia({media:'print'});
   assert.equal(await report.locator('button:visible').count(),0);
   assert.equal(await report.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
   assert.equal(await report.locator('.ic-snapshot-security').first().evaluate(e=>getComputedStyle(e).breakInside),'avoid');
   if(width===1440)await report.screenshot({path:path.join(out,`print-${finish}.png`),style:screenshotStyle});
   await page.emulateMedia({media:'screen'});
   await page.evaluate(()=>{
    const s=state.investmentCommitteeSnapshots.find(s=>s.id==='report-rev-2');
    delete s.portfolioRating;delete s.holdingsRefs;delete s.portfolioSummary;s.securitySnapshots=[{id:'minimal',name:'선택 정보 없는 종목',ticker:'NONE',rating:'HOLD',kind:'research'}];
    state.investmentCommitteeSnapshots=state.investmentCommitteeSnapshots.filter(s=>s.reviewMonth==='2026-10');HaniInvestmentCommittee.render();window.reportBefore=JSON.stringify(state);
   });
   assert.deepEqual(await report.locator('[data-report-kpi]').evaluateAll(es=>es.map(e=>e.dataset.reportKpi)),['stocks']);
   assert.equal(await report.locator('.ic-report-range,.ic-report-conviction').count(),0);
   assert.equal(await report.locator('[data-report-rating="HOLD"]').getAttribute('data-count'),'1');
   assert.equal(await report.locator('[data-report-rating="HOLD"]').innerText(),'1');
   assert.equal(await report.locator('[data-report-rating="HOLD"]').evaluate(e=>e.style.width),'100%');
   assert.equal(await report.locator('.ic-role-table').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await report.screenshot({path:path.join(out,`minimal-${width}-${finish}.png`),style:screenshotStyle});
   assert.equal(await page.evaluate(()=>reportPersists),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)===reportBefore),true);assert.deepEqual(errors,[]);
   results.push({width,finish,kpiColumns:layout.columns,kpiEqualHeights:true,monthSingleLine:true,coverHeadlineMeta:true,roleTableHidden:true,distributionCounts:true,minContrast:Math.min(...visual.colors.map(c=>c.ratio)),overflow:false,persistCalls:0});
   console.log('PASS confirmed/minimal snapshot, KPI/AA/range/revisions/editor/print/no writes '+width+'/'+finish);
   await context.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}else console.log('Browser QA not run: supply Playwright module and browser executable arguments.');
