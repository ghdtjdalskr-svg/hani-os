import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browserExe=process.argv[3];assert.ok(browserExe,'args: <playwright index.mjs> <browser exe>');
const out=path.join(root,'artifacts/intake-audit-206');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,executablePath:browserExe});
const results=[],errors=[],consoleErrors=[],external=[];let activePage=null;const runtime=[];
const cases=[
 {chip:'task',text:'내일 3시 치과 예약',collection:'tasks',field:'text',value:'내일 3시 치과 예약'},
 {chip:'book',text:'김대식의 인간 vs 기계 책을 봤어',collection:'books',field:'title',value:'인간 vs 기계'},
 {chip:'book',text:'사피엔스 읽는 중',collection:'books',field:'title',value:'사피엔스'},
 {chip:'movie',text:'케이팝 데몬 헌터스 봤어 별점 5',collection:'movies',field:'title',value:'케이팝 데몬 헌터스',answer:'오늘'},
 {chip:'travelWish',text:'성수동 카페 어니언 다녀왔어',collection:'travelWishlist',field:'destination',value:'어니언'},
 {chip:'diary',text:'오늘 5km 뛰었어',collection:'diaries',field:'content',value:'오늘 5km 뛰었어'},
 {chip:null,text:'내일 우산 챙기기',collection:'tasks',field:'text',value:'내일 우산 챙기기'},
];
try{
 for(const width of [390,1440])for(const mode of ['button','Enter']){
  const context=await browser.newContext({viewport:{width,height:844}});
  await context.route('**/*',async route=>{if(new URL(route.request().url()).origin===origin)return route.continue();external.push({url:new URL(route.request().url()).origin,resource:route.request().resourceType()});
   // Block external traffic with an empty response to avoid unrelated ERR_FAILED console noise.
   return route.fulfill({status:200,contentType:'text/javascript',body:''});
  });
  const page=await context.newPage();activePage=page;page.on('pageerror',e=>errors.push({width,mode,error:String(e)}));page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push({width,mode,error:msg.text()})});
  await page.addInitScript(()=>{const native=window.visualViewport;if(!native)return;const fixture=new EventTarget();Object.defineProperties(fixture,{height:{get:()=>window.__viewportHeight??native.height},width:{get:()=>native.width},offsetTop:{get:()=>0},offsetLeft:{get:()=>0},scale:{get:()=>1}});Object.defineProperty(window,'visualViewport',{configurable:true,value:fixture});window.__testViewport=fixture});
  page.on('dialog',dialog=>dialog.dismiss());
  await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HANI_YUNA_HELPDESK);
  if(mode==='button')runtime.push(await page.evaluate(()=>({version:HANI_DISPLAY_VERSION,latestScript:document.scripts[document.scripts.length-1]?.src,helpdeskScript:[...document.scripts].find(s=>s.src.includes('hani-yuna-helpdesk.js'))?.src})));
  await page.evaluate(()=>{unlockLoginGate();showView('intake');window.__applies=0;window.__commits=0;window.__saves=0;window.__aiCalls=0;window.__originalAI=agentApi;
   const apply=intakeApplyRow,saveCommit=commit,saveState=save;intakeApplyRow=function(...args){window.__applies++;return apply(...args)};commit=function(...args){window.__commits++;return saveCommit(...args)};save=function(...args){window.__saves++;return saveState(...args)};
   agentApi=function(...args){window.__aiCalls++;return window.__originalAI(...args)};
   window.__inputNode=document.querySelector('#yunaInput');window.__conversationNode=document.querySelector('#yunaConversation');window.__events=[];window.__sendAt=0;
   new MutationObserver(()=>{const box=document.querySelector('#yunaConversation'),last=box.querySelector('.yuna-message:last-of-type'),typing=box.querySelector('.is-typing');window.__events.push({at:performance.now(),messages:[...box.querySelectorAll('.yuna-message')].map(el=>({role:el.classList.contains('user')?'user':'yuna',text:el.innerText})),typingVisible:!!typing&&getComputedStyle(typing).display!=='none'&&typing.getBoundingClientRect().height>0,lastText:last?.innerText})}).observe(window.__conversationNode,{childList:true,subtree:true});
  });
  const bubbles=page.locator('.yuna-message'),lastReply=page.locator('.yuna-message.yuna').last();
  const send=async text=>{await page.locator('#yunaInput').fill(text);await page.evaluate(()=>{window.__events=[];window.__sendAt=performance.now()});if(mode==='button')await page.locator('#yunaSend').click();else await page.locator('#yunaInput').press('Enter');
   await page.waitForFunction(()=>document.querySelector('#yunaSend').disabled===false&&window.__events.some(x=>x.messages.some(m=>m.text==='확인 중…')));
   const events=await page.evaluate(()=>window.__events),typing=events.find(x=>x.typingVisible);assert.ok(typing,`${width}/${mode}: immediate visible acknowledgement`);assert.ok(typing.at-await page.evaluate(()=>window.__sendAt)<1000);
   const pending=typing.messages;assert.equal(pending.at(-2).role,'user');assert.equal(pending.at(-2).text,text);assert.equal(pending.at(-1).role,'yuna');assert.equal(pending.at(-1).text,'확인 중…');assert.equal(await page.locator('#yunaInput').inputValue(),'');
   assert.equal(await page.evaluate(()=>window.__inputNode===document.querySelector('#yunaInput')&&window.__conversationNode===document.querySelector('#yunaConversation')),true,'persistent input and conversation');
   if(mode==='Enter')assert.equal(await page.locator('#yunaInput').evaluate(el=>document.activeElement===el),true,'keyboard focus retained');
   const roles=await bubbles.evaluateAll(els=>els.map(el=>el.classList.contains('user')?'user':'yuna'));assert.equal(roles.at(-2),'user');assert.equal(roles.at(-1),'yuna');assert.ok((await lastReply.innerText()).length>0);
  };
  for(const flow of cases){
   await page.locator(width===390?'#yunaMobileNew':'#yunaNew').click();assert.equal(await bubbles.count(),0);assert.equal(await page.locator('#yunaInput').inputValue(),'');assert.equal(await page.locator('.yuna-chips .is-active').count(),0);
   if(flow.chip)await page.locator(`[data-yuna-kind="${flow.chip}"]`).click();
   const before=await page.evaluate(collection=>({count:state[collection].length,bytes:localStorage.getItem('hani_os_life_v23'),applies:window.__applies,commits:window.__commits,saves:window.__saves}),flow.collection);
   await send(flow.text);if(flow.answer){assert.match(await lastReply.innerText(),/シ|시청일/);assert.equal(await page.locator('#yunaSave').count(),0);await send(flow.answer)}
   await page.locator('#yunaSave').waitFor();assert.match(await page.locator('.yuna-preview').innerText(),new RegExp(flow.value));
   if(flow.chip==='movie')assert.match(await page.locator('.yuna-preview').innerText(),/5점/);if(flow.chip==='travelWish')assert.match(await page.locator('.yuna-preview').innerText(),/성수동/);
   const preSave=await page.evaluate(collection=>({count:state[collection].length,bytes:localStorage.getItem('hani_os_life_v23'),calls:window.__aiCalls}),flow.collection);assert.equal(preSave.count,before.count);assert.equal(preSave.bytes,before.bytes);assert.equal(preSave.calls,0,'every text flow is offline');
   const count=await bubbles.count();await page.locator('#yunaSave').click();await page.waitForFunction(()=>document.querySelector('.yuna-message:last-of-type')?.innerText.includes('저장했어요'));
   assert.equal(await bubbles.count(),count+1,'success appends to existing thread');assert.match(await lastReply.innerText(),/저장했어요/);assert.equal(await page.locator('.yuna-preview').count(),0);
   const saved=await page.evaluate(collection=>({count:state[collection].length,record:state[collection].at(-1),persisted:JSON.parse(localStorage.getItem('hani_os_life_v23'))[collection].at(-1),applies:window.__applies,commits:window.__commits,saves:window.__saves}),flow.collection);
   assert.equal(saved.count,before.count+1);assert.equal(saved.record[flow.field],flow.value);assert.equal(saved.persisted[flow.field],flow.value);assert.equal(saved.applies,before.applies+1);assert.equal(saved.commits,before.commits+1);assert.equal(saved.saves,before.saves+1);
   if(flow.text.startsWith('김대식'))assert.equal(saved.record.author,'김대식');if(flow.text.startsWith('사피엔스')){assert.equal(saved.record.status,'wish');assert.match(saved.record.review,/읽기 시작일: 20\d{2}-\d{2}-\d{2}/)}if(flow.chip==='movie')assert.equal(saved.record.rating,5);
   await page.waitForFunction(()=>{const box=document.querySelector('#yunaConversation');return box.scrollHeight-box.scrollTop-box.clientHeight<3});
   await page.screenshot({path:path.join(out,`${width}-${mode}-${flow.chip||'free'}-${flow.text.startsWith('사피엔스')?'reading':'saved'}.png`)});
   results.push({width,mode,flow:flow.text,result:'PASS',record:saved.record[flow.field],normalSavePath:true});
  }
  // A success can be followed by another request in the same thread.
  await send('내일 대화 이어가기');assert.ok(await page.locator('#yunaSave').count());assert.match(await page.locator('#yunaConversation').innerText(),/저장했어요/);
  await page.locator(width===390?'#yunaMobileNew':'#yunaNew').click();const emptyCount=await bubbles.count();await page.locator('#yunaSend').click();assert.equal(await bubbles.count(),emptyCount);assert.match(await page.locator('#yunaInput').getAttribute('placeholder'),/입력/);assert.ok(await page.locator('#yunaInput').evaluate(el=>el.classList.contains('is-empty')));
  // Shift+Enter never sends. Korean composition Enter (including 229) only commits.
  await page.locator('#yunaInput').fill('내일 조합');await page.locator('#yunaInput').press('Shift+Enter');assert.equal(await bubbles.count(),0);
  await page.locator('#yunaInput').evaluate(el=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,isComposing:false,bubbles:true})));assert.equal(await bubbles.count(),0,'229 is ignored even when isComposing is false');
  await page.locator('#yunaInput').evaluate(el=>{el.value='내일 치과 예';el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:'예'}));el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,isComposing:true,bubbles:true}));});assert.equal(await bubbles.count(),0);
  // A button click during composition blurs/commits first, then reads final input.
  await page.locator('#yunaSend').click();assert.equal(await bubbles.count(),0);
  await page.locator('#yunaInput').evaluate(el=>{el.value='내일 치과 예약';el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'약'}));el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertCompositionText',data:'약'}));el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true}));});
  await page.waitForFunction(()=>!document.querySelector('#yunaSend').disabled&&document.querySelector('.yuna-preview'));
  assert.equal(await page.locator('.yuna-message.user').count(),1);assert.equal(await page.locator('.yuna-message.user').innerText(),'내일 치과 예약');assert.match(await page.locator('.yuna-preview').innerText(),/예약/);
  // Changing a chip with an unanswered date starts the selected kind.
  await page.locator(width===390?'#yunaMobileNew':'#yunaNew').click();await page.locator('[data-yuna-kind="movie"]').click();await send('미확인 영화 봤어');assert.equal(await page.locator('#yunaSave').count(),0);await page.locator('[data-yuna-kind="travelWish"]').click();await send('성수동 카페 어니언 다녀왔어');assert.match(await page.locator('.yuna-preview').innerText(),/장소/);assert.match(await page.locator('.yuna-preview').innerText(),/어니언/);
  // Hung/failed AI and session calls use the real attachment path, retaining image/retry.
  await page.locator(width===390?'#yunaMobileNew':'#yunaNew').click();
  const png=Buffer.from(await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;canvas.getContext('2d').fillRect(0,0,16,16);return canvas.toDataURL('image/png').split(',')[1]}),'base64');
  await page.locator('#yunaFile').setInputFiles({name:'audit.png',mimeType:'image/png',buffer:png});await send('사진 확인');assert.equal(await page.locator('.is-error').count(),1);assert.ok(await page.locator('[data-yuna-retry]').isVisible());assert.equal(await page.locator('.yuna-file-pill').count(),1);
  // Restore a valid session fixture but make the actual edge POST reject like a network failure.
  await page.evaluate(()=>{window.__cloudOriginal={client:cloudClient,user:cloudUser,config:cloudConfig,fetch:window.fetch};cloudUser={id:'audit-user'};cloudClient={auth:{getSession:async()=>({data:{session:{access_token:'audit-only-session'}},error:null})}};cloudConfig=()=>({url:'https://audit.invalid',key:'audit-public'});window.fetch=async()=>{throw TypeError('test network unavailable')}});
  await page.locator('[data-yuna-retry]').click();await page.waitForFunction(()=>!document.querySelector('#yunaSend').disabled&&document.querySelector('[data-yuna-retry]'));assert.equal(await page.locator('.yuna-message.user').count(),1);
  if(width===390&&mode==='button'){
   await page.evaluate(()=>{cloudClient.auth.getSession=()=>new Promise(resolve=>{window.__resolveSession=resolve})});const started=Date.now();await page.locator('[data-yuna-retry]').click();
   await page.locator('.is-typing').waitFor();assert.ok(await page.locator('.is-typing').isVisible());await page.waitForFunction(()=>!document.querySelector('#yunaSend').disabled&&document.querySelector('[data-yuna-retry]'),{},{timeout:18000});assert.ok(Date.now()-started>=14500&&Date.now()-started<18000,'hung session has a 15s bound');
   await page.evaluate(()=>{cloudClient.auth.getSession=async()=>({data:{session:{access_token:'audit-only-session'}},error:null})});
  }
  for(const status of [401,502]){
   await page.evaluate(status=>{window.fetch=async()=>new Response(JSON.stringify({ok:false,message:'테스트 요청 실패'}),{status,headers:{'Content-Type':'application/json'}})},status);await page.locator('[data-yuna-retry]').click();await page.waitForFunction(()=>!document.querySelector('#yunaSend').disabled&&document.querySelector('[data-yuna-retry]'));assert.equal(await page.locator('.yuna-message.user').count(),1);
  }
  await page.evaluate(()=>{window.__edgeRequests=0;window.fetch=async(url,options)=>{window.__edgeRequests++;const payload=JSON.parse(options.body);if(payload.action!=='extract_intake_image')throw Error('unexpected AI action');return new Response(JSON.stringify({ok:true,extraction:{confidence:.99,target_hint:'movie',structured_json:JSON.stringify([{target:'movie',data:{title:'사진 재시도 영화',watchedDate:'2026-10-11',rating:5}}])}}),{status:200,headers:{'Content-Type':'application/json'}})}});
  await page.locator('[data-yuna-retry]').click();await page.locator('#yunaSave').waitFor();assert.match(await page.locator('.yuna-preview').innerText(),/사진 재시도 영화/);assert.equal(await page.locator('.yuna-message.user').count(),1);assert.equal(await page.evaluate(()=>window.__edgeRequests),1);
  await page.locator('#yunaSave').click();assert.match(await lastReply.innerText(),/저장했어요/);
  await page.evaluate(()=>{cloudClient=window.__cloudOriginal.client;cloudUser=window.__cloudOriginal.user;cloudConfig=window.__cloudOriginal.config;window.fetch=window.__cloudOriginal.fetch});
  // Save failure is visible; retry executes only the normal save path.
  await page.locator(width===390?'#yunaMobileNew':'#yunaNew').click();await send('내일 저장 재시도');
  const beforeFailure=await page.evaluate(()=>({count:state.tasks.length,bytes:localStorage.getItem('hani_os_life_v23')}));await page.evaluate(()=>{window.__saveOriginal=commit;commit=()=>false});await page.locator('#yunaSave').click();assert.ok(await page.locator('[data-yuna-retry]').isVisible());assert.match(await lastReply.innerText(),/저장을 마치지/);assert.deepEqual(await page.evaluate(()=>({count:state.tasks.length,bytes:localStorage.getItem('hani_os_life_v23')})),beforeFailure);
  await page.evaluate(()=>{commit=window.__saveOriginal});await page.locator('[data-yuna-retry]').click();assert.match(await lastReply.innerText(),/저장했어요/);
  // The visualViewport callback runs even with the virtual keyboard open.
  if(width===390){await page.locator('#yunaInput').focus();await page.evaluate(()=>{window.__viewportHeight=innerHeight-300;window.__testViewport.dispatchEvent(new Event('resize'))});
   await page.waitForFunction(()=>document.querySelector('#intake').style.getPropertyValue('--yuna-keyboard')==='300px');
   await send('내일 키보드 열린 대화');await page.locator('#yunaSave').click();assert.match(await lastReply.innerText(),/저장했어요/);
   await page.waitForFunction(()=>{const box=document.querySelector('#yunaConversation');return box.scrollHeight-box.scrollTop-box.clientHeight<3});
   const rects=await page.evaluate(()=>{const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom}};return {conversation:rect('#yunaConversation'),composer:rect('.yuna-composer'),reply:rect('.yuna-message:last-of-type'),viewport:visualViewport.height}});
   assert.ok(rects.conversation.bottom<=rects.composer.top+1,JSON.stringify(rects));assert.ok(rects.reply.bottom<=rects.composer.top+1);assert.ok(rects.composer.bottom<=rects.viewport+1);await page.screenshot({path:path.join(out,`${width}-${mode}-keyboard.png`)});
   await page.evaluate(()=>{window.__viewportHeight=undefined;window.__testViewport.dispatchEvent(new Event('resize'))});
  }
  const duplicates=await page.evaluate(()=>{const counts={};document.querySelectorAll('[id]').forEach(el=>counts[el.id]=(counts[el.id]||0)+1);return Object.entries(counts).filter(([,n])=>n>1)});assert.deepEqual(duplicates,[]);
  results.push({width,mode,extra:'continuous thread / empty / Shift+Enter / Korean IME / login+network failure / retry / save rollback',result:'PASS'});
  // Session draft restores without a permanently busy status or silent send.
  await page.locator(width===390?'#yunaMobileNew':'#yunaNew').click();await send('내일 초안 복원');await page.reload({waitUntil:'load'});await page.evaluate(()=>{unlockLoginGate();showView('intake')});await page.locator('#yunaResume').waitFor();assert.equal(await page.locator('#yunaSend').isDisabled(),true);await page.locator('#yunaResume').click();await page.locator('#yunaSave').waitFor();assert.equal(await page.locator('#yunaSend').isDisabled(),false);await page.locator('#yunaSave').click();assert.match(await page.locator('.yuna-message.yuna').last().innerText(),/저장했어요/);
  await context.close();
 }
 assert.deepEqual(errors,[],'page errors');assert.deepEqual(consoleErrors,[],'console errors');
  fs.writeFileSync(path.join(out,'edge-results.json'),JSON.stringify({status:'PASS',results,errors,consoleErrors,runtime,externalBlocked:external.length,browser:await browser.version()},null,2));console.log(`PASS: ${results.length} Edge flow groups at 390x844 and 1440x844; button + Enter; console/page errors 0`);
}catch(error){const lastScreen=activePage&&!activePage.isClosed()?await activePage.locator('#intake').innerText().catch(()=>null):null;fs.writeFileSync(path.join(out,'edge-results.json'),JSON.stringify({status:'FAIL',results,errors,consoleErrors,error:String(error),lastScreen},null,2));throw error}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
