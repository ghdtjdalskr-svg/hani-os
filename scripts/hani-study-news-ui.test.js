// CommonJS isolated browser test, using the supported .js tooling extension.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.audit','study-news-preview');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html');if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report=[];try{for(const width of [390,1440]){const context=await browser.newContext({viewport:{width,height:1000}});let externalRequests=0;await context.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();externalRequests++;return r.abort();});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/#study');await page.waitForFunction(()=>window.HANI_STUDY_V02984_TEST);
  const before=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
  await page.evaluate(()=>{
    const api=window.HANI_STUDY_V02984_TEST,date=new Date().toLocaleDateString('en-CA');
    const project=api.normalizeProject({id:'qa-news-only',name:'경제·기업 뉴스 — 가상 QA',category:'economy',quizSize:5,scheduleType:'manual',status:'active'});
    const questions=Array.from({length:5},(_,i)=>api.normalizeQuestion({prompt:i===0?'[가상 QA] 삼성전자 신규 공급 계약: 고객 수요가 증가하면 공급 기업 매출에 어떤 경로로 영향을 줄까요?':i===1?'[가상 QA] 중앙은행 정책금리 동결: 기업 투자와 차입 비용을 판단할 때 어떤 지표를 함께 봐야 할까요?':'[가상 QA] 경제 개념 확인 '+(i+1),choices:['고객 수요와 실제 공급 규모를 함께 확인','기사 제목만 보고 단정','주가가 항상 상승한다고 가정','기준일을 무시'],answer_index:0,difficulty:'easy',type:i<2?'Current Issue':'Definition',topic:i===0?'기업 실적':'거시경제',explanation:i<2?'[가상 QA] 사건→경제 원리→기업 영향의 연결. [N'+(i+1)+'] 가상 검증 출처 · '+date+' · https://example.com/qa-news-'+i:'[가상 QA] 기초 원리 설명입니다.'}));
    // Synthetic article text tests layout only; never label this fixture as real news.
    questions[0].prompt=`[가상 QA 뉴스 · 자료 기준일 ${date}]\n삼성전자 신규 공급 계약 — 가상 검증 자료\n출처: 가상 검증 출처\n[뉴스 요약] 생산업체가 고객 인증을 통과하고 공급 물량을 늘리는 상황을 가정합니다. 실제 기사나 출제 결과가 아닙니다.\n[질문] 고객 수요와 공급 규모의 변화는 기업 매출에 어떤 경로로 영향을 줄까요?`;
    state.learningProjects=[project];state.learningQuizzes=[api.normalizeQuiz({id:'qa-set',projectId:project.id,date,scheduledDate:date,title:'가상 QA · 실제 출제 결과 아님',status:'completed',score:100,questions,answers:[0,0,0,0,0]})];state.learningWrongAnswers=[];
    document.querySelector('#loginGate').style.setProperty('display','none','important');document.querySelector('#app').classList.remove('login-locked');document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));document.querySelector('#study').classList.add('active');renderAll();
  });
  const engine=page.locator('#studyEngineV02984');await engine.scrollIntoViewIfNeeded();
  assert.match(await page.locator('#studyMainPanel').innerText(),/난이도 설정은 유지/);assert.match(await page.locator('#studyMainPanel').innerText(),/이미 생성된 세트는 다시 쓰지/);
  assert.equal(await page.locator('.study-question').count(),5);assert.equal(await page.locator('.study-explanation').count(),5);
  assert.match(await page.locator('.study-question h4').first().innerText(),/자료 기준일.*\n/);
  assert.equal(await page.locator('.study-question h4').first().evaluate(e=>getComputedStyle(e).whiteSpace),'pre-line');
  assert.match(await page.locator('.study-explanation').first().innerText(),/https:\/\/example.com/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'horizontal overflow');assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),before);assert.deepEqual(errors,[]);
  await engine.screenshot({path:path.join(out,'study-'+width+'.png'),animations:'disabled'});
  await page.locator('.study-question').first().screenshot({path:path.join(out,'material-question-'+width+'.png'),animations:'disabled'});
  report.push({width,pass:true,protectedDataUnchanged:true,pageErrors:errors,externalRequestsBlocked:externalRequests,actualAI:false,fixture:true});await context.close();
}fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
