// Executes complete existing UI owners with synthetic DOM and service boundaries.
// This covers status provenance without claiming browser layout/event verification.
import assert from 'node:assert/strict';
import vm from 'node:vm';
export async function verifySettingsStatusProjection(main,vault){
 const between=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start,a);return s.slice(start,end)};
 const nodes=new Map(),writes=[];
 const node=()=>({textContent:'',innerHTML:'',dataset:{},style:{},hidden:true,open:false,children:[],classList:{toggle(){},add(){},remove(){}},replaceChildren(){this.children=[]},append(e){this.children.push(e)}});
 const $=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
 const noop=()=>{};
 const state={meta:{},transactions:[],body:[],exercise:[],books:[],movies:[],diaries:[],tasks:[]};
 const sandbox={$,state,console,Date,Number,JSON,Promise,window:{},document:{createElement:node},loadRecovery:{active:false},lastSaveResult:null,lastLoadError:'',importSyncHold:false,
  STORAGE_KEY:'hani_os_life_v23',localStorage:{getItem:()=>'{"preserved":true}',setItem:()=>writes.push('setItem'),removeItem:()=>writes.push('removeItem'),clear:()=>writes.push('clear')},
  renderMediaCControls:noop,mediaBBusy:false,mediaCBusy:false,mediaBCanRun:()=>false,mediaRunB:noop,bytesLabel:String,
  renderDataHubLibrary:noop,renderGoalRegistry:noop,haniCareNotice:noop,serializedBytes:s=>s.length,
  googleDriveRender:noop,renderCloudTransferUsage:noop,CLOUD_SYNC_ENGINE:'fixture',cloudUser:null,cloudRecoveryMode:false,cloudRuntime:{status:'',tone:'warn'},cloudAutoSyncReady:false,cloudOutage:{active:false},
  cloudSyncPolicy:()=> 'manual',cloudHasMeaningfulLocalData:()=>false,cloudSyncBusy:false,cloudApplyingRemote:false,cloudMeta:()=>({}),cloudLocalStatusLabel:()=>'',cloudSummaryText:()=>'',
  cloudCompare:noop,cloudOwnerVerificationBusy:false,renderCloudChoice:noop,formatDateTime:s=>s||'-',esc:String,
  safetyArchiveStatus:'',safetyArchiveList:async()=>[],mediaHasRefs:()=>false,downloadJson:noop};
 const ctx=vm.createContext(sandbox);
 vm.runInContext(between(main,'function renderMediaPreview(){','function bookCard(')+between(main,'function renderStoragePanel(){','function commit(')+between(main,'function renderCloudPanel(){','async function cloudFetchMeta(')+between(main,'async function renderSafetyArchive(){','async function cloudSaveSafetySnapshot('),ctx);
 for(const id of ['settingsSaveStatus','settingsCloudStatus','settingsBackupStatus','settingsPhotoStatus'])$(id).textContent='확인 전';
 ctx.renderStoragePanel();
 assert.deepEqual(['settingsSaveStatus','settingsCloudStatus','settingsBackupStatus','settingsPhotoStatus'].map(id=>$(id).textContent),['확인 전','확인 전','확인 전','확인 전']);
 ctx.lastSaveResult={ok:true};ctx.renderStoragePanel();assert.equal($('settingsSaveStatus').textContent,'저장 정상');
 ctx.lastSaveResult={ok:false};ctx.renderStoragePanel();assert.equal($('settingsSaveStatus').textContent,'저장 실패');assert.equal($('settingsStorageInfo').open,true);
 ctx.loadRecovery.active=true;ctx.renderStoragePanel();assert.equal($('settingsSaveStatus').textContent,'원본 보호 중');assert.equal($('loadRecoveryPanel').hidden,false);ctx.loadRecovery.active=false;
 ctx.lastSaveResult=null;$('settingsStorageInfo').open=false;ctx.importSyncHold=true;ctx.renderStoragePanel();assert.equal($('settingsStorageInfo').open,true);assert.match($('storageMessage').textContent,/자동 반영을 보류/);ctx.importSyncHold=false;
 ctx.window.HANI_MEDIA={dryRunReport:()=>({count:5,inlineBytes:0,estimatedAfterBytes:30})};ctx.renderMediaPreview();assert.equal($('settingsMediaStatus').textContent,'완료됨');
 ctx.window.HANI_MEDIA={dryRunReport:()=>null};ctx.renderMediaPreview();assert.equal($('settingsMediaStatus').textContent,'확인 전');
 ctx.window.HANI_MEDIA={dryRunReport:()=>{throw Error('synthetic read failure')}};ctx.renderMediaPreview();assert.equal($('settingsMediaStatus').textContent,'확인 전');assert.equal($('group-storage').open,true);
 ctx.window.HANI_MEDIA=null;ctx.window.HANI_DRIVE_VAULT={schedule:noop};ctx.renderCloudPanel();assert.equal($('settingsBackupStatus').textContent,'확인 전');
 ctx.safetyArchiveList=async()=>[{id:1,verified:true,payload:{savedAt:'2026-10-19T10:00:00Z',state}},{id:2,verified:false,payload:{savedAt:'2026-10-21T10:00:00Z',state}}];
 await ctx.renderSafetyArchive();assert.equal($('settingsBackupStatus').dataset.backupAt,String(Date.parse('2026-10-19T10:00:00Z')));assert.equal($('safetyArchiveList').children.length,1);
 ctx.window.HANI_DRIVE_VAULT={schedule:noop,readStatus:()=>({lastAt:'2026-10-20T10:00:00Z'})};ctx.renderCloudPanel();assert.equal($('settingsBackupStatus').dataset.backupAt,String(Date.parse('2026-10-20T10:00:00Z')));
 ctx.safetyArchiveList=async()=>[];ctx.window.HANI_DRIVE_VAULT=null;await ctx.renderSafetyArchive();assert.equal($('settingsBackupStatus').textContent,'확인 전');
 const photo=vm.createContext({$,root:{},api:{context:()=>({owner:'owner'})},cachedOwner:'owner',cached:null,permission:'granted',busy:false,supported:true,queueMicrotask:noop,Date,Number});
 vm.runInContext(between(vault,'  function paint(){','  function fail(')+between(vault,'  function photoSummary(','  function guard('),photo);
 for(const missing of [undefined,null,-1,'0',0,3]){
  photo.cached={photos:{missing,backedUp:2,new:0}};photo.paint();assert.equal($('settingsPhotoStatus').textContent,Number.isInteger(missing)&&missing>=0?missing+'건':'확인 전');
 }
 photo.cachedOwner='another-owner';photo.paint();assert.equal($('settingsPhotoStatus').textContent,'확인 전');
 const group={open:false,dataset:{}},host={hidden:true,append(n){n.parentNode=this}},parent={insertBefore(n,next){assert.equal(next,null);n.parentNode=this}},bridge={parentNode:parent,querySelector:()=>group};
 const gate=vm.createContext({$:()=>host,loginGateCloudSlots:[{node:bridge,parent,next:null}]});
 vm.runInContext(between(main,'function loginGateShowCloudTools(','function loginGateConnectionReady('),gate);
 for(const open of [false,true]){
  group.open=open;gate.loginGateShowCloudTools(true);gate.loginGateShowCloudTools(true);assert.equal(group.open,true);assert.equal(bridge.parentNode,host);
  gate.loginGateShowCloudTools(false);assert.equal(bridge.parentNode,parent);assert.equal(group.open,open);assert.equal(group.dataset.gateOpen,undefined);
 }
 assert.deepEqual(writes,[],'complete status owners never write to storage');
 return 'save/error/protection/hold, media unknown/zero/failure, verified history/Vault dates, photo manifest unknown/zero/missing/account switch, login slot session restore; zero storage writes';
}
