import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const start=main.indexOf('function cloudCreateOwnerBindingGate(');
const end=main.indexOf('function renderCloudPanel(){',start);
assert.ok(start>0&&end>start);
const code=main.slice(start,end);
let count=0;
for(const mode of ['match','mismatch','auth-error','read-error','logout','source-change','client-change']){
  const source={books:[],body:[{weight:70}],meta:{saveAt:'local'}};
  const before=JSON.stringify(source),elements={cloudOwnerVerificationResult:{textContent:''},cloudVerifySourceOwner:{disabled:false}};
  const calls=[];
  const context=vm.createContext({structuredClone,URL,state:source,cloudUser:{id:'fixture-a'},
    $:id=>elements[id],cloudConfig:()=>({url:'https://fixture.supabase.co'}),
    cloudSyncFingerprintState:value=>{const copy=structuredClone(value);delete copy.meta;return copy;}});
  context.cloudClient={auth:{getUser:async()=>({data:{user:{id:'fixture-a'}},error:mode==='auth-error'})},
    from(table){assert.equal(table,'hani_state');calls.push('SELECT');return{select(fields){assert.equal(fields,'user_id,state,revision');return{eq(field,id){assert.equal(field,'user_id');assert.equal(id,'fixture-a');return{async limit(n){assert.equal(n,1);
      if(mode==='logout'){context.cloudUser=null;vm.runInContext('cloudOwnerVerificationEpoch++;cloudOwnerVerification?.invalidate();',context);}
      if(mode==='source-change')context.state={books:[]};
      if(mode==='client-change')context.cloudClient={};
      return{data:[{user_id:id,state:mode==='mismatch'?{books:[]}:structuredClone(source),revision:1}],error:mode==='read-error'};
    }}}}}}}};
  vm.runInContext(code,context);
  await vm.runInContext('cloudVerifySourceOwner()',context);
  assert.ok(elements.cloudOwnerVerificationResult.textContent.startsWith(mode==='match'?'VERIFIED':'OWNER_BINDING_BLOCKED'));
  assert.equal(JSON.stringify(source),before);
  assert.equal(vm.runInContext('cloudOwnerVerification',context),null);
  assert.equal(vm.runInContext('cloudOwnerVerificationBusy',context),false);
  assert.ok(!elements.cloudOwnerVerificationResult.textContent.includes('fixture-a'));
  assert.ok(!elements.cloudOwnerVerificationResult.textContent.includes('weight'));
  assert.ok(calls.every(call=>call==='SELECT'));
  count++;
}
console.log(`PASS: ${count} actual diagnostic-function fixtures; source unchanged, no storage globals, no retained binding/private result.`);
