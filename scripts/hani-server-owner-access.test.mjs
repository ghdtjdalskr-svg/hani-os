import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const helper=fs.readFileSync(new URL('../supabase/functions/hani-deploy-bridge/index.ts',import.meta.url),'utf8').match(/function ownerAccess[\s\S]*?\n}/)[0];
const ownerAccess=new Function(stripTypeScriptTypes(helper).replace('export function','function')+';return ownerAccess;')();
assert.equal(ownerAccess({id:'owner'},undefined).status,503);
assert.equal(ownerAccess({id:'owner'},'  ').status,503);
assert.equal(ownerAccess({id:'other'},'owner').status,403);
assert.equal(ownerAccess({id:'owner'},' owner ').ok,true);
assert.equal(ownerAccess({id:'other',user_metadata:{owner:true}},'owner').ok,false);
for(const slug of ['hani-deploy-bridge','hani-learning-quiz']){
  const raw=fs.readFileSync(new URL(`../supabase/functions/${slug}/index.ts`,import.meta.url),'utf8');
  assert.equal(raw.match(/function ownerAccess[\s\S]*?\n}/)[0].replaceAll('\r\n','\n'),helper.replaceAll('\r\n','\n'),'same authorization contract');
  const source=stripTypeScriptTypes(raw).replace(/^import .*;\r?\n/gm,'');
  // Execute actual top-level handler with fake verified auth and no external services.
  for(const [id,allowed,status] of [['other','owner',403],['owner','',503],[null,'owner',401]]){
    let handler,external=0;
    const ctx={Response,Request,Headers,URL,TextEncoder,TextDecoder,crypto,console,ownerAccess,
      Deno:{env:{get:k=>k==='HANI_OWNER_USER_ID'?allowed:'synthetic-config'},serve:fn=>handler=fn},
      createClient:()=>({auth:{getUser:async()=>({data:{user:id?{id}:null},error:id?null:Error('invalid')})}}),
      fetch:async()=>{external++;throw Error('Unexpected external operation')},setTimeout,clearTimeout};
    vm.createContext(ctx);vm.runInContext(source,ctx);
    const response=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{Authorization:'Bearer synthetic'},body:JSON.stringify({action:'stage_release',project:{name:'test'}})}));
    assert.equal(response.status,status,slug);
    assert.equal(external,0,slug+' denied before external operations');
  }
  let handler,external=0;
  const ctx={Response,Request,Headers,URL,TextEncoder,TextDecoder,crypto,console,ownerAccess,
    Deno:{env:{get:k=>k==='HANI_OWNER_USER_ID'?'owner':'synthetic-config'},serve:fn=>handler=fn},
    createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})}}),
    fetch:async()=>{external++;throw Error('Unexpected external operation')},setTimeout,clearTimeout};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  const response=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{Authorization:'Bearer synthetic'},body:'{}'}));
  assert.equal(response.status,400,slug+' authorized request reaches existing input validation');
  assert.equal(external,0);
  console.log('PASS '+slug+': owner allowed; other/missing-config/invalid-auth denied; no external effects');
}
