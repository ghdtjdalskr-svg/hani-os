const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<html><body><section id="portfolioLivePreview"></section></body></html>');
  await page.addStyleTag({path:path.join(root,'hani-portfolio-preview.css')});
  await page.addScriptTag({path:path.join(root,'hani-market-data.js')});
  await page.evaluate(()=>{
   Storage.prototype.setItem=()=>{throw Error('unexpected write');};
   const holdings=Array.from({length:15},(_,i)=>({instrumentId:'i'+i,name:'TIGER 테스트 투자종목 '+i,ticker:String(360750+i),quantity:20-i,buyPrice:100,buyCurrency:'KRW'}));
   const snapshot=(month,delta)=>({mode:'actual',status:'confirmed',period:month,holdingListMode:'complete',accounts:[{accountId:'a',enabled:true,holdings:holdings.map(h=>({...h,quantity:h.quantity-delta}))}]});
   const state={accounts:[{id:'a',name:'ISA'}],instruments:holdings.map(h=>({id:h.instrumentId,ticker:h.ticker,market:'KR'})),investmentBrokerSnapshots:[snapshot('2026-09',3),snapshot('2026-10',0)]};
   window.HaniAssetMarket={analyticsSource:()=>({state,stocks:holdings.map(h=>({symbol:h.ticker,name:h.name,market:'KOSPI',currency:'KRW'})),quotes:holdings.map((h,i)=>({symbol:h.ticker,currency:'KRW',lastPrice:110+i,timestamp:new Date().toISOString()}))})};
  });
  await page.addScriptTag({path:path.join(root,'hani-asset-market-view.js')});
  assert.equal(await page.locator('.portfolio-treemap>div').count(),15);
  assert.match(await page.locator('.portfolio-quantity-change').first().textContent(),/\+3주/);
  const boxes=await page.locator('.portfolio-treemap').evaluate(el=>{const p=el.getBoundingClientRect();return [...el.children].map(c=>{const r=c.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+1&&r.top>=p.top&&r.bottom<=p.bottom+1;});});
  assert.ok(boxes.every(Boolean),'all tiles contained');
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
  await page.screenshot({path:path.join(root,'artifacts/portfolio-map-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'390px overflow');
  await page.screenshot({path:path.join(root,'artifacts/portfolio-map-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: 15 treemap tiles contained, +3 previous-month quantity, 390px no overflow, console 0, no writes');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
