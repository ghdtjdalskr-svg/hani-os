// One-shot diagnostic. Secrets arrive only on a redirected private stdin pipe, never argv/env/logs.
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createPcCollector} from './pc-collector.mjs';
const url='https://qmgikfdwjzmhkwadycxk.supabase.co';
const key='sb_publishable_Z0YkkRSJIo5hs00YNcMOdQ__PA5BAj5';
const uid='e1c08077-6c94-4652-b017-3760f42aa1ad';
export async function verifyLiveCache(input,{fetcher=fetch,now=Date.now}={}) {
  let stage='session',published=false;
  const statusError=status=>Object.assign(Error('Request failed'),{httpStatus:status});
  try {
    if(input?.session?.userId!==uid||input.session.expires_at*1000<now()+120000||!input.session.access_token||!input.toss?.clientId||!input.toss.clientSecret)throw Error('Invalid or expiring session');
    const headers={apikey:key,Authorization:'Bearer '+input.session.access_token};
    const read=async(path,auth=true)=>{const r=await fetcher(url+path,{headers:auth?headers:{apikey:key},redirect:'error',signal:AbortSignal.timeout(12000),cache:'no-store'});return r;};
    const userResponse=await read('/auth/v1/user');if(!userResponse.ok)throw statusError(userResponse.status);
    const user=await userResponse.json();if(user.id!==uid||user.is_anonymous!==false)throw Error('Owner mismatch');
    const objectPath='/storage/v1/object/authenticated/hani-market-cache/'+uid+'/latest.json';
    stage='cache-precheck';const previous=await read(objectPath);
    if(previous.ok){const text=await previous.text();if(Buffer.byteLength(text)>65536)throw Error('Oversized previous cache');const data=JSON.parse(text);
      if(data.stocks?.some(s=>!['005930','AAPL'].includes(s.symbol)))throw Error('Existing symbol set would shrink');
    } else if(previous.status!==404&&previous.status!==400)throw statusError(previous.status);
    stage='collect-publish';
    const collect=createPcCollector({supabaseUrl:url,supabaseKey:key,allowedUserId:uid,origin:'https://ghdtjdalskr-svg.github.io',clientId:input.toss.clientId,clientSecret:input.toss.clientSecret},{getAccessToken:async()=>input.session.access_token,fetcher,now});
    const result=await collect(['005930','AAPL']);published=result.published===true;
    stage='read-back';const response=await read(objectPath);if(!response.ok)throw statusError(response.status);
    const body=await response.text();if(Buffer.byteLength(body)>65536||createHash('sha256').update(body).digest('hex')!==result.digest)throw Error('Read-back differs');
    const data=JSON.parse(body);if(data.quotes.length!==2||data.quotes.find(q=>q.symbol==='005930')?.currency!=='KRW'||data.quotes.find(q=>q.symbol==='AAPL')?.currency!=='USD')throw Error('Currency mismatch');
    stage='anonymous-denial';const denied=await read(objectPath,false);if(![400,401,403,404].includes(denied.status))throw statusError(denied.status);
    return {success:true,published:true,readBack:true,anonymousDenied:true,symbols:['005930','AAPL'],bytes:result.bytes,collectedAt:data.collectedAt,quoteTimes:data.quotes.map(q=>({symbol:q.symbol,timestamp:q.timestamp}))};
  } catch(e) { return {success:false,stage,published,...(Number.isInteger(e.httpStatus)?{httpStatus:e.httpStatus}:{}),...(['market-source','cache-read'].includes(e.failureStage)?{failureStage:e.failureStage}:{})}; }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try {let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>65536)throw Error('Input too large');}
    const input=JSON.parse(raw);raw='';const result=await verifyLiveCache(input);input.toss=null;input.session=null;
    process.stdout.write(JSON.stringify(result));process.exitCode=result.success?0:1;
  } catch {process.stdout.write(JSON.stringify({success:false,stage:'private-input'}));process.exitCode=1;}
}
