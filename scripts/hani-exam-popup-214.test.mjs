// node scripts/hani-exam-popup-214.test.mjs
// Add --browser [playwright module directory] [browser executable] for actual layout QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(path.join(root,'hani-study-v02984.js'),'utf8');
const remote = fs.readFileSync(path.join(root,'hani-context-remote-v1.js'),'utf8');
const output = path.join(root,'artifacts/exam-popup-214');
fs.mkdirSync(output,{recursive:true});
const fixture = () => ({
  learningProjects:[{id:'project',name:'경제 기초',category:'economy',status:'active',scheduleType:'manual',quizSize:20}],
  learningQuizzes:[{id:'exam',projectId:'project',title:'경제 기초 #007',sequenceNo:7,date:'2026-10-16',status:'pending',total:20,
    questions:Array.from({length:20},(_,i)=>({id:'q'+i,type:'general',prompt:(i+1)+'번: 경제의 원리를 고르세요.\n긴 지문도 차분히 읽어보세요.',choices:['첫 번째 보기','두 번째 보기','세 번째 보기','긴 네 번째 보기 '.repeat(9)],answerIndex:0,explanation:'정답은 1번입니다.'})),answers:Array(20).fill(null)}],
  learningWrongAnswers:[],unrelated:{keep:true},tasks:[],
});
const shell = '<main id="app"><section id="study"><div id="studyEngineV02984"><div id="studyProjectList"></div><div class="study-engine-grid"><div id="studyMainPanel"></div></div><div id="studyWrongPanel"></div><div id="studyHistoryPanel"></div></div></section></main>';
// Instrument lexical functions in this disposable fixture only; execute their real bodies.
const instrumented = source
  .replace('  function persistQuizAnswer(quiz, questionIndex, value) {','  function persistQuizAnswer(quiz, questionIndex, value) { window.answerCalls.push([quiz.id,questionIndex,value]);')
  .replace('  function gradeQuiz(quiz) {','  function gradeQuiz(quiz) { window.gradeCalls++;')
  .replace(/\r?\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n  window.examFixtureRender=()=>{activeProjectId="project";activeQuizId="exam";renderLearning(false);};\n  style(); window.examFixtureRender();\n})();');

// Small DOM adapter for executing real owner renderers/handlers when browser spawn is unavailable.
// It models nodes/events/focus, never claims to measure CSS or native dialog behavior.
function dom() {
  let doc;
  const dataName = name => name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
  class Element {
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.dataset={};this.style={overflow:''};this.listeners={};this.hidden=false;this.disabled=false;this._text='';this.open=false;}
    get id(){return this.attrs.id} set id(v){this.attrs.id=v}
    get className(){return this.attrs.class||''} set className(v){this.attrs.class=v}
    get classList(){return {add:(x)=>{this.className+=' '+x},toggle:(x,on)=>{const s=new Set(this.className.split(/\s+/));if(on??!s.has(x))s.add(x);else s.delete(x);this.className=[...s].join(' ')}}}
    setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[dataName(k)]=String(v);if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true;}
    getAttribute(k){return this.attrs[k]??null} hasAttribute(k){return k in this.attrs}
    append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}} appendChild(n){this.append(n);return n}
    get isConnected(){return this===doc.body||Boolean(this.parentElement?.isConnected)}
    set innerHTML(html){for(const n of this.children)n.parentElement=null;this.children=[];this._html=html;const stack=[this];
      for(const match of html.matchAll(/<\/?[a-z][^>]*>|[^<]+/gi)){const t=match[0];if(t.startsWith('</')){if(stack.length>1)stack.pop();continue}if(!t.startsWith('<')){stack.at(-1)._text+=t;continue}
        const tag=t.match(/^<(\w+)/)[1],el=new Element(tag);for(const a of t.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g))el.setAttribute(a[1],a[2]??a[3]??'');stack.at(-1).append(el);if(!['input','br','img','hr','meta','link'].includes(tag))stack.push(el);
      }
    }
    get innerHTML(){return this._html||''} set textContent(t){this._text=String(t);this.children=[]} get textContent(){return this._text+this.children.map(x=>x.textContent).join('')}
    matches(selector){if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));let s=selector.trim();if(s.includes(':not(:disabled)')){if(this.disabled)return false;s=s.replace(':not(:disabled)','')}
      if(s.includes(' ')){const parts=s.split(/\s+/);return this.matches(parts.pop())&&Boolean(this.parentElement?.closest(parts.join(' ')))}
      for(const a of s.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){if(!this.hasAttribute(a[1])||(a[2]!==undefined&&this.getAttribute(a[1])!==a[2]))return false}s=s.replace(/\[[^\]]*\]/g,'');
      const id=s.match(/#([\w-]+)/);if(id&&this.id!==id[1])return false;for(const c of s.matchAll(/\.([\w-]+)/g))if(!this.className.split(/\s+/).includes(c[1]))return false;const tag=s.match(/^[a-z]+/i);return !tag||tag[0].toUpperCase()===this.tagName;
    }
    closest(s){return this.matches(s)?this:this.parentElement?.closest(s)||null}
    querySelectorAll(s){if(s.startsWith(':scope > '))return this.children.filter(x=>x.matches(s.slice(9)));return this.children.flatMap(x=>[...(x.matches(s)?[x]:[]),...x.querySelectorAll(s)])}
    querySelector(s){return this.querySelectorAll(s)[0]||null}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
    dispatch(type,event={}){event.target??=this;event.preventDefault??=()=>{event.prevented=true};event.stopPropagation??=()=>{event.stopped=true};for(const fn of this.listeners[type]||[])fn(event);this['on'+type]?.(event);if(!event.stopped)this.parentElement?.dispatch(type,event);return event}
    click(){if(!this.disabled){this.focus();this.dispatch('click')}}
    focus(){doc.activeElement=this} scrollIntoView(){} scrollTo(){}
    getClientRects(){return this.hidden||this.parentElement?.getClientRects().length===0?[]:[{}]}
    showModal(){this.open=true} close(){this.open=false}
  }
  doc={createElement:tag=>new Element(tag),querySelector:s=>doc.body.querySelector(s)||doc.head.querySelector(s),querySelectorAll:s=>doc.body.querySelectorAll(s),head:new Element('head'),body:new Element('body')};
  doc.body.innerHTML=shell;doc.activeElement=doc.body;return doc;
}

function setup(saved) {
  const document=dom(),data=saved||fixture(),timers=new Map();let serial=0;
  const window={answerCalls:[],gradeCalls:0};
  const counters={save:0,commit:0,fail:false,frames:[]};
  const context=vm.createContext({window,document,state:data,Date,console:{...console,error(){}},structuredClone,
    today:()=> '2026-10-16',save:()=>{counters.save++;return {ok:!counters.fail}},commit:()=>{counters.commit++;return !counters.fail},
    requestAnimationFrame:fn=>counters.frames.push(fn),setTimeout:fn=>{timers.set(++serial,fn);return serial},clearTimeout:id=>timers.delete(id),
    showView:()=>{},alert:message=>{counters.alert=message},localStorage:new Proxy({},{get(){throw Error('direct storage access forbidden')}}),
  });
  vm.runInContext(instrumented,context);
  return {document,window,counters,data,context,timers,
    get dialog(){return document.body.querySelector('dialog')},
    find(s){const node=document.querySelector(s);assert.ok(node,'missing '+s);return node},
    frame(){for(const fn of counters.frames.splice(0))fn()},
    key(key,extra={}){return this.dialog.dispatch('keydown',{key,...extra})},
    remoteOpen(){ // Execute the actual existing Remote quiz branch, including setMobile(false).
      const handler=remote.match(/rail\.addEventListener\("click",(e=>\{const quiz=.*?)\);\r?\n/)[1];
      context.remoteButton={dataset:{remoteQuiz:'exam'}};context.closedRemote=false;context.setMobile=value=>{context.closedRemote=!value};
      vm.runInContext('('+handler+')({target:{closest:()=>remoteButton}})',context);
      assert.equal(context.closedRemote,true);
    },
  };
}
const checks=[];
function check(name,run){run();checks.push(name);console.log('PASS '+name)}

check('응시하기 and actual Remote handler open one reusable dialog without writes',()=>{
  const f=setup();assert.match(f.find('[data-study-exam-open]').textContent,/응시하기/);f.find('[data-study-exam-open]').focus();f.find('[data-study-exam-open]').click();f.frame();
  assert.equal(f.dialog.open,true);assert.match(f.dialog.textContent,/HANI 모의고사 · 경제 기초 #7/);assert.match(f.dialog.textContent,/20261016-007/);
  assert.equal(f.document.querySelectorAll('[data-exam-choice]').length,4);assert.equal(f.document.querySelectorAll('[data-exam-jump]').length,20);
  const dialog=f.dialog;f.key('Escape');assert.equal(dialog.open,false);f.remoteOpen();f.frame();assert.equal(f.dialog,dialog);assert.equal(dialog.open,true);
  assert.equal(f.counters.save+f.counters.commit,0);assert.equal(f.window.answerCalls.length,0);
});
check('selection uses persistQuizAnswer exactly once; failed save rolls back and cannot submit',()=>{
  const f=setup();f.find('[data-study-exam-open]').click();const card=f.find('[data-exam-choice="2"]');card.click();
  assert.ok(f.find('[data-exam-choice="2"]')===card,'same question updates persistent choice nodes');
  assert.deepEqual(JSON.parse(JSON.stringify(f.window.answerCalls)),[['exam',0,2]]);assert.equal(f.counters.save,1);assert.equal(f.data.learningQuizzes[0].answers[0],2);
  assert.equal(f.data.learningQuizzes[0].status,'in_progress');assert.equal(f.find('[data-exam-choice="2"]').getAttribute('aria-pressed'),'true');
  const before=structuredClone(f.data);f.counters.fail=true;f.key('1');assert.deepEqual(f.data,before);assert.match(f.find('[data-exam-message]').textContent,/저장하지 못/);
  assert.equal(f.find('[data-exam-submit]').disabled,true);assert.equal(f.counters.commit,0);assert.deepEqual(f.data.unrelated,{keep:true});
});
check('keyboard 1–4, arrows, OMR jump, close/resume and normalized reload',()=>{
  const f=setup();f.find('[data-study-exam-open]').click();f.frame();f.key('4');f.key('ArrowRight');f.key('2');
  assert.equal(f.find('[data-exam-progress]').textContent,'2 / 20');f.key('ArrowLeft');assert.equal(f.find('[data-exam-choice="3"]').getAttribute('aria-pressed'),'true');
  f.find('[data-exam-jump="8"]').click();f.key('3');assert.equal(f.document.activeElement,f.find('[data-exam-choice="2"]'));
  f.document.body.style.overflow='hidden';f.key('Escape');assert.equal(f.document.body.style.overflow,'');assert.equal(f.document.activeElement,f.find('[data-study-exam-open]'));
  f.remoteOpen();f.frame();assert.equal(f.find('[data-exam-progress]').textContent,'9 / 20');assert.equal(f.find('[data-exam-choice="2"]').getAttribute('aria-pressed'),'true');
  const saved=JSON.parse(JSON.stringify(f.data));saved.learningQuizzes[0]=JSON.parse(JSON.stringify(f.window.HANI_STUDY_V02984_TEST.normalizeQuiz(saved.learningQuizzes[0])));
  const reload=setup(saved);reload.find('[data-study-exam-open]').click();assert.equal(reload.find('[data-exam-progress]').textContent,'3 / 20');assert.equal(reload.data.learningQuizzes[0].answers[8],2);
});
check('Tab trap, Esc/cancel close, focus return, modifier/repeat shortcuts ignored',()=>{
  const f=setup();f.find('[data-study-exam-open]').click();f.frame();const first=f.find('[data-exam-close]');first.focus();assert.equal(f.key('Tab',{shiftKey:true}).prevented,true);assert.equal(f.document.activeElement,f.find('[data-exam-next]'));
  f.find('[data-exam-next]').focus();assert.equal(f.key('Tab').prevented,true);assert.equal(f.document.activeElement,first);
  f.key('1',{ctrlKey:true});f.key('1',{repeat:true});assert.equal(f.counters.save,0);
  assert.equal(f.dialog.dispatch('cancel').prevented,true);assert.equal(f.dialog.open,false);assert.equal(f.document.activeElement,f.find('[data-study-exam-open]'));
});
check('submit calls existing gradeQuiz once, shows stamp, then existing copy/dispute result',()=>{
  const f=setup();f.find('[data-study-exam-open]').click();for(let i=0;i<20;i++){f.find('[data-exam-jump="'+i+'"]').click();f.key(i===2?'2':'1')}
  assert.equal(f.counters.save,20);assert.equal(f.find('[data-exam-submit]').disabled,false);f.find('[data-exam-submit]').click();f.find('[data-exam-submit]').click();f.key('1');
  assert.equal(f.window.gradeCalls,1);assert.equal(f.counters.commit,1);assert.equal(f.data.learningQuizzes[0].correctCount,19);assert.equal(f.data.learningWrongAnswers.length,1);
  assert.equal(f.find('[data-exam-stamp]').hidden,false);assert.equal(f.find('[data-exam-work]').hidden,true);assert.match(f.find('[data-exam-stamp]').textContent,/채점 완료/);
  assert.match(f.find('#studyQuizDetail').textContent,/지은 첨삭 복사/);assert.ok(f.document.querySelector('[data-dispute-submit]'));
  for(const fn of [...f.timers.values()])fn();assert.equal(f.dialog.open,false);assert.equal(f.document.activeElement,f.find('#studyQuizDetail'));assert.equal(f.timers.size,0);
});
check('grading failure keeps dialog/answers and supports one successful retry',()=>{
  const data=fixture();data.learningQuizzes[0].answers.fill(0);const f=setup(data);f.find('[data-study-exam-open]').click();f.counters.fail=true;const before=structuredClone(f.data);f.find('[data-exam-submit]').click();
  assert.deepEqual(f.data,before);assert.equal(f.dialog.open,true);assert.equal(f.find('[data-exam-stamp]').hidden,true);assert.match(f.find('[data-exam-message]').textContent,/채점 결과를 저장하지 못/);
  f.counters.fail=false;f.find('[data-exam-submit]').click();assert.equal(f.data.learningQuizzes[0].status,'completed');f.find('[data-exam-result]').click();assert.equal(f.dialog.open,false);assert.equal(f.timers.size,0);
});
check('new UI has no ID literals/direct storage/Cloud writes; reduced-motion and AA token fallbacks',()=>{
  const ui=source.slice(source.indexOf('  // Exam UI owns'),source.indexOf('  function quizStatusLabel'));
  assert.doesNotMatch(ui,/\bid\s*=\s*["']|localStorage|\.clear\(|\.from\(|\.upsert\(/);
  assert.equal((ui.match(/persistQuizAnswer\(/g)||[]).length,1);assert.equal((ui.match(/gradeQuiz\(/g)||[]).length,1);
  assert.match(source,/@media\(prefers-reduced-motion:reduce\).*animation:none!important/);
  const lum=hex=>hex.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
  for(const [ink,paper] of [['202638','ffffff'],['f3f5ff','1a2232'],['b42332','fff5f3']]){const a=lum(ink),b=lum(paper);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5)}
});
fs.writeFileSync(path.join(output,'node-results.json'),JSON.stringify({status:'PASS',checks,environment:'Node VM DOM adapter; actual owner renderers/handlers; no layout claims'},null,2)+'\n');

if(process.argv.includes('--browser')) {
  const arg=process.argv.indexOf('--browser'),require=createRequire(import.meta.url);
  const modulePath=process.argv[arg+1]||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const {chromium}=require(modulePath);
  let browser;
  try {
    browser=await chromium.launch({executablePath:process.argv[arg+2]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    const results=[];
    for(const width of [412,884,1440])for(const dark of [false,true]){
      const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce',colorScheme:dark?'dark':'light'}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.abort());
      await page.setContent('<html><head><style>'+fs.readFileSync(path.join(root,'hani-style-01.css'),'utf8').replace(/^@import.*$/gm,'')+'</style></head><body>'+shell+'</body></html>');
      await page.evaluate(({data,dark})=>{document.documentElement.dataset.theme=dark?'dark':'light';document.body.dataset.view='study';window.state=data;window.answerCalls=[];window.gradeCalls=0;window.writes={save:0,commit:0};window.today=()=> '2026-10-16';window.save=()=>{writes.save++;return {ok:true}};window.commit=()=>{writes.commit++;return true};window.showView=()=>{};window.alert=message=>{throw Error(message)};},{data:fixture(),dark});
      await page.addScriptTag({content:instrumented});await page.addScriptTag({content:remote});
      await page.getByRole('button',{name:'응시하기',exact:true}).click();
      const dialog=page.locator('dialog');assert.equal(await dialog.evaluate(n=>n.open),true);
      assert.equal(await dialog.locator('[data-exam-choice]').count(),4);await page.keyboard.press('2');await page.keyboard.press('ArrowRight');await page.keyboard.press('1');
      assert.equal(await dialog.locator('[data-exam-progress]').innerText(),'2 / 20');
      await page.keyboard.press('Escape');await page.locator('[data-remote-quiz]').click();assert.equal(await dialog.evaluate(n=>n.open),true);assert.equal(await dialog.locator('[data-exam-progress]').innerText(),'2 / 20');
      const close=dialog.locator('[data-exam-close]');await close.focus();await page.keyboard.press('Shift+Tab');assert.equal(await dialog.evaluate(n=>n.contains(document.activeElement)),true);
      for(let i=0;i<20;i++){await dialog.locator('[data-exam-jump="'+i+'"]').click();await page.keyboard.press(i===2?'2':'1')}
      const metrics=await dialog.evaluate(n=>({dialog:n.scrollWidth<=n.clientWidth+1,page:document.documentElement.scrollWidth<=innerWidth+1,animation:getComputedStyle(n.querySelector('[data-exam-stamp] strong')).animationName,
        boxes:[...n.querySelectorAll('button')].filter(b=>b.getClientRects().length).every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1}),
        duplicates:[...document.querySelectorAll('[id]')].map(n=>n.id).filter((id,i,a)=>a.indexOf(id)!==i)}));
      assert.equal(metrics.dialog,true);assert.equal(metrics.page,true);assert.equal(metrics.boxes,true);assert.equal(metrics.animation,'none');assert.deepEqual(metrics.duplicates,[]);
      await dialog.screenshot({path:path.join(output,width+'-'+(dark?'dark':'light')+'.png')});
      await dialog.locator('[data-exam-submit]').click();assert.equal(await dialog.locator('[data-exam-stamp]').isVisible(),true);
      assert.equal(await page.evaluate(()=>gradeCalls),1);await dialog.locator('[data-exam-result]').click();
      assert.equal(await page.locator('#studyQuizDetail [data-study-tutor-copy]').count(),1);assert.ok(await page.locator('#studyQuizDetail [data-dispute-submit]').count()>0);
      assert.equal(await page.evaluate(()=>writes.commit),1);assert.equal(await page.evaluate(()=>writes.save===answerCalls.length),true);assert.deepEqual(errors,[]);
      results.push({width,dark,status:'PASS',...metrics});await context.close();
    }
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'PASS',results},null,2)+'\n');
  } catch(error) {
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'BLOCKED_OR_FAILED',reason:error.message.split('\n')[0]},null,2)+'\n');
    throw error;
  } finally {await browser?.close()}
}
