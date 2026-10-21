// Node-only: execute the actual transport and compare normal online behavior to v222.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {withoutOfflineEntryUi} from './hani-offline-entry-223-preservation.mjs';
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const baseline=execFileSync(process.env.HANI_GIT_PATH||'git',['show','aa9c963c39e51775e3077bfbd22b2ea32e4372a1:hani-main.js'],{encoding:'utf8',maxBuffer:64*1024*1024});
const extract=(source,name)=>{const found=source.match(new RegExp('^(?:async )?function '+name+'\\([^]*?^\\}','m'));assert.ok(found,name);return found[0];};
function fixture(source,{active=false,pending=false,outage=false,response=Response.json({ok:true}),error}={}){
  const calls=[],notes=[];
  const context=vm.createContext({URL,Response,cloudClient:{},offlineEntry:{active},cloudOutage:{active:outage,probing:false},
    cloudMeta:()=>({offlinePending:pending}),cloudIsNetworkFailure:e=>e instanceof TypeError,
    cloudOutageError:()=>Error('paused'),cloudNoteReadFailure:(...args)=>notes.push(args),
    fetch:async(...args)=>{calls.push(args);if(error)throw error;return response;}});
  vm.runInContext(extract(source,'cloudReadFetch'),context);
  return {context,calls,notes,run:context.cloudReadFetch};
}
const endpoints=['hani-learning-quiz','hani-google-drive','hani-second-opinion','hani-agent-orchestrator','hani-deploy-bridge','hani-google-calendar'];
test('normal online Edge calls preserve request/response identity, auth and errors versus v222 even during REST pause',async()=>{
  for(const endpoint of endpoints)for(const outage of [false,true])for(const status of [200,400,401,403,402,429,500,503]){
    const response=new Response(status===200?'invalid JSON':JSON.stringify({ok:false,code:'fixture'}),{status,headers:{'Retry-After':'7'}});
    const input='https://fixture.invalid/functions/v1/'+endpoint;
    const init={method:'POST',headers:{'Content-Type':'application/json',apikey:'fixture-public',Authorization:'Bearer fixture-session'},body:JSON.stringify({prompt:'fixture',action:'list',project:{id:'p'}})};
    for(const source of [baseline,main]){
      const f=fixture(source,{outage,response});
      assert.equal(await f.run(input,init),response,'no response rewriting, status swallowing or JSON consumption');
      assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],input);assert.equal(f.calls[0][1],init,'original options including payload/headers/auth passed intact');
      assert.deepEqual(f.notes,[],'Edge failures do not trip REST pause');
    }
  }
  for(const endpoint of endpoints)for(const error of [new TypeError('network'),new Error('failure'),Object.assign(new Error('timeout'),{name:'AbortError'})]){
    for(const source of [baseline,main]){
      const f=fixture(source,{error});await assert.rejects(f.run('https://fixture.invalid/functions/v1/'+endpoint,{method:'POST'}),e=>e===error);
      assert.equal(f.calls.length,1);assert.deepEqual(f.notes,[]);
    }
  }
});
test('offline Tier A and pending relogin block all feature egress before fetch; auth is allowed only before local entry',async()=>{
  for(const [active,pending] of [[true,false],[true,true],[false,true]])for(const endpoint of endpoints){
    const f=fixture(main,{active,pending});await assert.rejects(f.run('https://fixture.invalid/functions/v1/'+endpoint,{method:'POST'}),/Cloud 복구 후 로그인/);
    assert.equal(f.calls.length,0);
  }
  const active=fixture(main,{active:true});await assert.rejects(active.run('https://fixture.invalid/auth/v1/token',{method:'POST'}),/Cloud 복구 후 로그인/);assert.equal(active.calls.length,0);
  const pending=fixture(main,{pending:true});await pending.run('https://fixture.invalid/auth/v1/token',{method:'POST'});assert.equal(pending.calls.length,1);
});
test('REST pause still suppresses reads while online writes pass through unchanged',async()=>{
  for(const source of [baseline,main]){
    const f=fixture(source,{outage:true});assert.equal((await f.run('https://fixture.invalid/rest/v1/hani_state')).status,429);assert.equal(f.calls.length,0);
    const init={method:'PATCH',body:'fixture'};await f.run('https://fixture.invalid/rest/v1/hani_state',init);assert.equal(f.calls.length,1);assert.equal(f.calls[0][1],init);
  }
});
test('exact offline markup rejects missing, duplicated, changed and moved controls',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');withoutOfflineEntryUi(html);
  const button='        <button class="login-text-btn" id="loginGateOffline" type="button" hidden>이 기기 기록으로 열기</button>\r\n';
  for(const bad of [html.replace(button,''),html+button,html.replace('hidden>이 기기 기록으로 열기','>이 기기 기록으로 열기'),html.replace(button,'')+button,html.replace('Cloud 복구 후 로그인</span>','다시 연결</span>')])assert.throws(()=>withoutOfflineEntryUi(bad));
});
