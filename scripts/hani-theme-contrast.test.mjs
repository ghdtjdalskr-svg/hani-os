// Actual Edge render regression and full-view contrast audit. No Git commands.
// node --test --test-isolation=none scripts/hani-theme-contrast.test.mjs
// HANI_PLAYWRIGHT_PATH=<index.mjs> HANI_EDGE_PATH=<msedge.exe>
// HANI_THEME_PHASE=before|after; HANI_THEME_AUDIT=1 also visits every view.
// HANI_THEME_CDP may point to an independently launched disposable Edge only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import inverse from './hani-theme-contrast-source.cjs';

const root=path.resolve(import.meta.dirname,'..');
export const finishes=['porcelain-cream','pure-white','titanium-graphite','midnight-black','sakura-pink','alpine-blue'];
export const seasons=['spring','summer','autumn','winter'];
const widths=[1440,390];
const output=path.join(root,'artifacts/theme-contrast');
const phase=process.env.HANI_THEME_PHASE||'after';
assert.ok(['before','after'].includes(phase));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const routes=[...new Set([...html.matchAll(/<[^>]+\bclass="view(?:\s[^"]*)?"[^>]*>/g)].map(m=>m[0].match(/\bid="([\w-]+)"/)?.[1]).filter(Boolean))];
assert.ok(routes.includes('study')&&routes.includes('home'),'actual view roots discovered');

// Runs inside Edge. Resolve CSS Color 4 through canvas; alpha and ancestor
// opacity are composited in paint order rather than discarding transparency.
export function measureText(){
  const samples=[],uncertain=[],canvas=document.createElement('canvas');
  canvas.width=canvas.height=1;
  const ctx=canvas.getContext('2d',{willReadFrequently:true}),cache=new Map();
  const rgba=value=>{
    if(cache.has(value))return cache.get(value);
    ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);
    const p=ctx.getImageData(0,0,1,1).data,result=[...p.slice(0,3),p[3]/255];cache.set(value,result);return result;
  };
  const over=(a,b)=>{
    const alpha=a[3]+b[3]*(1-a[3]);
    return alpha?[...a.slice(0,3).map((v,i)=>(v*a[3]+b[i]*b[3]*(1-a[3]))/alpha),alpha]:[0,0,0,0];
  };
  const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const selector=el=>{
    const parts=[];
    for(let n=el;n&&n!==document.documentElement;n=n.parentElement){
      if(n.id){parts.unshift('#'+CSS.escape(n.id));break;}
      parts.unshift(n.tagName.toLowerCase()+[...n.classList].slice(0,2).map(c=>'.'+CSS.escape(c)).join('')+':nth-child('+([...n.parentElement.children].indexOf(n)+1)+')');
    }
    return parts.join(' > ');
  };
  const inspect=(el,text,pseudo=null)=>{
    const style=getComputedStyle(el,pseudo),chain=[];
    for(let n=el;n;n=n.parentElement)chain.push({el:n,style:getComputedStyle(n)});
    const raw=rgba(el.namespaceURI==='http://www.w3.org/2000/svg'?style.fill:(style.webkitTextFillColor||style.color));
    const paint=ink=>{
      let pixel=ink||[0,0,0,0];
      if(pseudo)pixel=[...pixel.slice(0,3),pixel[3]*Number(style.opacity)];
      for(const x of chain){pixel=over(pixel,rgba(x.style.backgroundColor));pixel[3]*=Number(x.style.opacity);}
      return over(pixel,[255,255,255,1]);
    };
    const bg=paint(),fg=paint(raw),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const size=parseFloat(style.fontSize),large=size>=24||(size>=18.66&&Number(style.fontWeight)>=700);
    const entry={selector:selector(el)+(pseudo||''),text:text.slice(0,120),foreground:style.color,effectiveForeground:fg.slice(0,3),background:bg.slice(0,3),ratio,
      classification:ratio<3?'안 보임 위험':ratio<4.5&&!large?'낮음':'충족',large};
    const image=chain.find((x,i)=>x.style.backgroundImage!=='none'&&!chain.slice(0,i).some(y=>rgba(y.style.backgroundColor)[3]===1));
    if(image){entry.uncertain='image/gradient behind text';uncertain.push({...entry,paint:selector(image.el)});}
    if(el.namespaceURI==='http://www.w3.org/2000/svg'){entry.uncertain='SVG shape backdrop';uncertain.push(entry);}
    samples.push(entry);
  };
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    const el=node.parentElement,text=node.textContent.trim();
    if(!el||!text||el.closest('script,style,template,[aria-hidden="true"]'))continue;
    const range=document.createRange();range.selectNodeContents(node);
    if(!range.getClientRects().length||!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    if(getComputedStyle(el).visibility!=='visible')continue;
    inspect(el,text);
  }
  for(const el of document.querySelectorAll('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea,select')){
    if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    const text=el.value||el.placeholder;
    if(text)inspect(el,String(text),!el.value&&el.placeholder?'::placeholder':null);
  }
  return {samples,uncertain,nodes:samples.length,risk:samples.filter(s=>s.ratio<3).length,low:samples.filter(s=>s.classification==='낮음').length};
}

async function openBrowser(){
  const playwright=process.env.HANI_PLAYWRIGHT_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const edge=process.env.HANI_EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const {chromium}=await import(pathToFileURL(path.resolve(playwright)).href);
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
  const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)||pathname.split('/').some(s=>s.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    const bytes=fs.readFileSync(file);
    res.end(phase==='before'&&file===path.join(root,'hani-design-system.css')?inverse.restore(bytes,'hani-design-system.css'):bytes);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser,context;
  try{
    browser=process.env.HANI_THEME_CDP?await chromium.connectOverCDP(process.env.HANI_THEME_CDP):await chromium.launch({headless:true,executablePath:edge});
    context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
    const origin=`http://127.0.0.1:${server.address().port}`;
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    // Disposable in-memory Storage, installed before any runtime JS. No user's
    // localStorage, Cloud, saved quiz, grade or dispute record is touched.
    await context.addInitScript(()=>{
      window.__contrastWrites=[];
      for(const key of ['localStorage','sessionStorage']){
        const map=new Map();
        Object.defineProperty(window,key,{configurable:true,value:{getItem:k=>map.get(String(k))??null,setItem(k,v){window.__contrastWrites.push({area:key,key:String(k)});map.set(String(k),String(v));},removeItem(k){window.__contrastWrites.push({area:key,key:String(k)});map.delete(String(k));},clear(){window.__contrastWrites.push({area:key,key:'*'});map.clear();},key:i=>[...map.keys()][i]??null,get length(){return map.size;}}});
      }
    });
    return {browser,context,origin,close:async()=>{await context.close();await browser.close();await new Promise(r=>server.close(r));}};
  }catch(e){await context?.close();await browser?.close();await new Promise(r=>server.close(r));throw e;}
}

async function fixture(page,origin){
  await page.goto(origin,{waitUntil:'load'});
  await page.waitForFunction(()=>window.HANI_STUDY_V02984_TEST&&typeof unlockLoginGate==='function');
  await page.evaluate(()=>{
    unlockLoginGate();
    const style=document.createElement('style');style.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(style);
    const date=careKoreaPeriod().day;
    const project={id:'contrast-project',name:'테마 대비 경제 학습',category:'economy',status:'active',scheduleType:'manual',quizSize:2,createdAt:date+'T00:00:00Z'};
    const questions=[
      {prompt:'[자료 기준 2026-11-08]\n외국인 매도와 반도체 변동성을 함께 해석할 때 적절한 접근은?',choices:['수급과 실적·환율을 함께 살핀다','삼성전자 실적이 반드시 악화됐다고 단정한다','매도만으로 기업의 내재가치를 확정한다','반도체 수요가 반드시 사라졌다고 본다'],answerIndex:0,explanation:'수급은 기업가치나 세계 수요를 단정하는 단독 근거가 아닙니다.',type:'Current Issue',difficulty:'medium'},
      {prompt:'영업이익과 현금흐름을 함께 확인하는 이유는?',choices:['수익과 현금의 차이를 확인한다','매출과 항상 반대이기 때문이다','모든 현금흐름이 이익이기 때문이다','항상 부채로 기록하기 때문이다'],answerIndex:0,explanation:'수익성과 실제 현금 유입을 함께 살핍니다.',type:'multiple_choice',difficulty:'medium'}
    ];
    state.learningProjects=[project];
    state.learningQuizzes=[{id:'contrast-graded',projectId:project.id,title:'경제 퀴즈 · 채점 완료',date,scheduledDate:date,status:'completed',completedAt:'2026-11-08T12:00:00Z',questions,answers:[0,1],total:2,score:1,correctCount:1},
      {id:'contrast-pending',projectId:project.id,title:'경제 퀴즈 · 풀기 전',date,scheduledDate:date,status:'pending',questions,answers:[null,null],total:2}];
    state.learningWrongAnswers=[{id:'contrast-wrong',projectId:project.id,quizId:'contrast-graded',questionIndex:1,question:questions[1].prompt,choices:questions[1].choices,answerIndex:0,userAnswer:questions[1].choices[1],correctAnswer:questions[1].choices[0],explanation:questions[1].explanation,wrongCount:1,firstWrongDate:date,lastWrongDate:date,reviewStatus:'new'}];
    state.books=[{id:'contrast-book',title:'대비 감사 가상 도서',author:'시험 저자',status:'read',completedDate:date,review:'테마별 본문 확인'}];
    state.movies=[{id:'contrast-movie',title:'대비 감사 가상 영화',status:'watched',watchedDate:date}];
    state.boardPosts=[{id:'contrast-post',title:'테마 대비 감사',body:'읽기 전용 가상 게시물입니다.',authorId:'hani',category:'LOUNGE',createdAt:date+'T00:00:00Z',views:0,likes:0}];state.boardComments=[];
    window.__contrastStartWrites=window.__contrastWrites.length;
    window.__contrastMountResult=()=>{
      showView('study');
      document.querySelector('#studyMainPanel').innerHTML=HANI_STUDY_V02984_TEST.renderQuizDetail(project,state.learningQuizzes[0]);
    };
  });
}

test('theme CSS exact inverse preserves original bytes and rejects drift',()=>{
  const file='hani-design-system.css',raw=fs.readFileSync(path.join(root,file));
  const original=inverse.restore(raw,file);
  assert.equal(inverse.hash(original),inverse.delta.beforeSha256);
  assert.deepEqual(inverse.restore(raw.toString('utf8'),file),original.toString('utf8'));
  for(const invalid of [Buffer.concat([raw,Buffer.from('\n')]),raw.subarray(1),original])assert.throws(()=>inverse.restore(invalid,file),/exact theme-contrast input/);
});

test('legacy 289 outer layer preserves independent 288 pins without accepting drift',()=>{
  for(const [file,row] of Object.entries(inverse.legacy.files)){
    const raw=fs.readFileSync(path.join(root,file)),before=inverse.restoreLegacy(raw,file);
    assert.equal(inverse.hash(before),row.beforeSha256);
    assert.deepEqual(inverse.restoreLegacy(raw.toString('utf8'),file),before.toString('utf8'));
    for(const bad of [Buffer.concat([raw,Buffer.from('\n')]),raw.subarray(1),before]){
      assert.throws(()=>inverse.restoreLegacy(bad,file),/exact legacy-289 input/);
      assert.equal(inverse.projectLegacy(bad,file),bad,'unknown bytes are not projected');
    }
  }
});

test('quiz token model supports normal, correct, wrong and disabled choices in all six palettes',()=>{
  const source=fs.readFileSync(path.join(root,'hani-design-system.css'),'utf8');
  const rgb=hex=>hex.slice(1).match(/../g).map(s=>parseInt(s,16));
  const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  const rows=[];
  for(const finish of finishes){
    const tokens={};
    for(const rule of source.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]+)\}/g)){
      if(!rule[1].split(',').some(s=>[':root',`:root[data-finish="${finish}"]`].includes(s.trim())))continue;
      for(const match of rule[2].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{6})\s*[;}]/gi))tokens[match[1]]=rgb(match[2]);
    }
    for(const [kind,bg] of Object.entries({normal:null,correct:rgb('#5ec58b'),wrong:rgb('#ee8c8c')})){
      const raised=tokens['--surface-raised'],afterBg=bg?raised.map((v,i)=>.86*v+.14*bg[i]):raised;
      const beforeBg=rgb({normal:'#fffef9',correct:'#edf9f2',wrong:'#fff1f1'}[kind]);
      for(const disabled of [false,true]){
        const row={finish,kind,disabled,scope:'Token calculation only; not a rendered measurement',before:contrast(tokens['--text-primary'],beforeBg),after:contrast(tokens[disabled?'--text-secondary':'--text-primary'],afterBg)};
        rows.push(row);assert.ok(row.after>=4.5,JSON.stringify(row));
      }
    }
    rows.push({finish,kind:'dispute-summary',scope:'Token calculation only; not a rendered measurement',before:contrast(tokens['--text-primary'],rgb('#fffffc')),after:contrast(tokens['--text-primary'],tokens['--surface-raised'])});
    for(const [kind,oldBg]of Object.entries({'wrong-group':'#fbfaff','wrong-answer':'#f7f7fb','wrong-retry':'#faf9ff','study-history':'#ffffff'})){
      const row={finish,kind,scope:'Token calculation only; not a rendered measurement',before:contrast(tokens['--text-primary'],rgb(oldBg)),after:contrast(tokens['--text-primary'],tokens['--surface-raised'])};
      rows.push(row);assert.ok(row.after>=4.5,JSON.stringify(row));
    }
  }
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'token-model.json'),JSON.stringify(rows,null,2)+'\n');
});

test('Edge quiz choices and dispute text retain at least 4.5:1 in every Finish × season × width',async t=>{
  const report={phase,status:'RUNNING',threshold:4.5,sourceSha256:phase==='before'?inverse.delta.beforeSha256:inverse.delta.afterSha256,diskSha256:inverse.hash(fs.readFileSync(path.join(root,'hani-design-system.css'))),runs:[],screenshots:[],errors:[],planned:widths.flatMap(width=>finishes.flatMap(finish=>seasons.map(season=>({width,finish,season,routes:[...routes,'login','quiz-pending','quiz-graded','quiz-wrong']})))),limitations:['Local synthetic records only; unopened dialogs and authenticated remote data are not covered.','Image/gradient/SVG backdrops are reported as uncertain; raster/canvas/pseudo-element lettering requires pixel review.']};
  fs.mkdirSync(output,{recursive:true});
  let env;
  try{
    env=await openBrowser();report.browser=env.browser.version();
    assert.match(report.browser,/\d+/,'actual Edge version');
    for(const width of widths){
      const page=await env.context.newPage();await page.setViewportSize({width,height:1000});
      page.on('pageerror',e=>report.errors.push(e.message));
      await fixture(page,env.origin);
      for(const finish of finishes)for(const season of seasons){
        await page.evaluate(({finish,season})=>{applySignatureFinish(finish,false);applySeasonTheme(season,false);}, {finish,season});
        const audit=async route=>{const result=await page.evaluate(measureText);assert.ok(result.nodes>0,route+' contains rendered text');const run={width,finish,season,route,...result};report.runs.push(run);return run;};
        if(process.env.HANI_THEME_AUDIT==='1'){
          for(const route of routes){
            await page.evaluate(route=>{showView(route);window.scrollTo(0,0);},route);
            await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
            const actual=await page.evaluate(()=>document.querySelector('.view.active')?.id);
            if(actual!==route){report.errors.push(`unvisited view ${route}: actual ${actual}`);continue;}
            await audit(route);
            // Existing read-only tabs expose inactive panels without invoking
            // save, grade, generate, delete, login or Cloud operations.
            const tabs=page.locator('.view.active :is([data-report-board],[data-organization-tab],[data-study-tab],[data-ic-section],[data-tabs]>.tab)');
            for(let i=0;i<await tabs.count();i++){
              const tab=tabs.nth(i);if(!await tab.isVisible())continue;
              const label=(await tab.textContent()).trim();await tab.click();await audit(route+' / '+label);
            }
          }
          // The login screen is independent of app navigation and uses real markup.
          const login=await env.context.newPage();await login.setViewportSize({width,height:1000});await login.goto(env.origin);
          await login.evaluate(({finish,season})=>{applySignatureFinish(finish,false);applySeasonTheme(season,false);}, {finish,season});
          const result=await login.evaluate(measureText);assert.ok(result.nodes>0,'login text');report.runs.push({width,finish,season,route:'login',...result});await login.close();
          await page.evaluate(()=>HANI_STUDY_V02984_TEST.openPendingQuiz('contrast-pending'));
          assert.equal(await page.locator('dialog.study-popup-exam[open]').count(),1,'actual pending quiz dialog');
          await audit('quiz-pending');
          await page.evaluate(()=>document.querySelector('dialog.study-popup-exam[open]').close());
          await page.evaluate(()=>{showView('study');HANI_STUDY_V02984_TEST.openQuickWrong();});
          await audit('quiz-wrong');
        }
        await page.evaluate(()=>window.__contrastMountResult());
        assert.equal(await page.locator('#studyQuizDetail .study-choice span').count(),8,'both actual graded questions with four choices');
        assert.equal(await page.locator('#studyQuizDetail .study-choice input:disabled').count(),8,'graded inputs stay disabled');
        assert.equal(await page.locator('#studyQuizDetail .study-dispute > summary').count(),2,'actual dispute renderer');
        const run=await audit('quiz-graded');
        const targets=run.samples.filter(s=>/#studyQuizDetail/.test(s.selector)&&(/study-choice/.test(s.selector)||s.text.startsWith('이의제기 / 재채점')));
        assert.equal(targets.length,10,'all eight choices and two dispute summaries measured');
        await t.test(`${width} ${finish} ${season}`,()=>{
          for(const entry of targets){assert.ok(!entry.uncertain,JSON.stringify(entry));assert.ok(entry.ratio>=4.5,JSON.stringify(entry));}
        });
        // Closed and opened disputes, including labels, are measured separately.
        await page.locator('#studyQuizDetail .study-dispute').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
        await audit('quiz-dispute-open');
        await page.locator('#studyQuizDetail .study-dispute').evaluateAll(nodes=>nodes.forEach(n=>n.open=false));
        if(season==='autumn'&&['titanium-graphite','midnight-black','porcelain-cream'].includes(finish)){
          const name=`${phase}-${finish}-${season}-${width}.png`;
          await page.locator('#studyQuizDetail').screenshot({path:path.join(output,name)});report.screenshots.push(name);
        }
      }
      report.storageWrites=await page.evaluate(()=>__contrastWrites.slice(__contrastStartWrites));
      assert.deepEqual(report.storageWrites.filter(row=>row.key==='hani_os_life_v23'||row.key==='*'),[],'quiz fixture and audit never persist life data; existing navigation preferences are listed separately');
      await page.close();
    }
    report.status=report.runs.filter(r=>r.route==='quiz-graded').some(r=>r.samples.some(s=>/#studyQuizDetail/.test(s.selector)&&(/study-choice/.test(s.selector)||s.text.startsWith('이의제기 / 재채점'))&&(s.ratio<4.5||s.uncertain)))?'FAIL':'PASS';
    if(report.runs.some(r=>r.risk))report.status='RISK_REMAINS';
    if(report.errors.length)report.status='RUNTIME_ERRORS';
    if(process.env.HANI_THEME_AUDIT==='1'){
      assert.deepEqual(report.errors,[],'full audit must expose every requested view without runtime errors');
      assert.equal(report.runs.reduce((n,r)=>n+r.risk,0),0,'full audit still has text below 3:1; see audit JSON');
    }
  }catch(error){report.status=/EPERM|EACCES|Access.*denied|접근|액세스/.test(String(error))?'BLOCKED':'FAIL';report.errors.push(String(error));throw error;
  }finally{
    if(env)await env.close();
    report.summary={states:report.runs.length,textNodes:report.runs.reduce((n,r)=>n+r.nodes,0),risk:report.runs.length?report.runs.reduce((n,r)=>n+r.risk,0):null,low:report.runs.length?report.runs.reduce((n,r)=>n+r.low,0):null,uncertain:report.runs.length?report.runs.reduce((n,r)=>n+r.uncertain.length,0):null};
    fs.writeFileSync(path.join(output,`audit-${phase}.json`),JSON.stringify(report,null,2)+'\n');
  }
});
