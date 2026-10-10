// Inline-first compatibility reads; stage B writes only on explicit owner action.
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
      void get(ref).then(value=>{if(!value)queueCloud(ref,owner)});return "";
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
  // B writes are explicit; resolver hydration only caches requested Cloud images.
  let cloudProvider=()=>null,cloudTimer=null;
  const cloudQueue=new Map(),cloudAttempted=new Set();
  function setCloudProvider(provider){cloudProvider=typeof provider==="function"?provider:()=>null}
  async function cloudRequest(query){
    let timer;
    try{return await Promise.race([query,new Promise(resolve=>{
      timer=setTimeout(()=>resolve(null),15000);
    })])}catch(_){return null}finally{clearTimeout(timer)}
  }
  async function cloudList(client,userId){
    try{
      if(!client||!userId)return null;
      const ids=new Set();
      for(let offset=0;;offset+=500){
        const result=await cloudRequest(client.from("hani_media").select("media_id")
          .eq("user_id",userId).order("media_id").range(offset,offset+499));
        if(!result||result.error||!Array.isArray(result.data))return null;
        for(const row of result.data){if(!isRef(row?.media_id))return null;ids.add(row.media_id)}
        if(result.data.length<500)return ids;
      }
    }catch(_){return null}
  }
  async function cloudPut(client,userId,row){
    try{
      if(!client||!userId||!isRef(row?.media_id)||typeof row.data!=="string"||
        row.bytes!==bytes(row.data)||row.bytes<1||row.bytes>600000||
        row.mime!==row.data.match(/^data:([^;,]+)/)?.[1]||await digest(row.data)!==row.media_id)return false;
      const result=await cloudRequest(client.from("hani_media").insert({
        user_id:userId,media_id:row.media_id,mime:row.mime,bytes:row.bytes,data:row.data
      }));
      return !!result&&(!result.error||result.error.code==="23505");
    }catch(_){return false}
  }
  async function cloudGet(client,userId,ids){
    try{
      if(!client||!userId||!Array.isArray(ids)||ids.some(id=>!isRef(id)))return null;
      const wanted=[...new Set(ids)],rows=new Map();
      for(let offset=0;offset<wanted.length;offset+=100){
        const batch=wanted.slice(offset,offset+100),allowed=new Set(batch);
        const result=await cloudRequest(client.from("hani_media").select("media_id,mime,bytes,data")
          .eq("user_id",userId).in("media_id",batch));
        if(!result||result.error||!Array.isArray(result.data))return null;
        for(const row of result.data){
          if(!allowed.has(row?.media_id)||rows.has(row.media_id)||typeof row.data!=="string"||
            row.bytes!==bytes(row.data)||row.bytes<1||row.bytes>600000||
            row.mime!==row.data.match(/^data:([^;,]+)/)?.[1]||await digest(row.data)!==row.media_id)return null;
          rows.set(row.media_id,row.data);
        }
      }
      return rows;
    }catch(_){return null}
  }
  function queueCloud(ref,owner){
    try{
      const context=cloudProvider(),key=JSON.stringify([owner,ref]);
      if(account()!==owner||context?.userId!==owner||!context.client||cloudAttempted.has(key))return;
      cloudAttempted.add(key);cloudQueue.set(key,{ref,owner,client:context.client});
      if(cloudTimer===null)cloudTimer=setTimeout(()=>{cloudTimer=null;void flushCloud()},40);
    }catch(_){}
  }
  async function flushCloud(){
    try{
      const queued=[...cloudQueue.values()];for(const key of [...cloudQueue.keys()])cloudQueue.delete(key);
      const context=cloudProvider(),owner=account();
      const batch=queued.filter(row=>row.owner===owner&&row.client===context?.client&&context?.userId===owner);
      if(!batch.length)return;
      const rows=await cloudGet(context.client,owner,batch.map(row=>row.ref));
      for(const [ref,data] of rows||[]){
        const current=cloudProvider();
        if(account()!==owner||current?.userId!==owner||current.client!==context.client)return;
        await put(ref,data); // put includes committed IDB read-back and hani-media-ready.
      }
    }catch(_){}
  }
  async function prepareB({state,client,userId,snapshot,guard,progress=()=>{}}){
    const conflicts=[];
    try{
      const check=()=>{if(account()!==userId||guard()!==true)throw Error("계정·기록·Cloud 상태가 변경됐습니다.")};
      check();progress("a · 원본 전체 안전 백업 생성·재읽기 확인");
      if(await snapshot()!==true)throw Error("안전 백업을 확인하지 못했습니다.");
      check();progress("b · 이미지 digest·기기 보관·재읽기 확인");
      const records=new Map(),changes=[],links=[];let count=0;
      for(const [kind,field] of fields)for(const [index,row] of (state[kind]||[]).entries()){
        if(typeof row?.[field]!=="string"||!row[field].startsWith("data:"))continue;
        const data=row[field],ref=await digest(data);check();
        if(!ref||bytes(data)>600000)throw Error("이미지 형식·크기·digest를 확인하지 못했습니다.");
        if(await put(ref,data)!==data)throw Error("기기 이미지 보관 검증에 실패했습니다.");
        check();count++;
        records.set(ref,{media_id:ref,mime:data.match(/^data:([^;,]+)/)?.[1],bytes:bytes(data),data});
        const old=row[field+"Ref"];
        if(old&&old!==ref)conflicts.push({kind,id:row.id||"",index,field,ref:old});
        else{
          if(!row.id||(state[kind]||[]).filter(item=>item?.id===row.id).length!==1)
            throw Error("이미지 기록 ID가 없거나 중복됩니다.");
          const link={kind,id:row.id,index,field,ref,data};links.push(link);
          if(old!==ref)changes.push(link);
        }
      }
      progress("c · Cloud 목록·누락 업로드·재조회·본문 digest 확인");
      const before=await cloudList(client,userId);check();
      if(!before)throw Error("Cloud 이미지 목록을 확인하지 못했습니다.");
      for(const record of records.values()){
        if(!before.has(record.media_id)&&!await cloudPut(client,userId,record))
          throw Error("Cloud 이미지 업로드에 실패했습니다.");
        check();
      }
      const after=await cloudList(client,userId);check();
      if(!after||[...records.keys()].some(id=>!after.has(id)))throw Error("Cloud 보관 목록 검증에 실패했습니다.");
      // Verify existing bodies too: a duplicate-key receipt is not body verification.
      const verified=await cloudGet(client,userId,[...records.keys()]);check();
      if(!verified||[...records].some(([id,row])=>verified.get(id)!==row.data))
        throw Error("Cloud 이미지 본문 재읽기 검증에 실패했습니다.");
      return {ok:true,count,changes,links,conflicts};
    }catch(error){return {ok:false,count:0,changes:[],conflicts,error:error?.message||"이중 보관 검증 실패"}}
  }
  root.HANI_MEDIA=Object.freeze({digest,isRef,resolve,get,put,has,hasRefs,reembed,dryRunReport,setAccountProvider,
    setCloudProvider,cloudList,cloudPut,cloudGet,prepareB});
})(window);
