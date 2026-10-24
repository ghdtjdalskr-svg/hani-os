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
  const PHOTO_LIMIT=10*1024*1024,PHOTO_TOTAL=100*1024*1024,MANIFEST_LIMIT=10*1024*1024;
  const extensions={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","image/avif":"avif"};
  function safeTitle(title){
    return String(title||"untitled").normalize("NFC").replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g,"_")
      .replace(/[. ]+$/g,"").slice(0,70).replace(/[. ]+$/g,"")||"untitled";
  }
  function decodePhoto(value){
    if(typeof value!=="string"||value.length>PHOTO_LIMIT*1.4)throw Error("PHOTO_SIZE");
    const match=/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(value);
    if(!match||!extensions[match[1].toLowerCase()]||!match[2])throw Error("PHOTO_FORMAT");
    const raw=root.atob(match[2]),data=Uint8Array.from(raw,c=>c.charCodeAt(0));
    if(!data.length||data.length>PHOTO_LIMIT)throw Error("PHOTO_SIZE");
    // Match the actual image signature; never rename arbitrary bytes to .jpg.
    const mime=match[1].toLowerCase(),ascii=(a,b)=>String.fromCharCode(...data.slice(a,b));
    const valid=mime==="image/jpeg"?data[0]===255&&data[1]===216&&data[2]===255:
      mime==="image/png"?[137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v):
      mime==="image/gif"?/^GIF8[79]a$/.test(ascii(0,6)):
      mime==="image/webp"?ascii(0,4)==="RIFF"&&ascii(8,12)==="WEBP":
      ascii(4,8)==="ftyp"&&/avif|avis/.test(ascii(8,32));
    if(!valid)throw Error("PHOTO_FORMAT");
    return {mime,data};
  }
  async function readFile(dir,name){
    try{return await (await dir.getFileHandle(name)).getFile()}
    catch(error){if(error.name==="NotFoundError")return null;throw error}
  }
  async function verifiedFile(dir,name,bytes,digest){
    const file=await readFile(dir,name);
    return !!file&&file.size===bytes&&await hash(await file.arrayBuffer())===digest;
  }
  async function writeVerified(file,data,guard){
    guard();const stream=await file.createWritable();
    try{guard();await stream.write(data);guard();await stream.close()}
    catch(error){try{await stream.abort()}catch(_){}throw error}
    guard();const actual=await file.getFile();
    if(actual.size!==data.byteLength||await hash(await actual.arrayBuffer())!==await hash(data))throw Error("HASH");
    guard();
  }
  async function writePhotos({handle,state,getRef,guard=()=>{},now=Date.now()}){
    guard();
    const folder=await handle.getDirectoryHandle("HANI_OS_photos",{create:true});
    const old=await readFile(folder,"manifest.json");
    let manifest={format:1,images:[]};
    if(old){
      if(old.size>MANIFEST_LIMIT)throw Error("PHOTO_MANIFEST");
      try{manifest=JSON.parse(await old.text())}catch(_){throw Error("PHOTO_MANIFEST")}
      if(manifest.format!==1||!Array.isArray(manifest.images)||manifest.images.some(row=>
        !/^[a-f0-9]{64}$/.test(row?.digest)||!extensions[row.mime]||
        !Number.isInteger(row.bytes)||row.bytes<1||row.bytes>PHOTO_LIMIT||!Array.isArray(row.records)||
        !/^(books|movies)\/[^/\\]+\.(jpg|png|webp|gif|avif)$/.test(row.path)))throw Error("PHOTO_MANIFEST");
    }
    const priorText=old?await old.text():null,images=new Map(manifest.images.map(row=>[row.digest,row]));
    const exportedAt=new Date(now).toISOString(),missing=[],seen=new Set();
    let backedUp=0,added=0,total=0;
    for(const [kind,field] of [["books","cover"],["movies","poster"]])for(const row of state[kind]||[]){
      if(!row||(!row[field]&&!row[field+"Ref"]))continue;
      guard();
      const record={id:String(row.id||""),type:kind==="books"?"book":"movie",title:String(row.title||"")};
      let image,mediaRef;
      try{
        const ref=row[field+"Ref"];
        let value=typeof row[field]==="string"&&row[field].startsWith("data:")?row[field]:null;
        if(!value)value=await getRef(ref);
        guard();
        image=decodePhoto(value);
        mediaRef="media:sha256:"+await hash(new TextEncoder().encode(value));
        if(ref&&ref!==mediaRef)throw Error("PHOTO_DIGEST");
      }catch(error){
        guard();missing.push({...record,reason:error.message||"PHOTO_MISSING"});continue;
      }
      const digest=await hash(image.data);record.mediaRef=mediaRef;
      if(!seen.has(digest)){total+=image.data.byteLength;if(total>PHOTO_TOTAL)throw Error("PHOTO_SIZE")}
      let entry=images.get(digest);
      if(!seen.has(digest)){
        let valid=false;
        if(entry){
          const [dir,name]=entry.path.split("/");
          try{valid=await verifiedFile(await folder.getDirectoryHandle(dir),name,image.data.length,digest)}
          catch(error){if(error.name!=="NotFoundError")throw error}
          if(entry.mime!==image.mime||entry.bytes!==image.data.length)valid=false;
        }
        if(!valid){
          const dir=await folder.getDirectoryHandle(kind,{create:true});
          const base=safeTitle(row.title)+"__"+digest.slice(0,8),ext=extensions[image.mime];
          let name,file;
          for(let suffix=0;suffix<1000;suffix++){
            name=base+(suffix?"_"+suffix:"")+"."+ext;
            const existing=await readFile(dir,name);
            if(existing){if(await verifiedFile(dir,name,image.data.length,digest)){valid=true;break}continue}
            guard();file=await dir.getFileHandle(name,{create:true});
            if((await file.getFile()).size!==0)continue;
            await writeVerified(file,image.data,guard);break;
          }
          if(!valid&&!file)throw Error("COLLISION");
          // Verify even after the collision loop: a competing file must never be accepted.
          if(!await verifiedFile(dir,name,image.data.length,digest))throw Error("HASH");
          entry={digest,mime:image.mime,bytes:image.data.length,path:kind+"/"+name,
            exportedAt,records:entry?.records||[]};
          images.set(digest,entry);if(!valid)added++;
        }
        backedUp++;seen.add(digest);
      }
      if(!entry.records.some(r=>r.id===record.id&&r.type===record.type&&r.title===record.title&&r.mediaRef===record.mediaRef))
        entry.records.push(record);
    }
    guard();
    const result={backedUp,new:added,missing:missing.length,exportedAt};
    const data=new TextEncoder().encode(JSON.stringify({format:1,exportedAt,images:[...images.values()],missing},null,2));
    if(data.length>MANIFEST_LIMIT)throw Error("PHOTO_MANIFEST");
    // Refuse to replace an edited/unknown manifest. Preserve all historical image entries.
    const current=await readFile(folder,"manifest.json");
    if((current?await current.text():null)!==priorText)throw Error("PHOTO_MANIFEST");
    guard();await writeVerified(await folder.getFileHandle("manifest.json",{create:true}),data,guard);
    return result;
  }
  root.HANI_DRIVE_VAULT_CORE=Object.freeze({due,weeklyDecision,filename,writeBackup,writePhotos,safeTitle});
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
    queueMicrotask(()=>root.renderSettlementCheck?.());
    const context=api.context(),owned=cachedOwner===context.owner;
    const row=owned?cached:null,prompt=!!row?.handle&&permission==="prompt";
    $("driveVaultChip").hidden=!prompt;
    $("driveVaultConnect").disabled=!supported||busy||!context.owner;
    $("driveVaultBackup").disabled=!supported||busy||!context.ready||!row?.handle||permission!=="granted";
    if($("driveVaultPhotos"))$("driveVaultPhotos").disabled=!supported||busy||!context.photoReady||!row?.handle||permission!=="granted";
    if($("driveVaultPhotoStatus"))$("driveVaultPhotoStatus").textContent=!supported?"":
      row?.photos?photoSummary(row.photos):"사진 백업 대기 · 백업 0장 / 신규 0장 / 누락 미확인";
    $("driveVaultReminder").textContent=prompt?
      "폴더 권한을 다시 확인하려면 ‘백업 폴더 연결’을 눌러 주세요.":
      permission==="denied"?"폴더 접근이 거부됐습니다. ‘백업 폴더 연결’에서 다시 선택해 주세요.":"";
    const photoStatus=$("settingsPhotoStatus");if(photoStatus)photoStatus.textContent=Number.isInteger(row?.photos?.missing)&&row.photos.missing>=0?row.photos.missing+"건":"확인 전";
    const last=row?.last;
    const backupStatus=$("settingsBackupStatus");if(backupStatus){
      const dates=[last?.at?new Date(last.at).getTime():NaN,Number(backupStatus.dataset.localBackupAt)||NaN].filter(Number.isFinite);
      const at=dates.length?Math.max(...dates):null;backupStatus.dataset.backupAt=at===null?"":String(at);
      backupStatus.textContent=at===null?"확인 전":new Date(at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})+" KST";
    }
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
      COLLISION:"새 파일 이름을 확보하지 못했습니다.",
      PHOTO_SIZE:"사진 백업 크기 한도(한 장 10MB, 전체 100MB)를 초과했습니다.",
      PHOTO_MANIFEST:"사진 목록을 안전하게 확인하지 못해 중단했습니다. 기존 파일은 보존됩니다."})[error?.message]||
      (error?.name==="AbortError"?"폴더 선택을 취소했습니다.":"백업을 완료하지 못했습니다. 폴더 권한·디스크 공간을 확인해 주세요."));
  }
  function photoSummary(result){return "사진 백업 "+result.backedUp+"장 / 신규 "+result.new+"장 / 누락 "+result.missing+"건"}
  function guard(ticket,photosOnly=false){
    const now=api.context();
    if(now.owner!==ticket.owner||now.epoch!==ticket.epoch||!(photosOnly?now.photoReady:now.ready))throw Error("OWNER");
  }
  async function backup(automatic=false,photosOnly=false){
    if(busy)return;
    const ticket=api.context();if(!(photosOnly||automatic?ticket.photoReady:ticket.ready))return;
    busy=true;paint();
    try{
      // One lock across accounts/tabs; re-read the weekly timestamp under the lock.
      if(!root.navigator?.locks)throw Error("LOCK");
      await root.navigator.locks.request("hani-vault-write",async()=>{
        guard(ticket,true);
        const row=await record(ticket.owner);guard(ticket,true);
        if(!row?.handle)throw Error("PERMISSION");
        if(await row.handle.queryPermission({mode:"readwrite"})!=="granted")throw Error("PERMISSION");
        guard(ticket,true);
        if(automatic&&!due(row.last)&&!due(row.photos))return;
        if(photosOnly||!automatic||due(row.photos)){
          const snapshot=api.photos(ticket);
          const check=()=>{guard(ticket,true);snapshot.guard()};
          const photos=await writePhotos({handle:row.handle,state:snapshot.state,
            getRef:ref=>root.HANI_MEDIA?.getLocal(ref),guard:check});
          check();row.photos={...photos,at:photos.exportedAt};
          await record(ticket.owner,row);guard(ticket,true);
          cached=row;cachedOwner=ticket.owner;paint();
          status(photoSummary(photos)+" · Google Drive 동기화 상태는 PC에서 확인해 주세요.");
        }
        if(!photosOnly&&ticket.ready&&(!automatic||due(row.last))){
          const last=await writeBackup({handle:row.handle,build:()=>api.build(ticket,{localOnly:true}),
            validate:api.validate,guard:()=>guard(ticket)});
          guard(ticket);row.last=last;
          await record(ticket.owner,row);guard(ticket);
          cached=row;cachedOwner=ticket.owner;
          status("Drive 폴더 저장·재읽기·SHA-256·백업 검증 완료. Google Drive 동기화 상태는 PC에서 확인해 주세요.");
        }
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
        return record(ticket.owner,{handle,last:same?prior.last:null,photos:same?prior.photos:null});
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
      const decision=weeklyDecision({ready:current.photoReady,handle:row?.handle,permission:result,
        last:due(row?.photos)?row?.photos:row?.last});
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
  function readStatus(){const context=api.context();return Object.freeze({lastAt:context.owner&&cachedOwner===context.owner?cached?.last?.at||null:null})}
  root.HANI_DRIVE_VAULT=Object.freeze({schedule,readStatus});
  if(!$("driveVaultStatus")||!api)return;
  $("driveVaultConnect").onclick=connect;
  $("driveVaultBackup").onclick=()=>backup(false);
  if($("driveVaultPhotos"))$("driveVaultPhotos").onclick=()=>backup(false,true);
  if(!supported){
    paint();
    status("PC에서 백업할 수 있어요");
    $("driveVaultReminder").textContent="iPhone에서는 7일마다 전체 JSON 백업을 내려받아 Google Drive 앱에 직접 보관해 주세요.";
    return;
  }
  doc.addEventListener("visibilitychange",()=>{if(doc.visibilityState==="visible")schedule()});
  root.addEventListener("focus",schedule);
  schedule();
})(window);
