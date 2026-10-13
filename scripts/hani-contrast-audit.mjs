import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Run only against an isolated local context. No account, external requests or user data.
// Usage: node scripts/hani-contrast-audit.mjs <playwright index.mjs> <browser exe>
export function textContrastAudit() {
  const failures=[],uncertain=[],samples=[],inputSamples=[];
  const rgba=value=>{const m=value.match(/^rgba?\(([^)]+)\)$/);return m?m[1].split(/[,\s/]+/).filter(Boolean).map(Number):null};
  const over=(a,b)=>{const alpha=a[3]??1;return [0,1,2].map(i=>a[i]*alpha+b[i]*(1-alpha)).concat(1)};
  const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const selector=el=>{const parts=[];for(let n=el;n&&n!==document.body;n=n.parentElement){if(n.id){parts.unshift('#'+CSS.escape(n.id));break}parts.unshift(n.tagName.toLowerCase()+[...n.classList].slice(0,2).map(c=>'.'+CSS.escape(c)).join('')+':nth-child('+([...n.parentElement.children].indexOf(n)+1)+')')}return parts.join(' > ')};
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())) {
    const text=node.textContent.trim(),el=node.parentElement;
    if(!text||!el||el.closest('script,style,template,[aria-hidden="true"]'))continue;
    const style=getComputedStyle(el),range=document.createRange();range.selectNodeContents(node);
    if(style.visibility!=='visible'||!range.getClientRects().length||!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    // Text below the viewport is included; closed details/hidden tabs are audited when opened.
    const chain=[];for(let n=el;n;n=n.parentElement)chain.push({el:n,style:getComputedStyle(n)});
    const backgrounds=chain.filter(x=>x.style.backgroundImage!=='none');
    let bg=[255,255,255,1];
    for(const x of chain.toReversed()){const c=rgba(x.style.backgroundColor);if(c)bg=over(c,bg)}
    const ink=el.namespaceURI==='http://www.w3.org/2000/svg'?style.fill:style.color;
    let fg=rgba(ink);if(!fg){uncertain.push({selector:selector(el),text:text.slice(0,100),reason:'unsupported computed text paint: '+ink});continue}
    let opacity=1;for(const x of chain)opacity*=Number(x.style.opacity);
    fg=over([...fg.slice(0,3),(fg[3]??1)*opacity],bg);
    const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const entry={selector:selector(el),text:text.slice(0,100),foreground:ink,background:bg.slice(0,3).map(Math.round),ratio:Number(ratio.toFixed(3))};
    // Gradients/images cannot be certified from a flat computed background. Keep them visible in the report.
    const paint=backgrounds.find(x=>{const at=chain.indexOf(x);return !chain.slice(0,at).some(y=>(rgba(y.style.backgroundColor)?.[3]??0)===1)});
    if(paint)uncertain.push({...entry,reason:'background image/gradient requires pixel review',paint:selector(paint.el)});
    if(el.namespaceURI==='http://www.w3.org/2000/svg')uncertain.push({...entry,reason:'SVG shapes behind text require pixel review'});
    if(ratio<4.5)failures.push(entry);
    samples.push(entry);
  }
  // Form values and placeholders have no DOM text node. Report their actual computed paint too.
  for(const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select')){
    if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    const placeholder=!el.value&&el.placeholder,style=getComputedStyle(el,placeholder?'::placeholder':null),text=placeholder||el.value;
    if(!text)continue;
    const chain=[];for(let n=el;n;n=n.parentElement)chain.push(getComputedStyle(n));
    let bg=[255,255,255,1];for(const s of chain.toReversed()){const c=rgba(s.backgroundColor);if(c)bg=over(c,bg)}
    const raw=rgba(style.color);if(!raw){uncertain.push({selector:selector(el),reason:'unsupported control color'});continue}
    const opacity=chain.reduce((a,s)=>a*Number(s.opacity),1)*(placeholder?Number(style.opacity):1),fg=over([...raw.slice(0,3),(raw[3]??1)*opacity],bg),a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const entry={selector:selector(el)+(placeholder?'::placeholder':''),text:String(text).slice(0,100),foreground:style.color,background:bg.slice(0,3).map(Math.round),ratio:Number(ratio.toFixed(3))};
    if(ratio<4.5)failures.push(entry);inputSamples.push(entry);
    if(chain.some((s,at)=>s.backgroundImage!=='none'&&!chain.slice(0,at).some(b=>(rgba(b.backgroundColor)?.[3]??0)===1)))uncertain.push({...entry,reason:'control background image/gradient requires pixel review'});
  }
  return {failures,uncertain,textNodes:samples.length,controls:inputSamples.length};
}

export async function localBrowser(playwrightPath,browserExe) {
  if(!playwrightPath||!browserExe)throw Error('args: <playwright index.mjs> <browser exe>');
  const root=path.resolve(import.meta.dirname,'..'),{chromium}=await import(pathToFileURL(path.resolve(playwrightPath)).href);
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
  const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(decodeURIComponent(new URL(req.url,'http://local').pathname)||'/index.html'));const target=file===root?path.join(root,'index.html'):file;if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target))});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{browser=await chromium.launch({headless:true,executablePath:browserExe})}catch(e){server.close();throw e}
  const origin=`http://127.0.0.1:${server.address().port}`,context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();
  return {root,browser,context,page,origin,close:async()=>{await browser.close();await new Promise(r=>server.close(r))}};
}

export async function mountFixtures(page,origin) {
  await page.goto(origin,{waitUntil:'load'});
  await page.waitForFunction(()=>window.HaniBoard&&window.HANI_CONTEXT_REMOTE_V1&&typeof unlockLoginGate==='function');
  await page.evaluate(()=>{
    unlockLoginGate();
    // In-memory records only; deliberately no save, commit, login or server operation.
    state.books=[{id:'qa-book',title:'대비 감사 도서',author:'가상 저자',topic:'기타',status:'read',rating:4,completedDate:'2026-10-11',review:'독서 카드 본문과 제목 대비 확인'}];
    state.boardPosts=[{id:'qa-post',title:'라운지 대비 감사',body:'조작하지 않는 본문입니다.\n두 번째 문단입니다.',authorId:'hani',category:'LOUNGE',createdAt:'2026-10-01T00:00:00Z',views:3,likes:0}];state.boardComments=[];
    state.learningProjects=[{id:'qa-project',name:'대비 감사 학습',status:'active',scheduleType:'manual',quizSize:5,category:'other',createdAt:'2026-10-01T00:00:00Z'}];
    const date=careKoreaPeriod().day;
    state.learningQuizzes=[{id:'qa-quiz',projectId:'qa-project',title:'오늘의 미완료 퀴즈',status:'pending',date,scheduledDate:date,total:1,questions:[{prompt:'가상 질문',choices:['가','나'],answerIndex:0}],answers:[null]}];
    agentPolicyRegistryCache={base_policy:{principles:['가상 정책']},policies:[],counts:{}};
    renderReading();renderAgentPolicyRegistry();renderHaniCareHome();HaniBoard.render();HANI_CONTEXT_REMOTE_V1.update();
    // Disable CSS transitions for deterministic computed-style measurements.
    const style=document.createElement('style');style.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(style);
  });
}

async function run() {
  const report={status:'RUNNING',threshold:4.5,scope:'local synthetic records; visible DOM/SVG text and form values/placeholders including below-fold; all view roots and navigation routes',limitations:['Image/gradient/SVG backgrounds remain explicitly uncertain pending pixel review.','Canvas/raster lettering and generated pseudo-element text require visual review.','Only local synthetic data; authenticated server data and unopened dialogs are outside this run.'],runs:[],errors:[],unvisited:[]};
  const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/qa-210');fs.mkdirSync(out,{recursive:true});
  let env;
  try {
    env=await localBrowser(process.argv[2],process.argv[3]);
    env.page.on('pageerror',e=>report.errors.push(e.message));
    await mountFixtures(env.page,env.origin);
    const protectedBefore=await env.page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    const routes=await env.page.evaluate(()=>[...new Set([...document.querySelectorAll('.view[id]')].map(n=>n.id).concat([...document.querySelectorAll('#sidebar [data-view]')].map(n=>n.dataset.view)))]);
    for(const finish of ['porcelain-cream','midnight-black','titanium-graphite','sakura-pink','alpine-blue'])for(const season of ['spring','summer','autumn','winter']) {
      await env.page.evaluate(({finish,season})=>{document.documentElement.dataset.finish=finish;document.documentElement.dataset.season=season;document.body.dataset.finishActive='true'}, {finish,season});
      for(const route of routes) {
        try {
          await env.page.evaluate(route=>{showView(route);if(route.startsWith('settings'))renderAgentPolicyRegistry();if(route==='board')HaniBoard.openPost('qa-post');window.scrollTo(0,0)},route);
          await env.page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
          const actual=await env.page.evaluate(()=>document.body.dataset.view);
          const result=await env.page.evaluate(textContrastAudit);
          report.runs.push({finish,season,route,actual,...result});
          // Visit inactive subpanels through their existing tab controls; never click save/generate actions.
          const tabs=env.page.locator('.view.active :is([data-tabs] > .tab,[data-study-tab],[data-ic-section])');
          for(let i=0;i<await tabs.count();i++){const tab=tabs.nth(i);if(!await tab.isVisible())continue;const label=(await tab.textContent()).trim();await tab.click();await env.page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));report.runs.push({finish,season,route:route+' / '+label,actual,...await env.page.evaluate(textContrastAudit)})}
        }catch(e){report.unvisited.push({finish,season,route,reason:e.message})}
      }
      console.log(`AUDIT ${finish}/${season}: ${report.runs.length} view states`);
    }
    report.protectedUnchanged=protectedBefore===await env.page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    report.summary={states:report.runs.length,violations:report.runs.reduce((n,r)=>n+r.failures.length,0),uncertain:report.runs.reduce((n,r)=>n+r.uncertain.length,0),errors:[...new Set(report.errors)],unvisited:report.unvisited.length,protectedUnchanged:report.protectedUnchanged};
    report.status=report.summary.violations||report.summary.unvisited||report.summary.errors.length||!report.protectedUnchanged?'FAIL':report.summary.uncertain?'PIXEL_REVIEW_REQUIRED':'PASS';
    console.log(JSON.stringify(report.summary));
    if(report.summary.violations||report.summary.unvisited||report.summary.errors.length||!report.protectedUnchanged)process.exitCode=1;
    else if(report.summary.uncertain)process.exitCode=2;
  }catch(error){
    report.status=error.message.includes('EPERM')?'BLOCKED':'FAIL';report.errors.push(error.message.split('\n')[0]);
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),routes=[...new Set([...html.matchAll(/<section\b[^>]*\bid="([\w-]+)"[^>]*\bclass="view(?:\s|"|$)/g)].map(m=>m[1]).concat([...html.matchAll(/\bdata-view="([\w/-]+)"/g)].map(m=>m[1])))];
    for(const finish of ['porcelain-cream','midnight-black','titanium-graphite','sakura-pink','alpine-blue'])for(const season of ['spring','summer','autumn','winter'])for(const route of routes)report.unvisited.push({finish,season,route,reason:report.errors.at(-1)});
    report.summary={states:report.runs.length,violations:null,uncertain:null,unvisited:report.unvisited.length,protectedUnchanged:null};
    console.error(report.status+': '+report.errors.at(-1));process.exitCode=1;
  }finally{if(env)await env.close();fs.writeFileSync(path.join(out,'contrast.json'),JSON.stringify(report,null,2));}
}
if(process.argv[1]&&path.resolve(process.argv[1])===import.meta.filename)await run();
