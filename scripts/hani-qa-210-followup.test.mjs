import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {api,handlers as h,context,roster,plain,inspection} from './hani-board.test.mjs';

const baselineArg=process.argv[2]&&path.basename(process.argv[2])!=='index.mjs'?process.argv[2]:process.env.HANI_QA_TEST_BASELINE;
const readBaseline=file=>baselineArg?fs.readFileSync(path.resolve(baselineArg,file),'utf8'):execFileSync(process.env.HANI_GIT_PATH||'git',['show','HEAD:'+file],{cwd:path.resolve(import.meta.dirname,'..'),encoding:'utf8',maxBuffer:64*1024*1024});
const readEolBaseline=file=>process.env.HANI_QA_EOL_BASELINE?fs.readFileSync(path.resolve(process.env.HANI_QA_EOL_BASELINE,file),'utf8'):baselineArg?readBaseline(file):execFileSync(process.env.HANI_GIT_PATH||'git',['show','origin/main:'+file],{cwd:path.resolve(import.meta.dirname,'..'),encoding:'utf8',maxBuffer:64*1024*1024});
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
vm.runInContext(read('hani-relationship-seed.js'),context);
const study=read('hani-study-v02984.js'),main=read('hani-main.js');
const state={learningProjects:[{id:'p',name:'경제학 <기초>',category:'investment'}],learningQuizzes:[],learningWrongAnswers:[]};
const toasts=[],copied=[],listeners=[];
let navigator={clipboard:{writeText:async text=>copied.push(text)}};
const engine={contains:()=>true,addEventListener:(type,handler)=>listeners.push(handler)};
const document={querySelector:s=>s==='#studyEngineV02984'?engine:null,querySelectorAll:()=>[]};
const ctx=vm.createContext({window:{},state,document,navigator,toast:x=>toasts.push(x),console,Date,crypto:globalThis.crypto});
vm.runInContext(study.replace(/\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n})();'),ctx);
const learn=ctx.window.HANI_STUDY_V02984_TEST;
const questions=[
  {id:'a',prompt:'금리가 오르면?',choices:['비용 증가','비용 감소','무관','항상 이익'],answerIndex:0,difficulty:'easy',explanation:'차입 비용이 증가한다.'},
  {id:'b',prompt:'분산 투자의 목적은?',choices:['수익 보장','위험 분산','모두 매도','한 종목 집중'],answerIndex:1,difficulty:'hard',explanation:'개별 자산의 위험을 분산한다.'},
  {id:'c',prompt:'미응답 문제',choices:['가','나','다','라'],answerIndex:2,difficulty:'medium',explanation:'다 설명'}
];
const quiz={id:'set-1',projectId:'p',status:'completed',questions,answers:[1,1,null],total:3};
state.learningQuizzes.push(quiz,{...quiz,id:'set-2',answers:[0,0,2]});
const wrong={id:'w',projectId:'p',quizId:'set-1',question:questions[0].prompt,questionKey:learn.questionKey('p',questions[0]),choices:questions[0].choices,userAnswer:'비용 감소',correctAnswer:'비용 증가',explanation:questions[0].explanation,reviewStatus:'review'};
state.learningWrongAnswers.push(wrong);
const original=JSON.stringify(state);
function fn(name){const start=main.indexOf('function '+name+'(');assert.ok(start>=0,name);let source='';for(const line of main.slice(start).split(/(?<=\n)/)){source+=line;try{new vm.Script(source);return source}catch{}}throw Error(name+' boundary')}

test('quiz prompt contains full Korean tutoring request and immutable answers/project/level',()=>{
  const items=learn.hinaQuizItems(quiz),prompt=learn.hinaTutorPrompt(items);
  for(const part of ['지은','따뜻하고 꼼꼼한 재무 담당자','정확하게','왜 매력적','왜 틀렸','정확히 3줄','연습문제 1개','맨 끝','<details>','금리가 오르면?','1. 비용 증가','내 답: 비용 감소','정답: 비용 증가','차입 비용이 증가한다.','프로젝트: 경제학 <기초>','수준: easy','수준: hard','내 답: 미응답'])assert.ok(prompt.includes(part),part);
  assert.equal(JSON.stringify(state),original);
});
test('set copy uses only wrong/unanswered questions from the selected completed quiz',()=>{
  assert.deepEqual(Array.from(learn.hinaSetItems('set-1'),x=>x.question),[questions[0].prompt,questions[2].prompt]);
  assert.deepEqual(Array.from(learn.hinaSetItems('set-2'),x=>x.question),[questions[1].prompt]);
  assert.equal(learn.hinaQuizItems({...quiz,status:'pending'}).length,0);
  assert.equal(learn.hinaSetItems('').length,0);
  assert.equal(learn.hinaSetItems('stale').length,0);
  const row=learn.hinaWrongItem(wrong);assert.equal(row.difficulty,'easy');assert.equal(row.userAnswer,'비용 감소');
  assert.equal(learn.hinaWrongItem({...wrong,quizId:'missing'}).difficulty,'수준 정보 없음');
});
test('completed result and wrong notebook render copy controls in existing owners with escaping',()=>{
  const html=learn.renderQuizDetail(state.learningProjects[0],quiz);
  assert.equal((html.match(/data-hina-quiz=/g)||[]).length,3);
  assert.equal((html.match(/data-hina-set=/g)||[]).length,1);
  assert.ok(!learn.renderQuizDetail(state.learningProjects[0],{...quiz,status:'pending'}).includes('data-hina-'));
  const perfect=learn.renderQuizDetail(state.learningProjects[0],{...quiz,answers:[0,1,2]});
  assert.match(perfect,/data-hina-set="set-1" disabled/);
  const panel={innerHTML:'',querySelectorAll:()=>[]};document.querySelector=s=>s==='#studyWrongPanel'?panel:s==='#studyEngineV02984'?engine:null;
  // Select the project through the actual existing read-only entry point.
  const patched=study.replace(/\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n activeProjectId="p";renderWrongTab();\n})();');
  const isolated=vm.createContext({window:{},state,document,console,Date,crypto:globalThis.crypto});vm.runInContext(patched,isolated);
  assert.match(panel.innerHTML,/data-hina-wrong="w"/);assert.match(panel.innerHTML,/data-hina-set="set-1"/);
  assert.ok(panel.innerHTML.includes('경제학 &lt;기초&gt;'));
});
test('Clipboard API copies the prompt and toasts without mutating records',async()=>{
  assert.equal(await learn.handleHinaCopy({dataset:{hinaQuiz:'set-1',hinaQuestion:'0'}}),true);
  assert.ok(copied.at(-1).includes('금리가 오르면?'));assert.ok(!copied.at(-1).includes('분산 투자의 목적은?'));
  assert.equal(await learn.handleHinaCopy({dataset:{hinaSet:'set-1'}}),true);
  assert.ok(copied.at(-1).includes('미응답 문제'));assert.ok(!copied.at(-1).includes('분산 투자의 목적은?'));
  assert.equal(await learn.handleHinaCopy({dataset:{hinaWrong:'w'}}),true);
  assert.ok(toasts.at(-1).includes('복사했습니다'));assert.equal(JSON.stringify(state),original);
});
test('clipboard denied/unavailable uses textarea and always restores focus/selection',async()=>{
  const events=[];let field=null;
  document.activeElement={focus:opts=>{assert.equal(opts.preventScroll,true);events.push('restore')}};
  document.body={appendChild:n=>{field=n;events.push('append')}};
  document.createElement=tag=>{assert.equal(tag,'textarea');return {style:{},focus:()=>events.push('focus'),select:()=>events.push('select'),remove:()=>events.push('remove')}};
  document.getSelection=()=>({rangeCount:1,getRangeAt:()=>({cloneRange:()=>({range:true})}),removeAllRanges:()=>events.push('ranges'),addRange:()=>events.push('range')});
  document.execCommand=command=>{assert.equal(command,'copy');events.push('copy');return true};
  navigator.clipboard.writeText=async()=>{throw Error('denied')};
  assert.equal(await learn.copyHinaPrompt(learn.hinaSetItems('set-1')),true);
  assert.ok(field.value.includes('금리가 오르면?'));
  assert.deepEqual(events,['append','focus','select','copy','remove','restore','ranges','range']);
  navigator.clipboard=undefined;events.length=0;
  assert.equal(await learn.copyHinaPrompt([learn.hinaWrongItem(wrong)]),true);
  document.execCommand=()=>false;events.length=0;
  assert.equal(await learn.copyHinaPrompt([learn.hinaWrongItem(wrong)]),false);
  assert.ok(events.includes('remove'));assert.ok(events.includes('restore'));assert.ok(toasts.at(-1).includes('복사하지 못했습니다'));
  assert.equal(JSON.stringify(state),original);
});
test('canonical study click listener dispatches copy controls and stale data without saving',async()=>{
  navigator.clipboard={writeText:async text=>copied.push(text)};
  const start=study.indexOf('    const engine=q(',study.indexOf('  function bindStaticEvents()'));
  const end=study.indexOf("    q('#studyProjectNew')",start);
  vm.runInContext('(function(){const q=s=>document.querySelector(s);const handleHinaCopy=window.HANI_STUDY_V02984_TEST.handleHinaCopy;'+study.slice(start,end)+'})();',ctx);
  assert.equal(listeners.length,1);
  const count=copied.length;listeners[0]({target:{closest:()=>({dataset:{hinaSet:'set-1'}})}});await Promise.resolve();assert.equal(copied.length,count+1);
  assert.equal(await learn.handleHinaCopy({dataset:{hinaWrong:'deleted'}}),false);
  assert.equal(await learn.handleHinaCopy({dataset:{hinaQuiz:'set-1',hinaQuestion:'99'}}),false);
  assert.equal(JSON.stringify(state),original);
});

const post={id:'followup',authorId:roster.chairman.id,category:'LOUNGE',title:'독서: 인간 vs 기계',body:'책에서 AI 디스토피아를 생각했어요.'};
test('fear outranks jokes/questions and book context wins over the AI subtopic',()=>{
  for(const text of ['AI 디스토피아가 무서워 ㅋㅋ','미래가 두려워요?','책 읽고 불안하네','AI가 무섭지만 고마워'])assert.equal(h.chairmanReplyIntent(text),'fear');
  assert.equal(h.chairmanReplyTopic(post,'AI 미래가 무섭다'),'book');
  assert.equal(h.chairmanReplyTopic(post,'주가가 걱정이야'),'stock','explicit change of topic');
  assert.equal(h.chairmanReplyTopic({...post,title:'오늘',body:'달리기 운동 기록'},'좋아요'),'exercise');
  assert.equal(h.chairmanReplyTopic({...post,title:'AI 윤리와 책임',body:''},'좋아요'),'ai');
  assert.equal(h.chairmanReplyTopic({...post,title:'주식 정책',body:''},'좋아요'),'stock');
  assert.equal(h.chairmanReplyTopic({...post,title:'머신러닝',body:''},'좋아요'),'ai');
});
test('every intent × topic generates relevant persona replies through ownerReactions without writes',()=>{
  const topics={book:'책과 독서',ai:'AI와 인공지능',stock:'주식과 투자',exercise:'운동과 러닝'};
  const examples={fear:'조금 걱정돼',question:'왜 그런가요?',thanks:'고마워요',joke:'농담이야 ㅋㅋ',agree:'맞아 공감해',other:'생각이 많아졌어'};
  const before=plain(api.getState()),writes=inspection().queues;
  for(const [topic,title] of Object.entries(topics))for(const [intent,text] of Object.entries(examples)){
    assert.ok(h.CHAIRMAN_TOPIC_REPLIES[topic][intent].length>=2);
    for(const member of roster.people){
      const replies=h.ownerReactions({...post,title,body:title},{id:topic+intent+member.id,authorId:roster.chairman.id,body:'@'+member.name+' '+text},[],2);
      assert.ok(replies.length>=1&&replies.length<=3);
      for(const row of replies){assert.equal(row.intent,intent);assert.equal(row.topic,topic);assert.ok(h.CHAIRMAN_TOPIC_REPLIES[topic][intent].some(line=>row.body.includes(line)),row.body);assert.match(row.body,/^(회장님|대표님),/);assert.ok(row.body.length<180);assert.ok(!/공부|학습|시험/.test(row.body));}
    }
  }
  assert.deepEqual(plain(api.getState()),before);assert.equal(inspection().queues,writes);
});
test('book AI dystopia fear gets reassuring playful book replies and never generic studying',()=>{
  for(let round=0;round<25;round++){
    const replies=h.ownerReactions(post,{id:'fear',authorId:roster.chairman.id,body:'AI 디스토피아가 너무 무서워 ㅋㅋ'},[],round);
    assert.ok(replies.length>=1);
    for(const row of replies){assert.equal(row.intent,'fear');assert.equal(row.topic,'book');assert.match(row.body,/책/);assert.match(row.body,/미래는 아니|좋아했던 대목|같이 들어볼게요/);assert.doesNotMatch(row.body,/확인된 사실|단정하지|지어내/);assert.match(row.body,/봉인|책갈피/);assert.doesNotMatch(row.body,/공부|학습|시험/);}
  }
});
test('chairman vocative is stripped only for its mention chip, stored text/middle address survive',()=>{
  const root={id:'chairman-comment',postId:post.id,authorId:roster.chairman.id,body:'원댓글'};
  const reply={id:'staff-reply',postId:post.id,parentId:root.id,authorId:'hani',body:'@회장님 회장님, <책> 이야기예요.'};
  api.setState({...plain(api.freshState()),boardPosts:[post],boardComments:[root,reply]});
  const before=plain(api.getState()),writes=inspection().queues;
  assert.match(h.commentMarkup(reply,true),/@회장님<\/span> &lt;책&gt; 이야기예요\./);
  for(const address of ['회장님, ','대표님 ','성민님, ','성민 회장님, ']){assert.equal(h.stripLeadingVocative(address+'내용',roster.chairman.id,true,true),'내용');assert.equal(h.stripLeadingVocative(address+'내용',roster.chairman.id,false),address+'내용');}
  assert.equal(h.stripLeadingVocative('오늘 회장님, 좋은 책이에요.',roster.chairman.id,true,true),'오늘 회장님, 좋은 책이에요.');
  assert.equal(h.stripLeadingVocative('회장님, 내용',['arin',roster.chairman.id],true,true),'회장님, 내용','chip belongs to Arin');
  assert.deepEqual(plain(api.getState()),before);assert.equal(inspection().queues,writes);
});

const intake=vm.createContext({Date,Intl,structuredClone,today:()=> '2026-10-12',normalizeDateFlexDate:x=>x,uid:()=> 'fixture',window:{},document:{getElementById:()=>null},console});
for(const name of ['intakeText','intakeNormText','intakeDate','intakeNumber','intakeRating','intakeKv','intakePick','intakeFirstContentLine','intakeDayOffset','intakeDateFromWeekday','intakeNaturalRating','intakeNaturalReview','intakeNaturalAuthor','intakeNaturalDate','intakeNaturalMovie','intakeReadingToday','intakeNaturalBook','intakeBuildOne','intakeRequestedTargets','intakeTargetAlias','intakeInferTarget','intakeOverlayUserInstruction','intakeRowsFromVision'])vm.runInContext(fn(name),intake);
vm.runInContext(read('hani-yuna-helpdesk.js'),intake);
test('natural book parsing preserves both vs orders and the exact reported input',()=>{
  for(const title of ['인간 vs 기계','기계 vs 인간','인간 VS 기계','인간 대 기계'])for(const verb of ['책을 봤어','읽었어']){
    const text='김대식의 '+title+' '+verb;
    const parsed=intake.intakeNaturalBook(text);assert.equal(parsed.title,title);assert.equal(parsed.author,'김대식');
    const draft=intake.window.HANI_YUNA_HELPDESK.parse(text,'book');assert.equal(draft.data.title,title);assert.equal(draft.data.author,'김대식');
  }
});
test('structured extraction reordered title is overridden before Preview/apply using explicit user order',()=>{
  const extracted={target:'book',data:{title:'기계 vs 인간',author:'김대식',status:'read',review:'이미지 후기'}};
  const untouched=JSON.stringify(extracted),text='김대식의 인간 vs 기계 책을 봤어';
  const rows=intake.intakeRowsFromVision([extracted],[],text,'auto',[]);
  assert.equal(rows[0].data.title,'인간 vs 기계');assert.equal(rows[0].data.author,'김대식');assert.equal(rows[0].data.review,'이미지 후기');assert.equal(JSON.stringify(extracted),untouched);
  assert.equal(intake.intakeRowsFromVision([extracted],[],'오늘 다 읽었어','auto',[])[0].data.title,'기계 vs 인간','no fabricated title for status instruction');
  assert.equal(intake.intakeRowsFromVision([extracted],[],'','auto',[])[0].data.title,'기계 vs 인간','OCR-only title retained');
});
test('Yuna Vision preserves explicit human title order through saveData with conflicting OCR',()=>{
  const extraction={confidence:.94,target_hint:'book',extracted_text:'김대식의 기계 vs 인간 책을 봤어',structured_json:JSON.stringify([{target:'book',data:{title:'기계 vs 인간'}}])};
  const draft=intake.window.HANI_YUNA_HELPDESK.visionDraft(extraction,'김대식의 인간 vs 기계 책을 봤어','auto');
  assert.equal(draft.data.title,'인간 vs 기계');assert.equal(intake.window.HANI_YUNA_HELPDESK.saveData(draft).title,'인간 vs 기계');
  const partial=intake.window.HANI_YUNA_HELPDESK.visionDraft(extraction,'인간 vs 기계 읽었어','book');
  assert.equal(partial.data.title,'인간 vs 기계');assert.equal(partial.data.author,'김대식','OCR author survives title-only instruction');
});

test('versions, cache tags, protected writes, ids and retained mixed EOL match frozen HEAD export',()=>{
  // Compare preservation against the explicit fixture or this task's frozen HEAD.
  for(const file of ['hani-study-v02984.js','hani-board.js','hani-main.js','hani-yuna-helpdesk.js']){
    const old=readBaseline(file),now=read(file);
    for(const pattern of [/\b2\.9\.\d+(?:-[\w.-]+)?\b/g,/\?v=[^\s"'<>]+/g,/\b(?:commit|save|writeProtectedState|localStorage\.(?:setItem|removeItem|clear))\([^)]*\)/g,/\bid\s*=\s*["']([\w-]+)["']/g,/\.clear\(/g])assert.deepEqual(now.match(pattern),old.match(pattern),file+' invariant '+pattern);
    const lines=s=>s.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g).filter(Boolean),endings=new Map();
    for(const line of lines(readEolBaseline(file))){const text=line.replace(/[\r\n]+$/,'');if(!endings.has(text))endings.set(text,new Set());endings.get(text).add(line.slice(text.length));}
    for(const line of lines(now)){const text=line.replace(/[\r\n]+$/,'');if(endings.has(text))assert.ok(endings.get(text).has(line.slice(text.length)),file+' EOL '+text.slice(0,50));}
  }
});
