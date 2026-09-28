import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPcCollector} from '../market-gateway/pc-collector.mjs';
const uid='11111111-1111-1111-1111-111111111111';
const config={supabaseUrl:'https://project.example',supabaseKey:'public-test-key',allowedUserId:uid,origin:'https://hani.example',clientId:'synthetic-id',clientSecret:'synthetic-secret'};
test('PC collector verifies owner, calls only market endpoints and publishes sanitized private object',async()=>{
  const calls=[],stamp='2026-09-27T01:00:00Z';let body;
  const fetcher=async(url,options)=>{const u=new URL(url);calls.push(u.pathname);let result;
    if(u.pathname==='/auth/v1/user')result={id:uid};
    else if(u.pathname==='/oauth2/token')result={access_token:'provider-only',expires_in:3600};
    else if(u.pathname==='/api/v1/stocks')result={result:[{symbol:'005930',name:'삼성전자',market:'KOSPI',currency:'KRW'}]};
    else if(u.pathname==='/api/v1/prices')result={result:[{symbol:'005930',lastPrice:72000,currency:'KRW',timestamp:stamp}]};
    else if(u.pathname.startsWith('/storage/v1/object/authenticated/'))return new Response('{"code":"NoSuchKey"}',{status:404});
    else if(u.pathname==='/storage/v1/object/hani-market-cache/'+uid+'/latest.json'){body=options.body;assert.equal(options.headers.Authorization,'Bearer synthetic-user');result={};}
    else assert.fail('Unexpected route '+u.pathname);
    return new Response(JSON.stringify(result),{status:200});
  };
  const collect=createPcCollector(config,{getAccessToken:async()=>'synthetic-user',fetcher,now:()=>Date.parse(stamp)});
  assert.equal((await collect(['005930'])).published,true);assert.doesNotMatch(body,/synthetic|provider-only|accountId|quantity/);assert.equal(calls.filter(p=>p==='/auth/v1/user').length,2);
});
test('cache read permission/quota error never becomes an empty overwrite',async()=>{
  let requests=0;const collect=createPcCollector(config,{getAccessToken:async()=>'synthetic-user',fetcher:async()=>{requests++;return new Response('{}',{status:402});}});
  await assert.rejects(collect(['005930']),/Cannot verify/);assert.equal(requests,1);
});
test('first-file legacy 400 not_found proceeds, missing bucket and unknown 404 stop',async()=>{
  for(const [status,body,expectedCalls] of [[400,{error:'not_found'},2],[404,{code:'NoSuchBucket'},1],[404,{},1]]){
    let calls=0;
    const collect=createPcCollector(config,{getAccessToken:async()=>'synthetic-user',fetcher:async()=>{calls++;return calls===1?new Response(JSON.stringify(body),{status}):new Response('{}',{status:401});}});
    await assert.rejects(collect(['005930']));assert.equal(calls,expectedCalls);
  }
});
