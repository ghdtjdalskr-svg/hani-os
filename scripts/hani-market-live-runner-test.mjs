import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyLiveCache} from '../market-gateway/verify-live-cache.mjs';
const uid='e1c08077-6c94-4652-b017-3760f42aa1ad',now=Date.parse('2026-09-27T10:00:00Z');
const input={session:{userId:uid,expires_at:now/1000+3600,access_token:'synthetic-session'},toss:{clientId:'synthetic-id',clientSecret:'synthetic-secret'}};
test('live runner verifies owner, private publish/readback and anonymous denial without exposing credentials',async()=>{
  let saved=null;const calls=[];
  const fetcher=async(url,options)=>{const u=new URL(url);calls.push(u.pathname);let value;
    if(u.pathname==='/auth/v1/user')value={id:uid,is_anonymous:false};
    else if(u.pathname==='/oauth2/token')value={access_token:'synthetic-provider',expires_in:3600};
    else if(u.pathname==='/api/v1/stocks')value={result:[{symbol:'005930',name:'삼성전자',market:'KOSPI',currency:'KRW'},{symbol:'AAPL',name:'Apple',market:'NASDAQ',currency:'USD'}]};
    else if(u.pathname==='/api/v1/prices')value={result:[{symbol:'005930',lastPrice:72000,currency:'KRW',timestamp:new Date(now).toISOString()},{symbol:'AAPL',lastPrice:200,currency:'USD',timestamp:new Date(now).toISOString()}]};
    else if(u.pathname.includes('/storage/v1/object/authenticated/')){if(!options.headers.Authorization)return new Response('{}',{status:403});return new Response(saved||'{"code":"NoSuchKey"}',{status:saved?200:404});}
    else if(u.pathname.includes('/storage/v1/object/hani-market-cache/')){saved=options.body;value={};}
    else assert.fail('Unexpected route');return new Response(JSON.stringify(value));
  };
  const result=await verifyLiveCache(input,{fetcher,now:()=>now});assert.equal(result.success,true);assert.equal(result.anonymousDenied,true);
  assert.doesNotMatch(JSON.stringify(result),/synthetic|clientSecret|access_token/);assert.doesNotMatch(saved,/synthetic|quantity|accountId/);
});
test('expired session stops before network, wrong user before write, quota error stops before Toss',async()=>{
  let calls=0;const fetcher=async()=>{calls++;return new Response(JSON.stringify({id:'wrong',is_anonymous:false}));};
  assert.equal((await verifyLiveCache({...input,session:{...input.session,expires_at:0}},{fetcher,now:()=>now})).success,false);assert.equal(calls,0);
  assert.equal((await verifyLiveCache(input,{fetcher,now:()=>now})).stage,'session');assert.equal(calls,1);
  const quota=await verifyLiveCache(input,{now:()=>now,fetcher:async url=>new URL(url).pathname==='/auth/v1/user'?new Response(JSON.stringify({id:uid,is_anonymous:false})):new Response('{}',{status:402})});
  assert.equal(quota.stage,'cache-precheck');assert.equal(quota.httpStatus,402);assert.equal(quota.published,false);
});
