/* Read-only Phase B; consumes the existing market reader, never fetches or saves. */
(function(){
  'use strict';
  const root=document.getElementById('portfolioLivePreview'),A=window.HaniPortfolioAnalytics,M=window.HaniMarketData;
  if(!root||!A||!M)return;
  const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(n,c)=>n===null?'미확인':c==='UNKNOWN'?n.toLocaleString('ko-KR'):new Intl.NumberFormat('ko-KR',{style:'currency',currency:c,maximumFractionDigits:c==='USD'?2:0}).format(n);
  const pct=n=>n===null?'—':(n*100).toFixed(1)+'%';
  let currency='KRW',account='',tab='overview',dimension='instrument',model=null;
  root.innerHTML='<header><div><h3>내 포트폴리오</h3><small>LIVE · 읽기 전용 Preview · 월간 공식 기록 아님</small></div><div class="portfolio-controls"><label>계좌<select data-p-account></select></label><label>통화<select data-p-currency></select></label></div></header><nav aria-label="포트폴리오 보기"><button type="button" data-p-tab="overview">요약</button><button type="button" data-p-tab="holdings">보유종목</button><button type="button" data-p-tab="allocation">구성</button></nav><p data-p-coverage role="status"></p><div data-p-content></div><p class="portfolio-note">보유일과 가격 기준일은 다를 수 있습니다. 미분류 차액은 현금으로 계산하지 않으며, 통화 간 합산은 하지 않습니다. 월간 이력은 다음 단계에서 제공합니다.</p>';
  const content=root.querySelector('[data-p-content]');
  function weight(h,b){return b.weight_mode==='PORTFOLIO'?h.portfolio_weight:h.security_weight;}
  function aggregates(rows,key){const map=new Map();for(const h of rows){if(h.market_value===null)continue;const id=h[key]||'미확인',old=map.get(id)||{id,name:key==='instrument'?h.name:id,value:0,color:M.chartColor(h.ticker||id)};old.value+=h.market_value;map.set(id,old);}return [...map.values()].sort((a,b)=>b.value-a.value);}
  // Recursive area bisection: area, not quantity, encodes value.
  function tile(items,x=0,y=0,w=100,h=100){
    if(!items.length)return [];if(items.length===1)return [{...items[0],x,y,w,h}];
    const total=items.reduce((s,r)=>s+r.value,0);let cut=1,sum=items[0].value;
    while(cut<items.length-1&&sum+items[cut].value<=total/2){sum+=items[cut++].value;}
    const ratio=sum/total;return w>=h?[...tile(items.slice(0,cut),x,y,w*ratio,h),...tile(items.slice(cut),x+w*ratio,y,w*(1-ratio),h)]:[...tile(items.slice(0,cut),x,y,w,h*ratio),...tile(items.slice(cut),x,y+h*ratio,w,h*(1-ratio))];
  }
  function bars(items,total){if(!items.length)return '<p>가격이 연결된 투자상품이 없어 구성을 표시할 수 없습니다.</p>';return '<div class="portfolio-bars">'+items.slice(0,8).map(r=>'<div><b>'+e(r.name)+'</b><span>'+money(r.value,currency)+' · '+pct(total>0?r.value/total:null)+'</span><i style="width:'+Math.max(0,total>0?r.value/total*100:0)+'%;background:'+r.color+'"></i></div>').join('')+'</div>'+(items.length>8?'<p>평가액 상위 8개 표시 · 나머지 '+(items.length-8)+'개는 보유종목 탭에서 확인하세요.</p>':'');}
  function table(rows,b){return '<div class="portfolio-table-wrap"><table><thead><tr><th>종목 / 계좌</th><th>수량</th><th>시장 가격</th><th>현재 평가액</th><th>'+(b.weight_mode==='PORTFOLIO'?'포트폴리오 비중':'종목 내 비중')+'</th></tr></thead><tbody>'+rows.map(h=>'<tr><td><details><summary>'+e(h.name)+'</summary><p>'+e(h.account)+' · '+e(h.ticker||'코드 미확인')+'<br>보유 기준 '+e(h.holding_as_of||'미확인')+'<br>가격 기준 '+e(h.price_as_of||'미확인')+' · '+e(h.price_status)+'<br>기록 평가액 '+(h.recorded_value===null?'미기록':e(h.recorded_value)+' (원본 단위; 현재 평가와 별도)')+'<br>매입원가 '+(h.cost_basis===null?'NO_DATA':money(h.cost_basis,h.cost_currency))+'<br>원가 없으면 평균매입가·손익·수익률 미제공'+(h.status==='HOLDING_CONFLICT'?'<br>중복 기록 충돌 · 평가 제외':'')+'</p></details><small>'+e(h.account)+'</small></td><td>'+e(h.quantity??'미확인')+'</td><td>'+money(h.market_price,h.price_currency||currency)+'</td><td>'+money(h.market_value,currency)+'</td><td>'+pct(weight(h,b))+'</td></tr>').join('')+'</tbody></table></div>';}
  function render(){
    const source=window.HaniAssetMarket?.analyticsSource?.();if(!source){content.textContent='기존 시세 연결을 기다리고 있습니다.';return;}
    model=A.build(source.state,{...source,accountId:account});
    const accounts=source.state.accounts||[],ac=root.querySelector('[data-p-account]');
    if(account&&!accounts.some(a=>a.id===account)){account='';model=A.build(source.state,source);}
    ac.innerHTML='<option value="">전체 계좌</option>'+accounts.map(a=>'<option value="'+e(a.id)+'">'+e(a.name)+'</option>').join('');ac.value=account;
    const currencies=Object.keys(model.buckets);if(!currencies.includes(currency))currency=currencies[0]||'KRW';
    const cc=root.querySelector('[data-p-currency]');cc.innerHTML=(currencies.length?currencies:['KRW']).map(c=>'<option value="'+e(c)+'">'+(c==='UNKNOWN'?'통화 미확인':e(c))+'</option>').join('');cc.value=currency;
    root.querySelectorAll('[data-p-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pTab===tab)));
    const b=model.buckets[currency];if(!b){root.querySelector('[data-p-coverage]').textContent='확정된 보유기록 없음';content.textContent='계좌에서 종목과 수량을 기록하면 분석을 시작합니다.';return;}
    const rows=model.holdings.filter(h=>h.currency===currency&&h.status!=='EXPLICIT_ZERO').sort((a,b)=>(b.market_value??-1)-(a.market_value??-1)),items=aggregates(rows,'instrument');
    const unknown=model.holdings.filter(h=>h.currency==='UNKNOWN'&&h.status!=='EXPLICIT_ZERO').length;
    root.querySelector('[data-p-coverage]').textContent=(currency==='UNKNOWN'?'통화 미확인':currency)+' · 가격 평가 '+b.priced_count+'/'+b.holding_count+'개 · '+({COMPLETE:'가격 연결 완료',PARTIAL:'부분 평가',NO_DATA:'평가 미확인'}[b.coverage])+' ('+b.coverage+') · '+(b.weight_mode==='PORTFOLIO'?'포트폴리오 비중':'종목 내 비중 (가격 연결분 기준)')+(b.cash_status==='NO_DATA'?' · 명시적 현금 미확인':'')+(unknown?' · 통화 미확인 투자기록 '+unknown+'개 — 통화 선택에서 조회':'')+' · 보유목록 완전성 미확인';
    if(tab==='holdings'){content.innerHTML=table(rows,b);return;}
    if(tab==='allocation'){
      const grouped=aggregates(rows,dimension);
      content.innerHTML='<label>구성 기준 <select data-p-dimension>'+[['instrument','종목'],['account','계좌'],['asset_class','자산분류'],['market','시장 / 거래소'],['currency','통화']].map(([v,label])=>'<option value="'+v+'" '+(v===dimension?'selected':'')+'>'+label+'</option>').join('')+'</select></label><p>가격 연결 투자상품 내 구성 · 현금 제외 · 시장은 국가/투자노출과 다릅니다.</p>'+bars(grouped,b.securities_value);return;
    }
    content.innerHTML='<div class="portfolio-summary"><div><small>가격 연결 투자상품</small><strong>'+money(b.securities_value,currency)+'</strong></div><div><small>확인된 현금</small><strong>'+money(b.confirmed_cash,currency)+'</strong></div><div><small>미평가 보유기록</small><strong>'+b.unpriced_count+'개</strong></div></div><h4>가격 연결 투자상품 내 구성 · 현금 제외</h4><div class="portfolio-treemap" aria-label="종목별 투자 평가액 면적">'+(items.some(r=>r.value>0)?tile(items.filter(r=>r.value>0)).map(r=>'<div style="left:'+r.x+'%;top:'+r.y+'%;width:'+r.w+'%;height:'+r.h+'%;background:'+r.color+'" title="'+e(r.name)+' '+money(r.value,currency)+'"><span>'+e(r.name)+'</span><small>'+money(r.value,currency)+'</small></div>').join(''):'<p>가격이 연결된 투자상품이 없어 구성을 표시할 수 없습니다.</p>')+'</div><div class="portfolio-mobile-bars">'+bars(items,b.securities_value)+'</div>'+table(rows.slice(0,8),b)+(rows.length>8?'<p>상위 목록 외 '+(rows.length-8)+'개는 보유종목 탭에서 확인하세요.</p>':'');
  }
  root.addEventListener('click',event=>{const b=event.target.closest('[data-p-tab]');if(b){tab=b.dataset.pTab;render();}});
  root.addEventListener('change',event=>{if(event.target.matches('[data-p-account]'))account=event.target.value;else if(event.target.matches('[data-p-currency]'))currency=event.target.value;else if(event.target.matches('[data-p-dimension]'))dimension=event.target.value;else return;render();});
  window.addEventListener('hani:market-updated',render);render();
})();
