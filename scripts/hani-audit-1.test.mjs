import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import inverse from './hani-audit-1-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import support from './qa-1st-test-support.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const require=createRequire(import.meta.url),{delta,hash,restore,project,readRawFileSync:read}=inverse;
const root=new URL('../',import.meta.url),raw=f=>read(new URL(f,root),'utf8'),main=raw('hani-main.js');
const ast=support.parser().parse(main,{ecmaVersion:'latest'});
const fn=name=>{const node=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert.ok(node,name);return main.slice(node.start,node.end)};
const denied=()=>assert.fail('unexpected write or network');
const plain=x=>JSON.parse(JSON.stringify(x));
const SHARE='아주 작은 습관의 힘 – 최고의 변화는 어떻게 만들어지는가 제임스 클리어 지음 / 이한이 옮김 평점 4.5 · 비즈니스북스 · 자기계발 · 2019.02.26';
function bookContext(withNatural=true){
 const c=vm.createContext({window:{},document:{getElementById:()=>null},console,Date,Intl,structuredClone,uid:()=> 'synthetic',today:()=> '2026-11-19',localStorage:{setItem:denied,removeItem:denied,clear:denied},sessionStorage:{setItem:denied,removeItem:denied},commit:denied,fetch:denied});
 support.loadInputHelpers(c);vm.runInContext(raw('hani-book-share-parse.js'),c);c.window.HaniBookShare=c.HaniBookShare;
 if(withNatural){vm.runInContext(main.slice(main.indexOf('function intakeText('),main.indexOf('function intakeMovieContentType(')),c);vm.runInContext(fn('intakeBuildOne')+'\n'+fn('intakeOverlayUserInstruction'),c);}
 vm.runInContext(raw('hani-yuna-helpdesk.js'),c);return c;
}

test('audit-1 inverse restores independent fixed main299 including both existing queen edits',()=>{
 assert.equal(delta.schema,1);assert.equal(delta.layer,'audit-1');assert.equal(delta.base,repository.commit('2220b61').sha);
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),before=repository.read(delta.base,file);assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(source,file),before);assert.deepEqual(restore(Buffer.from(source),file),Buffer.from(before));
  assert.equal(project(source,file),before);assert.equal(project(before,file),before);
  let forward=before;for(const e of row.edits){const start=e.start;assert.equal(forward.slice(start,start+e.before.length),e.before);forward=forward.slice(0,start)+e.after+forward.slice(start+e.before.length);}
  assert.equal(forward,source,'exact forward round trip '+file);
 }
});

test('audit-1 rejects drift, repeated inverse, unknown owner and corrupted output pins',()=>{
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),before=restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.throws(()=>restore(bad,file),/exact audit-1 input/);assert.equal(project(bad,file),bad);}
  const pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact main299 output/);}finally{row.beforeSha256=pin;}
 }
 assert.equal(project('unknown','other'),'unknown');assert.throws(()=>restore('unknown','other'),/known audit-1 owner/);
});

test('candidate runtime closure loads the supplied parser before both consumers; baseline closure remains 173',async()=>{
 const html=raw('index.html');assert.ok(html.indexOf('./hani-book-share-parse.js')<html.indexOf('./hani-main.js'));assert.ok(html.indexOf('./hani-book-share-parse.js')<html.indexOf('./hani-yuna-helpdesk.js'));
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>read(new URL(f,root))});assert.deepEqual(closure.missing,[]);assert.equal(closure.files.length,174);assert.ok(closure.files.includes('hani-book-share-parse.js'));
 const before=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(read(new URL(f,root)),f)});assert.deepEqual(before.missing,[]);assert.equal(before.files.length,173);
});

test('both queen captions render previous month and preserve the supplied queen-only bytes',()=>{
 const board=raw('hani-board.js'),start=board.indexOf('  function queenSlides('),end=board.indexOf('  // Read-only lounge promotion.',start);
 const c=vm.createContext({dayKey:()=> '2026-11-19',queenWinner:()=>({month:'2026-10',name:'하니',rank:'팀장',id:'hani'}),posts:()=>[],published:()=>true,queenImages:{'2026-10':'queen.webp'},bannerPortrait:()=> 'fallback.webp'});
 vm.runInContext(board.slice(start,end),c);assert.equal(c.queenSlides()[0].kicker,'👑 지난달(10월)의 퀸');
 const office=raw('hani-office-live.js'),a=office.indexOf('  function updateQueenFrame('),b=office.indexOf('  queenFrame.onclick=',a);
 const frame={hidden:true,dataset:{},setAttribute(){}},image={},caption={};
 Object.assign(c,{activeFloor:'1f',map:{dataset:{art:'floor'}},window:{HaniBoard:{queenWinner:c.queenWinner,queenImages:{'2026-10':'queen.webp'}}},queenFrame:frame,queenImage:image,queenCaption:caption});
 vm.runInContext(office.slice(a,b),c);c.updateQueenFrame();assert.equal(caption.textContent,'👑 지난달(10월)의 퀸');assert.equal(frame.title,'👑 지난달(10월)의 퀸 · 하니');assert.equal(frame.hidden,false);
 for(const f of ['hani-board.js','hani-office-live.js'])assert.equal(raw(f),repository.read('d1b2827',f),'existing queen-only commit '+f);
});

test('mobile native checkbox/radio declarations win minimum, maximum and flex sizes for all three owners',()=>{
 const css=raw('hani-design-system.css'),block=css.slice(css.indexOf('/* audit-1: native mobile choices'));
 assert.match(block,/@media screen and \(max-width:900px\)/);
 for(const owner of ['study','drive'])assert.ok(block.includes(`#app.app #${owner} :is(input[type="checkbox"],input[type="radio"])`));
 assert.ok(block.includes('#app.app #aura #launchGreetingEnabled'));
 for(const property of ['width','height','min-width','min-height','max-width','max-height'])assert.ok(block.includes(property+':22px!important'));
 assert.ok(block.includes('flex:0 0 22px!important'));assert.ok(block.includes('appearance:auto!important'));assert.ok(block.includes('transform:none!important'));
 // Specificities: generic 40px selector (1,3,1); new generic (1,3,1)
 // then per-owner (2,2,1), studio (3,1,0) > old studio (3,0,0).
 assert.ok(css.indexOf('#app.app :is(input[type="checkbox"]')>css.indexOf('#app.app :is(button,a[href],summary'));
});

test('visible instructions are plain Korean and home refs render at most seven characters',()=>{
 const html=raw('index.html');assert.ok(html.includes('고른 계좌만 바뀝니다.'));assert.ok(html.includes('승인하기 전에는 기록이 바뀌지 않아요.'));assert.ok(html.includes('처음 검토할 안건도 기존 업무 기록에서 불러와요.'));
 assert.ok(raw('hani-study-v02984.js').includes('프로젝트 설정에서 만들면 오늘의 퀴즈가 시작됩니다.'));
 assert.ok(main.includes('구글 연결 정보는 안전한 서버에만 보관해요.'));assert.ok(raw('hani-asset-update-v1.js').includes('고른 계좌만 삭제해요.'));
 const text=raw('hani-development-history-v1.js'),line=text.split(/\r?\n/).find(l=>l.includes('const row=entry=>'));
 const c=vm.createContext({esc:String,statusLabel:{released:'운영 반영'}});vm.runInContext(line+'\nglobalThis.renderRow=row;',c);
 const rendered=c.renderRow({id:'v2.9.299',date:'2026-11-19',status:'released',title:'검사',summary:'변화',ref:'1234567890abcdef'});assert.match(rendered,/<code>1234567<\/code>/);assert.ok(!rendered.includes('1234567890abcdef'));
});

test('ledger empty preview says 기록 없음; a genuine recorded zero keeps existing comparisons',()=>{
 const line=main.split(/\r?\n/).find(l=>l.includes('const jispiCard='));assert.ok(line);
 const c=vm.createContext({esc:String,won:v=>v+'원',items:[]});vm.runInContext(fn('ledgerJispiStatus')+'\n'+line+'\nglobalThis.renderCard=jispiCard;',c);
 const empty=c.renderCard('지출',0,100,'test');assert.match(empty,/기록 없음/);assert.doesNotMatch(empty,/초강세|신고가|-100\.0%/);
 c.items.push({amount:0});const recorded=c.renderCard('지출',0,100,'test');assert.match(recorded,/초강세/);assert.match(recorded,/-100\.0%/);
 assert.match(c.renderCard('지출',150,100,'test'),/지출 서킷브레이커/);
 const ui=raw('hani-ui-v02992.js'),start=ui.indexOf('  function mainCharacterStatus('),end=ui.indexOf('  function mountSkeletons(',start);let rec={month:'2026-11',items:[]};
 const hero=vm.createContext({ledgerHeroRecord:()=>rec,ledgerCalc:()=>({jispiT:0,targetT:100}),ledgerJispiStatus:c.ledgerJispiStatus});vm.runInContext(ui.slice(start,end),hero);
 assert.deepEqual(plain(hero.mainCharacterStatus('ledger')),{text:'기록 없음',direction:'neutral'});rec=null;assert.equal(hero.mainCharacterStatus('ledger').text,'기록 없음');
 rec={month:'2026-11',items:[{amount:0}]};assert.match(hero.mainCharacterStatus('ledger').text,/-100\.0%/);
});

test('sports marks stale seasons at 30 days, retains recent results, allows known upcoming fixtures and never writes',()=>{
 const now=Date.parse('2026-11-19T12:00:00Z');class Clock extends Date {static now(){return now}}
 const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{textContent:'',classList:{add(){},remove(){}},querySelector:t=>node(s+' '+t),querySelectorAll:()=>[],setAttribute(){}});return nodes.get(s)};
 const c=vm.createContext({Date:Clock,SPORTS_CACHE_UI:{test:{selector:'test',teamCode:'T',teamName:'팀',teamFirst:true}},document:{querySelector:s=>node(s)},sportsCacheDate:v=>v,sportsOpponentCode:()=> 'O',sportsCompetitionLabel:()=> '정규시즌',localStorage:{setItem:denied},fetch:denied});
 vm.runInContext(fn('sportsCacheRowValid')+'\n'+fn('sportsSetResult')+'\n'+fn('sportsApplyCacheRow'),c);
 const html=raw('index.html');assert.equal([...html.matchAll(/<small>시즌 종료 · 최근 경기 · 2026\.09\./g)].length,4);assert.equal([...html.matchAll(/<span>시즌 종료 · LAST GAME · 2026\.09\./g)].length,4);
 for(const [date,next,ended]of [['2026-10-20',null,true],['2026-10-21',null,false],['2026-11-19',null,false],['2026-10-01',{dateTime:'2026-11-20T12:00:00Z',opponent:{name:'다음 팀'}},false]]){
  const row={team_id:'test',last_game:{date,opponent:{name:'상대'},score:{team:2,opponent:1},result:'WIN'},next_game:next},before=JSON.stringify(row);assert.equal(c.sportsApplyCacheRow(row),true);assert.equal(JSON.stringify(row),before);
  const recent=node('#game .sports-home-panel.test .sports-home-recent small').textContent,detail=node('#game .sports-team-card.test .sports-result :scope > div:first-child span').textContent;
  assert.equal(recent.includes('시즌 종료'),ended);assert.equal(detail.includes('시즌 종료'),ended);assert.ok(recent.includes(date));
 }
 assert.equal(c.sportsApplyCacheRow({team_id:'unknown'}),false);
});

for(const [label,text,status]of [['실제 앞뒤 반복 입력',`이거 책 더 읽었어 ${SHARE} 이거 책 더 읽었어`,'wish'],['서점 글만',SHARE,'wish'],['말이 뒤에만',`${SHARE} 이거 책 더 읽었어`,'wish']])test('book preview integration: '+label,()=>{
 const c=bookContext(),natural=c.intakeNaturalBook(text),draft=c.window.HANI_YUNA_HELPDESK.parse(text),built=c.intakeBuildOne('book',{},text),overlay=c.intakeOverlayUserInstruction('book',{title:'잘못된 제목',status:'read',rating:4.5,completedDate:'2019-02-26'},text);
 for(const r of [natural,draft.data,built,overlay]){assert.equal(r.title,'아주 작은 습관의 힘');assert.equal(r.author,'제임스 클리어');assert.equal(r.status,status);assert.equal(r.rating,null);assert.equal(r.completedDate,'');assert.ok(!JSON.stringify(r).includes('2019-02-26'));assert.ok(!JSON.stringify(r).includes('비즈니스북스'));}
 assert.equal(draft.target,'book');assert.ok(!draft.entities.ratingInput);assert.equal(c.intakeInferTarget(text),'book');assert.match(draft.data.review,/읽는 중/);
 if(label!=='서점 글만')assert.match(overlay.review,/^읽기 시작일: 20\d{2}-\d{2}-\d{2}/);
 if(label==='서점 글만')assert.ok(draft.missing.includes('readingDate'));else assert.ok(!draft.missing.includes('readingDate'));
 // Standalone helpdesk still follows userStatus without hani-main.
 const isolated=bookContext(false).window.HANI_YUNA_HELPDESK.parse(text);assert.equal(isolated.data.status,status);assert.equal(isolated.data.rating,null);
});

test('explicit completion and ordinary-book fallback still work; parser input never becomes a saved store rating',()=>{
 const c=bookContext(),readDraft=c.window.HANI_YUNA_HELPDESK.parse(`${SHARE} 다 읽었어!`);assert.equal(readDraft.data.status,'read');assert.equal(readDraft.data.rating,null);assert.ok(readDraft.data.completedDate.startsWith('20'));assert.notEqual(readDraft.data.completedDate,'2019-02-26');
 const ordinary=c.window.HANI_YUNA_HELPDESK.parse('정의란 무엇인가 읽기 시작했어');assert.equal(ordinary.data.title,'정의란 무엇인가');assert.equal(ordinary.data.status,'wish');
 const incomplete=c.window.HANI_YUNA_HELPDESK.parse('책 읽기 시작했어','book');assert.ok(incomplete.missing.includes('title'));
});

test('history loader skips only invalid rows and shares its one promise; wrong schema still fails',async()=>{
 const source=raw('hani-organization-hub.js'),start=source.indexOf('  function loadHistoryReleases('),end=source.indexOf('  // The literal catalog fetch',start),catalog=JSON.parse(raw('assets/data/hani-history-releases-v1.json'));
 assert.equal(catalog.entries.find(r=>r.id==='v2.9.292').title,'직원 말풍선 가끔 안 뜨던 문제 수정');
 for(const [value,expected]of [[catalog,catalog.entries.length],[{...catalog,entries:[...catalog.entries,{...catalog.entries[0],title:'가'.repeat(25)},null,{...catalog.entries[0],date:'2026-02-30'}]},catalog.entries.length],[{...catalog,schema:2},null],[{schema:1,entries:{}},null]]){
  let fetched=0,painted=0;const c=vm.createContext({fetch:async()=>{fetched++;return {ok:true,json:async()=>value}},renderOverview:()=>painted++});
  vm.runInContext('let historyReleases=null,historyReleasesRequested=false,historyReleasesFailed=false,historyReleasesPromise=null;\n'+source.slice(start,end)+'\nglobalThis.failed=()=>historyReleasesFailed;',c);
  const promise=c.loadHistoryReleases();assert.equal(c.loadHistoryReleases(),promise);const rows=await promise;assert.equal(rows===null?null:rows.length,expected);assert.equal(c.failed(),expected===null);assert.equal(fetched,1);assert.equal(painted,1);
 }
});

test('new preload preserves string/Buffer sync callback promise errors and raw disk bytes',async()=>{
 const url=new URL('hani-main.js',root),source=read(url),expected=project(source,'hani-main.js'),error=new Error('read failure');
 const disk=(_f,encoding)=>encoding==='utf8'?source.toString('utf8'):source;
 const fake={readFileSync:disk,readFile(f,...args){const done=args.pop();f==='error'?done(error):done(null,disk(f,args[0]))},promises:{readFile:async(...args)=>disk(...args)}};let synced=false;
 vm.runInNewContext(raw('scripts/hani-audit-1-preload.cjs'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-audit-1-source.cjs'?inverse:assert.fail(name)});assert.ok(synced);
 for(const f of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(f,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(f,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(f,encoding),want);}
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));assert.deepEqual(read(url),source);
});
