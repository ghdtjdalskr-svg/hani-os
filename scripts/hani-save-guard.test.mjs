import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import inverse from './hani-save-guard-source.cjs';
const source=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const before=inverse.restoreSaveGuard284(inverse.projectPreRelease287Source(source,'hani-main.js'),'guard-patch-only');
const section=(s,start,end)=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
function harness(code=source){
  const nodes=new Map(),listeners=[],store=new Map(),writes=[];
  const node=()=>({hidden:true,style:{},setAttribute(){},append(...children){this.children=children},classList:{toggle(){}},textContent:''});
  const context={console:{error(){}},structuredClone,TextEncoder,Date,Error,JSON,Map,
    STORAGE_KEY:'hani_os_life_v23',VERSION:'2.9.15-safe-baseline-bootstrap',
    storageLoadedRaw:null,storageTabConflict:false,storageTabListenerBound:false,
    state:{books:[{id:'local',title:'기존 기록'}],meta:{}},loadRecovery:{active:false},
    freshState:()=>({meta:{}}),isQuotaError:()=>false,serializedBytes:s=>s.length,
    cloudApplyingRemote:false,lastLoadError:'',lastSaveResult:{},brokerDraft:null,monthlyDraft:null,
    cloudQueueSync(){},updateStorageStatus(r){context.lastSaveResult=r;context.statusRenders=(context.statusRenders||0)+1},
    $:id=>nodes.get(id),document:{createElement:node,body:{append(n){nodes.set(n.id,n)}}},
    window:{addEventListener(type,fn){listeners.push({type,fn})},location:{reload(){context.reloaded=true}}},
    localStorage:{getItem:k=>store.get(k)??null,setItem(k,v){writes.push(['set',k]);store.set(k,v)},removeItem(k){writes.push(['remove',k]);store.delete(k)}},
    normalizeState:structuredClone,cloudMergeProtectedMedia:x=>x,cloudSame:(a,b)=>JSON.stringify(a)===JSON.stringify(b),
    cloudComparableState:x=>x,cloudSaveSafetySnapshot:async()=>{context.snapshots++;return true},snapshots:0,
    renderAll(){},cloudStateHash:async()=> 'hash',cloudSaveSyncMeta:()=>({verifiedAt:'now'}),cloudRememberVerifiedRemote(){},
    cloudSetRuntime(status,message,tone,extra){context.runtime={status,message,tone,...extra}},cloudSummaryText:()=>'',toast(){},
    cloudStopAutoSync(message){context.runtime={message,sync:'STOP'}},
  };
  vm.createContext(context);
  vm.runInContext(section(source,'function loadState(', 'function readImportSyncHold('),context);
  vm.runInContext(section(source,'const STORAGE_TAB_MESSAGE=', '// Goal Registry:'),context);
  vm.runInContext(section(source,'function validateCloudRecords(', 'async function cloudReadRow('),context);
  context.assertCloudSourceReady=()=>context.assertStorageTabCurrent();
  vm.runInContext(section(code,'async function cloudApplyRemoteRow(', 'async function cloudPushLocalRow('),context);
  return {c:context,nodes,listeners,store,writes,run:s=>vm.runInContext(s,context)};
}
test('다른 탭 저장: 단일 listener, 저장 차단, 안내·수동 새로고침, 입력 보존',()=>{
  const h=harness();h.c.initStorageTabGuard();h.c.initStorageTabGuard();assert.equal(h.listeners.length,1);
  const memory=JSON.stringify(h.c.state);const raw='{"books":[{"id":"other"}]}';h.store.set(h.c.STORAGE_KEY,raw);
  h.listeners[0].fn({storageArea:h.c.localStorage,key:h.c.STORAGE_KEY,oldValue:null,newValue:raw});
  assert.equal(h.c.save().ok,false);assert.equal(JSON.stringify(h.c.state),memory);
  assert.equal(h.c.statusRenders||0,0,'차단 시 기존 입력 폼을 다시 렌더링하지 않음');
  assert.equal(h.store.get(h.c.STORAGE_KEY),raw);assert.equal(h.writes.length,0);
  const panel=h.nodes.get('storageTabConflict');assert.equal(panel.hidden,false);
  assert.equal(panel.children[0].textContent,'다른 창에서 새 기록이 저장됐어요. 새로고침하면 최신 기록으로 이어서 쓸 수 있어요.');
  assert.equal(h.c.reloaded,undefined);panel.children[1].onclick();assert.equal(h.c.reloaded,true);
});
test('자기 저장 반복은 오탐 없고 관계없는 storage 이벤트 무시',()=>{
  const h=harness();h.c.initStorageTabGuard();assert.equal(h.c.save().ok,true);assert.equal(h.c.save().ok,true);
  h.listeners[0].fn({storageArea:h.c.localStorage,key:'other',oldValue:null,newValue:'x'});
  h.listeners[0].fn({storageArea:{},key:h.c.STORAGE_KEY,oldValue:null,newValue:'x'});
  assert.equal(h.c.save().ok,true);assert.equal(h.writes.length,3);assert.equal(h.nodes.size,0);
});
test('storage 이벤트 대기 중에도 바이트 비교로 차단, 직접 write/Cloud도 차단',async()=>{
  const h=harness();h.store.set(h.c.STORAGE_KEY,'다른 탭 원본');
  assert.equal(h.c.save().ok,false);assert.throws(()=>h.c.writeProtectedState('stale'),/다른 창/);
  h.run(section(source,'function removeProtectedState(', 'function downloadRecoveryOriginal('));
  assert.throws(()=>h.c.removeProtectedState(),/다른 창/);
  await assert.rejects(h.c.cloudApplyRemoteRow({state:{books:[]}}),/다른 창/);assert.equal(h.writes.length,0);
});
test('깨진 Cloud 레코드 거부: 원본 바이트·메모리·안전 사본 이전 상태 보존',async()=>{
  for(const value of [null,[],42,{books:[null]},{tasks:{}},{ledgerMonths:[[]]},{boardPosts:['bad']}]){
    const h=harness();assert.equal(h.c.save().ok,true);const raw=h.store.get(h.c.STORAGE_KEY),memory=JSON.stringify(h.c.state),count=h.writes.length;
    await assert.rejects(h.c.cloudApplyRemoteRow({state:value,revision:2}),/Cloud 기록 형식을 확인하지 못해 이 기기 기록을 유지했어요/);
    assert.equal(h.store.get(h.c.STORAGE_KEY),raw);assert.equal(JSON.stringify(h.c.state),memory);
    assert.equal(h.writes.length,count);assert.equal(h.c.snapshots,0);assert.equal(h.c.runtime.sync,'STOP');
  }
});
test('깨진 Local 원본 격리와 복구 후 read-back 안전장치 유지',()=>{
  const h=harness();const raw='{"books":[null]}';h.store.set(h.c.STORAGE_KEY,raw);
  h.c.loadState();assert.equal(h.store.get(h.c.STORAGE_KEY),raw);assert.equal(h.c.loadRecovery.active,true);
  assert.equal(h.store.get(h.c.loadRecovery.quarantineKey),raw);assert.equal(h.c.loadRecovery.verified,true);
  const count=h.writes.length;assert.equal(h.c.save().ok,false);assert.equal(h.writes.length,count);
  h.c.state={books:[{id:'recovered'}],meta:{}};assert.equal(h.c.save({recover:true}).ok,true);
  assert.equal(h.c.loadRecovery.active,false);assert.equal(h.store.get(h.c.loadRecovery.quarantineKey),raw);
  assert.equal(JSON.parse(h.store.get(h.c.STORAGE_KEY)).books[0].id,'recovered');
});
test('Cloud 원본 읽기와 수동 복원도 같은 형식 검사로 차단',async()=>{
  for(const manual of [false,true]){
    const h=harness();h.c.save();const raw=h.store.get(h.c.STORAGE_KEY),memory=JSON.stringify(h.c.state),count=h.writes.length;
    Object.assign(h.c,{cloudUser:{id:'synthetic'},cloudClient:{},cloudOutage:{active:false},cloudSessionFullReads:0,renderCloudTransferUsage(){},cloudSyncBusy:false,importSyncHold:false,cloudAutoSyncReady:false,cloudPollTimer:null,renderCloudPanel(){},alert(){}});
    const remote={state:{books:[null]},revision:2};
    if(manual){
      h.c.cloudReadRow=async()=>remote;
      h.run(section(source,'async function cloudRestoreToLocal(', 'function cloudNeedsRestoreChoice('));
      await h.c.cloudRestoreToLocal();
    }else{
      const query={select(){return this},eq(){return this},limit(){return this},retry:async()=>({data:[remote]})};h.c.cloudClient.from=()=>query;
      h.run(section(source,'async function cloudReadRow(', 'function cloudStopAutoSync('));
      await assert.rejects(h.c.cloudReadRow(),/Cloud 기록 형식을 확인하지 못해/);
    }
    assert.equal(h.store.get(h.c.STORAGE_KEY),raw);assert.equal(JSON.stringify(h.c.state),memory);
    assert.equal(h.writes.length,count);assert.equal(h.c.snapshots,0);assert.equal(h.c.runtime.sync,'STOP');
  }
});
test('Cloud 안전 사본을 기다리는 중 다른 탭 저장도 덮어쓰지 않음',async()=>{
  const h=harness();h.c.save();const memory=JSON.stringify(h.c.state),count=h.writes.length;
  h.c.cloudSaveSafetySnapshot=async()=>{h.store.set(h.c.STORAGE_KEY,'다른 탭 최신 기록');return true};
  await assert.rejects(h.c.cloudApplyRemoteRow({state:{books:[]},revision:2}),/다른 창/);
  assert.equal(h.store.get(h.c.STORAGE_KEY),'다른 탭 최신 기록');assert.equal(JSON.stringify(h.c.state),memory);assert.equal(h.writes.length,count);
});
test('정상 Cloud: 수정 전 함수와 적용 결과·write 수·사본 수 동일',async()=>{
  const results=[];
  for(const code of [before,source]){
    const h=harness(code);h.c.save();const remote={state:{books:[{id:'remote',title:'정상 Cloud'}]},revision:2};
    assert.equal(await h.c.cloudApplyRemoteRow(remote,'hash'),true);
    results.push({raw:h.store.get(h.c.STORAGE_KEY),memory:JSON.stringify(h.c.state),writes:h.writes.length,snapshots:h.c.snapshots});
  }
  assert.deepEqual(results[1],results[0]);assert.equal(results[1].snapshots,1);
});
test('setItem/removeItem/clear 호출 수, 보호 키·내부 버전·서버 write 구조 보존',()=>{
  for(const method of ['setItem','removeItem','clear']){
    const count=s=>(s.match(new RegExp('\\.\\s*'+method+'\\s*\\(','g'))||[]).length;
    assert.equal(count(source),count(before),method+' count unchanged');
  }
  assert.equal(section(source,'async function cloudPushLocalRow(', 'function cloudSyncDecision('),section(before,'async function cloudPushLocalRow(', 'function cloudSyncDecision('));
  assert.match(source,/const STORAGE_KEY="hani_os_life_v23"/);assert.match(source,/2\.9\.15-safe-baseline-bootstrap/);
});
test('284·안전 패치 외층은 기존 283 고정 해시로 정확히 복원하고 drift·중복·재역변환 거부',()=>{
  for(const file of ['hani-main.js','index.html']){
    const raw=inverse.projectPreRelease287Source(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),file);
    const lower=inverse.restoreSaveGuard284(raw,file);
    for(const invalid of [raw+'\n',raw.slice(1),raw+raw,lower])assert.throws(()=>inverse.restoreSaveGuard284(invalid,file),/exact save-guard input/);
  }
});
