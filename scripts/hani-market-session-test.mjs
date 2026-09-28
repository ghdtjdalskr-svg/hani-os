import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSessionManager} from '../market-gateway/session-manager.mjs';
import {trackedSymbols,createPortfolioCollector,runCollectionLoop} from '../market-gateway/portfolio-collector.mjs';
const uid='e1c08077-6c94-4652-b017-3760f42aa1ad',now=Date.parse('2026-09-27T13:00:00Z');
const session={userId:uid,access_token:'old-access',refresh_token:'old-refresh',expires_at:0};
const next={user:{id:uid},access_token:'new-access',refresh_token:'new-refresh',expires_in:3600};
const config={session,url:'https://project.test',key:'public',ownerId:uid,now:()=>now};
test('watch uses five minute success interval and stops after three failures with backoff',async()=>{const events=[true,false,false,false],waits=[];let calls=0;const code=await runCollectionLoop(async()=>({success:events[calls++]}),{watch:true,sleep:async ms=>{waits.push(ms);}});assert.equal(code,1);assert.equal(calls,4);assert.deepEqual(waits,[300000,600000,1200000]);});
test('one-shot never schedules another run',async()=>{assert.equal(await runCollectionLoop(async()=>({success:true}),{sleep:async()=>assert.fail('unexpected wait')}),0);});
test('refresh single-flight verifies owner and persists rotated session once before use',async()=>{let refreshes=0,saves=0;const manager=createSessionManager({...config,fetcher:async url=>{if(url.includes('/token?')){refreshes++;return new Response(JSON.stringify(next));}return new Response(JSON.stringify({id:uid,is_anonymous:false}));},persist:async(s,previous)=>{saves++;assert.equal(previous,'old-refresh');assert.equal(s.refresh_token,'new-refresh');assert.equal(s.expires_at,now/1000+3600);}});assert.deepEqual(await Promise.all([manager.getToken(),manager.getToken()]),['new-access','new-access']);assert.equal(refreshes,1);assert.equal(saves,1);});
test('failed persistence blocks repeated token rotation and owner mismatch never persists',async()=>{let requests=0;const manager=createSessionManager({...config,fetcher:async url=>{requests++;return new Response(JSON.stringify(url.includes('/token?')?next:{id:uid,is_anonymous:false}));},persist:async()=>{throw Error('disk');}});await assert.rejects(manager.getToken(),/persistence/);await assert.rejects(manager.getToken(),/persistence/);assert.equal(requests,2);let saved=false;const wrong=createSessionManager({...config,fetcher:async url=>new Response(JSON.stringify(url.includes('/token?')?next:{id:'wrong',is_anonymous:false})),persist:async()=>{saved=true;}});await assert.rejects(wrong.getToken(),/Owner/);assert.equal(saved,false);});
const state={accounts:[{id:'a',name:'private account'}],instruments:[{id:'s',ticker:'005930'}],investmentBrokerSnapshots:[{mode:'actual',status:'confirmed',period:'2026-09',accounts:[{accountId:'a',enabled:true,holdings:[{instrumentId:'s',ticker:'A005930',quantity:7},{ticker:'005930'},{name:'unknown',evaluationAmount:300000},{instrumentId:'s',ticker:'005935'}]}]}]};
test('diagnostics expose only unresolved names/codes and reason, never account or amounts',()=>{const result=trackedSymbols(state,{diagnose:true});assert.deepEqual(result.exceptions.map(x=>x.reason),['missing-ticker','ticker-conflict']);assert.doesNotMatch(JSON.stringify(result),/private account|quantity|evaluationAmount|300000/);});
test('domestic ETF alphanumeric codes remain collectable and canonicalized',()=>{const sample=structuredClone(state);sample.investmentBrokerSnapshots[0].accounts[0].holdings=['0038A0','0064K0','0046Y0','A0091C0'].map(ticker=>({ticker}));assert.deepEqual(trackedSymbols(sample),{codes:['0038A0','0046Y0','0064K0','0091C0'],unresolved:0,holdingCount:4});});
test('latest holding codes canonicalize, deduplicate and keep unresolved separate without changing state',()=>{const before=JSON.stringify(state);assert.deepEqual(trackedSymbols(state),{codes:['005930'],unresolved:2,holdingCount:4});assert.equal(JSON.stringify(state),before);});
test('portfolio projects investment fields only; provider gets codes, cache has no private holdings',async()=>{
  let saved=null,reads=0;const fetcher=async(url,options)=>{const u=new URL(url);let value;
    if(u.pathname==='/auth/v1/user')value={id:uid,is_anonymous:false};
    else if(u.pathname==='/rest/v1/hani_state'){reads++;assert.equal(options.method,undefined);assert.equal(u.searchParams.get('user_id'),'eq.'+uid);assert.doesNotMatch(u.searchParams.get('select'),/\*/);value=[state];}
    else if(u.pathname==='/oauth2/token')value={access_token:'toss-only',expires_in:3600};
    else if(u.pathname.startsWith('/api/v1/')){assert.equal(u.searchParams.get('symbols'),'005930');assert.equal(options.method,undefined);value={result:u.pathname.endsWith('stocks')?[{symbol:'005930',name:'삼성전자',market:'KOSPI',currency:'KRW'}]:[{symbol:'005930',currency:'KRW',lastPrice:72000,timestamp:new Date(now).toISOString()}]};}
    else if(u.pathname.includes('/object/authenticated/'))return new Response(saved||'{"code":"NoSuchKey"}',{status:saved?200:404});
    else if(u.pathname.includes('/object/hani-market-cache/')){assert.equal(options.method,'POST');saved=options.body;value={};}
    else assert.fail('Unexpected URL');return new Response(JSON.stringify(value));
  };
  const tick=createPortfolioCollector({session:{...session,expires_at:now/1000+3600},toss:{clientId:'test',clientSecret:'test'}},{fetcher,now:()=>now,persistSession:async()=>{assert.fail('Unneeded refresh');}});
  const result=await tick();assert.equal(result.success,true);assert.equal(result.unresolved,2);assert.doesNotMatch(saved,/private account|quantity|evaluationAmount|instrumentId/);await tick();assert.equal(reads,1);
});
