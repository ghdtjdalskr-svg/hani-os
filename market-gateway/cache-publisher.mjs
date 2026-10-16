// Single-PC publisher: dependencies are injected; no credentials or account holdings on disk.
import {createHash} from 'node:crypto';
import M from '../hani-market-data.js';
const pick=(r,keys)=>Object.fromEntries(keys.filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
// Weekday approximation in KST; one weekday of slack tolerates a holiday or an unfinished session.
const DAY=86400000,KST=9*3600000;
export function chartIsStale(timestamp,now=Date.now()){
  const stamp=Date.parse(timestamp);if(!Number.isFinite(stamp))return true;
  const day=t=>Math.floor((t+KST)/DAY);
  let latest=day(now);while([0,6].includes(new Date(latest*DAY).getUTCDay()))latest--;
  let lag=0;for(let d=latest;d>day(stamp)&&lag<=1;d--)if(![0,6].includes(new Date(d*DAY).getUTCDay()))lag++;
  return lag>1;
}
export function createPublisher({source,storage,userId,now=Date.now}){
  if(!/^[a-f0-9-]{36}$/.test(userId))throw Error('Authenticated owner required');
  let busy=false,last=0;const uploaded=new Set(),chartTimes=new Map(),chartAttempts=new Map();
  async function upload(path,value,limit,upsert){const body=JSON.stringify(value);if(Buffer.byteLength(body)>limit)throw Error('Cache size limit');
    const {error}=await storage.upload(userId+'/'+path,body,{contentType:'application/json',cacheControl:'0',upsert});if(error)throw Error('Private cache publish failed');}
  return async function publish(values,{chartPeriods=[],onlyMissingCharts=false,requireOhlc=false,maxChartsPerRun=6}={}){
    if(busy)throw Error('Collection already running');if(last&&now()-last<300000)return {skipped:true};
    const codes=[...new Set(values.map(M.symbol))];if(!codes.length||codes.length>200||codes.some(c=>!M.validSymbol(c)))throw Error('Invalid symbols');
    if(chartPeriods.some(p=>!['1D','1W','1M','3M','6M','1Y'].includes(p)))throw Error('Invalid period');
    if(!Number.isInteger(maxChartsPerRun)||maxChartsPerRun<1||maxChartsPerRun>25)throw Error('Invalid chart cap');
    busy=true;try{
      const previous=await storage.readLatest();
      if(previous&&previous.version!==1)throw Error('Unknown cache version');
      const stocks=(await source.stocks(codes)).filter(r=>codes.includes(r.symbol)).map(r=>pick(r,['symbol','name','englishName','market','currency']));
      const quotes=(await source.prices(codes)).filter(r=>codes.includes(r.symbol)).map(r=>pick(r,['symbol','lastPrice','currency','timestamp']));
      if(codes.some(c=>!stocks.some(s=>s.symbol===c&&M.currency(s.market)===s.currency)||!quotes.some(q=>q.symbol===c&&Number(q.lastPrice)>0&&Number.isFinite(Date.parse(q.timestamp))&&Date.parse(q.timestamp)<=now()+60000&&q.currency===stocks.find(s=>s.symbol===c)?.currency)))throw Error('Incomplete market response; last cache preserved');
      if(previous&&(Date.parse(previous.collectedAt)>now()||quotes.some(q=>Date.parse(q.timestamp)<Date.parse(previous.quotes?.find(p=>p.symbol===q.symbol)?.timestamp))))throw Error('Regressed quotes; last cache preserved');
      const charts=Object.fromEntries(Object.entries(previous?.charts||{}).filter(([key,ref])=>codes.includes(key.split('/')[0])&&/^charts\/[a-f0-9]{64}\.json$/.test(ref)));
      const pending=[];
      for(const code of codes){
        const periods=[...new Set([...chartPeriods,...(onlyMissingCharts?Object.keys(charts).filter(k=>k.startsWith(code+'/')&&['1W','1M','3M','6M','1Y'].includes(k.split('/')[1])).map(k=>k.split('/')[1]):[])])];
        for(const period of periods){
          const key=code+'/'+period,ref=charts[key];let previousTime;
          if(onlyMissingCharts&&ref){
            if(!chartTimes.has(ref)){
              const cached=await storage.readChart(ref);
              if(cached.symbol!==code||cached.period!==period||cached.interval!=='1d')continue;
              const rows=M.candles(cached.result);
              if(chartTimes.size>=1200)chartTimes.clear();chartTimes.set(ref,rows.at(-1)?.timestamp||'');
            }
            previousTime=chartTimes.get(ref);if(!chartIsStale(previousTime,now()))continue;
          }
          pending.push({code,period,key,previousTime});
        }
      }
      // Rotate attempts in memory so a holiday-stale symbol cannot monopolize the next capped run.
      if(onlyMissingCharts)pending.sort((a,b)=>(chartAttempts.get(a.key)||0)-(chartAttempts.get(b.key)||0));
      for(const {code,period,key,previousTime} of onlyMissingCharts?pending.slice(0,maxChartsPerRun):pending){
        if(chartAttempts.size>=1200)chartAttempts.clear();chartAttempts.set(key,now());
        const raw=await source.chart(code,period);
        const data={symbol:code,period,interval:raw.interval,adjusted:raw.adjusted,complete:raw.complete===true,result:M.candles(raw.result).map(r=>pick(r,['timestamp','openPrice','highPrice','lowPrice','closePrice','volume','currency']))};
        if(!data.result.length)throw Error('Empty chart; last cache preserved');
        if(previousTime&&Date.parse(data.result.at(-1).timestamp)<Date.parse(previousTime))throw Error('Regressed chart; last cache preserved');
        if(requireOhlc&&data.result.filter(c=>[c.openPrice,c.highPrice,c.lowPrice,c.closePrice].every(v=>Number.isFinite(Number(v))&&Number(v)>0)&&Number(c.lowPrice)<=Math.min(Number(c.openPrice),Number(c.closePrice))&&Number(c.highPrice)>=Math.max(Number(c.openPrice),Number(c.closePrice))).length<2)throw Error('OHLC chart unavailable; last cache preserved');
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
