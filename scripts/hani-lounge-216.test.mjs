// Synthetic VM fixtures; production save/storage/network are never used.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateComments,createLoungeHandler} from '../supabase/functions/hani-lounge-ai/handler.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const good=[{authorId:'hani',body:'회장님, 병원 가방은 챙기셨어요?',parentIndex:null,delayMinutes:180},{authorId:'naeun',body:'회장님, 병원 다녀오시는 동안 여기서 응원할게요.',parentIndex:null,delayMinutes:180},{authorId:'hina',body:'응원 도장 저도 꾹 찍을게요.',parentIndex:0,delayMinutes:180}];
function client({invoke,connected=true}={}){
  let seq=0,writes=0,fail=false;const calls=[];
  const c=vm.createContext({window:{},document:{getElementById:()=>null},console,setTimeout,clearTimeout,structuredClone,TextEncoder,Uint8Array,
    uid:()=>`life216-${++seq}`,state:{boardPosts:[],boardComments:[],books:[],movies:[],tasks:[],goalRegistry:[],exercise:[],body:[],ledgerMonths:[]},
    cloudUser:{id:'owner'},loadRecovery:{active:false},importSyncHold:false,cloudRecoveryMode:false,cloudAutoSyncReady:true,cloudRuntime:{sync:'ON'},cloudHasMeaningfulLocalData:()=>true,
    save:()=>{writes++;return {ok:!fail}},sessionStorage:{getItem:()=>null,setItem:()=>{throw Error('unexpected session write')}},formatDateTime:String});
  if(connected)c.cloudClient={functions:{invoke:async(name,request)=>{assert.equal(name,'hani-lounge-ai');calls.push(plain(request.body));return invoke?invoke(request.body):{data:{ok:true,comments:good}}}}};
  for(const f of ['hani-organization-hub.js','hani-character-archive-data.js','hani-relationship-seed.js','hani-board-library.js'])vm.runInContext(read(f),c);
  const editorial=read('hani-ui-v02992.js');vm.runInContext(editorial.slice(editorial.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),editorial.indexOf('const SPORTS_LINES')),c);
  vm.runInContext(read('hani-board.js').replace('generateDaily,realEvents,refreshLiving','generateDaily,realEvents,refreshLiving,materialize,requestLoungeAI,displayText,authorCard,loungeReactions'),c);
  const h=c.window.HaniBoard;c.state.boardPosts=[{id:'settings',boardMeta:true,authorId:'seongmin',templateCleanupV4:true}];
  return {c,h,calls,get writes(){return writes},fail:()=>fail=true};
}
const flush=async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r))};
const input={category:'LOUNGE',title:'나 다음주에 수술받는다 ㅠㅠ',body:'끄아아앙 무서워 얘들아'};
test('own new post requests one thread and replaces its pending template batch; edit does not request',async()=>{
  const t=client();assert.equal(t.h.savePost(input),true);assert.equal(t.calls.length,1);assert.equal(t.calls[0].mode,'thread');assert.equal(t.calls[0].limit,4);
  assert.equal(t.calls[0].post.authorId,'seongmin');assert.ok(t.calls[0].staff.length>=3&&t.calls[0].staff.length<=6);
  assert.ok(t.calls[0].staff.some(s=>s.id==='naeun'));assert.ok(t.calls[0].staff.every(s=>s.voice.includes('회장님')));
  await flush();const p=t.c.state.boardPosts.find(p=>!p.boardMeta),rows=t.c.state.boardComments;
  assert.equal(rows.length,3);assert.ok(rows.every(c=>c.ai&&c.pending&&c.threadId==='reply:'+p.id));assert.equal(rows[2].parentId,rows[0].id);
  const times=rows.map(c=>Date.parse(c.scheduledAt));assert.ok(times[0]<times[1]&&times[1]<times[2]);
  assert.ok(times.every(at=>at-Date.parse(rows[0].createdAt)<=180*60000),'stagger stays under 180 minute bound');
  assert.equal(t.h.savePost({...input,body:'병원 일정 확인했어요'},p.id),true);await flush();assert.equal(t.calls.length,1);
  assert.ok(t.h.materialize(t.c.state.boardPosts,rows,Date.now()+86400000).comments.every(c=>c.disposition==='stale'),'edited post retires stale AI');
});
test('quota, offline, failed save, rejected/short output retain topic fallback without new storage paths',async()=>{
  for(const variant of ['cap','offline','invalid','short']){
    const t=client({connected:variant!=='offline',invoke:async()=>({data:{ok:true,comments:variant==='short'?good.slice(0,2):[{...good[0],body:'오빠 괜찮아요.'}]}})});
    if(variant==='cap')t.c.state.boardPosts[0].loungeAI={owner:'owner',day:t.h.dayKey(Date.now()),count:30};
    assert.equal(t.h.savePost(input),true);await flush();
    assert.equal(t.calls.length,['cap','offline'].includes(variant)?0:1);assert.ok(t.c.state.boardComments.length);
    assert.ok(t.c.state.boardComments.every(c=>!c.ai&&/병원|건강/.test(c.body)&&!c.body.includes('대표님')));
    assert.ok(t.h.materialize(t.c.state.boardPosts,t.c.state.boardComments,Date.now()+86400000).comments.every(c=>!c.pending));
  }
  const t=client();t.fail();assert.equal(t.h.savePost(input),false);await flush();assert.equal(t.calls.length,0);assert.equal(t.c.state.boardPosts.length,1);
});
test('own thread queue waits in flight; timeout/error, account switch, protected baseline and cap stay guarded',async()=>{
  let finish;const t=client({invoke:()=>new Promise(r=>finish=r)});t.h.savePost(input);
  const before=plain(t.c.state.boardComments);assert.ok(before.length);
  assert.ok(t.h.materialize(t.c.state.boardPosts,t.c.state.boardComments,Date.now()+86400000,true).comments.every(c=>c.pending));
  t.c.cloudUser={id:'other'};finish({data:{ok:true,comments:good}});await flush();assert.deepEqual(plain(t.c.state.boardComments),before);
  const blocked=client();blocked.c.loadRecovery.active=true;assert.equal(blocked.h.savePost(input),false);assert.equal(blocked.writes,0);assert.equal(blocked.calls.length,0);
  const failed=client({invoke:async()=>{throw Error('offline')}});failed.h.savePost(input);await flush();assert.ok(failed.c.state.boardComments.every(c=>!c.ai));
});
test('POST body and comment choose all six topics, with warm Canon voices and no treatment advice',()=>{
  const t=client({connected:false});
  for(const [body,topic,word] of [['수술받으러 병원에 간다 무서워','health',/병원|건강/],['시험 공부가 무서워','study',/시험|공부/],['주식 투자가 무서워','stock',/주식|투자|주가/],['업무가 밀려 야근한다 걱정돼','work',/일|업무|야근/],['여행 휴가 계획이 걱정돼','travel',/여행|휴가/],['승진 축하 고마워','celebration',/성과|축하|기쁜/]]){
    const p={id:'topic-'+topic,authorId:'seongmin',title:'오늘 이야기',body,category:'LOUNGE'};
    assert.equal(t.h.chairmanReplyTopic(p),topic);assert.equal(t.h.chairmanReplyTopic(p,'고마워요'),topic);
    for(let i=0;i<12;i++)for(const r of t.h.loungeReactions(p,i)){
      assert.match(r.body,word);assert.match(r.body,/^회장님/);assert.doesNotMatch(r.body,/대표님|복약|금식|반드시|완치|걱정될 만해요|불안한 마음은 이해해요/);
    }
  }
  for(const id of ['hani','naeun','hina'])assert.equal(t.h.staffAddress(id,'seongmin',{category:'LOUNGE'},15),'회장님');
  const p={id:'health',authorId:'seongmin',title:'수술',body:'무서워',category:'LOUNGE'};
  const rows=Array.from({length:30},(_,i)=>t.h.ownerReactions(p,p,[],i)).flat();
  for(const id of ['hani','naeun','hina']){assert.ok(rows.some(c=>c.authorId===id));assert.ok(rows.filter(c=>c.authorId===id).every(c=>/💜|ㅎㅎ/.test(c.body)),id)}
});
test('read-only staff address normalization and official sprite crop preserve original rows',()=>{
  const t=client({connected:false}),row={authorId:'naeun',body:'대표님 병원 가방 챙기셨어요?',generated:false},before=plain(row);
  assert.equal(t.h.displayText(row,row.body),'회장님 병원 가방 챙기셨어요?');assert.deepEqual(plain(row),before);
  assert.equal(t.h.displayText({authorId:'seongmin'},'대표님 이야기'),'대표님 이야기');
  assert.match(t.h.authorCard('seongmin'),/board-avatar-chairman/);assert.match(t.h.authorCard('seongmin'),/assets\/sprites-v2\/seongmin.webp/);
  assert.ok(fs.existsSync(new URL('../assets/sprites-v2/seongmin.webp',import.meta.url)));
  assert.match(read('hani-board.css'),/\.board-avatar-chairman img\.board-avatar\{width:800%;height:auto;max-width:none/);
  assert.match(read('hani-style-01.css'),/\.nav-btn \.txt\{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\}/);
  assert.match(read('hani-style-01.css'),/\.nav-btn\{display:flex;align-items:center;gap:10px;min-width:0;max-width:100%;overflow:hidden;/);
});
test('server prompt carries relationship/topic/medical boundaries; validates Canon and keeps auth/quota contract',async()=>{
  let upstream;
  const staff=['hani','naeun','hina'].map(id=>({id,name:id,rank:'사원',team:'생활',voice:'따뜻한 존댓말'}));
  const payload={mode:'thread',post:{id:'post',title:input.title,body:input.body,authorId:'seongmin'},comments:[],staff,limit:4};
  const handler=createLoungeHandler({env:k=>({SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'fixture',OPENAI_API_KEY:'fixture-upstream',HANI_OWNER_USER_ID:'owner'})[k],authenticatedUser:async()=>({id:'owner'}),fetch:async(url,req)=>{upstream=JSON.parse(req.body);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({comments:good.map(c=>({...c,body:c.body.replace('회장님','대표님')}))})}]}]})}});
  const res=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify(payload)}));
  assert.equal(res.status,200);const result=await res.json();assert.equal(result.comments.length,3);assert.ok(result.comments.every(c=>!c.body.includes('대표님')));
  assert.match(upstream.instructions,/하니·나은·히나/);assert.match(upstream.instructions,/진단·치료·복약·금식 조언이나 결과 보장은 금지/);assert.match(upstream.instructions,/parentIndex/);
  assert.deepEqual(validateComments([{...good[0],body:'오빠 괜찮아요.'}],payload),[]);
});
