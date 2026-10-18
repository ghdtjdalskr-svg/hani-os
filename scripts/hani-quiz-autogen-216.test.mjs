import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {stripTypeScriptTypes} from 'node:module';

const edge = fs.readFileSync('supabase/functions/hani-learning-quiz/index.ts','utf8');
const study = fs.readFileSync('hani-study-v02984.js','utf8');
const fixtures = JSON.parse(fs.readFileSync('scripts/fixtures/quiz-autogen-216.json','utf8'));
const plain = value => JSON.parse(JSON.stringify(value));
const ctx = vm.createContext({Deno:{serve(){}},console});
vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/gm,'') + '\nthis.api={validateVerifiedQuestions,validateQuestionConsistency,explanationAnswerIndices,canonicalNewsContext,newsMaterialCount,verificationPrompt,verificationSchema};'),ctx);
const api=ctx.api;
const checks=(questions,category)=>questions.map((_,i)=>({question_index:i,correct_indices:[0],ambiguous:false,jlpt_level:category==='jlpt'?'N3':'NA',reason:'発問の条件で全選択肢を確認し、0番だけが成立する。'}));

for(const category of ['economy','jlpt'])test(`${category}: realistic blind output and distractor explanations must not reject the entire batch`,()=>{
  const questions=fixtures[category].map(q=>category==='economy'?api.canonicalNewsContext(q,[fixtures.source]):q);
  const result=api.validateVerifiedQuestions(questions,checks(questions,category),category,'N3');
  console.log(`${category} rejection diagnostics: ${JSON.stringify(result.rejected)}`);
  assert.equal(result.questions.length,questions.length,JSON.stringify(result.rejected));
  assert.deepEqual(plain(result.rejected),[]);
  if(category==='economy')assert.equal(api.newsMaterialCount(result.questions,[fixtures.source]),1);
});

test('positive controls exclude schema, field-name, index, news-text and level mismatches',()=>{
  for(const category of ['economy','jlpt']){
    const questions=fixtures[category].map(q=>({...q,explanation:'정답은 ①입니다. 근거를 확인했습니다.'}));
    assert.equal(api.validateVerifiedQuestions(questions,checks(questions,category),category,'N3').questions.length,2);
    const shifted=checks(questions,category).map(c=>({...c,correct_indices:[1]}));
    assert.ok(api.validateVerifiedQuestions(questions,shifted,category,'N3').rejected.every(r=>r.reasons.includes('blind_key_disagreement')));
    const renamed=checks(questions,category).map(({correct_indices,...c})=>({...c,answer_indices:correct_indices}));
    assert.ok(api.validateVerifiedQuestions(questions,renamed,category,'N3').rejected.every(r=>r.reasons.includes('verification_missing')));
  }
});

test('genuine contradictions, multiple answers, missing/duplicate verification and JLPT level errors remain closed',()=>{
  const q=fixtures.jlpt[0],c=checks([q],'jlpt')[0];
  for(const explanation of ['정답은 ②입니다.','「つもりだった」が正解です。','정답은 ①입니다. 하지만 정답은 ②입니다.'])
    assert.ok(api.validateQuestionConsistency({...q,explanation},c,'jlpt','N3').reasons.includes('explanation_key_disagreement'));
  for(const check of [{...c,correct_indices:[0,1],ambiguous:true},{...c,correct_indices:[1]},{...c,jlpt_level:'NA'},{...c,jlpt_level:'N2'}])
    assert.equal(api.validateVerifiedQuestions([q],[check],'jlpt','N3').questions.length,0);
  for(const rows of [[],[c,c],[{...c,question_index:1}]])assert.equal(api.validateVerifiedQuestions([q],rows,'jlpt','N3').questions.length,0);
  assert.equal(api.validateVerifiedQuestions([q],[{...c,jlpt_level:'N4'}],'jlpt','N3').questions.length,0);
});

test('negated answer claims do not hide a later affirmative contradiction',()=>{
  const q=fixtures.jlpt[0],c=checks([q],'jlpt')[0];
  for(const explanation of ['정답은 ②가 아닙니다. 정답은 ①입니다.','正解は②ではありません。正解は①です。','「つもりだった」は正解じゃない。正解は①です。'])
    assert.equal(api.validateQuestionConsistency({...q,explanation},c,'jlpt','N3').ok,true,explanation);
  for(const explanation of ['정답은 ②가 아닙니다. 정답은 ③입니다.','正解は②ではない。正解は③です。','「つもりだった」は正解じゃない。正解は「ところだった」です。'])
    assert.ok(api.validateQuestionConsistency({...q,explanation},c,'jlpt','N3').reasons.includes('explanation_key_disagreement'),explanation);
});

test('real handler accepts realistic generation and blind-verification envelopes without database access',async()=>{
  for(const category of ['economy','jlpt']){
    const questions=Array.from({length:5},(_,i)=>({...fixtures[category][i%2]})),calls=[];
    let handler;
    const server=vm.createContext({URL,Request,Response,Date,console,
      Deno:{env:{get:key=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'fixture-public',OPENAI_API_KEY:'fixture-only',HANI_OWNER_USER_ID:'owner'}[key])},serve:fn=>{handler=fn}},
      createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},from(){throw Error('DB access forbidden')}}),
      fetch:async(_url,options)=>{
        const call=JSON.parse(options.body);calls.push(call);
        const output=calls.length===1?{questions}:{checks:checks(questions,category)};
        return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output)}]}]}));
      },
    });
    vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/gm,'')),server);
    const response=await handler(new Request('https://example.test/quiz',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({project:{name:category==='jlpt'?'JLPT N3':'경제 기초',category,level:category==='jlpt'?'N3':'기초',quiz_size:5},question_sources:[fixtures.source]})}));
    const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
    assert.equal(body.quiz.questions.length,5);assert.deepEqual(body.validation.rejected,[]);
    assert.equal(calls.length,2);assert.equal(body.db_write,false);assert.equal(body.hani_state_touched,false);
    const blind=JSON.parse(calls[1].input);
    assert.deepEqual(Object.keys(blind.questions[0]),['question_index','prompt','choices']);
    assert.equal(blind.questions[0].question_index,0);
    assert.equal(calls[1].text.format.schema.properties.checks.items.properties.correct_indices.items.minimum,0);
    for(const call of calls)assert.equal(call.store,false);
  }
});

function clientFixture(){
  let now=Date.parse('2026-10-17T15:05:00Z'),calls=0,overlayCalls=0;
  class FixedDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const project={id:'p',name:'JLPT N3',category:'jlpt',status:'active',scheduleType:'daily',quizSize:5,createdAt:'2026-10-01T00:00:00Z'};
  const state={learningProjects:[project],learningQuizzes:[],learningWrongAnswers:[]};
  const main={innerHTML:'',querySelectorAll:()=>[]};
  const forbidden=()=>{throw Error('modal or persistence must not run')};
  const context=vm.createContext({window:{confirm:forbidden},state,Date:FixedDate,URL,console,
    document:{querySelector:s=>s==='#studyMainPanel'?main:null,querySelectorAll:()=>[]},
    alert:forbidden,confirm:forbidden,localStorage:{setItem:forbidden,removeItem:forbidden,clear:forbidden},commit:forbidden,
    haniWorkShow:()=>overlayCalls++,haniWorkFinish:()=>overlayCalls++,haniWorkHide:()=>overlayCalls++,
    cloudUser:{id:'fixture'},cloudConfig:()=>({url:'https://example.test',key:'fixture-public'}),
    cloudClient:{auth:{getSession:async()=>({data:{session:{access_token:'fixture-session'}}})}},
    fetch:async()=>{calls++;return new Response(JSON.stringify({ok:false,error:'QUIZ_QUALITY_REJECTED',message:'정답 검증 실패 <unsafe>',validation:{rejected:[{question_index:0,reasons:['blind_key_disagreement']}]}}),{status:502})},
    Request,Response,
  });
  vm.runInContext(study.replace(/\r?\n  boot\(\);/,'\n this.fixture={generateTodayQuiz,maybeAutoGenerate,generationFailures,autoGenerationAttempts,generationDay,render:()=>{activeProjectId="p";renderMain(false);}};'),context);
  return {project,state,main,api:context.fixture,calls:()=>calls,overlays:()=>overlayCalls,advance:stamp=>{now=Date.parse(stamp)}};
}

test('automatic failure uses quiet escaped in-page status; same project/KST day is blocked; manual retry still runs',async()=>{
  const f=clientFixture(),before=JSON.stringify(f.state);f.api.render();
  assert.equal(f.api.generationDay(),'2026-10-18');
  assert.equal(f.api.maybeAutoGenerate(f.project),true);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls(),1);assert.equal(f.overlays(),0);
  assert.match(f.main.innerHTML,/자동 생성 실패/);assert.match(f.main.innerHTML,/버튼으로 한 번씩 다시 시도/);
  assert.match(f.main.innerHTML,/독립 정답 불일치 1문항/);
  assert.match(f.main.innerHTML,/&lt;unsafe&gt;/);assert.doesNotMatch(f.main.innerHTML,/<unsafe>/);
  assert.equal(f.api.maybeAutoGenerate(f.project),false);
  f.api.autoGenerationAttempts.clear(); // Failure itself also guards against another automatic request.
  assert.equal(f.api.maybeAutoGenerate(f.project),false);
  await f.api.generateTodayQuiz(f.project,{automatic:true});assert.equal(f.calls(),1);
  await f.api.generateTodayQuiz(f.project);assert.equal(f.calls(),2);assert.match(f.main.innerHTML,/수동 생성 실패/);
  assert.equal(JSON.stringify(f.state),before);
});

test('cooldown is scoped by project and KST date; reload memory is explicitly not persistent',async()=>{
  const f=clientFixture();await f.api.generateTodayQuiz(f.project,{automatic:true});
  assert.equal(f.api.maybeAutoGenerate({...f.project,id:'other'}),true);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls(),2);
  f.advance('2026-10-18T14:59:59Z');assert.equal(f.api.maybeAutoGenerate(f.project),false);
  f.advance('2026-10-18T15:00:00Z');assert.equal(f.api.maybeAutoGenerate(f.project),true);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.calls(),3);
  const reload=clientFixture();assert.equal(reload.api.generationFailures.size,0);
  assert.equal(reload.api.maybeAutoGenerate(reload.project),true);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(reload.calls(),1);
});
