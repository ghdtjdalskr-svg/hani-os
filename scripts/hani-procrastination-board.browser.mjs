// node scripts/hani-procrastination-board.browser.mjs <playwright/index.mjs> <msedge.exe>
// Component-only screenshot fixture; never opens production or writes life data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {makeBoardFixture} from './hani-procrastination-cases.mjs';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'artifacts/pb-toon/shots');
fs.mkdirSync(output,{recursive:true});
const results=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const section=read('index.html').match(/    <!-- BEGIN PROCRASTINATION VIEW -->\n([\s\S]*?)    <!-- END PROCRASTINATION VIEW -->/)[1].replace('class="view"','class="view active"');
let browser;
try{browser=await chromium.launch({headless:true,executablePath:process.argv[3]})}
catch(error){fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({status:'BLOCKED',reason:error.message,widths:[1280,390],themes:['light','dark'],screenshots:0},null,2));throw error}
try{
  for(const [width,theme] of [[1280,'light'],[390,'light'],[390,'dark']]){
    const page=await browser.newPage({viewport:{width,height:width===1280?900:844},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.origin!=='http://hani.fixture')return route.abort();
      if(url.pathname==='/__fixture__')return route.fulfill({body:'<!doctype html><html lang="ko"><head></head><body></body></html>',contentType:'text/html'});
      const file=path.resolve(root,decodeURIComponent(url.pathname).slice(1));
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
      return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html'});
    });
    await page.clock.install({time:new Date('2026-11-08T03:00:00Z')});
    await page.goto('http://hani.fixture/__fixture__');
    await page.setContent(`<!doctype html><html lang="ko" data-theme="${theme}"><head><meta charset="utf-8"><link rel="stylesheet" href="/hani-procrastination-board.css"><style>body{margin:0;background:${theme==='dark'?'#18151e':'#f7f5f9'};color:${theme==='dark'?'#f3edf6':'#3e354b'};font-family:"Malgun Gothic",sans-serif}main{max-width:1120px;margin:auto;padding:32px 24px}button{font:inherit;border:1px solid #d8cce0;border-radius:10px;padding:9px 14px;background:white;color:#4d3c59;cursor:pointer}*{box-sizing:border-box}@media(max-width:600px){main{padding:24px 14px}}</style></head><body><main>${section}<small>합성 데이터 · 담당 보드 컴포넌트 Preview</small></main></body></html>`);
    await page.evaluate(fixture=>{
      window.state=fixture;window.routes=[];window.showView=route=>window.routes.push(route);
      window.effects=[];
      for(const key of ['getItem','setItem','removeItem','clear'])Storage.prototype[key]=()=>{window.effects.push(key);throw new Error('storage forbidden')};
      window.fetch=()=>{window.effects.push('fetch');throw new Error('network forbidden')};
      for(const key of ['setTimeout','setInterval','addEventListener'])window[key]=()=>{window.effects.push(key);throw new Error(key+' forbidden')};
      window.cardIdentities=[];
    },{...makeBoardFixture(),diaries:[]});
    await page.addScriptTag({content:read('hani-procrastination-board.js')});
    await page.evaluate(()=>window.HaniProcrastination.render(window.state));
    await page.evaluate(()=>document.fonts.ready);
    const stages=await page.locator('[data-pb-card]').evaluateAll(cards=>cards.map(card=>card.dataset.level));
    assert.deepEqual(stages.slice(0,5),['0','1','2','3','4']);
    assert.equal(stages.at(-1),'unknown');
    const geometry=await page.locator('[data-pb-card], [data-pb-go]').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}));
    assert.ok(geometry.every(r=>r.left>=0&&r.right<=width&&r.width>0),'cards/buttons fit viewport');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const image=await page.evaluate(async()=>{
      const image=new Image();image.src='/assets/procrastination/pb-chibi-sheet-v1.webp';await image.decode();
      return {width:image.naturalWidth,height:image.naturalHeight};
    });
    assert.deepEqual(image,{width:1536,height:1280});
    const panels=await page.locator('[data-pb-card]').evaluateAll(cards=>cards.map(card=>{
      const portrait=card.querySelector('.pb-portrait'),speech=card.querySelector('.pb-speech'),scene=card.querySelector('.pb-scene');
      const r=node=>{const b=node.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
      const style=getComputedStyle(portrait);
      return {id:card.dataset.pbCard,level:card.dataset.level,label:portrait.getAttribute('aria-label'),position:style.backgroundPosition,size:style.backgroundSize,image:style.backgroundImage,portrait:r(portrait),speech:r(speech),scene:r(scene),tail:getComputedStyle(speech,'::after').borderTopWidth,speechText:speech.textContent};
    }));
    const expectedRows=[0,0,25,50,50,75,100];
    const names=['나은','나은','히나','지은','지은','하루','민지'];
    for(const [i,panel] of panels.entries()){
      assert.equal(panel.position,`${panel.level==='unknown'?100:Number(panel.level)*20}% ${expectedRows[i]}%`);
      assert.equal(panel.size,'600% 500%');assert.ok(panel.image.endsWith('/assets/procrastination/pb-chibi-sheet-v1.webp")'));
      assert.equal(panel.label.startsWith(names[i]+' · '),true);assert.ok(panel.label.includes(panel.level==='unknown'?'기간 미확인':panel.level+'단계'));
      assert.ok(panel.portrait.left>=panel.scene.left&&panel.portrait.right<=panel.scene.right&&panel.portrait.bottom<=panel.scene.bottom);
      assert.ok(panel.speech.bottom+18<=panel.portrait.top,'bubble tail stays above sprite');
      assert.equal(panel.tail,'15px');
    }
    // Read computed foreground/background colors for every text surface in both themes.
    const contrasts=await page.evaluate(()=>{
      const rgb=c=>(c.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
      const luminance=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const background=node=>{for(let n=node;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent')return c}return 'rgb(255,255,255)'};
      return [...document.querySelectorAll('.pb-owner,.pb-owner span,h3,.pb-speech,.pb-level,.pb-age,.pb-basis,[data-pb-go]')].map(n=>{const a=luminance(getComputedStyle(n).color),b=luminance(background(n));return {text:n.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}});
    });
    assert.ok(contrasts.every(row=>row.ratio>=4.5),'all card text contrast >= 4.5');
    const shot=width===1280?'edge-pc-1280x900.png':theme==='dark'?'edge-phone-390-dark.png':'edge-phone-390.png';
    await page.screenshot({path:path.join(output,shot),fullPage:true});
    await page.evaluate(()=>{window.cardIdentities=[...document.querySelectorAll('[data-pb-card]')]});
    await page.locator('[data-pb-card="weight"] [data-pb-go]').click();assert.equal(await page.evaluate(()=>window.routes.at(-1)),'diet');
    await page.evaluate(()=>{window.state.body.push({date:'2026-11-08',weight:70});window.HaniProcrastination.render(window.state)});
    assert.equal(await page.locator('[data-pb-card="weight"]').getAttribute('data-level'),'0');
    assert.equal(await page.locator('[data-pb-card="weight"] .pb-portrait').getAttribute('aria-label'),'나은 · 0단계 · 괜찮아요 😊');
    for(const id of ['steps','weight','quiz','assets','ledger','wishlist','diary'])await page.locator(`[data-pb-card="${id}"] [data-pb-go]`).click();
    assert.deepEqual(await page.evaluate(()=>window.routes.slice(1)),['exercise','diet','study','investmentIntake','ledger','wishlist','diary']);
    await page.evaluate(()=>window.HaniProcrastination.render({}));
    assert.equal(await page.evaluate(()=>window.cardIdentities.every((card,i)=>card===document.querySelectorAll('[data-pb-card]')[i])),true);
    assert.ok((await page.locator('.pb-portrait').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundPositionX))).every(x=>x==='100%'));
    assert.deepEqual(await page.evaluate(()=>window.effects),[]);assert.deepEqual(errors,[]);
    const spriteCells=new Set();
    for(const level of [0,1,2,3,4,null]){
      await page.evaluate(level=>{
        const date=days=>new Date(Date.parse('2026-11-08T00:00:00Z')-days*86400000).toISOString().slice(0,10);
        const daily=[0,1,7,14,30][level],monthly=[0,31,45,60,90][level],weekly=[0,7,14,30,60][level];
        const state=level===null?{ledgerMonths:[{items:[{}]}],wishlistItems:[{name:'합성 날짜 미확인'}]}:{exercise:[{date:date(daily),steps:1}],body:[{date:date(daily),weight:70}],learningQuizzes:[{status:'pending',scheduledDate:date(daily),questions:[{}]}],investmentBrokerSnapshots:[{status:'confirmed',mode:'actual',updatedAt:date(monthly)}],ledgerMonths:[{items:[{}],updatedAt:date(monthly)}],wishlistItems:[{name:'합성 후보',updatedAt:date(weekly)}],diaries:[{date:date(daily),content:'합성 기록'}]};
        window.HaniProcrastination.render(state);
        const model=window.HaniProcrastination.project(state,'2026-11-08');
        for(const row of model){const card=document.querySelector(`[data-pb-card="${row.id}"]`);if(card.querySelector('.pb-speech').textContent!==row.speech)throw Error('speech drift')}
      },level);
      const cells=await page.locator('[data-pb-card]').evaluateAll(cards=>cards.map(card=>({level:card.dataset.level,position:getComputedStyle(card.querySelector('.pb-portrait')).backgroundPosition,label:card.querySelector('.pb-portrait').getAttribute('aria-label')})));
      for(const [i,cell]of cells.entries()){
        assert.equal(cell.level,level===null?'unknown':String(level));
        assert.equal(cell.position,`${level===null?100:level*20}% ${expectedRows[i]}%`);
        assert.ok(cell.label.includes(level===null?'기간 미확인':level+'단계'));
        spriteCells.add(cell.position);
      }
    }
    assert.equal(spriteCells.size,30,'all five employees and six sheet columns rendered');
    assert.deepEqual(await page.evaluate(()=>window.effects),[]);assert.deepEqual(errors,[]);
    results.push({width,theme,shot,stages,image,panels,minContrast:Math.min(...contrasts.map(row=>row.ratio)),effects:[],errors:[],routes:await page.evaluate(()=>window.routes),persistentCards:true,spriteCells:spriteCells.size});
    await page.close();
  }
}finally{await browser.close();fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(results,null,2))}
