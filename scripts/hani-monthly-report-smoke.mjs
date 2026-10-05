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
    await page.clock.install({time:new Date('2026-10-01T12:00:00Z')});
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('response',response=>{if(response.status()>=400)console.log(`HTTP ${response.status()} ${new URL(response.url()).pathname}`)});
    await page.addInitScript(value=>{if(!sessionStorage.getItem('monthlySmokeSeeded')){localStorage.setItem('hani_os_life_v23',JSON.stringify(value));sessionStorage.setItem('monthlySmokeSeeded','1')}},seed);
    await page.goto(`http://127.0.0.1:${port}/#monthlyReport`,{waitUntil:'load'});
    await page.evaluate(()=>{document.querySelector('#loginGate')?.style.setProperty('display','none','important');document.querySelector('#app')?.classList.remove('login-locked');document.querySelector('#app')?.setAttribute('aria-hidden','false')});
    await page.waitForTimeout(450);
    const labels=await page.locator('.office-group .group-body .nav-btn .txt').allTextContents();
    assert.deepEqual(labels.slice(0,4),['인포데스크','경영회의실','컨퍼런스 룸','사내 규칙'],`${viewport.name}: report remains in office IA`);
    assert(await page.locator('#monthlyReport.view.active').count(),`${viewport.name}: monthly route active`);
    assert(await page.locator('#monthlyReportKpis').isHidden(),`${viewport.name}: no live dashboard before manual generation`);
    assert(await page.locator('#monthlyReportGenerateBtn').isEnabled(),`${viewport.name}: closed month can be generated`);
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_life_v23')))).monthlyReports,undefined,`${viewport.name}: viewing does not create archives`);
    await page.locator('#monthlyReportGenerateBtn').click();
    assert((await page.locator('#monthlyReport').innerText()).includes('100,000,000원'),`${viewport.name}: investment total`);
    assert((await page.locator('#monthlyReport').innerText()).includes('1,500,000원'),`${viewport.name}: ledger total`);
    assert((await page.locator('#monthlyReport').innerText()).includes('-1.50kg'),`${viewport.name}: body delta`);
    assert((await page.locator('#monthlyReport').innerText()).includes('10,000보'),`${viewport.name}: steps average`);
    const reportText=await page.locator('#monthlyReport').innerText();
    const typography=await page.locator('.monthly-report-domain').first().evaluate(card=>({comment:parseFloat(getComputedStyle(card.querySelector('.monthly-report-speech p')).fontSize),headline:parseFloat(getComputedStyle(card.querySelector('.monthly-report-takeaway strong')).fontSize),color:getComputedStyle(card.querySelector('.monthly-report-takeaway strong')).color}));
    assert(typography.comment>=18&&typography.headline>=26,`${viewport.name}: readable presenter typography`);
    assert.notEqual(typography.color,'rgb(245, 247, 255)',`${viewport.name}: domain-colored headline emphasis`);
    for(const text of ['시청 기록 1건','첫 측정 대비','62.5%','당시 목표 미보관','월간 핵심','집계 기준'])assert(reportText.includes(text),`${viewport.name}: ${text}`);
    assert(reportText.includes('40문항 중 25문항 정답이라 62.5%야'),`${viewport.name}: HINA interprets the verified result in character`);
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
    const reloadedText=await page.locator('#monthlyReport').innerText();
    assert(reloadedText.includes('100,000,000원'),`${viewport.name}: archived report survives reload`);
    const reportBeforeSourceChange=await page.locator('#monthlyReportDomains').innerText();
    await page.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('hani_os_life_v23'));raw.body.find(row=>row.id==='b2').weight=95;localStorage.setItem('hani_os_life_v23',JSON.stringify(raw))});
    await page.reload({waitUntil:'load'});
    await page.evaluate(()=>{document.querySelector('#loginGate')?.style.setProperty('display','none','important');document.querySelector('#app')?.classList.remove('login-locked');document.querySelector('#app')?.setAttribute('aria-hidden','false')});
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#monthlyReportDomains').innerText(),reportBeforeSourceChange,`${viewport.name}: archive is immutable until explicit regeneration`);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#monthlyReportGenerateBtn').click();
    assert((await page.locator('#monthlyReport').innerText()).includes('-6.00kg'),`${viewport.name}: confirmed regeneration uses amended source`);
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_life_v23')))).monthlyReports.length,1,`${viewport.name}: regeneration replaces only same month`);
    await page.locator('#monthlyReportMonth').fill('2026-08');await page.locator('#monthlyReportMonth').dispatchEvent('change');
    await page.locator('#monthlyReportGenerateBtn').click();
    assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_life_v23')))).monthlyReports.length,2,`${viewport.name}: older month accumulates`);
    await page.locator('[data-monthly-archive="2026-09"]').click();
    assert((await page.locator('#monthlyReport').innerText()).includes('-6.00kg'),`${viewport.name}: archive navigation restores September`);
    const beforeFailedSave=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    await page.evaluate(()=>{window.monthlySmokeSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='hani_os_life_v23')throw new DOMException('monthly-smoke-forced-failure','QuotaExceededError');return window.monthlySmokeSetItem.call(this,key,value)}});
    const acceptFailure=dialog=>dialog.accept();page.on('dialog',acceptFailure);
    await page.locator('#monthlyReportGenerateBtn').click();
    page.off('dialog',acceptFailure);
    await page.evaluate(()=>{Storage.prototype.setItem=window.monthlySmokeSetItem;delete window.monthlySmokeSetItem});
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),beforeFailedSave,`${viewport.name}: failed save preserves existing reports`);
    assert((await page.locator('#monthlyReport').innerText()).includes('-6.00kg'),`${viewport.name}: failed save keeps old report visible`);
    await page.evaluate(()=>{document.querySelector('#haniContextRemote')?.style.setProperty('display','none','important');document.querySelector('.hani-remote-mobile-trigger')?.style.setProperty('display','none','important')});
    mkdirSync(join(root,'artifacts/monthly-report'),{recursive:true});
    await page.locator('[data-report-board="quarterly"]').click();
    assert.equal(await page.locator('.nav-btn[data-view="monthlyReport"] .txt').innerText(),'컨퍼런스 룸',`${viewport.name}: conference room navigation label`);
    assert(await page.locator('#monthlyReportQuarterlyPanel').isVisible(),`${viewport.name}: quarterly preview board`);
    assert((await page.locator('#monthlyReportQuarterlyPanel').innerText()).includes('우리의 실적'),`${viewport.name}: quarterly report connected`);
    assert.equal(await page.locator('#earningsQuarterly [data-call-scene]').count(),10,`${viewport.name}: ten presenter scenes`);
    for(const key of ['overview','finance','health','learning','reading','culture','outlook','plan','qa'])assert.equal(await page.locator(`#earningsQuarterly [data-call-scene="${key}"]`).count(),1,`${viewport.name}: ${key} scene`);
    assert.equal(await page.locator('#earningsQuarterly [data-call-scene=learning] img').getAttribute('alt'),'히나');
    assert.equal(await page.locator('#earningsQuarterly [data-call-scene=finance] .earnings-call-track em').count(),1,`${viewport.name}: missing month is unknown`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${viewport.name}: quarterly has no page overflow`);
    assert.equal(await page.locator('#earningsQuarterly .scene-finance .earnings-keynote-line').evaluate(el=>parseInt(getComputedStyle(el).fontSize)),viewport.name==='mobile'?28:34,`${viewport.name}: keynote typography`);
    for(const key of ['opening','overview','health','learning','reading','culture','outlook','qa'])await page.locator(`#earningsQuarterly [data-call-scene="${key}"]`).screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-${key}-scene.png`)});
    await page.locator('#earningsQuarterly [data-call-scene=finance]').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-finance-scene.png`)});
    await page.locator('#earningsQuarterly [data-call-scene=plan]').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-plan-scene.png`)});
    const beforeEarnings=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    const quarterly=await page.evaluate(()=>earningsAggregate('quarterly','2026-Q3','2026-10-01'));
    assert.equal(quarterly.quizTotal,40);assert.equal(quarterly.quizCorrect,25);assert.equal(quarterly.accuracy,62.5);
    assert.equal(quarterly.end,100000000);assert.equal(quarterly.start,null);assert.equal(quarterly.coverage,2);assert.equal(quarterly.spend,2500000);
    const missing=await page.evaluate(()=>earningsAggregate('quarterly','2026-Q1','2026-10-01'));assert.equal(missing.records,0);assert.equal(missing.spend,null);assert.equal(missing.end,null);
    assert.deepEqual(await page.evaluate(()=>earningsMonths('quarterly','2026-Q5')),[]);
    await page.locator('#earningsQuarterly [data-earnings-context]').fill('올해 감량 목표 달성. 다음에는 유지가 우선이야.');
    await page.locator('#earningsQuarterly [data-earnings-question]').fill('다음 목표는?');await page.locator('#earningsQuarterly button[type="submit"]').click();
    assert((await page.locator('#earningsQuarterly').innerText()).includes('Cloud 로그인'),`${viewport.name}: no fake AI offline`);
    assert.equal(await page.locator('#earningsQuarterly [data-earnings-question]').inputValue(),'다음 목표는?',`${viewport.name}: failed question retained`);
    await page.evaluate(()=>{window.earningsTestOldClient=cloudClient;window.earningsTestOldUser=cloudUser;cloudUser={id:'earnings-fixture'};cloudClient={auth:{getSession:async()=>({data:{session:{access_token:'fixture-only'}}})}};earningsRender('quarterly','2026-Q3')});
    let captured;
    await page.route('**/functions/v1/hani-earnings-dialogue',route=>{captured=route.request().postDataJSON();return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,answer:'現在の状況を確認しましょう。 <script>unsafe()</script>',guidance:['추가 감량 대신 유지 가능성을 먼저 확인합니다.']})})});
    await page.locator('#earningsQuarterly [data-earnings-context]').fill('내년에는 유지');await page.locator('#earningsQuarterly [data-earnings-question]').fill('다음 목표는?');await page.locator('#earningsQuarterly button[type="submit"]').click();await page.locator('#earningsQuarterly .earnings-messages').getByText('대표님',{exact:true}).waitFor();
    assert.equal(captured.context,'내년에는 유지');assert.equal(captured.summary.rows,undefined);assert.equal(captured.question,'다음 목표는?');assert.equal(await page.locator('#earningsQuarterly script').count(),0);assert((await page.locator('#earningsQuarterly').innerText()).includes('유지 가능성'));
    const readableAnswer=await page.evaluate(()=>{
      const answer='이 답변은 화면 검사용 합성 문장입니다. 확인된 학습 정답률은 62.5%이며 실제 문항 수를 기준으로 계산했습니다. '+ '담당자별 성과와 확인하지 못한 부분을 구분하여 이야기합니다. 원본 수치를 그대로 유지하고 빈 기록을 실패로 해석하지 않습니다. '.repeat(4)+'<script>unsafe()</script> 다음 목표는 미확정 제안이며 자동 저장하지 않습니다.';
      earningsDraft('quarterly','2026-Q3').answer=answer;earningsRender('quarterly','2026-Q3');
      const node=document.querySelector('.scene-qa .earnings-call-answer'),style=getComputedStyle(node);
      return {same:node.textContent.replace(/\s+/g,'')===answer.replace(/\s+/g,''),paragraphs:node.querySelectorAll('p').length,font:parseFloat(style.fontSize),align:style.textAlign,scripts:node.querySelectorAll('script').length};
    });
    assert(readableAnswer.same&&readableAnswer.paragraphs>=3&&readableAnswer.scripts===0,`${viewport.name}: Q&A paragraph grouping preserves content and escapes markup`);
    assert.equal(readableAnswer.font,viewport.name==='mobile'?18:20);assert.equal(readableAnswer.align,'left');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${viewport.name}: long Q&A no page overflow`);
    await page.locator('#earningsQuarterly .scene-qa').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-qa-readable.png`)});
    await page.evaluate(()=>{cloudUser={id:'different-fixture'};earningsRender('quarterly','2026-Q3')});assert.equal(await page.locator('#earningsQuarterly .earnings-messages p').count(),0,`${viewport.name}: owner separation`);
    await page.evaluate(()=>{cloudClient=window.earningsTestOldClient;cloudUser=window.earningsTestOldUser;delete window.earningsTestOldClient;delete window.earningsTestOldUser;earningsRender('quarterly','2026-Q3')});
    const downloadPromise=page.waitForEvent('download');await page.locator('#earningsQuarterly [data-earnings-ppt]').click();const download=await downloadPromise;assert(download.suggestedFilename().endsWith('.pptx'));await download.saveAs(join(root,`artifacts/monthly-report/${viewport.name}-earnings.pptx`));
    const pptContent=await page.evaluate(async()=>{
      const r=earningsAggregate('quarterly','2026-Q3','2026-10-01');
      const d={context:'',answer:'긴 답변의 마지막 확인 문장입니다. '.repeat(90)+'답변 끝 확인',guidance:['미확정 전망 끝 확인']};
      const content=new TextDecoder().decode(await (await earningsPptx(r,d)).arrayBuffer());
      const xmlEscape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      return {titles:earningsCallProgramme(r,d).scenes.map((scene,index)=>content.includes(xmlEscape(`${String(index+1).padStart(2,'0')} · ${scene.name} · ${scene.title}`))),metrics:['100,000,000원','2,500,000원','25/40문항','62.5%'].map(value=>content.includes(value)),unknown:content.includes('미확인'),longAnswer:content.includes('답변 끝 확인'),guidance:content.includes('미확정 전망 끝 확인'),images:content.includes('image/jpeg')&&content.includes('ppt/media/image2.jpg'),resolved:!content.includes('{{TITLE}}')&&!content.includes('{{P00}}')};
    });
    assert(pptContent.titles.every(Boolean),`${viewport.name}: PPT shares all ten web presenter titles`);
    assert(pptContent.metrics.every(Boolean),`${viewport.name}: PPT includes six-metric overview facts`);
    assert(pptContent.unknown&&pptContent.longAnswer&&pptContent.guidance,`${viewport.name}: PPT preserves unknown values and long remarks without truncation`);
    assert(pptContent.images&&pptContent.resolved,`${viewport.name}: presenter images embedded and editable stage tokens resolved`);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),beforeEarnings,`${viewport.name}: earnings/PPT/Q&A do not write canonical data`);
    await page.locator('#monthlyReport').screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-quarterly.png`)});
    await page.locator('[data-report-board="annual"]').click();
    assert(await page.locator('#monthlyReportAnnualPanel').isVisible(),`${viewport.name}: annual preview board`);
    assert((await page.locator('#monthlyReportAnnualPanel').innerText()).includes('자동 생성한 실적이나 목표를 대신 넣지 않습니다'),`${viewport.name}: annual does not invent historical goals`);
    assert.equal(await page.locator('#earningsAnnual [data-earnings-context]').count(),0,`${viewport.name}: annual has no automatic AI or goal extraction`);
    assert.equal(await page.locator('#annualReportList .annual-story-stage section').count(),4,`${viewport.name}: annual empty design scenes`);
    assert((await page.locator('#annualReportList').innerText()).includes('DESIGN PREVIEW'),`${viewport.name}: design example clearly labelled`);
    assert.equal(await page.locator('#annualReportList .annual-story-speakers article').count(),5,`${viewport.name}: annual presenter prompts`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${viewport.name}: annual no page overflow`);
    for(const key of ['cover','overview','presenters','next'])await page.locator(`#annualReportList .annual-story-${key}`).screenshot({path:join(root,`artifacts/monthly-report/${viewport.name}-annual-${key}.png`)});
    const annual=await page.evaluate(()=>earningsAggregate('annual','2026','2026-10-01'));
    assert.equal(annual.months.length,12);assert.equal(annual.closed,false);assert.equal(annual.spend,2500000);assert.equal(annual.quizTotal,40);assert.equal(annual.coverage,2);assert.equal(annual.end,null);
    assert(await page.locator('#annualReportRegister').isDisabled(),`${viewport.name}: annual registration requires validation`);
    if(viewport.name==='desktop'){
      const longDownloadPromise=page.waitForEvent('download');
      await page.evaluate(()=>{const r=earningsAggregate('annual','2026','2026-10-01');r.rows[0].books=Array.from({length:8},(_,i)=>({title:`긴 장면 ${i+1} · ${'완료한 책과 기억할 이야기 '.repeat(8)}`}));const d={context:'현재 상황과 목표를 충분히 설명하는 메모입니다. '.repeat(40).slice(0,1800),answer:'이 답변은 길이 검증용 합성 문장입니다. 실제 AI 응답으로 간주하지 않습니다. '.repeat(40).slice(0,2400),guidance:Array(3).fill('상황을 먼저 확인하고 유지와 성장 방향을 검토하는 미확정 제안입니다. '.repeat(10).slice(0,400))};earningsDownload(r,d)});
      await (await longDownloadPromise).saveAs(join(root,'artifacts/monthly-report/desktop-annual-long.pptx'));
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),beforeEarnings,`${viewport.name}: annual/long export preserves canonical data`);
    const goalBefore=await page.evaluate(()=>JSON.stringify({goals:state.goals,registry:state.goalRegistry}));
    await page.evaluate(()=>showView("settings"));
    assert.equal(await page.locator('#goalRegistryPanel').count(),1);
    assert.equal(await page.locator('#earningsGoalSettings').count(),0);
    await page.locator('#earningsGoalPeriod').selectOption('2026-Q3');
    const registryForm=page.locator('#goalRegistryForm');
    await registryForm.locator('[name="metric_id"]').selectOption('investment_total_krw');
    await page.locator('#earningsGoalImport').click();
    assert.equal(await registryForm.locator('[name="value"]').inputValue(),'100000000');
    assert.equal(await registryForm.locator('[name="goal_type"]').inputValue(),'quarter');
    assert.equal(await registryForm.locator('[name="quarter"]').inputValue(),'4');
    assert.equal(await registryForm.locator('[name="year"]').inputValue(),'2026');
    assert.equal(await page.evaluate(()=>JSON.stringify({goals:state.goals,registry:state.goalRegistry})),goalBefore,'import is DOM-only');
    await registryForm.locator('[name="value"]').fill('120000000');
    await registryForm.locator('button[type="submit"]').click();
    assert((await page.locator('#goalRegistryPreview').innerText()).includes('120000000'));
    assert.equal(await page.evaluate(()=>JSON.stringify({goals:state.goals,registry:state.goalRegistry})),goalBefore,'preview is not approval');
    await registryForm.locator('[name="value"]').fill('125000000');
    assert.equal(await page.locator('#goalRegistryApprove').count(),0,'edited input invalidates pending approval');
    await registryForm.locator('button[type="submit"]').click();
    assert((await page.locator('#goalRegistryPreview').innerText()).includes('125000000'));
    await page.locator('#goalRegistryCancel').click();
    await registryForm.locator('[name="metric_id"]').selectOption('books_completed_count');
    await page.locator('#earningsGoalImport').click();
    const bookCount=await page.evaluate(()=>earningsAggregate('quarterly','2026-Q3').books);
    assert.equal(await registryForm.locator('[name="value"]').inputValue(),String(bookCount));
    await registryForm.locator('[name="metric_id"]').selectOption('body_weight_kg');
    await registryForm.locator('[name="value"]').fill('95');
    await page.locator('#earningsGoalImport').click();
    assert.equal(await registryForm.locator('[name="value"]').inputValue(),'95','no automatic weight-loss target');
    assert((await page.locator('#earningsGoalBasis').innerText()).includes('추가 감량'));
    const invalid=await page.evaluate(()=>({
      missing:earningsRegistryProposal(earningsAggregate('quarterly','2026-Q1','2026-10-05'),'investment_total_krw','2026-10-05'),
      past:earningsRegistryProposal({...earningsAggregate('quarterly','2026-Q3'),period:'2026-Q1'},'investment_total_krw','2026-10-05'),
      rollover:earningsRegistryProposal({...earningsAggregate('quarterly','2026-Q3'),period:'2026-Q4'},'investment_total_krw','2027-01-05')
    }));
    assert.equal(invalid.missing.available,false);
    assert.equal(invalid.past.available,false);
    assert.equal(invalid.rollover.year,2027);
    assert.equal(invalid.rollover.quarter,1);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),beforeEarnings,'proposal/edit/preview/cancel preserves protected storage');
    assert.equal(await page.evaluate(()=>JSON.stringify({goals:state.goals,registry:state.goalRegistry})),goalBefore);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),viewport.name+': registry no page overflow');
    await page.locator('#goalRegistryPanel').screenshot({path:join(root,'artifacts/monthly-report/'+viewport.name+'-goal-registry.png')});
    await page.evaluate(()=>showView("monthlyReport"));
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
    const actionable=[...new Set(errors)].filter(error=>!error.includes('ERR_NETWORK_ACCESS_DENIED')&&!error.includes('ERR_CONNECTION_REFUSED')&&!error.includes('Supabase JS를 불러오지 못했습니다')&&!error.includes('monthly-smoke-forced-failure'));assert.deepEqual(actionable,[],`${viewport.name}: console errors`);
    await page.close();
  }
  console.log(JSON.stringify({state:'PASS',checks:['manual closed-month gate','persisted snapshot','source preservation','explicit regeneration','historical accumulation','save failure rollback','no-data/current-month gate','desktop/mobile overflow','quarterly keynote and editable PPT','Q&A paragraph fidelity and readability','canonical Goal Registry DOM-only proposals, edit/preview/cancel and stale approval invalidation']},null,2));
}finally{await browser.close();await new Promise(resolveClosed=>server.close(resolveClosed))}
