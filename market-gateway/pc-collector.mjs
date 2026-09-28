// PC-only, no listener or inbound firewall rule. Caller supplies a securely held user session.
import {createGateway} from './server.mjs';
import {createPublisher} from './cache-publisher.mjs';
export function createPcCollector(config,{getAccessToken,fetcher=fetch,now=Date.now}={}){
  const gateway=createGateway(config,{fetcher,now});
  async function token(){const value=await getAccessToken();if(!value)throw Error('HANI sign-in required');return value;}
  async function request(path){let status,result;await gateway({method:'GET',url:path,headers:{origin:config.origin,authorization:'Bearer '+await token()},socket:{remoteAddress:'local-collector'}},
    {writeHead:s=>{status=s;},end:body=>{result=JSON.parse(body);}});if(status!==200)throw Object.assign(Error('Market collection failed'),{httpStatus:status,failureStage:'market-source'});return result;}
  const source={stocks:async codes=>(await request('/v1/stocks?symbols='+encodeURIComponent(codes.join(',')))).result,
    prices:async codes=>(await request('/v1/prices?symbols='+encodeURIComponent(codes.join(',')))).result,
    chart:(code,period)=>request('/v1/chart?symbol='+encodeURIComponent(code)+'&period='+period)};
  async function storageFetch(path,options={}){return fetcher(new URL('/storage/v1/object/'+path,config.supabaseUrl),{...options,
    headers:{apikey:config.supabaseKey,Authorization:'Bearer '+await token(),...options.headers},redirect:'error',signal:AbortSignal.timeout(12000)});}
  const storage={readLatest:async()=>{const r=await storageFetch('authenticated/hani-market-cache/'+config.allowedUserId+'/latest.json?read='+now());
    if(!r.ok){
      const error=await r.json().catch(()=>({}));
      if([400,404].includes(r.status)&&['NoSuchKey','not_found'].includes(error.code||error.error))return null;
      throw Object.assign(Error('Cannot verify last cache; publish stopped'),{httpStatus:r.status,failureStage:'cache-read'});
    }
    const body=await r.text();if(Buffer.byteLength(body)>65536)throw Error('Cache size limit');return JSON.parse(body);},
    upload:async(path,body)=>{const r=await storageFetch('hani-market-cache/'+path,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'true','cache-control':'0'},body});return {error:!r.ok};}};
  return createPublisher({source,storage,userId:config.allowedUserId,now});
}
