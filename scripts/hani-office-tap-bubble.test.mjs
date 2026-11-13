// A viewer tap always opens that actor's bubble, even when the map visibility
// observer delivered a batched [offscreen, onscreen] record pair. Runtime owners
// execute unmodified; the browser part needs the bundled Playwright and Edge.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {fixture} from './hani-building-206-engine.test.mjs';
import releases from './hani-release-version-layers.cjs';
import tapBubble from './hani-office-tap-bubble-source.cjs';
// The shared office fixture reads legacy-projected bytes (pre-Ieum, pre-fix).
// Re-apply only this exact fix pair so the unit runs the fixed observer callback.
const withFix=source=>{assert.equal(source.split(tapBubble.delta.before).length-1,1,'one legacy observer line');return source.replace(tapBubble.delta.before,()=>tapBubble.delta.after)};
const readRaw=releases.readRawFileSync;

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};

async function mounted(){
  let intersection=null,next=0;const pending=new Map();
  const f=fixture('10:00',false,null,null,{
    IntersectionObserver:class{constructor(fn){intersection=fn}observe(){}},
    setTimeout(fn,ms){const id=++next;pending.set(id,{fn,ms});return id},clearTimeout(id){pending.delete(id)}
  },withFix);
  f.ids.set('app',{classList:{contains:()=>false}});
  await flush();assert.equal(typeof intersection,'function','map visibility observer is registered');
  const panel=f.root.querySelector('.hani-office-character-bubble');
  const tap=actor=>f.ids.get('haniOfficeActors').events.click({target:actor});
  const actor=()=>f.visible().find(a=>a.dataset.companion!=='true'&&!a.dataset.resident);
  return {f,panel,tap,actor,observe:records=>intersection(records.map(isIntersecting=>({isIntersecting})))};
}

test('tap bubble: the newest batched visibility record wins, so an on-screen tap opens the bubble',async()=>{
  const x=await mounted(),a=x.actor();assert.ok(a,'a staff actor is visible');
  x.observe([false,true]);await flush();
  x.tap(a);
  assert.equal(x.panel.hidden,false,'bubble opens after [offscreen, onscreen] batch');
  assert.equal(a.dataset.speaking,'true');
});

test('tap bubble: a batch ending offscreen still pauses taps (existing offscreen guard kept)',async()=>{
  const x=await mounted(),a=x.actor();
  x.observe([true,false]);await flush();
  x.tap(a);
  assert.equal(x.panel.hidden,true,'offscreen map ignores taps as before');
  x.observe([true]);await flush();x.tap(a);
  assert.equal(x.panel.hidden,false,'single onscreen record resumes taps');
});

// Real Edge: 10 fresh pages, each taps every target after a floor switch.
const runtime=process.env.HANI_PLAYWRIGHT||path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const edge=process.env.HANI_EDGE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browserReady=fs.existsSync(runtime)&&fs.existsSync(edge);
const RUNS=10,FLOORS=[['4f',['hani','ieum']],['3f',[]],['2f',[]],['5f',[]]],EXTRA=2;

test('real browser: each tapped staff bubble shows 10/10 after a floor switch',{skip:browserReady?false:'Playwright/Edge not found',timeout:900000},async()=>{
  const {chromium}=await import(pathToFileURL(runtime).href);
  const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(readRaw(file))});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:edge});
  const tally={},errors=[],writes=[];
  try{
    for(let run=0;run<RUNS;run++){
      const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Seoul'});
      await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
      await context.addInitScript(()=>{const N=Date,t=+new N('2026-11-12T11:00:00+09:00');globalThis.Date=class extends N{constructor(...a){super(...(a.length?a:[t]))}static now(){return t}};window.HaniOfficePresence={chairman:'absent'}});
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/index.html');await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&globalThis.HaniBuildingScene,null,{timeout:30000});
      await page.evaluate(()=>{unlockLoginGate();if(typeof cloudStopAutoSync==='function')cloudStopAutoSync();showView('agentReview')});
      const bubble=page.locator('.hani-office-character-bubble');
      for(const [floor,named] of FLOORS){
        await page.locator(`[data-building-floor="${floor}"]`).click();await page.waitForTimeout(1500);
        const ids=await page.evaluate(([named,extra])=>{const all=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden&&!a.dataset.resident&&a.dataset.companion!=='true'&&a.dataset.visitor!=='true').map(a=>a.dataset.person);return [...named.filter(id=>all.includes(id)),...all.filter(id=>!named.includes(id)).sort().slice(0,extra)]},[named,EXTRA]);
        assert.ok(ids.length,'visible staff on '+floor);
        // Watch protected storage only around the taps (affinity flushes are its own approved path).
        await page.evaluate(()=>{window.tapWrites=[];for(const k of ['setItem','removeItem','clear']){const p=Storage.prototype[k];if(p.tapWrapped)continue;const w=function(...a){if(String(a[0]).startsWith('hani_os_life'))tapWrites.push(k+':'+a[0]);return p.apply(this,a)};w.tapWrapped=true;Storage.prototype[k]=w}});
        for(const id of ids){
          if(await bubble.isVisible()){await page.keyboard.press('Escape');await page.waitForTimeout(50)}
          await page.locator(`#haniOfficeActors .hani-office-actor[data-person="${id}"] .hani-office-sprite`).click();await page.waitForTimeout(400);
          const state=await page.evaluate(id=>{const b=document.querySelector('.hani-office-character-bubble'),a=document.querySelector(`#haniOfficeActors .hani-office-actor[data-person="${id}"]`);return {shown:!b.hidden&&b.getBoundingClientRect().width>0,mine:a.dataset.speaking==='true',line:b.querySelector('p')?.textContent||'',name:a.dataset.name}},id);
          const key=floor+':'+id;tally[key]??={ok:0,n:0,misses:[]};tally[key].n++;
          if(state.shown&&state.mine&&state.line.startsWith(state.name))tally[key].ok++;else tally[key].misses.push({run,...state});
          await page.keyboard.press('Escape');await page.waitForTimeout(50);
        }
        writes.push(...await page.evaluate(()=>window.tapWrites));
      }
      await context.close();
    }
  }finally{await browser.close();server.close()}
  const out=path.join(root,'artifacts/office-tap-bubble');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'browser-tally.json'),JSON.stringify({runs:RUNS,tally,errors,writes},null,2)+'\n');
  console.log(Object.entries(tally).map(([k,v])=>k+' '+v.ok+'/'+v.n).join(', '));
  for(const [key,row] of Object.entries(tally))assert.equal(row.ok,RUNS,key+' bubble shown '+row.ok+'/'+RUNS+' '+JSON.stringify(row.misses.slice(0,2)));
  assert.deepEqual(errors,[],'no page errors');
  assert.deepEqual(writes,[],'taps never write hani_os_life storage');
});
