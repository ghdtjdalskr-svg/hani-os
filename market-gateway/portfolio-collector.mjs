import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import M from '../hani-market-data.js';
import {createSessionManager} from './session-manager.mjs';
import {createPcCollector} from './pc-collector.mjs';
const url='https://qmgikfdwjzmhkwadycxk.supabase.co',key='sb_publishable_Z0YkkRSJIo5hs00YNcMOdQ__PA5BAj5',uid='e1c08077-6c94-4652-b017-3760f42aa1ad';
export function trackedSymbols(state,{diagnose=false}={}){
  const rows=M.positions(state),codes=new Set(),exceptions=[];let unresolved=0;
  function reject(p,raw,canonical,reason){unresolved++;if(diagnose)exceptions.push({name:String(p.rawName||p.name||'').slice(0,100),rawTicker:raw.slice(0,32),masterTicker:canonical.slice(0,32),reason});}
  for(const p of rows){const master=(state.instruments||[]).find(i=>i.id===p.instrumentId),raw=M.symbol(p.ticker),canonical=M.symbol(master?.ticker);
    if(raw&&canonical&&raw!==canonical){reject(p,raw,canonical,'ticker-conflict');continue;}
    const code=raw||canonical;if(M.validSymbol(code))codes.add(code);else reject(p,raw,canonical,code?'invalid-ticker':'missing-ticker');
  }
  return {codes:[...codes].sort(),unresolved,holdingCount:rows.length,...(diagnose?{exceptions}: {})};
}
export function persist(session,previousRefreshToken){return new Promise((resolve,reject)=>{
  const child=spawn(process.env.HANI_MARKET_PWSH||'pwsh',['-NoProfile','-File',fileURLToPath(new URL('./save-session-private.ps1',import.meta.url))],{stdio:['pipe','pipe','pipe'],windowsHide:true});let result='';
  const timeout=setTimeout(()=>{child.kill();reject(Error('Session save timeout'));},15000);
  child.stdout.on('data',d=>{result+=d;if(result.length>128)child.kill();});child.stderr.resume();child.stdin.on('error',()=>{});
  child.on('error',()=>{clearTimeout(timeout);reject(Error('Session save failed'));});child.on('close',code=>{clearTimeout(timeout);code===0&&result.trim()==='OK'?resolve():reject(Error('Session save failed'));});
  child.stdin.end(JSON.stringify({session,previousRefreshToken}));
});}
export function createPortfolioCollector(input,{fetcher=fetch,now=Date.now,persistSession=persist}={}){
  const session=createSessionManager({session:input.session,url,key,ownerId:uid,persist:persistSession,fetcher,now});
  const collect=createPcCollector({supabaseUrl:url,supabaseKey:key,allowedUserId:uid,origin:'https://ghdtjdalskr-svg.github.io',clientId:input.toss.clientId,clientSecret:input.toss.clientSecret},{getAccessToken:session.getToken,fetcher,now});
  let cached=null,at=0;
  async function read(path,max){const r=await fetcher(url+path,{headers:{apikey:key,Authorization:'Bearer '+await session.getToken()},redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});if(!r.ok)throw Error('Read failed');const text=await r.text();if(Buffer.byteLength(text)>max)throw Error('Read limit exceeded');return {text,data:JSON.parse(text)};}
  return async function tick({seedCharts=false,diagnose=false}={}){
    let stage='session';try{
      await session.verify();stage='holding-codes';
      if(!cached||now()-at>=3600000){
        // Read investment fields only. Never download attachments or the entire life-state.
        const select='accounts:state->accounts,instruments:state->instruments,investmentBrokerSnapshots:state->investmentBrokerSnapshots';
        const result=await read('/rest/v1/hani_state?user_id=eq.'+uid+'&select='+encodeURIComponent(select)+'&limit=1',1048576);
        if(!Array.isArray(result.data)||result.data.length!==1)throw Error('No saved investment state');cached=trackedSymbols(result.data[0],{diagnose});at=now();
      }
      if(diagnose)return {success:true,stage:'holding-codes',symbols:cached.codes.length,unresolved:cached.unresolved,holdingCount:cached.holdingCount,exceptions:cached.exceptions||[]};
      if(!cached.codes.length||cached.codes.length>200)return {success:false,stage:'holding-codes',reason:'no-supported-codes',unresolved:cached.unresolved};
      stage='collect-publish';const result=await collect(cached.codes,seedCharts?{chartPeriods:['1M'],onlyMissingCharts:true}:{});if(result.skipped)return {success:true,skipped:true};
      stage='read-back';const saved=await read('/storage/v1/object/authenticated/hani-market-cache/'+uid+'/latest.json?verification='+result.digest,65536);
      if(createHash('sha256').update(saved.text).digest('hex')!==result.digest)throw Error('Read-back differs');
      let chartCount=0,chartBytes=0;
      if(seedCharts){stage='chart-read-back';for(const code of cached.codes){const ref=saved.data.charts[code+'/1M'];
        if(!/^charts\/[a-f0-9]{64}\.json$/.test(ref||''))throw Error('Missing chart reference');
        const chart=await read('/storage/v1/object/authenticated/hani-market-cache/'+uid+'/'+ref,262144);
        if(createHash('sha256').update(chart.text).digest('hex')!==ref.slice(7,-5)||chart.data.symbol!==code||chart.data.period!=='1M')throw Error('Chart mismatch');
        chartCount++;chartBytes+=Buffer.byteLength(chart.text);
      }}
      return {success:true,published:true,readBack:true,symbols:cached.codes.length,unresolved:cached.unresolved,holdingCount:cached.holdingCount,bytes:result.bytes,collectedAt:saved.data.collectedAt,...(seedCharts?{chartCount,chartBytes}:{})};
    }catch(error){const reasons={'HANI login required':'login-required','HANI session refresh failed':'refresh-rejected','Session persistence failed; sign in again':'session-save-failed','Owner mismatch':'owner-mismatch','Invalid session':'invalid-session','Invalid refreshed session':'invalid-refresh-response','Regressed quotes; last cache preserved':'regressed-quotes','Incomplete market response; last cache preserved':'incomplete-quotes','Market collection failed':'market-source-failed'};return {success:false,stage,reason:reasons[error?.message]||'operation-failed'};}
  };
}
export async function runCollectionLoop(tick,{watch=false,sleep=delay,report=()=>{}}={}){
  let failures=0;
  do{const result=await tick();report(result);failures=result.success?0:failures+1;
    if(!watch||failures>=3)return result.success?0:1;
    await sleep(result.success?300000:Math.min(1800000,300000*2**failures));
  }while(true);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>65536)throw Error('Input too large');}const input=JSON.parse(raw);raw='';
    const tick=createPortfolioCollector(input),seedCharts=process.argv.includes('--seed-charts'),diagnose=process.argv.includes('--diagnose');
    if(seedCharts&&process.argv.includes('--watch'))throw Error('Chart seeding must be one-shot');
    process.exitCode=await runCollectionLoop(()=>tick({seedCharts,diagnose}),{watch:process.argv.includes('--watch'),report:result=>process.stdout.write(JSON.stringify(result)+'\n')});
  }catch{process.stdout.write('{"success":false,"stage":"private-input"}\n');process.exitCode=1;}
}
