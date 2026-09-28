// Public SDK contract only. Synthetic credentials; no private cache or user data.
const assert=require('node:assert/strict');
const vm=require('node:vm');
(async()=>{
  const response=await fetch('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  assert.ok(response.ok,'public runtime SDK must be available');
  const code=await response.text();
  const sandbox={exports:{},module:{exports:{}},URL,URLSearchParams,Headers,Request,Response,Blob,AbortController,AbortSignal,TextEncoder,TextDecoder,setTimeout,clearTimeout,setInterval,clearInterval,console,fetch,WebSocket};
  sandbox.exports=sandbox.module.exports;
  vm.runInNewContext(code,sandbox,{timeout:10000});
  const calls=[];
  const sdk=sandbox.supabase||sandbox.module.exports;
  const client=sdk.createClient('https://fixture.supabase.co','synthetic-public-key',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async(url,options)=>{calls.push({url:String(url),options});return new Response('{"version":1}',{status:200,headers:{'content-type':'application/json'}});}}
  });
  const signal=AbortSignal.timeout(12000);
  const result=await client.storage.from('hani-market-cache').download('fixture/latest.json',{cacheNonce:123},{signal,cache:'no-store'});
  assert.equal(result.error,null);
  assert.deepEqual(JSON.parse(await result.data.text()),{version:1});
  assert.equal(calls.length,1);
  const url=new URL(calls[0].url);
  assert.equal(url.pathname,'/storage/v1/object/hani-market-cache/fixture/latest.json');
  assert.equal(url.searchParams.get('cacheNonce'),'123');
  assert.equal(calls[0].options.cache,'no-store');
  assert.equal(calls[0].options.signal,signal);
  assert.equal(calls[0].options.method,'GET');
  console.log('PASS: public runtime SDK private-download GET, nonce, no-store, abort signal, Blob; synthetic credentials only.');
})().catch(error=>{console.error('FAIL: market SDK download contract:',error.message);process.exitCode=1;});
