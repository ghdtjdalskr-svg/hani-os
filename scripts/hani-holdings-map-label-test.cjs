const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {mkdir}=require('node:fs/promises');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.HANI_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      Storage.prototype.setItem=()=>{throw Error('Unexpected storage write');};
      window.fetch=()=>{throw Error('Unexpected network request');};
    });
    await page.goto(pathToFileURL(path.resolve(__dirname,'../docs/preview/hani-holdings-map-labels.html')).href);
    const before=await page.evaluate(()=>JSON.stringify(source.state));
    const tiles=page.locator('.portfolio-treemap>div');
    assert.equal(await tiles.count(),8);
    assert.deepEqual(await tiles.locator('span').allTextContents(),['미국S&P500','미국나스닥100','미국배당다우존스','삼성전자','미국테크TOP10','TIGERX 일반종목','미국배당다우존스','미국S&P500']);
    assert.match(await tiles.first().getAttribute('title'),/^TIGER 미국S&P500 /);
    await tiles.first().hover();
    assert.equal(await page.locator('.portfolio-table-wrap summary').first().textContent(),'TIGER 미국S&P500');
    await page.locator('[data-p-tab="holdings"]').click();
    assert.equal(await page.locator('summary').first().textContent(),'TIGER 미국S&P500');
    await page.locator('[data-p-tab="overview"]').click();
    assert.equal(await page.evaluate(()=>JSON.stringify(source.state)),before);
    const screenshots=path.resolve(__dirname,'../artifacts/holdings-map-labels');
    await mkdir(screenshots,{recursive:true});
    await page.screenshot({path:path.join(screenshots,'desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.locator('.portfolio-treemap').isVisible(),false);
    assert.equal(await page.locator('.portfolio-mobile-bars b').first().textContent(),'TIGER 미국S&P500');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(screenshots,'mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS: map-only ETF labels, full-name tooltip/table/mobile, prefix boundary, unchanged source, desktop/mobile rendering without writes or fetches');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
