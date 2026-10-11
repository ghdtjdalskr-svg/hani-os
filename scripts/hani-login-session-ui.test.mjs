/* Actual app entry path; synthetic Auth/Cloud only, never an owner account. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://test').pathname).replace(/^\/hani-os\//,'/');
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,url=origin+'/hani-os/';let browser;
async function prepare(context){
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await context.addInitScript(()=>{
    const key='sb-synthetic-auth-token',listeners=[];
    let ready,available=false;const pending=new Promise(r=>ready=r);
    window.sessionFixture={release(){available=true;ready()},checks:[],authCalls:0,rejectUser:false};
    const session=()=>{try{return JSON.parse(localStorage.getItem(key))}catch{return null}};
    window.supabase={createClient:(_url,_key,options)=>{
      if(!options.auth.persistSession)throw Error('persistent existing auth required');
      return {auth:{
        async getSession(){if(!available)await pending;return {data:{session:session()}}},
        async getUser(){return sessionFixture.rejectUser?{error:Error('revoked')}:{data:{user:session()?.user||null}}},
        async signInWithPassword(){sessionFixture.authCalls++;const value={user:{id:'synthetic-owner',email:'synthetic@example.test'},expires_at:Math.floor(Date.now()/1000)+3600};localStorage.setItem(key,JSON.stringify(value));return {data:{user:value.user,session:value}}},
        async signOut(){localStorage.removeItem(key);listeners.forEach(fn=>fn('SIGNED_OUT',null));return {error:null}},
        onAuthStateChange(fn){listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}}
      }};
    }};
  });
}
async function boot(page){
  await page.goto(url);await page.waitForFunction(()=>typeof cloudFetchMeta==='function'&&window.sessionFixture);
  await page.evaluate(()=>{
    cloudFetchMeta=async()=>{};sportsCacheLoad=async()=>false;
    cloudSyncCycle=async reason=>{sessionFixture.checks.push(reason);cloudAutoSyncReady=true;cloudRuntime.sync='ON'};
    sessionFixture.release();
  });
  await page.waitForFunction(()=>loginGateInitialized);
}
try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:1000}});await prepare(context);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
    assert.equal(await page.evaluate(()=>loginGateUnlocked),false,'absent marker gates entry');
    const lifeBefore=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    await page.locator('#loginGateEmail').fill('synthetic@example.test');await page.locator('#loginGatePassword').fill('fixture-password');await page.locator('#loginGateSubmit').click();
    await page.waitForFunction(()=>loginGateUnlocked);
    const cookie=(await context.cookies()).find(c=>c.name==='hani_login_session');
    assert.ok(cookie);assert.equal(cookie.path,'/hani-os/');assert.equal(cookie.expires,-1);assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'Strict');
    await page.reload();await page.waitForFunction(()=>window.sessionFixture&&typeof cloudSyncCycle==='function');
    await page.evaluate(()=>{cloudFetchMeta=async()=>{};sportsCacheLoad=async()=>false;cloudSyncCycle=async reason=>{sessionFixture.checks.push(reason);cloudAutoSyncReady=true;cloudRuntime.sync='ON'};sessionFixture.release()});
    await page.waitForFunction(()=>loginGateUnlocked);assert.equal(await page.evaluate(()=>sessionFixture.authCalls),0,'reload keeps unlocked without credentials');
    assert.ok(await page.evaluate(()=>sessionFixture.checks.includes('session-resume')),'silent Cloud-first check');
    const second=await context.newPage();await boot(second);await second.waitForFunction(()=>loginGateUnlocked);await second.close();
    await page.evaluate(()=>showView('aiWork'));
    assert.equal(await page.locator('#developmentTeamList [data-team-key]').count(),7);
    for(const name of ['서윤','도연','세린','하니 전무','유리','아린','히나']){
      await page.locator('#developmentTeamList [data-team-key]').filter({hasText:name}).click();
      const panel=page.locator('#developmentTeamProfilePanel');for(const label of ['지금 하는 일','최근 완료','다음 할 일','2026-10-11'])assert.ok((await panel.innerText()).includes(label));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    const persisted=await context.storageState();persisted.cookies=persisted.cookies.filter(c=>c.expires!==-1);
    const restarted=await browser.newContext({storageState:persisted});await prepare(restarted);const fresh=await restarted.newPage();await boot(fresh);
    assert.equal(await fresh.evaluate(()=>loginGateUnlocked),false,'new browser session with retained auth but no cookie gates');await restarted.close();
    await page.evaluate(()=>cloudLogout());assert.equal((await context.cookies()).some(c=>c.name==='hani_login_session'),false);
    assert.equal(await page.evaluate(()=>loginGateUnlocked),false);assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),lifeBefore);
    await context.addCookies([{name:'hani_login_session',value:'synthetic-owner',url,secure:true,sameSite:'Strict'}]);
    await boot(page);assert.equal(await page.evaluate(()=>loginGateUnlocked),false,'marker without valid Supabase session gates');
    assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS actual entry/AI work UI 1440/390: session cookie attributes, reload/tab, restart boundary, logout, invalid session, seven profiles, no life changes/overflow/errors');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
