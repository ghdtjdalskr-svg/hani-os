import {installCloudTransport} from './hani-cloud-transport-fixture.cjs';
// Synthetic credentials are generated at runtime and never printed or saved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto,randomUUID,createHash} from 'node:crypto';
const edge=fs.readFileSync(new URL('../supabase/functions/hani-google-drive/index.ts',import.meta.url),'utf8');
const calendar=fs.readFileSync(new URL('../supabase/functions/hani-google-calendar/index.ts',import.meta.url));
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const client=main.slice(main.indexOf('// Google Drive FILE LIBRARY:'),main.indexOf('// End Google Drive FILE LIBRARY.')+'// End Google Drive FILE LIBRARY.'.length);
const scope='https://www.googleapis.com/auth/drive.readonly',calScope='https://www.googleapis.com/auth/calendar.events';
const plain=v=>JSON.parse(JSON.stringify(v));

async function server(options={}){
  let handler;const calls=[],db=[],logs=[],sentinel=randomUUID(),access=randomUUID(),refresh=randomUUID(),jwt=randomUUID();
  const env={SUPABASE_URL:'https://edge.example.test',SUPABASE_ANON_KEY:'fixture-public',SUPABASE_SERVICE_ROLE_KEY:sentinel,HANI_OWNER_USER_ID:'owner',GOOGLE_CLIENT_ID:'fixture-client',GOOGLE_CLIENT_SECRET:sentinel,HANI_GOOGLE_TOKEN_KEY:sentinel,...options.env};
  async function encrypt(value){const digest=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(env.HANI_GOOGLE_TOKEN_KEY));const key=await webcrypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt']);const iv=webcrypto.getRandomValues(new Uint8Array(12));const out=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(value));return Buffer.from(iv).toString('base64')+'.'+Buffer.from(out).toString('base64')}
  const connection=options.connection===null?null:{user_id:'owner',scopes:[calScope,scope],access_token_enc:await encrypt(access),refresh_token_enc:await encrypt(refresh),token_expires_at:new Date(Date.now()+(options.expired?-1000:3600000)).toISOString(),...options.connection};
  let stateRow;
  const admin={from(table){let operation='select',payload,filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},maybeSingle:async()=>{db.push({table,operation,filters});return {data:table==='hani_google_calendar_oauth_states'?stateRow:connection,error:options.dbError?Error(sentinel):null}},insert(p){operation='insert';payload=p;stateRow=p;return q},update(p){operation='update';payload=p;return q},upsert(p){operation='upsert';payload=p;return q},delete(){operation='delete';return q},then(resolve,reject){db.push({table,operation,payload,filters});return Promise.resolve({error:options.dbError?Error(sentinel):null}).then(resolve,reject)}};return q}};
  const context=vm.createContext({Request,Response,Headers,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,atob,btoa,setTimeout:()=>0,
    console:Object.fromEntries(['log','error','warn','info'].map(k=>[k,(...args)=>logs.push(args.join(' '))])),
    Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn}},
    createClient:(url,key,cfg)=>{
      if(key===env.SUPABASE_ANON_KEY)return {auth:{getUser:async()=>{if(options.authThrows)throw Error(sentinel);assert.ok(cfg.global.headers.Authorization==='Bearer '+jwt,'session header');return {data:{user:options.user===undefined?{id:'owner'}:options.user},error:options.authError||null}}}};
      assert.ok(key===sentinel,'service client uses server environment');assert.equal(cfg.auth.persistSession,false);return admin;
    },
    fetch:async(url,init={})=>{
      calls.push({url:String(url),init});assert.ok(!String(url).includes(sentinel)&&!String(url).includes(access)&&!String(url).includes(refresh),'credentials never in URL');
      if(options.fetchThrows)throw Error(sentinel);
      if(String(url).startsWith('https://oauth2.googleapis.com/token')){
        assert.equal(init.method,'POST');assert.ok(init.body.get('client_secret')===sentinel,'server secret');assert.ok(init.body.get('refresh_token')===refresh||init.body.get('grant_type')==='authorization_code','refresh token stays server-side');
        return Response.json(options.refreshFailure?{error:options.refreshFailure,error_description:sentinel}:{access_token:access,expires_in:3600,scope:calScope+' '+scope},{status:options.refreshFailure?400:200});
      }
      assert.ok(init.headers.Authorization==='Bearer '+access,'Google bearer header');assert.equal(init.method||'GET','GET');
      return Response.json(options.payload||{files:[{id:'file-1',name:'보고서',mimeType:'application/pdf',modifiedTime:'2026-10-14T16:30:00Z',size:'2048',webViewLink:'https://drive.google.com/file/d/file-1/view',access_token:sentinel}],nextPageToken:'next-page'}, {status:options.status||200});
    }
  });
  const run=source=>vm.runInContext(stripTypeScriptTypes(source.replace(/^import .*;\r?\n/m,'')),context);
  run(edge);
  async function request(body={action:'list'},auth='Bearer '+jwt,method='POST',url='https://edge.example.test/functions/v1/hani-google-drive'){
    const response=await handler(new Request(url,{method,headers:auth?{Authorization:auth}:{},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}));
    const raw=await response.text();for(const value of [sentinel,access,refresh,jwt]){assert.ok(!raw.includes(value),'response must not expose a credential');assert.ok(!logs.join('\n').includes(value),'logs must not expose a credential')}
    return {status:response.status,body:raw==='ok'?raw:response.headers.get('content-type')?.includes('json')?JSON.parse(raw):raw,headers:response.headers};
  }
  return {request,calls,db,logs,env,context,run,connection};
}

test('server: methods, CORS, verified session, owner policy fail closed before database or Google',async()=>{
  const s=await server();assert.equal((await s.request({},null,'GET')).status,405);
  assert.equal((await s.request({},null,'OPTIONS')).headers.get('access-control-allow-methods'),'POST, OPTIONS');
  for(const auth of [null,'','Bearer ','invalid'])assert.equal((await s.request({},auth)).status,401);
  for(const config of [{user:null},{authError:true},{authThrows:true},{user:{id:'other',user_metadata:{owner:true}}},{env:{HANI_OWNER_USER_ID:''}}]){
    const r=await server(config),res=await r.request();assert.equal(res.status,config.user?.id==='other'?403:config.env?503:401);assert.equal(r.db.length,0);assert.equal(r.calls.length,0);
  }
  assert.equal(s.db.length,0);assert.equal(s.calls.length,0);
  assert.match(fs.readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8'),/\[functions\.hani-google-drive\]\s+verify_jwt = true/);
});
test('server: missing connection/scope and explicit reconnect use the unchanged Calendar state contract',async()=>{
  for(const options of [{connection:null},{connection:{scopes:[calScope]}},{connection:{scopes:null}},{}]){
    const s=await server(options),r=await s.request({action:options.connection===undefined?'oauth_start':'list'});assert.equal(r.status,409);assert.equal(r.body.code,'DRIVE_SCOPE_REQUIRED');
    const url=new URL(r.body.authUrl);assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('include_granted_scopes'),'true');assert.equal(url.searchParams.get('scope'),calScope+' '+scope);assert.equal(url.searchParams.get('redirect_uri'),s.env.SUPABASE_URL+'/functions/v1/hani-google-calendar/callback');assert.equal(url.searchParams.get('access_type'),'offline');
    const inserted=s.db.find(x=>x.operation==='insert');assert.deepEqual(Object.keys(inserted.payload).sort(),['expires_at','state','user_id']);assert.equal(inserted.payload.state,url.searchParams.get('state'));assert.equal(inserted.payload.user_id,'owner');assert.ok(new Date(inserted.payload.expires_at)>new Date());assert.equal(s.calls.length,0);
  }
});
test('server: generated Drive state is accepted by the deployed Calendar callback; grants and refresh format remain compatible',async()=>{
  const s=await server({connection:{scopes:[calScope]}}),r=await s.request();const state=new URL(r.body.authUrl).searchParams.get('state');
  s.run(calendar.toString());const callback=await s.request({},null,'GET',s.env.SUPABASE_URL+'/functions/v1/hani-google-calendar/callback?state='+state+'&code=synthetic-code');
  assert.equal(callback.status,302);assert.equal(callback.body,'');assert.equal(callback.headers.get('location'),'https://ghdtjdalskr-svg.github.io/hani-os/?google=connected');
  const row=s.db.find(x=>x.operation==='upsert');assert.deepEqual(plain(row.payload.scopes),[calScope,scope]);assert.ok(row.payload.refresh_token_enc.includes('.'));assert.ok(row.payload.access_token_enc.includes('.'));assert.equal(row.payload.calendar_id,'primary');assert.ok(s.db.some(x=>x.table==='hani_google_calendar_oauth_states'&&x.operation==='delete'));
});
test('server: list root/folder/pageToken, name/fullText escaping, recent 20 and exact projection',async()=>{
  const requests=[{action:'list'},{action:'list',folderId:'folder-1',pageToken:'page-next'},{action:'search',query:"대표님's \\ report"},{action:'search',query:'실적',fullText:true},{action:'recent',pageToken:'older'}];
  for(const body of requests){const s=await server(),r=await s.request(body);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const url=new URL(s.calls[0].url),q=url.searchParams;
    assert.equal(url.pathname,'/drive/v3/files');assert.equal(q.get('pageSize'),body.action==='recent'?'20':'50');assert.equal(q.get('fields'),'nextPageToken,files(id,name,mimeType,modifiedTime,size,iconLink,webViewLink,parents)');assert.equal(q.get('pageToken'),body.pageToken||null);
    assert.match(q.get('q'),/^trashed = false/);if(body.action==='list')assert.equal(q.get('q'),`trashed = false and '${body.folderId||'root'}' in parents`);
    if(body.action==='recent')assert.equal(q.get('orderBy'),'modifiedTime desc');if(body.action==='search')assert.equal(q.get('q'),`trashed = false and ${body.fullText?'fullText':'name'} contains '${body.query.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}'`);
    assert.equal(r.body.files[0].access_token,undefined);assert.ok(s.db.every(x=>x.operation==='select'),'read only when token is fresh');assert.ok(s.db.every(x=>x.filters.some(([k,v])=>k==='user_id'&&v==='owner')));
  }
});
test('server: actual AES refresh, revoked grants, upstream errors and malformed inputs never leak tokens',async()=>{
  const s=await server({expired:true});assert.equal((await s.request()).status,200);assert.equal(s.calls.length,2);const update=s.db.find(x=>x.operation==='update');assert.equal(update.table,'hani_google_calendar_connections');assert.deepEqual(Object.keys(update.payload).sort(),['access_token_enc','token_expires_at','updated_at']);assert.deepEqual(update.filters,[['user_id','owner']]);
  const revoked=await server({expired:true,refreshFailure:'invalid_grant'});assert.equal((await revoked.request()).body.code,'DRIVE_SCOPE_REQUIRED');
  for(const options of [{fetchThrows:true},{dbError:true},{expired:true,refreshFailure:'temporarily_unavailable'},{status:500},{status:403},{status:429}]){const r=await(await server(options)).request();assert.ok(r.status>=400);assert.equal(r.body.ok,false)}
  for(const options of [{status:401},{status:403,payload:{error:{errors:[{reason:'insufficientPermissions'}]}}}])assert.equal((await(await server(options)).request()).body.code,'DRIVE_SCOPE_REQUIRED');
  for(const body of ['bad json',{action:'delete'},{action:'download'},{action:'search',query:''},{action:'search',query:'x',fullText:'yes'},{action:'list',folderId:"root' or true"},{action:'list',pageToken:2}]){const s=await server();assert.equal((await s.request(body)).status,400);assert.equal(s.calls.length,0);assert.equal(s.db.length,0)}
});

function browserModel(options={}){
  const els=new Map(),events={},calls=[],listeners={},writes=[],sentinel=randomUUID();let mode='success',pendingResolve;
  const el=key=>{if(!els.has(key))els.set(key,{textContent:'',innerHTML:'',disabled:false,hidden:false,classList:{toggle(){}},setAttribute(){},reset(){},closest(){return null}});return els.get(key)};
  const root={querySelector:el,querySelectorAll:()=>[el('button')],addEventListener:(type,fn)=>events[type]=fn};
  const context=vm.createContext({URL,Intl,Date,Response,console,cloudUser:options.signedOut?null:{id:'owner'},cloudClient:{auth:{getSession:async()=>({data:{session:{access_token:sentinel,user:{id:options.sessionOwner||'owner'}}}})}},cloudConfig:()=>({url:'https://edge.example.test',key:'fixture-public'}),document:{getElementById:()=>root},window:{addEventListener:(type,fn)=>listeners[type]=fn,open:()=>null},localStorage:{setItem(){writes.push('storage')},removeItem(){writes.push('storage')}},commit:()=>writes.push('commit'),save:()=>writes.push('save'),
    fetch:async(url,init)=>{const body=JSON.parse(init.body);calls.push(body);assert.ok(init.headers.Authorization==='Bearer '+sentinel,'client session stays in request header');assert.ok(!init.body.includes(sentinel));if(mode==='pending')return new Promise(done=>pendingResolve=done);if(mode==='scope')return Response.json({ok:false,code:'DRIVE_SCOPE_REQUIRED',authUrl:'https://accounts.google.com/o/oauth2/v2/auth?state=synthetic'},{status:409});if(mode==='error')return Response.json({ok:false,message:sentinel},{status:503});return Response.json(body.action==='status'?{ok:true,connected:true,accountHint:'owner@example.test'}:{ok:true,files:mode==='empty'?[]:[{id:'f1',name:'<img src=x onerror=alert(1)>',mimeType:'application/pdf',size:'2048',modifiedTime:'2026-10-14T16:30:00Z',webViewLink:'https://drive.google.com/file/d/f1/view'},{id:'f2',name:'unsafe',webViewLink:'javascript:alert(1)'}],nextPageToken:''})}
  });installCloudTransport(context,{endpoint:'hani-google-drive',token:sentinel});
  vm.runInContext(client,context);
  const run=code=>vm.runInContext(code,context);
  return {els,el,calls,writes,run,context,events,listeners,setMode:v=>mode=v,resolve:()=>pendingResolve(Response.json({ok:true,files:[{id:'stale',name:'private stale'}]}))};
}
test('client: real renderer logged out, connected/list, KST, size, escaping, safe new tab, empty/error/scope states; zero writes',async()=>{
  const loggedOut=browserModel({signedOut:true});await loggedOut.run('googleDriveEnter()');assert.equal(loggedOut.calls.length,0);assert.match(loggedOut.el('[data-gdrive-status]').textContent,/Cloud 로그인/);
  const b=browserModel();await b.run('googleDriveEnter()');assert.deepEqual(b.calls,[{action:'status'},{action:'list',folderId:'root'}]);assert.match(b.el('[data-gdrive-account]').textContent,/owner@example.test/);
  const rows=b.el('[data-gdrive-files]').innerHTML;assert.match(rows,/&lt;img/);assert.doesNotMatch(rows,/<img|javascript:/);assert.match(rows,/target="_blank" rel="noopener noreferrer"/);assert.match(rows,/2026\. 10\. 15\..*01:30 KST/);assert.match(rows,/2 KB/);
  b.setMode('empty');await b.run('googleDriveLoad()');assert.match(b.el('[data-gdrive-notice]').textContent,/파일이 없어요/);
  b.setMode('error');await b.run('googleDriveLoad()');assert.match(b.el('[data-gdrive-notice]').textContent,/불러오지 못했어요/);
  b.setMode('scope');await b.run('googleDriveLoad()');assert.match(b.el('[data-gdrive-status]').textContent,/읽기 권한/);assert.equal(b.el('[data-gdrive-files]').innerHTML,'');assert.deepEqual(b.writes,[]);
  assert.equal(b.run("googleDriveLink('https://drive.google.com.evil.test/path')"),'');assert.equal(b.run("googleDriveLink('https://user@drive.google.com/path')"),'');
});
test('client: loading, account switch/signout discard stale responses and mismatched session cannot fetch',async()=>{
  const b=browserModel();b.setMode('pending');const loading=b.run('googleDriveLoad()');await new Promise(done=>setTimeout(done,0));assert.match(b.el('[data-gdrive-notice]').textContent,/불러오고/);
  b.run("cloudUser={id:'other'};googleDriveRender()");b.resolve();await loading;assert.equal(b.el('[data-gdrive-files]').innerHTML,'');assert.equal(b.run('googleDriveRuntime.busy'),false);
  b.run('cloudUser=null;googleDriveInvalidate()');assert.equal(b.el('[data-gdrive-files]').innerHTML,'');assert.deepEqual(b.writes,[]);
  const mismatch=browserModel({sessionOwner:'other'});await mismatch.run('googleDriveEnter()');assert.equal(mismatch.calls.length,0);assert.match(mismatch.el('[data-gdrive-notice]').textContent,/로그인/);
});
test('client: delegated search, fullText, recent, folder, breadcrumb, pagination and refresh use one request owner',async()=>{
  const b=browserModel(),settle=()=>new Promise(done=>setTimeout(done,0));await b.run('googleDriveEnter()');
  async function click(dataset){b.events.click({target:{closest:()=>({dataset,disabled:false})}});await settle()}
  b.events.submit({target:{matches:()=>true,elements:{query:{value:'  실적  '},fullText:{checked:true}}},preventDefault(){}});await settle();assert.deepEqual(b.calls.at(-1),{action:'search',query:'실적',fullText:true});
  await click({gdriveAction:'recent'});assert.deepEqual(b.calls.at(-1),{action:'recent'});
  await click({gdriveAction:'root'});assert.deepEqual(b.calls.at(-1),{action:'list',folderId:'root'});
  b.run("googleDriveRuntime.files=[{id:'reports',name:'보고서',mimeType:'application/vnd.google-apps.folder'}]");await click({gdriveFolder:'0'});assert.deepEqual(b.calls.at(-1),{action:'list',folderId:'reports'});assert.match(b.el('[data-gdrive-breadcrumb]').innerHTML,/내 드라이브.*보고서/s);
  await click({gdriveCrumb:'0'});assert.deepEqual(b.calls.at(-1),{action:'list',folderId:'root'});
  b.run("googleDriveRuntime.nextPageToken='page2'");await click({gdriveAction:'more'});assert.deepEqual(b.calls.at(-1),{action:'list',pageToken:'page2',folderId:'root'});assert.equal(b.run('googleDriveRuntime.files.length'),2,'append deduplicates file IDs');
  await click({gdriveAction:'refresh'});assert.deepEqual(b.calls.slice(-2),[{action:'status'},{action:'list',folderId:'root'}]);assert.deepEqual(b.writes,[]);
});
test('client: popup opens synchronously, validates auth URL and requires the matching callback window and origin',async()=>{
  const b=browserModel(),popup={location:{href:''},closed:false,close(){this.closed=true}};b.context.window.open=()=>popup;b.setMode('scope');
  const pending=b.run('googleDriveConnect()');assert.equal(b.run('googleDriveRuntime.busy'),true);await pending;assert.match(popup.location.href,/^https:\/\/accounts.google.com\/o\/oauth2\/v2\/auth/);
  const before=b.calls.length;for(const e of [{origin:'https://evil.example.test',source:popup},{origin:'https://edge.example.test',source:{}}])b.listeners.message({...e,data:{type:'HANI_GOOGLE_CALENDAR_CONNECTED'}});assert.equal(b.calls.length,before);
  b.setMode('success');b.listeners.message({origin:'https://edge.example.test',source:popup,data:{type:'HANI_GOOGLE_CALENDAR_CONNECTED'}});await new Promise(done=>setTimeout(done,0));assert.equal(b.run('googleDriveRuntime.connected'),true);assert.equal(b.calls.length,before+2);
  b.context.window.open=()=>null;await b.run('googleDriveConnect()');assert.match(b.el('[data-gdrive-notice]').textContent,/차단/);assert.deepEqual(b.writes,[]);
});
test('safety: Calendar core bytes, unique DOM IDs, memory-only client and untouched data/version contract',()=>{
  const core=calendar.toString().replace(/function (?:escapeHtml|callbackRedirect)\([\s\S]*?(?=function b64\()/,'').replace(/^      return (?:html\(callbackHtml|callbackRedirect)\(.*\r?$/gm,'      return CALLBACK_RESPONSE;');
  assert.equal(createHash('sha256').update(core).digest('hex'),'2a6fb8aec3afa3a876781e8af4a06e1065db6897d8e935622039099003aaaf84','Calendar auth, token encryption and database logic unchanged outside callback response');
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  assert.doesNotMatch(client,/localStorage|sessionStorage|\.clear\s*\(|\bcommit\s*\(|\bsave\s*\(|id=["']/);assert.doesNotMatch(edge,/\.clear\s*\(|\.from\("(?!hani_google_calendar_)/);
  assert.match(html,/hani-main\.js\?v=\d+\.\d+\.\d+/);assert.match(html,/hani-ui-v02992\.js\?v=\d+\.\d+\.\d+/);
});
test('client: the existing five theme tokens used for Drive metadata meet nominal AA on its panel/raised surfaces',()=>{
  const css=fs.readFileSync(new URL('../hani-design-system.css',import.meta.url),'utf8');
  const luminance=hex=>{if(hex.length===4)hex='#'+hex.slice(1).split('').map(c=>c+c).join('');const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722};
  for(const theme of ['porcelain-cream','midnight-black','titanium-graphite','sakura-pink','alpine-blue']){
    const prefix=theme==='porcelain-cream'?':root,.login-design-choice':`:root[data-finish="${theme}"]`,line=css.split('\n').find(s=>s.startsWith(prefix));assert.ok(line,'theme exists');const tokens=Object.fromEntries([...line.matchAll(/(--[\w-]+):\s*(#[\da-f]+)/g)].map(m=>[m[1],m[2]]));
    for(const ink of ['--text-primary','--text-secondary'])for(const surface of ['--surface-panel','--surface-raised']){const a=luminance(tokens[ink]),b=luminance(tokens[surface]);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,theme+' token AA '+ink+'/'+surface)}
  }
});
