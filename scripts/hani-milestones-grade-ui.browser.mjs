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
const out = path.join(root,'artifacts','milestones-polish'); fs.mkdirSync(out,{recursive:true});
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
    const ctx = await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
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
    assert.match(await page.locator('#milestones > .ds-main-character-banner .ds-main-character-banner__scene img').getAttribute('src'),/milestones-226w-a3\.webp/);
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
    const cards=page.locator('.ms-item > [data-ms-open]'), first=cards.first();
    for (const [grade,stars] of [['legendary',5],['epic',4],['rare',3],['record',2]]) {
      assert.equal(await page.locator('.ms-item > .ms-grade-'+grade+' .ms-stars').first().innerText(),'★'.repeat(stars));
    }
    assert.match(await page.locator('[data-ms-grade="RECORD"]').innerText(),/MOMENT[\s\S]*소중한 순간/);
    assert.equal(await first.getAttribute('aria-haspopup'),'dialog');
    assert.equal(await page.locator('[data-ms-open="milestone_health_20261023"] [data-ms-art="health-legendary"]').count(),1);
    const transform=()=>first.evaluate(e=>getComputedStyle(e).transform);
    await page.mouse.move(0,0); const idle=await transform();
    await first.hover(); await page.waitForTimeout(220);
    assert.notEqual(await transform(),idle,tag+' card hover');
    await page.screenshot({path:path.join(out,tag+'.png'),fullPage:true});
    const checkLayout=async()=>{
      const layout=await page.evaluate(()=>{
        const dialog=document.querySelector('[data-ms-detail]');
        const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
        const nodes=[...document.querySelectorAll('.ms-plate,.ms-card-top,.ms-sheet-body,.ms-compare-cell b,.ms-comment blockquote')].filter(e=>e.getClientRects().length);
        return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
          dialogOverflow:dialog.open && dialog.scrollWidth>dialog.clientWidth+2,
          clipped:nodes.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.className),
          duplicate:ids.length-new Set(ids).size};
      });
      assert.equal(layout.overflow,false,tag+' viewport overflow');
      assert.equal(layout.dialogOverflow,false,tag+' dialog overflow');
      assert.deepEqual(layout.clipped,[],tag+' clipped fields'); assert.equal(layout.duplicate,0);
    };
    await checkLayout();
    const dialog=page.locator('dialog[data-ms-detail]');
    await first.click(); await page.waitForTimeout(250);
    assert.equal(await dialog.evaluate(e=>e.open),true,tag+' click opens native dialog');
    assert.equal(await page.locator('[data-ms-archive]').isVisible(),true);
    for(const field of ['체중','혈당','HbA1c','중성지방','총콜레스테롤','LDL','AST','ALT','감마GTP','성과 설명','과정 / 배경','이 변화의 의미','다음 목표','담당 Agent','Agent Comment','회장 본인 Comment','Tag','관련 이미지','관련 HANI OS 기능']) {
      assert.ok((await dialog.innerText()).includes(field),tag+'/'+field);
    }
    await checkLayout();
    assert.match(await dialog.evaluate(e=>getComputedStyle(e).animationName),/ms-unfold/);
    // Contrast uses actual resolved inks; translucent plate is tested over worst-case black art.
    const contrastFailures=await page.evaluate(()=>{
      const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
      const rgb=c=>{cx.clearRect(0,0,1,1);cx.fillStyle=c;cx.fillRect(0,0,1,1);return [...cx.getImageData(0,0,1,1).data].slice(0,3);};
      const lum=v=>v.map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
      const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const results=[];
      const probe=(e,bg)=>{if(!e)return;const r=ratio(rgb(getComputedStyle(e).color),bg);if(r<4.5)results.push({class:e.className,ratio:r});};
      document.querySelectorAll('.ms-tier').forEach(e=>{const bg=rgb(getComputedStyle(e).backgroundColor);for(const child of e.querySelectorAll('b,small,em'))probe(child,bg);});
      document.querySelectorAll('.ms-card').forEach(e=>{
        const pl=getComputedStyle(e).getPropertyValue('--pl').split(',').map(Number).map(c=>c*.94);
        e.querySelectorAll('.ms-card-title,.ms-plate small,time').forEach(x=>probe(x,pl));
        e.querySelectorAll('.ms-rank-chip,.ms-stars,.ms-new').forEach(x=>probe(x,rgb(getComputedStyle(x).backgroundColor)));
      });
      const paper=rgb(getComputedStyle(document.querySelector('[data-ms-detail]')).backgroundColor);
      document.querySelectorAll('.ms-sheet-body h3,.ms-sheet-body h4,.ms-sheet-body .ms-quiet,.ms-sheet-rank,.ms-compare-label,.ms-compare-cell small,.ms-compare-cell b').forEach(e=>probe(e,paper));
      return results;
    });
    assert.deepEqual(contrastFailures,[],tag+' AA text contrast');
    await page.screenshot({path:path.join(out,tag+'-detail.png'),fullPage:true});
    await page.keyboard.press('Escape');
    assert.equal(await dialog.evaluate(e=>e.open),false);
    assert.equal(await first.evaluate(e=>e===document.activeElement),true,tag+' original card focus');
    await page.keyboard.press('Enter'); assert.equal(await dialog.evaluate(e=>e.open),true,tag+' Enter opens');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Space'); assert.equal(await dialog.evaluate(e=>e.open),true,tag+' Space opens');
    await page.waitForTimeout(250);
    await page.mouse.click(2,2); assert.equal(await dialog.evaluate(e=>e.open),false,tag+' backdrop closes');
    assert.equal(await first.evaluate(e=>e===document.activeElement),true);
    await page.emulateMedia({reducedMotion:'reduce'});
    await first.click(); assert.equal(await dialog.evaluate(e=>getComputedStyle(e).animationName),'none',tag+' reduced motion dialog');
    await page.keyboard.press('Escape'); await first.hover();
    assert.equal(await transform(),'none',tag+' reduced motion hover');
    assert.equal(await page.evaluate(()=>window.__msWriteCount),0,tag+' zero writes');
    assert.equal(await page.evaluate(()=>JSON.stringify(state)===window.__msState),true,tag+' immutable records');
    assert.deepEqual(errors,[],tag+' page errors');
    console.log('PASS',tag); await ctx.close();
  }
} finally { if(browser) await browser.close(); await new Promise(r=>server.close(r)); }
