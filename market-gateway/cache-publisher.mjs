// Single-PC publisher: dependencies are injected; no credentials or account holdings on disk.
import {createHash} from 'node:crypto';
import M from '../hani-market-data.js';
const pick=(r,keys)=>Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
export function createPublisher({source,storage,userId,now=Date.now}){
  if(!/^[a-f0-9-]{36}$/.test(userId))throw Error('Authenticated owner required');
  let busy=false,last=0;const uploaded=new Set();
  async function upload(path,value,limit,upsert){const body=JSON.stringify(value);if(Buffer.byteLength(body)>limit)throw Error('Cache size limit');
    const {error}=await storage.upload(userId+'/'+path,body,{contentType:'application/json',cacheControl:'0',upsert});if(error)throw Error('Private cache publish failed');}
  return async function publish(values,{chartPeriods=[],onlyMissingCharts=false}={}){
    if(busy)throw Error('Collection already running');if(last&&now()-last<300000)return {skipped:true};
    const codes=[...new Set(values.map(M.symbol))];if(!codes.length||codes.length>200||codes.some(c=>!M.validSymbol(c)))throw Error('Invalid symbols');
    if(chartPeriods.some(p=>!['1D','1W','1M','3M','6M','1Y'].includes(p)))throw Error('Invalid period');
    busy=true;try{
      const previous=await storage.readLatest();
      if(previous&&previous.version!==1)throw Error('Unknown cache version');
      const stocks=(await source.stocks(codes)).filter(r=>codes.includes(r.symbol)).map(r=>pick(r,['symbol','name','englishName','market','currency']));
      const quotes=(await source.prices(codes)).filter(r=>codes.includes(r.symbol)).map(r=>pick(r,['symbol','lastPrice','currency','timestamp']));
      if(codes.some(c=>!stocks.some(s=>s.symbol===c&&M.currency(s.market)===s.currency)||!quotes.some(q=>q.symbol===c&&Number(q.lastPrice)>0&&Number.isFinite(Date.parse(q.timestamp))&&Date.parse(q.timestamp)<=now()+60000&&q.currency===stocks.find(s=>s.symbol===c)?.currency)))throw Error('Incomplete market response; last cache preserved');
      if(previous&&(Date.parse(previous.collectedAt)>now()||quotes.some(q=>Date.parse(q.timestamp)<Date.parse(previous.quotes?.find(p=>p.symbol===q.symbol)?.timestamp))))throw Error('Regressed quotes; last cache preserved');
      const charts=Object.fromEntries(Object.entries(previous?.charts||{}).filter(([key,ref])=>codes.includes(key.split('/')[0])&&/^charts\/[a-f0-9]{64}\.json$/.test(ref)));
      for(const code of codes)for(const period of chartPeriods){
        if(onlyMissingCharts&&charts[code+'/'+period])continue;
        const raw=await source.chart(code,period);
        const data={symbol:code,period,interval:raw.interval,adjusted:raw.adjusted,complete:raw.complete===true,result:M.candles(raw.result).map(r=>pick(r,['timestamp','openPrice','highPrice','lowPrice','closePrice','volume','currency']))};
        if(!data.result.length)throw Error('Empty chart; last cache preserved');
        const expectedCurrency=stocks.find(s=>s.symbol===code).currency;
        if(data.result.some(c=>c.currency!==expectedCurrency||Date.parse(c.timestamp)>now()+60000))throw Error('Invalid chart currency or time; last cache preserved');
        const ref='charts/'+createHash('sha256').update(JSON.stringify(data)).digest('hex')+'.json';
        if(!uploaded.has(ref)&&charts[code+'/'+period]!==ref){await upload(ref,data,262144,true);if(uploaded.size>=1200)uploaded.clear();uploaded.add(ref);}charts[code+'/'+period]=ref;
      }
      const snapshot={version:1,collectedAt:new Date(now()).toISOString(),stocks,quotes,charts};
      // Commit pointer last. Any earlier failure leaves last good snapshot available to phones.
      await upload('latest.json',snapshot,65536,true);last=now();return {published:true,symbols:codes.length,bytes:Buffer.byteLength(JSON.stringify(snapshot)),digest:createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')};
    }finally{busy=false;}
  };
}
