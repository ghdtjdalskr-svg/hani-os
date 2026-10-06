const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{makeServer}=require('./hani-character-archive-preview.cjs');
const data=require('../hani-character-archive-data.js');
(async()=>{const server=makeServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;let browser;
const output=path.resolve(__dirname,'../artifacts/character-archive'),results=[];fs.mkdirSync(output,{recursive:true});
try{browser=await chromium.launch({headless:true,executablePath:process.env.HANI_QA_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const width of [1440,390]){const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',req=>requests.push(req.url()));await page.goto(origin);await page.waitForSelector('[data-character-card="mir"]');
assert.equal(await page.locator('[data-character-card]').count(),10);assert.equal(await page.locator('.ca-grid img').count(),9);assert.equal(await page.locator('[data-character-card="mir"] img').count(),0);
for(const portrait of await page.locator('.ca-grid img').all()){await portrait.scrollIntoViewIfNeeded();await portrait.evaluate(image=>image.decode());}
assert.equal(await page.locator('.ca-grid img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true);
await page.locator('.ca-group-cover img').evaluate(i=>i.decode());assert.equal(await page.locator('.ca-group-cover img').evaluate(i=>i.naturalWidth>0),true);
await page.locator('.ca-ending-photo').evaluate(i=>{i.loading='eager';return i.decode();});await page.locator('.ca-essence').screenshot({path:path.join(output,`${width}-ending.png`)});
await page.locator('.ca-relationship-grid').screenshot({path:path.join(output,`${width}-color-relationships.png`)});
assert.equal(await page.locator('.ca-person-label .ca-monitor-screen').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>20&&r.height>=20;}),true,'compact MIR screen visible');
assert.equal(await page.locator('.ca-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width===1440?5:2);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.locator('.ca-hero').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${width}-overview.png`)});
await page.locator('.ca-grid').screenshot({path:path.join(output,`${width}-grid.png`)});
for(const c of data.characters){await page.locator(`.ca-grid [data-character-profile="${c.id}"]`).click();assert.equal(await page.locator('#caDetailTitle').textContent(),c.nameKo);assert.equal(await page.locator('#caDetailTitle').evaluate(el=>el===document.activeElement),true);
assert.equal(await page.locator(`.ca-grid [data-character-profile="${c.id}"]`).getAttribute('aria-expanded'),'true');
assert.equal(await page.locator('#caDetail .ca-visual-story').count(),1);assert.equal(await page.locator('.ca-mir').count(),0);
assert.equal(await page.locator('#caDetail .ca-axis-graphic').textContent(),c.axis.replace(/\s*↔\s*/,'↔'));
assert.equal(await page.locator('#caDetail .ca-orbit').count(),1);assert.equal(await page.locator('#caDetail .ca-personality-art').count(),1);
if(c.id==='hani'){await page.locator('#caDetail .ca-visual-story').screenshot({path:path.join(output,`${width}-identity-graphic.png`)});await page.locator('#caDetail .ca-personality-art').screenshot({path:path.join(output,`${width}-personality-graphic.png`)});}
await page.locator('#caDetail details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${c.id} no horizontal overflow`);
if(c.id==='hina')await page.locator('.ca-connection-cards').screenshot({path:path.join(output,`${width}-connections.png`)});
if(c.id==='mir'){assert.equal(await page.locator('#caDetail img').count(),0);await page.locator('#caDetail').screenshot({path:path.join(output,`${width}-mir-detail.png`)});}
await page.locator('#caDetail details').evaluateAll(nodes=>nodes.forEach(n=>n.open=false));}
assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(errors,[]);assert.equal(requests.some(url=>new URL(url).origin!==origin),false);
// Dark finish tokens, without changing stored preference or real application state.
await page.locator('#characterArchive').evaluate(el=>{el.style.setProperty('--text-primary','#f4f5f8');el.style.setProperty('--text-secondary','#c0c8d5');el.style.setProperty('--surface-panel','#191e28');el.style.setProperty('--surface-raised','#242c38');el.style.setProperty('--border-subtle','#434b59');});
await page.screenshot({path:path.join(output,`${width}-dark.png`)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
results.push({width,cards:10,loadedProfiles:9,details:10,overflow:false,consoleErrors:errors,storageWrites:false,externalRequests:false,darkTokens:true});await context.close();}
fs.writeFileSync(path.join(output,'qa.json'),JSON.stringify({scope:'Isolated real Archive renderer, not full authenticated OS',results,fullOsRegression:'UNVERIFIED',production:'NOT DEPLOYED'},null,2));console.log('PASS: isolated Chromium 1440/390, 10 card/detail interactions, 9 loaded portraits, MIR no image, accordion/focus, no horizontal overflow, zero console errors/storage/external requests.');
}finally{if(browser)await browser.close();server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
