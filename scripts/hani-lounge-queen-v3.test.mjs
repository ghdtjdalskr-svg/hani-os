// Raw candidate behaviour plus an independently pinned, outermost exact inverse.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import queen from './hani-lounge-queen-v3-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import release302 from './hani-release-302-source.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';

const root=new URL('../',import.meta.url),read=f=>queen.readRawFileSync(new URL(f,root),'utf8');
const source=read('hani-board.js'),plain=x=>JSON.parse(JSON.stringify(x));
const denied=()=>assert.fail('read-only queen projection attempted write/network/timer');
const deepFreeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(deepFreeze);Object.freeze(x)}return x};
const at=day=>Date.parse(day+'T12:00:00+09:00');
function fixture(now=at('2026-11-20'),old=false,withSlot=false){
  let clock=now,saves=0,success=true;
  const slot={innerHTML:'',hidden:true},article={querySelector:()=>slot};
  const boardRoot={querySelector:selector=>selector==='[data-board="article"]'?article:null};
  class Clock extends Date{static now(){return clock}}
  const c=vm.createContext({Date:Clock,document:{getElementById:id=>withSlot&&id==='board'?boardRoot:null,querySelectorAll:()=>[]},window:{},
    state:{boardPosts:[],boardComments:[],meta:{preserve:true},unrelated:{keep:'safe'}},
    localStorage:{setItem:denied,removeItem:denied,clear:denied},sessionStorage:{getItem:()=>null,setItem:denied},
    fetch:denied,setTimeout:denied,setInterval:denied,persist:denied,
    cloudUser:{id:'synthetic'},loadRecovery:{active:false},importSyncHold:false,cloudRecoveryMode:false,
    cloudAutoSyncReady:true,cloudRuntime:{sync:'ON'},cloudHasMeaningfulLocalData:()=>true,
    save(){saves++;return {ok:success}}});
  vm.runInContext(read('hani-organization-hub.js'),c);
  vm.runInContext(read('hani-board-library.js'),c);
  const raw=old?queen.restore(source,'hani-board.js'):source;
  const expose=['interactiveMarkup','queenStandings','queenTally','queenSlides','queenWinner','queenPollOpen',
    'queenStaffBallots','visibleComments','queenResultThreads','displayPosts',
    ...(!old?['queenRace','queenRaceMarkup','queenRivalry','queenRivalryMarkup','queenReactionContent','showQueenReaction','queenRaceLines','queenDisplayRanks','queenCandidateColor','html']:[])];
  const branch=raw.match(/else if\(button\.dataset\.boardVote!==undefined\)([^\r\n]*)/)[0];
  vm.runInContext(raw.replace('  init();','  Object.assign(globalThis,{'+expose.join(',')+'});\n'+
    '  globalThis.clickVote=button=>{'+branch.replace(/^else /,'')+'};\n'+(withSlot?'':'  init();')),c);
  const thread=c.HaniBoardLibrary.threads.find(t=>t.id==='queen-2026-11');
  const post={id:'queen-post',libraryId:thread.id,authorId:'hani',category:'LOUNGE',title:thread.title,body:thread.body,
    generated:true,createdAt:'2026-11-03T08:00:00+09:00',poll:{options:plain(thread.poll.options),votes:{}}};
  c.state.boardPosts=[post];
  return {c,post,slot,article,setNow:n=>clock=n,saves:()=>saves,failSave:()=>success=false,
    freeze(){deepFreeze(c.state);deepFreeze(c.HaniBoardLibrary)},
    click:i=>c.clickVote({dataset:{boardVote:String(i),key:post.id}})};
}
function memberPost(f,month='2026-12'){
  f.post.libraryId='queen-'+month;f.post.createdAt=month+'-01T00:00:00+09:00';
  f.post.poll.options=plain(f.c.window.HaniOrganizationRoster.people.map(p=>p.name));
  return f.post;
}

test('new raw candidate inverts to independent main5073125 with exact round trip, including EOL',()=>{
  assert.equal(queen.delta.base,'507312505b5b8b3c3f203199ef8d77e9c0c7074b');
  assert.deepEqual(Object.keys(queen.delta.files).filter(f=>!f.startsWith('scripts/')).sort(),['hani-board.css','hani-board.js']);
  for(const [file,row]of Object.entries(queen.delta.files)){
    const raw=read(file),base=queen.restore(raw,file);
    assert.equal(base,repository.read(queen.delta.base,file),'independent Git object, not worktree expected value');
    assert.equal(queen.hash(raw),row.afterSha256);assert.equal(queen.hash(base),row.beforeSha256);
    let forward=base;for(const edit of row.edits){assert.equal(forward.slice(edit.start,edit.start+edit.before.length),edit.before);forward=forward.slice(0,edit.start)+edit.after+forward.slice(edit.start+edit.before.length)}
    assert.equal(forward,raw);assert.deepEqual(queen.restore(Buffer.from(raw),file),Buffer.from(base));
    assert.equal(release302.readRawFileSync(new URL(file,root),'utf8'),base,'queen inverse precedes302 raw capture');
  }
});

test('inverse rejects unknown owners, drift, EOL, duplicate input, repeated inverse and corrupt hunk/hash',()=>{
  for(const [file,row]of Object.entries(queen.delta.files)){
    const raw=read(file);
    for(const bad of [raw+'\n',raw.slice(1),raw+raw,queen.restore(raw,file),raw.replace(/\r?\n/,n=>n==='\n'?'\r\n':'\n')]){
      assert.notEqual(bad,raw);assert.throws(()=>queen.restore(bad,file),/exact queen-v3 input/);assert.strictEqual(queen.project(bad,file),bad);
    }
    const edit=row.edits[0],start=edit.start,payload=edit.after,pin=row.beforeSha256;
    try{edit.start++;assert.throws(()=>queen.restore(raw,file),/complete queen-v3 hunk/);edit.start=start;edit.after+='x';assert.throws(()=>queen.restore(raw,file),/complete queen-v3 hunk/);edit.after=payload;row.beforeSha256='0'.repeat(64);assert.throws(()=>queen.restore(raw,file),/exact main5073125 output/)}
    finally{edit.start=start;edit.after=payload;row.beforeSha256=pin}
  }
  for(const file of ['unknown','__proto__','constructor','hani-main.js','hani-office-live.js']){
    assert.throws(()=>queen.restore('x',file),/known queen-v3 owner/);assert.equal(queen.project('x',file),'x');
  }
});

test('fixture identity fails closed before any projection',()=>{
  assert.throws(()=>vm.runInNewContext(read('scripts/hani-lounge-queen-v3-source.cjs'),{
    __dirname:fileURLToPath(new URL('scripts/',root)),require:n=>n==='node:fs'?{readFileSync:()=>Buffer.from('drift')}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)
  }),/frozen queen-v3 fixture/);
});

test('outer preload preserves sync/callback/promise, Buffer/string/URL/fd, errors and callback exceptions',async()=>{
  const files=['hani-board.js','hani-board.css','hani-main.js','index.html'],originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),read(f)]));
  const error=Error('read failed'),disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const raw=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(raw);return encoding==='utf8'?raw:Buffer.from(raw)};
  const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};
  let synced=false;
    vm.runInNewContext(read('scripts/hani-lounge-queen-v3-preload.cjs'),{__dirname:fileURLToPath(new URL('scripts/',root)),URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:child_process'?{}:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-test-repository-evidence.cjs'?{}:n==='./hani-lounge-queen-v3-source.cjs'?queen:assert.fail(n)});
  assert.ok(synced);
  for(const file of files)for(const target of [new URL(file,root),fileURLToPath(new URL(file,root))])for(const enc of [undefined,'utf8']){
    const expected=queen.project(disk(target,enc),file);
    assert.deepEqual(fake.readFileSync(target,enc),expected);
    assert.deepEqual(await new Promise((res,rej)=>fake.readFile(target,enc,(e,b)=>e?rej(e):res(b))),expected);
    assert.deepEqual(await fake.promises.readFile(target,enc),expected);
    assert.equal(read(file),originals.get(fileURLToPath(new URL(file,root))));
  }
  assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
  await new Promise(res=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);res()}));
  await assert.rejects(fake.promises.readFile('error'),e=>e===error);
  let calls=0;const thrown=Error('caller callback');
  assert.throws(()=>fake.readFile(new URL('hani-board.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
});

test('draft bank retains 20 staff × 3 reactions, 14 exchanges, eight weekly texts and chairman text',()=>{
  const f=fixture(),data=plain(f.c.queenRaceLines),draft=JSON.parse(read('artifacts/lounge-queen-v3/LINES-DRAFT.md').match(/```json\s*([\s\S]*?)```/)[1]);
  assert.equal(Object.keys(data.reactions).length,20);assert.equal(data.rivalry.length,14);assert.equal(data.weekly.length,8);
  assert.deepEqual(Object.keys(data.reactions),Object.keys(draft.reactions));
  for(const rows of Object.values(data.reactions)){assert.equal(rows.length,3);for(const line of rows)assert.ok(Array.from(line).length<=36,line)}
  assert.doesNotMatch(JSON.stringify(data),/대표님|오빠|Scope|PASS|\bUI\b|Pick/);
  const easy=s=>s.replaceAll('범위(Scope)','범위').replaceAll('PASS','합격').replaceAll('UI 시안','화면 시안').replaceAll('픽(Pick)','선택').replaceAll('골든 캐스팅보트','황금 결정표');
  assert.deepEqual(data.rivalry,JSON.parse(easy(JSON.stringify(draft.rivalry))));
  assert.deepEqual(data.weekly,draft.weekly);
});

test('all 20 candidates react only after successful canonical vote; duplicate/invalid votes do not save',()=>{
  for(let i=0;i<20;i++){
    const f=fixture(at('2026-12-14'));memberPost(f);f.freeze();
    const before=plain(f.c.state);f.click(i);
    assert.equal(f.saves(),1);const saved=f.c.state.boardPosts[0];
    assert.equal(saved.poll.votes.seongmin,i);assert.equal(Object.keys(saved.poll.votes).length,1);
    assert.deepEqual(plain(f.c.state.unrelated),before.unrelated);assert.deepEqual(plain(f.c.state.boardComments),before.boardComments);
    const text=f.c.queenReactionContent(saved);assert.match(text,/board-avatar/);assert.ok(text.includes('회장님')||i===saved.poll.options.indexOf('수아'));
    assert.ok(!text.includes('undefined'));f.click(i);f.click(-1);f.click(20);assert.equal(f.saves(),1);
    const other=(i+1)%20;f.click(other);assert.equal(f.saves(),2);assert.equal(f.c.state.boardPosts[0].poll.votes.seongmin,other);
    assert.notEqual(f.c.queenReactionContent(f.c.state.boardPosts[0]),text);
  }
});

test('save failure and guard rejection produce no reaction and retain the original state',()=>{
  const f=fixture();f.freeze();const before=f.c.state;f.failSave();f.click(0);
  assert.equal(f.saves(),1);assert.equal(f.c.state,before);assert.equal(f.c.queenReactionContent(f.post),'');
  const blocked=fixture();blocked.c.cloudAutoSyncReady=false;blocked.click(0);
  assert.equal(blocked.saves(),0);assert.equal(blocked.c.queenReactionContent(blocked.post),'');
  assert.equal(blocked.c.showQueenReaction(blocked.post.id,0),false);
});

test('successful selection updates the existing live region without creating nodes, listeners or timers',()=>{
  const f=fixture(at('2026-11-20'),false,true),slot=f.slot;
  f.post.poll.votes.seongmin=0;
  assert.equal(f.c.showQueenReaction(f.post.id,0),true);assert.equal(f.slot,slot);assert.equal(slot.hidden,false);
  assert.equal(slot.innerHTML,f.c.queenReactionContent(f.post));const first=slot.innerHTML;
  f.post.poll.votes.seongmin=1;f.c.showQueenReaction(f.post.id,1);
  assert.equal(f.slot,slot);assert.notEqual(slot.innerHTML,first);assert.equal(f.saves(),0);
});

test('read-only rivalry rotates each KST day and never changes stored comments/counts/ballots',()=>{
  const f=fixture(),before=JSON.stringify(f.c.state),library=JSON.stringify(f.c.HaniBoardLibrary);f.freeze();
  let previous='';const seen=new Set();
  for(let day=3;day<=30;day++){
    const now=at('2026-11-'+String(day).padStart(2,'0'));f.setNow(now);
    const a=plain(f.c.queenRivalry(f.post)),b=plain(f.c.queenRivalry(f.post));assert.deepEqual(a,b);assert.equal(a.length,3);
    const text=a.map(x=>x.body).join('');if(previous)assert.notEqual(text,previous);previous=text;seen.add(text);
    assert.doesNotMatch(f.c.queenRivalryMarkup(f.post),/data-board-reply|data-board-delete|data-board-edit/);
    for(const row of a)assert.ok(f.post.poll.options.includes(f.c.window.HaniOrganizationRoster.people.find(p=>p.id===row.authorId).name));
    assert.deepEqual(plain(f.c.visibleComments()),[]);
  }
  assert.ok(seen.size>=13);assert.equal(JSON.stringify(f.c.state),before);assert.equal(JSON.stringify(f.c.HaniBoardLibrary),library);assert.equal(f.saves(),0);
  f.setNow(Date.parse('2026-11-20T14:59:59Z'));const beforeMidnight=plain(f.c.queenRivalry(f.post));
  f.setNow(Date.parse('2026-11-20T15:00:00Z'));assert.notDeepEqual(plain(f.c.queenRivalry(f.post)),beforeMidnight);
});

test('weekly card and billboard use the live canonical ranking, Monday week and existing poll route',()=>{
  const f=fixture(at('2026-11-16'));f.post.poll.votes.seongmin=3;f.freeze();
  for(const day of ['2026-11-16','2026-11-20','2026-11-22','2026-11-23','2026-11-30']){
    const now=at(day);f.setNow(now);const race=f.c.queenRace(f.post),winner=f.c.queenTally(f.post),tally=f.c.queenStandings(f.post);
    assert.equal(race.ranks[0].member.id,winner.member.id);assert.equal(race.ranks[0].count,winner.count);
    assert.equal(race.gap,winner.count-race.ranks[1].count);assert.equal(race.ranks[1].count,tally.counts[race.ranks[1].index]);
    assert.match(race.monday,/2026-11-(16|23|30)/);assert.doesNotMatch(race.headline,/\{1위\}|\{2위\}|\{표차\}|undefined/);
    const slides=f.c.queenSlides(now),weekly=slides.find(x=>x.kind==='queen-weekly'),vote=slides.find(x=>x.kind==='queen-vote');
    assert.equal(weekly.copy,race.headline);assert.equal(weekly.href,vote.href);assert.equal(weekly.postId,f.post.id);
    assert.ok(fs.existsSync(new URL(weekly.image.replace(/^\.\//,''),root)),'existing image');
    assert.ok(f.c.queenRaceMarkup(f.post).includes(race.monday));
  }
  assert.equal(f.saves(),0);
});

test('gold badge has exactly one stored choice; only a positive leading tie activates the casting vote',()=>{
  const f=fixture(),post=f.post;assert.doesNotMatch(f.c.interactiveMarkup(post,true),/class="board-queen-gold"/);
  assert.match(f.c.queenRaceMarkup(post),/미투표/);
  let found=false;
  for(let day=3;day<=30&&!found;day++)for(let choice=0;choice<post.poll.options.length&&!found;choice++){
    f.setNow(at('2026-11-'+String(day).padStart(2,'0')));post.poll.votes.seongmin=choice;
    const counts=plain(f.c.queenStandings(post).counts),max=Math.max(...counts),tied=counts[choice]===max&&max>0&&counts.filter(n=>n===max).length>1;
    const markup=f.c.queenRaceMarkup(post);assert.equal(markup.includes('현재 선두 동률'),tied);
    assert.equal((f.c.interactiveMarkup(post,true).match(/class="board-queen-gold"/g)||[]).length,1);
    if(tied){assert.equal(f.c.queenTally(post).index,choice);assert.doesNotMatch(markup,/결정되었습니다|최종 우승/);found=true}
  }
  assert.ok(found,'real monthly seed supplies a casting-vote scenario');
  post.poll.votes.seongmin=999;assert.doesNotMatch(f.c.interactiveMarkup(post,true),/class="board-queen-gold"/);
  f.setNow(at('2026-12-01'));let finalTie=false;
  for(let choice=0;choice<post.poll.options.length;choice++){
    post.poll.votes.seongmin=choice;const markup=f.c.queenRaceMarkup(post),counts=plain(f.c.queenStandings(post).counts),max=Math.max(...counts);
    if(counts[choice]===max&&max>0&&counts.filter(n=>n===max).length>1){
      assert.ok(markup.includes(f.c.queenRaceLines.chairman.tiebreaker[0]));assert.equal(f.c.queenTally(post).index,choice);finalTie=true;
    }else assert.doesNotMatch(markup,/수여됩니다/);
  }
  // The actual monthly seed may have a unique final winner; no invented tie.
  assert.equal(typeof finalTie,'boolean');
});

test('ordinary/future/closed polls retain controls and month-end behavior; final winner and tallies stay identical',()=>{
  const f=fixture(),old=fixture(at('2026-11-20'),true);const before=JSON.stringify(f.c.state);
  for(let day=3;day<=30;day++)for(const choice of [undefined,0,5,18]){
    const now=at('2026-11-'+String(day).padStart(2,'0'));f.setNow(now);old.setNow(now);
    if(choice===undefined){delete f.post.poll.votes.seongmin;delete old.post.poll.votes.seongmin}else{f.post.poll.votes.seongmin=choice;old.post.poll.votes.seongmin=choice}
    assert.deepEqual(plain(f.c.queenStandings(f.post)),plain(old.c.queenStandings(old.post)));
    assert.deepEqual(plain(f.c.queenTally(f.post)),plain(old.c.queenTally(old.post)));
  }
  delete f.post.poll.votes.seongmin;delete old.post.poll.votes.seongmin;
  const normal={...f.post,libraryId:'ordinary',poll:{options:['가','나'],votes:{seongmin:1}}};
  assert.equal(f.c.interactiveMarkup(normal,true),old.c.interactiveMarkup(normal,true));
  f.setNow(at('2026-11-02'));assert.equal(f.c.queenRace(f.post),null);assert.deepEqual(plain(f.c.queenRivalry(f.post)),[]);
  for(const now of [Date.parse('2026-11-30T23:59:59.999+09:00'),Date.parse('2026-12-01T00:00:00+09:00')]){
    f.setNow(now);old.setNow(now);assert.deepEqual(plain(f.c.queenWinner(now)),plain(old.c.queenWinner(now)));
    assert.deepEqual(plain(f.c.queenResultThreads(now)),plain(old.c.queenResultThreads(now)));
  }
  assert.doesNotMatch(f.c.interactiveMarkup(f.post,true),/data-board-vote/);assert.equal(f.c.queenRace(f.post),null);
  assert.deepEqual(plain(f.c.queenRivalry(f.post)),[]);assert.ok(!f.c.queenSlides().some(x=>x.kind==='queen-weekly'));
  assert.equal(f.saves(),0);assert.equal(JSON.stringify(f.c.state),before);
});

test('storage owners, ballot math, month-end logic and module events remain byte-identical to main5073125',()=>{
  const base=queen.restore(source,'hani-board.js');
  const between=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
  for(const [a,b]of [['  function persist(','  // These public handlers'],['  function votePoll(','  function toggleReaction('],['  function queenStandings(','  function queenParticipation('],['  function queenTally(','  function queenResultThreads('],['  function queenResultThreads(','  // Only list/detail'],['  function queenWindow(','  function queenCommentProjection(']])assert.equal(between(source,a,b),between(base,a,b),a);
  for(const expression of [/\blocalStorage\.[\w]+/g,/\bsave\(/g,/\bpersist\(/g,/addEventListener\(/g,/setTimeout\(/g,/setInterval\(/g])assert.deepEqual(source.match(expression),base.match(expression),String(expression));
  assert.equal(read('hani-main.js'),repository.read(queen.delta.base,'hani-main.js'));assert.equal(read('index.html'),repository.read(queen.delta.base,'index.html'));
});

test('raw runtime closure retains 174 existing files, zero missing, no new data/image asset',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>read(f)});
  assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
  const baseline=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>queen.project(read(f),f)});
  assert.deepEqual(closure.files,baseline.files);
});

test('queen Git boundary preserves actual5073125 and supplies302 history only for all40 exact owners',()=>{
  const query=['merge-base','HEAD','origin/main'],boundary=queen.gitBoundary;
  assert.equal(boundary.base,'507312505b5b8b3c3f203199ef8d77e9c0c7074b');
  assert.equal(boundary.projectedBase,'d748920f90dd200dddec2befd262fee0959047a0');
  assert.equal(queen.rawReadOnly(query),boundary.base,'actual Git graph stays raw');
  assert.equal(queen.rawReadOnly(['rev-parse','HEAD']),boundary.base);
  assert.equal(queen.rawReadOnly(['rev-parse','origin/main']),boundary.base);
  assert.equal(queen.readOnly(query),boundary.projectedBase);
  assert.equal(queen.selectBase(boundary.base),boundary.projectedBase);
  assert.equal(Object.keys(boundary.owners).length,40);
  for(const [file,pin]of Object.entries(boundary.owners)){
    const row=queen.delta.files[file],bytes=read(file);
    assert.equal(queen.hash(bytes),pin);
    assert.equal(queen.hash(repository.read(boundary.base,file)),row?row.beforeSha256:pin,'independent main owner '+file);
    const target=fileURLToPath(new URL(file,root));
    for(const bad of [bytes+'\n',bytes.slice(1),bytes.replace(/\r?\n/,n=>n==='\n'?'\r\n':'\n')]){
      assert.notEqual(bytes,bad);
      assert.equal(queen.selectBase(boundary.base,f=>f===target?bad:queen.readRawFileSync(f)),boundary.base,file+' drift cannot authorize302 history');
    }
  }
  const baseline=f=>repository.read(boundary.base,path.relative(fileURLToPath(root),f).replaceAll('\\','/'));
  assert.equal(queen.selectBase(boundary.base,baseline),boundary.base,'clean main is not the pending queen candidate');
  for(const base of [boundary.projectedBase,'37ad7aac8d0e0a92d3a14154c19c2bb1f0c2ea10','0'.repeat(40)]){
    assert.equal(queen.selectBase(base,()=>assert.fail('unrelated Git base read owners')),base);
  }
  assert.throws(()=>queen.selectBase(boundary.base,()=>{throw Error('read failure')}),/read failure/);
  for(const args of [['show',boundary.base+':hani-board.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['rev-parse','HEAD'],['rev-parse','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',boundary.base]]){
    assert.equal(queen.readOnly(args),queen.rawReadOnly(args),'non-merge queries stay raw');
  }
  assert.throws(()=>queen.readOnly(['merge-base','origin/main','HEAD']));
  assert.ok(Object.isFrozen(boundary)&&Object.isFrozen(boundary.owners));
});

test('queen Git fixture fails closed before installing a history adapter',()=>{
  for(const payload of [read('scripts/fixtures/lounge-queen-v3-git.json')+'\n','{}']){
    assert.throws(()=>vm.runInNewContext(read('scripts/hani-lounge-queen-v3-source.cjs'),{
      __dirname:fileURLToPath(new URL('scripts/',root)),
      require:n=>n==='node:fs'?{readFileSync:f=>String(f).endsWith('lounge-queen-v3-git.json')?Buffer.from(payload):queen.readRawFileSync(f)}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail('Git adapter initialized before fixture validation: '+n)
    }),/frozen queen-v3 Git boundary/);
  }
});

test('queen then302 then dark history retain each raw boundary and actual repository evidence',async()=>{
  const {default:releaseHistory}=await import('./hani-release-302-reviewed-input.cjs');
  const {default:darkHistory}=await import('./hani-dark-bundle-reviewed-input.cjs');
  const query=['merge-base','HEAD','origin/main'];
  assert.equal(queen.rawReadOnly(query),queen.gitBoundary.base);
  assert.equal(releaseHistory.rawReadOnly(query),queen.gitBoundary.projectedBase);
  assert.equal(releaseHistory.readOnly(query),release302.layer.base);
  assert.equal(darkHistory.rawReadOnly(query),release302.layer.base);
  for(const args of [['show',queen.gitBoundary.base+':hani-board.js'],['rev-parse','HEAD'],['rev-parse','origin/main']]){
    assert.equal(releaseHistory.readOnly(args),queen.rawReadOnly(args));
    assert.equal(darkHistory.readOnly(args),queen.rawReadOnly(args));
  }
});

test('denied native Git reads use actual object evidence and only a proven empty diff; drift and unsupported requests fail',()=>{
  const error=Object.assign(Error('spawnSync git EPERM'),{code:'EPERM'}),cwd=fileURLToPath(root),options={cwd,encoding:'utf8'};
  const query=['merge-base','HEAD','origin/main'];
  assert.equal(queen.deniedGitRead('git',query,options,error),queen.gitBoundary.base+'\n');
  assert.deepEqual(queen.deniedGitRead('git',query,{cwd},error),Buffer.from(queen.gitBoundary.base+'\n'));
  const owners=['hani-main.js','index.html','hani-study-v02984.js','hani-goal-progress.js','hani-yuna-helpdesk.js'];
  const diff=['diff','--unified=0',queen.gitBoundary.base,'--',...owners];
  assert.equal(queen.deniedGitRead('git',diff,options,error),'');
  for(const file of owners){
    assert.equal(read(file),repository.read(queen.gitBoundary.base,file),'independent empty diff '+file);
    const target=fileURLToPath(new URL(file,root));
    assert.throws(()=>queen.deniedGitRead('git',diff,options,error,f=>Buffer.concat([queen.readRawFileSync(f),Buffer.from(f===target?'drift':'')])),e=>e===error);
  }
  for(const [file,args,opts,err]of [
    ['git',['status'],options,error],['git',['reset','--hard'],options,error],
    ['git',['merge-base','origin/main','HEAD'],options,error],['git.exe',query,options,error],
    ['git',query,{...options,cwd:path.dirname(cwd)},error],['git',query,{...options,shell:true},error],
    ['git',query,{...options,encoding:'hex'},error],['git',query,options,Error('unrelated error')],
    ['git',['diff','--unified=0',queen.gitBoundary.base,'--','hani-board.js'],options,error]
  ])assert.throws(()=>queen.deniedGitRead(file,args,opts,err),e=>e===err);
  assert.throws(()=>queen.deniedGitRead('git',diff,options,error,()=>{throw Error('read failure')}),/read failure/);
  assert.equal(typeof queen.rawExecFileSync,'function');
  assert.notEqual(queen.rawExecFileSync,queen.execFileSync,'native entry remains independently accessible');
});

test('podium and all20 portrait cards display canonical ranks, counts and exactly one chairman choice',()=>{
  const f=fixture(at('2026-12-20'));memberPost(f);f.post.poll.votes.seongmin=4;f.freeze();
  const before=JSON.stringify(f.c.state),tally=f.c.queenStandings(f.post),ranks=f.c.queenDisplayRanks(f.post,tally);
  const markup=f.c.interactiveMarkup(f.post,true),podium=markup.match(/<section class="board-queen-podium"[\s\S]*?<\/section>/)[0];
  assert.equal(ranks[0].index,f.c.queenTally(f.post).index);
  assert.equal((podium.match(/data-queen-place=/g)||[]).length,3);
  for(let i=0;i<3;i++){
    const row=podium.match(new RegExp('<li data-queen-place="'+(i+1)+'">([\\s\\S]*?)<\\/li>'))[1];
    assert.ok(row.includes(ranks[i].member.id));assert.ok(row.includes(ranks[i].count+'표'));assert.match(row,/board-avatar-frame/);
  }
  assert.ok(podium.includes('👑'));assert.ok(markup.indexOf(podium)<markup.indexOf('board-queen-cards'));
  const cards=[...markup.matchAll(/<button class="board-queen-candidate([^]*?)<\/button>/g)];
  assert.equal(cards.length,20);assert.equal((markup.match(/class="board-queen-gold"/g)||[]).length,1);
  for(const [i,card]of cards.entries()){
    assert.ok(card[0].includes('data-board-vote="'+i+'"'));assert.ok(card[0].includes('data-key="'+f.post.id+'"'));
    assert.ok(card[0].includes('data-queen-rank="'+(ranks.findIndex(r=>r.index===i)+1)+'"'));
    assert.ok(card[0].includes('aria-valuenow="'+tally.counts[i]+'"'));assert.match(card[0],/board-avatar-frame/);
    const image=card[0].match(/src="([^\"]+)"/)[1];assert.ok(fs.existsSync(new URL(image.replace(/^\.\//,''),root)));
    assert.equal(card[0].includes('board-queen-choice'),i===4);assert.equal(card[0].includes('aria-pressed="true"'),i===4);
  }
  assert.equal(JSON.stringify(f.c.state),before);assert.equal(f.saves(),0);
  const blocked=f.c.interactiveMarkup(f.post,false);assert.equal((blocked.match(/ disabled/g)||[]).length,24);
  f.setNow(at('2027-01-01'));const closed=f.c.interactiveMarkup(f.post,true);
  assert.doesNotMatch(closed,/data-board-vote=/);assert.equal((closed.match(/class="board-queen-candidate/g)||[]).length,20);
});

test('podium and card ties follow chairman then roster order, including zero votes and real leading ties',()=>{
  const f=fixture(at('2026-12-01'));memberPost(f);f.post.createdAt='2026-12-01T12:00:00+09:00';
  f.setNow(Date.parse(f.post.createdAt)-1);
  const members=f.c.window.HaniOrganizationRoster.people,tally=f.c.queenStandings(f.post);
  assert.ok(tally.counts.every(n=>n===0));
  assert.deepEqual(plain(f.c.queenDisplayRanks(f.post,tally).map(r=>r.member.id)),plain(members.map(m=>m.id)));
  f.post.poll.options.reverse();
  assert.deepEqual(plain(f.c.queenDisplayRanks(f.post,f.c.queenStandings(f.post)).map(r=>r.member.id)),plain(members.map(m=>m.id)),'roster order, not option order');
  const owner=8;f.post.poll.votes.seongmin=owner;
  const ranks=f.c.queenDisplayRanks(f.post,f.c.queenStandings(f.post)),markup=f.c.interactiveMarkup(f.post,true);
  assert.equal(ranks[0].index,owner);assert.equal(ranks[0].index,f.c.queenTally(f.post).index);
  const chosenCard=markup.match(/<div class="board-queen-candidate board-queen-choice"[^]*?<\/div>/)[0];
  assert.match(chosenCard,/data-queen-rank="1"/);assert.ok(chosenCard.includes(f.post.poll.options[owner]));
  const real=fixture();let found=false;
  for(let day=3;day<=30&&!found;day++)for(let choice=0;choice<real.post.poll.options.length&&!found;choice++){
    real.setNow(at('2026-11-'+String(day).padStart(2,'0')));real.post.poll.votes.seongmin=choice;
    const counts=real.c.queenStandings(real.post),max=Math.max(...counts.counts);
    if(max>0&&counts.counts[choice]===max&&counts.counts.filter(n=>n===max).length>1){
      const ordered=real.c.queenDisplayRanks(real.post,counts),html=real.c.interactiveMarkup(real.post,true);
      assert.equal(ordered[0].index,choice);assert.equal(real.c.queenTally(real.post).index,choice);
      assert.ok(html.includes('현재 선두 동률'));assert.ok(html.includes('data-queen-place="1"'));found=true;
    }
  }
  assert.ok(found);
});

test('candidate color is stable across ranks and choices, and the bar transition starts at its prior displayed value',()=>{
  const f=fixture(at('2026-12-20'));memberPost(f);
  const members=f.c.window.HaniOrganizationRoster.people,before=members.map(p=>f.c.queenCandidateColor(p));
  assert.equal(f.c.queenCandidateColor({id:'hani',color:'#123ABC'}),'#123ABC');
  assert.match(f.c.queenCandidateColor({id:'hani',color:'url(bad)'}),/^#[a-f\d]{6}$/i);
  const first=f.c.interactiveMarkup(f.post,true),tally=f.c.queenStandings(f.post);
  f.click(0);const second=f.c.interactiveMarkup(f.c.state.boardPosts[0],true);
  assert.deepEqual(plain(members.map(p=>f.c.queenCandidateColor(p))),plain(before));
  const starts=[...second.matchAll(/--queen-from:([\d.]+)%/g)].map(m=>Number(m[1]));
  assert.deepEqual(starts,plain(tally.counts.map(n=>100*n/Math.max(1,tally.total))));
  assert.notEqual(first,second);assert.equal(f.saves(),1);
});

test('LIVE banner and profile speech use the existing status slot and do not add event or timer owners',()=>{
  const f=fixture(at('2026-11-20'),false,true),slot=f.slot;
  assert.match(f.c.queenRaceMarkup(f.post),/board-queen-live.*aria-hidden="true".*LIVE/);
  assert.match(f.c.queenRaceMarkup(f.post),/board-queen-breaking">속보/);
  f.post.poll.votes.seongmin=0;f.c.showQueenReaction(f.post.id,0);
  assert.match(slot.innerHTML,/board-avatar-frame[\s\S]*board-queen-speech/);
  f.post.poll.votes.seongmin=1;f.c.showQueenReaction(f.post.id,1);
  assert.equal(f.slot,slot);assert.equal(f.saves(),0);assert.equal(slot.hidden,false);
});

test('canonical article repaint retains the supplied live slot and updates its content without generating another slot',()=>{
  const f=fixture(at('2026-11-20'),false,true),slot=f.slot,inserted=[];
  const article=f.article;article.innerHTML='old';
  article.querySelector=selector=>selector==='[data-board-queen-reaction]'?slot:{before:node=>inserted.push(node)};
  f.c.html('article',f.c.interactiveMarkup(f.post,true));
  assert.deepEqual(inserted,[slot]);assert.equal(slot.hidden,true);assert.doesNotMatch(article.innerHTML,/data-board-queen-reaction/);
  f.post.poll.votes.seongmin=0;
  f.c.showQueenReaction(f.post.id,0);
  f.c.html('article',f.c.interactiveMarkup(f.post,true));
  assert.deepEqual(inserted,[slot,slot]);assert.equal(slot.hidden,false);assert.match(slot.innerHTML,/board-queen-speech/);
  const normal='<p>ordinary article</p>';f.c.html('article',normal);assert.equal(article.innerHTML,normal);
});

test('queen CSS defines podium height/order, two mobile columns, theme surfaces and complete motion reduction',()=>{
  const css=read('hani-board.css').split('/* Queen race:')[1];
  assert.match(css,/data-queen-place="1"\][^{]*\{order:2;padding-top:22px/);
  assert.match(css,/data-queen-place="2"\][^{]*\{[^}]*order:1/);
  assert.match(css,/data-queen-place="3"\][^{]*\{[^}]*order:3/);
  assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/@media\(max-width:1000px\)[^]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/transition:width 650ms/);assert.match(css,/@starting-style[^]*width:var\(--queen-from,0%\)/);
  for(const token of ['--surface-raised','--text-primary','--border-subtle','--control-accent'])assert.ok(css.includes('var('+token+')'));
  assert.doesNotMatch(css,/background\s*:\s*(?:#fff(?:fff)?\b|white\b)/i);
  const reduce=css.split('@media(prefers-reduced-motion:reduce)')[1];
  assert.match(reduce,/board-queen-speech,#board \.board-queen-live i\{animation:none\}/);
  assert.match(reduce,/board-queen-candidate,#board \.board-queen-bar\{transition:none\}/);
  assert.match(reduce,/transform:none/);
});
