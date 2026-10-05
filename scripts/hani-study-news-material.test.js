// CommonJS test, using the repository's supported .js tooling extension.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const client=fs.readFileSync('hani-study-v02984.js','utf8');
const day=new Date().toISOString(),old=new Date(Date.now()-30*86400000).toISOString();
const sources=[{post_type:'WEEKLY',published_at:day,payload:{company_followup:{version:1,channels:{semiconductor:[{title:'삼성전자 신규 공급 계약',summary:'삼성전자 공급 계약과 고객 수요 변화',sources:[{name:'공식 발표',url:'https://example.com/samsung'}]}],infra:[{title:'AWS 데이터센터 투자',summary:'AWS 데이터센터 투자 계획과 전력 수요',sources:[{name:'AWS',url:'https://example.com/aws'}]}],world:[{title:'중앙은행 정책금리 동결',summary:'정책금리 동결과 물가 전망',sources:[{name:'중앙은행',url:'https://example.com/rates'}]}]}}}},
  {post_type:'WEEKLY',title:'주간 거시 브리핑',summary:'물가와 환율',published_at:day,source_name:'통계기관',source_url:'',source_verified:true,payload:{sources:[{title:'통계기관 물가 자료',url:'https://example.com/macro'}],weekly_brief:{macro_flow:['물가 상승률 둔화','환율 움직임']}}},
  {title:'오래된 기사',summary:'오래된 상황',published_at:old,source_name:'기관',source_url:'https://example.com/old'},
  {title:'검증 거절 기사',summary:'잘못된 내용',published_at:day,source_verified:false,source_name:'기관',source_url:'https://example.com/rejected'},
  {title:'출처 없음',summary:'근거 없음',published_at:day}];
let rows=sources,queryError=null,requestMode='news',queries=0,requests=[];
const scenarios=['고객 인증을 통과한 생산업체의 공급 물량 증가는 매출에 어떻게 연결되는가?', '전력 요금이 오른 데이터센터의 운영 비용을 해석하는 방법은 무엇인가?', '금리를 동결한 중앙은행의 정책이 가계 대출 부담에 미치는 경로는?', '환율 변화가 원자재 수입 가격과 영업 이익률에 주는 영향을 고르시오.', '기업의 신규 투자 집행으로 감가상각비가 늘어날 때 손익 판단 기준은?'];
const articlePrompt=s=>`[실제 뉴스 · 자료 기준일 ${s.published_at.slice(0,10)}]\n${s.title}\n출처: ${s.source_name}\n${s.material==='macro'?'[저장된 브리핑 요약]':'[뉴스 요약]'} ${s.summary.slice(0,260)}\n[질문]`;
const state={learningProjects:[],learningQuizzes:[],learningWrongAnswers:[]};
const mainNode={innerHTML:'',querySelectorAll:()=>[]};
const snapshot=JSON.stringify(state);
const query={select(){return this},eq(key,id){assert.equal(key,'user_id');assert.equal(id,'fixture-user');return this},order(){return this},limit(){queries++;return Promise.resolve({data:rows,error:queryError})}};
const context=vm.createContext({window:{},state,document:{querySelector:s=>s==='#studyMainPanel'?mainNode:null,querySelectorAll:()=>[]},Date,URL,console,crypto:require('node:crypto').webcrypto,
  cloudClient:{from(table){assert.equal(table,'hani_newsroom_posts');return query},auth:{getSession:async()=>({data:{session:{access_token:'fixture-only'}}})}},cloudUser:{id:'fixture-user'},
  cloudConfig:()=>({url:'https://fixture.invalid',key:'fixture-only'}),
  fetch:async(_url,opts)=>{const b=JSON.parse(opts.body);requests.push(b);const questions=Array.from({length:b.project.quiz_size},(_,i)=>({prompt:`${requestMode==='news'&&b.question_sources.length?articlePrompt(b.question_sources[i%b.question_sources.length]):''} ${scenarios[i%scenarios.length]} ${requests.length}-${i}`,choices:['매출 증가','매출 감소','변화 없음','판단 불가'],answer_index:0,type:'Scenario',topic:'기업 사례',difficulty:'easy',explanation:requestMode==='news'&&b.question_sources.length?`사건과 원리 연결 [${b.question_sources[i%b.question_sources.length].source_id}] ${b.question_sources[i%b.question_sources.length].source_url}`:'기초 원리 설명'}));return {ok:true,json:async()=>({ok:true,quiz:{questions}})}},
});
// Execute the actual owner functions without booting the UI or invoking automatic generation.
vm.runInContext(client.replace(/\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n window.renderStudyFixture=()=>{activeProjectId="p";renderMain();};\n})();'),context);
const api=context.window.HANI_STUDY_V02984_TEST;
const project={id:'p',name:'경제 사례 학습',category:'economy',quizSize:5,scheduleType:'manual'};
(async()=>{
  const normalized=api.newsroomQuestionSources(rows);
  assert.equal(normalized.length,4);assert.match(normalized.find(s=>s.material==='macro').summary,/물가 상승률 둔화/);
  assert.deepEqual(Array.from(normalized,s=>s.source_id),['N1','N2','N3','N4']);
  assert.equal(api.newsMaterialMinimum(5,normalized),2);assert.equal(api.newsMaterialMinimum(20,normalized),7);
  assert.equal(api.hasNewsMaterial({prompt:'금리의 정의는?',explanation:'[N1] https://example.com/samsung'},normalized),false);
  const s=normalized[0],citation=`[${s.source_id}] ${s.source_url}`;
  assert.equal(api.hasNewsMaterial({prompt:s.title,explanation:citation},[s]),false,'Title and citation alone are not article context.');
  assert.equal(api.hasNewsMaterial({prompt:articlePrompt(s),explanation:citation},[s]),true);
  assert.equal(api.hasNewsMaterial({prompt:articlePrompt(s).replace(s.summary.slice(0,260),'가상 상황'),explanation:citation},[s]),false);
  assert.equal(api.hasNewsMaterial({prompt:articlePrompt(s).replace('자료 기준일','기사 발행일'),explanation:citation},[s]),false);
  assert.equal(api.questionFocus(articlePrompt(s)+' 매출에 미치는 영향은?'),'매출에 미치는 영향은?');
  assert.equal(api.questionFocus('기존 개념 질문은?'),'기존 개념 질문은?');
  const macro=normalized.find(x=>x.material==='macro');
  assert.equal(api.hasNewsMaterial({prompt:articlePrompt(macro).replace('[저장된 브리핑 요약]','[뉴스 요약]'),explanation:`[${macro.source_id}] ${macro.source_url}`},[macro]),false);
  assert.equal(api.newsroomQuestionSources([{...sources[0],source_verified:false}]).length,0);
  assert.equal(api.newsroomQuestionSources([{...sources[3],published_at:new Date(Date.now()+86400000).toISOString()}]).length,0);
  const questions=await api.quizApi(project);assert.equal(queries,1);assert.equal(questions.length,5);assert.equal(requests[0].engine_contract.news_material_minimum,2);assert.equal(questions[0].difficulty,'easy');
  assert.ok(questions.filter(q=>api.hasNewsMaterial(q,normalized)).length>=2);assert.equal(JSON.stringify(state),snapshot);
  requestMode='basic';requests=[];await assert.rejects(api.quizApi(project),/保存|유효한 문제|뉴스·기업/);assert.ok(requests.length<=8);assert.equal(JSON.stringify(state),snapshot);
  queryError={message:'fixture permission error'};requests=[];await assert.rejects(api.quizApi(project),/뉴스 조회에 실패/);assert.equal(requests.length,0);queryError=null;
  rows=[];requests=[];const fallback=await api.quizApi(project);assert.match(fallback[0].explanation,/뉴스 소재 안내/);assert.equal(requests[0].engine_contract.news_material_minimum,0);
  const before=queries;requests=[];await api.quizApi({...project,category:'jlpt'});assert.equal(queries,before);assert.equal(requests[0].question_sources.length,0);
  const edge=fs.readFileSync('supabase/functions/hani-learning-quiz/index.ts','utf8');
  let handler,modelRequest;
  const edgeContext=vm.createContext({URL,Date,Response,Request,console,
    createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'fixture-user'}},error:null})}}),
    Deno:{env:{get:()=> 'fixture-only'},serve:fn=>{handler=fn}},
    fetch:async(_url,opts)=>{modelRequest=JSON.parse(opts.body);const body=JSON.parse(modelRequest.input);return {ok:true,json:async()=>({output_text:JSON.stringify({questions:Array.from({length:body.project.quiz_size},()=>({type:requestMode==='definition'?'Definition':'Scenario',prompt:requestMode==='macro-rewrite'||requestMode==='definition'?articlePrompt(body.question_sources.find(s=>s.material==='macro')).replace('[저장된 브리핑 요약]','[뉴스 요약]').replace(body.question_sources.find(s=>s.material==='macro').summary.slice(0,260),'모델이 바꿔 쓴 요약')+' 물가와 환율의 변화가 수입 기업 비용에 미치는 영향은?':requestMode==='news'?articlePrompt(body.question_sources[0])+' 고객 수요와 매출의 관계는?':requestMode==='title-only'?body.question_sources[0].title:'기초 정의',explanation:requestMode==='macro-rewrite'||requestMode==='definition'?`[${body.question_sources.find(s=>s.material==='macro').source_id}] ${body.question_sources.find(s=>s.material==='macro').source_url}`:requestMode!=='basic'?`[N1] ${body.question_sources[0]?.source_url}`:'基本説明'}))})})}},
  });
  vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/m,'')),edgeContext);
  requestMode='news';const body={project:{name:'경제',category:'economy',quiz_size:5},question_sources:normalized,engine_contract:{news_material_minimum:2}};
  const request=()=>new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture-only'},body:JSON.stringify(body)});
  const good=await handler(request());assert.equal(good.status,200);assert.equal((await good.json()).news_material_minimum,2);assert.match(modelRequest.instructions,/난이도를 높이라는 요청이 아닙니다/);
  assert.match(modelRequest.instructions,/서버가.*요약 원문을 구성/);
  requestMode='macro-rewrite';const repaired=await handler(request());assert.equal(repaired.status,200);
  const repairedQuiz=(await repaired.json()).quiz;
  assert.match(repairedQuiz.questions[0].prompt,/\[저장된 브리핑 요약\]/);
  assert.ok(repairedQuiz.questions[0].prompt.includes(macro.summary.slice(0,260)));
  assert.ok(repairedQuiz.questions[0].prompt.endsWith('물가와 환율의 변화가 수입 기업 비용에 미치는 영향은?'));
  assert.equal(repairedQuiz.questions[0].prompt.includes('모델이 바꿔 쓴 요약'),false);
  requestMode='definition';assert.equal((await handler(request())).status,502,'Definition-only question cannot acquire real-news status through canonicalization.');
  requestMode='title-only';assert.equal((await handler(request())).status,502);
  requestMode='basic';const bad=await handler(request());assert.equal(bad.status,502);const rejected=await bad.json();assert.equal(rejected.error,'QUIZ_NEWS_MATERIAL_MISSING');
  assert.equal(rejected.validation.required,2);assert.equal(rejected.validation.matched,0);
  assert.deepEqual(Array.from(rejected.validation.questions[0].missing),['source_reference']);
  assert.equal(JSON.stringify(rejected).includes('fixture-only'),false,'Diagnostics must not expose credentials.');
  assert.equal(/localStorage\.(setItem|removeItem|clear)/.test(client),false);
  assert.equal(/\.from\([^)]*\)\s*\.\s*(insert|update|delete|upsert)/.test(edge),false);
  state.learningProjects=[project];const callsBefore=requests.length;context.window.renderStudyFixture();
  assert.match(mainNode.innerHTML,/난이도 설정은 유지/);assert.equal(requests.length,callsBefore,'Rendering manual project must not generate questions.');
  state.learningProjects=[{...project,category:'jlpt'}];context.window.renderStudyFixture();assert.doesNotMatch(mainNode.innerHTML,/약 1\/3/);
  console.log('PASS: actual client read/query, company/FU/macro extraction, freshness, quota, error/empty distinction, JLPT isolation, no state mutation; actual server handler quota pass/block with mocked model.');
})().catch(error=>{console.error(error);process.exitCode=1});
