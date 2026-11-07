import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {installCloudTransport} from './hani-cloud-transport-fixture.cjs';
import {projectPreStudyRetrySource} from './hani-study-retry-source.cjs';

const source = fs.readFileSync(new URL('../hani-study-v02984.js', import.meta.url), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const questions = ['빛의 굴절을 설명하는 조건은?', '식물의 광합성에 필요한 것은?', '삼각형의 내각 합은 얼마인가?', '지구의 자전으로 나타나는 현상은?', '물질의 밀도를 계산하는 방법은?'].map((prompt, i) => ({
  prompt, choices:[`조건 ${i}`,`가정 ${i}`,`결론 ${i}`,`예외 ${i}`], answer_index:0, explanation:'첫 번째 조건에서만 성립합니다.', type:`concept${i}`, topic:`topic${i}`,
}));
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture({mode = 'ok', projects, quizzes = [], now = '2026-11-05T03:00:00Z', category = 'other', commitOk = true, boot = false} = {}) {
  let clock = Date.parse(now), calls = 0, saves = 0, queries = 0, serial = 0, gate;
  let currentMode = mode, generatedQuestions = questions;
  const storageWrites = [], lifecycle = new Map(), requestBodies = [];
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
  const project = {id:'p', name:'주간 학습', category, status:'active', scheduleType:'weekly', quizSize:5, createdAt:'2026-10-06T15:30:00Z'};
  const state = {learningProjects:projects || [project], learningQuizzes:structuredClone(quizzes), learningWrongAnswers:[]};
  const nodes = new Map();
  const main = {html:'', querySelectorAll:() => [], set innerHTML(html) {
    this.html = html;
    nodes.delete('#studyGenerateQuiz');
    if (html.includes('id="studyGenerateQuiz"')) nodes.set('#studyGenerateQuiz', {events:{}, addEventListener(type, fn) { this.events[type] = fn; }});
  }, get innerHTML() { return this.html; }};
  nodes.set('#studyMainPanel', main);
  if (boot) { nodes.set('#hani-study-v02984-style', {}); nodes.set('#studyProjectList', {innerHTML:''}); }
  const forbidden = () => assert.fail('unexpected timer, overlay, dialog or direct storage mutation');
  const query = {select(){return this;}, eq(){return this;}, order(){return this;}, limit(){
    queries++;
    if (currentMode === 'news-throw') return Promise.reject(new TypeError('Failed to fetch'));
    return Promise.resolve({data:[], error:currentMode === 'news-error' ? {message:'unavailable'} : null});
  }};
  const context = vm.createContext({window:{}, state, Date:FixedDate, URL, Response, console:{info(){},warn(){},error(){}}, structuredClone,
    document:{title:'Study fixture', visibilityState:'visible', querySelector:selector => nodes.get(selector) || null, querySelectorAll:() => [],
      addEventListener(type, fn) { const rows = lifecycle.get(type) || []; rows.push(fn); lifecycle.set(type, rows); }},
    localStorage:{setItem:(key, value) => storageWrites.push([key,value]), removeItem:forbidden, clear:forbidden},
    sessionStorage:{setItem:forbidden, removeItem:forbidden, clear:forbidden},
    setTimeout:forbidden, setInterval:forbidden, requestAnimationFrame:fn=>fn(), alert:forbidden, confirm:forbidden,
    today:() => '2026-11-04', uid:() => `fixture-${++serial}`,
    commit:() => { saves++; if (!commitOk) return false; storageWrites.push(['hani_os_life_v23', JSON.stringify(state)]); return true; },
    cloudUser:mode === 'login' ? null : {id:'fixture'}, cloudConfig:() => ({url:'https://example.test',key:'fixture-public'}),
    cloudClient:{from:() => query, auth:{getSession:async() => ({data:{session:currentMode === 'session' ? null : {access_token:'fixture-session'}},error:currentMode === 'session-error' ? new Error('Invalid Refresh Token') : null})}},
    fetch:async(_url,options) => {
      calls++;
      requestBodies.push(JSON.parse(options.body));
      if (currentMode === 'pending') await new Promise(resolve => { gate = resolve; });
      if (currentMode === 'network') throw new TypeError('Failed to fetch');
      if (currentMode === 'quality') return new Response(JSON.stringify({ok:false,error:'QUIZ_QUALITY_REJECTED',message:'internal <unsafe>'}), {status:502});
      if (currentMode === 'unauthorized') return new Response(JSON.stringify({ok:false,error:'UNAUTHORIZED'}), {status:401});
      if (currentMode === 'empty') return new Response(JSON.stringify({ok:true,quiz:{questions:[]}}));
      return new Response(JSON.stringify({ok:true,quiz:{questions:generatedQuestions}}));
    },
  });
  installCloudTransport(context, {endpoint:'hani-learning-quiz',token:'fixture-session'});
  const instrumented = source.replace(/\r?\n  boot\(\);/, `
    this.studyFixture = {generateTodayQuiz, maybeAutoGenerate, retryWeeklyStudies, studyWeekStart, generationKey,
      generationDate, generationPeriodQuiz, shouldGenerateForDate, studyFailureReason, weeklyStudyStatus,
      generationFailures, autoGenerationAttempts, bindStudyLifecycle, renderLearning, patchCoreHooks,
      render: () => { activeProjectId = 'p'; renderMain(false); }};${boot ? '\n  boot();' : ''}`);
  assert.notEqual(instrumented, source, 'only boot call replaced for fixture control');
  vm.runInContext(instrumented, context);
  const api = context.studyFixture;
  api.render();
  return {api, context, state, project:state.learningProjects[0], main, lifecycle, storageWrites, requestBodies,
    calls:() => calls, saves:() => saves, queries:() => queries, mode:value => { currentMode = value; },
    questions:value => { generatedQuestions = value; },
    advance:value => { clock = Date.parse(value); }, release:() => gate?.(),
    click:() => nodes.get('#studyGenerateQuiz')?.events.click(),
    visible:value => { context.document.visibilityState = value; for (const fn of lifecycle.get('visibilitychange') || []) fn(); },
    async idle() { for (let i=0;i<20;i++) await tick(); },
  };
}

for (const [mode, category, reason] of [
  ['login','other',/로그인이 필요해요/], ['session','other',/로그인이 필요해요/], ['session-error','other',/로그인이 필요해요/], ['unauthorized','other',/로그인이 필요해요/],
  ['news-error','economy',/뉴스를 아직 못 불러왔어요/], ['news-throw','economy',/뉴스를 아직 못 불러왔어요/], ['ok','economy',/뉴스를 아직 못 불러왔어요/],
  ['quality','other',/문제 검사에서 빠졌어요/], ['empty','other',/문제 검사에서 빠졌어요/], ['network','other',/연결이 원활하지 않아요/],
]) test(`failure UI: ${mode}/${category}`, async() => {
  const f = fixture({mode,category}), before = JSON.stringify(f.state);
  await f.api.retryWeeklyStudies();
  assert.match(f.main.innerHTML,/생성 실패:/); assert.match(f.main.innerHTML, reason); assert.match(f.main.innerHTML,/다시 시도/);
  assert.doesNotMatch(f.main.innerHTML,/<unsafe>|internal|QUIZ_QUALITY_REJECTED/);
  assert.equal(f.saves(),0); assert.equal(f.storageWrites.length,0); assert.equal(JSON.stringify(f.state),before);
  const calls = f.calls(), queries = f.queries();
  for (let i=0;i<8;i++) { f.api.render(); await f.api.retryWeeklyStudies(); }
  assert.equal(f.calls(),calls); assert.equal(f.queries(),queries,'no rerender retry loop');
});

test('retry button runs the real API and existing save once; double taps stay locked', async() => {
  const f = fixture({mode:'quality'});
  await f.api.retryWeeklyStudies(); assert.equal(f.calls(),1);
  f.mode('pending'); const retry = f.click(); await tick();
  assert.match(f.main.innerHTML,/이번 주 학습 준비 중/);
  assert.match(f.main.innerHTML,/id="studyGenerateQuiz"[^>]*disabled/);
  for (let i=0;i<20;i++) f.click();
  assert.equal(f.calls(),2); f.release(); await retry; await f.idle();
  assert.equal(f.state.learningQuizzes.length,1); assert.equal(f.saves(),1);
  assert.deepEqual(f.storageWrites.map(([key]) => key), ['hani_os_life_v23']);
  assert.equal(f.state.learningQuizzes[0].scheduledDate,'2026-11-05','KST date wins over host today');
  assert.equal(f.requestBodies[1].local_date,'2026-11-05','generation request also uses KST');
  assert.match(f.main.innerHTML,/이번 주 학습 준비 완료/);
  await f.api.generateTodayQuiz(f.project,{automatic:true}); await f.api.retryWeeklyStudies();
  assert.equal(f.calls(),2); assert.equal(f.saves(),1);
});

test('failed save rolls back through the unchanged persistence function', async() => {
  const f=fixture({commitOk:false}); await f.api.retryWeeklyStudies();
  assert.match(f.main.innerHTML,/저장하지 못했어요/); assert.equal(f.state.learningQuizzes.length,0);
  assert.equal(f.saves(),1); assert.equal(f.storageWrites.length,0);
});

test('any existing quiz in this KST week suppresses manual, auto and visibility regeneration', async() => {
  for (const status of ['pending','in_progress','completed']) {
    const original={id:'kept',projectId:'p',date:'2026-11-02',status,questions:[],answers:[],score:0};
    const f=fixture({quizzes:[original]}), before=JSON.stringify(f.state);
    f.api.bindStudyLifecycle(); await f.api.generateTodayQuiz(f.project); await f.api.retryWeeklyStudies();
    f.visible('hidden'); f.visible('visible'); await f.idle();
    assert.equal(f.calls(),0); assert.equal(f.saves(),0); assert.equal(JSON.stringify(f.state),before);
    assert.match(f.main.innerHTML,/이번 주 학습 준비 완료/);
  }
});

test('next visible visit retries once, repeated visible/rerender events do not', async() => {
  const f=fixture({mode:'quality'}); f.api.bindStudyLifecycle();
  await f.api.retryWeeklyStudies(); assert.equal(f.calls(),1);
  for(let i=0;i<20;i++) { f.visible('visible'); f.api.render(); }
  await f.idle(); assert.equal(f.calls(),1);
  f.visible('hidden'); f.visible('visible'); await f.idle(); assert.equal(f.calls(),2);
  for(let i=0;i<10;i++) f.visible('visible'); await f.idle(); assert.equal(f.calls(),2);
  f.mode('ok'); f.visible('hidden'); f.visible('visible'); await f.idle();
  assert.equal(f.calls(),3); assert.equal(f.saves(),1);
  for(let i=0;i<10;i++) { f.visible('hidden'); f.visible('visible'); } await f.idle();
  assert.equal(f.calls(),3); assert.equal(f.lifecycle.get('visibilitychange').length,1);
});

test('reload starts with fresh retry memory and keeps existing records', async() => {
  const first=fixture({mode:'quality'}); await first.api.retryWeeklyStudies();
  const reload=fixture({quizzes:first.state.learningQuizzes});
  assert.equal(reload.api.generationFailures.size,0); await reload.api.retryWeeklyStudies();
  assert.equal(reload.calls(),1); assert.equal(reload.saves(),1);
});

test('the real boot path tries once; loading the script twice binds no extra lifecycle', async() => {
  const f=fixture({mode:'quality',boot:true}); await f.idle();
  assert.equal(f.calls(),1); assert.match(f.main.innerHTML,/생성 실패:/);
  vm.runInContext(source,f.context); await f.idle();
  assert.equal(f.calls(),1); assert.equal(f.lifecycle.get('visibilitychange').length,1);
  f.mode('ok'); f.visible('hidden'); f.visible('visible'); await f.idle();
  assert.equal(f.calls(),2); assert.equal(f.saves(),1);
});

test('a busy daily quiz releases the same lock before weekly automatic work starts', async() => {
  const weekly={id:'p',name:'weekly',category:'other',status:'active',scheduleType:'weekly',quizSize:5,createdAt:'2026-10-01T00:00:00Z'};
  const daily={...weekly,id:'daily',name:'daily',scheduleType:'daily'};
  const f=fixture({mode:'quality',projects:[daily,weekly]});
  assert.equal(f.api.maybeAutoGenerate(daily),true); await f.api.retryWeeklyStudies(); await f.idle();
  assert.equal(f.calls(),2); assert.equal(f.saves(),0);
  await f.api.retryWeeklyStudies(); assert.equal(f.calls(),2);
});

test('missed anniversary day is eligible; all active weekly projects run serially even on another tab', async() => {
  const projects=['p','second','paused','manual','ended'].map(id=>({id,name:id,category:'other',quizSize:5,createdAt:'2026-10-06T15:30:00Z',
    scheduleType:id==='manual'?'manual':'weekly', status:id==='paused'?'paused':id==='ended'?'completed':'active'}));
  const f=fixture({projects});
  assert.equal(f.api.shouldGenerateForDate(f.project),true,'Thursday catch-up after Wednesday anniversary');
  vm.runInContext('renderAll=function(){};renderHome=function(){};',f.context); f.api.patchCoreHooks();
  f.context.renderAll(); f.context.renderAll(); await f.idle();
  assert.equal(f.calls(),2); assert.equal(f.saves(),2);
  assert.deepEqual(Array.from(f.state.learningQuizzes,quiz=>quiz.projectId),['p','second']);
});

test('login after boot can retry without reload or an unbounded loop', async() => {
  const f=fixture({mode:'login'}); await f.api.retryWeeklyStudies(); assert.match(f.main.innerHTML,/로그인/);
  f.context.cloudUser={id:'fixture'}; f.mode('ok'); await f.api.retryWeeklyStudies();
  assert.equal(f.calls(),1); assert.equal(f.saves(),1);
  await f.api.retryWeeklyStudies(); assert.equal(f.calls(),1);
});

test('KST Monday boundary, year boundary and createdAt near UTC midnight', async() => {
  const f=fixture({now:'2026-11-08T14:59:59Z'});
  assert.equal(f.api.studyWeekStart(),'2026-11-02'); assert.equal(f.api.generationKey(f.project),'p|2026-11-02');
  f.advance('2026-11-08T15:00:00Z'); assert.equal(f.api.studyWeekStart(),'2026-11-09');
  assert.equal(f.api.generationKey(f.project),'p|2026-11-09');
  for(const [date,start] of [['2026-01-01','2025-12-29'],['2026-11-08','2026-11-02'],['2026-11-09','2026-11-09']]) assert.equal(f.api.studyWeekStart(date),start);
  assert.equal(f.api.shouldGenerateForDate({...f.project,createdAt:'2026-11-08T15:30:00Z'},'2026-11-08'),false);
  assert.equal(f.api.shouldGenerateForDate({...f.project,createdAt:'2026-11-08T15:30:00Z'},'2026-11-09'),true);
  await f.api.retryWeeklyStudies(); assert.equal(f.saves(),1);
  f.questions(questions.map((question,index)=>({...question,prompt:['민주주의에서 선거의 역할은?', '수요와 가격의 관계를 설명해 보세요.', '은유와 직유의 차이는 무엇인가요?', '컴퓨터 메모리는 무엇을 보관할까요?', '언어를 배우는 효과적인 방법은?'][index],choices:['새로운 조건','특별한 상황','다른 결론','주의할 예외']})));
  f.advance('2026-11-15T15:00:00Z'); await f.api.retryWeeklyStudies(); assert.equal(f.saves(),2);
});

test('an incoming quiz while the API is pending prevents a duplicate save', async() => {
  const f=fixture({mode:'pending'}), run=f.api.retryWeeklyStudies(); await tick();
  f.state.learningQuizzes.push({id:'incoming',projectId:'p',date:'2026-11-03',status:'pending',questions:[],answers:[]});
  f.release(); await run;
  assert.equal(f.calls(),1); assert.equal(f.saves(),0); assert.equal(f.state.learningQuizzes.length,1);
});

test('visibility while in flight does not retry again after failure', async() => {
  const f=fixture({mode:'pending'}); f.api.bindStudyLifecycle(); const run=f.api.retryWeeklyStudies(); await tick();
  f.visible('hidden'); f.visible('visible'); f.mode('quality'); f.release(); await run;
  await f.api.retryWeeklyStudies(); assert.equal(f.calls(),1); assert.equal(f.saves(),0);
});

test('PATCH_ID owns one lifecycle binding; renders and retries add zero timers/listeners', async() => {
  const f=fixture({mode:'quality'}); f.api.bindStudyLifecycle();
  f.api.bindStudyLifecycle();
  for(let i=0;i<30;i++) { f.api.render(); await f.api.retryWeeklyStudies(); }
  assert.equal(f.lifecycle.size,1); assert.equal(f.lifecycle.get('visibilitychange').length,1);
  assert.equal(f.calls(),1); assert.equal(f.storageWrites.length,0);
  assert.equal((source.match(/\n    bindStudyLifecycle\(\);/g)||[]).length,1);
  assert.match(source,/if \(window\[PATCH_ID\]\) return;/);
});

test('baseline reproduces four missed weekly visits; current owner makes every visit eligible', () => {
  const old=projectPreStudyRetrySource(source), context=vm.createContext({window:{},state:{learningProjects:[],learningQuizzes:[],learningWrongAnswers:[]}});
  vm.runInContext(old.replace(/\r?\n  boot\(\);/,''),context);
  const previous=context.window.HANI_STUDY_V02984_TEST, current=fixture();
  const visits=['2026-10-08','2026-10-15','2026-10-22','2026-10-29'];
  assert.equal(visits.filter(date=>previous.shouldGenerateForDate(current.project,date)).length,0);
  assert.equal(visits.filter(date=>current.api.shouldGenerateForDate(current.project,date)).length,4);
});

test('weekly dashboard/task read model has no phantom generation after a prior-day quiz', () => {
  const f=fixture({quizzes:[{id:'existing',projectId:'p',date:'2026-11-02',status:'completed',questions:[],answers:[],score:0}]});
  const api=f.context.window.HANI_STUDY_V02984_TEST;
  assert.equal(api.derivedLearningTasks().length,0);
  assert.equal(api.derivedLearningTasks('2026-11-05').length,0);
  assert.equal(api.derivedLearningTasks('2026-11-09').filter(task=>task.sub==='생성 대상').length,1);
});

test('storage owners, protected version and Cloud/server files match the frozen baseline', () => {
  const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/study-retry-preservation.json',import.meta.url),'utf8'));
  for(const [name,expected] of Object.entries(baseline.functions)) {
    const fn=source.match(new RegExp(`^  (?:async )?function ${name}\\([^]*?(?=^  (?:async )?function |^  window\\.)`,'m'))?.[0];
    assert.ok(fn,name); assert.equal(hash(fn),expected,name+' unchanged');
  }
  for(const [file,expected] of Object.entries(baseline.files)) assert.equal(hash(fs.readFileSync(new URL('../'+file,import.meta.url))),expected,file+' unchanged');
  assert.doesNotMatch(source,/localStorage\.(?:setItem|removeItem|clear)|sessionStorage\.(?:setItem|removeItem|clear)/);
  assert.equal((source.match(/learningCommit\(/g)||[]).length,baseline.learningCommitCalls);
});
