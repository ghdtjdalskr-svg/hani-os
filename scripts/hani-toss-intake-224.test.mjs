// Synthetic data only; production parser, Asset Vision contract, and canonical Preview paths.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
import qaSupport from './qa-1st-test-support.cjs';
import {pathToFileURL} from 'node:url';
const source=fs.readFileSync(new URL('../hani-asset-update-v1.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/hani-agent-orchestrator/index.ts',import.meta.url),'utf8');
const header='종목명\t총 수익률\t총 수익금\t1주 평균금액\t현재가\t보유 수량\t평가금\t원금\t일간 수익률\t일간 수익금\t수수료\t세금';
const domestic='테스트전자\t-1.00%\t-2,000원\t100,000원\t99,000원\t2 주\t198,000원\t200,000원\t0.50%\t1,000원\t50원\t300원';
const overseas='테스트테크\t2.00%\t+1,000원\t500,000원\t510,000원\t0.100000 주\t51,000원\t50,000원\t-0.10%\t-50원\t30원\t-';
const sample=`국내주식 500,000원 -1,000원 (0.20%)\n${header}\n${domestic}\n수수료·세금 포함\n해외주식 100,000원 +500원 (0.50%)\n${overseas}`;
const state=()=>({version:'2.9.15-safe-baseline-bootstrap',accounts:[{id:'toss',name:'합성 토스',broker:'토스증권',type:'위탁'}],investmentBrokerSnapshots:[],instruments:[],tasks:[{text:'보존'}]});
function fixture(ui=false){
  const nodes=new Map(),data=state(),before=JSON.stringify(data);let writes=0;
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',dataset:{},setAttribute(){},closest(){return null},querySelectorAll(){return []},scrollIntoView(){},appendChild(){}});return nodes.get(id)};
  const sandbox={window:{},document:{getElementById:id=>ui?node(id):null,createElement:()=>({style:{}})},state:data,console,structuredClone,setTimeout,
    uid:()=> 'synthetic',nullableNum:v=>v==null||v===''?null:Number(v),inferMarket:(ticker,market)=>market||(/^[0-9]/.test(ticker)?'KR':'US'),today:()=> '2026-10-21',officialBrokerSorted:()=>[],
    URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},
    localStorage:{getItem:()=>before,setItem(){writes++;throw Error('No write')},removeItem(){writes++;throw Error('No remove')},clear(){writes++;throw Error('No clear')}},
    save(){writes++;throw Error('No save')},commit(){writes++;throw Error('No commit')},agentApi(){throw Error('No real network')},agentObj:x=>x,intakeImageToDataUrl:async()=> 'data:image/png;base64,synthetic'};
  vm.createContext(sandbox);qaSupport.loadInputHelpers(sandbox);vm.runInContext(main.split(/\r?\n/).find(l=>l.startsWith('function normalizeBrokerHolding(')),sandbox);vm.runInContext(source,sandbox);
  return {api:sandbox.window.HANI_ASSET_UPDATE_V1,sandbox,node,before,writes:()=>writes};
}
const {api}=fixture();
test('Toss supplied sample: named headers map both securities and KRW overseas conversion',()=>{
  const rows=api.parseHoldingsTsv(sample);assert.equal(rows.length,2);
  assert.deepEqual(Array.from(rows,h=>[h.name,h.currentPrice,h.quantity,h.buyPrice,h.evaluationAmount,h.purchaseAmount,h.buyCurrency,h.market,h.pnl,h.returnRate]),[
    ['테스트전자',99000,2,100000,198000,200000,'KRW','KR',-2000,-1],['테스트테크',510000,.1,500000,51000,50000,'KRW','US',1000,2]]);
  assert.equal(rows[1].tax,null);assert.equal(rows[0].fee,50);
  assert.equal(api.holdingCheck(rows[0]).marketSection,'국내주식');assert.equal(api.holdingCheck(rows[1]).marketSection,'해외주식');
  assert.equal(api.holdingCheck(rows[1]).krwConverted,true);assert.equal(api.holdingCheck(rows[1]).status,'ok');
  assert.equal(JSON.stringify(rows).includes('krwConverted'),false,'Preview metadata never extends stored schema');
});
test('header permutation, repeated headers and pipe separators preserve exact mapping',()=>{
  const permutation=[6,0,11,4,8,5,3,7,10,2,9,1],reorder=line=>permutation.map(i=>line.split('\t')[i]).join('\t');
  for(const sep of ['\t',' | ']){
    const input=`국내주식 500,000원\n${reorder(header)}\n${reorder(domestic)}\n해외주식 100,000원\n${reorder(header)}\n${reorder(overseas)}`.replaceAll('\t',sep);
    const rows=api.parseHoldingsTsv(input);assert.equal(rows.length,2);assert.equal(rows[0].currentPrice,99000);assert.equal(rows[1].currentPrice,510000);assert.equal(rows[1].quantity,.1);assert.equal(rows[1].buyPrice,500000);assert.equal(rows[1].purchaseAmount,50000);
  }
});
test('fractional shares, signs, spaces, commas and dash placeholders are source values',()=>{
  const rows=api.parseHoldingsTsv(sample.replace('0.100000 주','0.093771 주').replace('51,000원','47,823원').replace('500,000원\t510,000원','-\t+510,000 원'));
  assert.equal(rows[1].quantity,.093771);assert.equal(rows[1].currentPrice,510000);assert.equal(rows[1].buyPrice,null);assert.equal(rows[1].tax,null);assert.equal(api.holdingCheck(rows[1]).status,'ok');
});
test('2% validation flags disagreement without correcting data; missing is not zero',()=>{
  const rows=api.parseHoldingsTsv(sample.replace('510,000원','610,000원'));assert.equal(api.holdingCheck(rows[1]).status,'mismatch');assert.equal(rows[1].currentPrice,610000);
  for(const [price,status] of [[102,'ok'],[102.001,'mismatch'],[98,'ok'],[97.999,'mismatch'],[null,'missing']])assert.equal(api.holdingCheck({currentPrice:price,quantity:1,evaluationAmount:100}).status,status);
  assert.equal(api.holdingCheck({currentPrice:0,quantity:0,evaluationAmount:0}).status,'ok');
  assert.equal(api.holdingCheck(api.parseHoldingsTsv(sample.replace('510,000원','-'))[1]).status,'missing');
});
test('absent current-price header never falls back to another numeric column; inline badge is ignored',()=>{
  const omit=line=>line.split('\t').filter((_,i)=>i!==4).join('\t');
  const row=api.parseHoldingsTsv(`${omit(header)}\n${omit(domestic)}`)[0];assert.equal(row.currentPrice,null);assert.equal(row.buyPrice,100000);assert.equal(api.holdingCheck(row).status,'missing');
  assert.equal(api.parseHoldingsTsv(sample.replace('테스트전자\t','테스트전자 수수료·세금 포함\t'))[0].name,'테스트전자');
});
test('screenshot JSON contract and Korean header aliases use the same mapper and Preview units',()=>{
  const normalized=api.mergeScreens([api.normalize({financialInstitution:'토스증권',holdings:[{name:'테스트테크',marketSection:'해외주식',market:'US',quantity:.1,averagePrice:500000,currentPrice:510000,valuationAmount:51000,purchaseAmount:50000,buyCurrency:'KRW'}]})]);
  const h=normalized.holdings[0];assert.equal(h.currentPrice,510000);assert.equal(h.buyCurrency,'KRW');assert.equal(api.holdingCheck(h).krwConverted,true);
  const korean=api.mergeHoldings([{'종목명':'테스트테크',marketSection:'해외주식','보유 수량':'0.1 주','1주 평균금액':'500,000원','현재가':'510,000원','평가금':'51,000원','원금':'50,000원'}])[0];
  assert.equal(korean.quantity,.1);assert.equal(korean.currentPrice,510000);assert.equal(korean.buyPrice,500000);assert.equal(api.holdingCheck(korean).krwConverted,true);
  const usd=api.mergeHoldings([{name:'USD visible',marketSection:'해외주식',buyCurrency:'USD',quantity:.1,averagePrice:100,currentPrice:110,valuationAmount:11}])[0];
  assert.equal(usd.buyCurrency,'USD');assert.equal(api.holdingCheck(usd).krwConverted,false);
});
test('existing Kiwoom, generic Toss and Hana header formats keep parsing',()=>{
  for(const input of ['종목코드\t종목명\t보유수량\t매입가\t현재가\t평가금액\t매입금액\nA0038A0\t합성키움\t2\t100\t110\t220\t200','종목명\t수량\t평균단가\t현재가\t평가금액\n합성토스\t2\t100\t110\t220','종목명\t종목코드\t수량\t평균매입가\t현재가\t평가금액\n합성하나\tA0038A0\t2\t100\t110\t220']){
    const rows=api.parseHoldingsTsv(input);assert.equal(rows.length,1);assert.equal(rows[0].currentPrice,110);assert.equal(rows[0].quantity,2);assert.equal(rows[0].buyPrice,100);
  }
});
test('Asset Vision strict schema permits and requires currentPrice plus explicit source units/section',async()=>{
  const start=edge.indexOf('const nullableString ='),end=edge.indexOf('async function extractIntakeImage(',start),context={};vm.createContext(context);
  vm.runInContext(stripTypeScriptTypes(edge.slice(start,end))+'\nthis.schema=ASSET_HOLDING_SCHEMA;',context);
  for(const key of ['currentPrice','market','marketSection','buyCurrency']){assert.ok(context.schema.properties[key]);assert.ok(context.schema.required.includes(key));}
  for(const line of ['1주 평균금액→averagePrice','현재가→currentPrice','보유 수량→quantity','평가금→valuationAmount','원금→purchaseAmount','2%','buyCurrency=KRW'])assert.ok(edge.includes(line),line);
  // Execute the actual image request builder with synthetic I/O: inspect the delivered prompt/schema.
  const fn=stripTypeScriptTypes(edge.slice(end,edge.indexOf('\nasync function ',end+10)));
  let request;Object.assign(context,{INTAKE_VISION_SCHEMA:{},extractOpenAIOutputText:()=>JSON.stringify({target_hint:'asset',holdings:[],warnings:[]}),fetch:async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({})}}});
  vm.runInContext(fn,context);await context.extractIntakeImage('synthetic','data:image/png;base64,synthetic','asset','synthetic.png');
  assert.match(request.instructions,/현재가→currentPrice/);assert.match(request.instructions,/열 위치가 아니라 헤더 이름/);assert.ok(request.text.format.schema.properties.holdings.items.required.includes('currentPrice'));
});
test('actual paste Preview displays current price, KRW conversion and mismatch; cancel writes zero',()=>{
  const f=fixture(true);f.node('assetCaptureAccount').value='toss';f.node('assetCaptureAccount').onchange();
  f.node('assetCapturePasteZone').onpaste({preventDefault(){},clipboardData:{getData:()=>sample.replace('510,000원','610,000원')}});
  const html=f.node('assetCapturePreview').innerHTML;assert.equal((html.match(/asset-position-row/g)||[]).length,2);assert.match(html,/99,000/);assert.match(html,/610,000/);assert.match(html,/원화 환산\(KRW\)/);assert.match(html,/2% 초과/);assert.match(html,/value="0.1"/);
  f.node('assetPreviewCancel').onclick();assert.equal(f.node('assetCapturePreview').innerHTML,'');assert.equal(f.writes(),0);assert.equal(JSON.stringify(f.sandbox.state),f.before);
});
test('canonical screenshot analysis → Preview validates extraction without storage writes',async()=>{
  for(const linked of [true,false]){
    const f=fixture(true);f.node('assetCaptureAccount').value='toss';f.node('assetCaptureAccount').onchange();f.node('assetCaptureFiles').files=[{name:'synthetic.png'}];f.node('assetCaptureFiles').onchange();
    f.sandbox.window.HaniAssetMarket={resolveHoldings:async()=>linked};f.sandbox.agentApi=async action=>{assert.equal(action,'extract_intake_image');return {extraction:{target_hint:'asset',financialInstitution:'토스증권',asOfDate:'2026-10-21',currentAsset:51000,valuationAmount:51000,holdings:[{name:'테스트테크',market:'US',marketSection:'해외주식',buyCurrency:'KRW',quantity:.1,averagePrice:500000,currentPrice:610000,valuationAmount:51000,purchaseAmount:50000}]}}};
    await f.node('assetCaptureAnalyze').onclick();const html=f.node('assetCapturePreview').innerHTML;assert.match(html,/610,000/,f.node('assetCaptureStatus').textContent);assert.match(html,/원본/);assert.match(html,/원화 환산\(KRW\)/);assert.match(html,/2% 초과/);assert.equal(f.writes(),0);assert.equal(JSON.stringify(f.sandbox.state),f.before);
  }
});

// Optional real-browser Preview only: node this-file <playwright/index.mjs> <msedge.exe>
if(process.argv[2]){
  const {chromium}=await import(pathToFileURL(process.argv[2]).href),browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
  try{
    const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),section=html.slice(html.indexOf('<div class="card full asset-capture-v1"'),html.indexOf('<section id="ledger"'));
    for(const width of [1440,390]){
      const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><body>${section}</body>`}));await page.goto('http://toss-fixture.invalid/');
      for(const css of ['hani-style-01.css','hani-style-07.css'])await page.addStyleTag({content:fs.readFileSync(new URL('../'+css,import.meta.url),'utf8')});
      await page.evaluate(data=>{window.state=data;window.before=JSON.stringify(data);window.writes=0;window.uid=()=> 'synthetic';window.nullableNum=v=>v==null?null:Number(v);window.inferMarket=(t,m)=>m||'US';window.today=()=> '2026-10-21';localStorage.setItem('hani_os_life_v23',before);Storage.prototype.setItem=()=>{writes++;throw Error('No write')};window.save=()=>{writes++;throw Error('No save')};window.agentApi=()=>{throw Error('No Cloud')}},state());
      await page.addScriptTag({content:main.split(/\r?\n/).find(l=>l.startsWith('function normalizeBrokerHolding('))});await page.addScriptTag({content:source});await page.selectOption('#assetCaptureAccount','toss');
      await page.evaluate(input=>{const clipboardData=new DataTransfer();clipboardData.setData('text/plain',input);document.querySelector('#assetCapturePasteZone').dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}))},sample.replace('510,000원','610,000원'));
      assert.equal(await page.locator('.asset-position-row').count(),2);assert.equal(await page.locator('[data-position="1"][data-key="quantity"]').inputValue(),'0.1');assert.match(await page.locator('#assetCapturePreview').innerText(),/원화 환산\(KRW\)/);assert.match(await page.locator('#assetCapturePreview').innerText(),/2% 초과/);
      await page.screenshot({path:`.ai-budget-private/kiwoom-224/toss-${width}.png`,fullPage:true});await page.click('#assetPreviewCancel');assert.equal(await page.locator('#assetCapturePreview').innerText(),'');
      assert.deepEqual(await page.evaluate(()=>({writes,unchanged:JSON.stringify(state)===before&&localStorage.getItem('hani_os_life_v23')===before})),{writes:0,unchanged:true});assert.deepEqual(errors,[]);await page.close();console.log(`PASS Toss browser ${width}: source fields, fractional qty, KRW note, warning, cancel, write0`);
    }
  }finally{await browser.close()}
}
