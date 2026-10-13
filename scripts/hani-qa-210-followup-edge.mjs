import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {localBrowser,mountFixtures} from './hani-contrast-audit.mjs';

const out=path.resolve(import.meta.dirname,'../artifacts/qa-210/followup');fs.mkdirSync(out,{recursive:true});
const evidence={status:'RUNNING',environment:'local synthetic in-memory fixtures; external services blocked',runs:[],errors:[]};
let env;
try{
  env=await localBrowser(process.argv[2],process.argv[3]);
  env.page.on('pageerror',error=>evidence.errors.push(error.message));
  await mountFixtures(env.page,env.origin);
  const before=await env.page.evaluate(()=>{
    const quiz=state.learningQuizzes[0];quiz.status='completed';quiz.answers=[1];quiz.score=0;quiz.correctCount=0;
    quiz.questions[0].difficulty='easy';quiz.questions[0].explanation='가가 정답인 가상 해설';
    state.learningWrongAnswers=[{id:'qa-copy-wrong',projectId:quiz.projectId,quizId:quiz.id,questionKey:HANI_STUDY_V02984_TEST.questionKey(quiz.projectId,quiz.questions[0]),question:quiz.questions[0].prompt,choices:quiz.questions[0].choices,userAnswer:'나',correctAnswer:'가',explanation:quiz.questions[0].explanation,reviewStatus:'review'}];
    window.qaCopies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>qaCopies.push(text)}});
    showView('study');
    return {protected:localStorage.getItem('hani_os_life_v23'),learning:JSON.stringify([state.learningProjects,state.learningQuizzes,state.learningWrongAnswers])};
  });
  for(const width of [1440,390]){
    await env.page.setViewportSize({width,height:900});
    await env.page.locator('[data-study-tab="board"]').click();
    await env.page.locator('[data-study-project="qa-project"]').click();
    await env.page.locator('[data-study-quiz="qa-quiz"]').click();
    await env.page.locator('[data-hina-quiz="qa-quiz"]').click();
    assert.ok((await env.page.evaluate(()=>qaCopies.at(-1))).includes('내 답: 나'));
    assert.ok((await env.page.locator('#toast').textContent()).includes('복사했습니다'));
    await env.page.locator('#studyQuizDetail [data-hina-set="qa-quiz"]').click();
    assert.ok((await env.page.evaluate(()=>qaCopies.at(-1))).includes('수준: easy'));
    await env.page.screenshot({path:path.join(out,'quiz-'+width+'.png'),fullPage:true});
    await env.page.locator('[data-study-tab="wrong"]').click();
    await env.page.locator('[data-hina-wrong="qa-copy-wrong"]').click();
    await env.page.locator('#studyWrongPanel [data-hina-set="qa-quiz"]').click();
    assert.ok((await env.page.evaluate(()=>qaCopies.at(-1))).includes('히나 과장'));
    assert.equal(await env.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await env.page.screenshot({path:path.join(out,'wrong-'+width+'.png'),fullPage:true});
    evidence.runs.push({width,quizCopy:'PASS',wrongCopy:'PASS',setCopy:'PASS',overflow:'PASS'});
  }
  const board=await env.page.evaluate(()=>{
    const post={id:'qa-topic',authorId:HaniOrganizationRoster.chairman.id,title:'독서: 인간 vs 기계',body:'AI 디스토피아를 다룬 책',category:'LOUNGE'};
    const parent={id:'qa-chair',postId:post.id,authorId:post.authorId,body:'AI 미래가 무섭다 ㅋㅋ'};
    const replies=HaniBoard.ownerReactions(post,parent,[],1);
    const reply={id:'qa-reply',postId:post.id,parentId:parent.id,authorId:'hani',body:'@회장님 회장님, 책 이야기예요.'};
    state.boardPosts=[post];state.boardComments=[parent,reply];showView('board');HaniBoard.openPost(post.id);
    return {replies,display:document.querySelector('.board-reply .board-body')?.textContent,raw:reply.body};
  });
  assert.ok(board.replies.length>0);for(const row of board.replies){assert.equal(row.intent,'fear');assert.equal(row.topic,'book');assert.match(row.body,/책/);assert.doesNotMatch(row.body,/공부|학습/);}
  assert.equal(board.display,'@회장님 책 이야기예요.');assert.equal(board.raw,'@회장님 회장님, 책 이야기예요.');
  evidence.board='PASS';
  evidence.reading=await env.page.evaluate(()=>{
    const rows=intakeRowsFromVision([{target:'book',data:{title:'기계 vs 인간',author:'김대식',status:'read'}}],[],'김대식의 인간 vs 기계 책을 봤어','book');
    return rows[0].data.title;
  });assert.equal(evidence.reading,'인간 vs 기계');
  const after=await env.page.evaluate(()=>({protected:localStorage.getItem('hani_os_life_v23'),learning:JSON.stringify([state.learningProjects,state.learningQuizzes,state.learningWrongAnswers])}));
  assert.deepEqual(after,before);assert.deepEqual(evidence.errors,[]);evidence.status='PASS';
}catch(error){evidence.status=error.message.includes('EPERM')?'BLOCKED':'FAIL';evidence.reason=error.message.split('\n')[0];process.exitCode=1;console.error(evidence.status+': '+evidence.reason);}
finally{if(env)await env.close();fs.writeFileSync(path.join(out,'edge.json'),JSON.stringify(evidence,null,2));}
