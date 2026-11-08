// Isolated synthetic browser profile only. No shopping URL is requested.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/wishlist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const results=[];
try{
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,deviceScaleFactor:1});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:200,contentType:'application/javascript',body:''}));
  await context.addInitScript(()=>localStorage.setItem('hani_os_life_v23',JSON.stringify({version:'2.9.15-safe-baseline-bootstrap',wishlistItems:[],ui:{},meta:{},profile:{}})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>typeof openWishlistModal==='function');
  await page.evaluate(()=>{unlockLoginGate();showView('wishlist');openWishlistModal();window.__wishCalls={commit:0,save:0,fetch:0,writes:0};const c=commit,s=save,f=fetch,w=Storage.prototype.setItem;commit=function(...args){window.__wishCalls.commit++;return c(...args)};save=function(...args){window.__wishCalls.save++;return s(...args)};fetch=function(...args){window.__wishCalls.fetch++;return f(...args)};Storage.prototype.setItem=function(...args){window.__wishCalls.writes++;return w.apply(this,args)};window.__wishBefore={state:JSON.stringify(state),storage:JSON.stringify({...localStorage}),keys:Object.keys(localStorage).sort()}});
  await page.locator('#wishlistModal').screenshot({animations:'disabled',path:path.join(out,`edge-${width}-before.png`)});
  // Exercise native browser paste: same default insertion and input event as Ctrl+V, no clipboard permission.
  const url='https://www.apple.com/kr/shop/product/123/blue-phone-case?utm_source=share&color=blue';
  await page.locator('#wishlistQuickLink').focus();await page.keyboard.insertText(url);
  await assert.doesNotReject(()=>page.waitForFunction(()=>document.querySelector('#wishlistName').value==='blue phone case'));
  assert.equal(await page.locator('#wishlistCategory').inputValue(),'전자기기');
  assert.equal(await page.locator('#wishlistNote').inputValue(),'애플\nhttps://www.apple.com/kr/shop/product/123/blue-phone-case?color=blue');
  const preview=await page.evaluate(()=>({calls:{...window.__wishCalls},statePreserved:JSON.stringify(state)===window.__wishBefore.state,storagePreserved:JSON.stringify({...localStorage})===window.__wishBefore.storage,keys:Object.keys(localStorage).sort(),beforeKeys:window.__wishBefore.keys,version:HANI_DISPLAY_VERSION,latestScript:document.scripts[document.scripts.length-1].src,overflow:document.querySelector('#wishlistModal .modal-card').scrollWidth>document.querySelector('#wishlistModal .modal-card').clientWidth,inputHeight:document.querySelector('#wishlistQuickLink').getBoundingClientRect().height}));
  assert.deepEqual(preview.calls,{commit:0,save:0,fetch:0,writes:0});assert.equal(preview.statePreserved,true);assert.equal(preview.storagePreserved,true);assert.deepEqual(preview.keys,preview.beforeKeys);assert.equal(preview.overflow,false);assert.ok(preview.inputHeight>=52);
  await page.locator('#wishlistModal').screenshot({animations:'disabled',path:path.join(out,`edge-${width}-after.png`)});
  await page.locator('#wishlistNote').scrollIntoViewIfNeeded();
  await page.locator('#wishlistModal').screenshot({animations:'disabled',path:path.join(out,`edge-${width}-after-note.png`)});
  await page.locator('#wishlistName').fill('대표님이 수정한 후보');await page.locator('#wishlistPrice').fill('35000');
  await page.locator('#wishlistQuickLink').fill('https://example.com/product/another-item');
  assert.equal(await page.locator('#wishlistName').inputValue(),'대표님이 수정한 후보');assert.equal(await page.locator('#wishlistNote').inputValue(),'애플\nhttps://www.apple.com/kr/shop/product/123/blue-phone-case?color=blue');
  await page.locator('#wishlistSave').click();
  const saved=await page.evaluate(()=>({calls:{...window.__wishCalls},rows:state.wishlistItems.filter(x=>x.name==='대표님이 수정한 후보').map(x=>({name:x.name,price:x.price,note:x.note})),keys:Object.keys(localStorage).sort(),stored:JSON.parse(localStorage.getItem('hani_os_life_v23'))?.wishlistItems?.some(x=>x.name==='대표님이 수정한 후보')}));
  assert.equal(saved.calls.commit,1);assert.equal(saved.calls.save,1);assert.equal(saved.rows.length,1);assert.equal(saved.stored,true);assert.deepEqual(saved.keys,preview.keys);
  await page.evaluate(()=>openWishlistModal(state.wishlistItems.find(x=>x.name==='대표님이 수정한 후보')));assert.equal(await page.locator('#wishlistQuickLink').inputValue(),'');
  assert.deepEqual(errors,[]);results.push({width,preview,saved,errors});await context.close();
 }
 fs.writeFileSync(path.join(out,'edge-results.json'),JSON.stringify({browser:await browser.version(),results},null,2));console.log('PASS Edge PC/390: preview no writes/fetch, preservation, edit, existing save once and persisted read-back; 6 PNGs.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
