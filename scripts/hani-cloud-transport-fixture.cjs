// Run the production transport in isolated feature fixtures; replace only network I/O.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync(require('node:path').join(__dirname,'../hani-main.js'),'utf8');
const transport=main.match(/^async function cloudReadFetch\([^]*?^\}/m)?.[0];
assert.ok(transport,'canonical Cloud transport owner');
exports.installCloudTransport=(context,{endpoint,token})=>{
  const network=context.fetch;
  Object.assign(context,{URL,Response,offlineEntry:{active:false},cloudOutage:{active:false,probing:false},cloudMeta:()=>({}),
    cloudIsNetworkFailure:error=>error instanceof TypeError,cloudNoteReadFailure(){assert.fail('Edge calls must not enter REST outage handling');}});
  context.fetch=async(input,init)=>{
    const cfg=context.cloudConfig();
    assert.equal(input,cfg.url+'/functions/v1/'+endpoint,'canonical endpoint');
    assert.equal(init.method,'POST');
    assert.deepEqual(JSON.parse(JSON.stringify(init.headers)),{'Content-Type':'application/json',apikey:cfg.key,Authorization:'Bearer '+token},'unchanged JSON/apikey/session headers');
    const body=JSON.parse(init.body);assert.ok(body&&typeof body==='object');
    return network(input,init);
  };
  vm.runInContext(transport,context);
};
