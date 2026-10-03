'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.previewWrites=0;Storage.prototype.setItem=function(){window.previewWrites++;throw Error('Preview attempted storage write');};window.fetch=()=>{throw Error('Preview attempted network fetch');};});
  await page.goto(process.env.HANI_PORTFOLIO_PREVIEW_URL||'http://127.0.0.1:8332/portfolio-live-preview.html');
  assert.match(await page.locator('[data-p-coverage]').innerText(),/PARTIAL/);
  assert.match(await page.locator('[data-p-coverage]').innerText(),/2\/2/);
  assert.match(await page.locator('[data-p-coverage]').innerText(),/통화 미확인 투자기록 1개/);
  assert.equal(await page.locator('tbody tr').count(),2);
  await page.locator('[data-p-currency]').selectOption('UNKNOWN');assert.match(await page.locator('tbody').innerText(),/코드 미확인 투자종목/);assert.match(await page.locator('.portfolio-treemap').innerText(),/표시할 수 없습니다/);await page.locator('[data-p-currency]').selectOption('KRW');
  assert.match(await page.locator('.portfolio-summary').innerText(),/1,100,000/);
  const areas=await page.locator('.portfolio-treemap>div').evaluateAll(els=>els.map(el=>parseFloat(el.style.width)*parseFloat(el.style.height)));assert.ok(Math.abs(areas[0]/areas[1]-700000/400000)<.00001,'treemap must use market value');
  await page.locator('summary').first().click();assert.match(await page.locator('details[open]').innerText(),/NO_DATA/);
  await page.locator('[data-p-currency]').selectOption('USD');assert.match(await page.locator('.portfolio-summary').innerText(),/750/);assert.equal(await page.locator('tbody tr').count(),1);
  await page.locator('[data-p-account]').selectOption('a');assert.equal(await page.locator('[data-p-currency]').inputValue(),'KRW');
  await page.locator('#scenario').selectOption('cash');assert.match(await page.locator('[data-p-coverage]').innerText(),/포트폴리오 비중/);assert.match(await page.locator('tbody tr').first().innerText(),/58.3%/);
  await page.locator('[data-p-tab="allocation"]').click();for(const dim of ['instrument','account','asset_class','market','currency']){await page.locator('[data-p-dimension]').selectOption(dim);assert.ok(await page.locator('.portfolio-bars>div').count()>0);}
  await page.locator('[data-p-tab="overview"]').click();
  fs.mkdirSync(path.resolve(__dirname,'../artifacts/portfolio-live'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../artifacts/portfolio-live/desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('.portfolio-treemap').isVisible(),false);assert.equal(await page.locator('.portfolio-mobile-bars').isVisible(),true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('.portfolio-table-wrap').evaluate(el=>el.scrollWidth<=el.clientWidth));assert.match(await page.locator('h4').innerText(),/현금 제외/);
  await page.screenshot({path:path.resolve(__dirname,'../artifacts/portfolio-live/mobile.png'),fullPage:true});
  await page.locator('#scenario').selectOption('empty');assert.match(await page.locator('[data-p-coverage]').innerText(),/보유기록 없음/);
  assert.equal(await page.evaluate(()=>window.previewWrites),0);assert.deepEqual(errors,[]);
  console.log('PASS: desktop value-area treemap, partial coverage, source drilldown, currency/account scope, confirmed cash weights, allocation tabs, mobile layout, empty state, no storage/network writes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
