// Synthetic VM only: no Local/Cloud persistence, no saved-record rewrites.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url),read=f=>fs.readFileSync(new URL(f,root),'utf8');
const output=new URL('artifacts/lounge-qa-212/',root);
const meta=[/실제\s*(?:예매|경기|점수|날씨|소식).*?(?:없이|말고)/,/작품\s*내용\s*말고/,/유형으로\s*사람을\s*단정/,/성격\s*진단\s*대신/,/대화\s*소재로만|구경거리로만|밈은\s*밈으로만/,/(?:금액|가격)\s*비교\s*(?:없이|대신)/,/재테크\s*조언\s*말고|투자\s*얘기\s*대신/,/확인된\s*(?:사실|내용|만큼|것)|지어내|추측하지|단정하지|원문에\s*적힌\s*그대로/];
const kinship=/언니|누나|오빠|형님|(?:^|[\s,，])형(?=$|[\s,，.!?])/;
const orphan=/^\s*(?:님|씨|아|야)\s*[,，]/;
const sentences=s=>String(s).match(/[^.!?。\n]+(?:[.!?。]+|$)/gu)?.map(s=>s.trim()).filter(Boolean)||[];
const key=s=>s.replace(/^(?:회장님|대표님)[,，!]?\s*/, '').replace(/[\s.!?。,，]+/g,'').toLowerCase();
const plain=x=>JSON.parse(JSON.stringify(x));
let sequence=0,writes=0;
const blocked=()=>{writes++;throw Error('Audit must not persist');};
const context=vm.createContext({window:{},document:{getElementById:()=>null},console,
  uid:()=> 'audit-'+(++sequence),structuredClone,TextEncoder,Uint8Array,
  state:{boardPosts:[],boardComments:[],books:[],movies:[],tasks:[],goalRegistry:[],exercise:[],body:[],ledgerMonths:[]},
  cloudUser:{id:'synthetic'},loadRecovery:{active:false},importSyncHold:false,cloudRecoveryMode:false,
  cloudAutoSyncReady:true,cloudRuntime:{sync:'ON'},cloudHasMeaningfulLocalData:()=>true,
  save:blocked,cloudQueueSync:blocked,localStorage:{getItem:()=>null,setItem:blocked,removeItem:blocked},
  sessionStorage:{getItem:()=>null,setItem:blocked},formatDateTime:String});
for(const file of ['hani-organization-hub.js','hani-character-archive-data.js','hani-relationship-seed.js','hani-board-library.js'])vm.runInContext(read(file),context,{filename:file});
const editorial=read('hani-ui-v02992.js');
vm.runInContext(editorial.slice(editorial.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),editorial.indexOf('const SPORTS_LINES')),context);
const board=read('hani-board.js');
vm.runInContext(board.replace('generateDaily,realEvents,refreshLiving','generateDaily,realEvents,eventDraft,dailyThread,publicationThread,LOUNGE_FUN_POOL,loungeReactions,naturalComments,displayText,authorCard,refreshLiving'),context);
const h=context.window.HaniBoard,roster=context.window.HaniOrganizationRoster;
const name=id=>roster.people.find(p=>p.id===id)?.name.split(/\s*·\s*/).at(-1)||'성민 대표님';
const cases=[],failures=[];
function audit(post,comments,label){
  const used=new Set();
  const fail=(kind,text)=>failures.push({label,kind,text});
  for(const [i,row] of [post,...comments].entries()){
    const text=i?row.body:post.title+'\n'+post.body;
    if(!row.body?.trim())fail('빈 본문',text);
    for(const re of meta)if(re.test(text))fail('메타 문구',text);
    if(kinship.test(text))fail('친족 호칭',text);
    if(orphan.test(row.body))fail('고아 호칭',text);
    if(i&&row.authorId===post.authorId&&!post.ownerTied&&/(?:회장님|대표님)\s*[,，!]/.test(row.body))fail('자기 글 대상 혼동',text);
    // First-person opinions are fine; claiming the chairman's recorded action is not.
    if(!i&&post.ownerTied&&/(?:저는|제가|나는|내가|전|내)\s*[^.!?\n]{0,35}(?:완독했|다 읽었|걸었|몸무게|체중은|달성했|마무리했|끝냈|봤어요|시청했)/.test(row.body))fail('기록 시점 혼동',text);
    for(const sentence of sentences(row.body)){
      const k=key(sentence);if(used.has(k))fail('반복 문장',sentence);used.add(k);
    }
  }
  context.state={...context.state,boardPosts:[post],boardComments:comments.map((c,i)=>({...c,id:label+'-'+i,postId:post.id,generated:true}))};
  const before=plain(context.state);
  for(const c of context.state.boardComments){
    const html=h.commentMarkup(c,!!c.parentId);
    if(/MIR|뮤즈\s*·\s*가은/.test(html))fail('표시 이름',html);
  }
  assert.deepEqual(plain(context.state),before,'render never rewrites saved rows');
  cases.push({label,post:plain(post),comments:plain(comments)});
}

test('300 seeded days: shipped daily posts, all record types, owner threads and rendered names',()=>{
  const start=Date.parse('2026-01-01T14:59:00Z'),pages={book:'reading',movie:'movie',exercise:'exercise',body:'diet',goal:'tasks',achieved:'home',progress:'reading',ledger:'ledger',release:'dev',quarter:'home',dev:'dev'};
  const detail={book:'합성 책 제목',movie:'합성 영화 제목',exercise:'8,000보',body:'70kg',goal:'합성 할 일',achieved:'합성 목표',progress:'목표 진행 화면의 같은 읽기 결과예요. 일부 기록 기준이며 확정 결산과는 구분해요.',ledger:'2026-01',release:'v2.9.211',quarter:'',dev:'라운지 검토 · 검증 대기'};
  let libraryCount=0,recordCount=0,ownerCount=0;
  for(let day=0;day<300;day++){
    const now=start+day*86400000,date=h.dayKey(now);
    context.state={...context.state,boardPosts:[],boardComments:[],books:[{id:'book-'+day,title:detail.book,author:'합성 저자',status:'read',completedDate:date}],movies:[],tasks:[],goalRegistry:[],exercise:[],body:[],ledgerMonths:[]};
    const before=plain(context.state),posts=h.generateDaily(now,[]);
    assert.deepEqual(plain(context.state),before,'daily builder is read-only');
    assert.ok(posts.some(p=>p.libraryId),'real shipped Library exercised');
    for(const post of posts.filter(p=>p.libraryId)){
      const thread=h.publicationThread(post);
      audit(post,thread.comments,date+' / 일상 / '+(++libraryCount));
    }
    for(const [type,page] of Object.entries(pages)){
      const post=h.eventDraft({sourceEventId:type+':'+day,page,date,detail:detail[type]},now);
      assert.ok(post,type+' owner');
      audit(post,[],date+' / 기록 / '+type);recordCount++;
    }
    for(const [topic,title] of [['book','책 독서 이야기'],['ai','AI 이야기'],['stock','주식 이야기'],['exercise','운동 이야기'],['general','오늘 점심 이야기']]){
      const bodies=['무서워요','고마워요','어떻게 생각하세요?','드립 ㅋㅋ','공감해요','이야기해요'];
      const post={id:'owner-'+day+'-'+topic,authorId:roster.chairman.id,category:'LOUNGE',title,body:bodies[day%bodies.length]};
      const label={book:'독서',ai:'인공지능',stock:'주식',exercise:'운동',general:'일상'}[topic];
      audit(post,h.loungeReactions(post,day),date+' / 대표님 대화 / '+label);ownerCount++;
    }
  }
  // Stable seeded reservoir sampling gives reproducible random examples for human review.
  let seed=212;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const threaded=cases.filter(c=>c.comments.length),sample=[];
  threaded.forEach((c,i)=>{if(i<12)sample.push(c);else{const j=Math.floor(random()*(i+1));if(j<12)sample[j]=c;}});
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(new URL('samples.md',output),'# 라운지 QA-212 · 300일 중 무작위 12개 스레드\n\n합성 VM 자료, seed 212. 저장·Cloud 접근 없음. 자동 통과와 사람의 자연스러움 판단은 구분합니다.\n\n'+sample.map((c,i)=>'## '+(i+1)+'. '+c.label+'\n\n**'+name(c.post.authorId)+' · '+c.post.title+'**\n\n'+c.post.body+'\n\n'+c.comments.map(r=>{
    const parent=Number.isInteger(r.replyTo)?c.comments[r.replyTo]:Number.isInteger(r.parentIndex)?c.comments[r.parentIndex]:null;
    return '- '+name(r.authorId)+(parent?' → '+name(parent.authorId):'')+': '+r.body;
  }).join('\n')).join('\n\n')+'\n');
  fs.writeFileSync(new URL('audit.json',output),JSON.stringify({days:300,libraryCount,recordCount,ownerCount,threads:cases.length,writes,failures},null,2)+'\n');
  assert.equal(writes,0);
  assert.equal(failures.length,0,JSON.stringify(failures.slice(0,15),null,2));
  console.log('QA-212:',JSON.stringify({days:300,libraryCount,recordCount,ownerCount,samples:sample.length,writes}));
});

test('suffixes, legacy generated rendering, chairman originals and Korean author/mention names',()=>{
  for(const entry of h.LOUNGE_FUN_POOL){
    for(const re of meta)assert.doesNotMatch(entry.title+' '+entry.body,re,'raw pool must contain human chat');
    assert.doesNotMatch(entry.title+' '+entry.body,kinship);
  }
  for(const suffix of [' 님',' 씨',' 선배님',' 선배',' 언니',' 오빠','님','씨','아','야'])assert.equal(h.stripLeadingVocative('하니'+suffix+', 좋아요.','hani'),'좋아요.',suffix);
  for(const body of ['님, 이 얘기 좋네요.','씨, 이 얘기 좋네요.','하니 언니 얘기 좋아요.','실제 경기 소식 없이 취향만 얘기해요.']){
    const post={id:'legacy',authorId:'hani',generated:true,title:'일상',body:'제 점심 고민이에요.',category:'LOUNGE'};
    const c={id:'legacy-comment',postId:post.id,authorId:'mir',body,generated:true};
    context.state={...context.state,boardPosts:[post],boardComments:[c]};const before=plain(context.state);
    const html=h.commentMarkup(c);assert.doesNotMatch(html,/<p[^>]*>\s*(?:님|씨)\s*[,，]|언니|오빠|MIR/);
    assert.deepEqual(plain(context.state),before);
    assert.equal(h.displayText({...c,authorId:roster.chairman.id},body),body,'chairman-written content stays intact');
  }
  for(const id of ['mir','gaeun']){
    assert.match(h.authorCard(id),new RegExp(name(id)));assert.doesNotMatch(h.authorCard(id),/MIR|뮤즈/);
    const post={id:'names',authorId:'hani',title:'일상',body:'컵 얘기',category:'LOUNGE'};
    const parent={id:'parent',postId:post.id,authorId:id,body:'공감해요.',generated:true};
    const child={id:'child',postId:post.id,authorId:'yuna',parentId:parent.id,body:'저도요.',generated:true};
    context.state={...context.state,boardPosts:[post],boardComments:[parent,child]};
    assert.ok(h.commentMarkup(child,true).includes('@'+name(id)+'</span>'));
  }
});

test('staff self-replies, real chairman replies and complete sentence/history dedupe stay distinct',()=>{
  const post={id:'perspective',authorId:'haru',title:'저는 따뜻한 컵이 좋아요',body:'컵 고르는 시간이 즐거워요.',category:'LOUNGE'};
  const before=plain(post),rows=[
    {authorId:'haru',body:'회장님, 저도 그 컵 좋아요. 따뜻한 차가 생각나요.'},
    {authorId:'hina',body:'다른 첫 문장이에요. 따뜻한 차가 생각나요.'},
    {authorId:'yuna',body:'또 다른 첫 문장이에요. 따뜻한 차가 생각나요.'}
  ];
  const copy=plain(rows),clean=h.naturalComments(post,rows);
  assert.doesNotMatch(clean[0].body,/회장님|대표님/);
  assert.equal(clean.filter(c=>c.body.includes('따뜻한 차가 생각나요.')).length,1,'second sentences share a budget');
  const history=[{postId:post.id,body:'따뜻한 차가 생각나요.'}];
  assert.ok(h.naturalComments(post,rows,history).every(c=>!c.body.includes(history[0].body)));
  const saved={id:'saved-self',postId:post.id,authorId:post.authorId,body:'회장님, 저도 그 컵 좋아요.',generated:true};
  context.state={...context.state,boardPosts:[post],boardComments:[saved]};
  const original=plain(context.state);
  assert.doesNotMatch(h.commentMarkup(saved),/<p[^>]*>회장님,/);
  assert.deepEqual(plain(context.state),original,'existing generated self-reply is cleaned only for display');
  const source={id:'chairman-reply',authorId:roster.chairman.id,body:'@하루 어떤 컵이 좋아요?'};
  const direct=h.ownerReactions(post,source,[],3);
  assert.ok(direct.length);for(const c of direct)assert.match(c.body,/^(회장님|대표님),/,'reply to actual chairman keeps its addressee');
  assert.deepEqual(plain(post),before);assert.deepEqual(plain(rows),copy);
  for(const category of ['WORK','MEMORY','LOUNGE','LIFE'])for(const from of roster.people)for(const to of [...roster.people,roster.chairman]){
    assert.doesNotMatch(h.staffAddress(from.id,to.id,{category},212),kinship);
  }
});
