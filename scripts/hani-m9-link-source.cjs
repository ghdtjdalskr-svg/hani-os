// Baseline: main 43eda9e (v2.9.281); released affinity/mascot/version bytes are not M9 changes.
// Opt-in, exact inverse for frozen pre-link assertions. Never used by runtime.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/m9-link-delta.json'));
assert.equal(hash(bytes),'abecd6ea49bc7941db0392e3ae6147648e41724486d3b072d9306b0284367dfa','authored link delta only');
const delta=JSON.parse(bytes);
assert.equal(delta.base,'43eda9e2e3f69115c3569f585506904965c26c18');
function restore(source,file){
  const row=delta.files.find(r=>r.file===file);assert.ok(row,file);
  assert.equal(hash(source),row.afterSha256,'exact post-link input: '+file);
  for(const r of row.replacements.slice().reverse()){
    assert.notEqual(r.before,r.after);
    if(!r.after){source=r.before+source;continue;}
    assert.equal(source.split(r.after).length-1,1,'unique inverse: '+file);
    source=source.replace(r.after,()=>r.before);
  }
  assert.equal(hash(source),row.beforeSha256,'exact base restored: '+file);return source;
}
module.exports={delta,hash,restore};
