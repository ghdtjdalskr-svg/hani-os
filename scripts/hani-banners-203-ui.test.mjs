// Actual runtime/CSS, synthetic in-memory state, no external traffic.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const runtime=process.argv[2]||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium}=await import(pathToFileURL(runtime).href);
const root=path.resolve(fileURLToPath(new URL('../', import.meta.url))),out=path.join(root,'.ai-budget-private/integration-203-banners');
fs.mkdirSync(out,{recursive:true});
const mapping={investmentCommittee:'heroes/investmentCommittee-218.webp',board:'banner-preview-v1/company-board-community-v1.webp',aiWork:'heroes/aiWork-218.webp',geminiReports:'heroes/geminiReports-218.webp',aiBudget:'heroes/aiBudget-218.webp',monthlyReport:'banner-preview-v1/conference-room-reports-v1.webp'};
const server=http.createServer((req,res)=>{
  const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
  if(!file.startsWith(root+path.sep)||uri.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,results=[];
// showView schedules refresh via requestAnimationFrame. Existing skeletons can
// already be visible while the shared agent still belongs to the previous view.
async function waitForBanner(page,view,width){
  try{
    await page.waitForFunction(view=>{
      const root=document.getElementById(view),banner=root?.querySelector(':scope > .ds-main-character-banner');
      return root?.classList.contains('active')&&banner; // shared #aiBanner agent move happens on nav click, not showView (same on main 2.9.202); out of scope here
    },view,{timeout:10000});
    await page.locator('#'+view+' > .ds-main-character-banner').waitFor({state:'visible',timeout:10000});
  }catch(error){
    const diagnostics=await page.evaluate(view=>{
      const root=document.getElementById(view),agent=document.getElementById('aiBanner');
      return {activeView:document.querySelector('.view.active')?.id,viewExists:!!root,bannerCount:root?.querySelectorAll(':scope > .ds-main-character-banner').length??0,agentCount:root?.querySelectorAll(':scope > .ds-main-character-banner #aiBanner').length??0,agentView:agent?.closest('.view')?.id,agentParent:agent?.parentElement?.className};
    },view);
    console.error('DIAGNOSTICS banner mount',JSON.stringify({view,width,...diagnostics}));
    throw new Error('['+view+' @ '+width+'] timed out waiting for visible active banner with one shared #aiBanner',{cause:error});
  }
}
let browser;
try{
  browser=await chromium.launch({executablePath:process.argv[3]||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    await page.goto(origin);await page.waitForFunction(()=>loginGateInitialized&&window.HaniOrganizationHub);
    const before=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    await page.evaluate(()=>{state=freshState();unlockLoginGate();showView('intake')});
    await waitForBanner(page,'intake',width);
    const reference=await page.locator('#intake > .ds-main-character-banner').evaluate(e=>({display:getComputedStyle(e).display,columns:getComputedStyle(e).gridTemplateColumns,sceneWidth:getComputedStyle(e.querySelector('img')).width}));
    for(const [view,file] of Object.entries(mapping)){
      await page.evaluate(view=>showView(view),view);
      await waitForBanner(page,view,width);
      const scope='['+view+' @ '+width+']',banner=page.locator('#'+view+' > .ds-main-character-banner'),bannerCount=await banner.count();
      console.log('DIAGNOSTICS banner count',JSON.stringify({view,width,bannerCount}));
      assert.equal(bannerCount,1,scope+' direct .ds-main-character-banner count must be 1');
      const img=banner.locator('.ds-main-character-banner__scene img');
      const imageCount=await img.count();
      console.log('DIAGNOSTICS scene image count',JSON.stringify({view,width,imageCount}));
      assert.equal(imageCount,1,scope+' scene img count must be 1');
      try{await img.evaluate(e=>e.decode())}catch(error){
        console.error('DIAGNOSTICS image decode',JSON.stringify({view,width,...await img.evaluate(e=>({src:e.getAttribute('src'),complete:e.complete,naturalWidth:e.naturalWidth}))}));
        throw new Error(scope+' scene image must decode successfully',{cause:error});
      }
      const attributes={src:await img.getAttribute('src'),loading:await img.getAttribute('loading'),decoding:await img.getAttribute('decoding')};
      console.log('DIAGNOSTICS image attributes',JSON.stringify({view,width,...attributes,expectedSrc:'./assets/'+file}));
      assert.equal(attributes.src,'./assets/'+file,scope+' scene img src must match mapped asset');
      assert.equal(attributes.loading,'lazy',scope+' scene img loading must be lazy');
      assert.equal(attributes.decoding,'async',scope+' scene img decoding must be async');
      const layout=await banner.evaluate(e=>{
        const image=e.querySelector('img'),r=e.getBoundingClientRect(),i=image.getBoundingClientRect(),s=getComputedStyle(e);
        return {display:s.display,columns:s.gridTemplateColumns,sceneWidth:getComputedStyle(image).width,left:r.left,right:r.right,imageLeft:i.left,imageRight:i.right,width:innerWidth,documentWidth:document.documentElement.scrollWidth,decoded:image.naturalWidth,heroScroll:e.scrollWidth,heroWidth:e.clientWidth,first:e.parentElement.firstElementChild===e,children:[...e.parentElement.children].map(n=>({tag:n.tagName,id:n.id,className:n.className})),agent:e.querySelectorAll('#aiBanner').length};
      });
      console.log('DIAGNOSTICS banner layout',JSON.stringify({view,width,layout,reference}));
      if(file.startsWith('heroes/')){
        const wide=view!=='investmentCommittee',art=await banner.evaluate(e=>{const scene=e.querySelector('figure'),img=scene.querySelector('img'),r=scene.getBoundingClientRect(),i=img.getBoundingClientRect(),s=getComputedStyle(img);return {variant:e.dataset.sceneVariant,width:r.width,height:r.height,imageWidth:i.width,imageHeight:i.height,fit:s.objectFit,mask:s.maskImage};});
        assert.equal(art.variant,wide?'illustration-wide-218':'illustration-218',scope+' intended illustration layout');
        assert.equal(layout.display,wide||width===390?'flex':'grid',scope+' responsive illustration display');
        assert.equal(art.fit,'contain',scope+' full illustration retained');assert.equal(art.mask,'none',scope+' illustration has no fade mask');
        assert.ok(art.width>0&&art.height>0,scope+' visible illustration slot');
        assert.ok(Math.abs(art.imageWidth-art.width)<=1&&Math.abs(art.imageHeight-art.height)<=1,scope+' image fills its persistent illustration slot');
        if(wide||width===390)assert.ok(Math.abs(art.width/art.height-(wide?3:1))<.02,scope+' wide 3:1 / mobile square illustration');
      }else{
        assert.equal(layout.display,reference.display,scope+' retained banner display must match intake');
        assert.equal(layout.columns,reference.columns,scope+' retained banner grid columns must match intake');
        assert.equal(layout.sceneWidth,reference.sceneWidth,scope+' retained scene image width must match intake');
      }
      assert.ok(layout.first,scope+' banner must be first element in view: '+JSON.stringify(layout.children));
      assert(layout.agent<=1,scope+' at most one #aiBanner inside active banner');
      assert.ok(layout.decoded>0,scope+' decoded image naturalWidth must be positive');
      assert.ok(layout.left>=0&&layout.right<=width+1,scope+' banner bounds must fit viewport');
      assert.ok(layout.imageRight<=layout.right+1,scope+' image right edge must fit banner');
      if(width===1440)assert.ok(layout.imageLeft>layout.left,scope+' desktop scene must be to the right of banner left edge');
      assert.ok(layout.heroScroll<=layout.heroWidth+1,scope+' banner scrollWidth must not exceed clientWidth');
      const overflowingElements=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).flatMap(e=>{
        const r=e.getBoundingClientRect();
        if(!r.width||!r.height||r.right<=innerWidth)return [];
        const s=getComputedStyle(e),details=e.closest('details');
        return [{tag:e.tagName,id:e.id,className:e.getAttribute('class'),boardSlot:e.getAttribute('data-board'),left:r.left,right:r.right,width:r.width,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,display:s.display,minWidth:s.minWidth,maxWidth:s.maxWidth,gridColumns:s.gridTemplateColumns,overflowX:s.overflowX,whiteSpace:s.whiteSpace,detailsOpen:details?.open??null}];
      }));
      console.log('DIAGNOSTICS viewport overflow',JSON.stringify({view,width,documentWidth:layout.documentWidth,overflowingElements}));
      assert.ok(layout.documentWidth<=width,scope+' document scrollWidth must not exceed viewport width');
      if(view==='aiBudget'){
        const budgetCardCount=await page.locator('#aiBudgetCards > *').count();
        console.log('DIAGNOSTICS budget card count',JSON.stringify({view,width,budgetCardCount}));
        assert.ok(budgetCardCount>0,scope+' #aiBudgetCards direct child count must be positive');
      }
      await page.screenshot({path:path.join(out,view+'-'+width+'.png'),fullPage:true});
      results.push({view,width,layout});
    }
    await page.evaluate(()=>showView('agentReview'));
    await waitForBanner(page,'agentReview',width);
    const boardroomSrc=await page.locator('#agentReview > .ds-main-character-banner .ds-main-character-banner__scene img').getAttribute('src');
    const duplicateIds=await page.evaluate(()=>{const ids=Array.from(document.querySelectorAll('[id]'),e=>e.id);return ids.filter((id,index)=>ids.indexOf(id)!==index)});
    const storageUnchanged=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'))===before;
    console.log('DIAGNOSTICS boardroom and document',JSON.stringify({view:'agentReview',width,boardroomSrc,duplicateIdCount:duplicateIds.length,duplicateIds,storageUnchanged}));
    assert.equal(boardroomSrc,'./assets/banner-preview-v1/ai-approval-boardroom-v1.webp','[agentReview @ '+width+'] scene img src must preserve existing boardroom asset');
    assert.deepEqual(duplicateIds,[],'[agentReview @ '+width+'] document duplicate ID count must be 0 after all six views');
    assert.ok(storageUnchanged,'[agentReview @ '+width+'] protected storage value must remain unchanged after all six views');
    await context.close();
  }
  fs.writeFileSync(path.join(out,'ui-results.json'),JSON.stringify(results,null,2));
  console.log('PASS banners-203 UI: six pages at 1440/390, actual images, standard layout, no overflow, preserved cards/boardroom/storage');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
