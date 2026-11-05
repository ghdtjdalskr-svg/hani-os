// node scripts/hani-fun-top3.test.mjs [--browser]
// Real owner bodies in the existing exam DOM adapter; optional isolated Playwright layout QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const main=read('hani-main.js'),study=read('hani-study-v02984.js'),milestones=read('hani-milestones.js');
const base=f=>read('artifacts/fun-top3/baseline/'+f);
const slice=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert.ok(i>=0&&j>i,a);return s.slice(i,j)};
const adapter=slice(read('scripts/hani-exam-popup-214.test.mjs'),'function dom()','function setup(');
const shell='<section id="reading"><div id="readBooks"></div><div id="wishBooks"></div></section><section id="study"></section>';
const dom=()=>{
  const document=vm.runInNewContext(adapter+';dom()', {shell}),proto=Object.getPrototypeOf(document.body);
  proto.contains=function(node){for(let n=node;n;n=n.parentElement)if(n===this)return true;return false};
  Object.defineProperty(proto,'open',{get(){return this.hasAttribute('open')},set(value){if(value)this.attrs.open='';else delete this.attrs.open}});
  for(const node of [document.body,document.head,...document.body.querySelectorAll('*')])delete node.open;
  return document;
};
const plain=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x};
let writes=0,checks=0;
const deny=()=>{writes++;throw Error('unexpected write/request')};
const storage={setItem:deny,removeItem:deny,clear:deny};
const guards={localStorage:storage,sessionStorage:storage,save:deny,commit:deny,agentApi:deny,fetch:deny,supabase:new Proxy({},{get:()=>deny})};
function check(name,run){run();checks++;console.log('PASS',name)}
function nativeClick(el){el.click();if(el.tagName==='SUMMARY')el.parentElement.open=!el.parentElement.open}
function reading(source=main){
  const document=dom();document.addEventListener=(...args)=>document.body.addEventListener(...args);
  const context=vm.createContext({...guards,document,window:{HaniOrganizationRoster:{people:[{id:'yoonseul',name:'윤슬'}]}},
    esc:x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    mediaImage:()=>'',TOPIC_COLORS:{기타:'#000'},stars:()=> '★★★',recordIdAttributes:(k,id)=>k+'="'+id+'"'});
  vm.runInContext(slice(source,'function activityDate(','function activityMonthShift(')+slice(source,source.includes('// Screen-only bookmark')?'// Screen-only bookmark':'function bookCard(','function updateBookFormState('),context);
  return {context,document};
}
const book={id:'book1',status:'read',completedDate:'2026-10-01',title:'<검증> 긴 제목',review:'기존 후기',topic:'기타'};
check('F03 exact condition, date compatibility, duplicates, immutable input and escaped original card',()=>{
  const f=reading(),rows=freeze([book,{...book,id:'wish',status:'wish'},{...book,id:'missing',completedDate:''},
    {...book,id:'future',completedDate:'9999-01-01'},{...book,id:'bad',completedDate:'2026-02-30'},
    {...book,id:'clash',readDate:'2026-10-02'},{...book,id:'compat',completedDate:undefined,readDate:'2026-10-01'},
    {...book,id:'both',readDate:'2026-10-01'},{...book,id:'empty-compat',readDate:'invalid'},
    {...book,id:'dup'},{...book,id:'dup'},{...book,id:''},{...book,id:3}]);
  const before=JSON.stringify(rows),ids=f.context.bookThanksIds(rows,'2026-11-06');
  assert.deepEqual([...ids],['book1','compat','both']);assert.equal(JSON.stringify(rows),before);
  const old=reading(base('hani-main.js'));
  for(const row of rows){const html=f.context.bookCard(row,ids.has(row.id));assert.equal(html.includes('class="book-thanks"'),ids.has(row.id));
    assert.equal(html.replace(/<details class="book-thanks">[\s\S]*?<\/details>/g,''),old.context.bookCard(row));}
  assert.match(f.context.bookCard(book,true),/&lt;검증&gt;/);
  assert.match(f.context.bookCard(book,true),/책 한 권 끝까지 읽으셨네요\. 책갈피는 잠깐 쉬겠습니다!/);
});
check('F03 native disclosure model, delegated outside click, no writes or per-card listeners',()=>{
  const f=reading(),host=f.document.querySelector('#readBooks');host.innerHTML=f.context.bookCard(book,true);
  const note=host.querySelector('details'),summary=note.querySelector('summary');assert.equal(note.open,false);
  nativeClick(summary);assert.equal(note.open,true);nativeClick(summary);assert.equal(note.open,false);
  nativeClick(summary);f.context.closeBookThanks({target:summary});assert.equal(note.open,true);
  f.context.closeBookThanks({target:f.document.body});assert.equal(note.open,false);
  host.innerHTML=f.context.bookCard(book,true);assert.equal(host.querySelector('details').open,false);
  assert.equal(f.document.body.listeners.click.length,1);assert.equal(writes,0);
});
check('F03 actual paged renderReading checks the entire shelf, closes on rerender, preserves unrelated output',()=>{
  const run=source=>{
    const f=reading(source),nodes=new Map(),ctx=f.context;
    Object.assign(ctx,{state:{ui:{},books:[book,{...book,id:'dup'},{...book,id:'dup'},{...book,id:'wish',status:'wish'}]},
      $:id=>f.document.querySelector('#'+id)||nodes.get(id)||nodes.set(id,{style:{},value:'',textContent:'',innerHTML:''}).get(id),
      renderActivityTrend(){},n:Number,sortRatedItems:rows=>rows,filterMinimumRating:rows=>rows,filterText:rows=>rows,
      completedByToday:()=>true,completedInYearByToday:()=>true,completedInMonthByToday:()=>true,ratingValue:()=>null,
      today:()=> '2026-11-06',uiPageSize:()=>1,uiPageSlice:(name,rows)=>({rows:rows.slice(ctx.page||0,(ctx.page||0)+1)}),
      uiMountPagination(){},updateBookFormState(){},renderReadingGoals(){}});
    vm.runInContext(slice(source,'function renderReading(){','$("saveReadingGoals").onclick='),ctx);ctx.renderReading();return {...f,nodes};
  };
  const now=run(main),old=run(base('hani-main.js'));
  const strip=s=>s.replace(/<details class="book-thanks">[\s\S]*?<\/details>/g,'');
  for(const id of ['bookStats','bookCount','wishBookCount','readBookCount'])assert.equal(JSON.stringify(now.nodes.get(id)),JSON.stringify(old.nodes.get(id)),id);
  assert.equal(strip(now.document.querySelector('#readBooks').innerHTML),old.document.querySelector('#readBooks').innerHTML);
  assert.equal(now.document.querySelector('#wishBooks').innerHTML,old.document.querySelector('#wishBooks').innerHTML);
  const note=now.document.querySelector('.book-thanks');nativeClick(note.querySelector('summary'));assert.equal(note.open,true);
  now.context.renderReading();assert.equal(now.document.querySelector('.book-thanks').open,false);
  now.context.page=1;now.context.renderReading();assert.equal(now.document.querySelectorAll('.book-thanks').length,0);
  assert.equal(writes,0);
});
const studyContext=source=>{
  const document={querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){},readyState:'loading'};
  const context=vm.createContext({...guards,window:{HaniOrganizationRoster:{people:[{id:'hina',name:'히나'}]}},document,console,state:{learningProjects:[],learningQuizzes:[],learningWrongAnswers:[]},structuredClone,Date});
  vm.runInContext(source.replace(/\r?\n  boot\(\);\s*\n\}\)\(\);\s*$/, '\n})();'),context);return context;
};
const sc=studyContext(study),api=sc.window.HANI_STUDY_V02984_TEST;
const project={id:'project',category:'economy',name:'검증 학습'},question={id:'q',prompt:'기존 질문',choices:['가','나','다','라'],answerIndex:0,explanation:'기존 해설'};
const quiz={id:'quiz1',projectId:'project',status:'completed',completedAt:'2026-10-01T00:00:00Z',questions:[question],answers:[0],score:100,total:1};
check('F05 graded economy/Japanese only; malformed, future, missing, empty and orphan excluded; score independent',()=>{
  const old=studyContext(base('hani-study-v02984.js')).window.HANI_STUDY_V02984_TEST;
  for(const category of ['economy','jlpt'])for(const score of [0,50,100]){
    const p={...project,category},q=freeze({...quiz,score}),html=api.renderQuizDetail(p,q);
    assert.match(html,/<details class="study-thanks">/);assert.match(html,/한 세트 마무리! 빨간 펜도 잠깐 뚜껑 닫을게요\./);
    assert.equal(html.replace(/<details class="study-thanks">[\s\S]*?<\/details>/,''),old.renderQuizDetail(p,q));
  }
  for(const patch of [{status:'pending'},{status:'in_progress'},{id:''},{id:'<bad>'},{completedAt:''},{completedAt:'bad'},
    {completedAt:'2026-02-30T00:00:00Z'},{completedAt:'9999-01-01T00:00:00Z'},{questions:[]},{projectId:'orphan'}]){
    const row={...quiz,...patch},html=api.renderQuizDetail(project,row);assert.doesNotMatch(html,/class="study-thanks"/);assert.equal(html,old.renderQuizDetail(project,row));
  }
  assert.doesNotMatch(api.renderQuizDetail(project,quiz,true),/class="study-thanks"/);
  assert.equal(writes,0);
});
check('F05 native disclosure model opens/closes without any listener or storage write',()=>{
  const document=dom(),host=document.querySelector('#study');host.innerHTML=api.renderQuizDetail(project,quiz);
  const note=host.querySelector('.study-thanks');assert.equal(note.open,false);nativeClick(note.querySelector('summary'));assert.equal(note.open,true);
  nativeClick(note.querySelector('summary'));assert.equal(note.open,false);assert.deepEqual(Object.keys(note.listeners),[]);assert.equal(writes,0);
});
check('F05 actual submit success/stamp/result and failed-save rollback; opening/closing adds zero writes',()=>{
  const examTest=read('scripts/hani-exam-popup-214.test.mjs');
  const harness=vm.createContext({source:study,remote:read('hani-context-remote-v1.js'),vm,assert,structuredClone,console,Date});
  vm.runInContext(slice(examTest,'const fixture =','const checks=[];')+';this.createExam=setup;',harness);
  for(const category of ['economy','jlpt']){
    const f=harness.createExam();f.data.learningProjects[0].category=category;
    f.find('[data-study-exam-open]').click();for(let i=0;i<20;i++){f.find('[data-exam-jump="'+i+'"]').click();f.key('1')}
    f.counters.fail=true;const before=JSON.stringify(f.data);f.find('[data-exam-submit]').click();
    assert.equal(JSON.stringify(f.data),before);assert.equal(f.document.querySelector('.study-thanks'),null);assert.equal(f.find('[data-exam-stamp]').hidden,true);
    f.counters.fail=false;f.find('[data-exam-submit]').click();assert.equal(f.find('[data-exam-stamp]').hidden,false);
    const note=f.find('.study-thanks'),saves=f.counters.save,commits=f.counters.commit;
    for(let i=0;i<4;i++)nativeClick(note.querySelector('summary'));
    assert.equal(f.counters.save,saves);assert.equal(f.counters.commit,commits);
    for(const fn of [...f.timers.values()])fn();assert.equal(f.dialog.open,false);assert.match(note.textContent,/한 세트 마무리!/);
  }
  assert.equal(writes,0);
});
function milestoneFixture({reduced=false}={}){
  const document=dom(),host=document.createElement('section');host.id='milestones';document.body.append(host);document.body.dataset.view='milestones';
  host.innerHTML='<div data-ms-archive></div><dialog data-ms-detail hidden></dialog><div data-ms-form hidden></div><ul data-ms-list></ul><div data-ms-filters></div><select data-ms-sort></select><div data-ms-grades></div><div data-ms-session></div>';
  host.style.setProperty=()=>{};
  // DOM adapter supplements used by the existing milestone owner.
  const proto=Object.getPrototypeOf(host),oldClass=Object.getOwnPropertyDescriptor(proto,'classList');
  Object.defineProperty(proto,'classList',{get(){const owner=this,cl=oldClass.get.call(this);cl.remove=x=>{owner.className=owner.className.split(/\s+/).filter(v=>v!==x).join(' ')};cl.contains=x=>owner.className.split(/\s+/).includes(x);return cl}});
  proto.contains=function(node){for(let n=node;n;n=n.parentElement)if(n===this)return true;return false};
  for(const name of ['filters','grades'])host.querySelector('[data-ms-'+name+']').childElementCount=1;
  host.querySelector('[data-ms-sort]').options=[{}];
  document.getElementById=id=>document.querySelector('#'+id);document.addEventListener=(...args)=>document.body.addEventListener(...args);document.readyState='complete';
  let serial=0,observer;const timers=new Map(),allTimers=[];
  const context=vm.createContext({...guards,window:{matchMedia:()=>({matches:reduced}),HaniOrganizationRoster:{people:[{id:'hani',name:'하니'}]}},document,console,state:{milestones:[]},
    setTimeout:fn=>{timers.set(++serial,fn);allTimers.push(fn);return serial},clearTimeout:id=>timers.delete(id),MutationObserver:class{constructor(fn){observer=fn}observe(){}},});
  vm.runInContext(milestones,context);const api=context.window.HaniMilestones;
  const row=plain(api.SEED[0]);context.state.milestones=[{...row,id:'milestone_fixture',date:'2026-10-01',category:'LIFE'}];
  const open=id=>{const b=document.createElement('button');b.setAttribute('data-ms-open',id);host.append(b);b.click();return host.querySelector('[data-ms-detail]')};
  return {context,document,host,api,open,timers,allTimers,leave:()=>{document.body.dataset.view='home';observer()}};
}
check('F12 achieved non-financial only, pending seeds/date/category/damage, saved override and original output',()=>{
  const f=milestoneFixture(),original=vm.createContext({window:{HaniOrganizationRoster:f.context.window.HaniOrganizationRoster},console});vm.runInContext(base('hani-milestones.js'),original);
  const old=original.window.HaniMilestones,seed=plain(f.api.SEED[0]);
  const rows=[...plain(f.api.SEED),...['LIFE','FINANCE','INVESTMENT'].map(category=>({...seed,id:'milestone_'+category.toLowerCase(),category})),{...seed,date:'9999-01-01'},{...seed,date:'2026-02-30'}];
  for(const row of rows){const eligible=!f.api.isPending(row)&&!f.api.validate(row).length&&row.date<='2026-11-06'&&!['FINANCE','INVESTMENT'].includes(row.category);
    const html=f.api.detail(freeze(row));assert.equal(html.includes('data-ms-encore='),eligible);
    assert.equal(html.replace(/<section class="ms-encore"[\s\S]*?<\/section>/,''),old.detail(row));}
  const seedOverride={...seed,category:'FINANCE'};assert.doesNotMatch(f.api.detail(f.api.merged([seedOverride]).items[0]),/data-ms-encore=/);
  assert.equal(writes,0);
});
check('F12 actual delegated click, repeat lock, stale timer, close/reopen/view exit, zero writes and unchanged state',()=>{
  const f=milestoneFixture(),before=JSON.stringify(f.context.state),dialog=f.open('milestone_fixture');
  const button=dialog.querySelector('[data-ms-encore]'),note=dialog.querySelector('[data-ms-encore-status]');
  assert.equal(note.hidden,true);button.click();assert.equal(note.hidden,false);assert.equal(button.getAttribute('aria-disabled'),'true');assert.equal(f.timers.size,1);
  assert.equal(note.classList.contains('is-clapping'),true);
  assert.match(note.textContent,/회장님이 남겨 둔 순간, 다시 함께 기뻐해요\./);button.click();assert.equal(f.allTimers.length,1);
  const late=f.allTimers[0];dialog.querySelector('[data-ms-back]').click();assert.equal(f.timers.size,0);assert.equal(note.hidden,true);
  const next=f.open('milestone_health_20261023'),nextNote=next.querySelector('[data-ms-encore-status]');late();assert.equal(nextNote.hidden,true);
  next.querySelector('[data-ms-encore]').click();f.leave();assert.equal(nextNote.hidden,true);assert.equal(f.timers.size,0);
  f.document.body.dataset.view='milestones';const again=f.open('milestone_fixture');assert.equal(again.querySelector('[data-ms-encore-status]').hidden,true);
  again.querySelector('[data-ms-encore]').click();f.allTimers.at(-1)();assert.equal(again.querySelector('[data-ms-encore]').getAttribute('aria-disabled'),'false');
  assert.equal(again.querySelector('[data-ms-encore-status]').classList.contains('is-clapping'),false);
  assert.equal(JSON.stringify(f.context.state),before);assert.equal(writes,0);
});
check('F12 reduced motion is immediate static text, rechecks current record eligibility',()=>{
  const f=milestoneFixture({reduced:true}),dialog=f.open('milestone_fixture'),button=dialog.querySelector('[data-ms-encore]');
  f.context.state.milestones[0].category='FINANCE';button.click();assert.equal(dialog.querySelector('[data-ms-encore-status]').hidden,true);
  f.context.state.milestones[0].category='LIFE';button.click();assert.equal(dialog.querySelector('[data-ms-encore-status]').hidden,false);
  assert.equal(f.timers.size,0);assert.equal(button.disabled,false);f.leave();assert.equal(dialog.querySelector('[data-ms-encore-status]').hidden,true);assert.equal(writes,0);
  assert.equal(dialog.querySelector('[data-ms-encore-status]').classList.contains('is-clapping'),false);
});
check('existing write/grading handlers, forbidden files, versions, data and assets preserved',()=>{
  for(const [file,a,b] of [['hani-main.js','  document.querySelectorAll(\'[data-book-delete]\')','const MOVIE_CONTENT_TYPES='],
    ['hani-study-v02984.js','  function persistQuizAnswer(','  async function quizApi('],
    ['hani-study-v02984.js','  function gradeQuiz(','  function derivedLearningTasks('],
    ['hani-milestones.js','  // ---- Persistence:','  // ---- Runtime']]){
    const current=read(file),old=base(file);assert.equal(slice(current,a,b),slice(old,a,b),a);
  }
  // Release trains bump display versions and cache tags; the shell must otherwise stay as reviewed.
 const noVersion=x=>x.replace(/2\.9\.\d+/g,'2.9.x');assert.equal(noVersion(read('index.html')),noVersion(base('index.html')),'index.html');
  assert.equal(writes,0);
});
console.log('Fun touches:',checks,'PASS; native toggling above is modeled, CSS layout requires --browser.');

if(process.argv.includes('--browser')){
  const modulePath=process.env.HANI_PLAYWRIGHT||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const {chromium}=await import(pathToFileURL(modulePath).href);
  const browser=await chromium.launch({executablePath:process.env.HANI_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const results=[];
  try{
    const styleContext=vm.createContext({q:()=>null,STYLE_ID:'fun-study-style',window:{},document:{querySelector:()=>null,createElement:()=>({}),head:{appendChild:el=>{styleContext.css=el.textContent}}},state:{}});
    vm.runInContext(slice(study,'  function style() {','  function injectStudyShell(')+';style();',styleContext);
    const styles=['hani-style-01.css','hani-style-02.css','hani-design-system.css'].map(read).join('\n')+'\n'+styleContext.css;
    const msShell=read('index.html').match(/<section id="milestones"[\s\S]*?<\/section>/)[0];
    for(const width of [360,390,412,1440])for(const reducedMotion of ['reduce','no-preference'])for(const finish of ['porcelain-cream','midnight-black'])for(const scale of [1,2]){
      const page=await browser.newPage({viewport:{width,height:1000},reducedMotion});await page.route('**/*',r=>r.abort());
      const f=reading(),bookHtml=f.context.bookCard({...book,title:'긴 제목 '.repeat(40)},true);
      await page.setContent('<style>'+styles+'</style><div id="app"><main class="main">'+shell+msShell+'</main></div>');
      await page.evaluate(({bookHtml,studyHtml,finish,scale})=>{
        document.documentElement.dataset.finish=finish;document.documentElement.dataset.theme=finish==='midnight-black'?'dark':'light';document.body.dataset.finishActive='true';
        document.querySelector('#readBooks').innerHTML=bookHtml;document.querySelector('#readBooks').className='archive-grid';document.querySelector('#study').innerHTML=studyHtml;
        for(const s of document.querySelectorAll('section')){s.classList.add('active');s.style.display='block';}
        // Text zoom, including existing px-based font declarations, without changing viewport geometry.
        if(scale===2){const sizes=[...document.querySelectorAll('summary,p,h3,h4,button,label,span')].map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const [n,size]of sizes)n.style.fontSize=size*2+'px';}
        window.writes=0;for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=()=>{writes++;throw Error('write forbidden')};window.save=()=>{writes++;throw Error('save forbidden')};
      }, {bookHtml,studyHtml:api.renderQuizDetail(project,quiz),finish,scale});
      await page.addScriptTag({content:slice(main,'function closeBookThanks(','function bookCard(')});
      for(const selector of ['.book-thanks','.study-thanks']){
        const note=page.locator(selector);await note.locator('summary').click();assert.equal(await note.evaluate(n=>n.open),true);
        await note.locator('summary').click();assert.equal(await note.evaluate(n=>n.open),false);
        await note.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await note.evaluate(n=>n.open),true);
        await page.keyboard.press('Space');assert.equal(await note.evaluate(n=>n.open),false);
        await page.keyboard.press('Enter');assert.equal(await note.evaluate(n=>n.open),true);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      }
      await page.locator('#study h3').click();assert.equal(await page.locator('.book-thanks').evaluate(n=>n.open),false);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.locator('.book-thanks summary').click();
      if(width===390&&reducedMotion==='reduce')await page.screenshot({path:path.join(root,'artifacts/fun-top3',`reading-study-${width}-${finish}-${scale}.png`),fullPage:true});
      const row=plain(milestoneFixture().api.SEED[0]);
      await page.evaluate(row=>{window.state={milestones:[{...row,id:'milestone_browser',category:'LIFE',date:'2026-10-01'}]};document.body.dataset.view='milestones';document.querySelector('#reading').style.display='none';document.querySelector('#study').style.display='none';},row);
      await page.addScriptTag({content:milestones});
      await page.locator('[data-ms-open="milestone_browser"]').click();
      const dialog=page.locator('[data-ms-detail]'),button=dialog.locator('[data-ms-encore]'),note=dialog.locator('[data-ms-encore-status]');
      if(scale===2)await dialog.evaluate(root=>{const sizes=[...root.querySelectorAll('summary,p,h3,h4,button,time,span,blockquote')].map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);for(const [n,size]of sizes)n.style.fontSize=size*2+'px';});
      assert.equal(await note.isVisible(),false);await button.click();assert.equal(await note.isVisible(),true);
      assert.match(await note.innerText(),/회장님이 남겨 둔 순간, 다시 함께 기뻐해요\./);
      assert.equal(await button.evaluate(n=>n===document.activeElement),true);
      if(reducedMotion==='reduce')assert.equal(await note.locator('.ms-encore-clap').evaluate(n=>getComputedStyle(n).display),'none');
      else {assert.equal(await button.getAttribute('aria-disabled'),'true');await page.waitForFunction(()=>document.querySelector('[data-ms-encore]').getAttribute('aria-disabled')==='false');}
      const metrics=await dialog.evaluate(n=>({dialog:n.scrollWidth<=n.clientWidth+1,page:document.documentElement.scrollWidth<=innerWidth+1}));
      assert.equal(metrics.dialog,true,JSON.stringify({width,finish,scale,...metrics}));assert.equal(metrics.page,true);
      await note.scrollIntoViewIfNeeded();
      const contrast=await page.locator('.ms-encore').evaluate(n=>{
        const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
        let parent=n,background;while(parent){background=getComputedStyle(parent).backgroundColor;if(background!=='rgba(0, 0, 0, 0)'&&background!=='transparent')break;parent=parent.parentElement;}
        const a=rgb(getComputedStyle(n).color),b=rgb(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      });assert.ok(contrast>=4.5,'encore text AA '+contrast);
      if(width===390&&reducedMotion==='no-preference')await dialog.screenshot({path:path.join(root,'artifacts/fun-top3',`milestone-${width}-${finish}-${scale}.png`)});
      await page.keyboard.press('Escape');assert.equal(await dialog.evaluate(n=>n.open),false);
      await page.locator('[data-ms-open="milestone_browser"]').click();assert.equal(await note.isVisible(),false);
      assert.equal(await page.evaluate(()=>writes),0);
      results.push({width,reducedMotion,finish,scale,status:'PASS',contrast,...metrics});await page.close();
    }
    console.log('Browser:',results.length,'PASS (native disclosure, keyboard, focus, 390px overflow, reduced motion, zero writes)');
  }finally{fs.writeFileSync(path.join(root,'artifacts/fun-top3/browser-results.json'),JSON.stringify(results,null,2)+'\n');await browser.close()}
}
