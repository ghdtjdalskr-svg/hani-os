(function(root){
  "use strict";
  const WEEK=7*24*60*60*1000,MAX_BYTES=30*1024*1024;
  function due(last,now=Date.now()){
    if(!last)return true;
    const at=Date.parse(last.at);
    return Number.isFinite(at)&&now-at>=WEEK;
  }
  function weeklyDecision({ready,handle,permission,last,now=Date.now()}){
    if(!handle)return "idle";
    if(permission==="prompt")return "reminder";
    return ready&&permission==="granted"&&due(last,now)?"write":"idle";
  }
  function filename(now){
    const kst=new Date(now+9*60*60*1000).toISOString();
    return "HANI_OS_backup_"+kst.slice(0,10)+"_"+kst.slice(11,16).replace(":","")+".json";
  }
  async function hash(bytes){
    const digest=await root.crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  }
  async function writeBackup({handle,build,validate,guard=()=>{},now=Date.now()}){
    guard();
    const text=await build();
    guard();
    if(typeof text!=="string")throw Error("INCOMPLETE");
    validate(text);
    const bytes=new TextEncoder().encode(text);
    if(bytes.byteLength>MAX_BYTES)throw Error("TOO_LARGE");
    const sha256=await hash(bytes),base=filename(now);
    let name,file;
    for(let suffix=0;suffix<1000;suffix++){
      name=suffix?base.replace(/\.json$/,"_"+suffix+".json"):base;
      try{await handle.getFileHandle(name);continue}
      catch(error){if(error.name!=="NotFoundError")throw error}
      guard();
      file=await handle.getFileHandle(name,{create:true});
      // Refuse a file another writer populated between lookup and creation.
      if((await file.getFile()).size!==0)continue;
      break;
    }
    if(!file||((await file.getFile()).size!==0))throw Error("COLLISION");
    guard();
    const stream=await file.createWritable({keepExistingData:true});
    try{
      guard();await stream.write(bytes);guard();await stream.close();
    }catch(error){
      try{await stream.abort()}catch(_){}
      throw error;
    }
    guard();
    const readback=await file.getFile(),actual=new Uint8Array(await readback.arrayBuffer());
    if(actual.byteLength!==bytes.byteLength||await hash(actual)!==sha256)throw Error("HASH");
    validate(new TextDecoder("utf-8",{fatal:true}).decode(actual));
    guard();
    return {at:new Date(now).toISOString(),name,bytes:bytes.byteLength,sha256};
  }
  root.HANI_DRIVE_VAULT_CORE=Object.freeze({due,weeklyDecision,filename,writeBackup});
  if(!root.document)return;
  const doc=root.document,$=id=>doc.getElementById(id),api=root.HANI_DRIVE_BACKUP;
  const supported=typeof root.showDirectoryPicker==="function"&&!!root.crypto?.subtle;
  let dbPromise,cached=null,cachedOwner="",permission="",busy=false,timer=null,refreshing=false;
  const attempted=new Set();
  function database(){
    if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
      const request=root.indexedDB.open("hani_vault_v1",1);
      request.onupgradeneeded=()=>{
        if(!request.result.objectStoreNames.contains("accounts"))request.result.createObjectStore("accounts");
      };
      request.onerror=()=>reject(Error("IDB"));
      request.onblocked=()=>reject(Error("IDB"));
      request.onsuccess=()=>{
        const db=request.result;
        db.onversionchange=()=>{db.close();dbPromise=null};
        resolve(db);
      };
    }).catch(error=>{dbPromise=null;throw error});
    return dbPromise;
  }
  async function record(owner,value){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction("accounts",value===undefined?"readonly":"readwrite");
      const store=tx.objectStore("accounts");
      const request=value===undefined?store.get(owner):store.put(value,owner);
      tx.oncomplete=()=>resolve(value===undefined?request.result:value);
      tx.onerror=tx.onabort=()=>reject(Error("IDB"));
    });
  }
  function status(text){if($("driveVaultStatus"))$("driveVaultStatus").textContent=text}
  function paint(){
    const context=api.context(),owned=cachedOwner===context.owner;
    const row=owned?cached:null,prompt=!!row?.handle&&permission==="prompt";
    $("driveVaultChip").hidden=!prompt;
    $("driveVaultConnect").disabled=!supported||busy||!context.owner;
    $("driveVaultBackup").disabled=!supported||busy||!context.ready||!row?.handle||permission!=="granted";
    $("driveVaultReminder").textContent=prompt?
      "폴더 권한을 다시 확인하려면 ‘백업 폴더 연결’을 눌러 주세요.":
      permission==="denied"?"폴더 접근이 거부됐습니다. ‘백업 폴더 연결’에서 다시 선택해 주세요.":"";
    const last=row?.last;
    $("driveVaultLast").textContent=last?
      "마지막 검증 백업: "+new Date(last.at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})+
      " KST · "+last.name+" · "+last.bytes+" bytes · SHA-256 "+last.sha256:"검증된 Vault 백업 기록 없음";
  }
  function fail(error){
    status(({INCOMPLETE:"표지·포스터를 포함한 완전한 백업을 만들지 못했습니다.",
      HASH:"파일을 다시 읽은 결과가 달라 성공으로 기록하지 않았습니다.",
      OWNER:"계정 또는 원본 상태가 바뀌어 백업을 중단했습니다.",
      IDB:"백업 폴더·기록을 브라우저에 보관하지 못했습니다.",
      TOO_LARGE:"백업이 30MB를 초과해 저장을 중단했습니다.",
      COLLISION:"새 파일 이름을 확보하지 못했습니다."})[error?.message]||
      (error?.name==="AbortError"?"폴더 선택을 취소했습니다.":"백업을 완료하지 못했습니다. 폴더 권한·디스크 공간을 확인해 주세요."));
  }
  function guard(ticket){
    const now=api.context();
    if(now.owner!==ticket.owner||now.epoch!==ticket.epoch||!now.ready)throw Error("OWNER");
  }
  async function backup(automatic=false){
    if(busy)return;
    const ticket=api.context();if(!ticket.ready)return;
    busy=true;paint();
    try{
      // One lock across accounts/tabs; re-read the weekly timestamp under the lock.
      if(!root.navigator?.locks)throw Error("LOCK");
      await root.navigator.locks.request("hani-vault-write",async()=>{
        guard(ticket);
        const row=await record(ticket.owner);guard(ticket);
        if(!row?.handle)throw Error("PERMISSION");
        if(await row.handle.queryPermission({mode:"readwrite"})!=="granted")throw Error("PERMISSION");
        guard(ticket);
        if(automatic&&!due(row.last))return;
        const last=await writeBackup({handle:row.handle,build:()=>api.build(ticket),
          validate:api.validate,guard:()=>guard(ticket)});
        guard(ticket);
        await record(ticket.owner,{handle:row.handle,last});
        guard(ticket);
        cached={handle:row.handle,last};cachedOwner=ticket.owner;
        status("Drive 폴더 저장·재읽기·SHA-256·백업 검증 완료. Google Drive 동기화 상태는 PC에서 확인해 주세요.");
      });
    }catch(error){fail(error)}
    finally{busy=false;paint()}
  }
  async function connect(){
    if(busy||!supported)return;
    const ticket=api.context();if(!ticket.owner)return;
    // Invoke picker/requestPermission before any await to preserve the click gesture.
    const row=cachedOwner===ticket.owner?cached:null;
    busy=true;paint();
    try{
      let handle;
      if(row?.handle&&permission==="prompt"){
        const result=await row.handle.requestPermission({mode:"readwrite"});
        if(result!=="granted")throw Error("PERMISSION");
        handle=row.handle;
      }else handle=await root.showDirectoryPicker({id:"hani-vault",mode:"readwrite"});
      const current=api.context();
      if(current.owner!==ticket.owner||current.epoch!==ticket.epoch)throw Error("OWNER");
      const granted=await handle.queryPermission({mode:"readwrite"});
      if(granted!=="granted")throw Error("PERMISSION");
      if(api.context().owner!==ticket.owner||api.context().epoch!==ticket.epoch)throw Error("OWNER");
      if(!root.navigator?.locks)throw Error("LOCK");
      cached=await root.navigator.locks.request("hani-vault-write",async()=>{
        const prior=await record(ticket.owner);
        const same=prior?.handle&&await handle.isSameEntry(prior.handle);
        if(api.context().owner!==ticket.owner||api.context().epoch!==ticket.epoch)throw Error("OWNER");
        return record(ticket.owner,{handle,last:same?prior.last:null});
      });
      cachedOwner=ticket.owner;permission="granted";
      status("Drive 백업 폴더 연결 완료. 이 폴더의 파일은 자동 삭제하지 않습니다.");
    }catch(error){fail(error)}
    finally{busy=false;paint();schedule()}
  }
  async function refresh(){
    if(refreshing||busy||!supported)return;
    refreshing=true;
    try{
      const ticket=api.context();
      if(!ticket.owner){cached=null;cachedOwner="";permission="";status("소유 계정으로 로그인해 주세요.");paint();return}
      const row=await record(ticket.owner);
      const result=row?.handle?await row.handle.queryPermission({mode:"readwrite"}):"";
      const current=api.context();
      if(current.owner!==ticket.owner||current.epoch!==ticket.epoch)return;
      cached=row;cachedOwner=ticket.owner;permission=result;
      status(row?.handle?"Drive 연결 폴더: "+row.handle.name+" · "+(result==="granted"?"권한 허용":"권한 확인 필요"):"백업 폴더를 연결해 주세요.");
      paint();
      const decision=weeklyDecision({ready:current.ready,handle:row?.handle,permission:result,last:row?.last});
      const key=ticket.owner+":"+ticket.epoch;
      if(decision==="write"&&!attempted.has(key)){
        attempted.add(key);await backup(true);
      }
    }catch(error){fail(error)}
    finally{refreshing=false}
  }
  function schedule(){
    if(timer!==null)return;
    timer=root.setTimeout(()=>{timer=null;void refresh()},150);
  }
  root.HANI_DRIVE_VAULT=Object.freeze({schedule});
  if(!$("driveVaultStatus")||!api)return;
  $("driveVaultConnect").onclick=connect;
  $("driveVaultBackup").onclick=()=>backup(false);
  if(!supported){
    paint();
    status("PC(Chrome/Edge)에서 연결하세요.");
    $("driveVaultReminder").textContent="iPhone에서는 7일마다 전체 JSON 백업을 내려받아 Google Drive 앱에 직접 보관해 주세요.";
    return;
  }
  doc.addEventListener("visibilitychange",()=>{if(doc.visibilityState==="visible")schedule()});
  root.addEventListener("focus",schedule);
  schedule();
})(window);
