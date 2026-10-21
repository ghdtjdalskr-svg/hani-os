// Full app / real gate and save paths. Synthetic Auth/Cloud only; all other external requests are aborted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://test').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||pathname.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,cloud='https://offline-fixture.supabase.co';
const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
const evidence=path.join(root,'.ai-budget-private/offline-entry-223');fs.mkdirSync(evidence,{recursive:true});let cases=0;
const owner={id:'verified-owner',email:'owner@example.invalid'};
async function fixture(width=390){
  const context=await browser.newContext({viewport:{width,height:950}}),wire=[],errors=[];
  const remote={state:null,revision:7,updated_at:'2026-10-20T00:00:00Z'},status={code:200,abort:false};
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin)return route.continue();
    if(url.origin!==cloud)return route.abort();
    wire.push({path:url.pathname,method:route.request().method(),select:url.searchParams.get('select')});
    if(status.abort)return route.abort('failed');
    if(status.code!==200)return route.fulfill({status:status.code,contentType:'application/json',body:JSON.stringify({message:'synthetic unavailable'})});
    if(route.request().method()==='PATCH'){const write=route.request().postDataJSON();remote.state=write.state;remote.revision++;}
    const body=url.pathname.endsWith('/settings')?{}:url.pathname.endsWith('/user')?{user:owner}:url.pathname.endsWith('/token')?{user:status.loginOwner||owner,access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600}:[{...remote,user_id:owner.id}];
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await context.addInitScript(({cloud,owner})=>{
    const key='sb-offline-fixture-auth-token';
    if(!localStorage.getItem('fixture-seeded')){
      localStorage.setItem('fixture-seeded','1');
      localStorage.setItem('hani_os_cloud_config_v1',JSON.stringify({url:cloud,key:'public-anon-fixture',email:owner.email}));
      localStorage.setItem('hani_os_life_v23',JSON.stringify({accounts:[],books:[{id:'book-1',title:'이 기기 원본 기록',status:'read',completedDate:'2026-10-01',author:'합성',topic:'교양',rating:4,review:'보존',cover:''}]}));
    }
    const set=Storage.prototype.setItem;
    window.primaryWrites=[];
    Storage.prototype.setItem=function(k,v){if(k==='hani_os_life_v23')primaryWrites.push({value:v,stack:new Error().stack});return set.call(this,k,v)};
    window.supabase={createClient:(_url,_key,options)=>{
      const listeners=new Set(),request=async(route,init)=>{
        const r=await options.global.fetch(cloud+route,init);const d=await r.json();return r.ok?{data:d}:{error:{message:'synthetic '+r.status,status:r.status},status:r.status};
      };
      const client={auth:{
        async getSession(){if(localStorage.getItem('fixture-delay-auth'))await new Promise(resolve=>{window.fixtureReleaseAuth=resolve});return {data:{session:JSON.parse(localStorage.getItem(key)||'null')}}},
        getUser:async()=>request('/auth/v1/user'),
        async signInWithPassword(){const r=await request('/auth/v1/token',{method:'POST'});if(r.data)localStorage.setItem(key,JSON.stringify(r.data));return r},
        async signOut(){localStorage.removeItem(key);for(const fn of listeners)fn('SIGNED_OUT',null);return {}},
        stopAutoRefresh:async()=>{},
        onAuthStateChange(fn){listeners.add(fn);return {data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}}},
      },from(table){
        const params=new URLSearchParams();let update=null;const q={select:x=>{params.set('select',x);return q},eq:(k,v)=>{params.set(k,'eq.'+v);return q},limit:x=>{params.set('limit',x);return q},retry:()=>q,
          async then(resolve,reject){try{resolve(await request('/rest/v1/'+table+'?'+params,update?{method:'PATCH',body:JSON.stringify(update)}:undefined))}catch(e){if(reject)reject(e);else throw e}},
          insert(){throw Error('unexpected Cloud insert')},update(value){update=value;return q},upsert(){throw Error('unexpected Cloud upsert')}};return q;
      }};return client;
    }};
  },{cloud,owner});
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.goto(origin);await page.waitForFunction(()=>typeof loginGateInitialized==='boolean'&&loginGateInitialized);
  remote.state=await page.evaluate(()=>structuredClone(state));
  const baseline=await page.evaluate(()=>localStorage.getItem(STORAGE_KEY));
  async function verifyOwner(){
    await page.locator('#loginGatePassword').fill('synthetic-password');await page.locator('#loginGateSubmit').click();
    await page.waitForFunction(()=>loginGateUnlocked);
    try{await page.waitForFunction(()=>!!cloudMeta().offlineOwner)}catch(error){console.log(await page.evaluate(()=>({runtime:cloudRuntime,binding:dataHubBinding(),gate:loginGateUnlocked,hub:dataHubRuntime?.peek()})));throw error}
    assert.equal(await page.evaluate(()=>cloudMeta().offlineOwner.sourceOwnerId),owner.id);
    assert.equal(await page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),baseline,'verification never rewrites Local');
  }
  async function logoutForOutage(code=402,abort=false){
    await page.evaluate(()=>{clearLoginGateSession();localStorage.removeItem('sb-offline-fixture-auth-token')});
    status.code=code;status.abort=abort;await page.reload();await page.waitForFunction(()=>loginGateInitialized);
    await page.evaluate(()=>offlineEntryCheck());
    if(await page.locator('#loginGateOffline').isHidden()&&(code===402||abort))console.log('entry diagnostics',await page.evaluate(async()=>({proof:offlineEntryProof(),unreachable:offlineEntry.unreachable,probe:!!offlineEntry.probe,local:!!await offlineEntryLocal(),hash:await cloudStateHash(state),disk:await cloudStateHash(normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)))),user:cloudUser,gate:loginGateUnlocked})));
  }
  return {context,page,wire,errors,remote,status,baseline,verifyOwner,logoutForOutage};
}
async function scenario(name,fn,width){const f=await fixture(width);try{await fn(f);assert.deepEqual(f.errors,[]);cases++;console.log('PASS '+name)}finally{await f.context.close()}}
try{
  for(const width of [390,1440])await scenario('402 entry / real UI save / zero requests / relogin '+width,async f=>{
    const {page}=f;await f.verifyOwner();await f.logoutForOutage();
    await page.locator('#loginGateOffline').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),f.baseline);
    await page.locator('#loginGateOffline').click();await page.waitForFunction(()=>offlineEntry.active&&loginGateUnlocked);
    assert.equal(await page.evaluate(()=>cloudUser),null);assert.equal(await page.evaluate(()=>cloudClient),null);
    assert.equal(await page.locator('#offlineEntryBadge').innerText(),'오프라인 · 이 기기 기록 · Cloud 복구 후 로그인\n다시 로그인');
    assert.equal(await page.evaluate(()=>primaryWrites.length),0,'entry never writes protected Local');
    await page.evaluate(()=>showView('reading'));assert.match(await page.locator('#reading').innerText(),/이 기기 원본 기록/);
    const before=f.wire.length;
    await page.locator('[data-phase1-form="reading"] summary').click();await page.locator('#bookTitle').fill('오프라인에서 추가한 책');
    await page.locator('#saveBook').click();await page.waitForFunction(()=>state.books.length===2);await page.evaluate(()=>offlineEntry.proofWrite);
    const saved=await page.evaluate(()=>({books:JSON.parse(localStorage.getItem(STORAGE_KEY)).books,writes:primaryWrites}));
    assert.equal(saved.books.length,2);assert.ok(saved.writes.length>0);assert.ok(saved.writes.every(w=>/writeProtectedState/.test(w.stack)&&/\bsave\b/.test(w.stack)),'all protected writes use canonical save');
    f.status.code=200;
    await page.evaluate(async()=>{
      window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));document.dispatchEvent(new Event('visibilitychange'));
      await cloudSyncCycle('manual');await cloudProbeOutage(true);
      await cloudReadFetch(cloudConfig().url+'/functions/v1/synthetic',{method:'POST'}).catch(()=>{});
      await agentApi('synthetic').catch(()=>{});
    });await page.waitForTimeout(1600);
    assert.equal(f.wire.length,before,'no Supabase request after offline entry, even when healthy again');
    await page.locator('#offlineEntryBadge').screenshot({path:path.join(evidence,`badge-${width}.png`)});
    // Reload retains only the verified Local capability, never a fabricated auth session.
    f.status.code=402;await page.reload();await page.waitForFunction(()=>loginGateInitialized);
    await page.locator('#loginGateOffline').waitFor({state:'visible'});await page.locator('#loginGateOffline').click();
    await page.waitForFunction(()=>offlineEntry.active);assert.equal(await page.evaluate(()=>state.books.length),2);
    await page.locator('#offlineEntryLogin').click();await page.waitForFunction(()=>!loginGateUnlocked);
    assert.equal(await page.locator('#offlineEntryBadge').isVisible(),false);assert.equal(await page.locator('#app').evaluate(e=>e.inert),true);
    f.status.code=200;
    // Snapshot must exist before the first REST read, and preserve the offline addition even if Cloud wins.
    await page.evaluate(()=>{
      window.syncOrder=[];const backup=cloudSaveSafetySnapshot,read=cloudReadRow;
      cloudSaveSafetySnapshot=async(...args)=>{syncOrder.push(args[0]);return backup(...args)};
      cloudReadRow=async(...args)=>{if(!syncOrder.includes('before_offline_relogin_sync'))throw Error('sync before backup');return read(...args)};
    });
    await page.locator('#loginGatePassword').fill('synthetic-password');await page.locator('#loginGateSubmit').click();await page.waitForFunction(()=>loginGateUnlocked);
    assert.equal(await page.evaluate(()=>syncOrder[0]),'before_offline_relogin_sync');
    assert.equal(await page.evaluate(()=>cloudMeta().offlinePending),false);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(CLOUD_SAFETY_KEY)).state.books.length),2);
  },width);
  for(const code of [200,400,401,403,404])await scenario(code+' reachable hides entry',async f=>{await f.verifyOwner();await f.logoutForOutage(code);await f.page.evaluate(()=>offlineEntryCheck());assert.equal(await f.page.locator('#loginGateOffline').isVisible(),false)});
  for(const [code,abort] of [[402,false],[429,false],[500,false],[503,false],[200,true]])await scenario((abort?'network abort':code)+' outage offers verified Local',async f=>{await f.verifyOwner();await f.logoutForOutage(code,abort);await f.page.locator('#loginGateOffline').waitFor({state:'visible'})});
  for(const kind of ['no-proof','empty','mismatch','proof-owner-mismatch','auth-mismatch','recovery','password-recovery','choice','import-hold','cross-tab-hold','read-error','malformed','tampered'])await scenario(kind+' refuses entry and preserves original',async f=>{
    await f.verifyOwner();await f.logoutForOutage();
    await f.page.evaluate(kind=>{
      if(kind==='no-proof'){const m=cloudMeta();delete m.offlineOwner;cloudSaveJson(CLOUD_META_KEY,m)}
      if(kind==='empty'){state=freshState();writeProtectedState(JSON.stringify(state))}
      if(kind==='mismatch')cloudUser={id:'other-owner'};
      if(kind==='proof-owner-mismatch'){const m=cloudMeta();m.offlineOwner.sourceOwnerId='other-owner';cloudSaveJson(CLOUD_META_KEY,m)}
      if(kind==='auth-mismatch')localStorage.setItem('sb-offline-fixture-auth-token',JSON.stringify({user:{id:'other-owner'}}));
      if(kind==='recovery')loadRecovery.active=true;
      if(kind==='password-recovery')cloudRecoveryMode=true;
      if(kind==='choice')cloudChoicePreview={owner:'verified-owner'};
      if(kind==='import-hold')importSyncHold=true;
      if(kind==='cross-tab-hold')localStorage.setItem(IMPORT_SYNC_HOLD_KEY,'synthetic-hold');
      if(kind==='read-error'){const get=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===STORAGE_KEY)throw Error('denied');return get.call(this,k)}}
      if(kind==='malformed')localStorage.setItem(STORAGE_KEY,'{broken');
      if(kind==='tampered'){const x=JSON.parse(localStorage.getItem(STORAGE_KEY));x.books[0].title='another dataset';localStorage.setItem(STORAGE_KEY,JSON.stringify(x))}
      window.denyRaw=kind==='read-error'?null:localStorage.getItem(STORAGE_KEY);primaryWrites.length=0;
    },kind);
    await f.page.evaluate(async()=>{await offlineEntryCheck();await loginGateEnterApp('offline-local')});
    assert.equal(await f.page.locator('#loginGateOffline').isVisible(),false);assert.equal(await f.page.evaluate(()=>loginGateUnlocked),false);
    assert.equal(await f.page.evaluate(()=>primaryWrites.length),0);
    if(kind!=='read-error')assert.equal(await f.page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),await f.page.evaluate(()=>denyRaw));
  });
  await scenario('healthy transition between display and click refuses stale entry',async f=>{await f.verifyOwner();await f.logoutForOutage();await f.page.locator('#loginGateOffline').waitFor({state:'visible'});f.status.code=200;await f.page.locator('#loginGateOffline').click();assert.equal(await f.page.evaluate(()=>offlineEntry.active),false);assert.equal(await f.page.locator('#loginGateOffline').isVisible(),false)});
  await scenario('backup denial blocks first sync and keeps offline edits',async f=>{
    await f.verifyOwner();await f.logoutForOutage();await f.page.locator('#loginGateOffline').waitFor({state:'visible'});await f.page.locator('#loginGateOffline').click();await f.page.waitForFunction(()=>offlineEntry.active);
    await f.page.locator('#offlineEntryLogin').click();f.status.code=200;
    await f.page.evaluate(()=>{cloudSaveSafetySnapshot=async()=>false});const start=f.wire.length;
    await f.page.locator('#loginGatePassword').fill('synthetic-password');await f.page.locator('#loginGateSubmit').click();await f.page.waitForFunction(()=>!loginGateBusy);
    assert.equal(await f.page.evaluate(()=>loginGateUnlocked),false);assert.equal(await f.page.evaluate(()=>cloudMeta().offlinePending),true);
    assert.equal(f.wire.slice(start).filter(x=>x.path.startsWith('/rest/')).length,0);assert.equal(await f.page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),f.baseline);
  });
  await scenario('other-account login refuses first sync; correct account can retry',async f=>{
    await f.verifyOwner();await f.logoutForOutage();await f.page.locator('#loginGateOffline').waitFor({state:'visible'});await f.page.locator('#loginGateOffline').click();await f.page.waitForFunction(()=>offlineEntry.active);
    await f.page.locator('#offlineEntryLogin').click();f.status.code=200;f.status.loginOwner={id:'other-owner',email:'other@example.invalid'};const start=f.wire.length;
    await f.page.locator('#loginGatePassword').fill('synthetic-password');await f.page.locator('#loginGateSubmit').click();await f.page.waitForFunction(()=>!loginGateBusy);
    assert.equal(await f.page.evaluate(()=>loginGateUnlocked),false);assert.equal(await f.page.evaluate(()=>cloudUser),null);assert.equal(await f.page.evaluate(()=>cloudMeta().offlinePending),true);
    assert.equal(f.wire.slice(start).filter(x=>x.path.startsWith('/rest/')).length,0);assert.equal(await f.page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),f.baseline);
    f.status.loginOwner=null;await f.page.locator('#loginGatePassword').fill('synthetic-password');await f.page.locator('#loginGateSubmit').click();await f.page.waitForFunction(()=>loginGateUnlocked);
  });
  await scenario('hung initial Auth does not block Local; late Auth cannot reopen session',async f=>{
    await f.verifyOwner();await f.page.evaluate(()=>{clearLoginGateSession();localStorage.removeItem('sb-offline-fixture-auth-token');localStorage.setItem('fixture-delay-auth','1')});f.status.code=402;
    await f.page.reload();await f.page.locator('#loginGateOffline').waitFor({state:'visible'});
    assert.equal(await f.page.evaluate(()=>loginGateInitialized),false);
    await f.page.locator('#loginGateOffline').click();await f.page.waitForFunction(()=>offlineEntry.active&&loginGateUnlocked);
    const before=f.wire.length;await f.page.evaluate(()=>fixtureReleaseAuth());await f.page.waitForFunction(()=>loginGateInitialized);
    assert.equal(await f.page.evaluate(()=>cloudUser),null);assert.equal(await f.page.evaluate(()=>cloudClient),null);
    assert.equal(await f.page.evaluate(()=>loginGateUnlocked&&offlineEntry.active),true);assert.equal(f.wire.length,before);
    assert.equal(await f.page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),f.baseline);
  });
  console.log(`PASS ${cases} offline-entry browser scenarios; protected writes only through normal save; no production data used.`);
}finally{await browser.close();await new Promise(r=>server.close(r))}
