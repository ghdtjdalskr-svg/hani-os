// node scripts/hani-fun-chat-fortune.test.mjs
// Optional real app evidence: append <playwright/index.mjs> <browser.exe>.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {test} from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ui=read('hani-ui-v02992.js'),source=ui.slice(ui.indexOf('// BEGIN HANI FUN CHAT FORTUNE'));
const fun=source.slice(0,source.indexOf('// BEGIN HANI HELPER BOT'));
const css=read('hani-style-08.css');
const rosterContext={window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]}};
vm.runInNewContext(read('hani-organization-hub.js'),rosterContext);
const staff=rosterContext.window.HaniOrganizationRoster.people;
const tapBank=JSON.parse(read('assets/data/office-tap-lines-v1.json'));
const releases=JSON.parse(read('assets/data/hani-history-releases-v1.json'));
// Reuse the existing helper event fixture, with className reflection and a captured clock.
// Its storage proxy throws on any access and its fetch spy records every request.
const helperTest=read('scripts/hani-helper-bot.test.mjs');
const fixtureText=helperTest.slice(helperTest.indexOf('function fixture('),helperTest.indexOf("\ntest('KST midnight"))
  .replace('set id(v)',"set className(v){this.attributes.class=v;}get className(){return this.attributes.class||'';}\n    set id(v)")
  .replace('const window={innerWidth:',"const window={setInterval:(fn,ms)=>events('clock',String(ms),fn),innerWidth:");
const fixture=vm.runInNewContext(fixtureText+';fixture',{assert,vm,staff,tapBank,releases,source});
const plain=x=>JSON.parse(JSON.stringify(x));
const start=Date.parse('2026-11-07T00:00:00+09:00'),DAY=86400000;

test('real pools: 30 complete conversations, 60 unique positive cards, public voices only',()=>{
  const f=fixture({loading:true}),api=f.window.HaniFunPreview;
  assert.equal(api.CHAT_POOL.length,30);assert.equal(api.FORTUNE_POOL.length,60);
  assert.equal(new Set(api.CHAT_POOL.map(c=>JSON.stringify(c.lines))).size,30);
  assert.equal(new Set(api.FORTUNE_POOL.map(c=>c.line)).size,60);
  const allowed=new Set([...staff.map(p=>p.id),'pet-cat','pet-dog','pet-rabbit','pet-bori']);
  for(const conversation of api.CHAT_POOL){
    assert.ok(conversation.lines.length+2>=6&&conversation.lines.length+2<=12);
    for(const [id,text] of conversation.lines){assert.ok(allowed.has(id),id);assert.ok(text.length>3&&text.length<80);}
  }
  for(const p of [...staff,{id:'pet-cat'},{id:'pet-dog'},{id:'pet-rabbit'},{id:'pet-bori'}])assert.ok(api.TIPS[p.id],p.id+' duty voice');
  // Include all displayed fixed copy, greetings, endings, fortune tips and office item labels.
  const literalText=[...fun.matchAll(/(['"])((?:(?!\1)[^\\\n]|\\.)*?)\1/g)].map(m=>m[2]).join('\n');
  assert.doesNotMatch(literalText,/돈|금액|투자|주식|주가|수익|손실|재테크|로또|복권|재물|건강|질병|치료|의료|혈압|체중|다이어트|운동|성민|대표님|오빠|자기야|개구리|회장(?!님)|\d[\d,]*\s*원/);
  assert.match(literalText,/회장님/);assert.match(literalText,/이슬/);assert.match(literalText,/은하/);
  assert.doesNotMatch(fun,/localStorage|sessionStorage|\.setItem\(|\.removeItem\(|\.clear\(|\bfetch\s*\(|supabase|agentApi|\bcommit\s*\(|\bsave\s*\(|Math\.random/);
});

test('KST midnight, same day stable, all sliding 14-day windows unique across cycle seams',()=>{
  const api=fixture({loading:true}).window.HaniFunPreview;
  for(let i=-65;i<365*3;i++){
    const day=start+i*DAY,chat=api.dailyChat(day),card=api.fortune(day,staff[0]);
    assert.equal(chat.id,api.dailyChat(day+DAY-1).id);
    assert.deepEqual(plain(card),plain(api.fortune(day+DAY-1,staff[0])));
    assert.notEqual(chat.id,api.dailyChat(day-1).id);
    assert.notEqual(card.id,api.fortune(day-1,staff[0]).id);
    assert.equal(new Set(Array.from({length:14},(_,j)=>api.dailyChat(day+j*DAY).id)).size,14);
    assert.equal(new Set(Array.from({length:14},(_,j)=>api.fortune(day+j*DAY).id)).size,14);
  }
  assert.equal(api.dailyChat(start-1).date,'2026-11-06');assert.equal(api.dailyChat(start).date,'2026-11-07');
  assert.equal(new Set(Array.from({length:30},(_,i)=>api.dailyChat(start+i*DAY).id)).size,30);
  assert.equal(new Set(Array.from({length:60},(_,i)=>api.fortune(start+i*DAY).id)).size,60);
});

test('only elapsed messages at every timestamp edge; no future message text exposed in the DOM',async()=>{
  const f=fixture({now:start}),api=f.window.HaniFunPreview;await f.ready();
  const end=api.dailyChat(start+DAY-1);assert.equal(end.messages.length,8);assert.equal(end.next,null);
  assert.equal(api.dailyChat(start).messages.length,0);
  for(const [i,message] of end.messages.entries()){
    const boundary=start+message.minute*60000;
    assert.equal(api.dailyChat(boundary-1).messages.length,i);
    assert.equal(api.dailyChat(boundary).messages.length,i+1);
    assert.equal(api.dailyChat(boundary).messages.at(-1).text,message.text);
  }
  const rootEl=f.document.getElementById('haniHelperBot'),face=rootEl.querySelector('.hani-helper-face');
  f.fire('click',face);f.fire('click',rootEl.querySelector('[data-helper-fun="chat"]'));
  const rows=rootEl.querySelectorAll('.hani-fun-message');assert.equal(rows.length,8);assert.ok(rows.every(r=>r.hidden));
  assert.equal(rootEl.querySelector('.hani-fun-typing').textContent,'지금 입력 중…');
  f.setNow(start+12*3600000);api.refresh();
  const expected=api.dailyChat(start+12*3600000).messages;
  assert.equal(rows.filter(r=>!r.hidden).length,expected.length);
  assert.deepEqual(plain(rows.filter(r=>!r.hidden).map(r=>r.querySelector('p').textContent)),plain(expected.map(m=>m.text)));
  for(const row of rows.filter(r=>r.hidden))assert.equal(row.querySelector('p').textContent,'');
  assert.equal(rootEl.querySelectorAll('input,textarea').length,0);
});

test('persistent root/slot/message nodes, one click owner, back/X/Escape/outside and timer midnight refresh',async()=>{
  const f=fixture({now:start+12*3600000});await f.ready();
  const api=f.window.HaniFunPreview,r=f.document.getElementById('haniHelperBot'),panel=r.querySelector('.hani-helper-speech'),face=r.querySelector('.hani-helper-face');
  const content=r.querySelector('#haniFunPreview'),rows=r.querySelectorAll('.hani-fun-message');
  f.rerun();f.api.init();api.mount(r,panel);
  assert.equal(f.document.body.querySelectorAll('#haniHelperBot').length,1);
  assert.equal(r.querySelectorAll('#haniFunPreview').length,1);
  assert.equal(f.callbacks.get('document:click').length,1);
  assert.equal(f.callbacks.get('clock:15000').length,1);
  for(let i=0;i<3;i++){
    f.fire('click',face);const entry=r.querySelector('[data-helper-fun="chat"]');f.fire('click',entry);
    assert.equal(content.hidden,false);assert.equal(f.document.activeElement,content.querySelector('[data-fun-back]'));
    f.fire('click',content.querySelector('[data-fun-back]'));assert.equal(content.hidden,true);assert.equal(f.document.activeElement,entry);
    f.fire('click',r.querySelector('[data-helper-fun="fortune"]'));
    const duty=f.api.duty(staff,start+12*3600000),draw=api.fortune(start+12*3600000,duty);
    assert.equal(r.querySelector('.hani-fun-line').textContent,draw.line);
    assert.equal(r.querySelector('.hani-fun-tip').textContent,draw.drawer+' · '+draw.tip);
    if(i===0)f.fire('keydown',face,{key:'Escape'});
    if(i===1)f.fire('click',r.querySelector('[data-helper-close]'));
    if(i===2)f.fire('click',f.document.body);
    assert.equal(panel.hidden,true);assert.equal(content.hidden,true);
  }
  f.fire('click',face);f.fire('click',r.querySelector('[data-helper-fun="chat"]'));
  f.setNow(start+DAY);for(const tick of f.callbacks.get('clock:15000'))tick();f.flush();
  assert.match(r.querySelector('.hani-fun-meta').textContent,/2026-11-08/);
  assert.ok(rows.every(row=>row.hidden));
  assert.equal(r.querySelector('#haniFunPreview'),content);assert.deepEqual(r.querySelectorAll('.hani-fun-message'),rows);
  assert.deepEqual(plain(f.storageCalls),[['getItem','hani_helper_pos_v1']]);assert.equal(f.requests.length,2,'existing helper static GETs only');
  assert.ok(f.requests.every(r=>!r.opts.method||r.opts.method==='GET'));
  assert.match(css,/@keyframes hani-fun-flip/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{#haniHelperBot \.hani-fun-card\{animation:none;transform:none;opacity:1\}\}/);
});

test('same duty as helper for every employee/pet; runtime files stay exactly 159 (158 + 은하 barista-night.webp from 2.9.273)',async()=>{
  const f=fixture({loading:true}),api=f.window.HaniFunPreview,ids=new Set();
  for(let i=0;i<23;i++){
    const at=start+i*DAY,duty=f.api.duty(staff,at),card=api.fortune(at,duty);ids.add(duty.id);
    assert.equal(card.drawer,duty.name);assert.equal(card.tip,api.TIPS[duty.id]);
  }
  assert.equal(ids.size,23);
  const closure=await resolveRuntimeClosure({read:f=>fs.readFileSync(path.join(root,f)),exists:f=>fs.existsSync(path.join(root,f))});
  assert.deepEqual(closure.missing,[]);assert.equal(closure.files.length,159);
  assert.deepEqual(closure.files,JSON.parse(read('artifacts/helper-drag/baseline-runtime-files.json')));
  new vm.Script(ui);assert.match(ui,/window\.HaniFunPreview\?\.mount\(root, panel\)/);
});

test('real browser 390x844 / 1280x900 screenshots, live rollover, read-only and reduced motion',{skip:!process.argv[2]},async()=>{
  const {chromium}=await import(pathToFileURL(process.argv[2]));
  const evidence=path.join(root,'artifacts/fun-chat-fortune');fs.mkdirSync(evidence,{recursive:true});
  const server=http.createServer((req,res)=>{
    const relative=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,'')||'index.html';
    const file=path.resolve(root,relative);if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({executablePath:process.argv[3],headless:true});const origin='http://127.0.0.1:'+server.address().port;
    const results=[];
    for(const [width,height] of [[390,844],[1280,900]]){
      const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Seoul'});
      await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
      const page=await context.newPage();await page.clock.install({time:new Date('2026-11-07T15:30:00+09:00')});await page.goto(origin);
      await page.waitForFunction(()=>!!window.HaniHelperBot&&!!window.HaniFunPreview);
      await page.evaluate(()=>{unlockLoginGate();showView('home');});
      await page.waitForFunction(()=>!document.getElementById('haniLaunchGreeting'));
      await page.locator('.hani-helper-face').click();
      await page.evaluate(()=>{
        window.__funWrites=[];window.__funRequests=[];
        for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){window.__funWrites.push(method);throw Error('Unexpected storage write');};
        const original=window.fetch;window.fetch=(...args)=>{window.__funRequests.push(String(args[0]));return original(...args);};
      });
      await page.screenshot({path:path.join(evidence,`${width}-entries.png`)});
      const content=page.locator('#haniFunPreview');
      for(const mode of ['chat','fortune']){
        await page.locator(`[data-helper-fun="${mode}"]`).click();await content.waitFor({state:'visible'});
        await page.locator('#haniHelperSpeech').evaluate(el=>el.scrollTop=0);
        if(mode==='fortune')await page.locator('.hani-fun-card').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
        const geometry=await page.locator('#haniHelperSpeech').evaluate(el=>({box:el.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth-innerWidth}));
        assert.ok(geometry.box.top>=0&&geometry.box.bottom<=height+1);assert.ok(geometry.overflow<=1);
        assert.equal(await content.locator('input,textarea').count(),0);
        if(mode==='chat')assert.equal(await content.locator('.hani-fun-message:visible').count(),6);
        await page.screenshot({path:path.join(evidence,`${width}-${mode}.png`)});
        await page.locator('[data-fun-back]').click();results.push({width,height,mode,geometry});
      }
      await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-helper-fun="fortune"]').click();
      assert.equal(await page.locator('.hani-fun-card').evaluate(e=>getComputedStyle(e).animationName),'none');
      await page.clock.fastForward(9*3600000);assert.match(await page.locator('.hani-fun-meta').innerText(),/2026-11-08/);
      assert.equal(await page.locator('#haniFunPreview').count(),1);
      assert.deepEqual(await page.evaluate(()=>window.__funWrites),[]);
      assert.deepEqual(await page.evaluate(()=>window.__funRequests),[]);
      await page.keyboard.press('Escape');assert.equal(await page.locator('#haniHelperSpeech').isVisible(),false);await context.close();
    }
    fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify(results,null,2));
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
