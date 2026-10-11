import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {protectedSurface} from './hani-one-pass-rules.mjs';
const source=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const extract=name=>{const match=source.match(new RegExp('(?:async )?function '+name+'\\([^\\n]*\\}[ \\t]*(?=\\n)|(?:async )?function '+name+'\\([^]*?\\n\\}'));assert.ok(match,name);return match[0]};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
function fixture(){
  const events=[],nodes=new Map();const node=id=>nodes.get(id)||nodes.set(id,{value:'',textContent:'',disabled:false,dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},focus(){},parentNode:{insertBefore(){}},append(){},addEventListener(){}}).get(id);
  const storage=new Map([['hani_os_life_v23','sentinel-life'],['unrelated','keep'],['hani_os_gate_session_v2','1'],['sb-example-auth-token','old-auth'],['sb-other-auth-token','other-auth']]);
  const writes=[];const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>{writes.push(k);storage.set(k,v)},removeItem:k=>{writes.push(k);storage.delete(k)}};
  const user={id:'owner'};
  const client={auth:{
    signInWithPassword:async input=>{events.push('auth');assert.equal(input.password,'temporary');return {data:{user}}},
    signOut:async options=>{events.push('signout');assert.equal(options.scope,'local');return {error:null}},
    onAuthStateChange:fn=>{ctx.authEvent=fn;return {data:{subscription:{unsubscribe(){}}}}}
  }};
  const ctx=vm.createContext({console:{warn(){},error(){}},URL,localStorage,sessionStorage:localStorage,window:{localStorage,sessionStorage:localStorage,supabase:{createClient:(_url,_key,options)=>{ctx.options=options;return client}},addEventListener:(name,fn)=>{ctx.listeners[name]=fn}},document:{body:{classList:{add(){},remove(){}}},querySelectorAll:()=>[],documentElement:{dataset:{}}},
    $:node,loginGateSession:false,loginGateAttempt:0,loginGateBusy:false,loginGateUnlocked:false,loginGateInitialized:true,cloudClient:client,cloudUser:null,cloudRecoveryMode:false,cloudAutoSyncReady:false,cloudRuntime:{sync:'CHECK'},loadRecovery:{active:false},importSyncHold:false,cloudChoicePreview:null,cloudComparisonEpoch:0,cloudOwnerVerificationEpoch:0,cloudAuthSubscription:null,annualReportState:{},
    CLOUD_CONFIG_KEY:'auth-config',cloudConfig:()=>({url:'https://example.supabase.co',key:'public-test',email:'owner@example.test'}),cloudSaveJson:()=>true,
    loginGateStatus:(message)=>events.push(['status',message]),cloudSetRuntime:(_status,_message,_tone,next)=>Object.assign(ctx.cloudRuntime,next),
    cloudFetchMeta:async()=>events.push('meta'),cloudSyncCycle:async reason=>{events.push(reason);ctx.cloudAutoSyncReady=true;ctx.cloudRuntime.sync='ON'},
    cloudBindLifecycle:()=>events.push('lifecycle'),unlockLoginGate:()=>{events.push('unlock');ctx.loginGateUnlocked=true},lockLoginGate:()=>{events.push('lock');ctx.loginGateUnlocked=false},renderAll:()=>events.push('render'),toast:()=>{},
    cloudOwnerVerification:null,cloudStopAutoSync:()=>{ctx.cloudAutoSyncReady=false;events.push('stop')},dataHubInvalidate:()=>{},annualReportInvalidate:()=>{},cloudCleanAuthUrl:()=>{},renderCloudPanel:()=>{},
    loginGateForgotPassword(){},loginGateSaveRecoveryPassword(){},loginGateShowCloudTools:show=>events.push(['tools',show]),loginGateCloudSlots:[],listeners:{},randomizeLoginCharacter(){},syncLoginThemeButtons(){},
    cloudSyncPending:false,cloudSyncTimer:22,setTimeout:()=>{},clearTimeout:()=>events.push('timer-stop'),queueMicrotask:()=>{},sportsCacheLoad:async()=>{},HANI_GATE_SESSION_KEY:'hani_os_gate_session_v2'});
  for(const name of ['markLoginGateSession','loginGateSessionActive','clearLoginGateSession','loginGateConfig','loginGateEnterApp','loginGateSubmit','cloudLogout','cloudCreateClient','cloudBindAuthEvents','initLoginGate'])vm.runInContext(extract(name),ctx);
  node('loginGateEmail').value='owner@example.test';node('loginGatePassword').value='temporary';
  return {ctx,events,nodes,storage,writes,node,client};
}
let cases=0;
let f=fixture();const pull=deferred();f.ctx.cloudSyncCycle=async reason=>{f.events.push(reason);await pull.promise;f.ctx.cloudAutoSyncReady=true;f.ctx.cloudRuntime.sync='ON'};
const login=f.ctx.loginGateSubmit();await new Promise(setImmediate);
assert.equal(f.ctx.loginGateUnlocked,false);assert.equal(f.node('loginGatePassword').value,'');
await f.ctx.loginGateSubmit();assert.equal(f.events.filter(e=>e==='auth').length,1,'duplicate Enter/click blocked');
pull.resolve();await login;assert.ok(f.events.indexOf('login-gate')<f.events.indexOf('unlock'));assert.equal(f.ctx.loginGateSessionActive(),true);assert.equal(f.writes.includes('hani_os_gate_session_v2'),false);cases++;
for(const fail of ['STOP','WAIT','OFFLINE','HOLD','choice','load','import','recovery']){
  f=fixture();f.ctx.cloudUser={id:'owner'};f.ctx.cloudSyncCycle=async()=>{f.ctx.cloudRuntime.sync=fail;f.ctx.cloudAutoSyncReady=fail==='choice';if(fail==='choice')f.ctx.cloudChoicePreview={};if(fail==='load')f.ctx.loadRecovery.active=true;if(fail==='import')f.ctx.importSyncHold=true};
  if(fail==='recovery')f.ctx.cloudRecoveryMode=true;
  try{assert.equal(await f.ctx.loginGateEnterApp('login-gate'),false)}catch(e){assert.equal(fail,'recovery')}
  assert.equal(f.ctx.loginGateUnlocked,false);assert.equal(f.storage.get('hani_os_life_v23'),'sentinel-life');cases++;
}
f=fixture();let tries=0;f.ctx.cloudSyncCycle=async()=>{tries++;f.ctx.cloudRuntime.sync=tries===1?'OFFLINE':'ON';f.ctx.cloudAutoSyncReady=tries>1};await f.ctx.loginGateSubmit();await f.ctx.loginGateSubmit();assert.equal(f.events.filter(e=>e==='auth').length,1);assert.equal(f.ctx.loginGateUnlocked,true);cases++;
f=fixture();f.ctx.cloudUser={id:'owner'};const meta=deferred();f.ctx.cloudFetchMeta=()=>meta.promise;const entering=f.ctx.loginGateEnterApp('login-gate');await f.ctx.cloudLogout();meta.resolve();assert.equal(await entering,false);assert.equal(f.ctx.cloudUser,null);assert.equal(f.ctx.loginGateSession,false);assert.equal(f.storage.get('hani_os_life_v23'),'sentinel-life');assert.equal(f.storage.get('unrelated'),'keep');cases++;
f=fixture();f.ctx.cloudUser={id:'owner'};f.client.auth.signOut=async()=>{throw Error('offline')};await f.ctx.cloudLogout();assert.equal(f.ctx.loginGateUnlocked,false);assert.equal(f.ctx.cloudClient,null);assert.equal(f.storage.get('hani_os_life_v23'),'sentinel-life');cases++;
f=fixture();f.ctx.cloudCreateClient(f.ctx.cloudConfig());assert.equal(f.ctx.options.auth.persistSession,false);assert.equal(Object.hasOwn(f.ctx.options.auth,'storage'),false);assert.equal(f.storage.has('sb-example-auth-token'),false);assert.equal(f.storage.get('sb-other-auth-token'),'other-auth');assert.equal(f.storage.get('hani_os_life_v23'),'sentinel-life');f.ctx.cloudUser={id:'owner'};f.ctx.authEvent('SIGNED_OUT',null);assert.equal(f.ctx.cloudUser,null);assert.equal(f.ctx.loginGateUnlocked,false);cases++;
f=fixture();f.ctx.initLoginGate();assert.equal(f.ctx.loginGateSessionActive(),false);assert.equal(f.node('loginGateSubmit').disabled,true);f.ctx.cloudUser={id:'owner'};f.ctx.listeners.pagehide();assert.equal(f.ctx.cloudUser,null);assert.equal(f.ctx.loginGateUnlocked,false);assert.equal(f.storage.get('hani_os_life_v23'),'sentinel-life');f.ctx.listeners.pageshow({persisted:true});assert.equal(f.events.at(-1),'lock');cases++;
f=fixture();f.ctx.cloudCreateClient(f.ctx.cloudConfig());f.ctx.cloudUser={id:'new-owner'};f.ctx.cloudClient={};f.ctx.authEvent('SIGNED_OUT',null);assert.equal(f.ctx.cloudUser.id,'new-owner','stale client auth callback ignored');cases++;
f=fixture();f.ctx.cloudUser={id:'owner'};const signout=deferred();f.client.auth.signOut=()=>signout.promise;const leaving=f.ctx.cloudLogout();f.ctx.cloudClient={auth:{}};f.ctx.cloudAuthSubscription={unsubscribe(){throw Error('new subscription must survive')}};signout.reject(Error('offline old session'));await leaving;assert.ok(f.ctx.cloudClient.auth);assert.ok(f.ctx.cloudAuthSubscription,'failed old signout cannot detach new client');cases++;
const urls=vm.createContext({URL,location:{href:'https://example.test/index.html#organization/people/hani'},document:{title:'Test'},history:{replaceState(_a,_b,url){urls.result=url}},console});vm.runInContext(extract('cloudCleanAuthUrl'),urls);
urls.cloudCleanAuthUrl({preserveRoute:true});assert.equal(urls.result,'/index.html#organization/people/hani');
urls.location.href='https://example.test/index.html?code=synthetic#access_token=synthetic&type=recovery';urls.cloudCleanAuthUrl({preserveRoute:true});assert.equal(urls.result,'/index.html');cases++;
// Same protected owner functions, aliases and keyboard use the existing canonical view path.
const route=vm.createContext({});vm.runInContext(extract('organizationRoute'),route);
for(const [value,tab] of [['organization','overview'],['aiTeam','aiTeam'],['characterArchive','archive'],['organization/people/hani','people']]){assert.equal(route.organizationRoute(value).tab,tab);cases++}
assert.equal(route.organizationRoute('organization/people/<img>').person,'');assert.equal(route.organizationRoute('board'),null);
assert.match(html,/<div class="app login-locked"[^>]*inert/);assert.match(html,/role="tablist" aria-label="회사 소개 탭"/);
assert.match(html,/id="loginGateTitle">HANI OS 입장 화면/);
assert.deepEqual([...html.matchAll(/data-organization-tab="[^"]+"[^>]*>([^<]+)</g)].map(m=>m[1]),['개요','조직도','M9 + MIR','AI 팀']);
vm.runInContext(extract('settingsRoute'),route);
for(const [value,tab] of [['policy','policy'],['settings/policy','policy'],['settings','data'],['settings/data','data'],['settings/unknown','data']]){assert.equal(route.settingsRoute(value),tab);cases++}
assert.equal(route.settingsRoute('board'),null);
const tabButtons=['data','policy'].map(tab=>({dataset:{settingsTab:tab},tabIndex:0,attributes:{},setAttribute(k,v){this.attributes[k]=v},getAttribute(){return tab}}));
const panels={data:{hidden:false},policy:{hidden:true}},policyCalls=[];
const tabsContext=vm.createContext({document:{querySelectorAll:()=>tabButtons},$:id=>panels[id],setTimeout:fn=>fn(),agentPolicyInit:()=>policyCalls.push('init')});
vm.runInContext(extract('selectSettingsTab'),tabsContext);
tabsContext.selectSettingsTab('policy');assert.equal(panels.data.hidden,true);assert.equal(panels.policy.hidden,false);assert.equal(tabButtons[1].attributes['aria-selected'],'true');assert.equal(tabButtons[0].tabIndex,-1);assert.equal(policyCalls.length,1);
tabsContext.selectSettingsTab('data');assert.equal(panels.data.hidden,false);assert.equal(panels.policy.hidden,true);assert.equal(tabButtons[0].tabIndex,0);cases++;
// The real navigation owner normalizes legacy policy links and closes the drawer.
const routeNodes=new Map(),routeHashes=[],drawer=[];
const routeNode=id=>routeNodes.get(id)||routeNodes.set(id,{dataset:{},classList:{add(){},remove(name){if(id==='app')drawer.push(name)},toggle(){}},setAttribute(){}}).get(id);
const canonical=vm.createContext({document:{body:{dataset:{}},querySelectorAll:s=>s==='[data-settings-tab]'?tabButtons:[],querySelector:()=>null},$:id=>id==='data'||id==='policy'?panels[id]:routeNode(id),window:{scrollTo(){}},history:{replaceState(_a,_b,hash){routeHashes.push(hash)}},location:{hash:'',href:'https://fixture.test/'},pageMeta:{settings:['설정·데이터','설정 및 사내 규칙','work']},navigationTimer:null,navigationBooted:false,NAVIGATION_VIEWS:new Set(['settings']),loginGateUnlocked:false,clearTimeout(){},setTimeout:fn=>fn(),agentPolicyInit(){},setBanner(){},updateFinishScope(){},cloudUser:null});
canonical.renderNavNewBadges=()=>{};
vm.runInContext(source.match(/const INVESTMENT_COMMITTEE_VIEW=[^\n]+/)[0],canonical);
for(const name of ['organizationRoute','settingsRoute','selectSettingsTab','showView'])vm.runInContext(extract(name),canonical);
for(const value of ['policy','settings/policy','settings']){
  canonical.showView(value);assert.equal(canonical.document.body.dataset.view,'settings');assert.equal(routeHashes.at(-1),value==='settings'?'#settings/data':'#settings/policy');assert.equal(panels.policy.hidden,value==='settings');assert.equal(drawer.at(-1),'mobile-open');cases++;
}
const listeners={},focus=[];
tabButtons.forEach(button=>{button.focus=()=>focus.push(button.dataset.settingsTab)});
canonical.document.querySelector=s=>s==='.settings-tabs'?{addEventListener:(name,fn)=>{listeners[name]=fn},querySelectorAll:()=>tabButtons}:null;
const binding=source.slice(source.indexOf('const settingsTabs=document.querySelector('),source.indexOf('window.addEventListener("hashchange"'));
vm.runInContext(binding,canonical);
for(const [key,index,next] of [['ArrowRight',0,'policy'],['ArrowLeft',0,'policy'],['Home',1,'data'],['End',0,'policy']]){
  let prevented=false;listeners.keydown({key,target:tabButtons[index],preventDefault(){prevented=true}});assert.equal(prevented,true);assert.equal(focus.at(-1),next);assert.equal(routeHashes.at(-1),'#settings/'+next);cases++;
}
listeners.click({target:{closest:()=>tabButtons[0]}});assert.equal(routeHashes.at(-1),'#settings/data');cases++;
assert.match(source,/event\.key==="ArrowRight"/);assert.match(source,/event\.key==="Home"/);
assert.match(html,/id="loginGateFinish"/);assert.match(extract('initLoginGate'),/applySignatureFinish\(e.target.value,true\)/);
assert.match(extract('lockLoginGate'),/app\.inert=true/);assert.match(extract('unlockLoginGate'),/app\.inert=false/);
assert.match(extract('lockLoginGate'),/textContent="HANI OS 입장 화면"/);
console.log('PASS nav/login '+cases+' cases: Cloud-before-entry, retry/guards, logout races, memory auth, lifecycle, aliases and design picker');
if(process.argv[2]){
  const baseline=fs.readFileSync(process.argv[2],'utf8').replace(/\r\n/g,'\n');
  const contract={required_storage_key:'hani_os_life_v23',required_internal_version:'2.9.15-safe-baseline-bootstrap'};
  assert.deepEqual(protectedSurface(source,contract),protectedSurface(baseline,contract));
  for(const name of ['writeProtectedState','removeProtectedState','cloudSaveSafetySnapshot','cloudApplyRemoteRow','cloudPushLocalRow']){
    const match=baseline.match(new RegExp('(?:async )?function '+name+'\\([^]*?\\n\\}'));assert.ok(match,name+' baseline');assert.equal(extract(name),match[0],name+' original write/backup path');
  }
  console.log('PASS baseline protected surface and five canonical write/backup functions unchanged');
}
