import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chartIsStale,createPublisher} from '../market-gateway/cache-publisher.mjs';
import {createPcCollector} from '../market-gateway/pc-collector.mjs';
import {createPortfolioCollector} from '../market-gateway/portfolio-collector.mjs';
const uid='e1c08077-6c94-4652-b017-3760f42aa1ad';
const at=date=>Date.parse(date+'T07:00:00Z');
const row=date=>({timestamp:new Date(at(date)).toISOString(),openPrice:90,highPrice:110,lowPrice:80,closePrice:100,volume:10,currency:'KRW'});
const chart=(code,period,date)=>({symbol:code,period,interval:period==='1D'?'1m':'1d',adjusted:false,complete:true,result:[row(date)]});
test('KST weekdays: one day slack, weekends and a single weekday holiday are tolerated',()=>{
  for(const [last,now,expected] of [['2026-10-15','2026-10-16',false],['2026-10-14','2026-10-16',true],['2026-10-16','2026-10-17',false],['2026-10-16','2026-10-18',false],['2026-10-16','2026-10-19',false],['2026-10-16','2026-10-20',true],['2026-10-08','2026-10-09',false],['2026-09-30','2026-10-15',true]])assert.equal(chartIsStale(new Date(at(last)).toISOString(),at(now)),expected,last+' -> '+now);
  assert.equal(chartIsStale('2026-10-14T07:00:00Z',Date.parse('2026-10-15T14:59:59Z')),false);
  assert.equal(chartIsStale('2026-10-14T07:00:00Z',Date.parse('2026-10-15T15:00:00Z')),true);
  assert.equal(chartIsStale('bad date',at('2026-10-16')),true);
});
function fixture(count=1){
  let clock=at('2026-10-16'),chartDate='2026-10-15',fail=false;const files=new Map(),calls=[];
  const codes=Array.from({length:count},(_,i)=>String(360750+i)),stocks=codes.map(symbol=>({symbol,market:'KOSPI',currency:'KRW'}));
  const storage={readLatest:async()=>JSON.parse(files.get(uid+'/latest.json')||'null'),readChart:async ref=>JSON.parse(files.get(uid+'/'+ref)),upload:async(path,body)=>{if(fail)return {error:true};files.set(path,body);return {}}};
  const source={stocks:async()=>stocks,prices:async()=>codes.map(symbol=>({symbol,lastPrice:100,currency:'KRW',timestamp:new Date(clock).toISOString()})),chart:async(code,period)=>{calls.push(code+'/'+period);return chart(code,period,chartDate)}};
  const saveChart=(code,period,date)=>{const data=chart(code,period,date),body=JSON.stringify(data),ref='charts/'+createHash('sha256').update(body).digest('hex')+'.json';files.set(uid+'/'+ref,body);return ref};
  const seed=(date,periods=['1M'])=>{const charts={};for(const code of codes)for(const p of periods)charts[code+'/'+p]=saveChart(code,p,date);files.set(uid+'/latest.json',JSON.stringify({version:1,collectedAt:new Date(clock-300001).toISOString(),stocks,quotes:[],charts}));return JSON.parse(files.get(uid+'/latest.json'))};
  const publish=createPublisher({source,storage,userId:uid,now:()=>clock});return {files,source,storage,codes,calls,publish,seed,saveChart,now:()=>clock,tick:()=>clock+=300001,setDate:d=>chartDate=d,fail:()=>fail=true,latest:()=>JSON.parse(files.get(uid+'/latest.json'))};
}
test('existing stale daily refs refresh across all cached periods, preserving hash format and old objects',async()=>{
  const f=fixture(),old=f.seed('2026-09-30',['1D','1W','1M','3M','6M','1Y']);await f.publish(f.codes,{chartPeriods:['1M'],onlyMissingCharts:true});assert.equal(f.calls.length,5);assert.ok(!f.calls.some(x=>x.endsWith('/1D')));
  for(const key of f.calls){const ref=f.latest().charts[key];assert.match(ref,/^charts\/[a-f0-9]{64}\.json$/);assert.notEqual(ref,old.charts[key]);assert.ok(f.files.has(uid+'/'+old.charts[key]));const body=f.files.get(uid+'/'+ref);assert.equal(createHash('sha256').update(body).digest('hex'),ref.slice(7,-5));assert.equal(JSON.parse(body).result.at(-1).timestamp,row('2026-10-15').timestamp)}
});
test('fresh refs are reused without provider chart requests or new immutable objects',async()=>{const f=fixture(),old=f.seed('2026-10-15');const size=f.files.size;await f.publish(f.codes,{chartPeriods:['1M'],onlyMissingCharts:true});assert.deepEqual(f.calls,[]);assert.deepEqual(f.latest().charts,old.charts);assert.equal(f.files.size,size)});
test('automatic refresh cap bounds missing + stale requests; subsequent runs rotate without starvation',async()=>{
  const f=fixture(8),old=f.seed('2026-09-30');f.setDate('2026-09-30');await f.publish(f.codes,{chartPeriods:['1M'],onlyMissingCharts:true});assert.equal(f.calls.length,6);f.tick();await f.publish(f.codes,{chartPeriods:['1M'],onlyMissingCharts:true});assert.equal(f.calls.length,12);assert.equal(new Set(f.calls).size,8);assert.deepEqual(f.latest().charts,old.charts);
  const missing=fixture(8);await missing.publish(missing.codes,{chartPeriods:['1M'],onlyMissingCharts:true,maxChartsPerRun:2});assert.equal(missing.calls.length,2);assert.equal(Object.keys(missing.latest().charts).length,2);
  for(const cap of [0,-1,26,1.5]){const invalid=fixture();await assert.rejects(invalid.publish(invalid.codes,{maxChartsPerRun:cap}),/Invalid chart cap/)}
});
test('unchanged holiday candles keep their exact hash; no synthetic candle is appended',async()=>{const f=fixture(),old=f.seed('2026-09-30');f.setDate('2026-09-30');const size=f.files.size;await f.publish(f.codes,{chartPeriods:['1M'],onlyMissingCharts:true});assert.equal(f.calls.length,1);assert.deepEqual(f.latest().charts,old.charts);assert.equal(f.files.size,size)});
test('failed reads/provider/upload and regressed candles preserve the last good pointer',async()=>{
  for(const mode of ['read','provider','upload','regress']){const f=fixture();f.seed('2026-09-30');const old=f.files.get(uid+'/latest.json');if(mode==='read')f.storage.readChart=async()=>{throw Error('read failed')};if(mode==='provider')f.source.chart=async()=>{throw Error('rate limit')};if(mode==='upload')f.fail();if(mode==='regress')f.setDate('2026-09-29');await assert.rejects(f.publish(f.codes,{chartPeriods:['1M'],onlyMissingCharts:true}));assert.equal(f.files.get(uid+'/latest.json'),old)}
});
test('PC chart read verifies the content hash before trusting cached candle timestamps',async()=>{
  const f=fixture(),old=f.seed('2026-09-30');const ref=old.charts[f.codes[0]+'/1M'];let providerCalls=0;
  const fetcher=async url=>{const p=new URL(url).pathname;if(p.endsWith('latest.json'))return new Response(f.files.get(uid+'/latest.json'));if(p.endsWith(ref))return new Response(JSON.stringify(chart(f.codes[0],'1M','2026-10-15')));if(p==='/auth/v1/user')return new Response(JSON.stringify({id:uid}));if(p==='/oauth2/token')return new Response(JSON.stringify({access_token:'fixture',expires_in:3600}));providerCalls++;return new Response(JSON.stringify({result:p.endsWith('stocks')?[{symbol:f.codes[0],market:'KOSPI',currency:'KRW'}]:[{symbol:f.codes[0],lastPrice:100,currency:'KRW',timestamp:new Date(f.now()).toISOString()}]}))};
  const collect=createPcCollector({supabaseUrl:'https://cache.example.test',supabaseKey:'public',allowedUserId:uid,origin:'https://app.example.test',clientId:'fixture',clientSecret:'fixture'},{getAccessToken:async()=>'fixture',fetcher,now:f.now});await assert.rejects(collect(f.codes,{chartPeriods:['1M'],onlyMissingCharts:true}),/hash mismatch/);assert.equal(providerCalls,2);
});
test('default portfolio/watch tick reaches stale chart refresh and authenticated read-back',async()=>{
  const f=fixture();f.seed('2026-09-30');const endpoints=[];
  const fetcher=async(url,options={})=>{const u=new URL(url),p=u.pathname;endpoints.push(p);let value;
    if(p==='/auth/v1/user')value={id:uid,is_anonymous:false};
    else if(p==='/rest/v1/hani_state')value=[{accounts:[{id:'a'}],investmentBrokerSnapshots:[{mode:'actual',status:'confirmed',period:'2026-10',accounts:[{accountId:'a',enabled:true,holdings:[{ticker:f.codes[0],quantity:1}]}]}]}];
    else if(p==='/oauth2/token')value={access_token:'fixture',expires_in:3600};
    else if(p==='/api/v1/stocks')value={result:[{symbol:f.codes[0],market:'KOSPI',currency:'KRW'}]};
    else if(p==='/api/v1/prices')value={result:[{symbol:f.codes[0],lastPrice:100,currency:'KRW',timestamp:new Date(f.now()).toISOString()}]};
    else if(p==='/api/v1/candles')value={result:{candles:[row('2026-10-15')]}};
    else if(p.includes('/object/authenticated/'))return new Response(f.files.get(uid+'/'+p.split(uid+'/')[1])||'{}');
    else if(p.includes('/object/hani-market-cache/')){f.files.set(uid+'/'+p.split(uid+'/')[1],options.body);value={}}else assert.fail('unexpected endpoint');
    return new Response(JSON.stringify(value));
  };
  const tick=createPortfolioCollector({session:{userId:uid,access_token:'fixture',refresh_token:'fixture-refresh',expires_at:f.now()/1000+3600},toss:{clientId:'fixture',clientSecret:'fixture'}},{fetcher,now:f.now,persistSession:async()=>assert.fail('unexpected rotation')});
  const result=await tick();assert.equal(result.success,true,JSON.stringify(result));assert.equal(result.readBack,true);assert.equal(result.chartCount,1);assert.equal(endpoints.filter(p=>p==='/api/v1/candles').length,1);
});
