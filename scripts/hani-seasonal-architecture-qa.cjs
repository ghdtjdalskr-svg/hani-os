const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const mode = process.argv.includes('--baseline') ? 'baseline' : 'candidate';
const output = path.resolve(process.env.HANI_SEASON_QA_OUTPUT || path.join(require('node:os').tmpdir(), 'hani-seasonal-architecture-qa'));
fs.mkdirSync(output, { recursive: true });
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml'};
const baselineFiles = mode==='baseline' ? new Map(['index.html','hani-main.js','hani-design-system.css','hani-context-remote.css'].map(file => [file,require('node:child_process').execFileSync('git',['show',`ff8c9ea22ba990d0771b390972e7ccb39610d097:${file}`],{cwd:root,maxBuffer:10*1024*1024})])) : new Map();
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + (new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : decodeURIComponent(new URL(req.url, 'http://localhost').pathname)));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
  if(baselineFiles.has(path.relative(root,file))){res.end(baselineFiles.get(path.relative(root,file)));return;}
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({headless:true, executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  const report = {mode, at:new Date().toISOString(), viewports:[], externalRequestsBlocked:0};
  try {
    for (const width of [1440,390]) {
      const context = await browser.newContext({viewport:{width,height:900}});
      await context.route('**/*', route => {
        if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
        report.externalRequestsBlocked++;
        return route.fulfill({status:200,contentType:route.request().resourceType()==='script'?'text/javascript':'text/plain',body:''});
      });
      const page = await context.newPage();
      const errors=[];
      page.on('pageerror', error => errors.push(error.message));
      const reveal = async () => page.evaluate(() => {
        document.querySelector('#loginGate')?.style.setProperty('display','none','important');
        document.querySelector('#app')?.classList.remove('login-locked');
        document.querySelector('#app')?.setAttribute('aria-hidden','false');
      });
      await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'});
      await reveal();
      await page.waitForSelector('#haniContextRemote .hani-remote-scene img');
      // Complete existing route/layout initialization before measuring either build.
      await page.waitForTimeout(600);
      await page.evaluate(()=>document.querySelector('.nav-btn[data-view="diet"]').click());
      await page.waitForTimeout(180);
      await page.evaluate(()=>document.querySelector('.nav-btn[data-view="home"]').click());
      await page.waitForTimeout(300);
      const storageBefore = await page.evaluate(() => localStorage.getItem('hani_os_life_v23'));
      // Read-only visual fixtures: no application save path is invoked.
      await page.evaluate(() => {
        const host=document.querySelector('#lifeMarketCounts');
        const probe=document.createElement('div');probe.id='seasonQAProbes';
        probe.innerHTML='<span class="up">+1%</span><span class="down">−1%</span>';
        host.append(probe);
      });
      const result={width,seasons:[],errors};
      for (const season of ['spring','summer','autumn','winter']) {
        await page.evaluate(s => applySeasonTheme(s,false),season);
        await page.waitForTimeout(180);
        const snapshot = await page.evaluate(async () => {
          const style = (selector,pseudo=null) => { const el=document.querySelector(selector); if(!el)throw new Error('Missing '+selector);const s=getComputedStyle(el,pseudo);return {bg:s.backgroundColor,image:s.backgroundImage,border:s.borderTopColor,color:s.color,shadow:s.boxShadow}; };
          const hero=document.querySelector('#home>.ds-main-character-banner');
          const img=hero.querySelector('.ds-main-character-banner__scene img');
          const remote=document.querySelector('.hani-remote-scene img');
          await Promise.all([img.decode(),remote.decode()]);
          return {
            season:document.documentElement.dataset.season,
            structure:{canvas:style('body'),app:style('#app'),page:style('#app .main'),panel:style('#home .home-trend-card'),diet:style('#diet .card'),remote:style('#haniContextRemote'),sidebar:style('#sidebar'),header:style('.ui26-top')},
            domains:Object.fromEntries(['hasdaq','ne100','hinaJones','harukei','jispi','hinkei'].map(key=>[key,style(`[data-life-index="${key}"]`)])),
            semantic:{up:style('#seasonQAProbes .up'),down:style('#seasonQAProbes .down')},
            hero:{src:img.getAttribute('src'),width:hero.getBoundingClientRect().width,height:hero.getBoundingClientRect().height,fx:getComputedStyle(hero.querySelector('.ds-main-character-banner__seasonal-fx')).display},
            remoteSrc:remote.getAttribute('src'),overflow:document.documentElement.scrollWidth-innerWidth
          };
        });
        result.seasons.push(snapshot);
        assert.notEqual(snapshot.semantic.up.color,snapshot.semantic.down.color,'Semantic fixture must exercise distinct up/down styles');
        await page.screenshot({path:path.join(output,`${mode}-${width}-${season}-home.png`)});
        await page.evaluate(() => { document.querySelector('.nav-btn[data-view="diet"]').click(); });
        await page.waitForTimeout(100);
        await page.screenshot({path:path.join(output,`${mode}-${width}-${season}-diet.png`)});
        await page.evaluate(() => { document.querySelector('.nav-btn[data-view="home"]').click(); });
        if(width===390){
          await page.locator('.hani-remote-mobile-trigger').click();
          await page.waitForTimeout(270);
          await page.screenshot({path:path.join(output,`${mode}-${width}-${season}-remote.png`)});
          await page.locator('.hani-remote-close').click();
        }
      }
      if(mode==='candidate') {
        const baseline=JSON.parse(fs.readFileSync(path.join(output,'baseline.json'),'utf8')).viewports.find(v=>v.width===width);
        for(const [i,s] of result.seasons.entries()) {
          assert.deepEqual(s.structure,result.seasons[0].structure,`${width} ${s.season}: structural surfaces vary`);
          const expectedDomains=structuredClone(baseline.seasons[i].domains);
          // Finance's old inherited --ui-purple followed season. Its canonical purple
          // is now explicit; preserve every other domain property against baseline.
          expectedDomains.hasdaq.color=baseline.seasons[0].domains.hasdaq.color;
          assert.deepEqual(s.domains,expectedDomains,`${width} ${s.season}: domain identity changed`);
          assert.deepEqual(s.semantic,baseline.seasons[i].semantic,`${width} ${s.season}: semantic identity changed`);
          assert.equal(s.hero.src,baseline.seasons[i].hero.src,'Hero asset changed');
          for(const dimension of ['width','height'])assert(Math.abs(s.hero[dimension]-baseline.seasons[i].hero[dimension])<0.1,'Hero geometry changed');
          assert.equal(s.hero.fx,'none','Home FX remains');
          assert.equal(s.overflow,baseline.seasons[i].overflow,'Viewport overflow regression');
          assert.match(s.remoteSrc,new RegExp(`/(${s.season}-[12]|life-(office-lounge|book-cafe|brunch|media-night)-v1)\\.jpg$`));
        }
        await page.evaluate(() => {document.documentElement.dataset.theme='dark';applySeasonTheme('summer',false);});
        assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark','legacy theme erased');
        // Synthetic appearance-token override, not a shipped Finish implementation.
        result.appearance = await page.evaluate(async () => {
          document.documentElement.removeAttribute('data-theme');
          const root=document.documentElement,remote=document.querySelector('.hani-remote-scene img');
          const src=remote.src,season=root.dataset.season;
          const before=getComputedStyle(document.querySelector('#haniContextRemote')).backgroundColor;
          root.style.setProperty('--surface-panel','#e5e7eb');
          const after=getComputedStyle(document.querySelector('#haniContextRemote')).backgroundColor;
          return {before,after,seasonPreserved:root.dataset.season===season,artworkPreserved:remote.src===src};
        });
        assert.notEqual(result.appearance.before,result.appearance.after);
        assert(result.appearance.seasonPreserved&&result.appearance.artworkPreserved);
      }
      // Exercise the existing button and storage path, then reload the isolated profile.
      await page.evaluate(()=>document.querySelector('#theme').click());
      const selected=await page.evaluate(()=>({season:document.documentElement.dataset.season,saved:localStorage.getItem('hani_os_season_theme_v1')}));
      assert.equal(selected.season,selected.saved);
      await page.reload({waitUntil:'load'});
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),selected.season);
      assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),storageBefore,'Business storage changed');
      assert.deepEqual(errors,[],`${width}: JS errors`);
      result.preference=selected;result.protectedStorageUnchanged=true;
      report.viewports.push(result);
      await context.close();
    }
    fs.writeFileSync(path.join(output,`${mode}.json`),JSON.stringify(report,null,2));
    console.log(`${mode}: ${report.viewports.length} viewports x 4 seasons; report ${output}`);
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
