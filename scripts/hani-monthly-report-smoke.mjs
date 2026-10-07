import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require=createRequire(import.meta.url);
const { chromium }=require('playwright');
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer((request,response)=>{const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname),relative=pathname==='/'?'index.html':pathname.replace(/^\/+/,''),file=normalize(join(root,relative));if(!file.startsWith(root)||!existsSync(file)||!statSync(file).isFile()){response.writeHead(404);response.end('Not found');return}response.writeHead(200,{'Content-Type':types[extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});createReadStream(file).pipe(response)});
await new Promise(resolveReady=>server.listen(0,'127.0.0.1',resolveReady));
const port=server.address().port;
const seed={
  version:'2.9.15-safe-baseline-bootstrap',accounts:[],instruments:[],transactions:[],snapshots:[],investmentMonthlySnapshots:[],investmentCashFlows:[],investmentJournal:[],investmentWatchlist:[],spendReviews:[],diaries:[],tasks:[],campusSemesters:[],travelTrips:[],travelPlaces:[],travelWishlist:[],certificates:[],wishlistItems:[],learningProjects:[],learningQuizzes:[],learningWrongAnswers:[],calendarUrl:'',pageNotes:{},meta:{},profile:{heightCm:188},goals:{investment:100000000,weight1:110,weight2:100,reading:30,readingAnnual:30,readingMonthly:2},ui:{},
  investmentBrokerSnapshots:[
    {id:'aug',mode:'actual',period:'2026-08',snapshotDate:'2026-08-31',status:'confirmed',accounts:[{id:'a1',accountId:'isa',accountName:'ISA',enabled:true,estimatedAssets:90000000,totalEvaluation:90000000,totalPurchase:80000000,totalPnl:10000000,totalReturn:12.5,holdings:[]}],updatedAt:'2026-08-31T09:00:00Z'},
    {id:'sep',mode:'actual',period:'2026-09',snapshotDate:'2026-09-30',status:'confirmed',accounts:[{id:'a2',accountId:'isa',accountName:'ISA',enabled:true,estimatedAssets:100000000,totalEvaluation:100000000,totalPurchase:85000000,totalPnl:15000000,totalReturn:17.6,holdings:[]}],updatedAt:'2026-09-30T09:00:00Z'}
  ],
  ledgerMonths:[
    {id:'l-aug',month:'2026-08',items:[{id:'la',date:'2026-08-01',content:'생활비',amount:1000000,category:'variable',reimbursement:0}]},
    {id:'l-sep',month:'2026-09',items:[{id:'lb',date:'2026-09-01',content:'월세',amount:1200000,category:'fixed',reimbursement:0},{id:'lc',date:'2026-09-02',content:'식비',amount:300000,category:'variable',reimbursement:0}]}
  ],
  body:[{id:'b1',date:'2026-09-01',weight:101},{id:'b2',date:'2026-09-30',weight:99.5}],
  exercise:[{id:'e1',date:'2026-09-03',steps:8000,distance:6},{id:'e2',date:'2026-09-04',steps:12000,distance:9},{id:'e3',date:'2026-09-05',steps:0,strength:true}],
  books:[{id:'book',status:'read',title:'테스트 책',completedDate:'2026-09-12',rating:4.5}],
  movies:[{id:'movie',status:'watched',contentType:'드라마',title:'테스트 시리즈',review:'시즌 1 · 12화까지',watchedDate:'2026-09-15',rating:4}]
};
seed.learningQuizzes=[{id:'q1',status:'completed',completedAt:'2026-08-31T15:00:00Z',total:10,correctCount:10},{id:'q2',status:'completed',completedAt:'2026-09-10T12:00:00Z',total:30,correctCount:15}];

const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
async function verifiedSyntheticContext(page){await page.evaluate(()=>{goalPeriodReadContext=()=>({source:structuredClone(state),asOf:'2026-10-01',evaluationAt:'2026-10-01T12:00:00Z',canonical:{brokerTotal:row=>brokerCalc(row).total,ledgerSpending:row=>ledgerCalc(row).jispiT}})})}
try{
  for(const viewport of [{width:1440,height:1000,name:'desktop'},{width:390,height:844,name:'mobile'}]){
    const page=await browser.newPage({viewport}),errors=[];
    await page.route('**/*',route=>new URL(route.request().url()).origin===`http://127.0.0.1:${port}`?route.continue():route.abort());
    await page.clock.install({time:new Date('2026-10-01T12:00:00Z')});
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
    await page.addInitScript(value=>{if(!sessionStorage.getItem('monthlySmokeSeeded')){localStorage.setItem('hani_os_life_v23',JSON.stringify(value));sessionStorage.setItem('monthlySmokeSeeded','1')}},seed);
    await page.goto(`http://127.0.0.1:${port}/#monthlyReport`,{waitUntil:'load'});
    await page.evaluate(()=>{document.querySelector('#loginGate')?.style.setProperty('display','none','important');document.querySelector('#app')?.classList.remove('login-locked');document.querySelector('#app')?.setAttribute('aria-hidden','false')});
    await page.waitForTimeout(450);
    await verifiedSyntheticContext(page);
    const labels=await page.locator('.office-group .group-body .nav-btn .txt').allTextContents();
    assert.deepEqual(labels.slice(0,4),['인포데스크','경영회의실','라이프 리포트','사내 규칙'],`${viewport.name}: report office IA order`);
    assert(await page.locator('#monthlyReport.view.active').count(),`${viewport.name}: monthly route active`);
    assert(await page.locator('#monthlyReportKpis').isHidden(),`${viewport.name}: no live dashboard before manual generation`);
    assert(await page.locator('#monthlyReportGenerateBtn').isEnabled(),`${viewport.name}: closed month can be generated`);
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_life_v23')))).monthlyReports,undefined,`${viewport.name}: viewing does not create archives`);
    await page.locator('#monthlyReportGenerateBtn').click();
    assert((await page.locator('#monthlyReport').innerText()).includes('100,000,000 원'),`${viewport.name}: investment total`);
    assert((await page.locator('#monthlyReport').innerText()).includes('1,500,000 원'),`${viewport.name}: ledger total`);
    assert((await page.locator('#monthlyReport').innerText()).includes('99.5 kg'),`${viewport.name}: latest canonical body measurement`);
    assert((await page.locator('#monthlyReport').innerText()).includes('10,000 보/일'),`${viewport.name}: steps average`);
    const reportText=await page.locator('#monthlyReport').innerText();
    const typography=await page.locator('.monthly-report-domain').first().evaluate(card=>({comment:parseFloat(getComputedStyle(card.querySelector('.monthly-report-speech p')).fontSize),headline:parseFloat(getComputedStyle(card.querySelector('.monthly-report-takeaway strong')).fontSize),color:getComputedStyle(card.querySelector('.monthly-report-takeaway strong')).color}));
    assert(typography.comment>=18&&typography.headline>=26,`${viewport.name}: readable presenter typography`);
    assert.notEqual(typography.color,'rgb(245, 247, 255)',`${viewport.name}: domain-colored headline emphasis`);
    for(const text of ['1 편','62.5 %','월간 목표를 임의 생성하지 않음','월간 핵심','집계 기준'])assert(reportText.includes(text),`${viewport.name}: ${text}`);
    assert(reportText.includes('같은 원본·집계 기준'),`${viewport.name}: common monthly calculation basis`);
    assert(!reportText.includes('미입력·0보는 평균에서 제외합니다'),`${viewport.name}: calculation note remains collapsed`);
    await page.locator('.tone-money .monthly-report-basis summary').click();
    assert((await page.locator('.tone-money .monthly-report-basis').innerText()).includes('2026-08-18 ~ 2026-09-17'),`${viewport.name}: settlement basis opens`);
    await page.locator('.tone-money .monthly-report-basis summary').click();
    const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_life_v23')));
    assert.equal(first.monthlyReports.length,1,`${viewport.name}: one persisted report`);
    assert(await page.evaluate(()=>cloudSyncSelfTest()),`${viewport.name}: existing Cloud sync safety decisions remain valid`);
    assert(await page.evaluate(()=>cloudHasMeaningfulLocalData({monthlyReports:[{month:'2026-09',view:{}}]})),`${viewport.name}: archive-only data is preserved as meaningful local data`);
    assert(await page.evaluate(()=>{const full=JSON.parse(localStorage.getItem('hani_os_life_v23')),without=structuredClone(full);delete without.monthlyReports;return !cloudSame(cloudSyncFingerprintState(full),cloudSyncFingerprintState(without))}),`${viewport.name}: report archive participates in Cloud conflict fingerprint`);
    assert.deepEqual(first.body.map(({id,date,weight})=>({id,date,weight})),seed.body,`${viewport.name}: source body values unchanged`);
    assert.deepEqual(first.books,seed.books,`${viewport.name}: source books unchanged`);
    await page.reload({waitUntil:'load'});
    await page.evaluate(()=>{document.querySelector('#loginGate')?.style.setProperty('display','none','important');document.querySelector('#app')?.classList.remove('login-locked');document.querySelector('#app')?.setAttribute('aria-hidden','false')});
    await page.waitForTimeout(300);
    await verifiedSyntheticContext(page);
    const reloadedText=await page.locator('#monthlyReport').innerText();
    assert(reloadedText.includes('100,000,000 원'),`${viewport.name}: archived report survives reload`);
    const reportBeforeSourceChange=await page.locator('#monthlyReportDomains').innerText();
    await page.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('hani_os_life_v23'));raw.body.find(row=>row.id==='b2').weight=95;localStorage.setItem('hani_os_life_v23',JSON.stringify(raw))});
    await page.reload({waitUntil:'load'});
    await page.evaluate(()=>{document.querySelector('#loginGate')?.style.setProperty('display','none','important');document.querySelector('#app')?.classList.remove('login-locked');document.querySelector('#app')?.setAttribute('aria-hidden','false')});
    await page.waitForTimeout(300);
    await verifiedSyntheticContext(page);
    assert.equal(await page.locator('#monthlyReportDomains').innerText(),reportBeforeSourceChange,`${viewport.name}: archive is immutable until explicit regeneration`);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#monthlyReportGenerateBtn').click();
    assert((await page.locator('#monthlyReport').innerText()).includes('95 kg'),`${viewport.name}: confirmed regeneration uses amended source`);
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_life_v23')))).monthlyReports.length,1,`${viewport.name}: regeneration replaces only same month`);
    await page.locator('#monthlyReportMonth').fill('2026-08');await page.locator('#monthlyReportMonth').dispatchEvent('change');
    await page.locator('#monthlyReportGenerateBtn').click();
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_life_v23')))).monthlyReports.length,2,`${viewport.name}: older month accumulates`);
    await page.locator('[data-monthly-archive="2026-09"]').click();
    assert((await page.locator('#monthlyReport').innerText()).includes('95 kg'),`${viewport.name}: archive navigation restores September`);
    const beforeFailedSave=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    await page.evaluate(()=>{window.monthlySmokeSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='hani_os_life_v23')throw new DOMException('monthly-smoke-forced-failure','QuotaExceededError');return window.monthlySmokeSetItem.call(this,key,value)}});
    const acceptFailure=dialog=>dialog.accept();page.on('dialog',acceptFailure);
    await page.locator('#monthlyReportGenerateBtn').click();
    page.off('dialog',acceptFailure);
    await page.evaluate(()=>{Storage.prototype.setItem=window.monthlySmokeSetItem;delete window.monthlySmokeSetItem});
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),beforeFailedSave,`${viewport.name}: failed save preserves existing reports`);
    assert((await page.locator('#monthlyReport').innerText()).includes('95 kg'),`${viewport.name}: failed save keeps old report visible`);
    await page.evaluate(()=>{document.querySelector('#haniContextRemote')?.style.setProperty('display','none','important');document.querySelector('.hani-remote-mobile-trigger')?.style.setProperty('display','none','important')});
    mkdirSync(join(root,'artifacts/monthly-report'),{recursive:true});
    await page.locator('[data-report-board="quarterly"]').click();
    assert(await page.locator('#monthlyReportQuarterlyPanel').isVisible(),`${viewport.name}: quarterly preview board`);
    assert((await page.locator('#monthlyReportQuarterlyPanel').innerText()).includes('분기 목표·실적은 위 공통 계산'),`${viewport.name}: quarterly honest state`);
    await page.locator('#monthlyReport').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-quarterly.png`)});
    await page.locator('[data-report-board="annual"]').click();
    assert(await page.locator('#monthlyReportAnnualPanel').isVisible(),`${viewport.name}: annual preview board`);
    assert((await page.locator('#monthlyReportAnnualPanel').innerText()).includes('연간 목표·실적은 위 공통 계산'),`${viewport.name}: annual honest state`);
    await page.locator('#monthlyReport').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-annual.png`)});
    await page.locator('[data-report-board="monthly"]').click();
    await page.locator('#monthlyReport').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}.png`)});
    const before=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    await page.locator('#monthlyReportMonth').fill('2026-07');await page.locator('#monthlyReportMonth').dispatchEvent('change');await page.waitForTimeout(80);
    const after=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    assert.equal(after,before,`${viewport.name}: month selection never writes canonical storage`);
    assert(await page.locator('#monthlyReportGenerateBtn').isDisabled(),`${viewport.name}: no-data month cannot generate`);
    await page.locator('#monthlyReportMonth').fill('2026-10');await page.locator('#monthlyReportMonth').dispatchEvent('change');
    assert(await page.locator('#monthlyReportGenerateBtn').isDisabled(),`${viewport.name}: current month cannot generate`);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.equal(overflow,0,`${viewport.name}: no horizontal overflow`);
    const actionable=[...new Set(errors)].filter(error=>!error.includes('ERR_NETWORK_ACCESS_DENIED')&&!error.includes('ERR_CONNECTION_REFUSED')&&!error.includes('ERR_FAILED')&&!error.includes('Supabase JS를 불러오지 못했습니다')&&!error.includes('monthly-smoke-forced-failure'));assert.deepEqual(actionable,[],`${viewport.name}: console errors`);
    await page.close();
  }
  console.log(JSON.stringify({state:'PASS',checks:['manual closed-month gate','persisted snapshot','source preservation','explicit regeneration','historical accumulation','save failure rollback','no-data/current-month gate','desktop/mobile overflow']},null,2));
}finally{await browser.close();await new Promise(resolveClosed=>server.close(resolveClosed))}
