// Synthetic account/securities only; production OCR mapper, editor, validation and approval path.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync(new URL('../hani-asset-update-v1.js',import.meta.url),'utf8'),main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8'),edge=fs.readFileSync(new URL('../supabase/functions/hani-agent-orchestrator/index.ts',import.meta.url),'utf8');
const imageA={financialInstitution:'하나증권',asOfDate:'2026-10-21',currentAsset:null,balance:300100,valuationAmount:300150,extracted_text:`하나증권
계좌 잔고
12345678-00 종합매매
300,100원
예수금
0
출금가능
0
국내주식 / 해외주식
평가금액 300,150원 >
합성전자
평가금액 200,100원
매입금액 220,000원
평가손익 -19,900원
수익률 -9.04%
합성펀드
평가금액 100,050원`,holdings:[{name:'합성전자',ticker:'123456',quantity:999,averagePrice:99999,currentPrice:77777,purchaseAmount:220000,valuationAmount:200100},{name:'합성펀드',ticker:'234567',averagePrice:88888,currentPrice:99999,quantity:3,purchaseAmount:266664,valuationAmount:100050}]};
const imageB={financialInstitution:'하나증권',asOfDate:'2026-10-21',extracted_text:`하나증권
잔고 > 주식잔고 > 국내
주식평가금액
300,200원
총 손익 -30,000원 (-9.09%)
합성전자
10주
200,150원
-19,850원 (-9.02%)
합성펀드
평가금액 100,050원`,holdings:[{name:'합성전자',ticker:'123456',quantity:10,valuationAmount:200150},{name:'합성펀드',ticker:'234567',valuationAmount:100050}]};
const data=()=>({version:'2.9.15-safe-baseline-bootstrap',accounts:[{id:'hana',name:'합성 하나',broker:'하나증권',type:'위탁종합'},{id:'kiwoom',name:'합성 키움',broker:'키움증권',type:'ISA'},{id:'toss',name:'합성 토스',broker:'토스증권',type:'위탁'}],investmentBrokerSnapshots:[{id:'prior',mode:'actual',status:'confirmed',period:'2026-10',snapshotDate:'2026-10-20',accounts:[{id:'old',accountId:'hana',enabled:true,estimatedAssets:299000,totalEvaluation:299000,holdings:[{id:'one',name:'합성전자',ticker:'123456',market:'KR',quantity:10,buyPrice:22000,currentPrice:20000,purchaseAmount:220000,evaluationAmount:200000},{id:'two',name:'합성펀드',ticker:'234567',market:'KR',quantity:2,buyPrice:51000,currentPrice:50000,purchaseAmount:102000,evaluationAmount:100000}]}]}],ui:{series:[]},tasks:[{title:'그대로 보존'}]});
function fixture(){const sandbox={window:{},document:{getElementById:()=>null},structuredClone,console,uid:()=> 'synthetic',nullableNum:v=>v==null||v===''?null:Number(v),inferMarket:(t,m)=>m||'KR'};vm.createContext(sandbox);vm.runInContext(main.split(/\r?\n/).find(l=>l.startsWith('function normalizeBrokerHolding(')),sandbox);vm.runInContext(source,sandbox);return sandbox.window.HANI_ASSET_UPDATE_V1}
const api=fixture(),combined=()=>api.mergeScreens([api.normalize(structuredClone(imageA)),api.normalize(structuredClone(imageB))]);

// Execute the real input/button callbacks with an isolated DOM/storage double.
// Browser layout and accessibility checks remain in the optional Edge block below.
function editorFixture(linked=false,inputs=[imageA,imageB]){
  const nodes=new Map();let writes=0,phase=false,stored=JSON.stringify(data());
  function element(id='',attrs=''){
    const attributes=Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    const children=[];let html='';
    return {id,value:attributes.value||'',textContent:'',style:{},dataset:Object.fromEntries(Object.entries(attributes).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])),disabled:false,
      get innerHTML(){return html},set innerHTML(v){html=v;children.length=0;for(const m of v.matchAll(/<(?:input|select|button|small|div)\b([^>]*)>/g)){const childId=m[1].match(/\bid="([^"]*)"/)?.[1]||'',child=element(childId,m[1]);children.push(child);if(childId)nodes.set(childId,child)}},
      querySelectorAll(selector){const key=selector.match(/^\[([\w-]+)\]$/)?.[1];return key?children.filter(c=>key.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase()) in c.dataset):[]},
      setAttribute(){},closest(){return null},scrollIntoView(){},focus(){},appendChild(){}
    };
  }
  const node=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)},state=data();
  const sandbox={window:{},document:{getElementById:node,createElement:()=>element()},URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},console,structuredClone,state,uid:()=>Math.random().toString(36),nullableNum:v=>v==null||v===''?null:Number(v),inferMarket:(t,m)=>m||'KR',n:v=>Number(v)||0,today:()=> '2026-10-21',STORAGE_KEY:'hani_os_life_v23',
    localStorage:{getItem:()=>stored,setItem(){throw Error('Unexpected direct storage path')}},save(){assert.equal(phase,true,'write only after explicit approval');writes++;stored=JSON.stringify(state);return {ok:true}},commit(){throw Error('Unexpected commit path')},exportData:()=>true,renderAll(){},toast(){},
    officialBrokerSorted:()=>state.investmentBrokerSnapshots.filter(s=>s.mode==='actual'),brokerBlank:()=>({id:'blank',mode:'actual',accounts:[]}),agentObj:x=>x,intakeImageToDataUrl:async()=> 'synthetic'};
  sandbox.window.HaniAssetMarket={resolveHoldings:async()=>linked};let queue=structuredClone(inputs);sandbox.agentApi=async()=>({extraction:{target_hint:'asset',...structuredClone(queue.shift())}});
  vm.createContext(sandbox);for(const name of ['normalizeBrokerHolding','normalizeBrokerAccount','normalizeBrokerSnapshot'])vm.runInContext(main.split(/\r?\n/).find(l=>l.startsWith('function '+name+'(')),sandbox);vm.runInContext(source,sandbox);
  return {node,state,stored:()=>stored,writes:()=>writes,allowSave:()=>{phase=true},async start(){node('assetCaptureAccount').value='hana';node('assetCaptureAccount').onchange();node('assetCaptureFiles').files=inputs.map((_,i)=>({name:i+'.png'}));node('assetCaptureFiles').onchange();await node('assetCaptureAnalyze').onclick()},paste(broker){node('assetCaptureAccount').value=broker;node('assetCaptureAccount').onchange();node('assetCapturePasteZone').onpaste({preventDefault(){},clipboardData:{getData:()=> '종목명\t종목코드\t수량\t평균단가\t현재가\t평가금액\t매입금액\n합성 종목\t345678\t2\t100\t110\t220\t200'}})},edit(scope,key,row,v){const input=node('asset-edit-'+scope+'-'+(row??'total')+'-'+key);input.value=v;input.oninput()}};
}

test('image dates are optional source metadata; canonical approval records input day without new stored fields',async()=>{
  for(const asOfDate of [null,'2020-01-02']){const input={financialInstitution:'키움증권',asOfDate,currentAsset:700,valuationAmount:700,holdings:[{name:'합성전자',ticker:'123456',market:'KR',buyCurrency:'KRW',quantity:2,evaluationAmount:700}]},f=editorFixture(false,[input]);await f.start();assert.equal(f.node('assetPreviewApprove').disabled,false);assert.match(f.node('assetCapturePreview').innerHTML,/입력일 기준 2026-10-21/);assert.equal(f.writes(),0);f.allowSave();f.node('assetPreviewApprove').onclick();assert.equal(f.writes(),1);const snap=JSON.parse(f.stored()).investmentBrokerSnapshots[0];assert.equal(snap.snapshotDate,'2026-10-21');assert.doesNotMatch(f.stored(),/sourceAsOf|reverseCost|derivedFrom/);}
});
test('Toss investment-only approval persists unknown estimatedAssets as null through existing save owner',async()=>{
  const evidence=(field,label,value)=>({field,label,raw:String(value),visible:true,confidence:.99,alternatives:[]}),input={financialInstitution:'토스증권',layout:'toss_pc',section:'all',amountCurrency:'KRW',accountEvidence:[evidence('currentAsset','내 투자',700)],holdings:[{name:'합성전자',ticker:'123456',market:'KR',buyCurrency:'KRW',evidence:[evidence('quantity','수량',2),evidence('evaluationAmount','평가금액',700)]}]},f=editorFixture(false,[input]);await f.start();assert.equal(f.node('assetPreviewApprove').disabled,false);f.allowSave();f.node('assetPreviewApprove').onclick();assert.equal(f.writes(),1);const a=JSON.parse(f.stored()).investmentBrokerSnapshots[0].accounts[0];assert.equal(a.estimatedAssets,null);assert.equal(a.totalEvaluation,700);
});

test('canonical Preview input and row callbacks recover errors, rederive/revert, and save only on approval',async()=>{
  const f=editorFixture(),before=f.stored();await f.start();
  // A fresh quantity needs source evidence or an explicit answer.
  assert.equal(f.node('assetPreviewApprove').disabled,true);f.edit('holding','quantity',1,'2');
  assert.equal(f.node('assetPreviewApprove').disabled,false);
  f.edit('account','balance',null,'300,100원');assert.equal(f.node('assetPreviewApprove').disabled,true);
  f.node('assetPreviewApprove').onclick();assert.equal(f.writes(),0);
  f.edit('account','balance',null,'0원');assert.equal(f.node('assetPreviewApprove').disabled,false);
  f.edit('holding','quantity',0,'20');assert.equal(f.node('asset-edit-holding-0-buyPrice').value,11000);
  f.edit('holding','quantity',0,'');assert.equal(f.node('asset-edit-holding-0-buyPrice').value,'');assert.equal(f.node('asset-edit-holding-0-currentPrice').value,'');
  f.node('assetPreviewRevert').onclick();assert.equal(f.node('asset-edit-holding-0-quantity').value,'10');f.edit('holding','quantity',1,'2');
  f.node('assetPreviewAddRow').onclick();assert.equal(f.node('assetPreviewApprove').disabled,true);
  const remove=f.node('assetCapturePreview').querySelectorAll('[data-exclude-row]').find(el=>el.dataset.excludeRow==='2');remove.onclick();assert.equal(f.node('assetPreviewApprove').disabled,false);
  assert.equal(f.stored(),before);assert.equal(JSON.stringify(f.state),before);assert.equal(f.writes(),0);
  f.edit('account','currentAsset',null,'300,300원');f.edit('holding','purchaseAmount',0,'240,000원');
  f.allowSave();await f.node('assetPreviewApprove').onclick();assert.equal(f.writes(),1);
  const saved=JSON.parse(f.stored()).investmentBrokerSnapshots[0].accounts[0];assert.equal(saved.estimatedAssets,300300);assert.equal(saved.holdings[0].buyPrice,24000);assert.equal(saved.holdings[1].buyPrice,51000);
});

test('linked Preview keeps edited price mismatch blocked through the actual approval callback',async()=>{
  const f=editorFixture(true);await f.start();f.edit('holding','currentPrice',0,'30,000원');
  assert.equal(f.node('assetPreviewApprove').disabled,true);await f.node('assetPreviewApprove').onclick();assert.equal(f.writes(),0);
  assert.match(f.node('assetCaptureStatus').textContent,/저장 실패/);
  f.edit('holding','currentPrice',0,'20,015원');assert.doesNotMatch(f.node('assetPreviewValidation').innerHTML,/ERROR/);
});

test('Kiwoom/Toss Preview edits, invalid inputs, add/exclude and revert use the same callbacks without writes',()=>{
  for(const broker of ['kiwoom','toss']){
    const f=editorFixture(),before=f.stored();f.paste(broker);
    f.edit('holding','buyCurrency',0,'KRW');
    f.edit('holding','currentPrice',0,'150원');assert.equal(f.node('assetPreviewApprove').disabled,true);
    f.edit('holding','currentPrice',0,'110원');assert.equal(f.node('assetPreviewApprove').disabled,false);
    f.edit('account','balance',null,'오류');f.node('assetPreviewAddRow').onclick();
    f.node('assetCapturePreview').querySelectorAll('[data-exclude-row]').find(el=>el.dataset.excludeRow==='1').onclick();
    assert.equal(f.node('assetPreviewApprove').disabled,true,'excluding a row preserves invalid account input');
    f.node('assetPreviewRevert').onclick();assert.equal(f.node('asset-edit-holding-0-currentPrice').value,'110');
    f.edit('holding','buyCurrency',0,'KRW');assert.equal(f.node('assetPreviewApprove').disabled,false);assert.equal(f.stored(),before);assert.equal(f.writes(),0);
  }
});
test('Hana label proximity overrides wrong AI cash, preserves explicit zero, separates withdrawable',()=>{const a=api.normalize(imageA);assert.equal(a.currentAsset,300100);assert.equal(a.balance,0);assert.equal(a.withdrawable,0);assert.equal(a.evaluation,300150);assert.equal(a.holdings[0].quantity,null);assert.equal(a.holdings[1].buyPrice,null);assert.equal(a.holdings[1].currentPrice,null);assert.equal(a.holdings[1].purchaseAmount,null);assert.equal(a.holdings[1].quantity,null)});
test('same account screenshots prefer labelled stock total B and derive prices only from known operands',()=>{const d=combined();assert.equal(d.currentAsset,300100);assert.equal(d.balance,0);assert.equal(d.evaluation,300200);assert.equal(d.holdings.length,2);assert.equal(d.holdings[0].quantity,10);assert.equal(d.holdings[0].buyPrice,220000/10);assert.equal(d.holdings[0].currentPrice,200150/10);for(const key of ['quantity','buyPrice','currentPrice','purchaseAmount'])assert.equal(d.holdings[1][key],null,key);assert.equal(d.holdings[1].evaluationAmount,100050);const v=api.validation(d);assert.equal(v.blocking,false,v.message);assert.equal(v.severity,'INFO');assert.match(v.message,/실시간 차이/);assert.doesNotMatch(v.message,/ERROR|저장 차단/)});
test('reverse screenshot order still chooses explicit stock total and computes cost/qty',()=>{const d=api.mergeScreens([api.normalize(imageB),api.normalize(imageA)]);assert.equal(d.evaluation,300200);assert.equal(d.holdings[0].evaluationAmount,200150);assert.equal(d.holdings[0].buyPrice,22000);assert.equal(api.validation(d).blocking,false)});

test('repeated account screens cannot replace the explicit stock screen with a lower priority observation',()=>{
  const d=api.mergeScreens([imageB,imageA,imageA,imageA].map(raw=>api.normalize(structuredClone(raw))));
  assert.equal(d.holdings.length,2);assert.equal(d.evaluation,300200);
  assert.equal(d.holdings[0].evaluationAmount,200150);assert.equal(d.holdings[0].buyPrice,22000);
  assert.equal(api.validation(d).blocking,false);
});
test('unlabelled big number is never cash; zero withdrawal is independent of cash',()=>{const d=api.normalize({...imageA,extracted_text:imageA.extracted_text.replace('예수금\n0\n',''),balance:300100});assert.equal(d.balance,null);assert.equal(d.currentAsset,300100);const separate=api.normalize({...imageA,extracted_text:imageA.extracted_text.replace('출금가능\n0','출금가능\n1,000원')});assert.equal(separate.balance,0);assert.equal(separate.withdrawable,1000)});
test('real mismatch blocks even linked positions and explains compared numbers in Korean',()=>{for(const positionsOnly of [false,true]){const d=combined();d.currentAsset=d.assets=400100;d.positionsOnly=positionsOnly;d.marketLinked=positionsOnly;const v=api.validation(d);assert.equal(v.blocking,true);assert.equal(v.severity,'ERROR');for(const part of ['계좌 총액 400,100원','주식 평가금액 300,200원','예수금 0원','99,900원'])assert.ok(v.message.includes(part),v.message)}});

test('linked positions also validate edited prices and account purchase/pnl before allowing approval',()=>{
  for(const positionsOnly of [false,true]){
    const d=combined();d.positionsOnly=d.marketLinked=positionsOnly;
    d.holdings[0].currentPrice=30000;
    assert.equal(api.validation(d).blocking,true,'price × qty disagrees with evaluation');
    d.holdings[0].currentPrice=20015;
    assert.equal(api.validation(d).blocking,false);
    d.purchase=500000;d.pnl=-30000;
    assert.equal(api.validation(d).blocking,true,'purchase + pnl disagrees with stock evaluation');
  }
});
test('tolerance accepts either 1000 won or 0.5%, rejects beyond both without changing originals',()=>{for(const [total,evaluation,blocking] of [[300000,301000,false],[300000,301001,false],[300000,302000,true],[10000,11000,false],[10000,11001,true]]){const d=api.mergeScreens([api.normalize({financialInstitution:'하나증권',extracted_text:`계좌 잔고\n12345678-00 종합매매\n${total}원\n예수금 0\n주식평가금액 ${evaluation}원`})]);assert.equal(api.validation(d).blocking,blocking);assert.equal(d.currentAsset,total);assert.equal(d.evaluation,evaluation)}});
test('missing incoming cost facts retain stored values, missing dynamic observations become null; Preview metadata never persists',()=>{const d=combined(),merged=api.mergeWithExistingHoldings(d.holdings,data().investmentBrokerSnapshots[0].accounts[0].holdings);assert.equal(merged.length,2);assert.equal(merged[1].quantity,2);assert.equal(merged[1].buyPrice,51000);assert.equal(merged[1].currentPrice,null);assert.equal(merged[1].evaluationAmount,100050);assert.doesNotMatch(JSON.stringify(merged),/derived|edited|ranks|hana|differences/)});
test('Hana Vision contract: separate withdrawable; actual request requires labels and null collapsed fields',async()=>{const start=edge.indexOf('const nullableString ='),end=edge.indexOf('async function extractIntakeImage(',start),context={};vm.createContext(context);vm.runInContext(stripTypeScriptTypes(edge.slice(start,end))+'\nthis.schema=ASSET_VISION_SCHEMA;',context);assert.ok(context.schema.required.includes('withdrawable'));let request;Object.assign(context,{INTAKE_VISION_SCHEMA:{},extractOpenAIOutputText:()=>JSON.stringify({target_hint:'asset',holdings:[],warnings:[]}),fetch:async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({})}}});vm.runInContext(stripTypeScriptTypes(edge.slice(end,edge.indexOf('\nasync function ',end+10))),context);await context.extractIntakeImage('synthetic','data:image/png;base64,synthetic','asset','synthetic.png');assert.match(request.instructions,/라벨 없는 큰 숫자를 예수금으로 넣지/);assert.match(request.instructions,/접힌 카드에 없는 값은 null/);assert.match(request.instructions,/계산값/);assert.ok(request.text.format.schema.required.includes('withdrawable'))});

if(process.argv[2]){
  // Normal browser fixture includes both visible quantities; missing quantity remains a separate Node regression.
  const browserImageB={...imageB,extracted_text:imageB.extracted_text.replace("합성펀드\n평가금액","합성펀드\n2주\n평가금액")};
  const {chromium}=await import(pathToFileURL(process.argv[2]).href),browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
  try{for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),section=html.slice(html.indexOf('<div class="card full asset-capture-v1"'),html.indexOf('<section id="ledger"'));
    await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><body>'+section+'</body>'}));await page.goto('http://hana-fixture.invalid/');for(const css of ['hani-style-01.css','hani-style-07.css'])await page.addStyleTag({content:fs.readFileSync(new URL('../'+css,import.meta.url),'utf8')});
    await page.evaluate(({initial,a,b})=>{window.state=initial;window.before=JSON.stringify(initial);window.writes=0;window.phase=false;window.uid=()=> 'synthetic-'+Math.random();window.nullableNum=v=>v==null||v===''?null:Number(v);window.inferMarket=(t,m)=>m||'KR';window.n=v=>Number(v)||0;window.today=()=> '2026-10-21';window.STORAGE_KEY='hani_os_life_v23';const set=Storage.prototype.setItem;set.call(localStorage,STORAGE_KEY,before);Storage.prototype.setItem=function(k,v){if(!phase||k!==STORAGE_KEY)throw Error('Write before explicit approval');writes++;set.call(this,k,v)};window.save=()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return {ok:true}};window.exportData=()=>true;window.renderAll=()=>{};window.toast=()=>{};window.officialBrokerSorted=()=>state.investmentBrokerSnapshots.filter(s=>s.mode==='actual');window.brokerBlank=()=>({id:uid(),mode:'actual',accounts:[]});window.agentObj=x=>x;window.intakeImageToDataUrl=async()=> 'data:image/png;base64,synthetic';window.queue=[a,b];window.agentApi=async action=>{if(action!=='extract_intake_image')throw Error('Unexpected network');return {extraction:{target_hint:'asset',...queue.shift()}}};window.HaniAssetMarket={resolveHoldings:async()=>false};},{initial:data(),a:imageA,b:browserImageB});
    for(const name of ['normalizeBrokerHolding','normalizeBrokerAccount','normalizeBrokerSnapshot'])await page.addScriptTag({content:main.split(/\r?\n/).find(l=>l.startsWith('function '+name+'('))});await page.addScriptTag({content:source});await page.selectOption('#assetCaptureAccount','hana');
    await page.locator('#assetCaptureFiles').setInputFiles([{name:'synthetic-a.png',mimeType:'image/png',buffer:Buffer.from('synthetic')},{name:'synthetic-b.png',mimeType:'image/png',buffer:Buffer.from('synthetic')}]);await page.click('#assetCaptureAnalyze');await page.locator('#assetPreviewApprove').waitFor();
    const openAdvanced=async()=>{if(await page.locator(".asset-intake-advanced").getAttribute("open")===null)await page.locator(".asset-intake-advanced > summary").click()};await openAdvanced();
    const field=(scope,key,index)=>page.locator('[data-preview-field="'+scope+'"][data-key="'+key+'"]'+(index==null?'':'[data-row="'+index+'"]')),edit=async(scope,key,index,v)=>{await openAdvanced();await field(scope,key,index).fill(v);await field(scope,key,index).dispatchEvent('input')},unchanged=async()=>assert.deepEqual(await page.evaluate(()=>({same:localStorage.getItem(STORAGE_KEY)===before,stateSame:JSON.stringify(state)===before,writes})),{same:true,stateSame:true,writes:0});
    assert.equal(await field('account','balance').inputValue(),'0');assert.equal(await field('account','currentAsset').inputValue(),'300100');assert.equal(await field('account','evaluation').inputValue(),'300200');assert.equal(await field('holding','buyPrice',0).inputValue(),'22000');assert.equal(await field('holding','currentPrice',0).inputValue(),'20015');assert.equal(await field('holding','buyPrice',1).inputValue(),'');assert.match(await page.locator('.asset-position-row').nth(1).innerText(),/미확인/);assert.match(await page.locator('.asset-position-row').nth(0).innerText(),/계산값/);assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),false);await unchanged();
    await edit('account','balance',null,'300,100원');assert.match(await page.locator('#assetPreviewValidation').innerText(),/ERROR/);assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true);await edit('account','balance',null,'0원');assert.doesNotMatch(await page.locator('#assetPreviewValidation').innerText(),/ERROR/);assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),false);assert.match(await field('account','balance').locator('..').locator('..').innerText(),/직접 수정/);
    await edit('holding','quantity',0,'20');assert.equal(await field('holding','buyPrice',0).inputValue(),'11000');assert.equal(await field('holding','currentPrice',0).inputValue(),'10007.5');await edit('holding','currentPrice',0,'30,000원');assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true);assert.match(await page.locator('#assetPreviewValidation').innerText(),/현재가 × 수량/);await edit('holding','currentPrice',0,'10,007.5원');assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),false);
    await page.click('#assetPreviewAddRow');assert.equal(await page.locator('.asset-position-row').count(),3);assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true);await edit('holding','name',2,'추가 합성종목');await edit('holding','ticker',2,'345678');for(const [key,v] of [['quantity','1'],['buyPrice','100'],['currentPrice','100'],['evaluationAmount','100'],['purchaseAmount','100']])await edit('holding',key,2,v);await edit('account','balance',null,'오류');await openAdvanced();await page.locator('[data-exclude-row="2"]').click();assert.equal(await page.locator('.asset-position-row').count(),2);assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true,'excluding a row must not erase another field validation error');await edit('account','balance',null,'0');assert.match(await page.locator('[data-edit-badge="holding:0:quantity"]').innerText(),/직접 수정/);await unchanged();
    await openAdvanced();await page.click('#assetPreviewRevert');await openAdvanced();assert.equal(await field('holding','quantity',0).inputValue(),'10');assert.equal(await field('holding','buyPrice',0).inputValue(),'22000');assert.equal(await page.locator('[data-edit-badge]').filter({hasText:'직접 수정'}).count(),0);assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),false);await unchanged();await edit('holding','quantity',0,'.5');assert.equal(await field('holding','buyPrice',0).inputValue(),'440000');await edit('holding','buyPrice',0,'10');assert.equal(await field('holding','buyPrice',0).inputValue(),'10','manual average must not be overwritten by derivation');assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true);await page.evaluate(()=>document.getElementById('assetPreviewApprove').onclick());assert.match(await page.locator('#assetCaptureStatus').innerText(),/저장 실패/);await unchanged();await openAdvanced();await page.click('#assetPreviewRevert');await openAdvanced();
    // Exclusion is incoming-only: existing holdings must survive through the same merge policy.
    await openAdvanced();await page.locator('[data-exclude-row="1"]').click();assert.equal(await page.locator('.asset-position-row').count(),1);await unchanged();await openAdvanced();await page.click('#assetPreviewRevert');await openAdvanced();
    await edit('account','currentAsset',null,'300,300원');await edit('account','returnRate',null,'-9.09%');await edit('holding','purchaseAmount',0,'240,000원');assert.equal(await field('holding','buyPrice',0).inputValue(),'24000');
    // Invalid text cannot silently retain an old valid number or pass validation.
    await edit('account','balance',null,'잘못 읽음');assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true);await edit('account','balance',null,'0');assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),false);await unchanged();
    assert.equal(await field('account','balance').getAttribute('inputmode'),'decimal');await page.getByRole('button',{name:'예수금 수정',exact:true}).click();assert.equal(await field('account','balance').evaluate(el=>el===document.activeElement),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:'.ai-budget-private/kiwoom-224/hana-'+width+'.png',fullPage:true});
    await page.evaluate(()=>{phase=true});await page.click('#assetPreviewApprove');await page.waitForFunction(()=>document.querySelector('#assetCaptureStatus').textContent.includes('반영 완료'));await page.evaluate(()=>{phase=false});
    const saved=await page.evaluate(()=>({writes,saved:JSON.parse(localStorage.getItem(STORAGE_KEY))}));assert.equal(saved.writes,1);const account=saved.saved.investmentBrokerSnapshots.find(s=>s.id==='prior').accounts[0];assert.equal(account.estimatedAssets,300300);assert.equal(account.totalReturn,-9.09);assert.equal(account.holdings[0].buyPrice,24000);assert.equal(account.holdings[0].purchaseAmount,240000);assert.equal(account.holdings[1].buyPrice,51000);assert.deepEqual(saved.saved.tasks,data().tasks);assert.doesNotMatch(JSON.stringify(saved.saved),/derived|ranks|edited|differences|withdrawable/);assert.deepEqual(errors,[]);
    // A conflicting per-security observation can be corrected, excluded, or reverted without writes.
    await page.selectOption('#assetCaptureAccount','hana');await page.evaluate(({a,b})=>{queue=[a,b]},{a:imageA,b:{...browserImageB,extracted_text:browserImageB.extracted_text.replace('200,150원','210,150원')}});await page.locator('#assetCaptureFiles').setInputFiles([{name:'delta-a.png',mimeType:'image/png',buffer:fs.readFileSync(new URL('../godsaeng_icon_webtoon.png',import.meta.url))},{name:'delta-b.png',mimeType:'image/png',buffer:fs.readFileSync(new URL('../godsaeng_icon_webtoon.png',import.meta.url))}]);await page.click('#assetCaptureAnalyze');assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true);assert.match(await page.locator('#assetPreviewValidation').innerText(),/화면 간/);await edit('holding','evaluationAmount',0,'200150');assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),false);await openAdvanced();await page.click('#assetPreviewRevert');await openAdvanced();assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),true);await openAdvanced();await page.locator('[data-exclude-row="0"]').click();assert.equal(await page.locator('#assetPreviewApprove').isDisabled(),false);await page.click('#assetPreviewCancel');assert.equal(await page.evaluate(()=>writes),1);
    // The editor is broker-independent on the existing TSV/positions path too.
    for(const broker of ['kiwoom','toss']){await page.selectOption('#assetCaptureAccount',broker);if(await page.locator('#assetCaptureSwitchPrompt').isVisible())await page.click('#assetCaptureSwitchDiscard');await page.evaluate(()=>{const clipboardData=new DataTransfer();clipboardData.setData('text/plain','종목명\t종목코드\t수량\t평균단가\t현재가\t평가금액\t매입금액\n다른 합성\t345678\t2\t100\t110\t220\t200');document.querySelector('#assetCapturePasteZone').dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}))});assert.equal(await field('holding','evaluationAmount',0).inputValue(),'220');await edit('holding','currentPrice',0,'111원');await page.click('#assetPreviewAddRow');await openAdvanced();await page.locator('[data-exclude-row="1"]').click();await openAdvanced();await page.click('#assetPreviewRevert');await openAdvanced();assert.equal(await field('holding','currentPrice',0).inputValue(),'110');await page.click('#assetPreviewCancel')}
    assert.equal(await page.evaluate(()=>writes),1);await page.close();console.log('PASS Hana browser '+width+': live edit/error recovery, qty derivation, add/exclude/revert, keyboard, no overflow, unchanged storage until canonical approval, Kiwoom/Toss editor');
  }}finally{await browser.close()}
}
