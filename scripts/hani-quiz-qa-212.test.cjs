// Execute the real client and authenticated Edge handler, replacing only I/O/model.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const test=require('node:test'),{stripTypeScriptTypes}=require('node:module');
const fixture=JSON.parse(fs.readFileSync('scripts/fixtures/quiz-qa-212.json','utf8'));
const client=fs.readFileSync('hani-study-v02984.js','utf8');
const edge=fs.readFileSync('supabase/functions/hani-learning-quiz/index.ts','utf8');
const now=Date.parse('2026-10-15T09:00:00Z'),day=new Date(now-86400000).toISOString();
class FixedDate extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const plain=x=>JSON.parse(JSON.stringify(x));
const clone=x=>structuredClone(x);
function archive(){
  const channels=Object.fromEntries(Object.entries(fixture.channels).map(([key,issue])=>[key,[clone(issue)]]));
  return [{post_type:'WEEKLY',title:'주간 시장 브리핑',summary:'이번 주 환율과 물가 흐름을 점검한다.',published_at:day,source_verified:true,
    payload:{company_followup:{version:1,channels},weekly_brief:{macro_flow:['금리 동결과 물가 흐름']},sources:[{title:'시장 통계 자료',url:'https://example.test/market'}]}},
    {post_type:'INTEREST',title:'현대자동차 수출 수요',summary:'자동차 수출 증가와 환율 변동이 매출에 미치는 영향을 점검한다.',event_at:day,published_at:day,source_verified:true,source_name:'자동차 공시',source_url:'https://example.test/auto'}];
}
const concepts=['예금 이자는 원금과 무엇으로 계산하나요?','분산투자가 줄이는 위험은 무엇인가요?','채권의 고정 이자는 어떤 현금흐름인가요?','주주의 의결권은 무엇을 뜻하나요?','매출과 순이익을 구분하는 기준은 무엇인가요?','장부가치와 시가총액을 비교하는 비율은 무엇인가요?','주당순이익과 주가를 비교하는 비율은 무엇인가요?','유동성 위험은 무엇을 뜻하나요?','신용등급은 어떤 정보를 나타내나요?','기회비용은 어떤 선택의 비용인가요?','복리와 단리의 계산상 차이는 무엇인가요?','자산과 부채가 재무상태표에서 어떻게 다른가요?','실질 구매력이 줄어드는 이유는 무엇인가요?','경기 둔화는 고용에 어떤 경로로 영향을 주나요?','거래량은 무엇을 측정하나요?','배당금은 어떤 재원으로 지급되나요?','회계상 감가상각의 목적은 무엇인가요?','현금흐름표는 어떤 자금 이동을 보여주나요?','환율과 수입 원가는 어떤 관계인가요?','부채 이자와 영업이익을 어떻게 구분하나요?'];
const newsQuestions=['공급 계약이 늘어난 반도체 업체의 생산 능력 점검이 필요한 이유는?','전장 설비 투자 발표에서 단기 지출과 장기 생산 능력을 어떻게 구분하나요?','데이터센터 확장에 필요한 전력 공급이 사업 비용에 미치는 경로는?','기업용 AI 모델의 요금 변화가 도입 기업의 비용 구조에 미치는 영향은?','정책금리 동결 뒤 가계와 기업이 점검할 차입 조건은?','자동차 수출 증가와 환율 변동을 매출 판단에 함께 고려하는 이유는?','주간 물가 흐름과 금리 동결을 기업 원가 해석에 어떻게 연결하나요?'];
function modelQuestions(body,newsCount=7){
  return Array.from({length:body.project.quiz_size},(_,i)=>{
    const source=body.question_sources[i%body.question_sources.length],isNews=!!source&&i<newsCount;
    return {type:isNews?'Current Issue':'multiple_choice',topic:isNews?source.title:concepts[i],difficulty:i%2?'easy':'medium',
      prompt:isNews?`[실제 뉴스 · 자료 기준일 ${source.published_at.slice(0,10)}]\n${source.title}\n출처: ${source.source_name}\n[질문] ${newsQuestions[i%newsQuestions.length]}`:concepts[i],
      choices:['조건과 인과 경로를 구분해 판단한다','모든 상황에서 수익을 보장한다','원가 변화와 매출은 항상 무관하다','근거 없이 주가 상승을 확정한다'],answer_index:0,
      // Omit date/name here intentionally; server canonical context must add archive metadata.
      explanation:isNews?`제시된 사건과 비용·수요의 연결을 구분해야 한다. 수익 보장은 주어진 자료에서 도출할 수 없다. [${source.source_id}] ${source.source_url}`:'정답은 ①입니다. 조건을 구분해서 판단합니다.'};
  });
}
function setup({rows=archive(),failFirst=false,alwaysTheory=false,queryError=false}={}){
  let handler,generations=0;const modelCalls=[],requests=[],responses=[],queries=[],alerts=[];
  const context=vm.createContext({URL,Request,Response,Date:FixedDate,console,
    Deno:{env:{get:key=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'public-fixture',OPENAI_API_KEY:'model-fixture',HANI_OWNER_USER_ID:'owner-fixture'}[key])},serve:fn=>{handler=fn;}},
    createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner-fixture'}},error:null})}}),
    fetch:async(url,options)=>{
      const call=JSON.parse(options.body),body=JSON.parse(call.input);modelCalls.push(call);
      if(call.text.format.name==='hani_quiz_blind_verification')return new Response(JSON.stringify({output_text:JSON.stringify({checks:body.questions.map((_,i)=>({question_index:i,correct_indices:[0],ambiguous:false,jlpt_level:'NA',reason:'Fixed independent fixture solution'}))})}));
      generations++;return new Response(JSON.stringify({output_text:JSON.stringify({questions:modelQuestions(body,alwaysTheory||(failFirst&&generations===1)?0:Math.max(7,body.engine_contract.news_material_minimum||0))})}));
    }
  });
  vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/gm,'')+'\nthis.api={effectiveProjectCategory,isBasicEconomyProject,hasNewsFocus,usesBasicNewsBalance,canonicalNewsContext,newsMaterialCount,newsMaterialDiagnostics};'),context);
  const state={learningProjects:[clone(fixture.project)],learningQuizzes:[],learningWrongAnswers:[],unrelated:{keep:true}},before=JSON.stringify(state);
  const node={innerHTML:'',querySelectorAll:()=>[]};let writes=0;
  const browser=vm.createContext({URL,Date:FixedDate,console,window:{},state,crypto:require('node:crypto').webcrypto,today:()=> '2026-10-15',alert:message=>alerts.push(message),
    document:{querySelector:selector=>selector==='#studyMainPanel'?node:null,querySelectorAll:()=>[]},commit:()=>{writes++;return true;},
    cloudClient:{auth:{getSession:async()=>({data:{session:{access_token:'session-fixture'}}})},from:table=>{
      assert.equal(table,'hani_newsroom_posts');const filters={};return {select(value){assert.match(value,/payload/);return this;},eq(key,value){filters[key]=value;return this;},order(){return this;},limit(n){queries.push({...filters,limit:n});return Promise.resolve({data:rows.filter(row=>!filters.post_type||row.post_type===filters.post_type).slice(0,n),error:queryError?{message:'fixture offline'}:null});}}}},
    cloudUser:{id:'owner-fixture'},cloudConfig:()=>({url:'https://example.test',key:'public-fixture'}),
    fetch:async(url,options)=>{requests.push(JSON.parse(options.body));const response=await handler(new Request(url,{method:'POST',headers:{Authorization:'Bearer session-fixture'},body:options.body}));responses.push(await response.clone().json());return response;}
  });
  vm.runInContext(client.replace(/\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n window.renderFixture=()=>{activeProjectId=state.learningProjects[0].id;renderMain();};\n window.generateFixture=async()=>{renderLearning=window.renderFixture;activeProjectId=state.learningProjects[0].id;await generateTodayQuiz(state.learningProjects[0]);};\n})();'),browser);
  return {api:browser.window.HANI_STUDY_V02984_TEST,server:context.api,state,before,requests,responses,queries,modelCalls,node,alerts,render:browser.window.renderFixture,generate:browser.window.generateFixture,
    get writes(){return writes;},run:body=>handler(new Request('https://example.test/quiz',{method:'POST',headers:{Authorization:'Bearer session-fixture'},body:JSON.stringify(body)}))};
}

test('unset/OTHER economy name and all six checked focus chips derive economy without changing stored fields',()=>{
  const f=setup();
  for(const name of ['주식/경제/거시경제','주식·경제·거시경제 기초','경제','주식'])for(const category of [undefined,'other','OTHER']){
    const p={...fixture.project,name,category},snapshot=JSON.stringify(p);
    assert.equal(f.api.normalizeProject(p).category,'economy');assert.equal(f.server.effectiveProjectCategory(p),'economy');
    assert.equal(f.api.newsMaterialMinimum(20,[{}],p),7);assert.equal(JSON.stringify(p),snapshot);
  }
  for(const focusAreas of [fixture.newsFocus,['주식·기업','시장해석']]){
    const p={name:'학습',category:'other',focusAreas};assert.equal(f.api.effectiveProjectCategory(p),'economy');assert.equal(f.server.effectiveProjectCategory({...p,focus_areas:focusAreas}),'economy');assert.equal(f.api.newsMaterialMinimum(20,[{}],p),7);
  }
  assert.equal(f.api.isBasicEconomyProject(fixture.project),true);assert.equal(f.api.usesBasicNewsBalance(fixture.project),false);
  assert.equal(f.api.newsMaterialMinimum(20,[{}],{...fixture.project,focusAreas:['경제기초']}),5);
  for(const category of ['jlpt','ai','certificate','university'])assert.equal(f.api.effectiveProjectCategory({...fixture.project,category}),category);
  assert.equal(f.api.effectiveProjectCategory({name:'독서 감상',category:'other'}),'other');assert.equal(JSON.stringify(f.state),f.before);assert.equal(f.writes,0);
});

test('archive extraction includes all five FU channels, market and company; date bounds and reference verification remain enforced',async()=>{
  const f=setup(),sources=plain(await f.api.loadQuizNewsSources());
  assert.deepEqual(new Set(sources.map(s=>s.material)),new Set(['semiconductor','lg','infra','frontier','world','macro','company']));
  assert.equal(sources.length,7);assert.equal(f.queries.length,2);assert.ok(f.queries.every(q=>q.user_id==='owner-fixture'));
  const valid=archive()[1],dated=days=>({...valid,event_at:new Date(now-days*86400000).toISOString(),title:'test '+days});
  assert.equal(f.api.newsroomQuestionSources([dated(21),dated(21.001),dated(-1),{...valid,source_verified:false},{...valid,source_url:'javascript:alert(1)'}],now).length,1);
  const weekly=archive()[0];weekly.payload.company_followup.channels.lg[0].source_verified=false;
  assert.equal(f.api.newsroomQuestionSources([weekly],now).some(s=>s.material==='lg'),false);
  assert.equal(JSON.stringify(f.state),f.before);
});

test('weekly FU and market survive sixty newer interest posts via reserved archive query and round robin',async()=>{
  const busy=Array.from({length:65},(_,i)=>({...archive()[1],published_at:new Date(now-i*1000).toISOString(),title:'자동차 공시 '+i,source_url:'https://example.test/busy/'+i}));
  const f=setup({rows:[...busy,archive()[0]]}),sources=plain(await f.api.loadQuizNewsSources());
  assert.equal(sources.length,18);for(const material of ['semiconductor','lg','infra','frontier','world','macro','company'])assert.ok(sources.some(s=>s.material===material),material);
});

test('actual client→server rejects a zero-news set, retries and returns 20 with >=7 dated/source-backed news questions',async()=>{
  const f=setup({failFirst:true}),questions=await f.api.quizApi(f.state.learningProjects[0]);
  assert.equal(questions.length,20);assert.equal(f.requests.length,2);assert.equal(f.responses[0].error,'QUIZ_NEWS_MATERIAL_MISSING');assert.equal(f.responses[0].validation.matched,0);assert.equal(f.responses[0].validation.required,7);
  for(const request of f.requests){assert.equal(request.project.category,'economy');assert.deepEqual(request.project.focus_areas,fixture.project.focusAreas);assert.equal(request.engine_contract.news_material_minimum,7);assert.equal(request.question_sources.length,7);assert.equal(request.engine_contract.news_material_maximum,undefined);}
  const news=questions.filter(q=>f.api.hasNewsMaterial(q,f.requests[1].question_sources));assert.equal(news.length,7);
  for(const q of news){assert.match(q.explanation,/2026-10-14/);assert.match(q.explanation,/https:\/\/example.test/);assert.notEqual(f.api.questionFocus(q.prompt),q.prompt);}
  assert.equal(f.state.learningProjects[0].category,'other');assert.equal(JSON.stringify(f.state),f.before);assert.equal(f.writes,0);
  f.render();assert.match(f.node.innerHTML,/ECONOMY/);assert.match(f.node.innerHTML,/약 1\/3 이상/);assert.doesNotMatch(f.node.innerHTML,/약 1\/4/);
});

test('server independently infers category and enforces focus quota even for absent/zero client contract',async()=>{
  for(const category of [undefined,'other'])for(const minimum of [undefined,0]){
    const f=setup({alwaysTheory:true}),sources=plain(f.api.newsroomQuestionSources(archive(),now));
    const response=await f.run({project:{...fixture.project,category,quiz_size:20,focus_areas:fixture.newsFocus},question_sources:sources,engine_contract:{news_material_minimum:minimum}});
    assert.equal(response.status,502);const result=await response.json();assert.equal(result.error,'QUIZ_NEWS_MATERIAL_MISSING');assert.equal(result.validation.required,7);assert.equal(result.validation.matched,0);assert.equal(result.db_write,false);
    const input=JSON.parse(f.modelCalls[0].input);assert.equal(input.project.category,'economy');assert.equal(input.engine_contract.news_material_minimum,7);
  }
});

test('eight rejected generations stay bounded, preserve all records and never save theory-only replacements',async()=>{
  const f=setup({alwaysTheory:true});await assert.rejects(f.api.quizApi(f.state.learningProjects[0]),/실제 뉴스 소재/);assert.equal(f.requests.length,8);assert.equal(f.responses.every(r=>r.error==='QUIZ_NEWS_MATERIAL_MISSING'),true);assert.equal(JSON.stringify(f.state),f.before);assert.equal(f.writes,0);
});

test('explanation requires archive source name and date in addition to source ID and URL',()=>{
  const f=setup(),sources=plain(f.api.newsroomQuestionSources(archive(),now));
  const generated=modelQuestions({project:{quiz_size:20},question_sources:sources})[0];
  const q=plain(f.server.canonicalNewsContext(generated,sources));
  assert.equal(f.server.newsMaterialCount([q],sources),1);assert.equal(f.api.hasNewsMaterial(q,sources),true);
  const s=sources[0];
  for(const [field,part] of [['explanation_date',s.published_at.slice(0,10)],['explanation_source_name',s.source_name]]){
    const bad={...q,explanation:q.explanation.replaceAll(part,'누락')};
    assert.equal(f.server.newsMaterialCount([bad],sources),0);assert.equal(f.api.hasNewsMaterial(bad,sources),false);
    assert.ok(f.server.newsMaterialDiagnostics([bad],sources)[0].missing.includes(field));
  }
});

test('server refill with accepted news can ask for zero more news while retaining focus and basic difficulty',async()=>{
  const f=setup({alwaysTheory:true}),sources=plain(f.api.newsroomQuestionSources(archive(),now));
  const response=await f.run({project:{...fixture.project,level:'basic',quiz_size:1,focus_areas:fixture.project.focusAreas},question_sources:sources,engine_contract:{news_material_minimum:0},generation_feedback:{attempt:2,accepted_prompts:['이미 통과한 뉴스 문항'],requested_count:1}});
  assert.equal(response.status,200);assert.equal((await response.json()).news_material_minimum,0);
  assert.equal(JSON.parse(f.modelCalls[0].input).project.level,'basic');
});

test('empty/stale sources show newsroom refresh instruction in the actual failure UI before any model call or save',async()=>{
  for(const rows of [[],archive().map(row=>({...row,published_at:'2026-09-01',event_at:'2026-09-01'}))]){
    const f=setup({rows});await f.generate();assert.equal(f.requests.length,0);assert.equal(f.modelCalls.length,0);assert.equal(f.writes,0);assert.equal(JSON.stringify(f.state),f.before);assert.match(f.node.innerHTML,/최근 21일.*뉴스가 없습니다.*뉴스룸을 갱신/);assert.match(f.node.innerHTML,/수동 생성 실패/);assert.equal(f.alerts.length,0);
    const response=await f.run({project:{...fixture.project,quiz_size:20},question_sources:[]});assert.equal(response.status,422);assert.equal((await response.json()).error,'QUIZ_NEWS_SOURCES_UNAVAILABLE');assert.equal(f.modelCalls.length,0);
  }
  const f=setup({queryError:true});await assert.rejects(f.api.quizApi(f.state.learningProjects[0]),/뉴스 조회에 실패/);assert.equal(f.requests.length,0);
});

test('canonical question renderer maps Korean chips and hides unknown values without changing historical questions',()=>{
  const f=setup(),quiz={id:'old-quiz',status:'completed',date:'2026-10-15',total:3,score:100,answers:[0,0,0],questions:['easy','medium','hard'].map((difficulty,i)=>({id:'q'+i,type:'multiple_choice',difficulty,prompt:'기존 질문 '+i,choices:['가','나','다','라'],answerIndex:0,explanation:'기존 해설'}))};
  const before=JSON.stringify(quiz),html=f.api.renderQuizDetail(fixture.project,quiz);
  for(const label of ['객관식','쉬움','보통','어려움'])assert.ok(html.includes('<span>'+label+'</span>'));
  assert.doesNotMatch(html,/multiple_choice|>easy<|>medium<|>hard</);assert.equal(JSON.stringify(quiz),before);
  assert.equal(f.api.questionChips({type:'unknown-type',difficulty:'unknown-difficulty'}),'');assert.equal(f.api.questionChips({type:'__proto__',difficulty:'constructor'}),'');
  for(const type of ['Definition','Cause & Effect','Scenario','Data Interpretation','Current Issue','Portfolio / Investment Decision','文法'])assert.ok(f.api.questionTypeLabel(type));
});
