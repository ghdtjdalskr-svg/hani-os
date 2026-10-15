/* Synthetic frozen reports only. Runs actual display owners without browser/storage/network. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../hani-investment-committee.js');
const source=fs.readFileSync(require.resolve('../hani-investment-committee.js'),'utf8');
const snapshot=(extra={})=>({id:'oct',reviewMonth:'2026-10',confirmedAt:'2026-10-11T03:00:00Z',revision:1,portfolioRating:'HOLD / SELECTIVE BUY',marketView:'',executiveSummary:'삼성전자우 · HOLD · HOLD',haniRecommendation:'삼성전자우 · 실적을 확인하며 유지해요.',strengthened:[],weakened:[],newWatchlist:[],valuationAlerts:[],deepValue:[],actionPlan:['삼성전자우 · HOLD · 실적 발표 확인'],securitySnapshots:[{id:'r',name:'삼성전자우',ticker:'005935',market:'KR',currency:'KRW',status:'OWNED',rating:'HOLD',action:'HOLD',actionNote:'실적 발표 확인',executiveComment:'실적을 확인하며 유지해요.',fairValue:null,previousRating:null,convictionScore:91,nextCheckpoints:[]}],...extra});
const broker=(date,holdings,extra={})=>({mode:'positions',recordType:'positions',status:'confirmed',snapshotDate:date,accounts:[{accountId:'isa',enabled:true,holdings}],...extra});
const etf={instrumentId:'etf',name:'적립 ETF',ticker:'999999',market:'KR',quantity:2,evaluationAmount:120000};
const accumulation={kind:'accumulation',instrumentId:'etf',name:etf.name,ticker:etf.ticker,market:'KR',accounts:[{accountId:'isa',name:'ISA'}],currentValues:[],holdingsRefs:[{...etf,accountId:'isa'}]};
const blank=()=>({accounts:[{id:'isa',name:'ISA',broker:'키움증권'}],instruments:[{id:'etf',name:etf.name,ticker:etf.ticker,market:'KR',currency:'KRW'}],ui:{icAccumulationAccountIds:['isa']},investmentResearchCards:[],investmentResearchHistory:[],investmentBrokerSnapshots:[broker('2026-09-20',[etf])],investmentCommitteeSnapshots:[]});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function displayContext(state){
  const board={innerHTML:'',dataset:{},querySelector:()=>null},months={innerHTML:''},start={hidden:false};
  const ctx=vm.createContext({...C,state,esc,accountIdentity:()=>null,monthlyOwner:null,selectedMonth:'2026-10',monthlyDraft:null,viewedRevision:null,renderProgress(){},monthlyHost:{querySelector:s=>s==='.ic-months'?months:s==='[data-monthly=start]'?start:board},monthLabel:m=>m.replace('-','.'),committeeTitle:m=>'HANI GROUP · 투자 리포트 · 2026 OCTOBER',listLabels:{strengthened:'투자 논리 강화',weakened:'투자 논리 약화',newWatchlist:'관심 종목',valuationAlerts:'가치평가 주의',deepValue:'저평가 후보'},haniHeading:()=>'<b>하니</b>',labels:{OWNED:'보유',WATCH:'관심'},commit(){throw Error('Unexpected commit');},save(){throw Error('Unexpected save');}});
  const line=name=>source.split('\n').find(l=>l.startsWith('  const '+name+' ='));
  vm.runInContext(['text','money','percent','pill'].map(line).join('\n'),ctx);
  const a=source.indexOf('  function summaryHtml('),b=source.indexOf('  function startCommittee(',a);
  vm.runInContext(source.slice(a,b),ctx);
  return {ctx,board};
}

test('all action codes have Korean labels and old frozen summary transforms only exact generated lines',()=>{
  assert.deepEqual(C.ACTIONS.map(C.actionLabel),['추가 매수','조정 시 추가','보유 유지','관망','비중 축소','매도','관찰']);
  const s=snapshot(),before=JSON.stringify(s);
  assert.equal(C.displaySummary(s),'삼성전자우 — 의견 HOLD · 행동 보유 유지');
  assert.equal(C.displaySummary({...s,executiveSummary:'대표님 직접 작성한 요약'}),'대표님 직접 작성한 요약');
  assert.equal(JSON.stringify(s),before);
});

test('empty lists collapse to one explanation, while nonempty changes are retained',()=>{
  const s=snapshot();assert.match(C.monthlyChanges(s,false).emptyLabel,/첫 리포트라.*다음 달부터 표시/);
  assert.deepEqual(C.monthlyChanges(s,true),{sections:[],emptyLabel:'변화 없음'});
  const result=C.monthlyChanges({...s,strengthened:['새 실적 근거']},true);
  assert.deepEqual(result.sections,[{key:'strengthened',rows:['새 실적 근거']}]);
});

test('compact summary deduplicates security rows and role chips, clusters normalized themes only for 2+ names',()=>{
  const cards=[['a','반도체'],['b','HBM'],['c','AI / 반도체'],['d','소비재'],['e','식품'],['f','결제']].map(([id,theme])=>({id,name:id,status:'OWNED',themes:[theme,theme],portfolioRoles:{tags:['성장','성장']}}));
  const summary=C.portfolioSummary(cards),before=JSON.stringify(summary),result=C.compactPortfolio(summary);
  assert.equal(result.securities.length,6);assert.deepEqual(result.securities[0].roles,['성장']);
  assert.deepEqual(result.themes.map(t=>[t.theme,t.securities.length]),[['AI/반도체',3],['소비재',2]]);
  assert.deepEqual(result.overlapWarnings.map(w=>[w.theme,w.ownedCount]),[['AI/반도체',3]]);
  assert.equal(JSON.stringify(summary),before);
  cards[2].status='WATCH';assert.equal(C.compactPortfolio(C.portfolioSummary(cards)).overlapWarnings.length,0);
  assert.equal(C.compactPortfolio({...summary,overlapWarnings:[{theme:'결제',level:'HIGH',ownedCount:3}]}).overlapWarnings.some(w=>w.theme==='결제'),true);
});

test('read-only old value fallback uses nearest confirmed account before review, never future/draft records',()=>{
  const state=blank();state.investmentBrokerSnapshots.push(broker('2026-10-10',[{...etf,evaluationAmount:130000}]),broker('2026-10-12',[{...etf,evaluationAmount:990000}]),broker('2026-10-11',[{...etf,evaluationAmount:880000}],{status:'draft'}));
  state.investmentCommitteeSnapshots=[snapshot({securitySnapshots:[accumulation]})];
  const before=JSON.stringify(state),values=C.accumulationDisplayValues(accumulation,state,'2026-10-11T03:00:00Z');
  assert.deepEqual(values,[{accountId:'isa',value:130000,currency:'KRW',asOf:'2026-10-10',source:'recorded',auxiliary:true}]);
  assert.equal(JSON.stringify(state),before);
  state.investmentBrokerSnapshots.push(broker('2026-10-11',[]));
  assert.deepEqual(C.accumulationDisplayValues(accumulation,state,'2026-10-11'),[],'latest empty account must not resurrect older holdings');
  assert.deepEqual(C.accumulationDisplayValues(accumulation,state,'2026-09-01'),[]);
});

test('new snapshots freeze live quantity × price, else dated recorded evaluation, through existing one commit',()=>{
  const state=blank(),rows=[{...etf,accountId:'isa',recordedEvaluation:etf.evaluationAmount,holdingAsOf:'2026-09-20'}];
  const prices={stocks:[{symbol:etf.ticker,market:'KOSPI',currency:'KRW'}],quotes:[{symbol:etf.ticker,currency:'KRW',lastPrice:70000,timestamp:'2026-10-10T03:00:00Z'}]};
  const before=JSON.stringify(state),draft=C.committeeDraft(state,'2026-10',{},rows);let saves=0;
  const prepared=C.prepareSnapshot(state,draft,{uid:()=> 'new',now:'2026-10-11T03:00:00Z',holdingRows:rows,priceSource:prices});
  assert.equal(JSON.stringify(state),before);assert.equal(prepared.securitySnapshots[0].currentValues[0].value,140000);
  assert.equal(prepared.securitySnapshots[0].currentValues[0].source,'live');
  const recorded=C.confirmCommittee(state,draft,()=>{saves++;return true;},{uid:()=> 'recorded',now:'2026-10-11T03:00:00Z',holdingRows:rows});
  assert.equal(saves,1);assert.deepEqual(recorded.securitySnapshots[0].currentValues,[{accountId:'isa',value:120000,currency:'KRW',asOf:'2026-09-20',source:'recorded'}]);
  const frozen=JSON.stringify(recorded);rows[0].recordedEvaluation=999;prices.quotes[0].lastPrice=1;state.investmentBrokerSnapshots[0].accounts[0].holdings[0]={...etf,evaluationAmount:3};
  assert.equal(JSON.stringify(recorded),frozen);assert.equal(C.accumulationDisplayValues(recorded.securitySnapshots[0],state,'2026-10-11')[0].value,120000);
  const futurePrices={stocks:prices.stocks,quotes:[{...prices.quotes[0],lastPrice:999,timestamp:'2026-10-12T00:00:00Z'}]};
  assert.equal(C.holdingValue(rows[0],etf,state,futurePrices,'2026-10-11').source,'recorded','future quote cannot freeze a future price');
});

test('unknown units, missing values and currency mismatch never produce invented zeros or combined weight',()=>{
  const state=blank();state.investmentBrokerSnapshots=[];
  const rows=[{...etf,accountId:'isa',evaluationAmount:null,holdingAsOf:'2026-09-20'}];
  assert.deepEqual(C.accumulationSecurities(state,rows)[0].currentValues,[]);
  assert.equal(C.holdingValue({...etf,accountId:'isa',market:'US',recordedEvaluation:120000,holdingAsOf:'2026-09-20'},{...etf,market:'US'},state,{},'2026-10-11'),null);
  state.investmentBrokerSnapshots=[broker('2026-09-20',[etf])];
  const badPrices={stocks:[{symbol:etf.ticker,market:'KR',currency:'USD'}],quotes:[{symbol:etf.ticker,currency:'USD',lastPrice:100}]};
  assert.equal(C.accumulationSecurities(state,rows,badPrices,'2026-10-11')[0].currentValues[0].source,'recorded');
});

test('conclusion is three deterministic Korean lines, includes BUY/STRONG BUY count, conviction and next checks',()=>{
  const s=snapshot();s.securitySnapshots.push({...s.securitySnapshots[0],id:'buy',name:'오리온',rating:'STRONG BUY',action:'ADD',convictionScore:95,nextCheckpoints:['실적 발표 확인']},accumulation);
  const before=JSON.stringify(s),lines=C.conclusionLines(s);
  assert.equal(lines.length,3);assert.match(lines[0],/보유 유지 \+ 선별 추가/);assert.match(lines[1],/2종목 중 BUY 1 · HOLD 1.*오리온\(95\).*삼성전자우\(91\)/);assert.match(lines[2],/실적 발표 확인/);
  assert.deepEqual(C.conclusionLines(s),lines);assert.equal(JSON.stringify(s),before);
  assert.match(C.conclusionLines(snapshot())[2],/적정가 입력/);
  assert.match(C.conclusionLines(snapshot({securitySnapshots:[accumulation]}))[1],/대상 종목이 없어요/);
});

test('actual confirmed renderer hides missing/empty fields, preserves custom prose, and never rewrites frozen state',()=>{
  const state=blank(),s=snapshot();s.portfolioSummary=C.portfolioSummary(s.securitySnapshots);s.securitySnapshots.push(accumulation);state.investmentCommitteeSnapshots=[s];
  const before=JSON.stringify(state),{ctx,board}=displayContext(state);
  vm.runInContext('renderMonthly();renderMonthly();',ctx);
  assert.equal(JSON.stringify(state),before);assert.match(board.innerHTML,/이번 달 결론/);assert.match(board.innerHTML,/첫 기록/);assert.match(board.innerHTML,/하니 의견.*실적을 확인하며 유지해요/);
  assert.match(board.innerHTML,/기록 평가액 ₩120,000 \(9\/20 기록\) · 보조 표시/);assert.match(board.innerHTML,/ISA 소계.*₩120,000/);
  assert.doesNotMatch(board.innerHTML,/시장 관점|입력 없음|해당 항목 없음|미입력|직전 Rating 없음|HANI RECOMMENDATION|추가 실행 계획/);
  assert.equal((board.innerHTML.match(/<span class="ic-first-record">/g)||[]).length,1);
  assert.equal((board.innerHTML.match(/<tr><th scope="row">/g)||[]).length,0);
  assert.match(board.innerHTML,/포트폴리오 역할이 아직 지정되지 않았습니다/);
  s.marketView='직접 작성한 시장 의견';s.haniRecommendation='직접 작성한 제안';s.actionPlan.push('입금 예정일 확인');
  vm.runInContext('renderMonthly();',ctx);assert.match(board.innerHTML,/직접 작성한 시장 의견/);assert.match(board.innerHTML,/직접 작성한 제안/);assert.match(board.innerHTML,/입금 예정일 확인/);
  state.investmentCommitteeSnapshots.unshift(snapshot({id:'sep',reviewMonth:'2026-09'}));vm.runInContext('renderMonthly();',ctx);assert.match(board.innerHTML,/변화 없음/);
});

test('actual renderer lists separate ISA/pension/IRP subtotals and keeps currencies separate',()=>{
  const state=blank(),rows=['ISA','연금','IRP'].map((name,i)=>({...accumulation,name:name+' ETF',accounts:[{accountId:name,name}],currentValues:[{accountId:name,currency:i===2?'USD':'KRW',value:i===2?100:120000,asOf:'2026-09-20',source:'recorded'}]}));
  state.investmentCommitteeSnapshots=[snapshot({securitySnapshots:rows})];const {ctx,board}=displayContext(state);vm.runInContext('renderMonthly();',ctx);
  assert.match(board.innerHTML,/ISA 소계.*₩120,000/);assert.match(board.innerHTML,/연금 소계.*₩120,000/);assert.match(board.innerHTML,/IRP 소계.*\$100/);assert.doesNotMatch(board.innerHTML,/240,100/);
  const legacy={...accumulation,accounts:[{accountId:'isa',name:'ISA'},{accountId:'pension',name:'연금'}],currentValues:[{currency:'KRW',value:500}],holdingsRefs:[{accountId:'isa',recordedCurrency:'KRW',recordedEvaluation:200,holdingAsOf:'2026-09-20'},{accountId:'pension',recordedCurrency:'KRW',recordedEvaluation:300,holdingAsOf:'2026-09-20'}]};
  const before=JSON.stringify(legacy),split=C.accumulationDisplayValues(legacy,state,'2026-10-11');
  assert.deepEqual(split.map(v=>[v.accountId,v.value]),[['isa',200],['pension',300]]);assert.equal(JSON.stringify(legacy),before);
  legacy.holdingsRefs[0].recordedEvaluation=999;assert.deepEqual(C.accumulationDisplayValues(legacy,state,'2026-10-11'),[{currency:'KRW',value:500,auxiliary:false}],'non-reconciling account refs never override the frozen total');
});

test('existing navigation owner explains prior writes+1 failure without any protected commit/save',()=>{
  const main=fs.readFileSync(require.resolve('../hani-main.js'),'utf8'),a=main.indexOf('function navigationPersist('),b=main.indexOf('function navigationInitialView(',a),writes=[];
  const ctx=vm.createContext({NAVIGATION_VIEWS:new Set(['home']),NAVIGATION_KEY:'hani_os_navigation_v1',localStorage:{setItem:(key,value)=>writes.push({key,value})}});
  vm.runInContext(main.slice(a,b),ctx);vm.runInContext("navigationPersist('home',0);navigationPersist('',0);",ctx);
  assert.equal(writes.length,1);assert.equal(writes[0].key,'hani_os_navigation_v1');assert.deepEqual(JSON.parse(writes[0].value),{version:1,view:'home',y:0});
});
