import './hani-ui-polish-1-preload.cjs'; // Exact UI Polish 1 inverse before historical readers.
// node scripts/hani-fun-chat-fortune.test.mjs
import './hani-release-297-preload.cjs';
// Optional real app evidence: append <playwright/index.mjs> <browser.exe>.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {test} from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolveRuntimeClosure} from './hani-office-companions-276-closure.mjs';
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
// Its storage fixture records every access and its fetch spy records every request.
const helperTest=read('scripts/hani-helper-bot.test.mjs');
const fixtureStart=helperTest.indexOf('function fixture(');
const fixtureEnd=helperTest.indexOf('// END HANI HELPER TEST FIXTURE',fixtureStart);
assert.ok(fixtureStart>=0&&fixtureEnd>fixtureStart,'exact helper fixture boundaries');
const fixtureText=helperTest.slice(fixtureStart,fixtureEnd)
  .replace('set id(v)',"set className(v){this.attributes.class=v;}get className(){return this.attributes.class||'';}\n    set id(v)")
  .replace('const window={innerWidth:',"const window={setInterval:(fn,ms)=>events('clock',String(ms),fn),innerWidth:");
const fixture=vm.runInNewContext(fixtureText+';fixture',{assert,vm,staff,tapBank,releases,source});
const plain=x=>JSON.parse(JSON.stringify(x));
const start=Date.parse('2026-11-07T00:00:00+09:00'),DAY=86400000;

const stickerKeys=new Set(['heart','laugh','cry','thumbs','clap','sleepy','coffee','surprised']);
const stickerEmojis=new Set(['💖','🤣','😭','👍','👏','😴','☕','😲']);
const nameOf=id=>staff.find(p=>p.id===id)?.name||({'pet-cat':'치즈','pet-dog':'크림','pet-rabbit':'모찌','pet-bori':'보리'})[id];

test('real pools: 30 complete conversations, 60 unique positive cards, public voices only',()=>{
  const f=fixture({loading:true}),api=f.window.HaniFunPreview;
  assert.equal(api.CHAT_POOL.length,30);assert.equal(api.FORTUNE_POOL.length,60);
  assert.equal(new Set(api.CHAT_POOL.map(c=>c.key)).size,30);
  assert.equal(new Set(api.CHAT_POOL.map(c=>JSON.stringify(c.lines))).size,30);
  assert.equal(new Set(api.FORTUNE_POOL.map(c=>c.line)).size,60);
  assert.equal(Math.max(...api.CHAT_POOL.map(c=>c.lines.length)),20);
  const allowed=new Set([...staff.map(p=>p.id),'pet-cat','pet-dog','pet-rabbit','pet-bori']);
  for(const conversation of api.CHAT_POOL){
    assert.ok(conversation.lines.length>=15&&conversation.lines.length<=20,conversation.key);
    for(const [id,body,gap] of conversation.lines){
      assert.ok(allowed.has(id),id);
      assert.ok(Number.isInteger(gap)&&gap>=0,conversation.key+':'+gap);
      if(typeof body==='string')assert.ok(body.length>=1&&body.length<=40,body);
      else assert.ok(body&&typeof body==='object'&&stickerKeys.has(body.sticker),JSON.stringify(body));
    }
  }
  for(const p of [...staff,{id:'pet-cat'},{id:'pet-dog'},{id:'pet-rabbit'},{id:'pet-bori'}])assert.ok(api.TIPS[p.id],p.id+' duty voice');
  // Include all displayed fixed copy, greetings, endings, fortune tips and office item labels.
  const literalText=[...fun.matchAll(/(['"])((?:(?!\1)[^\\\n]|\\.)*?)\1/g)].map(m=>m[2]).join('\n');
  assert.doesNotMatch(literalText,/돈|금액|투자|주식|주가|수익|손실|재테크|로또|복권|재물|건강|질병|치료|의료|혈압|체중|다이어트|운동|성민|대표님|오빠|자기야|개구리|회장(?!님)|\d[\d,]*\s*원/);
  assert.match(literalText,/회장님/);
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
  assert.equal(api.dailyChat(start-1).weekday,'금');assert.equal(api.dailyChat(start).weekday,'토');assert.equal(api.dailyChat(start+DAY).weekday,'일');
  assert.equal(new Set(Array.from({length:30},(_,i)=>api.dailyChat(start+i*DAY).id)).size,30);
  assert.equal(new Set(Array.from({length:60},(_,i)=>api.fortune(start+i*DAY).id)).size,60);
});

test('only elapsed messages at every timestamp edge; v2 grouping, stickers, slots, typing and no future text in DOM',async()=>{
  const f=fixture({now:start}),api=f.window.HaniFunPreview;await f.ready();
  const SLOTS=Math.max(...api.CHAT_POOL.map(c=>c.lines.length));
  assert.equal(SLOTS,20);
  // Check start-minute formula, message fields, stickers, photo, react and cont/last across all 30 conversations.
  for(let d=0;d<30;d++){
    const dayAt=start+d*DAY,dayEnd=api.dailyChat(dayAt+DAY-1);
    const raw=api.CHAT_POOL.find(c=>c.id===dayEnd.id);
    assert.ok(raw,dayEnd.id);
    assert.equal(dayEnd.messages.length,raw.lines.length);
    assert.equal(dayEnd.next,null);
    const totalGap=raw.lines.reduce((s,l)=>s+l[2],0);
    const expectedStart=Math.min(720,Math.max(570,1120-totalGap));
    assert.equal(dayEnd.messages[0].minute,expectedStart+raw.lines[0][2]);
    let minute=expectedStart;
    dayEnd.messages.forEach((m,i)=>{
      const [speaker,body,gap]=raw.lines[i];
      minute+=gap;
      assert.equal(m.speaker,speaker);assert.equal(m.minute,minute);
      assert.equal(m.time,String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'));
      assert.equal(m.photo,body==='(사진)');
      if(typeof body==='object'){
        assert.equal(m.sticker,body.sticker);
        assert.ok(stickerEmojis.has(m.text),m.text);
        assert.equal(m.react,0);
      }else{
        assert.equal(m.sticker,'');
        assert.equal(m.text,body);
        assert.ok(Number.isInteger(m.react)&&m.react>=0&&m.react<=3);
      }
      const prev=dayEnd.messages[i-1],next=dayEnd.messages[i+1];
      assert.equal(m.cont,Boolean(prev&&prev.speaker===m.speaker&&m.minute-prev.minute<=3));
      assert.equal(m.last,!next||next.speaker!==m.speaker||next.minute-m.minute>3);
      assert.equal(m.unread,0);
    });
  }
  const end=api.dailyChat(start+DAY-1),raw=api.CHAT_POOL.find(c=>c.id===end.id);
  assert.equal(api.dailyChat(start).messages.length,0);
  assert.equal(api.dailyChat(start).next.text,end.messages[0].text);
  for(const [i,message] of end.messages.entries()){
    const boundary=start+message.minute*60000;
    const beforeCount=end.messages.filter(m=>m.minute<message.minute).length;
    const atCount=end.messages.filter(m=>m.minute<=message.minute).length;
    assert.equal(api.dailyChat(boundary-1).messages.length,beforeCount);
    assert.equal(api.dailyChat(boundary).messages.length,atCount);
    assert.equal(api.dailyChat(boundary).messages.at(-1).text,end.messages[atCount-1].text);
    if(raw.lines[i][2]>0&&(!raw.lines[i+1]||raw.lines[i+1][2]>0))assert.equal(api.dailyChat(boundary).messages.length,i+1);
  }
  // Unread count decays from 4 by 1 every 3 minutes.
  const m0At=start+end.messages[0].minute*60000;
  assert.equal(api.dailyChat(m0At).messages[0].unread,4);
  assert.equal(api.dailyChat(m0At+3*60000).messages[0].unread,3);
  assert.equal(api.dailyChat(m0At+12*60000).messages[0].unread,0);

  const rootEl=f.document.getElementById('haniHelperBot'),face=rootEl.querySelector('.hani-helper-face'),content=rootEl.querySelector('#haniFunPreview');
  f.fire('click',face);f.fire('click',rootEl.querySelector('[data-helper-fun="chat"]'));
  const rows=rootEl.querySelectorAll('.hani-fun-message');
  assert.equal(rows.length,SLOTS);assert.ok(rows.every(r=>r.hidden));
  for(const row of rows){
    assert.deepEqual(row.children.map(c=>c.tagName),['SPAN','B','P','SPAN']);
    assert.equal(row.children[0].className,'hani-fun-face');
    assert.equal(row.children[3].className,'hani-fun-stamp');
    assert.deepEqual(row.children[3].children.map(c=>c.tagName),['EM','TIME']);
    assert.equal(row.querySelector('b').textContent,'');
    assert.equal(row.querySelector('p').textContent,'');
    assert.equal(row.querySelector('em').textContent,'');
    assert.equal(row.querySelector('time').textContent,'');
  }
  assert.equal(content.querySelector('h3').textContent,'HANI 오피스 수다방 🌸');
  assert.equal(content.querySelector('.hani-fun-meta').textContent,'2026-11-07 토요일 · 엿보기 전용 👀');
  assert.equal(content.querySelector('.hani-fun-topic').textContent,end.title);
  assert.equal(content.querySelector('.hani-fun-topic').hidden,false);
  const typing=rootEl.querySelector('.hani-fun-typing');
  assert.equal(typing.dataset.state,'quiet');
  assert.equal(typing.textContent,'잠깐 조용해요… 곧 또 수다가 올라와요');

  // Typing indicator activates within 3 minutes before the first message and before a mid-day gap.
  f.setNow(start+(end.messages[0].minute-2)*60000);api.refresh();
  assert.equal(typing.dataset.state,'typing');
  assert.equal(typing.textContent,nameOf(end.messages[0].speaker)+' 님이 입력 중…');

  // Mid-burst and full-day DOM checks: grouping, stamps, unread, stickers, photos, reactions, faces, hidden slots.
  const nonLast=end.messages.find(m=>!m.last);
  assert.ok(nonLast,'expected grouped burst message');
  const checkDomAt=at=>{
    f.setNow(at);api.refresh();
    const expected=api.dailyChat(at).messages;
    assert.equal(rows.filter(r=>!r.hidden).length,expected.length);
    expected.forEach((m,i)=>{
      const row=rows[i],p=row.querySelector('p');
      assert.equal(row.dataset.cont,String(m.cont));
      assert.equal(row.dataset.last,String(m.last));
      assert.equal(row.dataset.kind,m.sticker?'sticker':m.photo?'photo':'text');
      assert.equal(row.querySelector('.hani-fun-face').style.backgroundImage,'url("assets/profiles/thumb/hani-profile-'+m.speaker+'-128.webp")');
      assert.equal(row.querySelector('b').textContent,nameOf(m.speaker));
      assert.equal(p.textContent,m.text);
      if(m.sticker)assert.ok(stickerEmojis.has(p.textContent),p.textContent);
      assert.equal(p.dataset.react,m.react?'❤️ '+m.react:undefined);
      assert.equal(row.querySelector('em').textContent,m.last&&m.unread?String(m.unread):'');
      assert.equal(row.querySelector('time').textContent,m.last?m.time:'');
    });
    for(const row of rows.filter(r=>r.hidden)){
      assert.equal(row.querySelector('b').textContent,'');
      assert.equal(row.querySelector('p').textContent,'');
      assert.equal(row.querySelector('em').textContent,'');
      assert.equal(row.querySelector('time').textContent,'');
    }
  };
  checkDomAt(start+12*3600000);
  checkDomAt(start+(nonLast.minute+1)*60000);
  const soonMsg=end.messages.find((m,i)=>i>0&&m.minute-end.messages[i-1].minute>3);
  if(soonMsg){
    f.setNow(start+(soonMsg.minute-2)*60000);api.refresh();
    assert.equal(typing.dataset.state,'typing');
    assert.equal(typing.textContent,nameOf(soonMsg.speaker)+' 님이 입력 중…');
  }
  checkDomAt(start+DAY-1);
  assert.equal(typing.dataset.state,'done');
  assert.equal(typing.textContent,'오늘의 수다는 여기까지. 내일 또 만나요!');
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
    assert.equal(content.querySelector('h3').textContent,'HANI 오피스 수다방 🌸');
    assert.equal(r.querySelector('.hani-fun-meta').textContent,'2026-11-07 토요일 · 엿보기 전용 👀');
    assert.equal(r.querySelector('.hani-fun-topic').hidden,false);
    f.fire('click',content.querySelector('[data-fun-back]'));assert.equal(content.hidden,true);assert.equal(f.document.activeElement,entry);
    f.fire('click',r.querySelector('[data-helper-fun="fortune"]'));
    assert.equal(content.querySelector('h3').textContent,'오늘의 운세 🔮');
    assert.equal(r.querySelector('.hani-fun-meta').textContent,'2026-11-07 · KST · 읽기 전용');
    assert.equal(r.querySelector('.hani-fun-topic').hidden,true);
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
  assert.equal(r.querySelector('.hani-fun-meta').textContent,'2026-11-08 일요일 · 엿보기 전용 👀');
  assert.ok(rows.every(row=>row.hidden&&!row.querySelector('b').textContent&&!row.querySelector('p').textContent&&!row.querySelector('em').textContent&&!row.querySelector('time').textContent));
  assert.equal(r.querySelector('#haniFunPreview'),content);assert.deepEqual(r.querySelectorAll('.hani-fun-message'),rows);
  assert.deepEqual(plain(f.storageCalls),[['getItem','hani_helper_pos_v1']]);assert.equal(f.requests.length,2,'existing helper static GETs only');
  assert.ok(f.requests.every(r=>!r.opts.method||r.opts.method==='GET'));
  assert.match(css,/@keyframes hani-fun-flip/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{#haniHelperBot \.hani-fun-card\{animation:none;transform:none;opacity:1\}\}/);
});

test('same duty as helper for every employee/pet; exact 159 originals plus three approved 283 dependencies',async()=>{
  const f=fixture({loading:true}),api=f.window.HaniFunPreview,ids=new Set();
  for(let i=0;i<23;i++){
    const at=start+i*DAY,duty=f.api.duty(staff,at),card=api.fortune(at,duty);ids.add(duty.id);
    assert.equal(card.drawer,duty.name);assert.equal(card.tip,api.TIPS[duty.id]);
  }
  assert.equal(ids.size,23);
  const closure=await resolveRuntimeClosure({read:f=>fs.readFileSync(path.join(root,f)),exists:f=>fs.existsSync(path.join(root,f))});
  assert.deepEqual(closure.missing,[]);
  const original=JSON.parse(read('artifacts/helper-drag/baseline-runtime-files.json'));assert.equal(original.length,159);
  const additions=['assets/procrastination/pb-chibi-sheet-v1.webp','hani-procrastination-board.css','hani-procrastination-board.js'];
  assert.equal(closure.files.length,162);assert.deepEqual(closure.files,[...original,...additions].sort());
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
        if(mode==='chat'){
          const expectedCount=await page.evaluate(()=>window.HaniFunPreview.dailyChat(Date.now()).messages.length);
          assert.ok(expectedCount>=1&&expectedCount<=20);
          assert.equal(await content.locator('.hani-fun-message').count(),20);
          assert.equal(await content.locator('.hani-fun-message:visible').count(),expectedCount);
          assert.equal(await content.locator('h3').innerText(),'HANI 오피스 수다방 🌸');
          assert.equal(await content.locator('.hani-fun-meta').innerText(),'2026-11-07 토요일 · 엿보기 전용 👀');
        }else{
          assert.equal(await content.locator('h3').innerText(),'오늘의 운세 🔮');
          assert.equal(await content.locator('.hani-fun-meta').innerText(),'2026-11-07 · KST · 읽기 전용');
        }
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
