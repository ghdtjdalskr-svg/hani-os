import {createHash} from 'node:crypto';
import M from '../hani-market-data.js';
export const markets=['KOSPI','KOSDAQ','NYSE','NASDAQ','AMEX','KR_ETC','US_ETC'];
export const digest=text=>createHash('sha256').update(text).digest('hex');
export function buildCatalog(lists,now=Date.now()){
  const objects=new Map(),index={version:1,collectedAt:new Date(now).toISOString(),markets:{}};let count=0,bytes=0;
  for(const market of markets){
    const list=lists[market];if(!Array.isArray(list)||list.length>20000)throw Error('Invalid catalog');
    const seen=new Set(),rows=list.map(s=>{
      const symbol=M.symbol(s?.symbol);if(!M.validSymbol(symbol)||typeof s.name!=='string'||!s.name.trim()||s.name.length>200||s.market!==market||s.currency!==M.currency(market)||seen.has(symbol))throw Error('Invalid catalog row '+market+' '+(!M.validSymbol(symbol)?'symbol':seen.has(symbol)?'duplicate':s.market!==market?'market':s.currency!==M.currency(market)?'currency':'name')+' '+symbol.replace(/[^A-Z0-9.-]/g,'?').slice(0,20));
      seen.add(symbol);return {symbol,name:s.name.trim(),market,currency:s.currency,...(typeof s.securityType==='string'?{securityType:s.securityType.slice(0,40)}:{})};
    }).sort((a,b)=>a.symbol.localeCompare(b.symbol));
    const refs=[];for(let i=0;i<rows.length;i+=400){const body=JSON.stringify({version:1,market,rows:rows.slice(i,i+400)});if(Buffer.byteLength(body)>262144)throw Error('Catalog chunk limit');const ref='catalog/'+digest(body)+'.json';refs.push(ref);objects.set(ref,body);bytes+=Buffer.byteLength(body);}
    count+=rows.length;index.markets[market]={count:rows.length,refs};
  }
  if(!count||bytes>8388608)throw Error('Catalog total limit');
  return {index,objects,count,bytes};
}
export async function publishCatalog({lists,storage,now=Date.now()}){
  const previous=await storage.readIndex();
  if(previous&&(previous.version!==1||!Number.isFinite(Date.parse(previous.collectedAt))||Date.parse(previous.collectedAt)>now))throw Error('Invalid previous catalog');
  if(previous&&now-Date.parse(previous.collectedAt)<86400000)return {success:true,skipped:true};
  const built=buildCatalog(await lists(),now),known=new Set(Object.values(previous?.markets||{}).flatMap(m=>m.refs||[]));
  // Chunks verified first; pointer atomically published last. No asset state involved.
  for(const [ref,body] of built.objects){if(!known.has(ref))await storage.put(ref,body);if(digest(await storage.read(ref))!==digest(body))throw Error('Catalog read-back mismatch');}
  const body=JSON.stringify(built.index);await storage.put('catalog/index.json',body);
  if(await storage.read('catalog/index.json')!==body)throw Error('Catalog pointer read-back mismatch');
  return {success:true,published:true,readBack:true,symbols:built.count,bytes:built.bytes,collectedAt:built.index.collectedAt};
}
