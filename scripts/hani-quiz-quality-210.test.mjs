import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const edge = readFileSync(new URL('../supabase/functions/hani-learning-quiz/index.ts',import.meta.url),'utf8');
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/quiz-quality-210.json',import.meta.url),'utf8'));
const plain = x => JSON.parse(JSON.stringify(x));
const question = {type:'文法',topic:'わけではない',difficulty:'medium',prompt:'嫌いな（　）が、今日は食べたくありません。',choices:['わけではありません','に違いありません','ところです','最中です'],answer_index:0,explanation:'정답은 ①입니다. 반드시 싫다는 뜻은 아니라는 부분 부정을 나타냅니다.'};
const check = (question_index=0,extra={}) => ({question_index,correct_indices:[0],ambiguous:false,jlpt_level:'N3',reason:'独立に解いた結果',...extra});
function server(questions=[question],checks=questions.map((_,i)=>check(i)),verificationFailure='') {
  let handler; const calls=[];
  const context=vm.createContext({Request,Response,Date,console,
    Deno:{env:{get:key=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'fixture-public',OPENAI_API_KEY:'fixture-only',HANI_OWNER_USER_ID:'owner'}[key])},serve:fn=>{handler=fn}},
    createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},from(){throw Error('database access is forbidden')}}),
    fetch:async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses');
      const call=JSON.parse(options.body);calls.push(call);
      if(calls.length===1) return new Response(JSON.stringify({output_text:JSON.stringify({questions})}));
      if(verificationFailure==='http')return new Response('{}',{status:503});
      return new Response(JSON.stringify({output_text:verificationFailure==='parse'?'broken':JSON.stringify({checks})}));
    },
  });
  vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/gm,'')+'\nthis.api={validateQuestionConsistency,validateVerifiedQuestions,explanationAnswerIndices,jlptTargetLevel,verificationPrompt,systemPrompt};'),context);
  return {api:context.api,calls,run:async(body={})=>{
    const response=await handler(new Request('https://example.test/quiz',{method:'POST',headers:{Authorization:'Bearer fixture-session'},body:JSON.stringify({project:{name:'JLPT N3',category:'jlpt',quiz_size:questions.length},...body})}));
    return {status:response.status,body:await response.json()};
  }};
}
const {api}=server();

test('Q15 key ② contradicts named array-slot answer 駅の前に (④)',()=>{
  const verdict=api.validateQuestionConsistency(fixtures.q15,check(0,{correct_indices:[3]}),'jlpt');
  assert.equal(verdict.ok,false);
  assert.ok(verdict.reasons.includes('explanation_key_disagreement'));
  assert.ok(verdict.reasons.includes('blind_key_disagreement'));
  assert.equal(api.validateQuestionConsistency({...fixtures.q15,answer_index:3},check(0,{correct_indices:[3]}),'jlpt').ok,true);
});
test('Q10 has both ように and ために: matching key alone cannot pass',()=>{
  const result=api.validateQuestionConsistency(fixtures.q10,check(0,{correct_indices:[0,1],ambiguous:true}),'jlpt');
  assert.equal(result.ok,false);assert.ok(result.reasons.includes('not_single_answer'));
  for(const answers of [[],[0,0],[1],[0,1]])assert.equal(api.validateQuestionConsistency(fixtures.q10,check(0,{correct_indices:answers}),'jlpt').ok,false);
});
test('Q3 honorific pair and Q4 stem pair flagged by independent all-choice check',()=>{
  for(const q of [
    {...question,prompt:'先生が本を（　）。',choices:['くださいました','くれました','もらいました','いただきました']},
    {...question,prompt:'明日は休み（　）です。',choices:['そう','のはず','ながら','つつ']},
  ])assert.equal(api.validateQuestionConsistency(q,check(0,{correct_indices:[0,1],ambiguous:true}),'jlpt').ok,false);
});
test('answer assertions support number, circled/fullwidth label and named choice',()=>{
  for(const explanation of ['정답은 ②입니다.','正解は２です。','答え: ②','correct answer is 2','정답은 「に違いありません」입니다.']){
    const result=api.validateQuestionConsistency({...question,explanation},check(),'jlpt');
    assert.ok(result.reasons.includes('explanation_key_disagreement'),explanation);
  }
  assert.equal(api.validateQuestionConsistency({...question,explanation:'정답은 ①입니다. ②는 확신을 나타내므로 오답입니다.'},check(),'jlpt').ok,true);
  assert.equal(api.validateQuestionConsistency({...question,explanation:'정답은 ①입니다. 「に違いありません」(②)는 확신을 뜻하므로 오답입니다.'},check(),'jlpt').ok,true);
  assert.equal(api.validateQuestionConsistency({...fixtures.q15,explanation:'두 번째 항목은 駅の前に(④)입니다.'},check(0,{correct_indices:[1]}),'jlpt').ok,false);
  assert.equal(api.validateQuestionConsistency({...question,choices:['a+','b?','c[','d('],explanation:'정답은 「b?」입니다.'},check()).ok,false);
});
test('malformed choices and missing/duplicate independent results fail closed',()=>{
  for(const c of [null,{},check(0,{ambiguous:'false'}),check(0,{correct_indices:['0']})])assert.equal(api.validateQuestionConsistency(question,c,'jlpt').ok,false);
  assert.equal(api.validateQuestionConsistency({...question,choices:['が','が','に','を']},check(),'jlpt').ok,false);
  for(const checks of [[],[check(),check()]])assert.equal(api.validateVerifiedQuestions([question],checks,'jlpt','N3').questions.length,0);
});
test('JLPT language, N3 default and explicit project levels; below-level <=20% even in partial batches',()=>{
  assert.equal(api.jlptTargetLevel({name:'JLPT'}),'N3');assert.equal(api.jlptTargetLevel({name:'JLPT N3',level:'N2'}),'N2');
  assert.equal(api.jlptTargetLevel({goal:'N4 준비'}),'N4');
  for(const q of [{...question,prompt:'정답을 선택하세요'}, {...question,choices:['맞는 설명','다른 설명','오답','보기']}])assert.equal(api.validateQuestionConsistency(q,check(),'jlpt').ok,false);
  assert.equal(api.validateQuestionConsistency(question,check(0,{jlpt_level:'N2'}),'jlpt').ok,false);
  const questions=Array.from({length:20},()=>question);
  for(const targetCount of [0,1,4,12,16,20]){
    const result=api.validateVerifiedQuestions(questions,questions.map((_,i)=>check(i,{jlpt_level:i<targetCount?'N3':'N4'})),'jlpt','N3');
    const below=result.questions.length-targetCount;
    assert.ok(!result.questions.length || below/result.questions.length<=0.2);
    assert.equal(result.questions.length,targetCount+Math.min(20-targetCount,Math.floor(targetCount/4)));
  }
  const prompt=api.systemPrompt(20,7,'jlpt',0,false);
  for(const term of ['single-answer check','지문·발문·선택지를 모두 일본어','최소 80%','최대 20%'])assert.ok(prompt.includes(term));
});
test('real handler runs blind pass without key/explanation and drops Q15/Q10 before returning',async()=>{
  const s=server([question,fixtures.q15,fixtures.q10],[check(),check(1,{correct_indices:[3]}),check(2,{correct_indices:[0,1],ambiguous:true})]);
  const result=await s.run();assert.equal(result.status,200);assert.equal(result.body.quiz.questions.length,1);
  assert.equal(result.body.validation.rejected.length,2);assert.equal(result.body.db_write,false);assert.equal(result.body.hani_state_touched,false);
  const blind=JSON.parse(s.calls[1].input);
  assert.deepEqual(Object.keys(blind.questions[0]),['question_index','prompt','choices']);
  assert.equal(blind.target_level,'N3');assert.ok(s.calls[1].instructions.includes('blind re-solve'));
  for(const call of s.calls)assert.equal(call.store,false);
});
test('verification outage, parse error, incomplete check and all rejected sets cannot be saved',async()=>{
  for(const [checks,failure] of [[[check()],'http'],[[check()],'parse'],[[],''],[[check(0,{correct_indices:[1]})],'']]){
    const result=await server([question],checks,failure).run();assert.equal(result.status,502);assert.equal(result.body.ok,false);assert.equal(result.body.db_write,false);
  }
});

const client=readFileSync(new URL('../hani-study-v02984.js',import.meta.url),'utf8');
function learning() {
  const project={id:'jlpt',name:'JLPT N3',category:'jlpt',status:'active'};
  const questions=Array.from({length:20},(_,i)=>({id:'q'+i,...question,prompt:'日本語の問題 '+i,answerIndex:0}));
  questions[9]={...fixtures.q10,answerIndex:0};questions[14]={...fixtures.q15,answerIndex:1};
  const answers=Array(20).fill(0);for(const i of [3,5,9,14,18])answers[i]=3;
  answers[9]=1;
  const quiz={id:'quiz006',projectId:project.id,title:'JLPT N3 #006',status:'completed',questions,answers,score:75,correctCount:15,total:20,date:'2026-10-12',updatedAt:'original'};
  const state={learningProjects:[project],learningQuizzes:[quiz],learningWrongAnswers:[],preserved:{value:'original'}};
  let writes=0,fail=false,throws=false,saved;
  const context=vm.createContext({state,window:{},document:{querySelector:()=>null,querySelectorAll:()=>[]},Date,console:{error(){}},structuredClone,crypto:{randomUUID:()=>String(Math.random())},
    localStorage:{setItem(){throw Error('new write')},removeItem(){throw Error('remove')},clear(){throw Error('clear')}},
    commit(){writes++;if(throws)throw Error('save failed');if(fail)return false;saved=plain(state);return true;},
  });
  vm.runInContext(client.replace(/\r?\n  boot\(\);/,'\n  // Fixture has no boot writes'),context);
  const api=context.window.HANI_STUDY_V02984_TEST;
  for(const i of [3,5,9,14,18])api.upsertWrongAnswer(project,quiz,questions[i],answers[i]);
  return {api,state,quiz,project,writes:()=>writes,saved:()=>saved,fail:value=>{fail=value},throws:()=>{throws=true}};
}
test('pending reasons preserve 15/20; accept Q10/Q15 gives 17/20 without overwriting original fields',()=>{
  const f=learning(),before=plain(f.quiz),wrong=plain(f.state.learningWrongAnswers);
  for(const i of [9,14])assert.equal(f.api.persistQuizRegrade(f.quiz,i,'내 답도 정답입니다.'),true);
  assert.equal(f.api.quizRegradeCount(f.quiz),15);assert.equal(f.api.wrongRows().length,5);
  for(const i of [9,14])assert.equal(f.api.persistQuizRegrade(f.quiz,i,'', 'accepted'),false);
  for(const i of [9,14])assert.equal(f.api.persistQuizRegrade(f.quiz,i,'내 답도 정답입니다.','accepted'),true);
  assert.equal(f.api.quizRegradeCount(f.quiz),17);assert.equal(f.api.quizScoreLabel(f.quiz),'표시 15/20 → 재채점 17/20');
  assert.equal(f.quiz.score,75);assert.equal(f.quiz.correctCount,15);assert.deepEqual(plain(f.quiz.answers),before.answers);assert.deepEqual(plain(f.quiz.questions),before.questions);
  assert.deepEqual(plain(f.state.learningWrongAnswers),wrong);assert.deepEqual(plain(f.state.preserved),{value:'original'});
  assert.equal(f.quiz.regradeNotes.length,4);assert.equal(f.writes(),4);assert.equal(f.saved().learningQuizzes[0].regradeNotes.length,4);
});
test('accepted questions excluded from wrong drills and weakness source, with records preserved',()=>{
  const f=learning();f.api.persistQuizRegrade(f.quiz,14,'해설은 ④입니다.');f.api.persistQuizRegrade(f.quiz,14,'해설은 ④입니다.','accepted');
  assert.equal(f.api.wrongRows().length,4);assert.equal(f.api.recentWeaknesses('jlpt').length,4);assert.equal(f.state.learningWrongAnswers.length,5);
  const row=f.state.learningWrongAnswers.find(x=>x.question===fixtures.q15.prompt),writes=f.writes();
  assert.equal(f.api.retryWrongAnswer(row.id,1),false);assert.equal(f.writes(),writes);
  // A later quiz occurrence remains independently eligible for drills.
  const later={...f.quiz,id:'quiz007',regradeNotes:[]};f.state.learningQuizzes.push(later);row.quizId=later.id;
  assert.equal(f.api.wrongRows().length,5);
});
test('legacy normalization/reload preserves notes; original score-only records regrade correctly',()=>{
  const f=learning();f.quiz.correctCount=null;f.api.persistQuizRegrade(f.quiz,9,'복수정답');f.api.persistQuizRegrade(f.quiz,9,'복수정답','accepted');
  const normalized=f.api.normalizeQuiz(plain(f.quiz));assert.equal(f.api.quizRegradeCount(normalized),16);
  assert.deepEqual(plain(normalized.regradeNotes),plain(f.quiz.regradeNotes));
  assert.equal(Object.hasOwn(f.api.normalizeQuiz({...f.quiz,regradeNotes:undefined}),'regradeNotes'),false);
});
test('save false/throw rolls back whole quiz, preserving pending note, wrong records and unrelated data',()=>{
  for(const throwSave of [false,true]){
    const f=learning();f.api.persistQuizRegrade(f.quiz,14,'정답 모순');const before=JSON.stringify(f.state);
    if(throwSave)f.throws();else f.fail(true);
    assert.equal(f.api.persistQuizRegrade(f.quiz,14,'정답 모순','accepted'),false);assert.equal(JSON.stringify(f.state),before);
    assert.equal(f.api.persistQuizRegrade(f.quiz,9,'복수정답'),false);assert.equal(JSON.stringify(f.state),before);
  }
});
test('invalid/cancelled input and repeated acceptance never produce duplicate score or writes',()=>{
  const f=learning();for(const [q,i,r,status] of [[f.quiz,-1,'이유'],[f.quiz,20,'이유'],[f.quiz,9,' '],[f.quiz,9,'이유','accepted'],[{...f.quiz},9,'이유']])assert.equal(f.api.persistQuizRegrade(q,i,r,status),false);
  assert.equal(f.writes(),0);f.api.persistQuizRegrade(f.quiz,9,'복수정답');f.api.persistQuizRegrade(f.quiz,9,'복수정답','accepted');
  assert.equal(f.api.persistQuizRegrade(f.quiz,9,'중복','accepted'),false);assert.equal(f.api.persistQuizRegrade(f.quiz,9,'중복'),false);assert.equal(f.writes(),2);assert.equal(f.api.quizRegradeCount(f.quiz),16);
  f.quiz.answers[9]=null;assert.equal(f.api.acceptedRegrade(f.quiz,9),false);
});
test('result and tutor copy include pending/accepted status and escaped reason',()=>{
  const f=learning();f.api.persistQuizRegrade(f.quiz,14,'<script>해설은 ④</script>');
  let html=f.api.renderQuizDetail(f.project,f.quiz);assert.match(html,/이의제기 \/ 재채점/);assert.match(html,/검토 대기/);assert.ok(!html.includes('<script>해설'));
  assert.match(f.api.quizTutorReviewText(f.quiz),/검토 대기 · 내 답도 정답/);
  f.api.persistQuizRegrade(f.quiz,14,'이유','accepted');html=f.api.renderQuizDetail(f.project,f.quiz);
  assert.match(html,/표시 15\/20 → 재채점 16\/20/);assert.match(html,/내 답도 정답 \(재채점 수락\)/);
  assert.match(f.api.quizTutorReviewText(f.quiz),/이의제기: 수락됨/);assert.match(html,/히나 첨삭 복사/);
});
test('canonical UI binding validates reason, honors cancel and rolls back failed accept',()=>{
  const f=learning();let reason='',accept=false,confirm=false,alerts=[];
  const slot={dataset:{disputeQuiz:f.quiz.id,disputeIndex:'14'},querySelector:()=>({value:reason})};
  const button={closest:()=>slot,hasAttribute:()=>accept};
  const root={querySelectorAll:()=>[button]};
  // Bind against a fresh actual owner context with the same quiz and commit path.
  const context=vm.createContext({state:f.state,window:{confirm:()=>confirm},alert:message=>alerts.push(message),document:{querySelector:()=>null,querySelectorAll:()=>[]},Date,structuredClone,console:{error(){}},commit:()=>!context.fail});
  vm.runInContext(client.replace(/\r?\n  boot\(\);/,'\n  // isolated event test'),context);
  context.window.HANI_STUDY_V02984_TEST.bindQuestionDisputes(root);
  button.onclick();assert.equal(alerts.length,1);assert.equal(f.quiz.regradeNotes,undefined);
  reason='해설의 답은 ④';button.onclick();assert.equal(f.quiz.regradeNotes.length,1);
  accept=true;button.onclick();assert.equal(f.quiz.regradeNotes.length,1);
  confirm=true;context.fail=true;button.onclick();assert.equal(f.quiz.regradeNotes.length,1);
  context.fail=false;button.onclick();assert.equal(f.quiz.regradeNotes.length,2);assert.equal(f.api.quizRegradeCount(f.quiz),16);
});
test('actual client refills dropped questions and enforces whole-set lower-level quota across retries',async()=>{
  const s=server(),state={learningProjects:[],learningQuizzes:[],learningWrongAnswers:[]},requests=[];
  const prompts=['会議','予約','連絡','研究','環境','説明','学校','旅行','仕事','健康','文化','交通','技術','発表','計画','準備','資料','受付','変更','相談'];
  const context=vm.createContext({state,window:{},document:{querySelector:()=>null,querySelectorAll:()=>[]},Date,URL,
    cloudClient:{auth:{getSession:async()=>({data:{session:{access_token:'fixture-session'}}})}},cloudUser:{id:'owner'},cloudConfig:()=>({url:'https://example.test',key:'fixture-public'}),
    fetch:async(url,options)=>{
      const body=JSON.parse(options.body);requests.push(body);
      const start=requests.length===1?0:8;
      const questions=prompts.slice(start,start+body.project.quiz_size).map((prompt,i)=>({...question,prompt:prompt+'について、正しい説明を選んでください。',jlpt_level:requests.length<=2&&i<4?'N4':'N3'}));
      return {ok:true,json:async()=>({ok:true,quiz:{questions:requests.length===1?questions.slice(0,8):questions}})};
    },
  });
  vm.runInContext(client.replace(/\r?\n  boot\(\);/,'\n // no boot'),context);
  const questions=await context.window.HANI_STUDY_V02984_TEST.quizApi({id:'p',category:'jlpt',name:'JLPT N3',quizSize:20,scheduleType:'manual'});
  assert.equal(questions.length,20);assert.equal(questions.filter(q=>q.jlptLevel==='N4').length,4);assert.ok(requests.length>1);
  assert.equal(state.learningQuizzes.length,0);
});
