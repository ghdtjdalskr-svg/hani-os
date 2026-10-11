import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {pathToFileURL} from 'node:url';
import {claudeTranscriptAccount,geminiLogAccount,parseAntigravityUsage} from './hani-ai-budget-bridge.mjs';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),root=path.resolve(import.meta.dirname,'..');
const server=http.createServer((req,res)=>{const uri=new URL(req.url,'http://test').pathname,file=path.resolve(root,'.'+(uri==='/'?'/index.html':decodeURIComponent(uri)));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;let browser;
try{browser=await chromium.launch({executablePath:process.argv[3],headless:true});for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:950}});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>window.HaniAiBudget);
 // Synthetic UI inspection only; hide authentication overlay without logging into any account.
 await page.evaluate(()=>{unlockLoginGate();showView('aiBudget');document.getElementById('app').style.display='';document.getElementById('app').hidden=false;document.getElementById('app').classList.remove('login-locked');document.getElementById('app').removeAttribute('inert');document.querySelectorAll('[id*="auth"],[id*="login"]').forEach(el=>{if(el.getBoundingClientRect().height>300)el.style.display='none';});});
 assert.equal(await page.locator('[data-budget-slot]').count(),5);assert.match(await page.locator('#aiBudgetCards').textContent(),/확인 불가/);
 assert.equal(await page.locator('[data-budget-slot="codex-1"] h3').textContent(),'Codex 주력');assert.equal(await page.locator('[data-budget-slot="codex-2"] h3').textContent(),'Codex 보조');
 assert.equal(await page.locator('[data-budget-slot="gemini-cli"]').count(),0);
 assert.match(await page.locator('.budget-manager').textContent(),/서윤/);await page.waitForFunction(()=>Array.from(document.querySelectorAll('#aiBudget img')).every(img=>img.complete&&img.naturalWidth>0));assert.equal(await page.locator('.budget-symbol img').count(),5);
 await page.evaluate(()=>document.querySelector('[data-budget-edit="codex-2"]').click());await page.locator('#budget-weekly-used').fill('25');await page.locator('#budget-weekly-reset').fill('2099-10-08T09:00');await page.evaluate(()=>document.getElementById('aiBudgetForm').requestSubmit());assert.match(await page.locator('[data-budget-slot="codex-2"]').innerText(),/75%/);assert.match(await page.locator('[data-budget-slot="codex-1"]').innerText(),/확인 불가/);
 const stored=await page.evaluate(()=>localStorage.getItem('hani_ai_budget_summary_v1'));await page.reload();await page.waitForFunction(()=>window.HaniAiBudget);assert.equal(await page.evaluate(()=>localStorage.getItem('hani_ai_budget_summary_v1')),stored);
 await page.evaluate(()=>{unlockLoginGate();showView('aiBudget');});const lifeBefore=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));await page.evaluate(()=>document.getElementById('aiBudgetRefresh').click());await page.waitForFunction(()=>!document.getElementById('aiBudgetRefresh').disabled);assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),lifeBefore);
 await page.locator('#aiBudgetImport').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":1,"accounts":[{"id":"codex-2","provider":"claude"}]}')});assert.equal(await page.evaluate(()=>localStorage.getItem('hani_ai_budget_summary_v1')),stored);
 const now=Date.now(),claude=claudeTranscriptAccount([{key:'fixture',time:now-3600000,inputTokens:1500,outputTokens:250}],null,now),gemini=geminiLogAccount(Array.from({length:3},(_,i)=>({time:now-i*1000})),now);
 claude.transcriptUsage.fourWeekMaxFiveHourTokens=3500;
 const agy=parseAntigravityUsage(fs.readFileSync(path.join(root,'scripts/fixtures/hani-antigravity-usage.tsv'),'utf8')).accounts;
 const fixture={schemaVersion:1,accounts:[claude,gemini,...agy],collectorStatus:'codex_read_failed'};
 await context.route('http://127.0.0.1:8794/api/ai-budget',r=>{assert.equal(r.request().method(),'GET');assert.equal(r.request().headers()['x-hani-ai-budget'],'read-only-v1');return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)});});
 await page.locator('#aiBudgetRefresh').click();await page.waitForFunction(()=>!document.getElementById('aiBudgetRefresh').disabled);
 const claudeCard=page.locator('[data-budget-slot="claude-1"]'),geminiCard=page.locator('[data-budget-slot="gemini-cli"]');
 assert.match(await claudeCard.innerText(),/최근 5시간/);assert.match(await claudeCard.innerText(),/입력 \+ 캐시 1,500 토큰 · 출력 250 토큰/);assert.match(await claudeCard.innerText(),/최근 7일/);assert.match(await claudeCard.innerText(),/응답 1회/);
 assert.equal(await claudeCard.locator('.budget-value').count(),0);assert.equal(await claudeCard.locator('.budget-personal-meter i').evaluate(el=>el.style.width),'50%');assert.equal(await claudeCard.locator('[role="meter"]').getAttribute('aria-valuemax'),'3500');
 assert.equal(await geminiCard.count(),0,'free CLI card hidden');assert.match(await claudeCard.innerText(),/사용 추정/);
 const pro=page.locator('[data-budget-slot="gemini-pro"]'),cg=page.locator('[data-budget-slot="antigravity-cg"]');
 assert.match(await pro.innerText(),/Google AI Pro/);assert.match(await pro.innerText(),/99%/);assert.match(await pro.innerText(),/5시간 한도/);assert.match(await pro.innerText(),/KST/);assert.match(await cg.innerText(),/100%/);
 const agyKst=await page.evaluate(value=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)),agy[0].windows[0].resetsAt);assert.ok((await pro.innerText()).includes(agyKst));
 assert.match(await page.locator('[data-budget-slot="codex-2"]').innerText(),/75%/);assert.match(await page.locator('#aiBudgetNotice').innerText(),/일부 서비스/);
 await page.locator('[data-budget-edit="claude-1"]').click();await page.locator('#budget-session-used').fill('40');await page.evaluate(()=>document.getElementById('aiBudgetForm').requestSubmit());assert.match(await claudeCard.innerText(),/60%/);assert.match(await claudeCard.innerText(),/플랜 사용률/);
 fixture.accounts[0]=claudeTranscriptAccount([{key:'fixture',time:now-3600000,inputTokens:1500,outputTokens:250}],null,Date.now());
 await page.locator('#aiBudgetRefresh').click();await page.waitForFunction(()=>!document.getElementById('aiBudgetRefresh').disabled);
 assert.match(await claudeCard.innerText(),/60%/);assert.match(await claudeCard.innerText(),/직접 기록/);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_ai_budget_summary_v1')).accounts.find(a=>a.id==='claude-1').transcriptUsage.fiveHours.inputTokens),1500);
 // Unknown imported fields cannot create DOM or survive normalized storage.
 fixture.accounts[0].transcriptUsage.prompt='<img src=x onerror=window.budgetInjected=true>';fixture.accounts[1].cliUsage.content=fixture.accounts[0].transcriptUsage.prompt;
 await page.locator('#aiBudgetImport').setInputFiles({name:'summary.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 assert.equal(await page.evaluate(()=>!!window.budgetInjected),false);assert.equal((await page.evaluate(()=>localStorage.getItem('hani_ai_budget_summary_v1'))).includes('onerror'),false);
 for(const [status,hint] of [['antigravity_cli_not_found',/찾지 못했습니다/],['antigravity_login_required',/로그인하면/]]){fixture.collectorStatus=status;await page.locator('#aiBudgetRefresh').click();await page.waitForFunction(()=>!document.getElementById('aiBudgetRefresh').disabled);assert.match(await pro.innerText(),hint);assert.match(await cg.innerText(),hint);assert.match(await pro.innerText(),/99%/);}
 assert.equal(await page.locator('#aiBudget').evaluate(el=>{const ids=Array.from(el.querySelectorAll('[id]'),n=>n.id);return new Set(ids).size===ids.length;}),true);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),lifeBefore);
 assert.equal(await page.locator('#aiBudget').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);assert.deepEqual(errors,[]);
 await page.evaluate(()=>{document.getElementById('loginGate').style.display='none';document.getElementById('app').classList.remove('login-locked');document.querySelectorAll('[class*=remote]').forEach(el=>{if(getComputedStyle(el).position==='fixed')el.style.display='none';});});fs.mkdirSync(path.join(root,'qa-evidence'),{recursive:true});await page.locator('#aiBudget').screenshot({path:path.join(root,`qa-evidence/ai-budget-claude-gemini-${width}.png`)});await context.close();
}}finally{await browser?.close();await new Promise(r=>server.close(r));}
console.log('PASS: 390/1440 actual app menu, five visible slots, Antigravity TSV/remaining/KST/hints, Claude tokens/manual preservation, Gemini CLI hidden, life-key unchanged, duplicate IDs/overflow/page errors.');




