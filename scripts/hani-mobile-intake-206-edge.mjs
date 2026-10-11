import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browserExe=process.argv[3];assert.ok(browserExe,'args: <playwright index.mjs> <browser exe>');
const out=path.join(root,'artifacts/mobile-intake-206');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,browser=process.env.HANI_EDGE_CDP?await chromium.connectOverCDP(process.env.HANI_EDGE_CDP):await chromium.launch({headless:true,executablePath:browserExe});
const results={},errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HANI_YUNA_HELPDESK);
 await page.evaluate(()=>{unlockLoginGate();showView('intake')});
 await page.waitForFunction(()=>cloudRuntime.tone==='error');
 // Blocking external services can produce a real Cloud error. Preserve it, then
 // set a healthy offline fixture explicitly for the normal-scroll assertions.
 results.offlineErrorVisible=await page.evaluate(()=>cloudRuntime.tone!=='error'||!document.querySelector('.ui26-top').classList.contains('is-mobile-hidden'));
 await page.evaluate(()=>{cloudRuntime={...cloudRuntime,tone:'warn',sync:'OFF',message:'테스트: 외부 요청 차단 · 정상 Local 상태'};updateStorageStatus({ok:true});renderCloudPanel()});
 const bar=page.locator('.ui26-top'),hidden=()=>bar.evaluate(el=>getComputedStyle(el).visibility==='hidden');
 const height=await bar.evaluate(el=>el.getBoundingClientRect().height);assert.ok(height<=52,`bar height ${height}`);results.height=height;
 const row=await bar.evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('.mobile-menu,.mobile-save-status,.quick-jump-icon,.mobile-top-more')].map(button=>{const b=button.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom&&b.left>=r.left&&b.right<=r.right})});assert.ok(row.every(Boolean),'every mobile header control is inside the single row');assert.equal(await page.locator('.storage-strip').isVisible(),false);results.singleRow=true;
 await page.screenshot({path:path.join(out,'mobile-normal-390x844.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
 // A temporary fixture makes the document scrollable independently of the fixed YUNA conversation.
 await page.evaluate(()=>{const space=document.createElement('div');space.dataset.testScroll='1';space.style.height='1600px';document.querySelector('main').append(space)});
 const contentTop=await page.locator('#intake').evaluate(el=>el.offsetTop);
 await page.evaluate(()=>window.scrollTo({top:180,behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('.ui26-top').classList.contains('is-mobile-hidden'),{},{timeout:5000});assert.equal(await hidden(),true);
 assert.equal(await page.locator('#intake').evaluate(el=>el.offsetTop),contentTop,'no layout jump (independent of existing view entry animation)');
 await page.evaluate(()=>window.scrollTo({top:70,behavior:'instant'}));await page.waitForFunction(()=>!document.querySelector('.ui26-top').classList.contains('is-mobile-hidden'));assert.equal(await hidden(),false);results.scroll=true;
 await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.querySelector('[data-test-scroll]').remove()});
 await page.locator('#yunaInput').focus();await page.waitForFunction(()=>document.querySelector('.ui26-top').classList.contains('is-mobile-hidden'));assert.equal(await hidden(),true);results.focus=true;
 await page.locator('#yunaInput').evaluate(el=>el.blur());await page.waitForFunction(()=>!document.querySelector('.ui26-top').classList.contains('is-mobile-hidden'));
 await bar.evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
 // Focusing the composer may scroll the document; return to the top before tapping the header.
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>scrollY===0&&!document.querySelector('.ui26-top').classList.contains('is-mobile-hidden'));
 await bar.evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
 await page.locator('.quick-jump-icon').click({timeout:5000});await page.locator('#quickJumpInput').fill('서재');assert.equal(await page.locator('#quickJumpInput').isVisible(),true);assert.ok(await page.locator('[data-quick-view="reading"]').count());await page.keyboard.press('Escape');results.search=true;
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await bar.evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
 await page.locator('.mobile-top-more').click({timeout:5000});assert.equal(await page.locator('#quickBackup').isVisible(),true);assert.equal(await page.locator('#theme').isVisible(),true);await page.locator('.mobile-top-more').click();results.overflowMenu=true;
 // Use the actual chip, submit, edit, and explicit save paths in an isolated offline browser.
 // The conversation audit acknowledges immediately, then parses asynchronously.
 const send=async text=>{await page.locator('#yunaInput').fill(text);await page.locator('#yunaSend').click();await page.waitForFunction(text=>document.querySelector('#yunaInput').value===''&&[...document.querySelectorAll('.yuna-message.user .yuna-bubble')].at(-1)?.textContent===text&&!document.querySelector('#yunaSend').disabled&&!document.querySelector('.yuna-message.is-typing'),text.replace(/\s+/g,' ').trim())};
 const initial=await page.evaluate(()=>({books:state.books.length,movies:state.movies.length,protected:localStorage.getItem('hani_os_life_v23')}));
 await page.locator('[data-yuna-kind="book"]').click();await send('김대식의 인간 vs 기계 책을 봤어');
 await page.locator('#yunaSave').waitFor();const preview=await page.locator('.yuna-preview').innerText();assert.match(preview,/인간 vs 기계/);assert.match(preview,/김대식/);assert.match(preview,/완독/);assert.match(preview,/\d{4}-\d{2}-\d{2}/);
 assert.equal(await page.evaluate(()=>state.books.length),initial.books);assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),initial.protected);
 await page.locator('#yunaEdit').click();await send('평점은 4.5');assert.match(await page.locator('.yuna-preview').innerText(),/4.5점/);
 await page.screenshot({path:path.join(out,'book-preview-390x844.png')});
 await page.evaluate(()=>{window.__intakeCalls=0;window.__commits=0;const apply=intakeApplyRow,saveCommit=commit;intakeApplyRow=function(...args){window.__intakeCalls++;return apply(...args)};commit=function(...args){window.__commits++;return saveCommit(...args)}});
 await page.locator('#yunaSave').click();await page.waitForFunction(()=>window.__commits===1);const saved=await page.evaluate(()=>({books:state.books.length,book:state.books.at(-1),apply:window.__intakeCalls,commits:window.__commits}));assert.equal(saved.books,initial.books+1);assert.equal(saved.book.title,'인간 vs 기계');assert.equal(saved.book.author,'김대식');assert.equal(saved.book.rating,4.5);assert.equal(saved.book.status,'read');assert.equal(saved.apply,1);assert.equal(saved.commits,1);results.bookPreviewAndSave=true;
 await page.locator('[data-yuna-kind="movie"]').click();await send('케이팝 데몬 헌터스 봤어');await send('오늘');assert.match(await page.locator('.yuna-preview').innerText(),/케이팝 데몬 헌터스/);assert.equal(await page.evaluate(()=>state.movies.length),initial.movies);results.movieChip=true;
 await page.locator('#yunaInput').evaluate(el=>el.blur());
 await page.evaluate(()=>{updateStorageStatus({ok:false,message:'테스트 저장 실패: 공간 부족'});const space=document.createElement('div');space.dataset.testScroll='1';space.style.height='1600px';document.querySelector('main').append(space)});
 await page.waitForFunction(()=>document.querySelector('.ui26-top').classList.contains('mobile-status-error'));
 await page.evaluate(()=>window.scrollTo({top:180,behavior:'instant'}));assert.equal(await hidden(),false);assert.equal(await bar.locator('.mobile-save-dot').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(212, 59, 67)');await page.locator('.mobile-save-status').click();assert.match(await page.locator('.storage-strip').innerText(),/테스트 저장 실패/);results.errorVisible=true;
 await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.querySelector('[data-test-scroll]').remove()});
 await page.locator('.mobile-save-status').click();await page.evaluate(()=>{updateStorageStatus({ok:true});cloudRuntime={...cloudRuntime,sync:'STOP',message:'Local과 Cloud가 모두 변경',tone:'warn'};renderCloudPanel()});await page.waitForFunction(()=>document.querySelector('.ui26-top').classList.contains('mobile-status-error'));assert.equal(await bar.locator('.mobile-save-dot').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(212, 59, 67)');results.conflictVisible=true;
 await page.locator('#yunaInput').focus();assert.equal(await hidden(),true,'focus also protects the composer during an error');await page.locator('#yunaInput').evaluate(el=>el.blur());await page.waitForFunction(()=>!document.querySelector('.ui26-top').classList.contains('is-mobile-hidden'));
 await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));
 await page.screenshot({path:path.join(out,'mobile-390x844.png')});
 for(const width of [320,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`no overflow at ${width}px`);assert.ok(await bar.evaluate(el=>el.getBoundingClientRect().height)<=52)}
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await bar.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');results.reducedMotion=true;
 await page.setViewportSize({width:1440,height:1000});assert.equal(await page.locator('.mobile-save-status').isVisible(),false);assert.equal(await page.locator('.storage-strip').isVisible(),true);assert.equal(await page.locator('#quickBackup').isVisible(),true);assert.equal(await page.locator('#theme').isVisible(),true);results.desktop=true;
 const ids=await page.evaluate(()=>{const counts={};document.querySelectorAll('[id]').forEach(el=>counts[el.id]=(counts[el.id]||0)+1);return Object.entries(counts).filter(([,n])=>n>1)});assert.deepEqual(ids,[]);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'edge-results.json'),JSON.stringify({results,errors,browser:await browser.version()},null,2));console.log('PASS:',JSON.stringify(results));
}catch(error){fs.writeFileSync(path.join(out,'edge-results.json'),JSON.stringify({status:'FAIL',results,errors,error:String(error)},null,2));throw error}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
