/* Actual app + Edge, synthetic briefing/state only. Usage: node this.mjs <playwright/index.mjs> <browser.exe> */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))), evidence=path.join(root,'artifacts/street-journal-v1');
fs.mkdirSync(evidence,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/investment-research-mock.json',import.meta.url),'utf8'));
const sample={edition:'2026-10-21',publishedAt:'2026-10-21 07:15',temperature:{score:2,prev:3,label:'경계·공포'},kr:{asOf:'10/20 정규장 종가',mood:'down',items:[{name:'KOSPI',value:'5,552.74',chg:-3.73,unit:'%'},{name:'KOSDAQ',value:'781.97',chg:-3.33,unit:'%'},{name:'삼성전자',value:'211,500',chg:-2.98,unit:'%'},{name:'SK하이닉스',value:'1,223,000',chg:-4.23,unit:'%'}],flows:{foreign:'-5,300억',institution:'-1조 48억',retail:'+8,981억'},comment:'외국인·기관이 같이 팔았어. 반등분을 거의 다 반납했네 ㅠㅠ'},us:{asOf:'10/20 정규장 종가',mood:'mixed',items:[{name:'S&P 500',value:'7,712.57',chg:0.28},{name:'나스닥',value:'26,424.82',chg:-0.02},{name:'다우존스',value:'52,495.88',chg:1.02},{name:'필라델피아 반도체',value:'11,283.81',chg:-0.29}],comment:'기술주에서 헬스케어·가치주로 돈이 옮겨 갔어. 다 팔아치운 건 아니야!'},macro:{asOf:'10/20 기준',items:[{name:'美 국채 10년',value:'5.12%',chg:-3,unit:'bp'},{name:'美 국채 2년',value:'4.79%',chg:2,unit:'bp'},{name:'브렌트유',value:'$108.79',chg:-0.69},{name:'WTI (12월물)',value:'$97.82',chg:-0.73},{name:'달러/원',value:null},{name:'금',value:null}]},why:[{fact:'외국인·기관 동반 순매도',effect:'neg',interp:'하루 순매매로 외국인 이탈을 단정할 순 없음'},{fact:'中 빅테크, 엔비디아 GPU 350억$+ 주문 보도',effect:'pos',interp:'익명 소식통 보도 · 확정 매출 아님'},{fact:'美 잠정주택판매 −7.3% · 10년물 5.12%',effect:'mixed',interp:'금리 하락 이유가 경기 둔화라면 실적엔 부담'}],portfolio:[{name:'삼성전자우',ticker:'005935',price:'165,900',chg:-2.93,status:'WATCH',short:'외국인 수급·시장 위험회피 영향.',long:'메모리 업황·현금흐름·주주환원이 핵심 — 투자논리 변화 없음.'}],calendar:[{when:'10/21 수',what:'한국 10월 1~20일 수출입 — 반도체 수출'},{when:'10/21 밤',what:'메타 · 테슬라 실적 (美장 마감 후)'},{when:'10/22 목',what:'한국은행 금통위 · 美 실업수당 청구'}],hani:{comment:'주가 하락과 반도체 수요 감소는 다른 이야기야. 숫자와 감정을 분리하자!',actions:['무리한 추가 매수보다 현금흐름 지키기','기존 투자 비중 유지','외국인 수급·반도체 낙폭 먼저 확인']},sources:'검증용 합성 브리핑 · 승인 디자인 v3 수치 예시'};
const block=data=>'대표님, 아침 브리핑입니다.\n<<<HSJ v1\n'+JSON.stringify(data)+'\nHSJ>>>\n좋은 하루 보내세요.';
const closure=await resolveRuntimeClosure({exists:file=>fs.existsSync(path.join(root,file)),read:file=>fs.readFileSync(path.join(root,file))});
for(const file of ['hani-street-journal.js','hani-street-journal.css',...['hani','jieun','minji','seoyun'].flatMap(p=>(p==='hani'?['point','cheer','think']:p==='seoyun'?['point']:['worried','cheer','think']).map(a=>'assets/street-journal/chibi/'+p+'-'+a+'.webp'))])assert.ok(closure.files.includes(file),'closure missing '+file);
const journalMissing=closure.missing.filter(m=>/street-journal/.test(m.path+' '+m.referenced_by));assert.deepEqual(journalMissing,[]);
fs.writeFileSync(path.join(evidence,'closure.json'),JSON.stringify({files:closure.files.length,journalFiles:closure.files.filter(f=>/street-journal/.test(f)),missing:closure.missing},null,2));
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.woff2':'font/woff2'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
let browser;const results=[];
try{
  const {chromium}=await import(pathToFileURL(process.argv[2]).href);
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
    // Block external services without generating resource failures; no auth/Cloud calls leave this fixture.
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:200,contentType:'application/javascript',body:''}));
    const page=await context.newPage(),errors=[],resourceErrors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',response=>{if(response.status()>=400)resourceErrors.push({url:response.url(),status:response.status()});});
    let dialogAllow=false;page.on('dialog',d=>dialogAllow?d.accept():d.dismiss());
    await page.goto(origin);await page.addStyleTag({content:'#haniContextRemote,.hani-remote-mobile-trigger{display:none!important}'});await page.waitForFunction(()=>!!window.HaniInvestmentCommittee);
    await page.evaluate(({fixture})=>{
      unlockLoginGate();showView('investmentCommittee');document.querySelector('.hani-remote-close')?.click();state=freshState();state.ui.icAccumulationAccountIds=[];
      state.investmentResearchCards=[HaniInvestmentResearchCore.normalizeCard({...fixture.cards[0],id:'journal-match',name:'삼성전자우',ticker:'005935'})];
      window.journalBefore=JSON.stringify([state.investmentResearchCards,state.investmentResearchHistory,state.investmentCommitteeSnapshots]);
      // Guard actual Storage API after normal app entry. Journal operations must never even read the protected key.
      window.journalAccess=[];
      for(const method of ['getItem','setItem','removeItem','clear']){
        const original=Storage.prototype[method];Storage.prototype[method]=function(...args){window.journalAccess.push({method,key:args[0],stack:new Error().stack});if(args[0]==='hani_os_life_v23')throw Error('Protected key accessed during journal action');return original.apply(this,args);};
      }
      window.journalState=()=>JSON.stringify([state.investmentResearchCards,state.investmentResearchHistory,state.investmentCommitteeSnapshots]);
    },{fixture});
    await page.locator('[data-ic-section="icStreetJournal"]').click();const panel=page.locator('#icStreetJournal');
    const input=panel.locator('textarea'),read=panel.locator('[data-hsj="read"]'),store=panel.locator('[data-hsj="store"]');
    await input.fill('missing');await read.click();await assert.match(await panel.locator('[role=status]').innerText(),/데이터 블록을 찾지 못했어요/);
    assert.equal(await page.evaluate(()=>journalAccess.filter(c=>c.method!=='getItem').length),0);
    await input.fill(block(sample));await read.click();await page.locator('.hsj-sheet').waitFor();
    assert.equal(await page.evaluate(()=>journalAccess.filter(c=>c.method!=='getItem').length),0);
    assert.equal(await page.evaluate(()=>journalBefore===journalState()),true);
    assert.equal(await panel.locator('.hsj-p-hani-point').count(),1);assert.equal(await panel.locator('.hsj-p-hani-think').count(),1);
    assert.equal(await panel.locator('.hsj-p-jieun-worried').count(),1);assert.equal(await panel.locator('.hsj-p-minji-think').count(),1);assert.equal(await panel.locator('.hsj-p-seoyun-point').count(),1);
    assert.match(await panel.locator('.hsj-grid').nth(2).innerText(),/▼ 3bp/);
    const geometry=await page.locator('.hsj-sheet').evaluate(el=>({width:el.getBoundingClientRect().width,x:el.getBoundingClientRect().x,overflow:el.scrollWidth-el.clientWidth,pageOverflow:document.documentElement.scrollWidth-innerWidth}));
    await page.evaluate(()=>document.querySelector('.hani-remote-close')?.click());
    await page.screenshot({path:path.join(evidence,'debug-'+width+'.png'),fullPage:true});
    fs.writeFileSync(path.join(evidence,'geometry-'+width+'.json'),JSON.stringify(await page.locator('.hsj-sheet').evaluate(el=>({box:el.getBoundingClientRect().toJSON(),overflow:[...el.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>el.getBoundingClientRect().right+1).map(e=>({cls:e.className,tag:e.tagName,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right,text:e.textContent.slice(0,50)}))})),null,2));
    assert.ok(geometry.width<=430);assert.ok(geometry.overflow<=1);assert.ok(geometry.pageOverflow<=1);
    await page.screenshot({path:path.join(evidence,`street-journal-${width}.png`),fullPage:true});
    await page.locator('.hsj-sheet').screenshot({path:path.join(evidence,`card-${width}.png`),style:'.mobile-status-bar,.app-header{visibility:hidden!important}'});
    // Real download, inspect PNG magic and decode pixels using the browser's Canvas.
    const downloadPromise=page.waitForEvent('download');await panel.locator('[data-hsj="png"]').click();const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),'hani-street-journal-2026-10-21.png');await download.saveAs(path.join(evidence,`export-${width}.png`));
    const png=fs.readFileSync(path.join(evidence,`export-${width}.png`));assert.equal(png.subarray(1,4).toString(),'PNG');
    console.log('PNG downloaded',width);
    const pixels=await page.evaluate(async bytes=>{const img=new Image();img.src='data:image/png;base64,'+bytes;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,1,1).data;return {width:img.width,height:img.height,pixel:[...p]};},png.toString('base64'));
    assert.equal(pixels.width,Math.ceil(geometry.width)*2);assert.ok(pixels.height>1000);assert.equal(pixels.pixel[3],255);assert.ok(pixels.pixel[2]>pixels.pixel[0]);
    console.log('PNG decoded',width);await panel.locator('[data-hsj-research="0"]').click();await page.locator('.ic-editor').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>journalBefore===journalState()),true);
    await page.locator('.ic-editor [data-ic="close"]').first().click();await page.locator('[data-ic-section="icStreetJournal"]').click();
    // Duplicate and absent research: notice, no editor/create/history/snapshot changes.
    await page.evaluate(()=>state.investmentResearchCards.push({...state.investmentResearchCards[0],id:'duplicate'}));const duplicateBefore=await page.evaluate(()=>journalState());
    await panel.locator('[data-hsj-research="0"]').click();assert.match(await panel.locator('[role=status]').innerText(),/종목 리포트 없음/);assert.equal(await page.evaluate(()=>journalState()),duplicateBefore);
    await page.evaluate(()=>state.investmentResearchCards=[]);await panel.locator('[data-hsj-research="0"]').click();assert.match(await panel.locator('[role=status]').innerText(),/종목 리포트 없음/);
    // Save, cancelled overwrite, confirmed overwrite, read back, date order, confirmed delete.
    await store.click();assert.match(await panel.locator('[role=status]').innerText(),/보관했어요/);
    const saved=await page.evaluate(()=>localStorage.getItem(HaniStreetJournal.KEY));await store.click();assert.equal(await page.evaluate(()=>localStorage.getItem(HaniStreetJournal.KEY)),saved);
    dialogAllow=true;await store.click();await input.fill(block({...sample,edition:'2026-10-20'}));await read.click();await store.click();
    assert.deepEqual(await panel.locator('select option').allTextContents(),['보관 날짜 선택','2026-10-21','2026-10-20']);
    await panel.locator('select').selectOption('2026-10-21');assert.match(await panel.locator('.hsj-mast .hsj-date').innerText(),/2026\.10\.21/);
    dialogAllow=false;await panel.locator('[data-hsj="delete"]').click();assert.equal(await panel.locator('.hsj-sheet').count(),1);
    dialogAllow=true;await panel.locator('[data-hsj="delete"]').click();assert.equal(await panel.locator('.hsj-sheet').count(),0);
    // Corrupt archive must stay byte-for-byte intact; valid paste still previews.
    await page.evaluate(()=>localStorage.setItem(HaniStreetJournal.KEY,'{damaged'));
    await input.fill(block(sample));await read.click();await store.click();assert.match(await panel.locator('[role=status]').innerText(),/보관함을 읽지 못했어요/);assert.equal(await page.evaluate(()=>localStorage.getItem(HaniStreetJournal.KEY)),'{damaged');
    // Empty/zero fields, XSS, long text: actual render remains usable and read-only.
    await input.fill(block({edition:'2026-10-21',temperature:{score:0},kr:{items:[{name:'zero',value:0,chg:0},{name:'null',value:null,chg:null}],comment:'<img src=x onerror="window.xss=true">'+ '긴 문장 '.repeat(35)},portfolio:[{name:'x',status:'<script>'}],sources:[{name:'unsafe',url:'javascript:alert(1)'}]}));await read.click();
    assert.equal(await page.evaluate(()=>window.xss),undefined);assert.equal(await panel.locator('.hsj-sheet img,.hsj-sheet script,.hsj-sheet a[href^="javascript"]').count(),0);
    assert.match(await panel.locator('.hsj-grid').first().innerText(),/0%/);assert.equal(await panel.locator('.hsj-q').nth(1).locator('.hsj-up,.hsj-down').count(),0);
    await input.fill(block({}));await read.click();assert.doesNotMatch(await panel.locator('.hsj-sheet').innerText(),/undefined|NaN/);
    await input.fill('<<<HSJ v1\n{"bad":,}\nHSJ>>>');await read.click();assert.ok(await store.isDisabled());assert.equal(await panel.locator('.hsj-sheet').count(),0);
    // Re-enter after damaged archive; mount remains singular and no writes on tab navigation.
    const countBefore=await page.evaluate(()=>journalAccess.filter(c=>c.method==='setItem').length);
    await page.locator('[data-ic-section="icMonthly"]').click();await page.locator('[data-ic-section="icStreetJournal"]').click();assert.equal(await panel.locator('textarea').count(),1);
    assert.equal(await page.evaluate(()=>journalAccess.filter(c=>c.method==='setItem').length),countBefore);
    const access=await page.evaluate(()=>journalAccess.map(({method,key})=>({method,key})));assert.ok(access.every(c=>c.key==='hani_street_journal_v1'));
    results.push({width,geometry,png:pixels,consoleErrors:errors,resourceErrors,storageAccess:access});
    assert.deepEqual(errors,[]);assert.deepEqual(resourceErrors,[]);await context.close();
  }
  fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify({status:'PASS',results},null,2));console.log('PASS: 390/1440 actual Edge, PNG downloads, parser, archive, Research invariance, protected key guard; console errors 0.');
}catch(error){fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify({status:'FAIL',error:error.stack,results},null,2));throw error;}
finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
