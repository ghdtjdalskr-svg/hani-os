// node scripts/hani-pwa-213.test.mjs [playwright/index.mjs] [browser.exe|http://CDP]
// --static runs only Node checks; it never claims the browser matrix passed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {inflateSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'artifacts/pwa-213');
fs.mkdirSync(out, {recursive: true});
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const manifest = JSON.parse(read('manifest.webmanifest'));
const html = read('index.html');
const report = {static: [], browser: {status: 'not run', results: []}};
const saveReport = () => fs.writeFileSync(path.join(out, process.argv.includes('--static') ? 'static-status.json' : 'run-status.json'), JSON.stringify(report, null, 2) + '\n');
const check = (name, fn) => {fn(); report.static.push(name); console.log('PASS ' + name)};

// Decode indexed PNG scanlines too, so safe-zone/opacity checks use actual pixels.
function png(file) {
  const b = fs.readFileSync(path.join(root, file));
  assert.equal(b.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const chunks = [], idat = []; let palette, header;
  for (let at = 8; at < b.length;) {
    const n = b.readUInt32BE(at), type = b.toString('ascii', at+4, at+8);
    assert.ok(at + 12 + n <= b.length, 'complete PNG chunk');
    const data = b.subarray(at+8, at+8+n); chunks.push(type);
    if (type === 'IHDR') header = data;
    if (type === 'PLTE') palette = data;
    if (type === 'IDAT') idat.push(data);
    at += 12+n;
  }
  assert.ok(header && palette && chunks.at(-1) === 'IEND');
  const width = header.readUInt32BE(0), height = header.readUInt32BE(4), bits = header[8];
  assert.equal(header[9], 3, 'optimized palette PNG'); assert.equal(header[12], 0, 'noninterlaced');
  assert.ok([1, 2, 4, 8].includes(bits)); assert.ok(!chunks.includes('tRNS'), 'fully opaque');
  const raw = inflateSync(Buffer.concat(idat)), stride = Math.ceil(width*bits/8), pixels = [];
  assert.equal(raw.length, (stride+1)*height);
  let previous = Buffer.alloc(stride);
  const paeth = (a, c, d) => {const p=a+c-d, x=Math.abs(p-a), y=Math.abs(p-c), z=Math.abs(p-d);return x<=y&&x<=z?a:y<=z?c:d};
  for (let y=0; y<height; y++) {
    const row = Buffer.from(raw.subarray(y*(stride+1)+1, (y+1)*(stride+1))), filter = raw[y*(stride+1)];
    assert.ok(filter<=4);
    for (let i=0; i<stride; i++) {
      const a=row[i-1]||0, c=previous[i], d=previous[i-1]||0;
      row[i] += [0, a, c, Math.floor((a+c)/2), paeth(a,c,d)][filter];
    }
    for (let x=0; x<width; x++) {
      const index=(row[Math.floor(x*bits/8)] >> (8-bits-(x*bits%8))) & ((1<<bits)-1);
      pixels.push([...palette.subarray(index*3, index*3+3)]);
    }
    previous = row;
  }
  return {width, height, pixels, bytes: b.length};
}

check('manifest JSON and required members', () => {
  for (const [key, value] of Object.entries({name:'HANI OS',short_name:'HANI OS',start_url:'./?source=pwa',scope:'./',display:'standalone',orientation:'any',lang:'ko',background_color:'#f8f7f4',theme_color:'#eee5d5'})) assert.equal(manifest[key], value, key);
  const base = new URL('https://example.test/hani-os/manifest.webmanifest');
  assert.equal(new URL(manifest.scope,base).pathname, '/hani-os/');
  assert.equal(new URL(manifest.start_url,base).href, 'https://example.test/hani-os/?source=pwa');
  assert.equal(manifest.icons.length, 3);
});
check('icons decode, dimensions, size budget and maskable safe zone', () => {
  const expected = [['icon-192.png',192,'any'],['icon-512.png',512,'any'],['icon-512-maskable.png',512,'maskable']];
  let total = 0;
  for (const [name,size,purpose] of expected) {
    const icon = manifest.icons.find(i => i.src === './assets/pwa/'+name);
    assert.ok(icon); assert.equal(icon.sizes,`${size}x${size}`); assert.equal(icon.type,'image/png'); assert.equal(icon.purpose,purpose);
    const image = png(icon.src); assert.equal(image.width,size); assert.equal(image.height,size);
    assert.ok(image.bytes < 65536, 'each icon under 64 KiB'); total += image.bytes;
    const colored = image.pixels.filter(p=>Math.min(...p)<220);
    assert.ok(colored.length > size*size*.05, 'visible CI emblem');
    if (purpose === 'maskable') image.pixels.forEach((rgb,i)=>{
      if (Math.min(...rgb)<245) assert.ok(Math.hypot(i%size+.5-size/2,Math.floor(i/size)+.5-size/2)<=size*.4,'all artwork within safe circle');
    });
  }
  const apple = png('assets/pwa/apple-touch-icon.png');
  assert.equal(apple.width,180); assert.equal(apple.height,180); total += apple.bytes;
  assert.ok(total < 128*1024, 'all four icons under 128 KiB');
});
check('index links and existing finish theme owner agree', () => {
  assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest">/);
  assert.match(html, /<meta name="theme-color" content="#eee5d5">/);
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes">/);
  assert.match(html, /<meta name="apple-mobile-web-app-title" content="HANI OS">/);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="\.\/assets\/pwa\/apple-touch-icon\.png">/);
  // A single unqualified meta is deliberate: updateFinishScope owns the user's selected Finish.
  assert.equal((html.match(/name="theme-color"/g)||[]).length,1);
  assert.match(read('hani-main.js'), /if\(meta\)meta\.setAttribute\("content",\{[^\n]+\}\[finish\]\|\|"#eee5d5"\)/);
});
check('no service worker registration in repository runtime sources', () => {
  let count = 0;
  const excluded = new Set(['.git','.agents','.codex','node_modules','artifacts','docs','scripts','supabase','dev-center']);
  const walk = dir => {
    for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if (excluded.has(entry.name) || entry.name.startsWith('.')) continue;
      const file = path.join(dir,entry.name);
      if (entry.isDirectory()) {walk(file);continue}
      if (!/\.(?:[cm]?js|html)$/i.test(file)) continue;
      count++;
      assert.doesNotMatch(fs.readFileSync(file,'utf8'), /serviceWorker|service-worker|workbox/i, file);
      assert.doesNotMatch(entry.name, /^(?:sw|service-worker)\.[cm]?js$/i);
    }
  };
  walk(root); assert.ok(count>20); report.runtimeFilesScanned=count;
});
saveReport();
if (process.argv.includes('--static')) {
  console.log('Static checks only. Browser matrix and screenshots NOT RUN.');
} else {
  let browser, server;
  try {
    const module = process.argv[2] || process.env.PLAYWRIGHT_MODULE;
    const {chromium} = module ? await import(pathToFileURL(path.resolve(module)).href) : await import('playwright');
    const executable = process.argv[3] || process.env.PWA_BROWSER;
    server = http.createServer((req,res)=>{
      const url = new URL(req.url,'http://test');
      if (!url.pathname.startsWith('/hani-os/')) {res.writeHead(404).end();return}
      const relative = decodeURIComponent(url.pathname.slice('/hani-os/'.length)) || 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root+path.sep) || relative.split('/').some(s=>s.startsWith('.')) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end();return}
      const mime = {'.webmanifest':'application/manifest+json','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
      res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
      res.setHeader('Cache-Control','no-store'); res.end(fs.readFileSync(file));
    });
    await new Promise(done=>server.listen(0,'127.0.0.1',done));
    const origin = `http://127.0.0.1:${server.address().port}`, start = origin+'/hani-os/?source=pwa';
    browser = executable?.startsWith('http') ? await chromium.connectOverCDP(executable) : await chromium.launch({executablePath:executable,headless:true});
    report.browser.status = 'running';
    const matrix = [[412,915],[884,1000],[1440,1000],[360,915],[700,1000],[900,1000]];
    for (const [width,height] of matrix) {
      const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'allow'});
      await context.route('**/*', route=>new URL(route.request().url()).origin===origin ? route.continue() : route.abort());
      const page = await context.newPage(), errors=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
      await page.goto(start);
      await page.waitForFunction(()=>typeof unlockLoginGate==='function' && typeof showView==='function' && !!window.HANI_CONTEXT_REMOTE_V1);
      await page.evaluate(()=>{
        unlockLoginGate();cloudStopAutoSync();
        // Disposable, memory-only fixtures exercise populated cards and long file names.
        state.tasks=[{id:'pwa-task',text:'Fold 화면에서 긴 할 일 제목과 날짜 및 실행 버튼이 안전하게 배치되는지 확인합니다',done:false,due:'2026-10-20'}];
        state.learningProjects=[{id:'pwa-jlpt',name:'일본어 N3 학습',status:'active',scheduleType:'manual'},{id:'pwa-economy',name:'주식·경제·거시경제 기초',status:'active',scheduleType:'manual'}];
        cloudUser={id:'pwa-layout-fixture'};
        googleDriveApi=async()=>({ok:true,connected:true,accountHint:'layout@example.test',files:[
          {id:'folder',name:'2026년 월간 보고서와 장기 목표',mimeType:'application/vnd.google-apps.folder',modifiedTime:'2026-10-15T10:00:00Z'},
          {id:'report',name:'화면을 접고 펼쳐도 안전하게 조회하는 긴 파일 이름의 HANI OS 월간 보고서.pdf',mimeType:'application/pdf',size:'1048576',modifiedTime:'2026-10-15T10:00:00Z',webViewLink:'https://drive.google.com/file/d/fixture/view'}
        ],nextPageToken:''});
        renderAll();
      });
      const cdp = await context.newCDPSession(page);
      const appManifest = await cdp.send('Page.getAppManifest');
      assert.equal(appManifest.url, origin+'/hani-os/manifest.webmanifest');
      assert.deepEqual(appManifest.errors,[]); assert.equal(JSON.parse(appManifest.data).name,'HANI OS');
      assert.equal(await page.evaluate(async()=>navigator.serviceWorker.controller===null && (await navigator.serviceWorker.getRegistrations()).length===0),true);
      const finishes = [412,884,1440].includes(width) ? ['porcelain-cream','midnight-black'] : ['porcelain-cream'];
      for (const finish of finishes) {
        await page.evaluate(value=>applySignatureFinish(value,false),finish);
        assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),finish==='midnight-black'?'#0e0f12':'#eee5d5');
        for (const view of ['home','tasks','board','study','investment','drive']) {
          await page.evaluate(id=>showView(id),view);
          if(view==='drive')await page.waitForFunction(()=>googleDriveRuntime.connected&&!googleDriveRuntime.busy);
          const section=page.locator(`section#${view}.view.active`);await section.waitFor({state:'visible'});
          await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
          const audit=await page.evaluate(({view,width})=>{
            const node=document.getElementById(view), main=document.querySelector('#app .main'), rail=document.querySelector('.hani-context-remote');
            const rect=node.getBoundingClientRect(), m=main.getBoundingClientRect(), r=rail.getBoundingClientRect();
            const visible=el=>{const b=el.getBoundingClientRect();return el.getClientRects().length && getComputedStyle(el).visibility!=='hidden' && b.right>0 && b.left<innerWidth && b.top<innerHeight && b.bottom>0};
            const tiny = width<=900 ? [...document.querySelectorAll('#app button,#app a[href],#app summary,#app input:not([type=hidden]),#app select,#app textarea,#app [role=button]')].filter(el=>!el.disabled && visible(el)).filter(el=>{const b=el.getBoundingClientRect();return b.height<39.5 || b.width<39.5}).map(el=>({id:el.id,tag:el.tagName,class:el.className,box:[el.getBoundingClientRect().width,el.getBoundingClientRect().height]})) : [];
            return {overflowNodes:[...node.querySelectorAll("*")].filter(el=>{const b=el.getBoundingClientRect();let ancestor=el.parentElement;while(ancestor&&ancestor!==node){if(["hidden","clip","auto","scroll"].includes(getComputedStyle(ancestor).overflowX))return false;ancestor=ancestor.parentElement}return b.width&&b.right>rect.right+1}).slice(0,25).map(el=>({tag:el.tagName,id:el.id,class:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth})),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,viewWidth:rect.width,viewScroll:node.scrollWidth,sidebar:document.querySelector('#sidebar').getBoundingClientRect().width,railOverlap:width>850 && width<=900 ? m.right>r.left+1 : false,tiny};
          },{view,width});
          report.browser.results.push({width,height,finish,view,audit});saveReport();
          if ([412,884,1440].includes(width) && (finish==='porcelain-cream'||view==='home')) await page.screenshot({path:path.join(out,`${width}-${finish}-${view}.png`)});
          assert.ok(audit.viewWidth>100,'real active view has layout');
          assert.ok(audit.documentWidth<=audit.viewport+1,`${width}/${view}: document overflow`);
          assert.ok(audit.viewScroll<=audit.viewWidth+1,`${width}/${view}: view overflow`);
          if(width>=700&&width<=900)assert.ok(audit.sidebar<=70,'icon sidebar on inner screen');
          assert.equal(audit.railOverlap,false,'remote has its own column');
          assert.deepEqual(audit.tiny,[],`${width}/${view}: 40px tap targets`);
          console.log(`PASS ${width}/${finish}/${view}`);
        }
      }
      if (width===412) {
        await page.evaluate(()=>showView('tasks'));
        await page.locator('#taskText').fill('Fold 입력 유지 · 저장하지 않은 초안');
        await page.locator('#taskDue').fill('2026-10-20');
        await page.evaluate(()=>{window.pwaInputNode=document.querySelector('#taskText');window.pwaBeforeLife=localStorage.getItem('hani_os_life_v23');window.pwaResizeWrites=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){pwaResizeWrites.push(key);return set.call(this,key,value)}});
        for (const nextWidth of [884,412]) {
          await page.setViewportSize({width:nextWidth,height:nextWidth===884?1000:915});
          await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
          assert.equal(await page.locator('#taskText').inputValue(),'Fold 입력 유지 · 저장하지 않은 초안');
          assert.equal(await page.locator('#taskDue').inputValue(),'2026-10-20');
          assert.equal(await page.evaluate(()=>document.querySelector('#taskText')===pwaInputNode),true,'same input DOM node survives resize');
          assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===pwaBeforeLife),true,'life bytes unchanged');
          await page.screenshot({path:path.join(out,`resize-${nextWidth}.png`)});
        }
        assert.deepEqual(await page.evaluate(()=>pwaResizeWrites),[],'resize does not write storage');
        report.browser.resize='PASS: text/date/same node/no storage writes, 412→884→412';
      }
      assert.deepEqual(errors,[],'runtime page errors');await context.close();
    }
    report.browser.status='passed';
  } catch (error) {
    report.browser.status=/spawn EPERM|EACCES|Cannot find package|ECONNREFUSED|Executable doesn't exist/.test(error.message)?'blocked':'failed';
    report.browser.error=error.message.split('\n')[0];
    process.exitCode=1;console.error(report.browser.error);
  } finally {
    saveReport();await browser?.close();if(server)await new Promise(done=>server.close(done));
  }
}
