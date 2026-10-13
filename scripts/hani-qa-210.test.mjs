import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {handlers,inspection,api,plain,roster} from './hani-board.test.mjs';
import {textContrastAudit} from './hani-contrast-audit.mjs';

const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const base=path.resolve(process.argv[2]||path.join(root,'.ai-budget-private/qa210/base'));
const main=read('hani-main.js'),remote=read('hani-context-remote-v1.js'),study=read('hani-study-v02984.js');
const lum=hex=>hex.slice(1).match(/../g).map(v=>{const c=parseInt(v,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const results={base:'24af321a7e70436f92e70ce8da068b07b25e824c',palette:[],notes:{}};
function block(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);const match=/\n {0,2}\}/g;match.lastIndex=start;const end=match.exec(source);assert.ok(end,name+' boundary');return source.slice(start,end.index+end[0].length)}

test('reusable audit flags low contrast and opacity, retains image uncertainty and excludes hidden text',()=>{
  const style={visibility:'visible',color:'rgb(0, 0, 0)',backgroundColor:'rgb(255, 255, 255)',backgroundImage:'none',opacity:'1'};
  const body={style,parentElement:null},nodes=[];
  for(const [id,patch,visible] of [['black',{},true],['pale',{color:'rgb(200, 200, 200)'},true],['faded',{opacity:'.5'},true],['image',{backgroundImage:'linear-gradient(white, black)'},true],['hidden',{color:'rgb(200, 200, 200)'},false]]){
    const el={id,style:{...style,...patch},parentElement:body,closest:()=>null,checkVisibility:()=>visible};nodes.push({textContent:id,parentElement:el});
  }
  const document={body,createTreeWalker:()=>{let i=0;return {nextNode:()=>nodes[i++]||null}},createRange:()=>({selectNodeContents(){},getClientRects:()=>[{}]}),querySelectorAll:()=>[]};
  const ctx=vm.createContext({document,NodeFilter:{SHOW_TEXT:4},getComputedStyle:n=>n.style,CSS:{escape:x=>x}});
  vm.runInContext('globalThis.result=('+textContrastAudit.toString()+')();',ctx);const result=plain(ctx.result);
  assert.deepEqual(result.failures.map(x=>x.selector),['#pale','#faded']);assert.ok(result.failures.every(x=>x.ratio<4.5));assert.equal(result.textNodes,4);assert.equal(result.uncertain.length,1);assert.equal(result.uncertain[0].selector,'#image');
});

test('all five Finish text/surface tokens and NEW accent foregrounds meet 4.5 in four seasons',()=>{
  const css=read('hani-design-system.css');
  assert.equal(contrast('#000000','#ffffff'),21);
  for(const finish of ['porcelain-cream','midnight-black','titanium-graphite','sakura-pink','alpine-blue']){
    const rule=[...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].find(m=>m[1].includes('.login-design-choice[data-design="'+finish+'"]')&&m[2].includes('--surface-canvas:'));
    assert.ok(rule,finish);const tokens=Object.fromEntries([...rule[2].matchAll(/(--[\w-]+):(#[\da-f]{3,6})/g)].map(m=>[m[1],m[2]==='#fff'?'#ffffff':m[2]]));
    for(const season of ['spring','summer','autumn','winter']){
      for(const ink of ['--text-primary','--text-secondary','--text-muted'])for(const surface of ['--surface-canvas','--surface-page','--surface-panel','--surface-raised']){
        const ratio=contrast(tokens[ink],tokens[surface]);assert.ok(ratio>=4.5,finish+'/'+ink+'/'+surface+': '+ratio);results.palette.push({finish,season,ink,surface,ratio});
      }
      const ratio=contrast(tokens['--structure-accent'],tokens['--structure-on-accent']);assert.ok(ratio>=4.5,finish+' NEW');results.palette.push({finish,season,ink:'--structure-on-accent',surface:'--structure-accent',ratio});
    }
  }
  const rules=[read('hani-style-01.css'),read('hani-portfolio-preview.css'),read('hani-board.css')].join('\n');
  for(const key of ['.agent-policy-registry-card','.agent-policy-kpi','.agent-policy-column','.agent-policy-row','#reading .library-shelf .archive-card,#movie .cinema-archive .archive-card','.portfolio-summary>div']){
    const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),rule=new RegExp(escaped+'\\{([^}]+)\\}').exec(rules);
    assert.ok(rule,key);assert.match(rule[1],/background:(?:var\(--surface-|var\(--panel)/,key);
  }
});

test('display views are deterministic, bounded by a 12–180 base, age-aware and read-only',()=>{
  const before=plain(api.getState()),queues=inspection().queues,now=Date.parse('2026-10-12T00:00:00Z'),seen=new Set();
  for(let i=0;i<250;i++){
    const post=Object.freeze({id:'post-'+i,views:9,createdAt:'2026-10-01T00:00:00Z'}),count=handlers.displayViews(post,now);
    assert.equal(count,handlers.displayViews(post,now));assert.ok(count>=21&&count<=189);seen.add(count);
    assert.ok(handlers.displayViews(post,now+20*86400000)>=count);
    assert.equal(handlers.displayViews({...post,views:10},now),count+1);
  }
  assert.ok(seen.size>75,'ids yield varied counters');
  for(const createdAt of ['bad-date','2099-01-01T00:00:00Z'])assert.ok(handlers.displayViews({id:'edge',createdAt,views:-1},now)>=12);
  assert.equal(handlers.displayViews({id:'max',views:Number.MAX_SAFE_INTEGER},now),Number.MAX_SAFE_INTEGER);
  assert.deepEqual(plain(api.getState()),before);assert.equal(inspection().queues,queues);
});

test('Remote today slot tracks today tasks and unfinished quizzes without recreating unchanged rows or saving',()=>{
  class Element{constructor(){this.dataset={};this.children=[];this.hidden=false;this.classes=new Set();this.classList={toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)}}append(n){this.children.push(n)}replaceChildren(){this.children=[]}}
  const section=new Element(),badge=new Element(),box=new Element(),summary=new Element(),nodes={'.hani-remote-today':section,'[data-remote-today-count]':badge,'[data-remote-quizzes]':box,'[data-remote-today-summary]':summary};
  let creates=0;const state={tasks:[{id:'t',due:'2026-10-12',done:false},{due:'2026-10-12',done:true},{due:'2026-10-13',done:false}]};
  let quizzes=[{id:'today',date:'2026-10-12',title:'오늘',status:'pending'},{id:'old',date:'2026-10-11',title:'지난 퀴즈',status:'in_progress'},{id:'future',date:'2026-10-13',title:'예정',status:'pending'},{id:'undated',date:'',title:'날짜 미지정',status:'pending'}];
  const ctx=vm.createContext({window:{HANI_STUDY_V02984_TEST:{pendingLearningQuizzes:()=>quizzes,quizDate:q=>q.date}},state,rail:{},$:s=>nodes[s],careKoreaPeriod:()=>({day:'2026-10-12'}),document:{createElement:()=>{creates++;return new Element()}}});
  vm.runInContext(remote.slice(remote.indexOf('  const updateToday='),remote.indexOf('  const update=()'))+'\nglobalThis.updateToday=updateToday;',ctx);
  const before=JSON.stringify(state);ctx.updateToday();assert.equal(badge.textContent,'3');assert.equal(badge.hidden,false);assert.ok(section.classes.has('is-today'));assert.deepEqual(box.children.map(n=>n.dataset.remoteQuiz),['undated','old','today','future']);
  ctx.updateToday();assert.equal(creates,4,'persistent slot, no duplicate rows');
  quizzes=quizzes.filter(q=>q.id!=='today');ctx.updateToday();assert.equal(badge.textContent,'2');assert.equal(box.children.length,3);
  quizzes=[];state.tasks[0].done=true;ctx.updateToday();assert.equal(badge.hidden,true);assert.equal(box.hidden,true);assert.equal(section.classes.has('is-today'),false);
  state.tasks[0].done=false;assert.equal(JSON.stringify(state),before,'projection does not mutate source');
});

test('Remote opens the exact unfinished quiz through existing selection path without generation or persistence',()=>{
  const rows=[{id:'old',projectId:'p',date:'2026-10-11'},{id:'today',projectId:'p',date:'2026-10-12'}],views=[],renders=[];
  const ctx=vm.createContext({pendingLearningQuizzes:()=>rows,quizDate:q=>q.date,localToday:()=> '2026-10-12',showView:id=>views.push(id),renderLearning:auto=>renders.push(auto),requestAnimationFrame:fn=>fn(),q:()=>null});
  vm.runInContext("let activeProjectId='',activeQuizId='',activeStudyTab='',quizArchiveMonth='',quizArchivePage=0;\n"+block(study,'openPendingQuiz')+'\nglobalThis.selected=()=>[activeProjectId,activeQuizId];',ctx);
  ctx.openPendingQuiz('today');assert.deepEqual(Array.from(ctx.selected()),['p','today']);assert.deepEqual(renders,[false]);assert.deepEqual(views,['study']);
  ctx.openPendingQuiz('missing');assert.equal(renders.length,1,'stale id does not render/generate another quiz');
  assert.doesNotMatch(block(main,'renderHaniCareCards'),/data-care-quiz/);
  assert.match(remote,/openPendingQuiz\(quiz.dataset.remoteQuiz\)/);
});

test('press effect targets actual controls; existing Drive contract cannot attach arbitrary files',()=>{
  const css=read('hani-style-08.css'),press=css.match(/@media\(prefers-reduced-motion:no-preference\)\{#app ([^{}]+)\{scale:\.98\}\}/);assert.ok(press);
  assert.doesNotMatch(press[1],/\.card\)|\.archive-card\)/);assert.match(press[1],/button:not\(:disabled\)/);assert.match(press[1],/a\[href\]/);
  const docless=vm.createContext({window:{}});vm.runInContext(read('hani-drive-vault.js'),docless);
  assert.deepEqual(Object.keys(docless.window.HANI_DRIVE_VAULT_CORE).sort(),['due','filename','weeklyDecision','writeBackup']);
  assert.match(read('hani-drive-vault.js'),/HANI_DRIVE_VAULT=Object.freeze\(\{schedule\}\)/);
  assert.doesNotMatch(read('hani-board.js'),/type=["']file|uploadAttachment|attachFile/);
  results.notes.drive='BLOCKED BY CONTRACT: owner-bound PC backup directory only; no board attachment model/picker/upload API. No write changes.';
});

test('reading title preservation and corrected chairman display projections, without writes',()=>{
  const ctx=vm.createContext({intakeNaturalAuthor:()=>'',intakeReadingToday:()=> '2026-10-12',intakeNaturalDate:()=>'',intakeNaturalRating:()=>null,intakeNaturalReview:()=>''});
  vm.runInContext(block(main,'intakeNaturalBook'),ctx);
  const parsed=ctx.intakeNaturalBook('김대식의 인간 vs 기계 읽었어');assert.equal(parsed.title,'인간 vs 기계');assert.equal(parsed.author,'김대식');
  results.notes.reading='Local parser preserves 인간 vs 기계; followup adds explicit title priority in Intake/Yuna Vision Preview. Existing saved records remain untouched.';
  assert.equal(handlers.stripLeadingVocative('@회장님 회장님, 확인했어요.',roster.chairman.id,true,true),'확인했어요.');
  results.notes.vocative='Followup display cleanup strips chairman vocative only when its mention chip is shown; stored text untouched.';
  assert.equal(handlers.chairmanReplyIntent('오늘 커피 마셨어'),'other');
  results.notes.reply='Followup uses fear plus existing five intents and book/AI/stock/exercise topic pools. Finite interim replies remain; existing bodies untouched.';
});

test('retained EOL, all versions/cache tags, id literals, storage and canonical save handlers are preserved',()=>{
  const files=['hani-main.js','hani-study-v02984.js','hani-board.js','hani-context-remote-v1.js','hani-style-01.css','hani-style-07.css','hani-style-08.css','hani-design-system.css','hani-portfolio-preview.css','hani-board.css','hani-context-remote.css','hani-newsroom-ux-v02970.js'];
  for(const file of files){
    const old=fs.readFileSync(path.join(base,file),'utf8'),current=read(file),lines=s=>s.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g).filter(Boolean),by=new Map();
    for(const line of lines(old)){const text=line.replace(/[\r\n]+$/,'');if(!by.has(text))by.set(text,new Set());by.get(text).add(line.slice(text.length))}
    for(const line of lines(current)){const text=line.replace(/[\r\n]+$/,'');if(by.has(text))assert.ok(by.get(text).has(line.slice(text.length)),file+' retained EOL: '+text.slice(0,60))}
    for(const pattern of [/\b2\.9\.\d+(?:-[\w.-]+)?\b/g,/\?v=[^\s"'<>]+/g,/\b(?:commit|save|writeProtectedState|localStorage\.(?:setItem|removeItem|clear))\([^)]*\)/g])assert.deepEqual(current.match(pattern),old.match(pattern),file+' preserved version/save paths');
    const counts=s=>{const out={};for(const m of s.matchAll(/\bid\s*=\s*["']([\w-]+)["']/g))out[m[1]]=(out[m[1]]||0)+1;return out};
    assert.deepEqual(counts(current),counts(old),file+' no new id literals');
    assert.equal((current.match(/\.clear\(/g)||[]).length,(old.match(/\.clear\(/g)||[]).length,file+' no clear calls');
    if(file==='hani-board.js')for(const name of ['viewChange','savePost','saveComment','deleteOwn','toggleLike'])assert.equal(block(current,name),block(old,name),name+' persistence unchanged');
  }
  assert.equal(read('hani-drive-vault.js'),fs.readFileSync(path.join(base,'hani-drive-vault.js'),'utf8'));
  assert.equal(read('index.html'),fs.readFileSync(path.join(base,'index.html'),'utf8'));
});

test('write compact Node evidence after successful assertions',()=>{
  const out=path.join(root,'artifacts/qa-210');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'node-evidence.json'),JSON.stringify(results,null,2));
});
