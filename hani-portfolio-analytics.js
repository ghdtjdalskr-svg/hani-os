/* Phase A: pure read-only projection. No storage, network, FX or source mutation. */
(function(root){
  'use strict';
  const M=typeof module==='object'&&module.exports?require('./hani-market-data.js'):root.HaniMarketData;
  const finite=M.number;
  function build(state,{stocks=[],quotes=[],cashObservations=[],now=Date.now(),accountId=''}={}){
    const masters=state.instruments||[], positions=M.positions(state).filter(p=>!accountId||p.accountId===accountId);
    const seen=new Map(), holdings=[];
    for(const p of positions){
      const master=masters.find(i=>i.id===p.instrumentId),code=M.symbol(p.ticker||master?.ticker);
      const hint=master?.market;
      const hintedCurrency=M.currency(hint)||(/^(KR|국내)$/.test(hint)?'KRW':/^(US|해외)$/.test(hint)?'USD':null);
      const candidates=stocks.filter(s=>M.symbol(s.symbol)===code&&(!hintedCurrency||s.currency===hintedCurrency));
      const resolution=candidates.length===1?M.resolve(p,masters,candidates):{status:'unmatched',reason:'종목정보 없음 또는 중복'};
      const stock=resolution.stock;
      const currency=resolution.currency||M.currency(hint)||(/^(KR|국내)$/.test(hint)?'KRW':/^(US|해외)$/.test(hint)?'USD':'UNKNOWN');
      const identity=resolution.status==='matched'?stock.market+':'+code:p.instrumentId?'master:'+p.instrumentId:'raw:'+p.key;
      const key=p.accountId+':'+identity,quantity=p.quantity!==null&&p.quantity>=0?p.quantity:null;
      const matchingQuotes=quotes.filter(q=>M.symbol(q.symbol)===resolution.symbol&&q.currency===resolution.currency);
      const quote=matchingQuotes.length===1?matchingQuotes[0]:null, price=finite(quote?.lastPrice),stamp=Date.parse(quote?.timestamp);
      const verified=resolution.status==='matched'&&price!==null&&price>0&&Number.isFinite(stamp)&&stamp<=now+60000;
      const marketValue=verified&&quantity!==null&&Number.isFinite(quantity*price)?quantity*price:null;
      const costCurrency=p.buyCurrency||p.recordedCurrency||null;
      const rawCost=p.buyCurrency?(quantity!==null&&p.buyPrice!==null?quantity*p.buyPrice:null):p.purchaseAmount;
      const cost=rawCost!==null&&rawCost>=0&&Number.isFinite(rawCost)&&costCurrency?rawCost:null;
      const row={key,account_id:p.accountId,account:p.accountName,instrument_id:p.instrumentId||null,instrument:identity,name:p.name,ticker:code||null,
        quantity,holding_as_of:p.holdingAsOf,source:'confirmed-broker-snapshot',source_completeness:'UNKNOWN',
        market:stock?.market||master?.market||null,asset_class:master?.className||null,currency,
        market_price:verified?price:null,price_currency:verified?resolution.currency:null,price_as_of:verified?quote.timestamp:null,
        price_status:verified?(now-stamp<=120000?'RECENT':'LAST_KNOWN'):'NO_DATA',market_value:marketValue,
        recorded_value:p.recordedEvaluation,recorded_value_currency:p.recordedCurrency||null,
        recorded_purchase_amount:p.purchaseAmount,recorded_buy_price:p.buyPrice,recorded_buy_currency:p.buyCurrency,
        cost_basis:cost,cost_currency:cost===null?null:costCurrency,cost_basis_status:cost===null?'NO_DATA':'RECORDED',
        average_purchase_price:cost!==null&&quantity>0?cost/quantity:null,
        pnl:marketValue!==null&&cost!==null&&costCurrency===resolution.currency?marketValue-cost:null,
        return_rate:marketValue!==null&&cost>0&&costCurrency===resolution.currency?(marketValue-cost)/cost:null,
        security_weight:null,portfolio_weight:null,status:quantity===0?'EXPLICIT_ZERO':quantity===null?'QUANTITY_NO_DATA':'ACTIVE',resolution_status:resolution.status};
      if(seen.has(key)){
        const earlier=seen.get(key);
        if(earlier.quantity!==row.quantity||earlier.recorded_value!==row.recorded_value||earlier.cost_basis!==row.cost_basis||earlier.cost_currency!==row.cost_currency||earlier.ticker!==row.ticker||earlier.resolution_status!==row.resolution_status){
          earlier.status='HOLDING_CONFLICT';earlier.market_value=null;earlier.quantity=null;
        }
        earlier.duplicate_records=(earlier.duplicate_records||1)+1;
      }else{seen.set(key,row);holdings.push(row);}
    }
    const buckets={};
    for(const c of [...new Set(holdings.map(h=>h.currency))]){
      const scoped=holdings.filter(h=>h.currency===c),active=scoped.filter(h=>h.status!=='EXPLICIT_ZERO'),priced=active.filter(h=>h.market_value!==null);
      const total=priced.length?priced.reduce((sum,h)=>sum+h.market_value,0):null;
      const accounts=(state.accounts||[]).filter(a=>!accountId||a.id===accountId).map(a=>a.id);
      // Cash needs explicit amount, scope, timestamp and provenance. Residual is never accepted.
      const cash=accounts.map(id=>cashObservations.filter(o=>o.account_id===id&&o.currency===c&&o.status==='CONFIRMED'&&o.source&&o.kind==='EXPLICIT_CASH'&&finite(o.amount)!==null&&finite(o.amount)>=0&&Number.isFinite(Date.parse(o.as_of))&&Date.parse(o.as_of)<=now+60000));
      const cashComplete=accounts.length>0&&cash.every(list=>list.length===1);
      const cashTotal=cashComplete?cash.reduce((sum,list)=>sum+finite(list[0].amount),0):null;
      const unknown=holdings.some(h=>h.currency==='UNKNOWN'&&h.status!=='EXPLICIT_ZERO');
      const coverage=active.length===0?'NO_DATA':priced.length===active.length&&!unknown?'COMPLETE':'PARTIAL';
      const portfolioTotal=total!==null&&cashTotal!==null?total+cashTotal:null;
      const weightMode=coverage==='COMPLETE'&&portfolioTotal>0?'PORTFOLIO':'SECURITY';
      for(const h of scoped){h.security_weight=h.market_value!==null&&total>0?h.market_value/total:null;h.portfolio_weight=h.market_value!==null&&portfolioTotal>0?h.market_value/portfolioTotal:null;}
      buckets[c]={currency:c,securities_value:total,confirmed_cash:cashTotal,cash_status:cashComplete?'CONFIRMED':'NO_DATA',portfolio_value:portfolioTotal,
        coverage,priced_count:priced.length,holding_count:active.length,unpriced_count:active.length-priced.length,weight_mode:weightMode};
    }
    return {version:'live-preview-1',as_of:new Date(now).toISOString(),holdings,buckets,
      limitations:['보유목록 완전성과 종목별 실제 관측일은 기존 기록에서 확인할 수 없습니다.','현금성 차액을 현금으로 사용하지 않습니다.','통화 간 합산·환산과 월간 공식 이력은 제공하지 않습니다.']};
  }
  const api={build};if(typeof module==='object'&&module.exports)module.exports=api;else root.HaniPortfolioAnalytics=api;
})(globalThis);
