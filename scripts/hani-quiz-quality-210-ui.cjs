// node scripts/hani-quiz-quality-210-ui.cjs <playwright module directory> <browser executable>
// Isolated actual owner DOM/events with disposable records; no live Cloud/storage access.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'hani-study-v02984.js'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/quiz-quality-210.json'),'utf8'));

async function run(browser,evidence=path.join(root,'artifacts/quiz-quality-210')) {
  fs.mkdirSync(evidence,{recursive:true});const results=[];
  for(const width of [1440,390])for(const dark of [false,true]){
    const context=await browser.newContext({viewport:{width,height:1000},permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.setContent('<html><head><style>body{margin:12px;font-family:sans-serif}body.dark{background:#191923;color:#eee;--panel:#282838;--line:#555}#study{max-width:1000px;margin:auto}.btn{padding:8px}</style></head><body><section id="study"><div id="studyEngineV02984"><div id="studyProjectList"></div><div class="study-engine-grid"><div id="studyMainPanel"></div></div><div id="studyWrongPanel"></div><div id="studyHistoryPanel"></div></div></section></body></html>');
    await page.evaluate(({fixture,dark})=>{
      document.body.classList.toggle('dark',dark);
      const project={id:'p',name:'JLPT N3',category:'jlpt',status:'active',scheduleType:'manual',quizSize:20};
      const questions=Array.from({length:20},(_,i)=>({id:'q'+i,prompt:'日本語の問題 '+(i+1),choices:['答え','違う答え','別の答え','最後の答え'],answerIndex:0,explanation:'정답은 ①입니다.',type:'文法',difficulty:'medium'}));
      questions[9]={...fixture.q10,answerIndex:0};questions[14]={...fixture.q15,answerIndex:1};
      const answers=Array(20).fill(0);for(const i of [3,5,9,14,18])answers[i]=3;answers[9]=1;
      window.state={learningProjects:[project],learningQuizzes:[{id:'quiz006',projectId:'p',title:'JLPT N3 #006',date:'2026-10-12',status:'completed',questions,answers,total:20,score:75,correctCount:15}],learningWrongAnswers:[],unrelated:{kept:true}};
      window.testWrites=0;window.failSave=false;window.savedFixture=null;
      window.commit=()=>{testWrites++;if(failSave)return false;savedFixture=structuredClone(state);return true;};
      window.confirm=()=>window.acceptConfirm!==false;window.alert=message=>{window.testAlert=message};
    },{fixture,dark});
    await page.addScriptTag({content:source.replace(/\r?\n  boot\(\);/,'\n  window.quiz210Tab=tab=>{activeStudyTab=tab;renderLearning(false)};\n  style();ensureLearningState();activeProjectId="p";activeQuizId="quiz006";\n  [3,5,9,14,18].forEach(i=>upsertWrongAnswer(state.learningProjects[0],state.learningQuizzes[0],state.learningQuizzes[0].questions[i],state.learningQuizzes[0].answers[i]));\n  renderLearning(false);')});
    // Result page: submit pending note, cancel acceptance, then accept.
    const dispute=()=>page.locator('#studyQuizDetail [data-dispute-index="14"]');
    await dispute().locator('summary').click();await dispute().locator('textarea').fill('해설의 두 번째 항목은 駅の前に(④)입니다.');
    await dispute().locator('[data-dispute-submit]').click();
    assert.equal(await page.evaluate(()=>state.learningQuizzes[0].regradeNotes[0].status),'pending');
    await page.evaluate(()=>{window.acceptConfirm=false});await dispute().locator('summary').click();await dispute().locator('[data-dispute-accept]').click();
    assert.equal(await page.evaluate(()=>testWrites),1);
    await page.evaluate(()=>{window.acceptConfirm=true});await dispute().locator('[data-dispute-accept]').click();
    assert.ok((await page.locator('#studyQuizDetail').innerText()).includes('표시 15/20 → 재채점 16/20'));
    // Wrong-answer page: the accepted Q15 is excluded, Q10 can be disputed here.
    await page.evaluate(()=>quiz210Tab('wrong'));
    assert.equal(await page.locator('.study-wrong-row').count(),4);
    const wrong=()=>page.locator('#studyWrongPanel [data-dispute-index="9"]');
    await wrong().locator('summary').click();await wrong().locator('textarea').fill('ように와 ために 모두 자연스럽습니다.');await wrong().locator('[data-dispute-submit]').click();
    await wrong().locator('summary').click();await wrong().locator('[data-dispute-accept]').click();
    assert.equal(await page.locator('.study-wrong-row').count(),3);
    await page.evaluate(()=>quiz210Tab('board'));
    assert.ok((await page.locator('#studyQuizDetail').innerText()).includes('표시 15/20 → 재채점 17/20'));
    const saved=await page.evaluate(()=>({quiz:state.learningQuizzes[0],wrongCount:state.learningWrongAnswers.length,writes:testWrites,saved:savedFixture,copy:HANI_STUDY_V02984_TEST.quizTutorReviewText(state.learningQuizzes[0]),overflow:document.documentElement.scrollWidth>innerWidth}));
    assert.equal(saved.quiz.score,75);assert.equal(saved.quiz.correctCount,15);assert.equal(saved.quiz.regradeNotes.length,4);assert.equal(saved.wrongCount,5);assert.equal(saved.writes,4);
    assert.match(saved.copy,/이의제기: 수락됨/);assert.equal(saved.overflow,false);
    // Read-back after normalization, and a rejected save must keep UI/records unchanged.
    await page.evaluate(()=>{state.learningQuizzes[0]=HANI_STUDY_V02984_TEST.normalizeQuiz(savedFixture.learningQuizzes[0]);quiz210Tab('board');window.failSave=true});
    const failed=()=>page.locator('#studyQuizDetail [data-dispute-index="3"]');
    await failed().locator('summary').click();await failed().locator('textarea').fill('저장 실패 재현');await failed().locator('[data-dispute-submit]').click();
    assert.equal(await page.evaluate(()=>state.learningQuizzes[0].regradeNotes.length),4);
    assert.ok((await page.locator('#studyQuizDetail').innerText()).includes('재채점 17/20'));
    assert.deepEqual(errors,[]);
    await page.locator('#studyQuizDetail').screenshot({path:path.join(evidence,`${width}-${dark?'dark':'light'}.png`)});
    results.push({width,dark,status:'PASS',writes:saved.writes,score:'15/20 → 17/20'});await context.close();
  }
  fs.writeFileSync(path.join(evidence,'ui-results.json'),JSON.stringify(results,null,2));return results;
}
module.exports={run};
if(require.main===module)(async()=>{
  const {chromium}=require(process.argv[2]);let browser;
  try{browser=await chromium.launch({executablePath:process.argv[3],headless:true});console.log(await run(browser));}
  finally{await browser?.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
