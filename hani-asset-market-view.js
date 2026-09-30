(function(){
  'use strict';
  const M=window.HaniMarketData,root=document.getElementById('assetMarket');if(!M||!root)return;
  const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(n,c)=>n===null?'—':new Intl.NumberFormat('ko-KR',{style:'currency',currency:c||'KRW',maximumFractionDigits:c==='USD'?2:0}).format(n);
  let client=null,metadata=[],quotes=[],rows=[],selected='',period='1M',generation=0,chartGeneration=0,timer=null,signature='',busy=false,expanded=false,lastPlot=null;
  const overrides=new Map(),chartCache=new Map();
  function status(message){$('marketStatus').textContent=message;const s=$('marketSettingsStatus');if(s)s.textContent=message;}
  function isActive(){return document.body.dataset.view==='asset'&&!document.hidden;}
  function configured(){
    if(client)return client;const baseUrl=document.querySelector('meta[name="hani-market-gateway"]')?.content;
    const bucket=document.querySelector('meta[name="hani-market-cache"]')?.content;
    if(bucket==='hani-market-cache'&&typeof cloudClient!=='undefined'&&cloudClient){
      client=M.createCacheClient({getSession:async()=>{const {data,error}=await cloudClient.auth.getSession();return error?null:data?.session;},download:async path=>{
        const {data,error}=await cloudClient.storage.from(bucket).download(path,path.endsWith('/latest.json')?{cacheNonce:Date.now()}:{}, {signal:AbortSignal.timeout(12000),cache:'no-store'});
        if(error)throw Error('PC 시세 캐시를 읽지 못했습니다. 기존 저장 기록은 유지됩니다.');return data;
      }});
      if(document.querySelector('meta[name="hani-market-catalog"]')?.content==='enabled'){
        const catalog=M.createCatalogClient({getSession:async()=>{const {data,error}=await cloudClient.auth.getSession();return error?null:data?.session;},download:async path=>{const {data,error}=await cloudClient.storage.from(bucket).download(path,path.endsWith('/catalog/index.json')?{cacheNonce:Date.now()}:{}, {signal:AbortSignal.timeout(12000),cache:'no-store'});if(error)throw Error('전체 종목 목록을 읽지 못했습니다. 수집 상태를 확인해주세요.');return data;}});
        client.search=catalog.search;client.catalog=true;
      }
      return client;
    }
    if(!baseUrl)return null;
    client=M.createClient({baseUrl,getToken:async()=>{if(typeof cloudClient==='undefined'||!cloudClient)return null;const {data,error}=await cloudClient.auth.getSession();return error?null:data?.session?.access_token;}});return client;
  }
  function positions(){return M.positions(state,typeof calculate==='function'?calculate().holdings:[]).map(p=>overrides.has(p.key)?{...p,ticker:overrides.get(p.key),instrumentId:''}:p);}
  function rebuild(){
    const account=$('marketAccount').value;
    rows=positions().filter(p=>!account||p.accountId===account).map(p=>{const resolution=M.resolve(p,state.instruments||[],metadata);return M.evaluate(p,resolution,quotes.find(q=>M.symbol(q.symbol)===resolution.symbol));});
    if(!rows.some(r=>r.key===selected))selected=rows[0]?.key||'';
  }
  let plotSequence=0;
  let chartStyle='line';
  function chartNumber(v){return v===null||v===undefined||String(v).trim()===''?null:Number.isFinite(Number(v))?Number(v):null;}
  function detailPlot(data,buyPrice,code){
    const values=M.candles(data),w=Math.max(320,Math.min(900,root.clientWidth-70)),h=380;
    const valid=c=>{const o=chartNumber(c.openPrice),hi=chartNumber(c.highPrice),lo=chartNumber(c.lowPrice);return o>0&&lo>0&&hi>=Math.max(o,c.closePrice)&&lo<=Math.min(o,c.closePrice)&&hi>=lo;};
    const candleMode=chartStyle==='candle',range=values.flatMap(c=>valid(c)?[Number(c.lowPrice),Number(c.highPrice)]:[c.closePrice]);if(buyPrice!==null)range.push(buyPrice);
    const min=Math.min(...range),max=Math.max(...range),span=Math.max(max-min,max*.002,.01),labels=[0,1,2,3].map(i=>(max-i*(max-min)/3).toLocaleString('ko-KR',{maximumFractionDigits:2}));
    const left=Math.max(76,...labels.map(s=>s.length*7+16)),right=w-18,top=20,bottom=245,vt=277,vb=335,step=(right-left-12)/Math.max(1,values.length-1),bar=Math.max(1,Math.min(14,step*.65));
    const x=i=>left+6+i*step,y=v=>top+(max+span*.08-v)/(span*1.16)*(bottom-top),clip='market-plot-'+(++plotSequence);
    const path=items=>items.map(({i,v},j)=>(j?'L':'M')+x(i)+','+y(v)).join(' ');
    const averages=[5,20].map(n=>({n,points:values.flatMap((c,i)=>i<n-1?[]:[{i,v:values.slice(i-n+1,i+1).reduce((s,c)=>s+c.closePrice,0)/n}])}));
    const volumes=values.map(c=>chartNumber(c.volume)),vmax=Math.max(1,...volumes.filter(v=>v!==null&&v>=0));
    const price=candleMode?values.map((c,i)=>valid(c)?'<g class="market-candle" style="color:'+(c.closePrice>=Number(c.openPrice)?'#e44c68':'#397ee8')+'"><path stroke="currentColor" d="M'+x(i)+','+y(Number(c.highPrice))+' V'+y(Number(c.lowPrice))+'"/><rect x="'+(x(i)-bar/2)+'" y="'+Math.min(y(Number(c.openPrice)),y(c.closePrice))+'" width="'+bar+'" height="'+Math.max(1,Math.abs(y(Number(c.openPrice))-y(c.closePrice)))+'"/></g>':'').join(''):'<path class="market-price-line" d="'+path(values.map((c,i)=>({i,v:c.closePrice})))+'"/>';
    const grid=labels.map((s,i)=>'<path class="market-grid" d="M'+left+','+y(max-i*(max-min)/3)+' H'+right+'"/><text class="market-y-tick" x="'+(left-10)+'" y="'+y(max-i*(max-min)/3)+'" text-anchor="end">'+escape(s)+'</text>').join('');
    const missing=values.filter(c=>!valid(c)).length;
    return '<div class="market-chart-tools"><button type="button" class="btn sm" data-chart-style="line" aria-pressed="'+!candleMode+'">가격선</button><button type="button" class="btn sm" data-chart-style="candle" aria-pressed="'+candleMode+'">캔들</button><span class="market-ma5">5봉 평균</span><span class="market-ma20">20봉 평균</span></div><svg data-market-detail="true" data-left="'+left+'" data-right="'+right+'" style="--market-series:'+M.chartColor(code)+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="가격·이동평균·거래량 차트"><defs><clipPath id="'+clip+'"><rect x="'+left+'" y="'+top+'" width="'+(right-left)+'" height="'+(bottom-top)+'"/></clipPath></defs>'+grid+'<g class="market-plot-area" clip-path="url(#'+clip+')">'+price+averages.map(a=>'<path class="market-ma market-ma'+a.n+'" d="'+path(a.points)+'"/>').join('')+(buyPrice===null?'':'<path class="market-average" d="M'+(left+6)+','+y(buyPrice)+' H'+(right-6)+'"/>')+'</g><text x="'+left+'" y="268">거래량</text>'+values.map((c,i)=>volumes[i]===null||volumes[i]<0?'':'<rect class="market-volume" fill="'+(valid(c)?c.closePrice>=Number(c.openPrice)?'#e44c68':'#397ee8':'#94a3b8')+'" x="'+(x(i)-bar/2)+'" y="'+(vb-volumes[i]/vmax*(vb-vt))+'" width="'+bar+'" height="'+(volumes[i]/vmax*(vb-vt))+'"/>').join('')+'<text class="market-x-tick" x="'+left+'" y="360">'+escape(values[0].timestamp.slice(0,10))+'</text><text class="market-x-tick" x="'+right+'" y="360" text-anchor="end">'+escape(values.at(-1).timestamp.slice(0,10))+'</text></svg><div class="market-chart-readout" aria-live="polite">차트를 가리키거나 터치해 상세 가격을 확인하세요.</div><label class="market-chart-slider">날짜 선택<input type="range" data-chart-index min="0" max="'+(values.length-1)+'" value="'+(values.length-1)+'" aria-label="차트 날짜 선택"></label><div class="market-note">'+(period==='1D'?'평균선은 제공된 분봉 기준':'일봉 기준 5일·20일 평균')+' · 충분한 봉이 쌓인 위치부터 표시'+(candleMode&&missing?' · OHLC 미제공 '+missing+'개 봉 제외':'')+(volumes.some(v=>v===null)?' · 거래량 미제공 구간 있음':'')+(buyPrice===null?'':' · 점선: 내 평균매입가 '+escape(buyPrice.toLocaleString('ko-KR')))+'</div>';
  }
  function plot(data,buyPrice=null,mini=false,code=''){
    const values=M.candles(data);if(values.length<2)return '<div class="market-empty">가격 기록이 충분하지 않습니다.</div>';
    if(!mini)return detailPlot(values,buyPrice,code);
    const w=mini?900:Math.max(320,Math.min(900,root.clientWidth-70)),h=mini?100:300,points=values.map(c=>c.closePrice),range=points.concat(buyPrice!==null?[buyPrice]:[]),min=Math.min(...range),max=Math.max(...range),span=Math.max(max-min,max*.002,0.01);
    const labels=[0,1,2,3].map(i=>(max-i*(max-min)/3).toLocaleString('ko-KR',{maximumFractionDigits:2}));
    const left=mini?5:Math.max(76,Math.max(...labels.map(s=>s.length))*7+16),right=w-(mini?5:18),top=mini?5:24,bottom=h-(mini?5:48);
    const y=v=>top+(max+span*.08-v)/(span*1.16)*(bottom-top),x=i=>left+6+i*(right-left-12)/(points.length-1),path=points.map((v,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ');
    const clip='market-plot-'+(++plotSequence),color=M.chartColor(code);
    const grid=mini?'':[0,1,2,3].map(i=>{const yy=y(max-i*(max-min)/3);return '<path class="market-grid" d="M'+left+','+yy+' H'+right+'"/><text class="market-y-tick" x="'+(left-10)+'" y="'+yy+'" text-anchor="end" dominant-baseline="middle">'+escape(labels[i])+'</text>';}).join('');
    const axes=mini?'':'<path class="market-grid" d="M'+left+','+top+' V'+bottom+' H'+right+'"/><text class="market-x-tick" x="'+left+'" y="'+(bottom+22)+'">'+escape(values[0].timestamp.slice(5,10))+'</text><text class="market-x-tick" x="'+right+'" y="'+(bottom+22)+'" text-anchor="end">'+escape(values.at(-1).timestamp.slice(5,10))+'</text>';
    const line=buyPrice===null?'':'<path class="market-average" d="M'+(left+6)+','+y(buyPrice)+' H'+(right-6)+'"/>';
    const legend=!mini&&buyPrice!==null?'<div class="market-average-note">점선 · 현재 보유분 평균매입가 '+escape(buyPrice.toLocaleString('ko-KR',{maximumFractionDigits:2}))+'</div>':'';
    return '<svg style="--market-series:'+color+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+(mini?'종목 가격 추이':'시장 가격 그래프 · 현재 평균매입가 기준')+'"><defs><clipPath id="'+clip+'"><rect x="'+left+'" y="'+top+'" width="'+(right-left)+'" height="'+(bottom-top)+'"/></clipPath></defs>'+grid+axes+'<g class="market-plot-area" clip-path="url(#'+clip+')">'+line+'<path class="market-price-line" d="'+path+'"/>'+(!mini?'<circle cx="'+x(points.length-1)+'" cy="'+y(points.at(-1))+'" r="4"/>':'')+'</g></svg>'+legend;
  }
  function render(){
    rebuild();const summary=M.summarize(rows);
    $('marketSummary').innerHTML=Object.entries(summary.totals).map(([c,t])=>'<div><small>'+escape(c)+' 연결 종목 평가액</small><strong>'+money(t.valuation,c)+'</strong><span>'+(t.completeCost?'평가손익 '+money(t.pnl,c):'매입원가 통화 확인 전 · 합산 손익 미제공')+'</span></div>').join('')||'<div><strong>현재 평가 대기</strong><span>가격이 연결되면 별도로 계산합니다.</span></div>';
    $('marketCoverage').textContent='가격 평가 '+summary.priced+'/'+summary.total+'개 보유기록 · 현금·미분류 및 저장된 계좌 총액은 변경하지 않습니다.';
    const visible=expanded?rows:rows.slice(0,6);
    $('marketCards').innerHTML=visible.map(r=>'<button type="button" class="market-holding '+(r.key===selected?'is-selected':'')+'" data-market-holding="'+escape(r.key)+'" aria-pressed="'+(r.key===selected)+'"><b>'+escape(r.name)+'</b><small>'+escape(r.accountName)+' · '+escape(r.quantity??'수량 미확인')+(r.quantity===null?'':'주')+'</small><strong>'+money(r.price,r.resolution.currency)+'</strong><div class="market-mini" data-market-mini="'+escape(r.key)+'">'+(chartCache.has(r.resolution.symbol)?plot(chartCache.get(r.resolution.symbol),null,true,r.resolution.symbol):'<span>가격 추이 대기</span>')+'</div><span>'+(r.valuation===null?'최신 평가 제외 · 저장 평가액 '+(r.recordedEvaluation===null?'미기록':r.recordedEvaluation.toLocaleString('ko-KR')+' (기록 단위)'):'평가액 '+money(r.valuation,r.resolution.currency))+'</span></button>').join('')||'<div class="market-empty">확정된 계좌 보유기록이 없습니다. 기존 자산 업데이트에서 기록해주세요.</div>';
    $('marketMore').hidden=rows.length<=6;$('marketMore').textContent=expanded?'간략히 보기':'전체 '+rows.length+'개 보기';
    const r=rows.find(r=>r.key===selected);
    $('marketInstrument').textContent=r?r.name+' · '+(r.resolution.symbol||r.ticker||'코드 미확인'):'보유종목을 선택해주세요';
    $('marketPrice').textContent=r?money(r.price,r.resolution.currency):'—';
    $('marketPosition').textContent=r?(r.quantity??'수량 미확인')+'주 · 현재 평가 '+money(r.valuation,r.resolution.currency)+' · 손익 '+money(r.pnl,r.resolution.currency)+' · 내 수익률 '+(r.rate===null?'—':r.rate.toFixed(2)+'%'):'';
    $('marketAsOf').textContent=r?'보유정보 '+r.holdingAsOf+' · 가격 '+(r.priceAsOf?new Date(r.priceAsOf).toLocaleString('ko-KR'):'기준시각 미확인')+(r.priceStatus==='last-known'?' · 마지막 확인 가격 (휴장 또는 지연 가능)':''):'';
    $('marketResolve').hidden=!r||r.resolution.status==='matched';
    $('marketResolveReason').textContent=r?.resolution.reason||'';
    root.querySelectorAll('[data-market-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.marketPeriod===period)));
  }
  async function drawMain(){
    const r=rows.find(r=>r.key===selected),id=++chartGeneration;lastPlot=null;
    $('marketChart').innerHTML='<div class="market-empty">'+(!r||r.resolution.status!=='matched'?'종목·가격 연결 후 그래프를 표시합니다.':'차트를 불러오고 있습니다…')+'</div>';$('marketChartMeta').textContent='';
    if(!r||r.resolution.status!=='matched'||!client)return;
    try{
      const data=await client.chart(r.resolution.symbol,period);if(id!==chartGeneration||!isActive())return;
      const points=M.candles(data.result).filter(c=>c.currency===r.resolution.currency);
      const avg=!data.adjusted&&r.cost!==null&&r.quantity>0?r.cost/r.quantity:null;
      lastPlot={points,avg,code:r.resolution.symbol};$('marketChart').innerHTML=plot(points,avg,false,r.resolution.symbol);
      const first=points[0],last=points.at(-1),change=first&&last?(last.closePrice/first.closePrice-1)*100:null;
      $('marketChartMeta').textContent=(change===null?'':('제공 구간 가격 등락 '+(change>=0?'+':'')+change.toFixed(2)+'% · '+first.timestamp.slice(0,10)+' ~ '+last.timestamp.slice(0,10)+' · '))+'Toss · 미수정주가 · '+(data.complete?'제공 데이터 기준':'일부 구간만 제공')+' · 평균선은 현재 보유분 기준이며 과거 실제 손익이 아닙니다.';
    }catch(e){if(id===chartGeneration){$('marketChart').innerHTML='<div class="market-empty">'+(client.info?'해당 기간 차트가 미수집 상태이거나 읽기에 실패했습니다. 우선 1개월 차트를 확인해주세요.':'차트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')+'</div>';}}
  }
  async function miniCharts(id){
    // Sequential, capped at visible six: never fan out requests for every holding.
    for(const r of rows.slice(0,6)){
      if(id!==generation||!isActive())return;if(r.resolution.status!=='matched')continue;
      try{const data=await client.chart(r.resolution.symbol,'1M');if(id!==generation||!isActive())return;const points=M.candles(data.result).filter(c=>c.currency===r.resolution.currency);chartCache.set(r.resolution.symbol,points);
        for(const el of root.querySelectorAll('[data-market-mini]'))if(rows.find(x=>x.key===el.dataset.marketMini)?.resolution.symbol===r.resolution.symbol)el.innerHTML=plot(points,null,true,r.resolution.symbol);
      }catch(_){/* Cards retain their recorded value and explicit unavailable state. */}
    }
  }
  async function refresh(){
    if(!isActive()||busy)return;busy=true;const id=++generation;
    try{
      render();const c=configured();if(!c){status('연결 안 됨 · 서버 연결 전입니다. 기존 기록은 그대로 유지됩니다.');return;}
      status('종목정보·가격 확인 중…');
      const codes=positions().map(p=>p.ticker||M.symbol((state.instruments||[]).find(i=>i.id===p.instrumentId)?.ticker));
      metadata=await c.stocks(codes);if(id!==generation)return;
      quotes=await c.prices(metadata.map(s=>s.symbol));if(id!==generation)return;
      render();const info=c.info?.();status(info?'PC 마지막 수집 '+new Date(info.collectedAt).toLocaleString('ko-KR')+' · 저장된 시세 표시 · 실시간 아님':'가격·종목정보 응답 정상 · 마지막 조회 '+new Date().toLocaleTimeString('ko-KR')+' · 원본 기록 보존');
      await drawMain();await miniCharts(id);
    }catch(e){if(id===generation){status(e.message);render();await drawMain();}}
    finally{busy=false;if(id!==generation&&isActive())refresh();}
  }
  function sync(){
    const account=$('marketAccount').value,accounts=state.accounts||[],sig=JSON.stringify([accounts.map(a=>[a.id,a.name]),positions()]);
    if(signature!==sig){signature=sig;$('marketAccount').innerHTML='<option value="">전체 계좌</option>'+accounts.map(a=>'<option value="'+escape(a.id)+'">'+escape(a.name)+'</option>').join('');if(accounts.some(a=>a.id===account))$('marketAccount').value=account;render();}
    if(isActive()){if(!timer){refresh();timer=setInterval(refresh,60000);}}else{clearInterval(timer);timer=null;generation++;chartGeneration++;}
  }
  $('marketAccount').addEventListener('change',()=>{render();drawMain();miniCharts(generation);});
  $('marketRefresh').addEventListener('click',()=>{client?.clear();refresh();});
  $('marketMore').addEventListener('click',()=>{expanded=!expanded;render();});
  function inspectPoint(index){
    if(!lastPlot)return;const c=lastPlot.points[Math.max(0,Math.min(lastPlot.points.length-1,index))];if(!c)return;
    const fmt=v=>{const n=chartNumber(v);return n===null?'미제공':n.toLocaleString('ko-KR',{maximumFractionDigits:4});};
    const el=root.querySelector('.market-chart-readout');if(el)el.textContent=c.timestamp.slice(0,16).replace('T',' ')+' · '+(c.currency||'')+' · 시가 '+fmt(c.openPrice)+' · 고가 '+fmt(c.highPrice)+' · 저가 '+fmt(c.lowPrice)+' · 종가 '+fmt(c.closePrice)+' · 거래량 '+fmt(c.volume);
  }
  $('marketChart').addEventListener('click',e=>{const b=e.target.closest('[data-chart-style]');if(b&&lastPlot){chartStyle=b.dataset.chartStyle;$('marketChart').innerHTML=plot(lastPlot.points,lastPlot.avg,false,lastPlot.code);}});
  $('marketChart').addEventListener('pointermove',e=>{const svg=e.target.closest('svg[data-market-detail]');if(!svg||!lastPlot)return;const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)*svg.viewBox.baseVal.width/r.width,left=Number(svg.dataset.left)+6,right=Number(svg.dataset.right)-6;inspectPoint(Math.round((px-left)/(right-left)*(lastPlot.points.length-1)));});
  $('marketChart').addEventListener('input',e=>{if(e.target.matches('[data-chart-index]'))inspectPoint(Number(e.target.value));});
  root.addEventListener('click',event=>{const holding=event.target.closest('[data-market-holding]'),button=event.target.closest('[data-market-period]');if(holding){selected=holding.dataset.marketHolding;render();drawMain();}if(button){period=button.dataset.marketPeriod;render();drawMain();}});
  $('marketSearchButton').addEventListener('click',async()=>{
    const key=selected,query=$('marketSearch').value,market=$('marketSearchMarket').value;
    try{const c=configured();if(!c)throw Error('서버 연결 후 종목을 검색할 수 있습니다.');const result=await c.search(query,market);if(key!==selected)return;
      $('marketSearchResults').replaceChildren();for(const s of result.result){const b=document.createElement('button');b.type='button';b.className='btn sm';b.textContent=s.name+' · '+s.symbol+' · 이번 화면에 연결';b.addEventListener('click',()=>{overrides.set(key,s.symbol);$('marketSearchResults').replaceChildren();client.clear();refresh();});$('marketSearchResults').append(b);}if(!result.result.length)$('marketSearchResults').textContent='검색 결과가 없습니다.';
    }catch(e){$('marketSearchResults').textContent=e.message;}
  });
  document.addEventListener('visibilitychange',sync);
  // Lookup fills the existing form only. The canonical addInstrument handler owns saving.
  const lookup=$('instrumentLookup');
  if(lookup){
    const query=$('instrumentLookupQuery'),market=$('instrumentLookupMarket'),results=$('instrumentLookupResults'),message=$('instrumentLookupStatus');let request=0;
    const fingerprint=()=>JSON.stringify(['instrumentEditId','instrumentName','instrumentTicker','instrumentMarket','instrumentClass'].map(id=>$(id)?.value||''));
    function invalidate(){request++;results.replaceChildren();message.textContent='검색 결과를 선택해 입력할 수 있습니다. 아직 저장되지 않았습니다.';}
    query.addEventListener('input',invalidate);market.addEventListener('change',invalidate);
    async function search(){
      const ticket=++request,q=query.value.trim(),exchange=market.value,before=fingerprint();results.replaceChildren();
      if(M.name(q).length<2){message.textContent='종목명이나 코드를 2자 이상 입력해주세요.';return;}
      message.textContent='종목을 검색하고 있습니다…';
      try{
        const c=configured();if(!c)throw Error('종목 목록이 연결되지 않았습니다. 직접 입력은 계속 사용할 수 있습니다.');
        const data=await c.search(q,exchange);if(ticket!==request)return;
        const candidates=M.searchCandidates(data.result,q,exchange),limited=typeof c.info==='function'&&!c.catalog;
        message.textContent=(limited?'수집된 종목 범위 · 전체 종목 검색 아님 · ':'토스 거래 가능 활성 종목 · ')+(data.collectedAt?'목록 기준 '+new Date(data.collectedAt).toLocaleDateString('ko-KR')+' · ':'')+(candidates.length?candidates.length+'개 후보 · 선택 후 저장 필요':'검색 결과 없음 · 다른 거래소나 코드로 검색해주세요.');
        for(const candidate of candidates){
          const button=document.createElement('button');button.type='button';button.className='btn instrument-lookup-result';
          button.textContent=candidate.name+' · '+candidate.symbol+' · '+candidate.market+' · '+candidate.currency+' — 입력하기';
          button.addEventListener('click',()=>{
            if(ticket!==request||before!==fingerprint()){invalidate();message.textContent='등록 폼이 변경되었습니다. 다시 검색해주세요.';return;}
            const editId=$('instrumentEditId')?.value||'',editing=(state.instruments||[]).find(i=>i.id===editId);
            if(editId&&(!editing||M.symbol(editing.ticker)!==candidate.symbol)){
              message.textContent='기존 종목 수정 중에는 다른 종목으로 연결하지 않습니다. 수정을 마친 뒤 새 종목을 등록해주세요.';return;
            }
            if(!editId&&(state.instruments||[]).some(i=>M.symbol(i.ticker)===candidate.symbol)){
              message.textContent='이미 등록된 코드입니다. 종목 마스터의 수정 버튼을 이용해주세요.';return;
            }
            $('instrumentName').value=candidate.name;$('instrumentTicker').value=candidate.symbol;
            if($('instrumentMarket'))$('instrumentMarket').value=candidate.currency==='KRW'?'KR':'US';
            // Source does not supply a reliable class; never guess ETF vs stock.
            if(!editId)$('instrumentClass').value=['ETF','FOREIGN_ETF'].includes(candidate.securityType)?'ETF':['STOCK','FOREIGN_STOCK','DEPOSITARY_RECEIPT'].includes(candidate.securityType)?'주식':'기타';
            results.replaceChildren();request++;
            message.textContent=candidate.name+' · '+candidate.market+' · '+candidate.currency+' 입력 완료. 분류를 확인한 뒤 종목 저장을 눌러주세요. 아직 저장되지 않았습니다.';
          });results.append(button);
        }
      }catch(e){if(ticket===request)message.textContent=e.message;}
    }
    $('instrumentLookupButton').addEventListener('click',search);
    query.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();search();}});
  }
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(lastPlot)$('marketChart').innerHTML=plot(lastPlot.points,lastPlot.avg,false,lastPlot.code);}).observe(root);
  window.HaniAssetMarket={sync,async resolveHoldings(holdings){const c=configured();if(!c)return false;const masters=state.instruments||[],codes=holdings.map(h=>h.ticker||masters.find(i=>i.id===h.instrumentId)?.ticker);try{const info=await c.stocks(codes);return holdings.length>0&&holdings.every(h=>M.resolve(h,masters,info).status==='matched');}catch(_){return false;}},async verifyCatalogInstrument(instrument){const c=configured(),code=M.symbol(instrument?.ticker);if(!c?.catalog||!M.validSymbol(code))return false;const domestic=/^(KR|KOSPI|KOSDAQ|국내)$/.test(instrument.market)||/^\d{6}$/.test(code),markets=domestic?['KOSPI','KOSDAQ','KR_ETC']:['NYSE','NASDAQ','AMEX','US_ETC'];for(const market of markets){try{const found=await c.search(code,market);if(found.result?.some(s=>M.symbol(s.symbol)===code&&s.currency===(domestic?'KRW':'USD')))return true;}catch(_){return false;}}return false;}};sync();
})();
