/* Read-only market overlay. Never writes HANI state or storage. */
(function(root){
  'use strict';
  const number=value=>value===null||value===undefined||String(value).trim()===''?null:(Number.isFinite(Number(value))?Number(value):null);
  const symbol=value=>String(value||'').trim().toUpperCase().replace(/^A(?=\d[A-Z0-9]{5}$)/,'');
  const validSymbol=value=>/^(?:\d[A-Z0-9]{5,19}|[A-Z][A-Z0-9.-]{0,19})$/.test(value);
  // Stateless identity color: account order, quote movement and theme cannot change it.
  function chartColor(value){const code=symbol(value);if(!code)return '#64748b';let hash=2166136261;for(const ch of code)hash=Math.imul(hash^ch.charCodeAt(0),16777619);return ['#2563eb','#7c3aed','#0f766e','#c2410c','#a21caf','#0369a1','#4d7c0f','#b45309'][(hash>>>0)%8];}
  const name=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s.\-()]/g,'');
  const currency=market=>/^(KOSPI|KOSDAQ|KR_ETC)$/.test(market)?'KRW':/^(NYSE|NASDAQ|AMEX|US_ETC)$/.test(market)?'USD':null;
  function searchCandidates(rows,query,market){
    const q=name(query),seen=new Set();if(q.length<2||q.length>80||!currency(market))return [];
    return (Array.isArray(rows)?rows:[]).filter(s=>{
      if(!s||s.market!==market||s.currency!==currency(market)||typeof s.name!=='string'||!s.name.trim()||s.name.length>200||!validSymbol(symbol(s.symbol)))return false;
      const code=symbol(s.symbol);if(seen.has(code)||![s.name,s.englishName,s.symbol,code].some(v=>name(v).includes(q)))return false;
      seen.add(code);return true;
    }).slice(0,20).map(s=>({name:s.name.trim(),symbol:symbol(s.symbol),market:s.market,currency:s.currency,...(s.securityType?{securityType:s.securityType}:{})}));
  }
  function positions(state,transactionRows=[]){
    // Select latest explicit account record independently. Never concatenate historical snapshots.
    const latest=new Map(), accounts=new Map((state.accounts||[]).map(a=>[a.id,a]));
    const rows=(state.investmentBrokerSnapshots||[]).filter(s=>(s.mode==='actual'||s.mode==='positions'&&s.recordType==='positions')&&s.status==='confirmed').slice().sort((a,b)=>String(a.period||'').localeCompare(String(b.period||''))||String(a.snapshotDate||'').localeCompare(String(b.snapshotDate||''))||String(a.updatedAt||'').localeCompare(String(b.updatedAt||'')));
    for(const snapshot of rows) for(const account of snapshot.accounts||[]) if(account.enabled&&accounts.has(account.accountId)) latest.set(account.accountId,{account,snapshot});
    const result=[...latest.values()].flatMap(({account,snapshot})=>(account.holdings||[]).map((h,index)=>({
      key:account.accountId+':'+(h.id||index),accountId:account.accountId,accountName:accounts.get(account.accountId).name,
      instrumentId:h.instrumentId||'',rawName:h.rawName||h.name||'',name:h.name||h.rawName||'이름 미확인',
      ticker:symbol(h.ticker||h.rawTicker),quantity:number(h.quantity),buyPrice:number(h.buyPrice),purchaseAmount:number(h.purchaseAmount),
      recordedEvaluation:number(h.evaluationAmount),recordedPnl:number(h.pnl),recordedCurrency:h.currency||null,buyCurrency:['KRW','USD'].includes(h.buyCurrency)?h.buyCurrency:null,
      holdingAsOf:snapshot.asOfDate||snapshot.snapshotDate||snapshot.period||'',
    })));
    for(const h of transactionRows)if(accounts.has(h.accountId)&&!latest.has(h.accountId)){
      const instrument=(state.instruments||[]).find(i=>i.id===h.instrumentId);
      result.push({key:h.accountId+':'+h.instrumentId,accountId:h.accountId,accountName:accounts.get(h.accountId).name,instrumentId:h.instrumentId,
        name:instrument?.name||'이름 미확인',rawName:instrument?.name||'',ticker:symbol(instrument?.ticker),quantity:number(h.qty),buyPrice:number(h.avg),purchaseAmount:number(h.cost),
        recordedEvaluation:number(h.market),recordedPnl:number(h.pnl),recordedCurrency:instrument?.currency||null,holdingAsOf:'HANI 거래 기록 기준'});
    }
    return result;
  }
  function resolve(position,instruments,metadata){
    const master=instruments.find(i=>i.id===position.instrumentId);
    const raw=symbol(position.ticker), canonical=symbol(master?.ticker);
    if(raw&&canonical&&raw!==canonical)return {status:'conflict',reason:'기록과 종목 Master 코드가 다릅니다.'};
    const code=raw||canonical;
    if(!validSymbol(code))return {status:'unmatched',reason:'종목코드 확인 필요'};
    const stock=metadata.find(i=>symbol(i.symbol)===code);
    if(!stock)return {status:'unmatched',symbol:code,reason:'종목정보 미연결'};
    if(!stock.currency||stock.currency!==currency(stock.market))return {status:'unmatched',reason:'시장·통화 확인 필요'};
    return {status:'matched',symbol:code,stock,currency:stock.currency};
  }
  function evaluate(position,resolution,quote,now=Date.now()){
    const base={...position,resolution,valuation:null,pnl:null,rate:null,cost:null,price:null,priceAsOf:null,priceStatus:'unavailable'};
    const price=number(quote?.lastPrice);
    if(resolution.status!=='matched'||symbol(quote?.symbol)!==resolution.symbol||quote?.currency!==resolution.currency||price===null||price<=0)return base;
    const time=Date.parse(quote.timestamp),knownTime=Number.isFinite(time)&&time<=now+60000;
    const priceStatus=knownTime?(now-time>120000?'last-known':'recent'):'time-unknown';
    const result={...base,price,priceAsOf:knownTime?quote.timestamp:null,priceStatus};
    if(position.quantity===null||position.quantity<0)return result;
    result.valuation=position.quantity*price;
    // Legacy records have no explicit currency. Only domestic KRW cost is safe to infer.
    const costCurrency=position.buyCurrency||position.recordedCurrency||(resolution.currency==='KRW'?'KRW':null);
    if(costCurrency===resolution.currency){
      // Explicit buy currency describes unit cost, not legacy aggregate purchaseAmount.
      result.cost=position.buyCurrency?(position.buyPrice===null?null:position.quantity*position.buyPrice):(position.purchaseAmount??(position.buyPrice===null?null:position.quantity*position.buyPrice));
      if(result.cost!==null&&result.cost>=0){result.pnl=result.valuation-result.cost;result.rate=result.cost>0?result.pnl/result.cost*100:null;}
    }
    return result;
  }
  function summarize(rows){
    const totals={};
    for(const r of rows)if(r.valuation!==null){const c=r.resolution.currency,t=totals[c]||(totals[c]={valuation:0,pnl:0,cost:0,completeCost:true});t.valuation+=r.valuation;if(r.cost===null)t.completeCost=false;else{t.pnl+=r.pnl;t.cost+=r.cost;}}
    return {totals,priced:rows.filter(r=>r.valuation!==null).length,total:rows.length,unpriced:rows.filter(r=>r.valuation===null)};
  }
  function candles(rows){
    const map=new Map();for(const row of rows||[]){const p=number(row.closePrice),time=Date.parse(row.timestamp);if(p!==null&&p>0&&Number.isFinite(time))map.set(time,{...row,closePrice:p});}
    return [...map.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  }
  function createClient({baseUrl,getToken,fetcher=fetch,now=Date.now}){
    const url=new URL(baseUrl);if(url.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol==='http:'))throw Error('HTTPS Gateway가 필요합니다.');
    const cache=new Map(),pending=new Map();
    async function request(path,ttl=60000){
      const token=await getToken();if(!token)throw Error('시세 연결에는 HANI 로그인이 필요합니다.');
      const key=token+'|'+path,cached=cache.get(key);if(cached&&now()-cached.at<ttl)return cached.value;
      if(pending.has(key))return pending.get(key);
      const task=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{
        const response=await fetcher(new URL(path,url),{headers:{Authorization:'Bearer '+token},signal:controller.signal,credentials:'omit',redirect:'error'});
        if(!response.ok)throw Error(response.status===401?'로그인을 다시 확인해주세요.':response.status===429?'시세 요청이 많습니다. 잠시 후 다시 시도해주세요.':'시세 연결을 확인하지 못했습니다. 저장 기록은 유지됩니다.');
        const data=await response.json();if(cache.size>250)cache.clear();cache.set(key,{at:now(),value:data});return data;
      }finally{clearTimeout(timer);pending.delete(key);}})();pending.set(key,task);return task;
    }
    const batch=async(route,values,ttl)=>{const codes=[...new Set(values.map(symbol).filter(validSymbol))],result=[];for(let i=0;i<codes.length;i+=200){const data=await request('/v1/'+route+'?symbols='+encodeURIComponent(codes.slice(i,i+200).join(',')),ttl);result.push(...data.result);}return result;};
    return {prices:codes=>batch('prices',codes,30000),stocks:codes=>batch('stocks',codes,86400000),
      chart:(code,period)=>request('/v1/chart?symbol='+encodeURIComponent(code)+'&period='+period,period==='1D'?60000:300000),
      search:(query,market)=>request('/v1/search?market='+encodeURIComponent(market)+'&q='+encodeURIComponent(query),86400000),clear:()=>{cache.clear();}};
  }
  // Dedicated private Storage only. No asset-state or localStorage writes.
  function createCacheClient({getSession,download,now=Date.now}){
    let identity='',latest=null,checked=0,pending=null;const charts=new Map();
    async function session(){const s=await getSession();const key=s?.user?.id+'|'+s?.access_token;
      if(key!==identity){identity=key;latest=null;checked=0;pending=null;charts.clear();}
      if(!s?.user?.id||!s.access_token||s.user.is_anonymous)throw Error('시세 캐시를 보려면 HANI 로그인이 필요합니다.');return {key,uid:s.user.id};}
    async function read(path,limit){const blob=await download(path);if(!blob||blob.size>limit)throw Error('시세 캐시 크기 오류');return JSON.parse(await blob.text());}
    async function snapshot(){const s=await session();if(latest&&now()-checked<300000)return latest;if(pending)return pending;
      const task=(async()=>{const d=await read(s.uid+'/latest.json',65536),stamp=Date.parse(d.collectedAt);
        if(d.version!==1||!Number.isFinite(stamp)||stamp>now()+60000||!Array.isArray(d.stocks)||!Array.isArray(d.quotes)||d.stocks.length>200||d.quotes.length>200||!d.charts||typeof d.charts!=='object')throw Error('시세 캐시 형식을 확인해주세요.');
        if(s.key!==identity)throw Error('로그인이 변경되었습니다. 다시 조회해주세요.');
        if(latest&&stamp<Date.parse(latest.collectedAt))throw Error('이전 시세 응답입니다. 마지막 정상 가격을 유지합니다.');
        latest=d;checked=now();return d;
      })();pending=task;try{return await task;}finally{if(pending===task)pending=null;}}
    const subset=(rows,codes)=>rows.filter(r=>codes.map(symbol).includes(symbol(r.symbol)));
    return {stocks:async codes=>subset((await snapshot()).stocks,codes),prices:async codes=>subset((await snapshot()).quotes,codes),
      search:async(query,market)=>({result:(await snapshot()).stocks.filter(s=>s.market===market&&[s.name,s.symbol].some(v=>name(v).includes(name(query)))).slice(0,20)}),
      chart:async(code,period)=>{const s=await session(),d=await snapshot(),ref=d.charts[symbol(code)+'/'+period];
        if(typeof ref!=='string'||!/^charts\/[a-f0-9]{64}\.json$/.test(ref))throw Error('PC에서 아직 수집하지 않은 차트입니다.');
        if(charts.has(ref))return charts.get(ref);const chart=await read(s.uid+'/'+ref,262144);
        if(s.key!==identity)throw Error('로그인이 변경되었습니다.');
        if(chart.symbol!==symbol(code)||chart.period!==period||!Array.isArray(chart.result))throw Error('차트 캐시 형식 오류');
        if(charts.size>=30)charts.clear();charts.set(ref,chart);return chart;},
      info:()=>latest?{collectedAt:latest.collectedAt}:null,
      clear:()=>{/* Manual refresh observes the same minimum interval to bound egress. */}};
  }
  function createCatalogClient({getSession,download,now=Date.now}){
    let identity='',manifest=null,loadedAt=0,pending=null;const lists=new Map(),loading=new Map();
    async function auth(){const s=await getSession(),key=s?.user?.id+'|'+s?.access_token;if(key!==identity){identity=key;manifest=null;pending=null;lists.clear();loading.clear();}if(!s?.user?.id||!s.access_token||s.user.is_anonymous)throw Error('종목 검색에는 로그인이 필요합니다.');return {uid:s.user.id,key};}
    async function read(path,hash){const b=await download(path);if(!b||b.size>262144)throw Error('종목 목록 크기 오류');const text=await b.text();if(hash){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));const actual=Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');if(actual!==hash)throw Error('종목 목록 검증 실패');}return JSON.parse(text);}
    async function index(s){if(manifest&&now()-loadedAt<86400000)return manifest;if(pending)return pending;
      const task=(async()=>{const d=await read(s.uid+'/catalog/index.json'),at=Date.parse(d.collectedAt);
        if(d.version!==1||!Number.isFinite(at)||at>now()+60000||!d.markets)throw Error('종목 목록 형식 오류');
        for(const market of ['KOSPI','KOSDAQ','NYSE','NASDAQ','AMEX','KR_ETC','US_ETC']){const m=d.markets[market];if(!m||!Number.isInteger(m.count)||m.count<0||m.count>20000||!Array.isArray(m.refs)||m.refs.length>50||m.refs.some(ref=>!/^catalog\/[a-f0-9]{64}\.json$/.test(ref)))throw Error('종목 목록 범위 오류');}
        if(s.key!==identity)throw Error('로그인이 변경되었습니다.');lists.clear();manifest=d;loadedAt=now();return d;})();pending=task;try{return await task;}finally{if(pending===task)pending=null;}}
    return {search:async(query,market)=>{if(!currency(market)||name(query).length<2)return {result:[]};const s=await auth(),d=await index(s);
      if(!lists.has(market)){
        if(!loading.has(market)){const task=(async()=>{const rows=[],seen=new Set();for(const ref of d.markets[market].refs){const chunk=await read(s.uid+'/'+ref,ref.slice(8,-5));if(chunk.version!==1||chunk.market!==market||!Array.isArray(chunk.rows)||chunk.rows.length>400)throw Error('종목 목록 조각 오류');for(const row of chunk.rows){if(!row||row.market!==market||row.currency!==currency(market)||!validSymbol(symbol(row.symbol))||typeof row.name!=='string'||!row.name.trim()||row.name.length>200||seen.has(symbol(row.symbol)))throw Error('종목 정보 오류');seen.add(symbol(row.symbol));rows.push(row);}}
          if(rows.length!==d.markets[market].count||s.key!==identity)throw Error('종목 목록이 변경되었습니다.');lists.set(market,rows);return rows;})();loading.set(market,task);task.finally(()=>{if(loading.get(market)===task)loading.delete(market);}).catch(()=>{});}
        await loading.get(market);
      }
      if(s.key!==identity)throw Error('로그인이 변경되었습니다.');return {result:searchCandidates(lists.get(market),query,market),scope:'toss-active',collectedAt:d.collectedAt};}};
  }
  const api={number,symbol,validSymbol,chartColor,name,currency,searchCandidates,positions,resolve,evaluate,summarize,candles,createClient,createCacheClient,createCatalogClient};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HaniMarketData=api;
})(globalThis);
