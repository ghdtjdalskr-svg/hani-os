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
try{
  for(const viewport of [{width:1440,height:1000,name:'desktop'},{width:390,height:844,name:'mobile'}]){
    const page=await browser.newPage({viewport}),errors=[];
    await page.clock.install({time:new Date('2026-09-30T12:00:00Z')});
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
    await page.addInitScript(value=>localStorage.setItem('hani_os_life_v23',JSON.stringify(value)),seed);
    await page.goto(`http://127.0.0.1:${port}/#monthlyReport`,{waitUntil:'load'});
    await page.evaluate(()=>{document.querySelector('#loginGate')?.style.setProperty('display','none','important');document.querySelector('#app')?.classList.remove('login-locked');document.querySelector('#app')?.setAttribute('aria-hidden','false')});
    await page.waitForTimeout(450);
    const labels=await page.locator('.office-group .group-body .nav-btn .txt').allTextContents();
    assert.deepEqual(labels.slice(0,5),['인포데스크','경영회의실','월간 보고','사내 규칙','배포 센터'],`${viewport.name}: office IA order`);
    assert(await page.locator('#monthlyReport.view.active').count(),`${viewport.name}: monthly route active`);
    assert((await page.locator('#monthlyReport').innerText()).includes('100,000,000원'),`${viewport.name}: investment total`);
    assert((await page.locator('#monthlyReport').innerText()).includes('1,500,000원'),`${viewport.name}: ledger total`);
    assert((await page.locator('#monthlyReport').innerText()).includes('-1.50kg'),`${viewport.name}: body delta`);
    assert((await page.locator('#monthlyReport').innerText()).includes('10,000보'),`${viewport.name}: steps average`);
    const reportText=await page.locator('#monthlyReport').innerText();
    for(const text of ['시청 기록 1건','첫 측정 대비','62.5%','2026-08-18 ~ 2026-09-17','당시 목표 미보관'])assert(reportText.includes(text),`${viewport.name}: ${text}`);
    await page.evaluate(()=>{document.querySelector('#haniContextRemote')?.style.setProperty('display','none','important');document.querySelector('.hani-remote-mobile-trigger')?.style.setProperty('display','none','important')});
    mkdirSync(join(root,'artifacts/monthly-report'),{recursive:true});
    await page.locator('[data-report-board="quarterly"]').click();
    assert(await page.locator('#monthlyReportQuarterlyPanel').isVisible(),`${viewport.name}: quarterly preview board`);
    assert((await page.locator('#monthlyReportQuarterlyPanel').innerText()).includes('분기 집계는 아직 연결하지 않았습니다'),`${viewport.name}: quarterly honest state`);
    await page.locator('#monthlyReport').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-quarterly.png`)});
    await page.locator('[data-report-board="annual"]').click();
    assert(await page.locator('#monthlyReportAnnualPanel').isVisible(),`${viewport.name}: annual preview board`);
    assert((await page.locator('#monthlyReportAnnualPanel').innerText()).includes('아직 연간 판정·목표 달성 집계는 제공하지 않습니다'),`${viewport.name}: annual honest state`);
    await page.locator('#monthlyReport').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-annual.png`)});
    await page.locator('[data-report-board="monthly"]').click();
    await page.locator('#monthlyReport').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}.png`)});
    const before=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    await page.locator('#monthlyReportMonth').fill('2026-07');await page.locator('#monthlyReportMonth').dispatchEvent('change');await page.waitForTimeout(80);
    const after=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    assert.equal(after,before,`${viewport.name}: month selection never writes canonical storage`);
    assert((await page.locator('#monthlyReport').innerText()).includes('기록 없음'),`${viewport.name}: honest empty state`);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.equal(overflow,0,`${viewport.name}: no horizontal overflow`);
    const actionable=[...new Set(errors)].filter(error=>!error.includes('ERR_NETWORK_ACCESS_DENIED')&&!error.includes('ERR_CONNECTION_REFUSED')&&!error.includes('Supabase JS를 불러오지 못했습니다'));assert.deepEqual(actionable,[],`${viewport.name}: console errors`);
    await page.close();
  }
  console.log(JSON.stringify({state:'PASS',checks:['office IA','monthly totals','empty state','read-only storage','desktop/mobile overflow']},null,2));
}finally{await browser.close();await new Promise(resolveClosed=>server.close(resolveClosed))}
