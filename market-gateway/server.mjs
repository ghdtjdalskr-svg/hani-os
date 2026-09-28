// Separate fixed-egress service. No account/order endpoints, database writes or secret logs.
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import Market from '../hani-market-data.js';
const MARKETS=['KOSPI','KOSDAQ','NYSE','NASDAQ','AMEX','KR_ETC','US_ETC'];
const PERIODS={'1D':1,'1W':7,'1M':31,'3M':93,'6M':186,'1Y':366};
const fault=(status,message)=>Object.assign(new Error(message),{status});
const pick=(row,keys)=>Object.fromEntries(keys.filter(k=>row[k]!==undefined).map(k=>[k,row[k]]));
const stockFields=['symbol','name','englishName','isinCode','market','securityType','isCommonShare','status','currency'];
export function createGateway(config,{fetcher=fetch,now=Date.now}={}){
  if(['supabaseUrl','supabaseKey','allowedUserId','origin','clientId','clientSecret'].some(k=>!config[k]))throw Error('Gateway configuration incomplete.');
  if(new URL(config.supabaseUrl).protocol!=='https:'||new URL(config.origin).origin!==config.origin)throw Error('Invalid trusted origin.');
  const cache=new Map(),pending=new Map(),budgets=new Map();let token=null,expires=0,tokenPending=null,cooldown=0,active=0;
  const limitedFetch=(url,options={})=>fetcher(url,{...options,redirect:'error',signal:AbortSignal.timeout(10000)});
  async function getToken(){
    if(token&&expires>now()+60000)return token;
    if(!tokenPending)tokenPending=(async()=>{
      const r=await limitedFetch('https://openapi.tossinvest.com/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:config.clientId,client_secret:config.clientSecret})});
      if(!r.ok)throw fault(502,'시세 인증 연결을 확인하지 못했습니다.');const d=await r.json();
      if(!d.access_token||!(Number(d.expires_in)>60))throw fault(502,'시세 인증 응답 오류');token=d.access_token;expires=now()+Number(d.expires_in)*1000;return token;
    })().finally(()=>{tokenPending=null;});return tokenPending;
  }
  async function toss(path,ttl){
    const entry=cache.get(path);if(entry&&now()-entry.at<ttl)return entry.value;if(pending.has(path))return pending.get(path);
    if(now()<cooldown)throw fault(429,'잠시 후 다시 시도해주세요.');
    const task=(async()=>{
      const used=await getToken(),r=await limitedFetch('https://openapi.tossinvest.com'+path,{headers:{Authorization:'Bearer '+used}});
      if(r.status===401&&token===used){token=null;expires=0;}
      if(r.status===429){cooldown=now()+Math.max(1,Math.min(60,Number(r.headers.get('retry-after'))||2))*1000;throw fault(429,'시세 조회 제한');}
      if(!r.ok)throw fault(502,'시세 공급자 응답을 확인하지 못했습니다.');const d=await r.json();
      if(d.result===undefined)throw fault(502,'시세 응답 형식 오류');if(cache.size>=500)cache.delete(cache.keys().next().value);cache.set(path,{at:now(),value:d.result});return d.result;
    })().finally(()=>pending.delete(path));pending.set(path,task);return task;
  }
  async function verify(req){
    const authorization=req.headers.authorization||'';
    if(!/^Bearer [A-Za-z0-9._-]+$/.test(authorization)||authorization.length>8192)throw fault(401,'HANI 로그인이 필요합니다.');
    const r=await limitedFetch(new URL('/auth/v1/user',config.supabaseUrl),{headers:{Authorization:authorization,apikey:config.supabaseKey}});
    if(!r.ok)throw fault(401,'HANI 로그인을 확인해주세요.');const user=await r.json();
    if(user.id!==config.allowedUserId||user.is_anonymous)throw fault(403,'허용되지 않은 사용자입니다.');
  }
  async function chart(code,period){
    const interval=period==='1D'?'1m':'1d',all=[],seen=new Set();let before=null,complete=false,cutoff=now()-PERIODS[period]*86400000,day=null;
    for(let page=0;page<(period==='1D'?8:3);page++){
      const q=new URLSearchParams({symbol:code,interval,count:'200',adjusted:'false'});if(before)q.set('before',before);
      const result=await toss('/api/v1/candles?'+q,period==='1D'?60000:300000);if(!Array.isArray(result.candles))throw fault(502,'차트 응답 형식 오류');
      if(period==='1D'&&!day&&result.candles.length)day=result.candles[0].timestamp.slice(0,10);
      all.push(...result.candles.filter(c=>period==='1D'?c.timestamp.slice(0,10)===day:Date.parse(c.timestamp)>=cutoff));
      const oldest=result.candles.at(-1),past=oldest&&(period==='1D'?oldest.timestamp.slice(0,10)!==day:Date.parse(oldest.timestamp)<cutoff);
      if(!result.nextBefore||past||!oldest){complete=true;break;}if(seen.has(result.nextBefore))break;seen.add(result.nextBefore);before=result.nextBefore;
    }
    return {result:Market.candles(all).map(c=>pick(c,['timestamp','closePrice','currency'])),period,interval,adjusted:false,complete,source:'Toss',fetchedAt:new Date(now()).toISOString()};
  }
  return async function handler(req,res){
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
    const send=(status,value)=>{res.writeHead(status,headers);res.end(status===204?'':JSON.stringify(value));};let entered=false;
    try{
      if(req.headers.origin!==config.origin)throw fault(403,'허용되지 않은 출처입니다.');headers['Access-Control-Allow-Origin']=config.origin;
      if(req.method==='OPTIONS'){headers['Access-Control-Allow-Methods']='GET';headers['Access-Control-Allow-Headers']='Authorization';return send(204,null);}
      if(req.method!=='GET')throw fault(405,'조회만 허용됩니다.');if((req.url||'').length>6000)throw fault(400,'요청이 너무 큽니다.');
      const url=new URL(req.url,'http://gateway.local'),route=url.pathname;if(!['/v1/prices','/v1/stocks','/v1/chart','/v1/search','/v1/catalog'].includes(route))throw fault(404,'지원하지 않는 경로');
      const ip=req.socket.remoteAddress||'unknown',b=budgets.get(ip)||{at:now(),count:0};if(now()-b.at>60000){b.at=now();b.count=0;}b.count++;if(budgets.size>1000)budgets.clear();budgets.set(ip,b);
      if(b.count>120||active>=4)throw fault(429,'요청이 많습니다. 잠시 후 다시 시도해주세요.');active++;entered=true;await verify(req);
      if(route==='/v1/chart'){const code=Market.symbol(url.searchParams.get('symbol')),period=url.searchParams.get('period');if(!Market.validSymbol(code)||!PERIODS[period])throw fault(400,'종목·기간을 확인해주세요.');return send(200,await chart(code,period));}
      if(route==='/v1/search'||route==='/v1/catalog'){
        const market=url.searchParams.get('market'),query=Market.name(url.searchParams.get('q'));if(!MARKETS.includes(market)||(route==='/v1/search'&&(query.length<2||query.length>80)))throw fault(400,'시장과 검색어를 확인해주세요.');
        const list=await toss('/api/v1/stocks/all?market='+market,86400000);if(!Array.isArray(list))throw fault(502,'종목 목록 형식 오류');
        if(list.length>20000)throw fault(502,'종목 목록 크기 오류');
        // ListedStock omits market/currency: these come from the requested exchange.
        const rows=list.map(s=>({...pick(s,stockFields),market,currency:Market.currency(market)}));
        return send(200,{result:route==='/v1/catalog'?rows:rows.filter(s=>[s.name,s.englishName,s.symbol].some(n=>Market.name(n).includes(query))).slice(0,20)});
      }
      const codes=[...new Set((url.searchParams.get('symbols')||'').split(',').map(Market.symbol))];if(!codes.length||codes.length>200||codes.some(c=>!Market.validSymbol(c)))throw fault(400,'종목코드를 확인해주세요.');
      codes.sort();const isPrice=route==='/v1/prices',data=await toss('/api/v1/'+(isPrice?'prices':'stocks')+'?symbols='+encodeURIComponent(codes.join(',')),isPrice?30000:86400000);if(!Array.isArray(data))throw fault(502,'시세 응답 형식 오류');
      send(200,{result:data.filter(s=>codes.includes(s.symbol)).map(s=>pick(s,isPrice?['symbol','lastPrice','currency','timestamp']:stockFields)),source:'Toss',fetchedAt:new Date(now()).toISOString()});
    }catch(e){send(e.status||502,{error:e.status?e.message:'연결을 확인하지 못했습니다. 저장 기록은 유지됩니다.'});}finally{if(entered)active--;}
  };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const e=process.env,handler=createGateway({supabaseUrl:e.HANI_SUPABASE_URL,supabaseKey:e.HANI_SUPABASE_PUBLISHABLE_KEY,allowedUserId:e.HANI_MARKET_USER_ID,origin:e.HANI_MARKET_ORIGIN,clientId:e.TOSS_CLIENT_ID,clientSecret:e.TOSS_CLIENT_SECRET});
  http.createServer({maxHeaderSize:16384},handler).listen(Number(e.PORT)||8788,'127.0.0.1');
}
