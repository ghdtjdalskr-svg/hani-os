import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../hani-study-v02984.js',import.meta.url),'utf8');
let copied='',writes=0;
const state={learningProjects:[],learningQuizzes:[],learningWrongAnswers:[]};
const context=vm.createContext({window:{},state,document:{querySelector:()=>null,querySelectorAll:()=>[]},navigator:{clipboard:{writeText:async t=>{copied=t}}},toast:()=>{},console,commit:()=>{writes++;throw Error('unexpected persistence')}});
vm.runInContext(source.replace(/\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n})();'),context);
const api=context.window.HANI_STUDY_V02984_TEST;
const q={id:'q',projectId:'p',status:'completed',title:'첨삭 테스트',answers:[1],score:0,questions:[{id:'q1',prompt:'개념 확인',choices:['선택1','선택2'],answerIndex:0,explanation:'근거 확인',difficulty:'easy'}]};
test('finance categories select 지은; Japanese and other explicit categories preserve 히나',()=>{
  for(const category of ['economy','investment','market','finance','경제','투자','시장'])assert.equal(api.tutorName({category}),'지은',category);
  for(const category of ['jlpt','japanese','certificate','ai','university','other'])assert.equal(api.tutorName({category}),'히나',category);
  assert.equal(api.tutorName({name:'경제 기초',category:'other'}),'지은');
  assert.equal(api.tutorName({name:'경제 관련 일본어',category:'jlpt'}),'히나');
});
test('single, wrong-note and complete-set copy use project tutor; finance has warm meticulous tone and disputes',async()=>{
  state.learningProjects=[{id:'p',name:'투자 공부',category:'economy'}];state.learningQuizzes=[q];
  const items=api.hinaQuizItems(q);assert.equal(items[0].tutor,'지은');
  const prompt=api.hinaTutorPrompt(items);assert.ok(prompt.startsWith('당신은 HANI OS의 지은 과장입니다'));assert.match(prompt,/따뜻하고 꼼꼼한 재무 담당자/);assert.match(prompt,/<details>/);
  await api.copyHinaPrompt(items);assert.equal(copied,prompt);
  assert.ok(api.quizTutorReviewText(q).startsWith('당신은 HANI OS의 지은 과장입니다'));assert.match(api.quizTutorReviewText(q),/이의제기: 없음/);
  const row={projectId:'p',quizId:'q',question:'개념 확인',choices:['선택1','선택2'],userAnswer:'선택2',correctAnswer:'선택1'};
  assert.equal(api.hinaWrongItem(row).tutor,'지은');
  const html=api.renderQuizDetail(state.learningProjects[0],q);assert.match(html,/지은에게 첨삭 받기 \(복사\)/);assert.match(html,/전체 세트 지은 첨삭 복사 \(이의제기 포함\)/);
  assert.equal(writes,0);
});
test('JLPT prompt and button copy keep the existing 히나 voice',()=>{
  state.learningProjects=[{id:'p',name:'JLPT N2',category:'jlpt'}];
  assert.ok(api.hinaTutorPrompt(api.hinaQuizItems(q)).startsWith('당신은 HANI OS의 히나 과장입니다. 장난기 있는 선생님 말투'));
  assert.ok(api.quizTutorReviewText(q).startsWith('첨삭 테스트\n\n점수'),'existing non-finance complete-set text is preserved');
  assert.match(api.renderQuizDetail(state.learningProjects[0],q),/전체 세트 히나 첨삭 복사/);assert.equal(writes,0);
});
