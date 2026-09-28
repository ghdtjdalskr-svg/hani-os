import {createGateway} from './server.mjs';
import {createSessionManager} from './session-manager.mjs';
import {persist} from './portfolio-collector.mjs';
import {markets,publishCatalog} from './catalog-publisher.mjs';
import {setTimeout as delay} from 'node:timers/promises';
const url='https://qmgikfdwjzmhkwadycxk.supabase.co',key='sb_publishable_Z0YkkRSJIo5hs00YNcMOdQ__PA5BAj5',uid='e1c08077-6c94-4652-b017-3760f42aa1ad';
let stage='private-input';
try{
  let raw='';for await(const part of process.stdin){raw+=part;if(Buffer.byteLength(raw)>65536)throw Error('limit');}const input=JSON.parse(raw);raw='';
  const session=createSessionManager({session:input.session,url,key,ownerId:uid,persist});stage='session';await session.verify();
  const gateway=createGateway({supabaseUrl:url,supabaseKey:key,allowedUserId:uid,origin:'https://ghdtjdalskr-svg.github.io',clientId:input.toss.clientId,clientSecret:input.toss.clientSecret});
  async function read(ref,missing=false){
    const r=await fetch(url+'/storage/v1/object/authenticated/hani-market-cache/'+uid+'/'+ref+'?check='+Date.now(),{headers:{apikey:key,Authorization:'Bearer '+await session.getToken()},redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!r.ok){const e=await r.json().catch(()=>({}));if(missing&&[400,404].includes(r.status)&&['NoSuchKey','not_found'].includes(e.code||e.error))return null;throw Error('Read failed '+r.status);}
    const body=await r.text();if(Buffer.byteLength(body)>262144)throw Error('limit');return body;
  }
  const storage={readIndex:async()=>{const body=await read('catalog/index.json',true);return body?JSON.parse(body):null;},read,
    put:async(ref,body)=>{const r=await fetch(url+'/storage/v1/object/hani-market-cache/'+uid+'/'+ref,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+await session.getToken(),'Content-Type':'application/json','x-upsert':'true','cache-control':'0'},body,redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Publish failed');}};
  stage='catalog-publish';const result=await publishCatalog({storage,lists:async()=>{const lists={};for(const market of markets){if(Object.keys(lists).length)await delay(1100);let status,data;stage='source-'+market;await gateway({method:'GET',url:'/v1/catalog?market='+market,headers:{origin:'https://ghdtjdalskr-svg.github.io',authorization:'Bearer '+await session.getToken()},socket:{remoteAddress:'catalog-pc'}},{writeHead:s=>status=s,end:b=>data=JSON.parse(b)});if(status!==200)throw Error('Source failed '+status);lists[market]=data.result;}stage='catalog-publish';return lists;}});
  process.stdout.write(JSON.stringify(result)+'\n');
}catch(e){const reason=/^(Invalid catalog|Invalid catalog row [A-Z_]+ (symbol|duplicate|market|currency|name) [A-Z0-9.??-]{0,20}|Invalid previous catalog|Catalog.*|Source failed \d{3}|Publish failed|Read failed \d{3}|limit)$/.test(e.message)?e.message:'operation-failed';process.stdout.write(JSON.stringify({success:false,stage,reason})+'\n');process.exitCode=1;}
