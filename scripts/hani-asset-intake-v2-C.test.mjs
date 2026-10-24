// Synthetic values only. Isolated memory/storage doubles; never opens user data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../hani-asset-update-v1.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const dynamic=['currentPrice','evaluationAmount','pnl','returnRate','weight'];
const holding=(extra={})=>({id:'held',instrumentId:'KR:123456',name:'합성전자',ticker:'123456',market:'KR',buyCurrency:'KRW',quantity:3,buyPrice:100,purchaseAmount:300,currentPrice:110,evaluationAmount:330,pnl:30,returnRate:10,weight:75,...extra});
const account=()=>({accountId:'hana',accountName:'합성 하나',enabled:true,estimatedAssets:440,totalPurchase:400,totalEvaluation:440,totalPnl:40,totalReturn:10,holdings:[holding(),holding({id:'omitted',instrumentId:'KR:234567',name:'합성펀드',ticker:'234567',quantity:1,purchaseAmount:100,evaluationAmount:110})]});
const data=()=>({version:'2.9.15-safe-baseline-bootstrap',accounts:[{id:'hana',name:'합성 하나',broker:'하나증권',type:'위탁'},{id:'other',name:'다른 계좌',broker:'합성증권',type:'ISA'}],investmentBrokerSnapshots:[{id:'history',mode:'actual',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-20',accounts:[account()]},{id:'current',mode:'actual',status:'confirmed',period:'2026-10',snapshotDate:'2026-10-20',accounts:[account(),{...account(),accountId:'other'}]}],ui:{series:['hana','other']},tasks:[{id:'untouched',title:'보존'}]});
const draft=(extra={})=>({mode:'manual',accountId:'hana',accountName:'합성 하나',broker:'하나증권',accountType:'위탁',date:'2026-10-24',assets:440,currentAsset:440,evaluation:null,purchase:null,pnl:null,returnRate:null,holdings:[{name:'합성전자',ticker:'123456',market:'KR',quantity:3,buyCurrency:'KRW'}],...extra});
function fixture(){
  let stored=JSON.stringify(data()),writes=0,backup=0,failure='',refreshError=false;
  const state=data(),nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',dataset:{},style:{},innerHTML:'',querySelectorAll:()=>[],focus(){},appendChild(){},setAttribute(){},scrollIntoView(){},closest(){return null}});return nodes.get(id)};
  const ctx={window:{},document:{getElementById:node},console:{error(){}},structuredClone,state,uid:()=> 'synthetic-new',nullableNum:v=>v==null||v===''?null:Number(v),inferMarket:(t,m)=>m||'KR',n:v=>Number(v)||0,today:()=> '2026-10-24',STORAGE_KEY:'hani_os_life_v23',
    localStorage:{getItem(){if(failure==='read')throw Error('read failed');return stored},setItem(){throw Error('direct write forbidden')},removeItem(){throw Error('remove forbidden')},clear(){throw Error('clear forbidden')}},
    save(){writes++;if(failure==='throw')throw Error('save threw');if(failure==='false')return {ok:false,message:'save refused'};stored=JSON.stringify(state);if(failure==='corrupt'){const bad=JSON.parse(stored);bad.investmentBrokerSnapshots.at(-1).accounts[0].totalEvaluation=999;stored=JSON.stringify(bad)}return {ok:true}},
    exportData(){backup++;return failure!=='backup'},renderAll(){if(refreshError)throw Error('refresh failed')},toast(){},officialBrokerSorted:()=>state.investmentBrokerSnapshots.filter(s=>s.mode==='actual'),brokerBlank:()=>({id:'new-month',mode:'actual',accounts:[]})};
  vm.createContext(ctx);for(const name of ['inferMarket','normalizeBrokerHolding','normalizeBrokerAccount','normalizeBrokerSnapshot'])vm.runInContext(main.split(/\r?\n/).find(l=>l.startsWith('function '+name+'(')),ctx);
  // Expose lexical owners only in this VM. Production source has no test API.
  const instrumented=source.replace('if(!root)return;','window.testC={approve,approvePositions,render,set:d=>{draft=d;selected=[{name:"synthetic.png"}];},draft:()=>draft,selected:()=>selected};if(!root)return;');
  state.investmentBrokerSnapshots=state.investmentBrokerSnapshots.map(ctx.normalizeBrokerSnapshot);stored=JSON.stringify(state);vm.runInContext(instrumented,ctx);ctx.document.getElementById=node;
  const api=ctx.window.HANI_ASSET_UPDATE_V1,control=ctx.window.testC;
  return {api,control,state,node,writes:()=>writes,backups:()=>backup,stored:()=>stored,fail:v=>{failure=v},refreshFails:()=>{refreshError=true}};
}
const json=v=>JSON.stringify(v);
const saved=f=>JSON.parse(f.stored()).investmentBrokerSnapshots.at(-1).accounts.find(a=>a.accountId==='hana');
test('exact unique identity retains ownership/cost, clears all missing dynamic fields including omitted holdings',()=>{
  const f=fixture(),old=account().holdings,before=json(old),next=f.api.mergeWithExistingHoldings([{ticker:'A123456',market:'KR',name:'OCR 별칭',quantity:0,currentPrice:0,pnl:0,returnRate:0}],old);
  assert.equal(next.length,2);assert.equal(next[0].id,'held');assert.equal(next[0].name,'합성전자');assert.equal(next[0].quantity,0);assert.equal(next[0].buyPrice,100);assert.equal(next[0].purchaseAmount,300);
  for(const k of ['currentPrice','pnl','returnRate'])assert.equal(next[0][k],0);
  for(const k of ['evaluationAmount','weight'])assert.equal(next[0][k],null);
  for(const k of dynamic)assert.equal(next[1][k],null,k);
  assert.equal(next[1].quantity,1);assert.equal(json(old),before);assert.equal(f.writes(),0);
});
test('known code, market, instrument conflicts and ambiguous/name-only candidates never reuse stored facts',()=>{
  const f=fixture(),old=holding();
  for(const incoming of [{ticker:'345678',market:'KR',name:old.name},{ticker:old.ticker,market:'US',name:old.name},{instrumentId:'different',ticker:old.ticker,market:'KR',name:old.name}]){
    incoming.quantity=1;const merged=f.api.mergeWithExistingHoldings([incoming],[old]);assert.equal(merged.length,2,json(incoming));assert.notEqual(merged[1].id,old.id);assert.equal(merged[1].buyPrice,null);assert.equal(merged[1].quantity,1);
    assert.equal(f.api.previewHolding(incoming,[old]).matched,false);
  }
  const ambiguous=[old,{...old,id:'duplicate'}];assert.equal(f.api.previewHolding({ticker:old.ticker,market:'KR',quantity:1},ambiguous).matched,false);
  assert.equal(f.api.mergeWithExistingHoldings([{name:old.name,market:'KR',quantity:1}],[old])[0].id,old.id);
  assert.equal(f.api.mergeWithExistingHoldings([{instrumentId:old.instrumentId,quantity:1}],[old])[0].id,old.id);
  // A unique name with no conflicting code/market is the same holding in either direction (legacy rows often lack market/ticker); this prevents duplicates.
  assert.equal(f.api.mergeWithExistingHoldings([{name:old.name,market:'',quantity:1}],[old]).length,1);
  assert.equal(f.api.mergeWithExistingHoldings([{name:old.name,ticker:old.ticker,market:'KR',quantity:1}],[{...old,ticker:'',market:'',instrumentId:''}]).length,1);
});
test('approve persists null observations, keeps partial/unknown omissions and preserves other accounts/history byte for byte',()=>{
  for(const holdingsComplete of [false,undefined]){const f=fixture(),before=structuredClone(f.state),d=draft({holdingsComplete});f.control.set(d);assert.equal(f.writes(),0);f.control.approve();assert.equal(f.writes(),1);assert.equal(f.control.draft(),null);
    const a=saved(f);for(const k of ['totalEvaluation','totalPnl','totalReturn'])assert.equal(a[k],null,k);assert.equal(a.totalPurchase,400);assert.equal(a.holdings.length,2);for(const h of a.holdings)for(const k of dynamic)assert.equal(h[k],null,k);
    const persisted=JSON.parse(f.stored());assert.equal(json(persisted.investmentBrokerSnapshots[0]),json(before.investmentBrokerSnapshots[0]));assert.equal(json(persisted.investmentBrokerSnapshots[1].accounts[1]),json(before.investmentBrokerSnapshots[1].accounts[1]));assert.equal(json(persisted.tasks),json(before.tasks));assert.equal(persisted.version,before.version);assert.equal(json(d.holdings),json(draft().holdings));
  }
});
test('empty incoming list clears stale valuation while preserving holdings; explicit account zero persists',()=>{
  const f=fixture();f.control.set(draft({holdings:[],purchase:undefined,assets:0,currentAsset:0,evaluation:0,pnl:0,returnRate:0}));f.control.approve();const a=saved(f);assert.equal(a.holdings.length,2);assert.equal(a.totalPurchase,400);for(const k of ['estimatedAssets','totalEvaluation','totalPnl','totalReturn'])assert.equal(a[k],0);for(const h of a.holdings)for(const k of dynamic)assert.equal(h[k],null);
});
test('positions approval backs up, retains cost facts and clears dynamic values for incoming and omitted holdings',async()=>{
  const f=fixture(),before=json(f.state.investmentBrokerSnapshots);f.control.set(draft({positionsOnly:true,marketLinked:true,holdingListMode:'partial',assets:null,currentAsset:null,holdings:[{ticker:"123456",market:"KR",name:"합성전자",quantity:4,buyCurrency:"KRW"}]}));await f.control.approve();assert.equal(f.backups(),1);assert.equal(f.writes(),1);const s=JSON.parse(f.stored()).investmentBrokerSnapshots;assert.equal(json(s.slice(0,-1)),before);assert.equal(s.at(-1).recordType,'positions');assert.equal(saved(f).holdings[0].purchaseAmount,300);assert.equal(saved(f).holdings[0].quantity,4);for(const h of saved(f).holdings)for(const k of dynamic)assert.equal(h[k],null);
});
test('complete list still requires confirmation/explicit missing holdings; backup failure writes zero',async()=>{
  for(const mode of ['complete','backup']){const f=fixture(),before=json(f.state),d=draft({positionsOnly:true,marketLinked:true,holdingListMode:mode==='complete'?'complete':'partial',completeConfirmed:true,assets:null,currentAsset:null});f.control.set(d);if(mode==='backup')f.fail('backup');await f.control.approve();assert.equal(f.writes(),0);assert.equal(json(f.state),before);assert.equal(f.control.draft(),d);}
});
test('save false/throw rolls back memory and preserves stored bytes, input and Preview in both approval paths',async()=>{
  for(const positionsOnly of [false,true])for(const fault of ['false','throw']){const f=fixture(),before=json(f.state),stored=f.stored(),d=draft({positionsOnly,marketLinked:positionsOnly});f.control.set(d);f.control.render();const previewBefore=f.node('assetCapturePreview').innerHTML;f.fail(fault);await f.control.approve();assert.equal(json(f.state),before);assert.equal(f.stored(),stored);assert.equal(f.control.draft(),d);assert.equal(f.control.selected().length,1);assert.equal(f.node('assetCapturePreview').innerHTML,previewBefore);assert.match(f.node('assetCaptureStatus').textContent,/저장 실패/);}
});
test('read-back failure/corruption restores memory and keeps draft, but cannot undo a successful disk write',async()=>{
  for(const fault of ['read','corrupt']){const f=fixture(),before=json(f.state),d=draft();f.control.set(d);f.fail(fault);await f.control.approve();assert.equal(f.writes(),1);assert.equal(json(f.state),before);assert.equal(f.control.draft(),d);assert.notEqual(f.stored(),before);assert.match(f.node('assetCaptureStatus').textContent,/저장 실패/);}
  const f=fixture(),before=json(f.state);f.control.set(draft({positionsOnly:true,marketLinked:true}));f.fail('read');await f.control.approve();assert.equal(json(f.state),before);assert.notEqual(f.stored(),before);assert.ok(f.control.draft());
});
test('successful storage followed by refresh failure stays saved and reports a warning',()=>{
  const f=fixture();f.control.set(draft());f.refreshFails();f.control.approve();assert.equal(f.control.draft(),null);assert.equal(saved(f).totalEvaluation,null);assert.equal(f.node('assetCaptureStatus').dataset.tone,'warning');
});
test('Preview does not promise stale dynamic reuse, and writes nothing before approval',()=>{
  const f=fixture();f.control.set(draft());f.control.render();const html=f.node('assetCapturePreview').innerHTML;
  assert.match(html,/data-edit-badge="holding:0:buyPrice">미확인 · 기존값 유지/);
  for(const key of ['currentPrice','evaluationAmount','pnl','returnRate'])assert.doesNotMatch(html,new RegExp('data-edit-badge="holding:0:'+key+'">[^<]*기존값 유지'));
  assert.equal(f.writes(),0);
});
test('a new month leaves every prior snapshot and other account source bytes unchanged',()=>{
  const f=fixture(),before=JSON.stringify(f.state.investmentBrokerSnapshots);f.control.set(draft({date:'2026-11-02'}));f.control.approve();const snapshots=JSON.parse(f.stored()).investmentBrokerSnapshots;assert.equal(JSON.stringify(snapshots.slice(0,-1)),before);assert.equal(snapshots.at(-1).period,'2026-11');for(const key of ['totalEvaluation','totalPnl','totalReturn'])assert.equal(saved(f)[key],null);
});
test('224 immutable write-call surface remains identical after the approved storage contract patch',()=>{
  const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/ocr-accuracy-224/write-path-baseline.json',import.meta.url),'utf8'));
  const calls=source.match(/\b(?:save|commit|localStorage\.(?:setItem|removeItem|clear))\([^)]*\)/g);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(calls)).digest('hex'),baseline.writeCallsSha256);
});
test('Hana synthetic card + all-stock shapes: zero cash, partial cards, near-time values and derived cost never borrow old observations',()=>{
  const f=fixture(),a={financialInstitution:'하나증권',layout:'hana_account',section:'domestic',holdingsComplete:false,amountCurrency:'KRW',asOfDate:'2026-10-24',currentAsset:4400,balance:0,withdrawable:0,valuationAmount:4400,holdings:[{name:'합성전자',ticker:'123456',market:'KR',buyCurrency:'KRW',purchaseAmount:4800,evaluationAmount:4000,pnl:-800,returnRate:-16.67},{name:'합성펀드',ticker:'234567',market:'KR',buyCurrency:'KRW',evaluationAmount:400}]},b={financialInstitution:'하나증권',layout:'hana_stock',section:'all',holdingsComplete:null,amountCurrency:'KRW',asOfDate:'2026-10-24',valuationAmount:4390,pnl:-910,holdings:[{name:'합성전자',ticker:'123456',market:'KR',buyCurrency:'KRW',quantity:12,evaluationAmount:3995,pnl:-805},{name:'합성펀드',ticker:'234567',market:'KR',buyCurrency:'KRW',quantity:2,evaluationAmount:395,pnl:-105}]};
  for(const x of [a,b])x.accountEvidence=Object.entries({currentAsset:x.currentAsset,balance:x.balance,withdrawable:x.withdrawable,evaluation:x.valuationAmount,pnl:x.pnl}).map(([field,value])=>({field,label:({currentAsset:'계좌 총액',balance:'예수금',withdrawable:'출금가능',evaluation:'평가금액',pnl:'평가손익'})[field],raw:value==null?null:String(value),visible:value!=null,confidence:.99,alternatives:[]}));for(const x of [a,b])for(const h of x.holdings)h.evidence=Object.entries({quantity:'수량',purchaseAmount:'매입금액',evaluationAmount:'평가금액',pnl:'평가손익',returnRate:'수익률'}).map(([field,label])=>({field,label,raw:h[field]==null?null:String(h[field]),visible:h[field]!=null,confidence:.99,alternatives:[]}));const d=f.api.mergeScreens([f.api.normalize(a),f.api.normalize(b)]);assert.equal(d.balance,0);assert.equal(d.withdrawable,0);assert.equal(d.holdings[0].quantity,12);assert.equal(d.holdings[0].buyPrice,400);assert.equal(d.holdings[1].quantity,2);assert.equal(d.holdings[1].purchaseAmount,500);assert.equal(d.holdings[1].buyPrice,250);assert.equal(f.api.validation(d).blocking,false,JSON.stringify(f.api.validation(d)));
  const merged=f.api.mergeWithExistingHoldings(d.holdings,account().holdings);assert.equal(merged.length,2);assert.notEqual(merged[0].currentPrice,110);assert.equal(f.writes(),0);f.control.set({...d,mode:'manual',accountId:'hana',accountName:'합성 하나',accountType:'위탁'});f.control.approve();assert.equal(f.writes(),1);assert.equal(saved(f).totalEvaluation,4390);assert.equal(saved(f).totalPnl,-910);assert.equal(saved(f).holdings[0].quantity,12);assert.equal(saved(f).holdings[0].buyPrice,400);assert.equal(saved(f).holdings[1].currentPrice,d.holdings[1].currentPrice);
});
