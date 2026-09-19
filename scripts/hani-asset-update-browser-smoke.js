const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const path=require("node:path");

const url=process.env.HANI_PREVIEW_URL||"http://127.0.0.1:4173";
const storageKey=["hani","os","life","v23"].join("_");
const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const period=today.slice(0,7);
const initialState={
  version:"2.9.15-safe-baseline-bootstrap",
  accounts:[{id:"toss",name:"토스",type:"미국투자용",broker:"토스증권",number:"",openingCash:0}],
  investmentBrokerSnapshots:[{id:"snapshot-toss",mode:"actual",period,snapshotDate:today,status:"confirmed",note:"before screenshot update",accounts:[{id:"snapshot-account-toss",accountId:"toss",accountName:"토스",enabled:true,estimatedAssets:600000,totalPurchase:610000,totalEvaluation:600000,totalPnl:-10000,totalReturn:-1.64,loanAmount:null,holdings:[]}],createdAt:"2026-09-01T00:00:00.000Z",updatedAt:"2026-09-01T00:00:00.000Z",revision:1}],
  tasks:[{id:"keep-task",title:"보존 확인",status:"todo"}],
  ui:{series:["total","toss"]},meta:{lastSavedAt:"",lastBackupAt:"",lastImportAt:""}
};
const extraction={target_hint:"asset",financial_institution:"토스",account_type:"증권 위탁",total_evaluation:"633,890원",total_purchase:"648,865원",total_pnl:"-14,974원",total_return:"-2.3%"};

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.HANI_CHROME_PATH||"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"});
  const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:"Asia/Seoul"});
  await context.addInitScript(({key,state,origin})=>{if(location.origin===origin){if(!localStorage.getItem(key))localStorage[key]=JSON.stringify(state);localStorage.hani_os_gate_session_v2="1"}},{key:storageKey,state:initialState,origin:new URL(url).origin});
  await context.route("**/functions/v1/hani-agent-orchestrator",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,extraction})}));
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  page.on("dialog",dialog=>dialog.dismiss());
  await page.goto(url,{waitUntil:"networkidle"});
  await page.evaluate(()=>{unlockLoginGate();cloudClient={auth:{getSession:async()=>({data:{session:{access_token:"browser-smoke"}},error:null})}};cloudUser={id:"browser-smoke"}});
  if(await page.getByRole("button",{name:"자산 업데이트",exact:true}).count()===0)throw new Error(`자산 업데이트 메뉴를 찾지 못했습니다. title=${await page.title()} body=${(await page.locator("body").innerText()).slice(0,500)} pageErrors=${errors.join(" | ")}`);
  await page.getByRole("button",{name:"자산 업데이트",exact:true}).click();
  await page.locator("#assetCaptureFiles").setInputFiles(path.join(__dirname,"../godsaeng_icon_webtoon.png"));
  await page.locator("#assetCaptureAnalyze").click();
  await page.getByText("기존 토스 계좌를 업데이트합니다.",{exact:true}).waitFor({state:"visible"});
  assert.equal(await page.locator("#assetAccountChoice").count(),0,"unique Toss account must not render a dropdown");
  assert.match(await page.locator(".asset-validation").innerText(),/WARNING.*미세 오차 1원.*저장 가능/s);
  assert.equal(await page.locator("#assetPreviewApprove").isEnabled(),true);
  assert.match(await page.locator("#assetCapturePreview").innerText(),/600,000원 → 633,890원/);
  await page.locator("#assetPreviewApprove").click();
  await page.getByText(/저장 성공 · 토스 계좌가 633,890원으로 업데이트되었습니다/).waitFor({state:"visible"});
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  const savedAccount=saved.investmentBrokerSnapshots.find(x=>x.id==="snapshot-toss").accounts.find(x=>x.accountId==="toss");
  assert.equal(saved.accounts.length,1);assert.equal(saved.tasks.some(x=>x.id==="keep-task"),true);
  assert.equal(savedAccount.estimatedAssets,633890);assert.equal(savedAccount.totalEvaluation,633890);assert.equal(savedAccount.totalPurchase,648865);assert.equal(savedAccount.totalPnl,-14974);assert.equal(savedAccount.totalReturn,-2.3);
  await page.reload({waitUntil:"networkidle"});
  await page.evaluate(()=>{unlockLoginGate();cloudClient={auth:{getSession:async()=>({data:{session:{access_token:"browser-smoke"}},error:null})}};cloudUser={id:"browser-smoke"}});
  const reloaded=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey),reloadedAccount=reloaded.investmentBrokerSnapshots.find(x=>x.id==="snapshot-toss").accounts.find(x=>x.accountId==="toss");
  assert.equal(reloadedAccount.estimatedAssets,633890);assert.equal(reloadedAccount.totalPnl,-14974);assert.equal(reloaded.accounts.length,1);assert.equal(reloaded.tasks.some(x=>x.id==="keep-task"),true);
  await page.getByRole("button",{name:"자산",exact:true}).click();assert.equal(await page.locator("#asset").isVisible(),true);
  await page.getByRole("button",{name:"자산 업데이트",exact:true}).click();assert.equal(await page.locator("#investmentIntake").isVisible(),true);
  await page.setViewportSize({width:390,height:844});
  await page.locator("#assetCaptureFiles").setInputFiles(path.join(__dirname,"../godsaeng_icon_webtoon.png"));
  await page.locator("#assetCaptureAnalyze").click();
  await page.getByText("기존 토스 계좌를 업데이트합니다.",{exact:true}).waitFor({state:"visible"});
  assert.equal(await page.locator("#assetAccountChoice").count(),0);
  const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,logos:[...document.images].filter(x=>x.getClientRects().length).map(x=>({alt:x.alt,ok:x.complete&&x.naturalWidth>0}))}));
  assert.ok(mobile.overflow<=1,`mobile horizontal overflow: ${mobile.overflow}`);assert.equal(mobile.logos.every(x=>x.ok),true,`unloaded visible logo: ${JSON.stringify(mobile.logos.filter(x=>!x.ok))}`);
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException("QA forced write failure","QuotaExceededError")}});
  await page.locator("#assetPreviewApprove").click();
  await page.getByText(/저장 실패:/).waitFor({state:"visible"});
  assert.match(await page.locator("#assetCaptureStatus").innerText(),/저장 실패: 브라우저 저장 공간이 부족합니다/);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({state:"PASS",desktop:{autoMatch:true,dropdown:false,warning:"1원",saved:633890},reload:{persisted:true,pnl:-14974,dataLoss:0},mobile:{width:390,overflow:mobile.overflow,visibleLogos:mobile.logos.length},saveFailureFeedback:true,pageErrors:errors.length},null,2));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
