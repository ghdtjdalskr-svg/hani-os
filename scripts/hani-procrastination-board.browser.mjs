// node scripts/hani-procrastination-board.browser.mjs <playwright/index.mjs> <msedge.exe>
// Component-only screenshot fixture; never opens production or writes life data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {makeBoardFixture} from './hani-procrastination-cases.mjs';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'artifacts/procrastination');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const section=read('index.html').match(/    <!-- BEGIN PROCRASTINATION VIEW -->\n([\s\S]*?)    <!-- END PROCRASTINATION VIEW -->/)[1].replace('class="view"','class="view active"');
const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
try{
  for(const width of [1280,390]){
    const page=await browser.newPage({viewport:{width,height:width===1280?900:844},deviceScaleFactor:1});
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
    await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="/hani-procrastination-board.css"><style>body{margin:0;background:#f7f5f9;font-family:"Malgun Gothic",sans-serif}main{max-width:1120px;margin:auto;padding:32px 24px}button{font:inherit;border:1px solid #d8cce0;border-radius:10px;padding:9px 14px;background:white;color:#4d3c59;cursor:pointer}*{box-sizing:border-box}@media(max-width:600px){main{padding:24px 14px}}</style></head><body><main>${section}<small>합성 데이터 · 담당 보드 컴포넌트 Preview</small></main></body></html>`);
    await page.evaluate(fixture=>{
      window.state=fixture;window.routes=[];window.showView=route=>window.routes.push(route);
      window.effects=[];
      for(const key of ['setItem','removeItem','clear'])Storage.prototype[key]=()=>{window.effects.push(key);throw new Error('storage forbidden')};
      window.fetch=()=>{window.effects.push('fetch');throw new Error('network forbidden')};
    },makeBoardFixture());
    await page.addScriptTag({content:read('hani-procrastination-board.js')});
    await page.evaluate(()=>window.HaniProcrastination.render(window.state));
    await page.evaluate(()=>document.fonts.ready);
    const stages=await page.locator('[data-pb-card]').evaluateAll(cards=>cards.map(card=>card.dataset.level));
    assert.deepEqual(stages.slice(0,5),['0','1','2','3','4']);
    const geometry=await page.locator('[data-pb-card], [data-pb-go]').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}));
    assert.ok(geometry.every(r=>r.left>=0&&r.right<=width&&r.width>0),'cards/buttons fit viewport');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:path.join(output,width===1280?'edge-pc-1280x900.png':'edge-phone-390.png'),fullPage:true});
    await page.locator('[data-pb-card="weight"] [data-pb-go]').click();assert.equal(await page.evaluate(()=>window.routes.at(-1)),'diet');
    await page.evaluate(()=>{window.state.body.push({date:'2026-11-08',weight:70});window.HaniProcrastination.render(window.state)});
    assert.equal(await page.locator('[data-pb-card="weight"]').getAttribute('data-level'),'0');
    assert.deepEqual(await page.evaluate(()=>window.effects),[]);assert.deepEqual(errors,[]);
    await page.close();
  }
}finally{await browser.close()}
