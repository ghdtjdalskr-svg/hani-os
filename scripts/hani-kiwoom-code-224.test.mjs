// Synthetic holdings only. Executes the production parser, matcher and canonical paste/Preview event.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import qaSupport from './qa-1st-test-support.cjs';
import {pathToFileURL,fileURLToPath} from 'node:url';
const source=fs.readFileSync(new URL('../hani-asset-update-v1.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const key='hani_os_life_v23';
const paste='A0038A0\t-500\t10,100\t50,500\t5\t0\t0\t10,000\t\nKODEX 테스트로봇\t-0.99\t10,000\t50,000\t5\t2\t0\t20.00\t\nA379810\t-1,000\t20,000\t200,000\t10\t0\t0\t19,800\t\nKODEX 미국나스닥100\t-0.50\t19,900\t199,000\t10\t1\t0\t80.00\t';
const headers='종목코드\t평가손익\t매입가\t매입금액\t보유수량\t전일매수수량\t수수료\t전일종가\t신용구분\n종목명\t수익률(%)\t현재가\t평가금액\t매매가능수량\t금일매수수량\t세금\t보유비중(%)\t대출일\n';
const existing=[{id:'robot',instrumentId:'master-robot',ticker:'0038A0',name:'KODEX 미국휴머노이드로봇',quantity:1,buyPrice:1},{id:'nasdaq',ticker:'379810',name:'KODEX 미국나스닥100',quantity:1,buyPrice:1}];
const makeState=()=>({version:'2.9.15-safe-baseline-bootstrap',accounts:[{id:'isa',name:'합성 ISA',type:'중개형 ISA',broker:'키움증권'}],instruments:[],investmentBrokerSnapshots:[{mode:'positions',status:'confirmed',period:'2026-10',snapshotDate:'2026-10-20',accounts:[{enabled:true,accountId:'isa',holdings:structuredClone(existing)}]}],tasks:[{text:'원본 보존'}]});
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture(ui=false){
  const nodes=new Map(),state=makeState(),raw=JSON.stringify(state,null,2)+'\n';let writes=0;
  const node=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',innerHTML:'',textContent:'',dataset:{},setAttribute(){},closest(){return null},querySelectorAll(){return []},scrollIntoView(){}});return nodes.get(id)};
  const sandbox={window:{},document:{getElementById:id=>ui?node(id):null},console,structuredClone,state,
    uid:()=> 'synthetic-id',nullableNum:value=>value===null||value===undefined||value===''?null:Number(value),
    inferMarket:(ticker,market)=>market||(/^[0-9][0-9A-Z]{5}$/.test(ticker)?'KR':'US'),today:()=> '2026-10-21',setTimeout,
    localStorage:{getItem:k=>k===key?raw:null,setItem(){writes++;throw Error('Preview must not write')},removeItem(){writes++;throw Error('Preview must not remove')},clear(){writes++;throw Error('Preview must not clear')}},
    save(){writes++;throw Error('Preview must not save')},commit(){writes++;throw Error('Preview must not commit')},agentApi(){throw Error('Text must not call lookup/Cloud')},exportData(){throw Error('Preview must not export')}};
  vm.createContext(sandbox);qaSupport.loadInputHelpers(sandbox);
  vm.runInContext(main.split(/\r?\n/).find(line=>line.startsWith('function normalizeBrokerHolding(')),sandbox);
  vm.runInContext(source,sandbox);
  return {api:sandbox.window.HANI_ASSET_UPDATE_V1,nodes,node,sandbox,raw,writes:()=>writes};
}
const {api}=fixture();
test('one intake normalizer strips exactly one valid KRX prefix and preserves US/invalid codes',()=>{
  for(const [input,expected] of [['A0038A0','0038A0'],['A0064K0','0064K0'],['A379810','379810'],['379810','379810'],['0038A0','0038A0'],['AAPL','AAPL'],['AMZN','AMZN'],['A','A'],[' a0038a0 ','0038A0'],[' aapl ','AAPL'],['amzn','AMZN'],['a0064k0','0064K0'],['AA0038A0','AA0038A0'],['A12345','A12345'],['AABC123','AABC123'],[' A0038A! ','A0038A!'],['',''],[null,'']])assert.equal(api.normalizeIntakeCode(input),expected,String(input));
});
test('two-row Kiwoom pairs preserve broker names and all source columns, with and without headers',()=>{
  for(const input of [paste,headers+paste]){
    const rows=plain(api.parseHoldingsTsv(input));assert.equal(rows.length,2);
    assert.deepEqual(rows.map(h=>[h.ticker,h.name,h.quantity,h.buyPrice,h.currentPrice,h.evaluationAmount,h.purchaseAmount]),[
      ['0038A0','KODEX 테스트로봇',5,10100,10000,50000,50500],['379810','KODEX 미국나스닥100',10,20000,19900,199000,200000]]);
    assert.equal(rows[0].pnl,-500);assert.equal(rows[1].returnRate,-0.5);
  }
});
test('normalized code preserves existing name, but a known instrument conflict cannot reuse stored identity',()=>{
  const rows=api.parseHoldingsTsv(paste),before=JSON.stringify(existing),merged=plain(api.mergeWithExistingHoldings(rows,existing));
  assert.equal(merged.length,2);assert.equal(merged[0].id,'robot');assert.equal(merged[0].name,existing[0].name);
  assert.equal(merged[0].quantity,5);assert.equal(merged[0].buyPrice,10100);assert.equal(merged[1].quantity,10);assert.equal(JSON.stringify(existing),before);
  const shadow=[{ticker:'999999',name:'KODEX 테스트로봇'},...existing];
  const matched=api.previewHolding({...rows[0],instrumentId:'wrong-guessed-master'},shadow);
  assert.notEqual(matched.shown.id,'robot');assert.equal(matched.shown.name,'KODEX 테스트로봇');assert.equal(matched.brokerName,'');assert.equal(matched.matched,false);const exact=api.previewHolding(rows[0],shadow);assert.equal(exact.shown.id,'robot');assert.equal(exact.matched,true);
  assert.equal(api.mergeWithExistingHoldings([rows[0]],shadow).length,3);
});
test('stored prefixed lower-case codes match, and duplicate intake codes collapse',()=>{
  const saved=[{...existing[0],ticker:' a0038a0 '}],rows=api.parseHoldingsTsv(paste);
  assert.equal(api.previewHolding(rows[0],saved).matched,true);
  assert.equal(api.mergeHoldings([rows[0],{...rows[0],ticker:'a0038a0',name:'다른 표기'}]).length,1);
  assert.equal(api.sameHolding({ticker:'A0064K0'},{ticker:'0064K0'}),true);
  assert.equal(api.mergeHoldings([{ticker:'111111',name:'동명이종목',quantity:1},{ticker:'222222',name:'동명이종목',quantity:2}]).length,2,'distinct pasted codes stay separate');
});
test('unmatched code becomes one candidate with the exact broker name; no fuzzy inference',()=>{
  const input=paste.split('\n').slice(0,2).join('\n').replace('A0038A0','A0064K0').replace('KODEX 테스트로봇','KODEX 테스트금');
  const rows=plain(api.parseHoldingsTsv(input));assert.equal(rows.length,1);assert.equal(rows[0].ticker,'0064K0');assert.equal(rows[0].name,'KODEX 테스트금');
  assert.equal(api.previewHolding(rows[0],existing).matched,false);
  const merged=api.mergeWithExistingHoldings(rows,existing);assert.equal(merged.length,3);assert.equal(merged[2].name,'KODEX 테스트금');
});
test('exact normalized name requires a known matching market and cannot override a conflicting code',()=>{
  assert.equal(api.previewHolding({ticker:'999999',name:' kodex 미국휴머노이드로봇 ',quantity:2},existing).matched,false);assert.equal(api.previewHolding({name:' kodex 미국휴머노이드로봇 ',market:'KR',quantity:2},existing.map(h=>({...h,market:'KR'}))).matched,true);
  assert.equal(api.previewHolding({ticker:'999999',name:'KODEX 미국휴머노이드',quantity:2},existing).matched,false);
});
test('single-row header/reordered/headerless formats and US tickers still parse',()=>{
  for(const input of ['종목코드\t종목명\t보유수량\t매입가\t현재가\t평가금액\t매입금액\nA0038A0\tKODEX 로봇\t5\t10,100\t10,000\t50,000\t50,500','A0038A0\tKODEX 로봇\t5\t10,100\t10,000\t50,000\t50,500','KODEX 로봇\t0038A0\t5\t10,100\t10,000\t50,000\t50,500','종목명\t수량\t종목코드\t평균단가\nKODEX 로봇\t5\tA0038A0\t10100']){
    const rows=api.parseHoldingsTsv(input);assert.equal(rows.length,1);assert.equal(rows[0].ticker,'0038A0');assert.equal(rows[0].quantity,5);assert.equal(rows[0].buyPrice,10100);
  }
  assert.deepEqual(plain(api.parseHoldingsTsv('AAPL\tApple\t2\t100\nAMZN\tAmazon\t3\t200')).map(h=>h.ticker),['AAPL','AMZN']);
  assert.equal(api.parseHoldingsTsv('일반 문장입니다').length,0);
  assert.equal(api.parseHoldingsTsv('종목코드\t종목명\t수량').length,0);
});
test('two adjacent single-row securities are not paired; zero holding is retained',()=>{
  const rows=api.parseHoldingsTsv('A0038A0\tKODEX 로봇\t0\t10100\t10000\t0\t0\nA379810\tKODEX 미국나스닥100\t10\t20000\t19900\t199000\t200000');
  assert.equal(rows.length,2);assert.equal(rows[0].quantity,0);assert.equal(rows[1].quantity,10);
});
test('actual canonical paste → Preview → cancel is read-only with matched names/qty/avg and broker note',()=>{
  const f=fixture(true),before=JSON.stringify(f.sandbox.state);f.node('assetCaptureAccount').value='isa';f.node('assetCaptureAccount').onchange();
  let prevented=0;f.node('assetCapturePasteZone').onpaste({preventDefault(){prevented++},clipboardData:{items:[],files:[],getData:()=>paste}});
  const html=f.node('assetCapturePreview').innerHTML;assert.equal(prevented,1);assert.equal((html.match(/asset-position-row/g)||[]).length,2);
  assert.match(html,/KODEX 미국휴머노이드로봇/);assert.match(html,/증권사 표기: KODEX 테스트로봇/);assert.equal((html.match(/기존 보유종목 매칭/g)||[]).length,2);assert.doesNotMatch(html,/신규 후보/);
  assert.match(html,/data-key="quantity"[^>]*value="5"/);assert.match(html,/data-key="buyPrice"[^>]*value="10100"/);assert.match(html,/data-key="quantity"[^>]*value="10"/);
  assert.equal(f.sandbox.localStorage.getItem(key),f.raw);assert.equal(JSON.stringify(f.sandbox.state),before);assert.equal(f.writes(),0);
  f.node('assetPreviewCancel').onclick();assert.equal(f.node('assetCapturePreview').innerHTML,'');assert.equal(f.writes(),0);assert.equal(f.sandbox.localStorage.getItem(key),f.raw);
});
test('paste needs an explicitly selected account and broker note is escaped',()=>{
  const f=fixture(true);f.node('assetCapturePasteZone').onpaste({clipboardData:{getData:()=>paste}});assert.equal(f.node('assetCapturePreview').innerHTML,'');assert.equal(f.writes(),0);
  f.node('assetCaptureAccount').value='isa';f.node('assetCaptureAccount').onchange();f.node('assetCapturePasteZone').onpaste({preventDefault(){},clipboardData:{getData:()=>paste.replace('KODEX 테스트로봇','<img src=x onerror=bad>')}});
  assert.match(f.node('assetCapturePreview').innerHTML,/증권사 표기: &lt;img/);assert.doesNotMatch(f.node('assetCapturePreview').innerHTML,/<img/);assert.equal(f.writes(),0);
});

// Optional real browser check: node this-file <playwright/index.mjs> <msedge.exe>
if(process.argv[2]){
  const {chromium}=await import(pathToFileURL(process.argv[2]).href);
  const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
  try{
    const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
    const section=html.slice(html.indexOf('<div class="card full asset-capture-v1"'),html.indexOf('<section id="ledger"'));
    for(const width of [1440,390]){
      const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><body>${section}</body></html>`}));await page.goto('http://kiwoom-fixture.invalid/');
      await page.addStyleTag({content:fs.readFileSync(new URL('../hani-style-01.css',import.meta.url),'utf8')});
      await page.addStyleTag({content:fs.readFileSync(new URL('../hani-style-07.css',import.meta.url),'utf8')});
      await page.evaluate(({state,key})=>{window.state=state;window.lifeBefore=JSON.stringify(state,null,2)+'\n';localStorage.setItem(key,lifeBefore);window.nativeStorageSet=Storage.prototype.setItem;window.writes=0;Storage.prototype.setItem=()=>{writes++;throw Error('Unexpected write')};window.uid=()=> 'synthetic-id';window.nullableNum=v=>v==null?null:Number(v);window.inferMarket=(ticker,market)=>market||'KR';window.today=()=> '2026-10-21';window.agentApi=()=>{throw Error('No Cloud')};window.save=()=>{throw Error('No save before confirm')}} ,{state:makeState(),key});
      await page.addScriptTag({content:main.split(/\r?\n/).find(line=>line.startsWith('function normalizeBrokerHolding('))});await page.addScriptTag({content:source});await page.selectOption('#assetCaptureAccount','isa');
      await page.evaluate(text=>{const clipboardData=new DataTransfer();clipboardData.setData('text/plain',text);document.querySelector('#assetCapturePasteZone').dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}))},paste);
      assert.equal(await page.locator('.asset-position-row').count(),2);assert.equal(await page.locator('[data-position="0"][data-key="quantity"]').inputValue(),'5');assert.equal(await page.locator('[data-position="0"][data-key="buyPrice"]').inputValue(),'10100');assert.match(await page.locator('#assetCapturePreview').innerText(),/증권사 표기: KODEX 테스트로봇/);
      assert.equal(await page.locator('#assetPreviewApprove').isEnabled(),true);
      await page.locator('[data-position="0"][data-key="quantity"]').fill('6');await page.locator('[data-position="0"][data-key="quantity"]').dispatchEvent('change');
      await page.waitForFunction(()=>document.querySelector('[data-position="0"][data-key="quantity"]').value==='6');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key)===lifeBefore&&writes===0,key),true);assert.deepEqual(errors,[]);
      const screenshotDir=new URL('../.ai-budget-private/kiwoom-224/',import.meta.url);fs.mkdirSync(screenshotDir,{recursive:true});await page.locator('#assetCapturePreview').screenshot({path:fileURLToPath(new URL(`preview-${width}.png`,screenshotDir))});
      await page.locator('#assetPreviewCancel').click();assert.equal(await page.locator('.asset-position-row').count(),0);
      await page.evaluate(text=>{const clipboardData=new DataTransfer();clipboardData.setData('text/plain',text);document.querySelector('#assetCapturePasteZone').dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}))},paste.split('\n').slice(0,2).join('\n').replace('A0038A0','A0064K0'));
      assert.equal(await page.locator('.asset-position-row').count(),1);assert.match(await page.locator('#assetCapturePreview').innerText(),/신규 후보/);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key)===lifeBefore&&writes===0,key),true);
      await checkAccountInputLifecycle(page,width);
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS real browser 1440/390: Preview read-only, lifecycle writes only on two confirms, no page errors');
  }finally{await browser.close()}
}

// Real DOM/events + production confirm/read-back; only persistence, backup and OCR I/O are synthetic.
async function checkAccountInputLifecycle(page,width){
  const image={name:'account-a.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGQAAAABJRU5ErkJggg==','base64')};
  await page.evaluate(({key})=>{
    state.accounts.push({id:'b',name:'합성 B',type:'위탁',broker:'키움증권'});state.ui={series:['isa','b']};state.meta={};
    window.STORAGE_KEY=key; // Existing fixture traps writes; install a strictly confirm-only store.
    window.confirmPhase=false;window.failSave=false;window.fileChanges=0;Object.defineProperty(window,"persistedRaw",{get:()=>localStorage.getItem(key)});
    Storage.prototype.setItem=function(k,v){if(k!==key||!confirmPhase)throw Error('Write outside confirm');writes++;nativeStorageSet.call(this,k,v)};
    window.save=()=>{if(failSave)return {ok:false};localStorage.setItem(key,JSON.stringify(state));return {ok:true}};
    window.exportData=()=>true;window.renderAll=()=>{};window.toast=()=>{};window.n=v=>Number(v)||0;
    window.officialBrokerSorted=()=>state.investmentBrokerSnapshots.filter(s=>s.mode==='actual');
    window.brokerBlank=()=>({id:'synthetic-total',mode:'actual',accounts:[]});
    window.intakeImageToDataUrl=async()=> 'data:image/png;base64,synthetic';window.agentObj=x=>x;
    window.ocrResult={target_hint:'asset',financialInstitution:'키움증권',accountName:'합성 ISA',currentAsset:1000,asOfDate:'2026-10-21',valuationAmount:1000};
    window.agentApi=async()=>({extraction:ocrResult});
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
    window.createdUrls=[];window.revokedUrls=[];
    URL.createObjectURL=file=>{const url=create(file);createdUrls.push(url);return url};
    URL.revokeObjectURL=url=>{revokedUrls.push(url);revoke(url)};
    document.querySelector('#assetCaptureFiles').addEventListener('change',()=>fileChanges++);
  },{key});
  for(const name of ['normalizeBrokerAccount','normalizeBrokerSnapshot'])await page.addScriptTag({content:main.split(/\r?\n/).find(line=>line.startsWith('function '+name+'('))});
  // Rebuild the account selector through the existing account-manager path without changing data.
  await page.evaluate(()=>document.querySelector('#assetCaptureAccount').insertAdjacentHTML('beforeend','<option value="b">합성 B</option>'));
  const pasteText=()=>page.evaluate(text=>{const clipboardData=new DataTransfer();clipboardData.setData('text/plain',text);document.querySelector('#assetCapturePasteZone').dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}))},paste);
  const unchanged=async()=>assert.equal(await page.evaluate(()=>persistedRaw===lifeBefore&&writes===0),true);
  const empty=async()=>{
    assert.equal(await page.locator('#assetCapturePreview').innerHTML(),'');
    assert.equal(await page.locator('#assetCaptureFileList img').count(),0);
    assert.equal(await page.locator('#assetCaptureFiles').inputValue(),'');
    assert.equal(await page.locator('#assetCaptureFiles').evaluate(el=>el.files.length),0);
    assert.equal(await page.locator('#assetCaptureAnalyze').isDisabled(),true);
    assert.doesNotMatch(await page.locator('#assetCaptureV1').innerText(),/KODEX 테스트로봇|증권사 표기:/);
    assert.equal(await page.evaluate(()=>createdUrls.every(url=>revokedUrls.includes(url))),true);
  };
  await page.locator('#assetPreviewCancel').click();
  await page.locator('#assetCaptureFiles').setInputFiles(image);await pasteText();await unchanged();
  const firstUrl=await page.locator('#assetCaptureFileList img').getAttribute('src');
  assert.equal(await page.locator('.asset-position-row').count(),2);
  // Failure must retain the source and editable Preview; only successful read-back clears them.
  await page.evaluate(()=>{confirmPhase=true;failSave=true});await page.locator('#assetPreviewApprove').click();
  assert.match(await page.locator('#assetCaptureStatus').innerText(),/저장 실패/);
  assert.equal(await page.locator('.asset-position-row').count(),2);assert.equal(await page.locator('#assetCaptureFileList img').getAttribute('src'),firstUrl);await unchanged();
  await page.evaluate(()=>{failSave=false});await page.locator('#assetPreviewApprove').click();
  await page.waitForFunction(()=>document.querySelector('#assetCaptureStatus').textContent==='합성 ISA 계좌 반영 완료 · 다음 계좌를 선택하세요');
  await page.evaluate(()=>{confirmPhase=false});await empty();
  const saved=await page.evaluate(()=>({raw:persistedRaw,writes,state:JSON.parse(persistedRaw)}));
  assert.equal(saved.writes,1);assert.notEqual(saved.raw,await page.evaluate(()=>lifeBefore));assert.deepEqual(saved.state.tasks,makeState().tasks);
  assert.equal(saved.state.investmentBrokerSnapshots.at(-1).accounts[0].accountId,'isa');
  const noNewWrite=async()=>assert.equal(await page.evaluate(({raw,writes})=>persistedRaw===raw&&window.writes===writes,saved),true);
  await page.selectOption('#assetCaptureAccount','b');await empty();await noNewWrite();
  // Same file may be selected twice. Assert native value is empty after each change.
  await page.selectOption('#assetCaptureAccount','isa');
  const before=await page.evaluate(()=>fileChanges);
  await page.locator('#assetCaptureFiles').setInputFiles(image);assert.equal(await page.locator('#assetCaptureFiles').inputValue(),'');
  await page.locator('#assetCaptureFiles').setInputFiles(image);assert.equal(await page.evaluate(()=>fileChanges),before+2);
  await pasteText();
  await page.locator('[data-position="0"][data-key="quantity"]').fill('8');await page.locator('[data-position="0"][data-key="quantity"]').dispatchEvent('change');
  await page.waitForFunction(()=>document.querySelector('[data-position="0"][data-key="quantity"]').value==='8');
  const keepUrl=await page.locator('#assetCaptureFileList img').getAttribute('src');
  await page.selectOption('#assetCaptureAccount','b');
  assert.equal(await page.locator('#assetCaptureAccount').inputValue(),'isa');assert.equal(await page.locator('#assetCaptureSwitchPrompt').isVisible(),true);
  assert.match(await page.locator('#assetCaptureSwitchPrompt').innerText(),/반영하지 않은 입력을 버릴까요\?/);
  await page.locator('#assetCaptureSwitchPrompt').screenshot({path:fileURLToPath(new URL(`../.ai-budget-private/kiwoom-224/switch-${width}.png`,import.meta.url))});
  await page.getByRole('button',{name:'돌아가기',exact:true}).click();
  assert.equal(await page.locator('#assetCaptureSwitchPrompt').isVisible(),false);assert.equal(await page.locator('#assetCaptureAccount').inputValue(),'isa');
  assert.equal(await page.locator('[data-position="0"][data-key="quantity"]').inputValue(),'8');assert.equal(await page.locator('#assetCaptureFileList img').getAttribute('src'),keepUrl);
  assert.equal(await page.evaluate(url=>revokedUrls.includes(url),keepUrl),false);await noNewWrite();
  await page.selectOption('#assetCaptureAccount','b');await page.getByRole('button',{name:'버리기',exact:true}).click();
  assert.equal(await page.locator('#assetCaptureAccount').inputValue(),'b');await empty();await noNewWrite();
  await page.selectOption('#assetCaptureAccount','isa');await empty(); // Returning cannot restore another account's input.
  // An outstanding OCR response must not recreate A's Preview after switching to B.
  await page.locator('#assetCaptureFiles').setInputFiles(image);
  await page.evaluate(()=>{window.agentApi=()=>new Promise(resolve=>{window.finishOcr=resolve})});
  await page.locator('#assetCaptureAnalyze').click();await page.waitForFunction(()=>!!window.finishOcr);
  await page.selectOption('#assetCaptureAccount','b');await page.getByRole('button',{name:'버리기',exact:true}).click();
  await page.evaluate(async()=>{finishOcr({extraction:ocrResult});await new Promise(resolve=>setTimeout(resolve,0))});await empty();await noNewWrite();
  // Totals/OCR confirm uses the same cleanup, while keeping its existing write/read-back.
  await page.selectOption('#assetCaptureAccount','isa');await page.locator('#assetCaptureFiles').setInputFiles(image);
  await page.evaluate(()=>{window.agentApi=async()=>({extraction:ocrResult})});await page.locator('#assetCaptureAnalyze').click();
  await page.locator('#assetPreviewApprove').waitFor();await noNewWrite();
  await page.evaluate(()=>{confirmPhase=true});await page.locator('#assetPreviewApprove').click();
  await page.waitForFunction(()=>document.querySelector('#assetCaptureStatus').textContent==='합성 ISA 계좌 반영 완료 · 다음 계좌를 선택하세요');
  await page.evaluate(()=>{confirmPhase=false});await empty();assert.equal(await page.evaluate(()=>writes),2);
  await page.selectOption('#assetCaptureAccount','b');await empty();
  console.log(`PASS browser ${width}: confirm-only writes2, failed-save retention, input/image/URL reset, A→B empty, discard/back, same-file events2, stale OCR ignored`);
}
