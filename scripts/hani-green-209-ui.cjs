const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
module.exports=async function run(browser,root=path.resolve(__dirname,'..')){
  const fixture=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/investment-research-mock.json'),'utf8'));
  const evidence=path.join(root,'artifacts/green-209/ui');fs.mkdirSync(evidence,{recursive:true});
  const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}const mime={'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};res.setHeader('Content-Type',mime[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  const results=[];
  try{for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
    const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage(),errors=[];let accept=false,dialogs=0;
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs++;accept?await d.accept():await d.dismiss();});
    await page.goto(origin);await page.waitForFunction(()=>!!window.HaniInvestmentCommittee);
    await page.evaluate(({fixture,finish})=>{
      unlockLoginGate();showView('investmentCommittee');document.documentElement.dataset.finish=finish;document.body.dataset.finishActive='true';
      state=freshState();state.ui.icAccumulationAccountIds=[];
      state.investmentResearchCards=fixture.cards.slice(0,2).map((v,i)=>({...HaniInvestmentResearchCore.normalizeCard(v),id:'qa-'+i,valuationNote:'기존 메모',lastReviewedAt:'2026-10-10T00:00:00Z'}));
      window.HaniAssetMarket.readResearchQuotes=async()=>({stocks:[],quotes:[]});renderAll();
      window.qaLegacy=JSON.stringify([state.accounts,state.instruments,state.transactions,state.investmentBrokerSnapshots,state.investmentResearchHistory,state.investmentCommitteeSnapshots]);
      window.qaCards=JSON.stringify(state.investmentResearchCards);window.qaWrites=[];
      const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.qaWrites.push(k);return native.call(this,k,v);};
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.qaClipboard=text;}}});
    },{fixture,finish});
    await page.locator('[data-ic=copy-second]').click();
    const copied=await page.evaluate(()=>JSON.parse(qaClipboard.split('현재 카드(JSON):\n')[1]));assert.equal(copied.length,2);
    const rows=copied.map((c,i)=>({researchId:c.researchId,agreeWithRating:i?'no':'partly',concerns:['현금흐름 가정'],missingRisks:['환율 위험'],fairValueSanity:{verdict:'too high',reason:'비교 자료가 필요해요.'},oneLine:i?'두 번째 종목도 별도로 확인해요.':'<img src=x onerror=alert(1)> 텍스트 검토'}));
    await page.locator('[data-ic=import-second]').click();await page.locator('[data-ic-second]').fill('설명\n```json\n'+JSON.stringify(rows)+'\n```\n끝');await page.locator('[data-ic=parse-second]').click();
    assert.equal(await page.locator('.ic-second-opinion').count(),2);assert.equal(await page.locator('.ic-second-opinion img').count(),0,'untrusted text is escaped');
    assert.equal(await page.locator('.ic-second-opinion input,.ic-second-opinion textarea').count(),0,'read-only panel');
    assert.equal(await page.evaluate(()=>qaWrites.length),0,'copy/paste does not persist');assert.equal(await page.evaluate(()=>JSON.stringify(state.investmentResearchCards)===qaCards),true);
    await page.locator('[data-ic=save-second]').first().click();assert.equal(dialogs,1);assert.equal(await page.evaluate(()=>qaWrites.length),0,'cancel does not save');
    accept=true;await page.locator('[data-ic=save-second]').first().click();
    assert.ok(await page.evaluate(()=>state.investmentResearchCards[0].valuationNote.startsWith('기존 메모\n\n[')));
    assert.equal(await page.evaluate(()=>{const old=JSON.parse(qaCards);return state.investmentResearchCards.every((c,i)=>['rating','fairValue','fairValueLow','fairValueHigh','conviction'].every(k=>JSON.stringify(c[k])===JSON.stringify(old[i][k])));}),true);
    assert.equal(await page.evaluate(()=>JSON.stringify([state.accounts,state.instruments,state.transactions,state.investmentBrokerSnapshots,state.investmentResearchHistory,state.investmentCommitteeSnapshots])===qaLegacy),true);
    assert.deepEqual(await page.evaluate(()=>[...new Set(qaWrites)]),['hani_os_life_v23']);
    const writes=await page.evaluate(()=>qaWrites.length);await page.locator('[data-ic=save-second]').first().click();assert.equal(await page.evaluate(()=>qaWrites.length),writes,'duplicate does not save');
    // In-place card changes make the old opinion visibly stale and disabled.
    await page.evaluate(()=>{state.investmentResearchCards[1].fairValue=1;HaniInvestmentCommittee.render();});
    assert.equal(await page.locator('[data-ic=save-second]').last().isDisabled(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'viewport has no horizontal overflow');
    await page.screenshot({path:path.join(evidence,width+'-'+finish+'.png'),fullPage:true});
    // Request source drift is rejected before replacing existing panels.
    await page.locator('[data-ic=import-second]').click();await page.locator('[data-ic-second]').fill(JSON.stringify(rows));await page.locator('[data-ic=parse-second]').click();assert.match(await page.locator('.ic-second-import .ic-error').textContent(),/변경/);await page.locator('.ic-second-import [data-ic=close]').click();
    await page.evaluate(()=>{cloudUser={id:'synthetic-other-account'};HaniInvestmentCommittee.render();});assert.equal(await page.locator('.ic-second-opinion').count(),0,'account switch discards memory opinions');
    await page.reload();await page.waitForFunction(()=>!!window.HaniInvestmentCommittee);assert.equal(await page.locator('.ic-second-opinion').count(),0,'reload has no transient opinion fields');
    assert.ok(await page.evaluate(()=>state.investmentResearchCards[0].valuationNote.includes('세린 연구원 2차 의견')),'normal saved note read-back');
    assert.deepEqual(errors,[]);results.push({width,finish,status:'PASS',dialogs});await context.close();
  }}finally{await new Promise(resolve=>server.close(resolve));}
  fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(results,null,2));return results;
};
if(require.main===module){const pw=require(process.argv[2]);(async()=>{const browser=await pw.chromium.launch({executablePath:process.argv[3],headless:true});try{console.log(await module.exports(browser));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});}
