// node scripts/hani-milestones-grade-ui.browser.mjs <playwright index.mjs> <msedge.exe>
// Isolated browser contexts, synthetic records held only in memory; no account or Cloud writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const root = path.resolve(import.meta.dirname,'..');
if (!process.argv[2] || !process.argv[3]) throw Error('Usage: node scripts/hani-milestones-grade-ui.browser.mjs <playwright index.mjs> <msedge.exe>');
const {chromium} = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const out = path.join(root,'artifacts','milestones-grade-ui'); fs.mkdirSync(out,{recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://test').pathname === '/' ? '/index.html' : new URL(req.url,'http://test').pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404); return res.end();}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream'); res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin = 'http://127.0.0.1:'+server.address().port;
let browser;
try {
  browser = await chromium.launch({executablePath:process.argv[3],headless:true});
  for (const width of [390,1440]) for (const finish of ['porcelain-cream','midnight-black']) {
    const ctx = await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
    await ctx.route('**/*',r=>new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
    const page = await ctx.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin); await page.waitForFunction(()=>window.HaniMilestones && typeof showView==='function');
    await page.evaluate(finish=>{
      unlockLoginGate(); const gate=document.getElementById('loginGate'); gate.style.display='none';
      const app=document.getElementById('app'); app.classList.remove('login-locked'); app.inert=false; app.removeAttribute('inert'); document.body.classList.remove('login-scroll-locked');
      applySignatureFinish(finish,false);
      const base=JSON.parse(JSON.stringify(window.HaniMilestones.SEED[0]));
      state={...state,milestones:['LEGENDARY','EPIC','RARE',null].flatMap((grade,i)=>['HEALTH','LIFE'].map((category,j)=>({...base,id:i===0&&j===0?base.id:'milestone_fixture_'+i+'_'+j,title:i===0&&j===0?base.title:'검증용 기록 '+i+' · '+category,category,grade,source:i===0&&j===0?'seed':'manual',metrics:i===3?[{id:'now',label:'현재 지표',before:null,after:'5.3%',change:null,unit:null}]:base.metrics,featuredMetrics:i===3?['now']:base.featuredMetrics})))};
      window.__msState=JSON.stringify(state); window.__msWriteCount=0;
      for (const method of ['setItem','removeItem','clear']) Storage.prototype[method]=function(){window.__msWriteCount++;throw Error('Storage write during read-only UI test');};
      window.__msSaved=save; save=()=>{window.__msWriteCount++;throw Error('Save during read-only UI test');};
      showView('milestones');
      document.querySelectorAll('[class*=remote]').forEach(el=>{if(getComputedStyle(el).position==='fixed')el.style.display='none';});
    },finish);
    await page.waitForSelector('#milestones .ms-card');
    const tag=width+'-'+finish;
    assert.equal(await page.locator('#milestones > .ds-main-character-banner').count(),1,tag+' canonical hero');
    assert.match(await page.locator('#milestones > .ds-main-character-banner .ds-main-character-banner__scene img').getAttribute('src'),/milestones-226w-a[23]?\.webp/);
    assert.equal(await page.locator('[data-ms-grade]').count(),4);
    assert.equal(await page.locator('.ms-item').count(),8);
    for (const category of ['ALL','HEALTH','LIFE','TRAVEL']) {
      await page.locator('[data-ms-filter="'+category+'"]').click();
      const expected=category==='ALL'?2:category==='TRAVEL'?0:1;
      for (const grade of ['LEGENDARY','EPIC','RARE','RECORD']) {
        const button=page.locator('[data-ms-grade="'+grade+'"]'); await button.click();
        assert.equal(await button.getAttribute('aria-pressed'),'true');
        assert.equal(await page.locator('.ms-item').count(),expected,tag+'/'+category+'/'+grade);
        assert.equal((await button.locator('em').innerText()).replace('개','').trim(),String(expected));
        await page.locator('[data-ms-sort]').selectOption('oldest');
        assert.equal(await page.locator('.ms-item').count(),expected);
        await button.click(); assert.equal(await button.getAttribute('aria-pressed'),'false');
      }
    }
    await page.locator('[data-ms-filter="ALL"]').click();
    await page.locator('[data-ms-sort]').selectOption('newest');
    const layout=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('#milestones .ms-card *,#milestones .ms-tier')].filter(e=>e.getClientRects().length&&!e.closest('svg')&&!e.classList.contains('ms-sr'));
      return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,clipped:nodes.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.className),ids:[...document.querySelectorAll('[id]')].map(e=>e.id)};
    });
    assert.equal(layout.overflow,false,tag+' horizontal overflow'); assert.deepEqual(layout.clipped,[],tag+' clipped text');
    assert.equal(new Set(layout.ids).size,layout.ids.length,tag+' duplicate ids');
    assert.equal(await page.locator('.ms-grade-record .ms-old,.ms-grade-record .ms-delta').count(),0);
    assert.equal(await page.evaluate(()=>window.__msWriteCount),0,tag+' zero writes');
    assert.equal(await page.evaluate(()=>JSON.stringify(state)===window.__msState),true,tag+' immutable records');
    assert.deepEqual(errors,[],tag+' page errors');
    await page.screenshot({path:path.join(out,tag+'.png'),fullPage:true});
    // Real delegated detail/back path must still work after all filter rerenders.
    await page.locator('[data-ms-open]').first().click(); assert.equal(await page.locator('[data-ms-detail]').isVisible(),true);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('[data-ms-archive]').isVisible(),true);
    console.log('PASS',tag); await ctx.close();
  }
} finally { if(browser) await browser.close(); await new Promise(r=>server.close(r)); }
