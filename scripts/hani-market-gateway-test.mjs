import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGateway} from '../market-gateway/server.mjs';
const config={supabaseUrl:'https://auth.example',supabaseKey:'test-publishable',allowedUserId:'owner',origin:'https://hani.example',clientId:'test-client',clientSecret:'test-secret'};
function fixture({user={id:'owner'},fail=false,rate=false}={}){
  const calls=[];let page=0;
  const handler=createGateway(config,{now:()=>Date.parse('2026-09-27T03:00:00Z'),fetcher:async(url,options)=>{
    const u=new URL(url);calls.push({url:u,options});const reply=(data,status=200)=>({ok:status===200,status,headers:new Headers(),json:async()=>data});
    if(u.hostname==='auth.example')return reply(user);
    if(u.pathname==='/oauth2/token')return reply({access_token:'provider-only',expires_in:86400});
    if(rate)return reply({},429);if(fail)throw Error('sensitive upstream failure');
    if(u.pathname==='/api/v1/candles'){page++;return reply({result:page===1?{candles:[{timestamp:'2026-09-26T00:00:00+09:00',closePrice:'72000',currency:'KRW'}],nextBefore:'2026-09-25T00:00:00+09:00'}:{candles:[{timestamp:'2026-09-25T00:00:00+09:00',closePrice:'71000',currency:'KRW'}],nextBefore:null}});}
    if(u.pathname==='/api/v1/stocks/all')return reply({result:[{symbol:'005935',name:'삼성전자우',isinCode:'KR7005931001'}]});
    return reply({result:[{symbol:'005930',name:'삼성전자',lastPrice:'72000',currency:'KRW',market:'KOSPI',private:'must-not-leak'}]});
  }});
  const request=async(path='/v1/prices?symbols=005930',extra={})=>{let status,body,headers;const req={url:path,method:'GET',socket:{remoteAddress:'test'},headers:{origin:config.origin,authorization:'Bearer hani-session'},...extra};await handler(req,{writeHead:(s,h)=>{status=s;headers=h;},end:b=>{body=b?JSON.parse(b):null;}});return {status,body,headers};};return {request,calls};
}
test('fail closed on missing configuration',()=>assert.throws(()=>createGateway({})));
test('CORS is not authorization; missing token and wrong owner denied before Toss',async()=>{const a=fixture();assert.equal((await a.request(undefined,{headers:{origin:config.origin}})).status,401);assert.equal(a.calls.length,0);const b=fixture({user:{id:'other'}});assert.equal((await b.request()).status,403);assert.equal(b.calls.some(c=>c.url.hostname.includes('toss')),false);const c=fixture({user:{id:'owner',is_anonymous:true}});assert.equal((await c.request()).status,403);});
test('only allowlisted GET endpoints; no proxy/order routes',async()=>{const f=fixture();assert.equal((await f.request('/v1/orders')).status,404);assert.equal((await f.request(undefined,{method:'POST'})).status,405);assert.equal((await f.request(undefined,{headers:{origin:'https://evil.example'}})).status,403);assert.equal(f.calls.length,0);});
test('server token stays server-side, data sanitized, batch cache shared',async()=>{const f=fixture();const a=await f.request(),b=await f.request();assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(JSON.stringify(a.body).includes('provider-only'),false);assert.equal(JSON.stringify(a.body).includes('must-not-leak'),false);assert.equal(f.calls.filter(c=>c.url.pathname==='/oauth2/token').length,1);assert.equal(f.calls.filter(c=>c.url.pathname==='/api/v1/prices').length,1);assert.equal(f.calls.filter(c=>c.url.pathname==='/auth/v1/user').length,2);});
test('invalid symbols and periods denied',async()=>{const f=fixture();assert.equal((await f.request('/v1/prices?symbols=../orders')).status,400);assert.equal((await f.request('/v1/chart?symbol=005930&period=ALL')).status,400);});
test('chart pagination has encoded offset and returns chronological bounded prices',async()=>{const f=fixture(),r=await f.request('/v1/chart?symbol=005930&period=1Y');assert.equal(r.status,200);assert.equal(r.body.result.length,2);assert.equal(r.body.result[0].closePrice,71000);assert.equal(r.body.adjusted,false);assert.equal(r.body.complete,true);assert.ok(f.calls.find(c=>c.url.searchParams.has('before')).url.href.includes('%2B09%3A00'));});
test('name search is normalized and read only',async()=>{const f=fixture(),r=await f.request('/v1/search?market=KOSPI&q='+encodeURIComponent('삼성전자 우'));assert.equal(r.status,200);assert.equal(r.body.result[0].symbol,'005935');});
test('upstream errors do not leak secrets and rate limit is honored',async()=>{const f=fixture({fail:true}),r=await f.request();assert.equal(r.status,502);assert.equal(JSON.stringify(r.body).includes('sensitive'),false);const g=fixture({rate:true});assert.equal((await g.request()).status,429);assert.equal((await g.request()).status,429);assert.equal(g.calls.filter(c=>c.url.pathname==='/api/v1/prices').length,1);});
