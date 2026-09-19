(function(){
"use strict";
const root=document.getElementById("assetCaptureV1");
const files=document.getElementById("assetCaptureFiles"),pasteZone=document.getElementById("assetCapturePasteZone"),list=document.getElementById("assetCaptureFileList"),status=document.getElementById("assetCaptureStatus"),preview=document.getElementById("assetCapturePreview"),analyze=document.getElementById("assetCaptureAnalyze"),manager=document.getElementById("assetAccountManager");
let selected=[],draft=null;
const selectedHints=new Map();
const text=v=>String(v??"").replace(/\s+/g," ").trim(),number=v=>{if(v===null||v===undefined||text(v)==="")return null;const m=text(v).replace(/[,₩원%\s]/g,"").match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null},safe=v=>text(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
function value(o,keys){for(const k of keys){if(o?.[k]!==undefined&&o[k]!==null&&text(o[k])!=="")return o[k]}return null}
function normalize(raw={}){const x=raw.data&&typeof raw.data==="object"?raw.data:raw,extractedText=text(value(x,["extracted_text","extractedText"])),evaluation=number(value(x,["valuationAmount","total_evaluation","evaluation","totalEvaluation"])),currentAsset=number(value(x,["currentAsset","total_assets","current_assets","estimatedAssets"])),balance=number(value(x,["balance","cashBalance","cash_balance","예수금","현금잔고","현재잔액"])),accountNumber=text(value(x,["accountNumber","account_number","계좌번호"]))||((extractedText.match(/\b\d{6,}-\d{2,}\b/)||[])[0]||"");return {broker:text(value(x,["financialInstitution","broker","financial_institution","institution","금융사"])),accountName:text(value(x,["accountName","account_name","productName","product_name","alias","name","계좌명","상품명","별칭"])),accountType:text(value(x,["accountType","account_type","type","계좌유형"])),accountNumber,currentAsset,balance,assets:currentAsset??evaluation??balance,purchase:number(value(x,["purchaseAmount","principal","total_purchase","totalPurchase","원금"])),evaluation,pnl:number(value(x,["profitLoss","total_pnl","profit_loss","totalPnl"])),returnRate:number(value(x,["returnRate","total_return","return_rate","totalReturn"])),date:text(value(x,["asOfDate","as_of_date","snapshot_date","snapshotDate","date"])),holdings:Array.isArray(value(x,["holdings","positions","보유종목"]))?value(x,["holdings","positions","보유종목"]):[],extractedText,accountId:text(x.accountId),mode:text(x.mode||"image"),original:x.original||null}}
function sameAccount(a,b){if(a.accountNumber&&b.accountNumber)return a.accountNumber===b.accountNumber;const ids=["broker","accountName","accountType"].filter(k=>a[k]&&b[k]);return ids.length>0&&ids.every(k=>text(a[k]).toLowerCase()===text(b[k]).toLowerCase())}
function mergeScreens(rows=[]){const out={broker:"",accountName:"",accountType:"",accountNumber:"",currentAsset:null,balance:null,assets:null,purchase:null,evaluation:null,pnl:null,returnRate:null,date:"",holdings:[],extractedText:"",screenCount:rows.length};for(const row of rows){for(const k of ["broker","accountName","accountType","accountNumber","date"])if(!out[k]&&row[k])out[k]=row[k];for(const k of ["currentAsset","balance","purchase","evaluation","pnl","returnRate"])if(out[k]===null&&row[k]!==null)out[k]=row[k];out.holdings.push(...(row.holdings||[]));out.extractedText=[out.extractedText,row.extractedText].filter(Boolean).join("\n")}
  if(out.currentAsset===null&&out.evaluation!==null&&out.balance!==null)out.currentAsset=out.evaluation+out.balance;
  out.assets=out.currentAsset??out.evaluation??out.balance;
  out.reconciliation=out.currentAsset!==null&&out.evaluation!==null&&out.balance!==null?{difference:Math.abs(Math.round(out.currentAsset-out.evaluation-out.balance)),total:out.currentAsset,evaluation:out.evaluation,cash:out.balance}:null;
  return out}
function merge(a,b){return mergeScreens([a,b])}
function validation(d){
  if(d.assets===null&&d.evaluation===null)return {ok:false,blocking:true,severity:"ERROR",mismatch:0,message:"평가금액을 확인할 수 없어 저장할 수 없습니다."};
  const actual=d.evaluation!==null?d.evaluation:d.assets;
  if(d.purchase===null||d.pnl===null||actual===null)return {ok:true,blocking:false,severity:"INFO",mismatch:0,message:"원본 표시값을 우선 저장합니다. 검산에 필요한 일부 값은 화면에서 확인되지 않았습니다."};
  const expected=d.purchase+d.pnl,difference=Math.abs(Math.round(expected-actual)),ratio=difference/Math.max(Math.abs(expected),Math.abs(actual),1);
  if(!difference)return {ok:true,blocking:false,severity:"INFO",mismatch:0,ratio,message:"숫자 검산 완료 · 화면 원본값을 저장합니다."};
  const tolerated=difference<=100||ratio<=.0005;
  return tolerated
    ?{ok:true,blocking:false,severity:"WARNING",mismatch:difference,ratio,message:`미세 오차 ${difference.toLocaleString("ko-KR")}원 — 저장 가능 · 화면 원본값을 그대로 보존합니다.`}
    :{ok:false,blocking:true,severity:"ERROR",mismatch:difference,ratio,message:`숫자 검산 차이 ${difference.toLocaleString("ko-KR")}원 — 큰 불일치로 저장이 차단되었습니다.`};
}
const identity=v=>text(v).toLocaleLowerCase("ko-KR").replace(/주식회사|㈜|증권사|증권|은행|금융투자|계좌|상품/g,"").replace(/[^0-9a-z가-힣]/g,"");
const genericName=v=>/^(홍성민|종합|위탁종합|종합계좌|위탁계좌)$/.test(text(v).replace(/\s/g,""));
const hintKey=d=>identity(d.broker)&&text(d.accountType)?`${identity(d.broker)}|${identity(d.accountType)}`:"";
const typeTokens=v=>new Set(text(v).toLocaleLowerCase("ko-KR").replace(/[^0-9a-z가-힣]+/g," ").split(" ").filter(x=>x.length>1&&!/^(계좌|증권|종합|상품)$/.test(x)));
function typeMatch(a,b){const aa=typeTokens(a),bb=typeTokens(b);if(!aa.size||!bb.size)return false;for(const x of aa)for(const y of bb)if(x===y||x.includes(y)||y.includes(x))return true;return false}
function resolveAccountMatch(d,accounts=[]){
  if(d.accountId){const account=accounts.find(x=>x.id===d.accountId);return account?{kind:"matched",account,candidates:[account],reason:"selected"}:{kind:"missing",account:null,candidates:[],reason:"missing-selected"}}
  const brokerKey=identity(d.broker),nameKey=genericName(d.accountName)?"":identity(d.accountName);
  let candidates=[...accounts];
  if(brokerKey)candidates=candidates.filter(a=>{const key=identity(a.broker);return key&&(key===brokerKey||key.includes(brokerKey)||brokerKey.includes(key))});
  else if(nameKey)candidates=candidates.filter(a=>identity(a.name)===nameKey);
  else candidates=[];
  if(candidates.length>1&&nameKey){const named=candidates.filter(a=>identity(a.name)===nameKey);if(named.length)candidates=named}
  if(candidates.length>1&&d.accountType){const typed=candidates.filter(a=>typeMatch(a.type,d.accountType));if(typed.length)candidates=typed}
  if(candidates.length===1&&nameKey&&identity(candidates[0].name)!==nameKey&&identity(candidates[0].broker)!==nameKey)return {kind:"unresolved",account:null,candidates,reason:"name-conflict"};
  if(candidates.length===1&&genericName(d.accountName)&&d.accountType&&!typeMatch(candidates[0].type,d.accountType))return {kind:"unresolved",account:null,candidates,reason:"type-conflict"};
  if(candidates.length===1)return {kind:"matched",account:candidates[0],candidates,reason:"auto"};
  if(candidates.length>1)return {kind:"ambiguous",account:null,candidates,reason:"multiple"};
  return {kind:"unresolved",account:null,candidates:[],reason:"none"};
}
function accountDeleteImpact(data={},accountId=""){
  const brokerSnapshots=(data.investmentBrokerSnapshots||[]).filter(s=>(s.accounts||[]).some(a=>a.accountId===accountId)).length;
  const monthlySnapshots=(data.investmentMonthlySnapshots||[]).filter(s=>(s.accounts||[]).some(a=>a.accountId===accountId)).length;
  const transactions=(data.transactions||[]).filter(x=>x.accountId===accountId).length;
  const cashFlows=(data.investmentCashFlows||[]).filter(x=>x.accountId===accountId||x.toAccountId===accountId).length;
  const journals=(data.investmentJournal||[]).filter(x=>x.accountId===accountId).length;
  return {brokerSnapshots,monthlySnapshots,transactions,cashFlows,journals,blocking:monthlySnapshots+transactions+cashFlows+journals>0};
}
window.HANI_ASSET_UPDATE_V1={normalize,validation,sameAccount,merge,mergeScreens,resolveAccountMatch,typeMatch,accountDeleteImpact};
if(!root)return;
const isCash=t=>/입출금|현금|저축|파킹|CMA|예금|적금|주택|비상금/i.test(text(t));
function latestFor(id){const rows=officialBrokerSorted().filter(s=>s.accounts.some(a=>a.enabled&&a.accountId===id));const snap=rows.at(-1),account=snap?.accounts.find(a=>a.accountId===id);return {snap,account}}
function accountResolution(d){return resolveAccountMatch(d,state.accounts)}
function baseForDate(date){const period=date.slice(0,7),saved=[...brokerSorted("actual")].reverse().find(s=>s.period===period);return saved?normalizeBrokerSnapshot(structuredClone(saved)):brokerBlank("actual")}
function money(x){return x===null?"미확인":Math.round(x).toLocaleString("ko-KR")+"원"}
function accountLabel(d){return d.accountName||d.broker||d.accountType||"새 투자계좌"}
function render(){
  if(!draft){preview.innerHTML="";return}
  const resolution=draft.mode==="manual"?{kind:"matched",account:state.accounts.find(x=>x.id===draft.accountId),candidates:[]}:draft.mode==="new"?{kind:"new",account:null,candidates:[]}:accountResolution(draft);
  const match=resolution.account,v=validation(draft),old=draft.original||(match&&latestFor(match.id).account),imageMode=draft.mode==="image";
  const fields=[["금융사",draft.broker],[imageMode?"OCR 계좌명·상품명":"계좌명·상품명",draft.accountName],["계좌 유형",draft.accountType],[old?"현재 계좌 총액 → 업데이트":"계좌 총액",old?`${money(old.estimatedAssets)} → ${money(draft.assets)}`:money(draft.assets)],["예수금",money(draft.balance)],["주식 매입금액",money(draft.purchase)],["주식 평가금액",money(draft.evaluation)],["평가손익",money(draft.pnl)],["수익률",draft.returnRate===null?"미확인":draft.returnRate+"%"],["기준일",draft.date]];
  const headline=match?`기존 ${safe(match.name)} 계좌를 업데이트합니다.`:imageMode?"기존 계좌를 선택해 주세요. OCR 결과만으로 새 계좌를 만들지 않습니다.":resolution.kind==="missing"?"업데이트할 기존 계좌를 다시 확인해 주세요.":"새 계좌를 생성합니다.";
  const hint=selectedHints.get(hintKey(draft)),hintAccount=state.accounts.find(a=>a.id===hint),ordered=[...state.accounts].sort((a,b)=>Number(b.id===hint)-Number(a.id===hint));
  const select=`<label class="asset-preview-field asset-account-choice"><span>어느 계좌를 업데이트할까요?</span><select id="assetAccountChoice" ${state.accounts.length?"":"disabled"}><option value="">기존 계좌 선택</option>${ordered.map(a=>`<option value="${safe(a.id)}" ${match?.id===a.id?"selected":""}>${a.id===hint?"지난번 선택 · ":""}${safe(a.name)} · ${safe(a.broker)} · ${safe(a.type)}</option>`).join("")}</select></label>`;
  const chooser=imageMode?(match?`<details class="asset-account-override"><summary>다른 기존 계좌로 변경</summary>${select}</details>`:select):"";
  const note=imageMode&&!match?`<p class="asset-account-hint">${state.accounts.length?hintAccount?`지난번에는 ${safe(hintAccount.name)} 계좌를 선택했습니다. 이번 화면도 맞는지 확인해 주세요.`:"등록된 기존 계좌 중 하나를 선택해야 저장할 수 있습니다.":"등록된 계좌가 없습니다. 별도의 [+ 새 계좌 등록]을 선택해 주세요."}</p>`:"";
  const reconciliation=draft.reconciliation?`<div class="asset-validation ${draft.reconciliation.difference<=100?"info":"error"}" role="status"><b>${draft.reconciliation.difference<=100?"INFO":"ERROR"}</b><span>계좌 총액 ${money(draft.reconciliation.total)} = 주식 평가 ${money(draft.reconciliation.evaluation)} + 예수금 ${money(draft.reconciliation.cash)}${draft.reconciliation.difference?` · 차이 ${money(draft.reconciliation.difference)}`:" · 합계 일치"}</span></div>`:"";
  const missingPreserved=imageMode&&old&&(draft.purchase===null||!draft.holdings.length)?`<div class="asset-validation info" role="status"><b>INFO</b><span>이번 화면에 없는 ${[draft.purchase===null?"매입금액":"",!draft.holdings.length?"보유종목":""].filter(Boolean).join("·")}은 기존 값을 유지합니다.</span></div>`:"";
  preview.innerHTML=`<article class="asset-capture-preview"><header><b>${safe(match?.name||(imageMode?"계좌 확인 필요":accountLabel(draft)))}</b><span>${headline}</span></header><div class="asset-preview-grid">${fields.filter(([,value])=>value!==null&&value!==undefined&&value!==""&&value!=="미확인").map(([key,value])=>`<div class="asset-preview-field"><span>${safe(key)}</span><b>${safe(value)}</b></div>`).join("")}</div><div class="asset-validation ${v.severity.toLowerCase()}" role="status"><b>${safe(v.severity)}</b><span>${safe(v.message)}</span></div>${reconciliation}${missingPreserved}${chooser}${note}<div class="asset-preview-actions"><button class="btn" id="assetPreviewCancel" type="button">취소</button><button class="btn finance" id="assetPreviewApprove" type="button" ${v.blocking||draft.reconciliation?.difference>100||!draft.date||resolution.kind==="missing"||(imageMode&&!match)?"disabled":""}>승인하고 저장</button></div></article>`;
  const choice=document.getElementById("assetAccountChoice");
  if(choice)choice.onchange=()=>{draft.accountId=choice.value;draft.selectedByUser=!!choice.value;render()};
document.getElementById("assetPreviewCancel").onclick=()=>{draft=null;render()};
document.getElementById("assetPreviewApprove").onclick=approve}
function makeHolding(h){return normalizeBrokerHolding({name:value(h,["name","symbol_name","종목명"]),ticker:value(h,["ticker","symbol","종목코드"]),quantity:value(h,["quantity","qty","수량"]),buyPrice:value(h,["averagePrice","average_price","avg_price","평균단가"]),purchaseAmount:value(h,["purchaseAmount","purchase_amount","매입금액"]),evaluationAmount:value(h,["valuationAmount","evaluation_amount","평가금액"]),pnl:value(h,["profitLoss","pnl","평가손익"]),returnRate:value(h,["returnRate","return_rate","수익률"])})}
function saveMessage(message,tone="info"){status.textContent=message;status.dataset.tone=tone}
function readStoredState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch(_){return null}}
function storedAccount(saved,snapshotId,accountId){const snapshot=(saved?.investmentBrokerSnapshots||[]).find(x=>x.id===snapshotId);return snapshot?.accounts?.find(x=>x.accountId===accountId)||null}
function approve(){
  if(!draft)return saveMessage("저장 실패: 승인할 Preview가 없습니다.","error");
  const v=validation(draft),resolution=draft.mode==="manual"?{kind:"matched",account:state.accounts.find(x=>x.id===draft.accountId)}:draft.mode==="new"?{kind:"new",account:null}:accountResolution(draft);
  if(v.blocking)return saveMessage(`저장 실패: ${v.message}`,"error");
  if(draft.reconciliation?.difference>100)return saveMessage(`저장 실패: 계좌 총액과 주식 평가금액·예수금 합계 차이가 ${money(draft.reconciliation.difference)}입니다.`,"error");
  if(!draft.date)return saveMessage("저장 실패: 기준일을 확인할 수 없습니다.","error");
  if(resolution.kind==="missing")return saveMessage("저장 실패: 선택된 기존 계좌 ID를 확인할 수 없습니다.","error");
  if(resolution.kind==="ambiguous")return saveMessage("저장 실패: 업데이트할 계좌 후보가 여러 개입니다.","error");
  if(draft.mode==="image"&&resolution.kind!=="matched")return saveMessage("저장 실패: 기존 계좌를 직접 선택해 주세요. 스크린샷만으로 신규 계좌를 만들지 않습니다.","error");
  const button=document.getElementById("assetPreviewApprove");if(button){button.disabled=true;button.textContent="저장 중…"}
  saveMessage("승인된 값을 브라우저에 저장하고 다시 확인하고 있습니다.");
  const beforeAccounts=structuredClone(state.accounts),beforeSnapshots=structuredClone(state.investmentBrokerSnapshots),beforeSeries=structuredClone(state.ui.series||[]);
  try{
    let matched=resolution.account;
    if(resolution.kind==="new"){
      const name=accountLabel(draft);if(!text(name)||name==="새 투자계좌")throw new Error("신규 계좌를 식별할 금융사, 계좌명 또는 유형이 없습니다.");
      matched={id:uid(),name,type:draft.accountType||"기타",broker:draft.broker,number:"",openingCash:0};state.accounts.push(matched);state.ui.series=[...new Set([...(state.ui.series||[]),matched.id])];
    }else if(matched&&draft.mode==="manual")Object.assign(matched,{name:draft.accountName,type:draft.accountType,broker:draft.broker});
    if(!matched)throw new Error("업데이트할 계좌 ID를 확정하지 못했습니다.");
    const base=baseForDate(draft.date);let account=base.accounts.find(x=>x.accountId===matched.id);
    if(!account){const previous=latestFor(matched.id).account;account=normalizeBrokerAccount(previous?structuredClone(previous):{accountId:matched.id,accountName:matched.name,enabled:true});account.id=uid();account.accountId=matched.id;base.accounts.push(account)}
    account.enabled=true;account.accountName=matched.name;account.estimatedAssets=draft.assets;
    if(isCash(matched.type)){account.totalPurchase=null;account.totalEvaluation=null;account.totalPnl=null;account.totalReturn=null;account.holdings=[]}
    else{if(draft.purchase!==null)account.totalPurchase=draft.purchase;if(draft.evaluation!==null)account.totalEvaluation=draft.evaluation;if(draft.pnl!==null)account.totalPnl=draft.pnl;if(draft.returnRate!==null)account.totalReturn=draft.returnRate;if(draft.holdings?.length)account.holdings=draft.holdings.map(makeHolding)}
    base.snapshotDate=draft.date;base.period=draft.date.slice(0,7);base.status="confirmed";base.note=`자산 업데이트 ${draft.mode==="image"?"이미지":"Preview"} 승인`;
    const old=state.investmentBrokerSnapshots.find(x=>x.id===base.id),idx=state.investmentBrokerSnapshots.findIndex(x=>x.id===base.id);base.createdAt=old?.createdAt||base.createdAt;base.updatedAt=new Date().toISOString();base.revision=(old?.revision||0)+1;
    const normalized=normalizeBrokerSnapshot(base),savedAccount=normalized.accounts.find(x=>x.accountId===matched.id);if(!savedAccount||savedAccount.estimatedAssets!==draft.assets||(!isCash(matched.type)&&draft.pnl!==null&&savedAccount.totalPnl!==draft.pnl))throw new Error("저장 직전 account 값 검증에 실패했습니다.");
    if(idx>=0)state.investmentBrokerSnapshots[idx]=normalized;else state.investmentBrokerSnapshots.push(normalized);
    const previousStoredAt=readStoredState()?.meta?.lastSavedAt||"",saveResult=save(),stored=readStoredState(),persisted=storedAccount(stored,normalized.id,matched.id),storageAdvanced=!!saveResult?.ok||(stored?.meta?.lastSavedAt&&stored.meta.lastSavedAt!==previousStoredAt);if(!storageAdvanced||!persisted||persisted.estimatedAssets!==draft.assets)throw new Error(saveResult?.message||"브라우저 저장과 read-back을 완료하지 못했습니다.");
    if(draft.mode==="image"&&draft.selectedByUser&&hintKey(draft))selectedHints.set(hintKey(draft),matched.id);
    draft=null;let refreshError=null;try{renderAll();render();renderAccounts();toast("자산 업데이트를 저장했습니다.")}catch(e){refreshError=e;console.error("Asset update UI refresh",e)}
    saveMessage(refreshError?`저장 성공 · ${matched.name} 계좌 값은 반영됐지만 화면 갱신에 실패했습니다. 새로고침하면 저장값을 확인할 수 있습니다.`:`저장 성공 · ${matched.name} 계좌가 ${money(persisted.estimatedAssets)}으로 업데이트되었습니다.`,refreshError?"warning":"success");
  }catch(e){
    state.accounts=beforeAccounts;state.investmentBrokerSnapshots=beforeSnapshots;state.ui.series=beforeSeries;renderAll();render();renderAccounts();saveMessage(`저장 실패: ${e?.message||String(e)}`,"error");
  }
}
async function run(){if(!selected.length)return;saveMessage("계좌 화면을 분석하고 있어요.");analyze.disabled=true;try{const rows=[];for(const file of selected){const image_data_url=await intakeImageToDataUrl(file),result=await agentApi("extract_intake_image",{image_data_url,target_hint:"asset",file_name:file.name}),extraction=agentObj(result.extraction),next=normalize(extraction);if(extraction.target_hint!=="asset")throw new Error("Asset Vision 계약을 확인할 수 없습니다.");if(next.assets===null&&!next.accountName&&!next.broker)throw new Error(`${file.name}: 계좌 값을 구조화해 읽지 못했습니다.`);if(rows.length&&!sameAccount(rows[0],next))throw new Error("서로 다른 계좌로 보이는 이미지가 섞여 있습니다. 계좌별로 나눠 올려주세요.");rows.push(next)}const combined=mergeScreens(rows);draft={...combined,accountId:"",selectedByUser:false,date:combined.date||today(),mode:"image"};const resolution=accountResolution(draft);render();const screenNote=rows.length>1?`${rows.length}개 화면 합산 · `:"";saveMessage(resolution.kind==="matched"?`${screenNote}자동 매칭 완료 · 기존 ${resolution.account.name} 계좌의 변경 Preview입니다. 필요하면 다른 계좌로 변경할 수 있습니다.`:resolution.kind==="ambiguous"?`${screenNote}계좌 후보 ${resolution.candidates.length}개를 찾았습니다. 업데이트할 기존 계좌를 선택해 주세요.`:`${screenNote}자동 매칭이 확실하지 않습니다. 업데이트할 기존 계좌를 직접 선택해 주세요.`,resolution.kind==="matched"?"success":"info")}catch(e){saveMessage(e?.message||String(e),"error")}finally{analyze.disabled=!selected.length}}
function form(mode,a=null){const latest=a?latestFor(a.id):{},x=latest.account||{},cash=isCash(a?.type),title=mode==="new"?"새 계좌 추가":`${a.name} 수정`;preview.innerHTML=`<article class="asset-capture-preview"><header><b>${safe(title)}</b><span>입력 중 실제 자산 write 0건</span></header><div class="asset-preview-grid"><label class="field"><span>금융사</span><input id="afBroker" value="${safe(a?.broker||"")}"></label><label class="field"><span>계좌명·별칭</span><input id="afName" value="${safe(a?.name||"")}"></label><label class="field"><span>유형</span><select id="afType">${["입출금","현금저축","파킹","CMA","예금","적금","주택자금","비상금","위탁","ISA","연금저축","IRP","기타"].map(t=>`<option ${a?.type===t?"selected":""}>${t}</option>`).join("")}</select></label><label class="field"><span>현재잔액·평가금액</span><input id="afAssets" type="number" value="${x.estimatedAssets??""}"></label><label class="field"><span>기준일</span><input id="afDate" type="date" value="${latest.snap?.snapshotDate||today()}"></label><label class="field invest-only"><span>매입금액</span><input id="afPurchase" type="number" value="${cash?"":x.totalPurchase??""}"></label><label class="field invest-only"><span>평가금액</span><input id="afEvaluation" type="number" value="${cash?"":x.totalEvaluation??""}"></label><label class="field invest-only"><span>평가손익</span><input id="afPnl" type="number" value="${cash?"":x.totalPnl??""}"></label><label class="field invest-only"><span>수익률</span><input id="afReturn" type="number" step="any" value="${cash?"":x.totalReturn??""}"></label></div><div class="asset-preview-actions"><button class="btn" id="afCancel">취소</button><button class="btn finance" id="afPreview">변경 Preview</button></div></article>`;const toggle=()=>preview.querySelectorAll(".invest-only").forEach(el=>el.hidden=isCash(document.getElementById("afType").value));toggle();document.getElementById("afType").onchange=toggle;document.getElementById("afCancel").onclick=()=>{draft=null;render()};document.getElementById("afPreview").onclick=()=>{const d=normalize({financialInstitution:document.getElementById("afBroker").value,accountName:document.getElementById("afName").value,accountType:document.getElementById("afType").value,currentAsset:document.getElementById("afAssets").value,asOfDate:document.getElementById("afDate").value,purchaseAmount:document.getElementById("afPurchase").value,valuationAmount:document.getElementById("afEvaluation").value,profitLoss:document.getElementById("afPnl").value,returnRate:document.getElementById("afReturn").value});if(!d.broker||!d.accountName||d.assets===null||!d.date)return alert("금융사, 계좌명, 현재잔액, 기준일을 확인해 주세요.");draft={...d,mode,accountId:a?.id||"",original:x};render()}}
function restoreDeleteState(before){state.accounts=before.accounts;state.investmentBrokerSnapshots=before.brokerSnapshots;state.ui=before.ui}
function executeAccountDelete(accountId,expectedName){
  const account=state.accounts.find(a=>a.id===accountId),confirmation=document.getElementById("assetDeleteConfirm");
  if(!account)return saveMessage("삭제 실패: 선택한 계좌를 찾을 수 없습니다.","error");
  if(!confirmation||text(confirmation.value)!==text(expectedName))return saveMessage(`삭제 실패: 계좌명 '${expectedName}'을 정확히 입력해 주세요.`,"error");
  const impact=accountDeleteImpact(state,accountId);if(impact.blocking)return saveMessage("삭제 실패: 거래·자금이동·투자일기 또는 별도 월간기록에 연결된 계좌는 해당 기록을 먼저 정리해야 합니다.","error");
  const button=document.getElementById("assetDeleteApprove");if(button){button.disabled=true;button.textContent="삭제 중…"}
  saveMessage("삭제 직전 백업을 만들고 선택한 계좌만 제거한 뒤 다시 확인하고 있습니다.");
  const before={accounts:structuredClone(state.accounts),brokerSnapshots:structuredClone(state.investmentBrokerSnapshots||[]),ui:structuredClone(state.ui||{})};
  try{
    if(typeof exportData==="function")exportData({suffix:"before_account_delete",silent:true});
    state.accounts=state.accounts.filter(a=>a.id!==accountId);
    state.investmentBrokerSnapshots=(state.investmentBrokerSnapshots||[]).map(s=>({...s,accounts:(s.accounts||[]).filter(a=>a.accountId!==accountId)}));
    state.ui.series=(state.ui.series||[]).filter(id=>id!==accountId);if(state.ui.overviewAccountId===accountId)state.ui.overviewAccountId="";if(state.ui.latestHoldingAccount===accountId)state.ui.latestHoldingAccount="all";
    if(state.accounts.some(a=>a.id===accountId)||state.investmentBrokerSnapshots.some(s=>(s.accounts||[]).some(a=>a.accountId===accountId)))throw new Error("메모리 삭제 검증에 실패했습니다.");
    const saveResult=save(),stored=readStoredState();
    if(!saveResult?.ok||!stored||stored.accounts?.some(a=>a.id===accountId)||(stored.investmentBrokerSnapshots||[]).some(s=>(s.accounts||[]).some(a=>a.accountId===accountId))||(stored.ui?.series||[]).includes(accountId))throw new Error(saveResult?.message||"브라우저 저장과 read-back을 완료하지 못했습니다.");
    for(const [key,id] of selectedHints)if(id===accountId)selectedHints.delete(key);
    if(draft?.accountId===accountId)draft=null;preview.innerHTML="";renderAll();renderAccounts();toast("계좌를 안전하게 삭제했습니다.");
    saveMessage(`삭제 성공 · ${expectedName} 계좌와 연결된 스크린샷 기록 ${impact.brokerSnapshots}건을 제거했습니다. 다른 계좌는 유지되었습니다.`,"success");
  }catch(e){
    restoreDeleteState(before);const rollback=save();renderAll();renderAccounts();
    saveMessage(`삭제 실패: ${e?.message||String(e)}${rollback?.ok?" · 기존 데이터로 원상복구했습니다.":" · 화면의 기존 데이터는 복구했지만 저장소 복구를 확인하지 못했습니다."}`,"error");
  }
}
function openAccountDelete(accountId){
  const account=state.accounts.find(a=>a.id===accountId);if(!account)return saveMessage("삭제할 계좌를 찾을 수 없습니다.","error");
  draft=null;const impact=accountDeleteImpact(state,accountId),blockers=[impact.transactions&&`거래 ${impact.transactions}건`,impact.monthlySnapshots&&`별도 월간기록 ${impact.monthlySnapshots}건`,impact.cashFlows&&`자금이동 ${impact.cashFlows}건`,impact.journals&&`투자일기 ${impact.journals}건`].filter(Boolean);
  preview.innerHTML=`<article class="asset-capture-preview asset-delete-preview"><header><b>${safe(account.name)} 계좌 삭제</b><span>선택한 accountId만 삭제합니다.</span></header><div class="asset-preview-grid"><div class="asset-preview-field"><span>금융사</span><b>${safe(account.broker)}</b></div><div class="asset-preview-field"><span>계좌 유형</span><b>${safe(account.type)}</b></div><div class="asset-preview-field"><span>연결된 화면 기록</span><b>${impact.brokerSnapshots}건</b></div><div class="asset-preview-field"><span>다른 계좌</span><b>삭제하지 않음</b></div></div>${impact.blocking?`<div class="asset-validation error" role="alert"><b>삭제 차단</b><span>${safe(blockers.join(" · "))}이 연결되어 있습니다. 기록 보존을 위해 먼저 해당 기록을 정리해 주세요.</span></div>`:`<div class="asset-validation warning" role="status"><b>주의</b><span>삭제 직전 전체 JSON 백업을 만들고, 이 계좌와 연결된 스크린샷 기록만 함께 제거합니다.</span></div><label class="asset-delete-confirm"><span>확인을 위해 계좌명 <b>${safe(account.name)}</b>을 입력하세요.</span><input id="assetDeleteConfirm" autocomplete="off" placeholder="${safe(account.name)}"></label>`}<div class="asset-preview-actions"><button class="btn" id="assetDeleteCancel" type="button">취소</button><button class="btn danger" id="assetDeleteApprove" type="button" disabled>계좌 삭제</button></div></article>`;
  const confirmInput=document.getElementById("assetDeleteConfirm"),approveDelete=document.getElementById("assetDeleteApprove");
  if(confirmInput&&approveDelete)confirmInput.oninput=()=>{approveDelete.disabled=text(confirmInput.value)!==text(account.name)};
  document.getElementById("assetDeleteCancel").onclick=()=>{preview.innerHTML=""};if(approveDelete)approveDelete.onclick=()=>executeAccountDelete(accountId,account.name);preview.scrollIntoView({behavior:"smooth",block:"center"});
}
window.HANI_ASSET_UPDATE_V1.requestDeleteAccount=openAccountDelete;
function renderAccounts(){if(!manager)return;manager.innerHTML=`<div class="sh"><h4>등록 계좌</h4><span class="pill">${state.accounts.length}개</span></div><div class="asset-account-edit-list">${state.accounts.map(a=>`<div class="asset-account-edit-row"><div><b>${safe(a.name)}</b><span>${safe(a.broker)} · ${safe(a.type)}</span></div><div class="asset-account-row-actions"><button class="btn sm" data-asset-edit="${safe(a.id)}">수정</button><button class="btn sm danger" data-asset-delete="${safe(a.id)}">삭제</button></div></div>`).join("")||"등록 계좌가 없습니다."}</div>`;
manager.querySelectorAll("[data-asset-edit]").forEach(b=>b.onclick=()=>form("manual",state.accounts.find(a=>a.id===b.dataset.assetEdit)));manager.querySelectorAll("[data-asset-delete]").forEach(b=>b.onclick=()=>openAccountDelete(b.dataset.assetDelete))}
function renderSelectedFiles(){list.textContent=selected.length?selected.map((f,i)=>`${i+1}. ${f.name||"계좌 스크린샷"}`).join(" · "):"추가된 계좌 화면이 없습니다.";analyze.disabled=!selected.length;draft=null;render()}
function clipboardImage(file,index){const type=text(file?.type).toLowerCase();if(!/^image\/(png|jpeg|webp)$/.test(type))return null;const ext=type==="image/jpeg"?"jpg":type.split("/")[1],name=`account-clipboard-${Date.now()}-${index+1}.${ext}`;return new File([file],name,{type,lastModified:Date.now()})}
function handleAssetPaste(event){const items=[...(event.clipboardData?.items||[])],raw=items.filter(item=>item.kind==="file"&&/^image\//i.test(item.type||"")).map(item=>item.getAsFile()).filter(Boolean),images=raw.length?raw:[...(event.clipboardData?.files||[])].filter(file=>/^image\//i.test(file.type||""));if(!images.length)return;event.preventDefault();const pasted=images.map(clipboardImage);if(pasted.some(file=>!file))return saveMessage("붙여넣기 실패: PNG·JPG·WEBP 이미지만 사용할 수 있습니다.","error");if(pasted.some(file=>file.size>12*1024*1024))return saveMessage("붙여넣기 실패: 원본 이미지는 장당 12MB 이하만 사용할 수 있습니다.","error");selected=[...selected,...pasted];renderSelectedFiles();saveMessage(`클립보드 이미지 ${pasted.length}장 첨부 · 저장 전 자산 데이터 변경 없음. 분석 및 자동 매칭을 눌러 주세요.`,"success")}
files.onchange=()=>{selected=[...files.files];renderSelectedFiles()};
if(pasteZone){pasteZone.onclick=()=>pasteZone.focus();pasteZone.onpaste=handleAssetPaste}
analyze.onclick=run;
document.getElementById("assetAddAccount").onclick=()=>form("new");renderAccounts();
})();
