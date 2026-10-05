import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync(new URL("../hani-main.js",import.meta.url),"utf8");
const start=source.indexOf("function normalizeBrokerHolding");
const end=source.indexOf("function brokerSorted",start);
assert.ok(start>=0&&end>start,"broker calculation anchors must exist");
const sandbox={
  state:{accounts:[],investmentCashFlows:[]},
  uid:()=>"fixture-id",
  inferMarket:()=>"KR",
  nullableNum:value=>value===null||value===undefined||value===""?null:Number(value),
  monthKeyNow:()=>"2026-10",
  today:()=>"2026-10-06",
  lastDayOfMonth:()=>"2026-10-31",
  n:value=>Number(value)||0,
  structuredClone,
  console
};
vm.createContext(sandbox);
vm.runInContext(`${source.slice(start,end)}\nthis.brokerCalc=brokerCalc;`,sandbox);

const calculated=sandbox.brokerCalc({period:"2026-10",accounts:[
  {enabled:true,estimatedAssets:null,totalPurchase:null,totalEvaluation:null,totalPnl:null,totalReturn:null,holdings:[{quantity:2,buyPrice:100,currentPrice:null,purchaseAmount:null,evaluationAmount:null,pnl:null,returnRate:null}]}
]});
assert.equal(calculated.accounts[0].purchase,200);
assert.equal(calculated.accounts[0].evaluation,null,"unknown current value must stay null");
assert.equal(calculated.accounts[0].pnl,null,"unknown evaluation must not become a zero-derived loss");
assert.equal(calculated.accounts[0].assets,null);
assert.equal(calculated.total,null,"unknown account assets must keep the portfolio total unknown");
assert.equal(calculated.evaluation,null);
assert.equal(calculated.pnl,null);

const explicitZero=sandbox.brokerCalc({period:"2026-10",accounts:[
  {enabled:true,estimatedAssets:0,totalPurchase:0,totalEvaluation:0,totalPnl:0,totalReturn:0,holdings:[]}
]});
assert.equal(explicitZero.total,0,"an explicit zero remains a real zero");
assert.equal(explicitZero.evaluation,0);
assert.equal(explicitZero.purchase,0);
assert.equal(explicitZero.pnl,0);

const mixed=sandbox.brokerCalc({period:"2026-10",accounts:[
  {enabled:true,estimatedAssets:300,totalPurchase:200,totalEvaluation:300,totalPnl:100,totalReturn:null,holdings:[]},
  {enabled:true,estimatedAssets:null,totalPurchase:null,totalEvaluation:null,totalPnl:null,totalReturn:null,holdings:[]}
]});
assert.equal(mixed.total,null,"a known account must not hide an unknown account as zero");
assert.equal(mixed.evaluation,null);
assert.equal(mixed.pnl,null);

console.log("PASS: brokerCalc preserves unknown values as null while retaining explicit zero.");
