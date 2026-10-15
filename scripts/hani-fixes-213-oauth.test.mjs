import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto,randomUUID} from 'node:crypto';

const edge=fs.readFileSync(new URL('../supabase/functions/hani-google-calendar/index.ts',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
async function callback(options={}){
  const secret=randomUUID(),writes=[],logs=[];let handler;
  const env={SUPABASE_URL:'https://edge.example.test',SUPABASE_ANON_KEY:'fixture-public',SUPABASE_SERVICE_ROLE_KEY:secret,GOOGLE_CLIENT_ID:'fixture-client',GOOGLE_CLIENT_SECRET:secret,HANI_GOOGLE_TOKEN_KEY:secret,...options.env};
  const admin={from(table){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:table.endsWith('oauth_states')?(options.invalid?null:{user_id:'owner',expires_at:new Date(Date.now()+(options.expired?-60000:60000)).toISOString()}):null}},delete(){writes.push('state-delete');return q},upsert(){writes.push('connection-upsert');return q},then(resolve){resolve({error:options.dbFailure?Error(secret):null})}};return q}};
  const context=vm.createContext({Request,Response,Headers,URL,URLSearchParams,TextEncoder,Uint8Array,crypto:webcrypto,atob,btoa,console:{log:(...v)=>logs.push(v),error:(...v)=>logs.push(v),warn:(...v)=>logs.push(v)},Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn}},createClient:()=>admin,fetch:async()=>{if(options.tokenFailure)throw Error(secret);return new Response(JSON.stringify({access_token:secret,refresh_token:secret,expires_in:3600}))}});
  vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*\r?\n/,'')),context);
  const response=await handler(new Request('https://edge.example.test/functions/v1/hani-google-calendar/callback?'+(options.query??'state=fixture&code=fixture')));
  const body=await response.text(),location=response.headers.get('location');
  assert.equal(response.status,302);assert.equal(body,'');assert.equal(response.headers.get('cache-control'),'no-store');assert.ok(!location.includes(secret));assert.deepEqual(logs,[]);
  return {url:new URL(location),writes};
}
test('callback success uses configured app origin and saves the connection before redirect',async()=>{
  const r=await callback({env:{HANI_APP_ORIGIN:'https://preview.example.test/ignored'}});
  assert.equal(r.url.href,'https://preview.example.test/hani-os/?google=connected');assert.deepEqual(r.writes,['state-delete','connection-upsert']);
});
test('callback failures redirect with fixed short codes and never upstream messages',async()=>{
  for(const options of [{query:''},{invalid:true},{expired:true},{query:'state=fixture&error=access_denied'},{query:'state=fixture&error=untrusted-message'},{query:'state=fixture'},{tokenFailure:true},{dbFailure:true}]){
    const r=await callback(options);assert.equal(r.url.origin,'https://ghdtjdalskr-svg.github.io');assert.equal(r.url.pathname,'/hani-os/');assert.equal(r.url.searchParams.get('google'),'error');assert.equal(r.url.searchParams.get('reason'),options.query?.includes('access_denied')?'access_denied':'callback_failed');assert.equal(r.url.searchParams.size,2);
  }
});
test('invalid configured app origin falls back to the canonical origin',async()=>{assert.equal((await callback({env:{HANI_APP_ORIGIN:'invalid'}})).url.origin,'https://ghdtjdalskr-svg.github.io')});

const client=main.slice(main.indexOf('// Google OAuth app return:'),main.indexOf('// End Google OAuth app return.')+'// End Google OAuth app return.'.length);
function browser(query,{logged=true}={}){
  const calls=[],toasts=[],replaced=[];const location={href:'https://app.example.test/hani-os/'+query};
  const context=vm.createContext({URL,location,document:{title:'HANI'},history:{state:{route:'kept'},replaceState(state,title,url){replaced.push({state,title,url});location.href=new URL(url,location.href).href}},cloudUser:logged?{id:'owner'}:null,loginGateUnlocked:logged,toast:m=>toasts.push(m),googleCalendarRefreshStatus:()=>calls.push('calendar'),googleDriveLoad:o=>calls.push(['drive',o.status])});
  vm.runInContext(client,context);return {context,calls,toasts,replaced,run:s=>vm.runInContext(s,context)};
}
test('client consumes success once, refreshes both statuses and preserves unrelated URL/state',()=>{
  const b=browser('?keep=yes&google=connected&reason=ignored#tasks');b.run('googleOAuthHandleReturn()');assert.deepEqual(b.calls,['calendar',['drive',true]]);assert.deepEqual(b.toasts,['✅ Google 연결 완료']);assert.equal(b.replaced[0].url,'/hani-os/?keep=yes#tasks');assert.equal(b.replaced[0].state.route,'kept');b.run('googleOAuthHandleReturn();googleOAuthRefreshReturnStatus()');assert.equal(b.calls.length,2);assert.equal(b.toasts.length,1);
});
test('client errors use friendly fixed text, ignoring untrusted reason text',()=>{
  for(const reason of ['access_denied','<script>untrusted</script>']){const b=browser('?google=error&reason='+encodeURIComponent(reason));b.run('googleOAuthHandleReturn()');assert.equal(b.calls.length,2);assert.equal(b.replaced[0].url,'/hani-os/');assert.match(b.toasts[0],reason==='access_denied'?/취소/:/완료하지 못/);assert.doesNotMatch(b.toasts[0],/untrusted/)}
});
test('client defers requests until login and then refreshes exactly once',()=>{
  const b=browser('?google=connected',{logged:false});b.run('googleOAuthHandleReturn()');assert.equal(b.calls.length,0);assert.equal(b.toasts.length,1);b.context.cloudUser={id:'owner'};b.run('googleOAuthRefreshReturnStatus()');assert.equal(b.calls.length,0);b.context.loginGateUnlocked=true;b.run('googleOAuthRefreshReturnStatus();googleOAuthRefreshReturnStatus()');assert.equal(b.calls.length,2);
  const unlock=main.slice(main.indexOf('function unlockLoginGate(){'),main.indexOf('function loginGateConfig('));assert.match(unlock,/queueMicrotask\(googleOAuthRefreshReturnStatus\)/);assert.match(main,/initLoginGate\(\);\r?\ngoogleOAuthHandleReturn\(\);/);
});
test('unrelated URLs and unknown google values do nothing; return handling has no data writes',()=>{
  for(const query of ['', '?reason=keep', '?google=unknown']){const b=browser(query);b.run('googleOAuthHandleReturn()');assert.equal(b.calls.length+b.toasts.length+b.replaced.length,0)}
  assert.doesNotMatch(client,/localStorage|sessionStorage|\bcommit\(|\bsave\(|\.from\(/);
});
