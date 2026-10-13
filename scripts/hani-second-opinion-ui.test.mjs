// Synthetic isolated browser QA. Usage: node scripts/hani-second-opinion-ui.test.mjs <playwright/index.mjs> <browser.exe>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..'),fixture=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/investment-research-mock.json'),'utf8'));
const evidence=path.join(root,'artifacts/gemini-auto');fs.mkdirSync(evidence,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;let browser;
try{
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
  const context=await browser.newContext({viewport:{width,height:900},permissions:['clipboard-write','clipboard-read']});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin);await page.waitForFunction(()=>window.HaniInvestmentCommittee);
  await page.evaluate(({fixture,finish})=>{
   unlockLoginGate();showView('investmentCommittee');document.documentElement.dataset.finish=finish;document.body.dataset.finishActive='true';
   state=freshState();state.investmentResearchCards=fixture.cards.slice(0,3).map((c,i)=>({...HaniInvestmentResearchCore.normalizeCard(c),id:'ui'+i,createdAt:'2026-10-11T00:00:00Z',lastReviewedAt:'2026-10-11'}));
   cloudUser={id:'fixture-owner'};cloudClient={auth:{getSession:async()=>({data:{session:{access_token:'fixture-session',user:{id:'fixture-owner'}}},error:null})}};
   cloudConfig=()=>({url:'https://edge.example.test',key:'fixture-public'});
   window.autoCalls=[];window.autoMode='success';window.autoSaves=0;window.autoCopies=[];
   commit=()=>{autoSaves++;return true;};save=()=>{autoSaves++;return true;};
   const storageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){autoSaves++;return storageSet.call(this,k,v);};
   const nativeFetch=window.fetch;window.fetch=async(url,cfg)=>{
    if(String(url).includes('/functions/v1/hani-second-opinion')){
     autoCalls.push(JSON.parse(cfg.body));await new Promise(done=>setTimeout(done,180));
     if(autoMode==='error')return new Response(JSON.stringify({ok:false,code:'GEMINI_KEY_MISSING'}),{status:503});
     const text=JSON.stringify(state.investmentResearchCards.map(c=>({researchId:c.id,agreeWithRating:'partly',concerns:['검토용 우려'],missingRisks:[],fairValueSanity:{verdict:'reasonable',reason:'검토용 자료 부족'},oneLine:'검토용 <응답>'})));
     return new Response(JSON.stringify({ok:true,text,model:'fixture'}));
    }return nativeFetch(url,cfg);
   };
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>autoCopies.push(value)}});
   HaniInvestmentCommittee.render();window.autoBefore=JSON.stringify(state);
  },{fixture,finish});
  const ask=page.locator('[data-ic="ask-second"]'),copy=page.locator('[data-ic="copy-second"]');
  await copy.click();await ask.click();await page.waitForFunction(()=>document.querySelector('[data-ic="ask-second"]').disabled);
  assert.match(await ask.innerText(),/세린 연구원이 Gemini에게 물어보는 중/);
  await page.waitForFunction(()=>!document.querySelector('[data-ic="ask-second"]').disabled);
  assert.equal(await page.locator('.ic-second-opinion').count(),3);
  assert.equal(await page.evaluate(()=>autoCalls[0].prompt===autoCopies[0]),true);
  assert.equal(await page.evaluate(()=>autoSaves),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)===autoBefore),true);
  const box=await ask.boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width+1);
  await page.locator('.ic-header').first().screenshot({path:path.join(evidence,`header-${width}-${finish}.png`)});
  await page.evaluate(()=>{autoMode='error';});await ask.click();await page.waitForFunction(()=>document.querySelector('.ic-notice').textContent.includes('서버에 Gemini 키가 아직 없어요'));
  assert.equal(await copy.isEnabled(),true);await copy.click();await page.locator('[data-ic="import-second"]').click();
  await page.locator('[data-ic-second]').fill(await page.evaluate(()=>JSON.stringify(state.investmentResearchCards.map(c=>({researchId:c.id,agreeWithRating:'yes',concerns:[],missingRisks:[],fairValueSanity:{verdict:'reasonable',reason:'수동 자료'},oneLine:'수동 검토 의견'})))));
  await page.locator('[data-ic="parse-second"]').click();assert.match(await page.locator('.ic-second-opinion').first().innerText(),/수동 검토 의견/);
  assert.equal(await page.evaluate(()=>autoSaves),0);
  // Final review uses the same web Hani manually; all actions before memo save are read-only.
  const finalCopy=page.locator('[data-ic="copy-final"]');assert.equal(await finalCopy.isVisible(),true);
  await finalCopy.click();
  const finalPrompt=await page.evaluate(()=>autoCopies.at(-1));
  assert.match(finalPrompt,/하니의 원문 리포트/);assert.match(finalPrompt,/수동 검토 의견/);assert.match(finalPrompt,/"rating"/);assert.match(finalPrompt,/"thesis"/);assert.match(finalPrompt,/"final_rating"/);
  const finalBox=await finalCopy.boundingBox();assert.ok(finalBox&&finalBox.x>=0&&finalBox.x+finalBox.width<=width+1);
  const finalRows=await page.evaluate(()=>state.investmentResearchCards.map((c,i)=>({ticker:c.ticker,name:c.name,final_rating:['유지','상향','하향'][i],changed:i!==0,accepted:['환율 위험 <반영>: 수익 민감도'],rejected:[{point:'과도한 우려 <script>',reason:'공시에서 확인'}],rationale:['경쟁력 확인','성장 가정 점검','변동성 반영'],next_checks:['다음 실적 발표']})));
  await page.locator('[data-ic="import-final"]').click();
  const finalInput=page.locator('[data-ic-final]'),finalParse=page.locator('[data-ic="parse-final"]');
  await finalInput.fill('[잘못된 JSON');await finalParse.click();
  assert.match(await page.locator('.ic-final-import .ic-error').innerText(),/JSON 배열.*붙여넣으세요/);
  assert.equal(await page.locator('.ic-final-opinion').count(),0);
  assert.equal(await page.evaluate(()=>autoSaves),0);
  await finalInput.fill('```json\n'+JSON.stringify(finalRows)+'\n```');await finalParse.click();
  const finals=page.locator('.ic-final-opinion');assert.equal(await finals.count(),3);
  assert.deepEqual(await page.locator('.ic-final-rating').allTextContents(),['유지','상향','하향']);
  assert.equal(await page.locator('.ic-final-changed').count(),2);
  assert.match(await finals.first().innerText(),/하니 최종 의견 \(대표님 채팅에서 받은 답\)/);
  assert.match(await finals.first().innerText(),/환율 위험 <반영>/);assert.equal(await finals.locator('script').count(),0);
  assert.equal(await finals.locator('button,input,textarea,select').count(),0);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.ic-final-opinion')].every(el=>el.previousElementSibling.matches('.ic-second-opinion'))),true);
  assert.equal(await page.evaluate(()=>autoSaves),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)===autoBefore),true);
  await finals.first().screenshot({path:path.join(evidence,`final-${width}-${finish}.png`)});
  // Plain JSON follows the same path and does not add another panel.
  await page.locator('[data-ic="import-final"]').click();await finalInput.fill(JSON.stringify(finalRows));await finalParse.click();assert.equal(await finals.count(),3);
  page.once('dialog',dialog=>dialog.dismiss());await page.locator('[data-ic="save-second"]').first().click();assert.equal(await page.evaluate(()=>autoSaves),0);
  page.once('dialog',dialog=>{assert.match(dialog.message(),/하니 최종 의견/);return dialog.accept();});
  await page.locator('[data-ic="save-second"]').first().click();
  assert.equal(await page.evaluate(()=>autoSaves),1);
  const saved=await page.evaluate(()=>state.investmentResearchCards[0]);
  assert.match(saved.valuationNote,/세린 연구원 2차 의견 · Gemini/);assert.match(saved.valuationNote,/하니 최종 의견 \(대표님 채팅에서 받은 답\)/);assert.match(saved.valuationNote,/공시에서 확인/);assert.match(saved.valuationNote,/다음 실적 발표/);
  const original=JSON.parse(await page.evaluate(()=>autoBefore)).investmentResearchCards[0];
  for(const field of ['rating','thesis','fairValue','fairValueLow','fairValueHigh','nextCheckpoints'])assert.deepEqual(saved[field],original[field]);
  assert.equal(await finals.count(),3);
  // Replacement critique invalidates final replies; account changes also close/empty paste dialogs.
  await ask.click();await page.waitForFunction(()=>!document.querySelector('[data-ic="ask-second"]').disabled);
  await page.locator('[data-ic="import-second"]').click();
  await page.locator('[data-ic-second]').fill(await page.evaluate(()=>JSON.stringify(state.investmentResearchCards.map(c=>({researchId:c.id,agreeWithRating:'no',concerns:['새 반론'],missingRisks:[],fairValueSanity:{verdict:'reasonable',reason:'새 검토'},oneLine:'새 검토 의견'})))));
  await page.locator('[data-ic="parse-second"]').click();assert.equal(await finals.count(),0);assert.equal(await page.evaluate(()=>autoSaves),1);
  await page.locator('[data-ic="import-final"]').click();
  await page.evaluate(()=>{cloudUser=null;HaniInvestmentCommittee.render();});assert.equal(await ask.isDisabled(),true);assert.match(await ask.getAttribute('title'),/로그인/);
  assert.equal(await page.locator('.ic-final-import').evaluate(el=>el.open),false);assert.equal(await page.locator('.ic-final-import').innerHTML(),'');assert.equal(await finalCopy.isVisible(),false);
  assert.deepEqual(errors,[]);console.log(`PASS auto + manual + final copy/plain/fenced/error/render + memo-only save + signed-out UI ${width}/${finish}`);
  await context.close();
 }
}finally{await browser?.close();await new Promise(done=>server.close(done));}
