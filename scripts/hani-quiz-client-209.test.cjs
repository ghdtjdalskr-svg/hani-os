const {installCloudTransport}=require('./hani-cloud-transport-fixture.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const {stripTypeScriptTypes} = require('node:module');
const client = fs.readFileSync('hani-study-v02984.js','utf8');
const edge = fs.readFileSync('supabase/functions/hani-learning-quiz/index.ts','utf8');
const prompts = ['PER은 주가와 무엇을 비교하나요?', 'PBR과 장부가치의 관계는?', 'EPS가 나타내는 뜻은?', '기준금리 인상은 대출 비용에 어떤 영향을 줄까요?', '채권가격과 금리는 어떤 관계인가요?', '원화 약세는 수입물가에 어떤 영향을 줄까요?', '인플레이션이 구매력에 미치는 영향은?', '분산투자는 개별 종목 위험을 어떻게 바꾸나요?', '예금의 이자 계산 방법을 고르세요.', '주주의 권리에 해당하는 것은?', '기업 매출과 이익의 차이를 설명하세요.', '현금흐름표에서 투자를 어디서 확인하나요?', '배당금의 의미를 고르세요.', '시가총액을 계산하는 방법은?', '거래량으로 알 수 있는 내용은?', '정책 변화에 따른 수요 효과는?', '원자재 가격이 제조 비용에 미치는 영향은?', '수출기업의 통화 위험을 설명하세요.', '실적 발표를 읽는 순서를 고르세요.', '경기 둔화가 고용에 미치는 경로는?'];
function fixture({newsCount=5, retry=false, noSources=false, nearNews=false}={}) {
  const state={learningProjects:[],learningQuizzes:[],learningWrongAnswers:[]};
  const before=JSON.stringify(state), requests=[];
  const node={innerHTML:'',querySelectorAll:()=>[]};
  const row={title:'중앙은행 금리 동결',summary:'중앙은행은 물가 흐름을 관찰하며 기준금리를 동결했습니다.',published_at:new Date().toISOString(),source_name:'경제 기관',source_url:'https://example.test/news'};
  const make=(body,count=newsCount)=>prompts.slice(0,body.project.quiz_size).map((prompt,i)=>{
    const s=body.question_sources[0], isNews=!!s&&i<count;
    if(body.project.category==='jlpt')return {type:'文法',topic:'日本語',difficulty:'medium',prompt:['会議','予約','連絡','研究','環境','説明','学校','旅行','仕事','健康','文化','交通','技術','発表','計画','準備','資料','受付','変更','相談'][i]+'について、最も適切な説明を選んでください。',choices:['正しい説明','反対の説明','関係のない説明','断定できる利益'],answer_index:0,explanation:'정답은 ①입니다.'};
    return {type:isNews?'Cause & Effect':'Definition',topic:prompt, difficulty:'easy',
      prompt:isNews?`[실제 뉴스 · 자료 기준일 ${s.published_at.slice(0,10)}]\n${s.title}\n출처: ${s.source_name}\n[뉴스 요약] ${s.summary.slice(0,260)}\n[질문] ${prompt}`:prompt,
      choices:['정확한 설명','반대 설명','무관한 설명','보장된 수익'],answer_index:0,
      explanation:isNews?`동결은 기준금리가 유지된다는 뜻입니다. [${s.source_id}] ${s.source_name} · ${s.published_at.slice(0,10)} · ${s.source_url}`:'핵심 개념을 확인합니다. 다른 조건이 일정할 때 적용합니다.'};
  });
  let handler, modelBody;
  const server=vm.createContext({URL,Request,Response,Date,console,
    Deno:{env:{get:k=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'test-public',OPENAI_API_KEY:'test-only',HANI_OWNER_USER_ID:'test-user'}[k])},serve:fn=>{handler=fn}},
    createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test-user'}},error:null})}}),
    fetch:async(_url,options)=>{const call=JSON.parse(options.body);const body=JSON.parse(call.input);if(call.text.format.name==='hani_quiz_blind_verification')return new Response(JSON.stringify({output_text:JSON.stringify({checks:body.questions.map((_,i)=>({question_index:i,correct_indices:[0],ambiguous:false,jlpt_level:body.target_level?'N3':'NA',reason:'Fixed fixture solution'}))})}));modelBody=call;return new Response(JSON.stringify({output_text:JSON.stringify({questions:make(body)})}));}
  });
  vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/gm,'')+'\nthis.api={isBasicEconomyProject,newsBalance};'),server);
  const query={select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:noSources?[]:[row],error:null})}};
  const context=vm.createContext({window:{},state,URL,Date,console,crypto:require('node:crypto').webcrypto,
    document:{querySelector:s=>s==='#studyMainPanel'?node:null,querySelectorAll:()=>[]},
    cloudClient:{from:()=>query,auth:{getSession:async()=>({data:{session:{access_token:'test-session'}}})}},cloudUser:{id:'test-user'},cloudConfig:()=>({url:'https://example.test',key:'test-public'}),
    fetch:async(url,options)=>{
      const body=JSON.parse(options.body);requests.push(body);
      if(retry){let questions=make(body,requests.length===1?newsCount:0);if(requests.length===1)questions=questions.slice(0,-1);else questions=make({...body,project:{...body.project,quiz_size:20}},0).slice(-body.project.quiz_size);return {ok:true,json:async()=>({ok:true,quiz:{questions}})};}
      if(nearNews){const questions=make(body,body.project.quiz_size);return {ok:true,json:async()=>({ok:true,quiz:{questions}})};}
      return handler(new Request(url,{method:'POST',headers:{Authorization:'Bearer test-session'},body:options.body}));
    }
  });
  installCloudTransport(context,{endpoint:'hani-learning-quiz',token:'test-session'});
  vm.runInContext(client.replace(/\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n window.renderFixture=()=>{activeProjectId="p";renderMain();};\n})();'),context);
  return {api:context.window.HANI_STUDY_V02984_TEST,server:server.api,requests,state,node,render:context.window.renderFixture,before,get modelBody(){return modelBody}};
}
const basic={id:'p',category:'economy',name:'주식·경제·거시경제 기초',quizSize:20,scheduleType:'manual'};

test('client basic detection and quota match server; explicit advanced and unrelated levels remain unchanged',()=>{
  const f=fixture();
  for(const project of [basic,{...basic,name:'경제',level:'기초'},{...basic,name:'경제',difficulty:'beginner'},{...basic,name:'경제',focusAreas:['경제기초']},{...basic,level:'심화'},{...basic,category:'jlpt'}]){
    const wire={...project,focus_areas:project.focusAreas};
    assert.equal(f.api.isBasicEconomyProject(project),f.server.isBasicEconomyProject(wire));
    for(const size of [1,3,5,10,15,20]) {
      const expected=f.api.isBasicEconomyProject(project)?Math.floor(size/4):Math.ceil(size/3);
      assert.equal(f.api.newsMaterialMinimum(size,[{}],project),expected);
      assert.equal(f.api.newsMaterialMinimum(size,[],project),0);
    }
  }
});
test('actual client and server accept basic 20 with five news and fifteen concepts without writes',async()=>{
  const f=fixture();const questions=await f.api.quizApi(basic);
  assert.equal(questions.length,20);assert.equal(questions.filter(q=>q.type==='Cause & Effect').length,5);
  assert.equal(f.requests.length,1);assert.equal(f.requests[0].engine_contract.news_material_minimum,5);
  assert.equal(f.requests[0].engine_contract.news_material_maximum,5);assert.equal(f.requests[0].engine_contract.core_concept_minimum,7);
  assert.match(f.modelBody.instructions,/최소 7문제/);assert.match(f.modelBody.instructions,/최대 5문제/);
  assert.equal(JSON.stringify(f.state),f.before);
});
test('supported smaller basic sets use rounded-down news and rounded-up core coverage',async()=>{
  for(const size of [5,10,15]) {
    const f=fixture({newsCount:Math.floor(size/4)});
    assert.equal((await f.api.quizApi({...basic,quizSize:size})).length,size);
    assert.equal(f.requests[0].engine_contract.news_material_minimum,Math.floor(size/4));
    assert.equal(f.requests[0].engine_contract.core_concept_minimum,Math.ceil(size/3));
    assert.equal(JSON.stringify(f.state),f.before);
  }
});
test('actual client/server advanced quota stays seven; five news still fail',async()=>{
  const advanced={...basic,level:'심화'};
  const good=fixture({newsCount:7});assert.equal((await good.api.quizApi(advanced)).length,20);
  assert.equal(good.requests[0].engine_contract.news_material_minimum,7);assert.equal(good.requests[0].project.level,'심화');
  assert.equal(good.requests[0].engine_contract.core_concept_minimum,undefined);
  const bad=fixture();await assert.rejects(bad.api.quizApi(advanced),/실제 뉴스/);assert.equal(JSON.stringify(bad.state),bad.before);
});
test('partial retry preserves basic level and caps one-question request at zero news',async()=>{
  const f=fixture({retry:true});assert.equal((await f.api.quizApi(basic)).length,20);
  assert.equal(f.requests.length,2);assert.equal(f.requests[1].project.quiz_size,1);
  assert.equal(f.requests[1].project.level,'basic');assert.equal(f.requests[1].engine_contract.news_material_minimum,0);
  assert.equal(f.requests[1].engine_contract.news_material_maximum,0);assert.equal(f.requests[1].engine_contract.core_concept_minimum,1);
  assert.equal(JSON.stringify(f.state),f.before);
});
test('basic excess-news responses cannot fill the set, including fallback; state stays intact',async()=>{
  const f=fixture({nearNews:true});await assert.rejects(f.api.quizApi(basic),/유효한 문제|뉴스/);
  assert.equal(f.requests.length,8);assert.equal(JSON.stringify(f.state),f.before);
});
test('no sources warn before generation, JLPT still works; guide reflects basic versus other levels',async()=>{
  for(const project of [basic,{...basic,category:'jlpt'}]){
    const f=fixture({noSources:true});
    if(project.category==='economy') {await assert.rejects(f.api.quizApi(project),/뉴스가 없습니다/);assert.equal(f.requests.length,0);}
    else {assert.equal((await f.api.quizApi(project)).length,20);assert.equal(f.requests[0].engine_contract.news_material_minimum,0);}
    assert.equal(JSON.stringify(f.state),f.before);
  }
  const f=fixture();
  f.state.learningProjects=[basic];f.render();assert.match(f.node.innerHTML,/약 1\/4 이내/);assert.match(f.node.innerHTML,/핵심 개념.*약 1\/3 이상/);
  f.state.learningProjects=[{...basic,name:'경제 심화'}];f.render();assert.match(f.node.innerHTML,/약 1\/3 이상을 실제 사례/);assert.doesNotMatch(f.node.innerHTML,/약 1\/4/);
  f.state.learningProjects=[{...basic,category:'jlpt'}];f.render();assert.doesNotMatch(f.node.innerHTML,/약 1\/4/);
  assert.equal(f.requests.length,0);
});
