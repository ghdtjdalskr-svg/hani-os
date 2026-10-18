// node scripts/hani-theme-white-215.test.mjs [<playwright index.mjs> <browser exe>]
// Only disposable browser storage is used; external requests are blocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {expected216Html,cacheRefs} from './hani-216-cache-expectations.mjs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {textContrastAudit} from './hani-contrast-audit.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const main=read('hani-main.js'),html=read('index.html'),css=read('hani-design-system.css');
const finishes=['porcelain-cream','pure-white','titanium-graphite','midnight-black','sakura-pink','alpine-blue'];
const extract=(s,name)=>{const hit=s.match(new RegExp('function '+name+'\\([^]*?\\n\\}'));assert.ok(hit,name);return hit[0]};
const palettes={};
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.css'))){
  for(const rule of read(file).matchAll(/([^{}]+)\{([^{}]+)\}/g)){
    const ids=[...rule[1].matchAll(/\.login-design-choice\[data-design="([^"]+)"\]/g)].map(m=>m[1]);
    for(const id of ids){palettes[id]??={};for(const token of rule[2].matchAll(/(--[\w-]+):([^;]+)/g))palettes[id][token[1]]=token[2]}
  }
}
const required=[...new Set(Object.values(palettes).flatMap(p=>Object.keys(p)))].sort();
assert.deepEqual(Object.keys(palettes['pure-white']).sort(),required,'White owns every finish token, including login swatches');
for(const name of ['signatureFinish','loginFinish'])assert.deepEqual([...html.matchAll(new RegExp('name="'+name+'" value="([^"]+)"','g'))].map(m=>m[1]),finishes,'canonical order '+name);
const writes=[],radios=finishes.map(value=>({value,checked:false})),status={textContent:''};
const ctx=vm.createContext({document:{documentElement:{dataset:{}},querySelectorAll:()=>radios},$:()=>status,updateFinishScope(){},syncSeasonCollection(){},localStorage:{setItem:(...args)=>writes.push(args)}});
vm.runInContext(extract(main,'applySignatureFinish'),ctx);
for(const id of finishes){ctx.applySignatureFinish(id,false);assert.equal(ctx.document.documentElement.dataset.finish,id);assert.equal(radios.filter(r=>r.checked).length,1)}
assert.equal(writes.length,0);
ctx.applySignatureFinish('pure-white',true);assert.deepEqual(writes,[['hani_os_signature_finish_v1','pure-white']]);assert.match(status.textContent,/Pure White/);
ctx.applySignatureFinish('unknown',false);assert.equal(ctx.document.documentElement.dataset.finish,'porcelain-cream');
const git=process.env.HANI_GIT_PATH||'git';
const base=f=>execFileSync(git,['show','50cdb270ebf29f48daf9e3c1204f75efaae1adc5:'+f],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
const oldCss=base('hani-design-system.css');
const cream=s=>[...s.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter(m=>m[1].includes('.login-design-choice[data-design="porcelain-cream"]')).map(m=>m[0].trim());
assert.deepEqual(cream(css),cream(oldCss),'both original Porcelain palettes byte-identical');
const oldMain=base('hani-main.js');
assert.equal(extract(main,'applySignatureFinish'),extract(oldMain.replace('const names={"porcelain-cream":"Porcelain Cream",','const names={"porcelain-cream":"Porcelain Cream","pure-white":"Pure White",').replace('"alpine-blue":"#d6e6f3"}[finish]','"alpine-blue":"#d6e6f3","pure-white":"#f4f5f8"}[finish]'),'applySignatureFinish'),'canonical Finish owner preserves storage behavior');
const storageExpressions=s=>s.match(/\b(?:commit|save|writeProtectedState|localStorage\.(?:setItem|removeItem|clear))\([^)]*\)/g);
assert.deepEqual(storageExpressions(main),storageExpressions(oldMain),'all storage/write expressions preserved across integrated features');
for(const name of ['initLoginGate','loginGateEnterApp','loginGateResumeSession','commit','save'])assert.equal(extract(main,name),extract(oldMain,name),name+' canonical auth/storage owner preserved');
assert.deepEqual(cacheRefs(html),cacheRefs(expected216Html(execFileSync(git,['show','efe6bcca97d89568b8104c88a4c6fdfa0915b580:index.html'],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}))),'existing URL/cache pairs unchanged; only approved 216 tags added');
console.log('PASS finish list, token completeness, actual apply/fallback/save, Porcelain and storage/version/cache preservation');
if(!process.argv[2])process.exit(0);
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const sharp=createRequire(pathToFileURL(process.argv[2]))('sharp');
const out=path.join(root,'artifacts/theme-white-215');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
  if(!file.startsWith(root+path.sep)||uri.split('/').some(s=>s.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const lum=rgb=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const rgb=s=>s.startsWith('#')?s.slice(1).match(/../g).map(v=>parseInt(v,16)):s.match(/[\d.]+/g).slice(0,3).map(Number);
const report={base:'50cdb27',screenshots:[],cases:[],contrast:[],textAudits:[],errors:[]};let browser;
// Resolve CSS Color 4 (color-mix computes to color(srgb ...)) through the browser.
const auditSource=textContrastAudit.toString().replace(/  const rgba=[^\n]+/,`  const rgba=value=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');c.fillStyle=value;c.fillRect(0,0,1,1);const p=c.getImageData(0,0,1,1).data;return [p[0],p[1],p[2],p[3]/255]};`);
async function pixelTextAudit(page,view){
  const entries=await page.evaluate(()=>{
    const entries=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');let node;
    while((node=walker.nextNode())){
      const e=node.parentElement,text=node.textContent.trim();if(!text||e.closest('script,style,[aria-hidden="true"]')||!e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
      const s=getComputedStyle(e);c.clearRect(0,0,1,1);c.fillStyle=s.color;c.fillRect(0,0,1,1);const fg=[...c.getImageData(0,0,1,1).data];let opacity=1;
      let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
      for(let n=e;n;n=n.parentElement){const a=getComputedStyle(n);opacity*=Number(a.opacity);if(/auto|scroll|hidden|clip/.test(a.overflow)){const r=n.getBoundingClientRect();clip={left:Math.max(clip.left,r.left),right:Math.min(clip.right,r.right),top:Math.max(clip.top,r.top),bottom:Math.min(clip.bottom,r.bottom)}}}
      const range=document.createRange();range.selectNodeContents(node);
      for(const r of range.getClientRects()){
        const left=Math.max(r.left,clip.left),right=Math.min(r.right,clip.right),top=Math.max(r.top,clip.top),bottom=Math.min(r.bottom,clip.bottom);
        if(right-left<2||bottom-top<2)continue;
        const hit=document.elementFromPoint((left+right)/2,(top+bottom)/2);if(hit&&!e.contains(hit)&&hit!==e)continue;
        const points=[];
        for(let y=Math.ceil(top)+1;y<bottom-1;y+=2)for(let x=Math.ceil(left)+1;x<right-1;x+=2){const hit=document.elementFromPoint(x,y);if(hit===e||e.contains(hit))points.push([x,y])}
        entries.push({text:text.slice(0,100),selector:e.id?'#'+e.id:e.tagName+'.'+[...e.classList].join('.'),fg,opacity,rect:{left,right,top,bottom},parent:e.parentElement.className,points});
      }
    }return entries;
  });
  const style=await page.addStyleTag({content:'*{-webkit-text-fill-color:transparent!important;text-shadow:none!important}svg text{fill:transparent!important}'});
  let shot;try{shot=await page.screenshot({fullPage:false,animations:'disabled'})}finally{await style.evaluate(e=>e.remove())}
  const {data,info}=await sharp(shot).removeAlpha().raw().toBuffer({resolveWithObject:true});const failures=[];
  for(const entry of entries){let minimum=Infinity;
    for(const [x,y] of entry.points){
      const p=(y*info.width+x)*info.channels,bg=[data[p],data[p+1],data[p+2]],alpha=entry.fg[3]/255*entry.opacity,fg=entry.fg.slice(0,3).map((v,i)=>v*alpha+bg[i]*(1-alpha));minimum=Math.min(minimum,ratio(fg,bg));
    }
    if(minimum<4.5){const {points,...details}=entry;failures.push({...details,ratio:minimum})}
  }
  return {textRects:entries.length,failures};
}
try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [390,1440])for(const finish of ['pure-white','porcelain-cream']){
    const context=await browser.newContext({viewport:{width,height:1000},colorScheme:'dark',reducedMotion:'reduce',serviceWorkers:'block'});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    await context.addInitScript(()=>{
      window.themeStorageCalls=[];
      for(const method of ['setItem','removeItem','clear']){const orig=Storage.prototype[method];Storage.prototype[method]=function(...args){window.themeStorageCalls.push({method,key:args[0]});return orig.apply(this,args)}}
    });
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('dialog',d=>d.dismiss());
    await page.goto(origin);await page.waitForFunction(()=>typeof loginGateInitialized!=='undefined'&&loginGateInitialized);
    const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
    await page.evaluate(()=>{window.themeStorageCalls=[]});
    // Switching through a dark finish catches leaked dark palette values.
    await page.locator('input[name="loginFinish"][value="midnight-black"]').check();
    await page.locator(`input[name="loginFinish"][value="${finish}"]`).check();
    assert.equal(await page.locator('input[name="loginFinish"]:checked').inputValue(),finish);
    await page.reload();await page.waitForFunction(()=>loginGateInitialized);
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.finish),finish,'saved finish restored');
    assert.equal(await page.locator('input[name="signatureFinish"]:checked').inputValue(),finish);
    const screenshot=async name=>{const file=`${width}-${finish}-${name}.png`;await page.screenshot({path:path.join(out,file),fullPage:!name.startsWith('login')});report.screenshots.push(file)};
    const audit=async view=>{if(finish==='pure-white'){
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const result=await page.evaluate('('+auditSource+')()');
      const pixels={textRects:0,failures:[]},height=await page.evaluate(()=>document.documentElement.scrollHeight);
      for(let top=0;top<(view==='login'?1:height);top+=800){
        if(view!=='login')await page.evaluate(y=>scrollTo(0,y),top);
        const part=await pixelTextAudit(page,view);pixels.textRects+=part.textRects;pixels.failures.push(...part.failures);
      }
      if(view!=='login')await page.evaluate(()=>scrollTo(0,0));
      report.textAudits.push({width,view,...result,pixels});console.log('AA audit',width,view,result.textNodes,'text nodes,',pixels.failures.length,'pixel background failures');
    }};
    for(const season of ['spring','summer','autumn','winter']){
      await page.evaluate(s=>applySeasonTheme(s,false),season);
      const actual=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['--surface-canvas','--surface-page','--surface-panel','--surface-raised','--text-primary','--text-secondary','--text-muted','--control-accent','--finish-scheme'].map(k=>[k,s.getPropertyValue(k).trim()]))});
      for(const [key,value] of Object.entries(actual))assert.equal(value,palettes[finish][key]||'#eee5d5',finish+' '+season+' '+key);
      assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),finish==='pure-white'?'#f4f5f8':'#eee5d5');
      if(finish==='pure-white'){
        for(const fg of ['--text-primary','--text-secondary','--text-muted'])for(const bg of ['--surface-canvas','--surface-page','--surface-panel','--surface-raised']){
          const contrast=ratio(rgb(actual[fg]),rgb(actual[bg]));assert.ok(contrast>=4.5,`${fg}/${bg} ${contrast}`);report.contrast.push({width,season,fg,bg,ratio:contrast});
        }
      }
    }
    await page.evaluate(()=>applySeasonTheme('autumn',false));
    // Capture the entire responsive login form in addition to the first viewport.
    await screenshot('login');await audit('login');if(width===390){await page.locator('#loginGateFinish').scrollIntoViewIfNeeded();await screenshot('login-finishes');await audit('login')}
    const loginColors=await page.locator('.login-design-choice[data-design="pure-white"]').evaluate(e=>{const s=getComputedStyle(e);return {fg:s.color,bg:s.backgroundColor}});
    assert.ok(ratio(rgb(loginColors.fg),rgb(loginColors.bg))>=4.5,'independent White swatch remains AA under Cream too');
    const finishOnly=await page.evaluate(()=>({data:Object.fromEntries(Object.entries(localStorage)),writes:window.themeStorageCalls}));
    const withoutFinish=o=>Object.fromEntries(Object.entries(o).filter(([key])=>key!=='hani_os_signature_finish_v1'));
    assert.deepEqual(withoutFinish(finishOnly.data),withoutFinish(before),'finish selection and reload preserve all other local storage');
    assert.ok(finishOnly.writes.every(w=>w.method==='setItem'&&w.key==='hani_os_signature_finish_v1'),JSON.stringify(finishOnly.writes));
    await page.evaluate(()=>{cloudStopAutoSync();unlockLoginGate();showView('aura')});
    await page.locator('#aura.view.active').waitFor();
    await page.locator('input[name="signatureFinish"][value="midnight-black"]').check();
    await page.locator(`input[name="signatureFinish"][value="${finish}"]`).check();
    assert.match(await page.locator('#signatureFinishStatus').innerText(),finish==='pure-white'?/Pure White/:/Porcelain Cream/);
    await page.evaluate(()=>scrollTo(0,0));await screenshot('theme-studio');
    await page.locator('#signatureFinishChoices').screenshot({path:path.join(out,`${width}-${finish}-finish-choices.png`)});
    for(const view of ['aura','home']){
      await page.evaluate(v=>showView(v),view);await page.locator(`#${view}.view.active`).waitFor();
      await audit(view);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow '+view);
      if(finish==='pure-white'){
        // Actual text/button styles, including the gradient's lighter endpoint.
        const colors=await page.locator(`#${view} .btn.primary:visible`).evaluateAll(nodes=>nodes.map(e=>{const s=getComputedStyle(e);return {text:e.textContent.trim(),fg:s.color,bg:s.backgroundColor}}));
        for(const c of colors){const contrast=ratio(rgb(c.fg),rgb(c.bg));assert.ok(contrast>=4.5,JSON.stringify(c));report.contrast.push({width,view,...c,ratio:contrast})}
      }
      if(view==='home'){await page.evaluate(()=>scrollTo(0,0));await screenshot('dashboard')}
    }
    const after=await page.evaluate(()=>({data:Object.fromEntries(Object.entries(localStorage)),writes:window.themeStorageCalls}));
    // showView already persists navigation; this is outside the Finish event path.
    const strip=o=>Object.fromEntries(Object.entries(o).filter(([key])=>!['hani_os_signature_finish_v1','hani_os_navigation_v1'].includes(key)));
    assert.deepEqual(strip(after.data),strip(before),'all other local storage preserved');
    assert.ok(after.writes.every(w=>w.method==='setItem'&&['hani_os_signature_finish_v1','hani_os_navigation_v1'].includes(w.key)),JSON.stringify(after.writes));
    report.cases.push({width,finish,finishOnlyOtherStorageUnchanged:true,protectedStorageUnchanged:true,writes:after.writes});await context.close();
  }
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.textAudits.flatMap(a=>a.pixels.failures),[],'all exposed text pixels have AA background contrast, including artwork/gradients');
  report.result='PASS';console.log(`PASS actual Edge: ${report.cases.length} cases, ${report.screenshots.length} screenshots + 4 finish close-ups, seasons/dark OS/AA/preference reload/storage`);
}catch(e){report.result='FAIL';report.failure=e.stack;throw e}finally{fs.writeFileSync(path.join(out,'status.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r))}
