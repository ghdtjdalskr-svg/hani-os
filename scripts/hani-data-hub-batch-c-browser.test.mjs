// Full app in disposable synthetic contexts only. Never use a user profile.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.argv[2]||'playwright');
const root=path.resolve(import.meta.dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname;
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
let passed=0;
try{
  for(const width of [1440,390])for(const scenario of ['complete','gap','no-data','idb-failure','mismatch']){
    const context=await browser.newContext({viewport:{width,height:1000}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    await context.addInitScript(()=>{const OriginalDate=Date;window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-10-03T03:00:00Z']))}static now(){return new OriginalDate('2026-10-03T03:00:00Z').getTime()}}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin);await page.waitForLoadState('load');
    await page.evaluate(mode=>{
      document.querySelector('#loginGate').hidden=true;document.querySelector('#loginGate').style.display='none';
      document.querySelector('#app').classList.remove('login-locked');document.querySelector('#app').setAttribute('aria-hidden','false');
      state={...freshState(),investmentBrokerSnapshots:['08','09','10'].map((m,i)=>({id:m,mode:'actual',status:'confirmed',recordType:'account',period:'2026-'+m,snapshotDate:'2026-'+m+'-02',
        accounts:[{enabled:true,accountName:'Fixture',estimatedAssets:1000+i*100,totalEvaluation:null,totalPurchase:null,totalPnl:null,totalReturn:null,holdings:[]}]})),
        body:['08','09','10'].map((m,i)=>({id:m,date:'2026-'+m+'-02',weight:100-i})),books:[{id:'r1',status:'read',readDate:'2026-09-01',title:'Synthetic book'},
          {id:'r2',status:'read',readDate:'2026-10-01',title:'Synthetic book'}],movies:[{id:'m',status:'watched',watchedDate:'2026-10-01',title:'Not READ'}],
        exercise:[{id:'s1',date:'2026-10-01',steps:8000},{id:'s2',date:'2026-10-02',steps:12000},{id:'s0',date:'2026-10-03',steps:0}],
        ledgerMonths:[{id:'l',month:'2026-10',periodStart:'2026-09-18',periodEnd:'2026-10-17',items:[{date:'2026-09-20',category:'variable',amount:500}]}],
        learningQuizzes:[{id:'q1',status:'completed',completedAt:'2026-10-01T00:00:00Z',total:10,correctCount:10},
          {id:'q2',status:'completed',completedAt:'2026-10-02T00:00:00Z',total:30,correctCount:15}]};
      if(mode==='gap'){state.investmentBrokerSnapshots=state.investmentBrokerSnapshots.filter(r=>r.period!=='2026-09');state.body=state.body.filter(r=>!r.date.startsWith('2026-09'));state.books=state.books.filter(r=>!r.readDate.startsWith('2026-09'))}
      if(mode==='no-data')for(const key of ['investmentBrokerSnapshots','body','books','exercise','ledgerMonths','learningQuizzes'])state[key]=[];
      cloudUser={id:'synthetic-A',email:'synthetic@example.invalid'};
      cloudClient={auth:{getUser:async()=>({data:{user:{id:cloudUser?.id}},error:null})},from:()=>({select:()=>({eq:()=>({limit:async()=>({data:[{user_id:cloudUser?.id,state:mode==='mismatch'?{books:[]}:structuredClone(state),revision:1}],error:null})})})})};
      if(mode==='idb-failure')Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true});
      renderAll();showView('home');
      localStorage.setItem('hani_os_life_v23','SYNTHETIC_PROTECTED_SENTINEL');
    },scenario);
    const sourceBefore=await page.evaluate(()=>JSON.stringify(cloudSyncFingerprintState(state)));
    const errorCount=errors.length;
    await page.locator('#dataHubRefresh').click();
    await page.waitForFunction(mode=>mode==='mismatch'?document.querySelector('#dataHubStatus').textContent.includes('불일치'):
      document.querySelector('#dataHubStatus').textContent.includes('2026-10'),scenario);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),'SYNTHETIC_PROTECTED_SENTINEL');
    assert.equal(await page.evaluate(()=>JSON.stringify(cloudSyncFingerprintState(state))),sourceBefore);
    const values=await page.locator('#lifeMarketGrid [data-life-index] > strong').allTextContents();
    if(scenario==='mismatch'){
      assert.ok(values.every(v=>v==='—'));assert.equal(await page.evaluate(async()=> (await indexedDB.databases()).some(d=>d.name==='hani_data_hub_v1')),false);
    }else{
      assert.equal(values[2],scenario==='no-data'?'기록 없음':'1권');assert.equal(values[3],scenario==='no-data'?'기록 없음':'10,000보');
      assert.equal(values[5],scenario==='no-data'?'기록 없음':'62.5%');
      for(const id of ['homeExerciseAvg','homeJispiMeta','homeHinkeiMeta'])assert.ok((await page.locator('#'+id).textContent()).includes('Target not set'));
      if(scenario==='gap')for(const id of ['homeInvestRate','homeWeightGoal','homeContentMeta'])assert.ok((await page.locator('#'+id).textContent()).includes('전월 데이터 없음'));
      if(scenario==='idb-failure')assert.ok((await page.locator('#dataHubStatus').textContent()).includes('메모리 계산'));
      const beforeRepaint=await page.evaluate(()=>dataHubRuntime.peek());
      await page.evaluate(()=>{for(let i=0;i<4;i++){renderHome();renderBody();renderLifeMarket()}renderAll()});
      assert.deepEqual(await page.locator('#lifeMarketGrid [data-life-index] > strong').allTextContents(),values);
      assert.deepEqual(await page.evaluate(()=>dataHubRuntime.peek()),beforeRepaint);
      assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),'SYNTHETIC_PROTECTED_SENTINEL');
      for(const key of ['hasdaq','ne100','hinaJones','harukei','jispi','hinkei']){
        await page.locator(`#lifeMarketGrid [data-life-index="${key}"]`).click();
        assert.ok((await page.locator('#homeTrendChange').textContent()).length);
      }
      if(scenario==='complete'){
        for(const finish of ['porcelain-cream','midnight-black']){
          await page.evaluate(f=>applySignatureFinish(f,false),finish);
          const overflow=await page.locator('#lifeMarketGrid').evaluate(el=>el.scrollWidth>el.clientWidth+2);assert.equal(overflow,false);
          fs.mkdirSync(path.join(root,'qa-evidence'),{recursive:true});
          await page.locator('#home').screenshot({path:path.join(root,'qa-evidence',`batch-c-${width}-${finish}.png`)});
        }
        // Inject a read-only synthetic Goal Registry into the same real consumer/bridge.
        await page.evaluate(async()=>{
          dataHubRuntime.invalidate();
          const defs=[['steps_daily_average','steps/day','daily_average',8000],['spending_jispi_krw','KRW','monthly_budget',1000],['quiz_accuracy_percent','%','rate',75]];
          const goals=defs.map(([metric_id,unit,semantics,value])=>({metric_id,unit,semantics,value,goal_id:'demo-'+metric_id,
            revision:1,year:2026,goal_type:'annual',status:'active',effective_from:'2026-01-01',effective_to:'2026-12-31',created_at:'2026-01-01T00:00:00Z'}));
          dataHubRuntime=window.HANI_DATA_HUB.createDashboardRuntime({getSource:()=>state,getContext:dataHubContext,getBinding:dataHubBinding,
            canonical:{version:'85c8110-brokerCalc-ledgerCalc',brokerTotal:row=>brokerCalc(row).total,ledgerSpending:row=>ledgerCalc(row).jispiT},
            getGoals:()=>goals,getCoverage:()=>Object.fromEntries(['2026-09','2026-10'].map(month=>[month,Object.fromEntries(['investmentBrokerSnapshots','body','books','exercise','ledgerMonths','learningQuizzes'].map(key=>[key,{ready:true,complete:true}]))])),
            verify:async()=>{dataHubVerifier=cloudCreateRuntimeOwnerVerifier({getClient:()=>cloudClient,getContext:dataHubContext,getSource:()=>state,comparable:cloudSyncFingerprintState});return dataHubVerifier.verify()},
            onChange:dataHubRenderDashboard});
          await dataHubRuntime.refresh();
        });
        assert.ok((await page.locator('#homeExerciseAvg').textContent()).includes('125%'));
        assert.ok((await page.locator('#homeJispiMeta').textContent()).includes('예산 사용 50% · 잔여 500원'));
        assert.ok((await page.locator('#homeHinkeiMeta').textContent()).includes('-12.5%p'));
        // Cache previously had conservative coverage; the new contract must rebuild, not masquerade as a hit.
        assert.equal(await page.evaluate(()=>dataHubRuntime.peek().cache),'PUBLISHED');
        await page.evaluate(async()=>{
          dataHubInvalidate();state.books=[];state.investmentBrokerSnapshots.at(-1).accounts[0].estimatedAssets=0;
          state.learningQuizzes.forEach(row=>row.correctCount=0);await dataHubRuntime.refresh();
        });
        assert.equal(await page.locator('#homeAsset').textContent(),'0원');
        assert.equal(await page.locator('#homeBooks').textContent(),'0권');
        assert.equal(await page.locator('#homeHinkei').textContent(),'0%');
        assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),'SYNTHETIC_PROTECTED_SENTINEL');
        await page.evaluate(()=>{cloudOwnerVerificationEpoch++;cloudUser={id:'synthetic-B'};dataHubInvalidate()});
        assert.ok((await page.locator('#lifeMarketGrid [data-life-index] > strong').allTextContents()).every(v=>v==='—'));
      }
    }
    assert.equal(errors.length,errorCount,errors.slice(errorCount).join('\n'));
    passed++;console.log(`PASS ${width} ${scenario}: full runtime source safety / canonical cards / selected panel`);
    await context.close();
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({passed,failed:0,origin:'isolated synthetic app only'}));
