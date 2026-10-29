// Synthetic observations only. No OCR/network or real user storage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import qaSupport from './qa-1st-test-support.cjs';
const source=fs.readFileSync(new URL('../hani-asset-update-v1.js',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
function fixture(){let writes=0;const ctx={window:{},document:{getElementById:()=>null},console,structuredClone,today:()=> '2026-10-24',uid:()=> 'synthetic',nullableNum:v=>v==null||v===''?null:Number(v),inferMarket:(t,m)=>m||'KR',localStorage:{setItem(){writes++},removeItem(){writes++},clear(){writes++}}};vm.createContext(ctx);qaSupport.loadInputHelpers(ctx);vm.runInContext(main.split(/\r?\n/).find(l=>l.startsWith('function normalizeBrokerHolding(')),ctx);vm.runInContext(source,ctx);return {...ctx.window.HANI_ASSET_UPDATE_V1,writes:()=>writes};}
const account={id:'synthetic',type:'위탁'},ev=(field,label,value,confidence=.99)=>({field,label,raw:String(value),visible:true,confidence,alternatives:[]});
const row=extra=>({name:'합성펀드',ticker:'123456',market:'KR',buyCurrency:'KRW',...extra});
const screen=(holdings,extra={})=>({financialInstitution:'하나증권',layout:'hana_stock',amountCurrency:'KRW',holdings,...extra});
test('Hana two screens derive cost from B pair even when A valuation wins; both orders and reruns agree',()=>{
  for(const reverse of [false,true]){const api=fixture(),a=api.normalize(screen([row({evaluationAmount:706})],{layout:'hana_account',currentAsset:706,balance:0})),b=api.normalize(screen([row({quantity:2,evaluationAmount:700,pnl:-100})],{valuationAmount:700}));const d=api.mergeScreens(reverse?[b,a]:[a,b]),h=d.holdings[0];assert.equal(h.purchaseAmount,800);assert.equal(h.buyPrice,400);assert.equal(api.provenance(h,'purchaseAmount').kind,'DERIVED');assert.equal(api.provenance(h,'purchaseAmount').formula,'evaluationAmount-pnl');assert.equal(api.validation(d).blocking,false);assert.match(api.validation(d).message,/실시간 차이/);assert.equal(api.exceptionReview(d,account).count,0);api.deriveHolding(h);assert.equal(h.purchaseAmount,800);assert.equal(h.buyPrice,400);assert.equal(api.writes(),0);}
});
test('Hana reverse calculation cannot mix separate screens, low-confidence, currencies or impossible cost',()=>{
  for(const changes of [{pnl:null},{buyCurrency:''},{pnlCurrency:'USD'},{pnl:900}]){const api=fixture(),d=api.mergeScreens([api.normalize(screen([row({quantity:2,evaluationAmount:700,pnl:-100,...changes})]))]);assert.equal(d.holdings[0].purchaseAmount,null);}
  const api=fixture(),d=api.mergeScreens([api.normalize(screen([row({quantity:2,evaluationAmount:700})])),api.normalize(screen([row({pnl:-100})]))]);assert.equal(d.holdings[0].purchaseAmount,null);
  const low=api.mergeScreens([api.normalize(screen([row({quantity:2,evaluationAmount:700,pnl:-100,evidence:[ev('quantity','수량',2),ev('evaluationAmount','평가금액',700),ev('pnl','평가손익',-100,.5)]})],{accountEvidence:[]}))]);assert.equal(low.holdings[0].purchaseAmount,null);assert.ok(api.exceptionReview(low,account).count>0);
});
test('Hana visible cost and explicit zero remain authoritative; missing quantity never becomes inferred',()=>{
  const api=fixture();for(const cost of [0,820]){const h=api.mergeScreens([api.normalize(screen([row({quantity:2,purchaseAmount:cost,evaluationAmount:700,pnl:-100})]))]).holdings[0];assert.equal(h.purchaseAmount,cost);assert.equal(api.provenance(h,'purchaseAmount').kind,'VISIBLE_SOURCE');}
  const h=api.mergeScreens([api.normalize(screen([row({evaluationAmount:700,pnl:-100})]))]).holdings[0];assert.equal(h.purchaseAmount,800);assert.equal(h.quantity,null);assert.equal(h.buyPrice,null);
});
test('Toss investment total omits cash-inclusive assets/date exceptions; genuine ambiguity still requires confirmation',async()=>{
  const api=fixture(),d=api.mergeScreens([api.normalize({financialInstitution:'토스증권',layout:'toss_pc',section:'all',amountCurrency:'KRW',accountEvidence:[ev('currentAsset','내 투자',700)],holdings:[row({quantity:2,evaluationAmount:700,evidence:[ev('quantity','수량',2),ev('evaluationAmount','평가금액',700)]})]})]);d.mode='image';assert.equal(d.currentAsset,null);assert.equal(d.assets,null);assert.equal(d.evaluation,700);assert.equal(api.exceptionReview(d,account).count,0);assert.match(api.exceptionSummary(d,account),/입력일 기준 2026-10-24/);assert.doesNotMatch(JSON.stringify(d),/sourceAsOf|reverseCost|derivedFrom/);
  d.holdings[0].ticker='';await api.resolveIntakeHoldings(d.holdings,async()=>[{name:'합성펀드',symbol:'123456',market:'KOSPI',currency:'KRW'},{name:'합성펀드',symbol:'234567',market:'KOSDAQ',currency:'KRW'}]);assert.equal(api.exceptionReview(d,account).count,1);assert.equal(d.holdings[0].ticker,'');assert.equal(api.writes(),0);
});
test('missing optional holding valuation is omitted while quantity and unknown money units remain required',()=>{
  const api=fixture(),d=api.mergeScreens([api.normalize(screen([row({quantity:2})],{currentAsset:700}))]);assert.equal(api.exceptionReview(d,account).count,0);d.holdings[0].quantity=null;assert.ok(api.exceptionReview(d,account).fields.some(f=>f.key==='quantity'));d.holdings[0].buyCurrency='';d.holdings[0].purchaseAmount=800;assert.ok(api.exceptionReview(d,account).fields.some(f=>f.key==='buyCurrency'));
});
test('missing account field in a companion screen does not reopen a confidently read value; low confidence still asks',()=>{
  const api=fixture(),a=screen([],{accountEvidence:[ev('currentAsset','계좌 총액',700)]}),b=screen([],{accountEvidence:[ev('evaluation','평가금액',700)]});
  for(const inputs of [[a,b],[b,a]]){const d=api.mergeScreens(inputs.map(api.normalize));assert.equal(d.currentAsset,700);assert.equal(api.exceptionReview(d,account).count,0);}
  const d=api.mergeScreens([api.normalize(screen([],{accountEvidence:[ev('currentAsset','계좌 총액',700,.5)]}))]);assert.ok(api.exceptionReview(d,account).fields.some(f=>f.key==='currentAsset'));
  const unknown=api.mergeScreens([api.normalize({...a,financialInstitution:'합성증권',layout:'unknown'})]);assert.ok(api.exceptionReview(unknown,account).fields.some(f=>f.key==='currentAsset'),'unknown layout remains uncertain even with high numeric confidence');
});
