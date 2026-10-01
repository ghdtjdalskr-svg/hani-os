import {test} from 'node:test';
import assert from 'node:assert/strict';
import M from '../hani-market-data.js';
import {createPublisher} from '../market-gateway/cache-publisher.mjs';
const uid='11111111-1111-1111-1111-111111111111',time=Date.parse('2026-09-27T01:00:00Z');
const stocks=[{symbol:'005930',name:'삼성전자',currency:'KRW',market:'KOSPI',accountId:'must-not-leak'}];
const quotes=[{symbol:'005930',lastPrice:72000,currency:'KRW',timestamp:new Date(time).toISOString(),quantity:99}];
function fixture(){let clock=time,calls=0,fail=false;const files=new Map();
  const source={stocks:async()=>stocks,prices:async()=>quotes,chart:async(_c,p)=>({result:[{timestamp:new Date(time).toISOString(),closePrice:72000,currency:'KRW'}],period:p,adjusted:false,interval:'1d',complete:true})};
  const storage={readLatest:async()=>JSON.parse(files.get(uid+'/latest.json')||'null'),upload:async(path,body)=>{if(fail)return {error:true};files.set(path,body);return {};}};
  const publish=createPublisher({source,storage,userId:uid,now:()=>clock});
  const getSession=async()=>({user:{id:uid},access_token:'synthetic'});
  const download=async path=>{calls++;if(!files.has(path))throw Error('missing');return new Blob([files.get(path)]);};
  return {files,source,publish,getSession,download,client:()=>M.createCacheClient({getSession,download,now:()=>clock}),tick:n=>clock+=n,calls:()=>calls,fail:()=>fail=true};
}
test('cold phone reads last published prices without PC, with original timestamps',async()=>{const f=fixture();await f.publish(['A005930'],{chartPeriods:['1M']});f.tick(86400000);const c=f.client();assert.equal((await c.prices(['005930']))[0].timestamp,quotes[0].timestamp);assert.equal(c.info().collectedAt,quotes[0].timestamp);assert.equal((await c.chart('005930','1M')).result.length,1);});
test('only market fields published; prices and lazy chart transfer are separate',async()=>{const f=fixture();await f.publish(['005930'],{chartPeriods:['1M']});const c=f.client();await c.stocks(['005930']);await c.prices(['005930']);c.clear();await c.prices(['005930']);assert.equal(f.calls(),1);const text=f.files.get(uid+'/latest.json');assert.doesNotMatch(text,/accountId|quantity|closePrice/);await c.chart('005930','1M');await c.chart('005930','1M');assert.equal(f.calls(),2);});
test('partial source or failed publish cannot replace last good latest',async()=>{const f=fixture();await f.publish(['005930']);const good=f.files.get(uid+'/latest.json');f.tick(300001);f.source.prices=async()=>[];await assert.rejects(f.publish(['005930']),/Incomplete/);assert.equal(f.files.get(uid+'/latest.json'),good);f.source.prices=async()=>quotes;f.fail();await assert.rejects(f.publish(['005930']),/publish failed/);assert.equal(f.files.get(uid+'/latest.json'),good);});
test('invalid, future, regressed, oversized and traversal data fail closed',async()=>{const f=fixture();await f.publish(['005930']);const c=f.client();await c.prices(['005930']);const good=JSON.parse(f.files.get(uid+'/latest.json'));for(const value of [{...good,version:2},{...good,collectedAt:'2100-01-01'},{...good,collectedAt:'2020-01-01'},{...good,extra:'x'.repeat(65536)}]){f.tick(300001);f.files.set(uid+'/latest.json',JSON.stringify(value));await assert.rejects(c.prices(['005930']));}f.files.set(uid+'/latest.json',JSON.stringify({...good,charts:{'005930/1M':'../other.json'}}));await assert.rejects(c.chart('005930','1M'));});
test('auth change and signout never reuse another session cache',async()=>{const f=fixture();await f.publish(['005930']);let s=await f.getSession();const c=M.createCacheClient({getSession:async()=>s,download:f.download,now:()=>time});await c.prices(['005930']);s=null;await assert.rejects(c.prices(['005930']),/로그인/);assert.equal(c.info(),null);s={user:{id:'22222222-2222-2222-2222-222222222222'},access_token:'other'};await assert.rejects(c.prices(['005930']),/missing/);});
test('publish minimum interval prevents repeated transfer',async()=>{const f=fixture();await f.publish(['005930']);assert.deepEqual(await f.publish(['005930']),{skipped:true});});
test('chart seed repeated invocation reuses existing immutable objects without new chart requests',async()=>{const f=fixture();await f.publish(['005930'],{chartPeriods:['1M'],onlyMissingCharts:true});const count=f.files.size;f.tick(300001);f.source.chart=async()=>{assert.fail('chart recollected');};await f.publish(['005930'],{chartPeriods:['1M'],onlyMissingCharts:true});assert.equal(f.files.size,count);});
test('foreign currency and future chart rows cannot replace last good snapshot',async()=>{const f=fixture();await f.publish(['005930']);const good=f.files.get(uid+'/latest.json');for(const row of [{timestamp:quotes[0].timestamp,closePrice:123,currency:'USD'},{timestamp:'2100-01-01',closePrice:123,currency:'KRW'}]){f.tick(300001);f.source.chart=async()=>({result:[row]});await assert.rejects(f.publish(['005930'],{chartPeriods:['1M']}),/Invalid chart/);assert.equal(f.files.get(uid+'/latest.json'),good);}});
test('price-only cycle retains lazy chart references and rejects older quotes',async()=>{const f=fixture();await f.publish(['005930'],{chartPeriods:['1M']});const refs=JSON.parse(f.files.get(uid+'/latest.json')).charts;f.tick(300001);await f.publish(['005930']);assert.deepEqual(JSON.parse(f.files.get(uid+'/latest.json')).charts,refs);f.tick(300001);f.source.prices=async()=>[{...quotes[0],timestamp:'2020-01-01'}];await assert.rejects(f.publish(['005930']),/Regressed/);});
test('OHLCV survives publisher and reader without leaking holdings; old chart remains recoverable',async()=>{
  const f=fixture();await f.publish(['005930'],{chartPeriods:['1M']});
  const old=JSON.parse(f.files.get(uid+'/latest.json')),oldRef=old.charts['005930/1M'];
  f.tick(300001);const candle={timestamp:quotes[0].timestamp,openPrice:'71000',highPrice:'73000',lowPrice:'70000',closePrice:72000,volume:'0',currency:'KRW',quantity:99,accountId:'private'};
  f.source.chart=async()=>({result:[candle],interval:'1d',adjusted:false,complete:true});
  await f.publish(['005930'],{chartPeriods:['1M']});
  const next=JSON.parse(f.files.get(uid+'/latest.json'));assert.notEqual(next.charts['005930/1M'],oldRef);assert.ok(f.files.has(uid+'/'+oldRef));
  const row=(await f.client().chart('005930','1M')).result[0];assert.equal(row.openPrice,'71000');assert.equal(row.highPrice,'73000');assert.equal(row.lowPrice,'70000');assert.equal(row.volume,'0');assert.equal(row.quantity,undefined);assert.equal(row.accountId,undefined);
  const good=f.files.get(uid+'/latest.json');f.tick(300001);f.source.chart=async()=>({result:Array.from({length:2000},(_,i)=>({...candle,timestamp:new Date(time-i*86400000).toISOString()}))});
  await assert.rejects(f.publish(['005930'],{chartPeriods:['1M']}),/size limit/);assert.equal(f.files.get(uid+'/latest.json'),good);
});
test('explicit multi-period refresh replaces close-only refs and retains old immutable charts',async()=>{
  const f=fixture();await f.publish(['005930'],{chartPeriods:['1M']});
  const old=JSON.parse(f.files.get(uid+'/latest.json')),oldRef=old.charts['005930/1M'];f.tick(300001);
  f.source.chart=async(_code,period)=>({period,interval:period==='1D'?'1m':'1d',adjusted:false,complete:true,result:[0,1].map(i=>({timestamp:new Date(time-i*86400000).toISOString(),openPrice:71000,highPrice:73000,lowPrice:70000,closePrice:72000,volume:100,currency:'KRW'}))});
  const periods=['1D','1W','1M','3M','6M','1Y'];await f.publish(['005930'],{chartPeriods:periods,requireOhlc:true});
  const next=JSON.parse(f.files.get(uid+'/latest.json'));assert.notEqual(next.charts['005930/1M'],oldRef);assert.ok(f.files.has(uid+'/'+oldRef));
  for(const period of periods){assert.match(next.charts['005930/'+period],/^charts\/[a-f0-9]{64}\.json$/);assert.equal((await f.client().chart('005930',period)).result.length,2);}
});
test('explicit refresh with close-only candles cannot replace last good pointer',async()=>{
  const f=fixture();await f.publish(['005930'],{chartPeriods:['1M']});const good=f.files.get(uid+'/latest.json');f.tick(300001);
  await assert.rejects(f.publish(['005930'],{chartPeriods:['1M'],requireOhlc:true}),/OHLC chart unavailable/);
  assert.equal(f.files.get(uid+'/latest.json'),good);
});
