// Private stdin session stays in Node memory; browser receives market data only.
// Actual cache + synthetic one-share holdings. Not a real-user login/phone test.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const url='https://qmgikfdwjzmhkwadycxk.supabase.co';
const key='sb_publishable_Z0YkkRSJIo5hs00YNcMOdQ__PA5BAj5';
const owner='e1c08077-6c94-4652-b017-3760f42aa1ad';
const sdkMode=process.argv.includes('--sdk');
let stage='private-input',browser;
(async()=>{
  let raw='';for await(const part of process.stdin){raw+=part;if(Buffer.byteLength(raw)>32768)throw Error('limit');}
  const {session}=JSON.parse(raw);raw='';
  assert.equal(session.userId,owner);assert.ok(session.expires_at*1000>Date.now()+60000);
  async function read(resource,max){
    const r=await fetch(url+resource,{headers:{apikey:key,Authorization:'Bearer '+session.access_token},redirect:'error',signal:AbortSignal.timeout(12000),cache:'no-store'});
    assert.ok(r.ok);const body=await r.text();assert.ok(Buffer.byteLength(body)<=max);return body;
  }
  stage='owner-check';const user=JSON.parse(await read('/auth/v1/user',65536));assert.equal(user.id,owner);assert.equal(user.is_anonymous,false);
  let sdkSource='';if(sdkMode){const r=await fetch('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');assert.ok(r.ok);sdkSource=await r.text();}
  stage='cache-read';const prefix='/storage/v1/object/authenticated/hani-market-cache/'+owner+'/';
  const latest=JSON.parse(await read(prefix+'latest.json?preview='+Date.now(),65536));
  assert.equal(latest.version,1);assert.ok(latest.stocks.length>0&&latest.stocks.length<=200);
  const files={'fixture/latest.json':latest};
  for(const s of latest.stocks){
    const ref=latest.charts[s.symbol+'/1M'];assert.match(ref,/^charts\/[a-f0-9]{64}\.json$/);
    const body=await read(prefix+ref,262144);assert.equal(createHash('sha256').update(body).digest('hex'),ref.slice(7,-5));
    const chart=JSON.parse(body);assert.equal(chart.symbol,s.symbol);assert.equal(chart.period,'1M');files['fixture/'+ref]=chart;
  }
  stage='catalog-read';const catalog=JSON.parse(await read(prefix+'catalog/index.json?preview='+Date.now(),262144));files['fixture/catalog/index.json']=catalog;
  const catalogRows=[];for(const ref of catalog.markets.NASDAQ.refs){assert.match(ref,/^catalog\/[a-f0-9]{64}\.json$/);const body=await read(prefix+ref,262144);assert.equal(createHash('sha256').update(body).digest('hex'),ref.slice(8,-5));const chunk=JSON.parse(body);files['fixture/'+ref]=chunk;catalogRows.push(...chunk.rows);}
  const newStock=catalogRows.find(s=>s.symbol.length>=2&&!latest.stocks.some(x=>x.symbol===s.symbol));assert.ok(newStock);
  const fixture={version:'2.9.15-safe-baseline-bootstrap',accounts:[{id:'fixture',name:'검증용 계좌 · 실제 보유 아님'}],instruments:[],transactions:[],snapshots:[],ui:{series:['total']},meta:{},investmentBrokerSnapshots:[{id:'fixture',period:'2026-09',mode:'actual',status:'confirmed',accounts:[{accountId:'fixture',enabled:true,holdings:latest.stocks.map((s,i)=>({id:'test-'+i,name:s.name,ticker:s.symbol,quantity:1,currency:s.currency,evaluationAmount:null}))}]}]};
  stage='browser-render';browser=await chromium.launch({headless:true,executablePath:process.env.HANI_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({viewport:{width:1440,height:1050},timezoneId:'Asia/Seoul'});
  await context.route('**/*',async route=>{
    const u=new URL(route.request().url()),method=route.request().method();
    if(sdkMode&&u.href==='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'&&method==='GET')return route.fulfill({body:sdkSource,contentType:'text/javascript'});
    if(sdkMode&&u.origin===url&&method==='GET'&&(u.pathname==='/auth/v1/user'||new RegExp('^/storage/v1/object/(authenticated/)?hani-market-cache/'+owner+'/(latest[.]json|charts/[a-f0-9]{64}[.]json|catalog/(index|[a-f0-9]{64})[.]json)$').test(u.pathname)))return route.continue();
    if(u.origin!=='https://hani-preview.test')return route.abort();
    const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
    if(!file.startsWith(root+path.sep)||!['.html','.js','.css','.png','.webp','.svg','.woff2'].includes(path.extname(file)))return route.abort();
    try{await route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});}catch{await route.abort();}
  });
  await context.addInitScript(s=>{localStorage.setItem('hani_os_life_v23',JSON.stringify(s));localStorage.setItem('hani_os_gate_session_v2','1');},fixture);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.name));page.on('dialog',d=>d.dismiss());
  await page.goto('https://hani-preview.test/',{waitUntil:'networkidle'});
  if(sdkMode){
    stage='authenticated-browser-sdk';
    const valid=await page.evaluate(async({url,key,session,owner})=>{
      const client=supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {data,error}=await client.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});
      if(error||data.user?.id!==owner||data.user?.is_anonymous)return false;
      cloudClient=client;return true;
    },{url,key,session,owner});assert.equal(valid,true);
  }
  await page.evaluate(({files,sdkMode})=>{
    if(document.querySelector('meta[name="hani-market-cache"]')?.content!=='hani-market-cache')throw Error('Runtime cache config missing');
    unlockLoginGate();if(!sdkMode)cloudClient={auth:{getSession:async()=>({data:{session:{access_token:'nonsecret-test-session',user:{id:'fixture'}}}})},storage:{from:()=>({download:async name=>files[name]?{data:new Blob([JSON.stringify(files[name])])}:{error:{message:'not seeded'}}})}};
    window.marketWrites=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='hani_os_life_v23')window.marketWrites++;return original.call(this,k,v);};
    window.marketBefore=JSON.stringify(state);showView('asset');
  },{files,sdkMode});
  await page.locator('#marketStatus').filter({hasText:'PC 마지막 수집'}).waitFor();await page.locator('#marketChart svg').waitFor();
  const n=latest.stocks.length;assert.match(await page.locator('#marketCoverage').innerText(),new RegExp(n+'/'+n));
  if(n>6)await page.locator('#marketMore').click();
  assert.equal(await page.locator('.market-holding').count(),n);
  for(let i=0;i<n;i++){
    await page.locator('.market-holding').nth(i).click();await page.locator('#marketChart svg').waitFor();
    assert.match(await page.locator('#marketInstrument').innerText(),new RegExp(latest.stocks[i].symbol.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    const quote=latest.quotes.find(q=>q.symbol===latest.stocks[i].symbol);
    assert.ok(quote);const displayed=await page.locator('#marketPrice').innerText();
    assert.equal(Number(displayed.replace(/[^\d.-]/g,'')),Number(Number(quote.lastPrice).toFixed(quote.currency==='USD'?2:0)));
  }
  await page.locator('[data-market-period="1Y"]').click();await page.locator('#marketChart').filter({hasText:'미수집'}).waitFor();
  await page.locator('[data-market-period="1M"]').click();await page.locator('#marketChart svg').waitFor();
  await page.locator('.market-holding').first().click();await page.locator('#marketChart svg').waitFor();
  if(n>6)await page.locator('#marketMore').click();
  await page.evaluate(()=>{
    for(const el of document.querySelectorAll('body *'))if(!el.closest('#assetMarket')&&['fixed','sticky'].includes(getComputedStyle(el).position))el.style.visibility='hidden';
    const banner=document.createElement('p');banner.textContent='개발 검증 · 실제 수집 시세 · 수량 1주 가상 계좌 · 운영 미반영';banner.style.cssText='padding:12px;background:#fff2d5;color:#7c510b';document.getElementById('assetMarket').prepend(banner);
  });
  const artifacts='C:/Users/홍성민/Documents/HANI_OS_DEV/artifacts';
  await page.locator('#assetMarket').screenshot({path:path.join(artifacts,'toss-market-live-cache.png')});
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('#marketChart svg')?.viewBox.baseVal.width<=400);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.locator('#assetMarket').screenshot({path:path.join(artifacts,'toss-market-live-cache-mobile.png')});
  assert.equal(await page.evaluate(()=>window.marketWrites),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)===window.marketBefore),true);assert.deepEqual(errors,[]);
  await page.evaluate(()=>{showView('investment');activateInvestmentTab('investManage');});
  await page.locator('#instrumentLookupMarket').selectOption('NASDAQ');await page.locator('#instrumentLookupQuery').fill(newStock.symbol);await page.locator('#instrumentLookupButton').click();
  const candidate=page.locator('#instrumentLookupResults button').filter({hasText:' · '+newStock.symbol+' · '});await candidate.waitFor();await candidate.click();
  assert.equal(await page.locator('#instrumentTicker').inputValue(),newStock.symbol);assert.equal(await page.locator('#instrumentName').inputValue(),newStock.name);
  assert.match(await page.locator('#instrumentLookupStatus').innerText(),/아직 저장되지/);assert.equal(await page.evaluate(()=>window.marketWrites),0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({success:true,stage:sdkMode?'authenticated-sdk-browser-synthetic-holdings':'live-cache-browser-synthetic-holdings',symbols:n,chartCount:n,collectedAt:latest.collectedAt}));
})().catch(()=>{console.log(JSON.stringify({success:false,stage}));process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
