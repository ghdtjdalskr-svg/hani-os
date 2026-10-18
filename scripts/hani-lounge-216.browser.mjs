// Isolated real shell/board DOM + CSS. Synthetic state and mocked AI only.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),out=path.join(root,'artifacts/l216-1');fs.mkdirSync(out,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.USERPROFILE+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  try{const data=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.webp')?'image/webp':'text/html');res.end(data)}catch{res.writeHead(404).end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  browser=await chromium.launch({executablePath:process.env.HANI_CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const results=[];
  for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{
      if(!route.request().url().startsWith('http://127.0.0.1:'))return route.abort();
      if(route.request().resourceType()==='script')return route.abort();
      return route.continue();
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html#board`);
    await page.unroute('**/*');
    await page.evaluate(()=>{
      document.querySelectorAll('script').forEach(s=>s.remove());
      document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
      document.querySelector('#board').classList.add('active');
      document.querySelector('#loginGate')?.remove();
      const app=document.querySelector('#app');app.classList.remove('login-locked');app.removeAttribute('inert');app.removeAttribute('aria-hidden');
      window.state={boardPosts:[],boardComments:[],books:[],movies:[],tasks:[],goalRegistry:[],exercise:[],body:[],ledgerMonths:[]};
      Object.assign(window,{cloudUser:{id:'synthetic'},loadRecovery:{active:false},importSyncHold:false,cloudRecoveryMode:false,cloudAutoSyncReady:false,cloudRuntime:{sync:'ON'},cloudHasMeaningfulLocalData:()=>true,save:()=>({ok:true}),uid:()=>crypto.randomUUID(),formatDateTime:String});
    });
    for(const file of ['hani-organization-hub.js','hani-character-archive-data.js','hani-relationship-seed.js','hani-board-library.js','hani-board.js'])await page.addScriptTag({path:path.join(root,file)});
    await page.evaluate(()=>{
      state.boardPosts=[{id:'surgery',title:'다음 주 수술이라 무서워요',body:'병원에 가야 해서 마음이 두근두근해요.',authorId:HaniOrganizationRoster.chairman.id,category:'LOUNGE',createdAt:new Date().toISOString()}];
      state.boardComments=HaniBoard.queueReplies(state.boardPosts[0],state.boardPosts[0],[],Date.now()).map(c=>({...c,pending:false}));
      HaniBoard.openPost('surgery');HaniBoard.render();
    });
    await page.locator('[data-board="article"]').scrollIntoViewIfNeeded();
    const inspect=()=>page.evaluate(()=>{
      const title=document.querySelector('[data-board="article"] h3'),rect=title.getBoundingClientRect();
      const hits=[...document.querySelectorAll('#sidebar .txt')].filter(el=>{
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return s.display!=='none'&&r.right>rect.left&&r.left<rect.right&&r.bottom>rect.top&&r.top<rect.bottom;
      }).map(el=>({text:el.textContent,rect:el.getBoundingClientRect().toJSON()}));
      const img=document.querySelector('[data-board="article"] .board-author img');
      return {hits,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,avatar:img?.getAttribute('src'),avatarLoaded:img?.complete&&img?.naturalWidth>0,comments:document.querySelectorAll('.board-comment').length};
    });
    const before=await inspect();await page.screenshot({path:path.join(out,`detail-${width}.png`),fullPage:false});
    assert.equal(before.scrollWidth,width);assert.equal(before.hits.length,0,'sidebar label overlaps article title');
    assert.ok(before.avatarLoaded);assert.match(before.avatar,/seongmin.webp/);
    if(width===1440){await page.evaluate(()=>document.querySelector('#app').classList.add('sidebar-mini'));assert.equal((await inspect()).hits.length,0)}
    assert.deepEqual(errors,[]);results.push({width,...before,errors});await page.close();
  }
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser?.close();await new Promise(r=>server.close(r))}
