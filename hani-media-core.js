// Stage A: compatibility reads only. No automatic put, state writes or migration.
(function(root){
  "use strict";
  const fields=[["books","cover"],["movies","poster"]];
  const cache=new Map(),pending=new Map();
  let accountProvider=()=>"",notifyTimer=null;
  const isRef=v=>typeof v==="string"&&/^media:sha256:[a-f0-9]{64}$/.test(v);
  const inline=v=>typeof v==="string"&&v.length>0&&!isRef(v);
  const bytes=v=>new TextEncoder().encode(v).length;
  function account(){try{return String(accountProvider()||"")}catch(_){return ""}}
  function setAccountProvider(provider){accountProvider=typeof provider==="function"?provider:()=>"";cache.clear()}
  async function digest(dataUrl){
    try{
      if(typeof dataUrl!=="string"||!dataUrl.startsWith("data:")||!root.crypto?.subtle)return null;
      const hash=await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(dataUrl));
      return "media:sha256:"+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,"0")).join("");
    }catch(_){return null}
  }
  function open(){
    return new Promise(resolve=>{
      let done=false;
      const finish=value=>{if(done){try{value?.close()}catch(_){}return}done=true;clearTimeout(timer);resolve(value)};
      const timer=setTimeout(()=>finish(null),5000);
      try{
        const request=root.indexedDB.open("hani_media_v1",1);
        request.onupgradeneeded=()=>{
          try{if(!request.result.objectStoreNames.contains("media"))request.result.createObjectStore("media",{keyPath:"key"})}
          catch(_){try{request.transaction.abort()}catch(__){}finish(null)}
        };
        request.onerror=request.onblocked=()=>finish(null);
        request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();finish(request.result)};
      }catch(_){finish(null)}
    });
  }
  async function transaction(mode,key,record){
    const db=await open();if(!db)return null;
    return new Promise(resolve=>{
      let tx,result=null,done=false;
      const finish=value=>{
        if(done)return;done=true;clearTimeout(timer);
        try{db.close()}catch(_){}resolve(value);
      };
      const timer=setTimeout(()=>{try{tx?.abort()}catch(_){}finish(null)},5000);
      try{
        tx=db.transaction("media",mode);
        const store=tx.objectStore("media"),request=mode==="readwrite"?store.put(record):store.get(key);
        request.onsuccess=()=>{result=request.result};
        tx.oncomplete=()=>finish(mode==="readwrite"?true:result||null);
        tx.onerror=tx.onabort=request.onerror=()=>finish(null);
      }catch(_){finish(null)}
    });
  }
  async function read(ref,owner){
    try{
      if(!owner||!isRef(ref))return null;
      const key=JSON.stringify([owner,ref]),record=await transaction("readonly",key);
      if(!record||record.account!==owner||record.ref!==ref||record.key!==key||
         typeof record.dataUrl!=="string"||record.bytes!==bytes(record.dataUrl)||
         record.mime!==record.dataUrl.match(/^data:([^;,]+)/)?.[1]||
         await digest(record.dataUrl)!==ref)return null;
      const changed=cache.get(key)!==record.dataUrl;cache.set(key,record.dataUrl);
      if(changed&&account()===owner&&root.dispatchEvent&&root.Event&&notifyTimer===null){
        notifyTimer=setTimeout(()=>{notifyTimer=null;try{root.dispatchEvent(new root.Event("hani-media-ready"))}catch(_){}},0);
      }
      return record.dataUrl;
    }catch(_){return null}
  }
  async function get(ref){
    try{
      const owner=account();if(!owner||!isRef(ref))return null;
      const key=JSON.stringify([owner,ref]);
      if(!pending.has(key))pending.set(key,read(ref,owner).finally(()=>pending.delete(key)));
      const value=await pending.get(key);return account()===owner?value:null;
    }catch(_){return null}
  }
  async function put(ref,dataUrl){
    try{
      const owner=account();if(!owner||!isRef(ref)||await digest(dataUrl)!==ref)return null;
      const key=JSON.stringify([owner,ref]),mime=dataUrl.match(/^data:([^;,]+)/)?.[1];
      if(!mime)return null;
      const record={key,account:owner,ref,dataUrl,mime,bytes:bytes(dataUrl)};
      if(!await transaction("readwrite",key,record))return null;
      // Independent readonly transaction and digest verification after commit.
      const verified=await read(ref,owner);
      return verified===dataUrl&&account()===owner?verified:null;
    }catch(_){return null}
  }
  async function has(ref){try{return await get(ref)!==null?true:null}catch(_){return null}}
  function resolve(item,field){
    try{
      if(inline(item?.[field]))return item[field];
      const ref=item?.[field+"Ref"],owner=account();if(!owner||!isRef(ref))return "";
      const value=cache.get(JSON.stringify([owner,ref]));
      if(value)return value;
      void get(ref);return "";
    }catch(_){return ""}
  }
  function hasRefs(state){
    return fields.some(([kind,field])=>Array.isArray(state?.[kind])&&
      state[kind].some(row=>row?.[field+"Ref"]&&!inline(row?.[field])));
  }
  async function reembed(state){
    try{
      if(!hasRefs(state))return {data:state,complete:true,missing:[]};
      const owner=account(),data=JSON.parse(JSON.stringify(state)),missing=[];
      for(const [kind,field] of fields)for(const row of data[kind]||[]){
        if(!row?.[field+"Ref"]||inline(row[field]))continue;
        const value=await get(row[field+"Ref"]);
        if(value&&account()===owner)row[field]=value;
        else missing.push({kind,id:row.id||"",ref:row[field+"Ref"]});
      }
      if(account()!==owner)return {data:null,complete:false,missing};
      return {data,complete:missing.length===0,missing};
    }catch(_){return {data:null,complete:false,missing:[]}}
  }
  function dryRunReport(state){
    const text=JSON.stringify(state||{}),after=JSON.parse(text),items=[];
    let inlineBytes=0;
    for(const [kind,field] of fields)for(const row of after[kind]||[]){
      if(typeof row?.[field]!=="string"||!row[field].startsWith("data:"))continue;
      const size=bytes(row[field]);inlineBytes+=size;
      items.push({kind,id:row.id||"",title:row.title||"",bytes:size});
      row[field]="";row[field+"Ref"]="media:sha256:"+"0".repeat(64);
    }
    return {count:items.length,inlineBytes,estimatedAfterBytes:bytes(JSON.stringify(after)),items};
  }
  root.HANI_MEDIA=Object.freeze({digest,isRef,resolve,get,put,has,hasRefs,reembed,dryRunReport,setAccountProvider});
})(window);
