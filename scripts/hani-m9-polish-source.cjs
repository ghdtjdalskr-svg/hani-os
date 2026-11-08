// Baseline: main 43eda9e (v2.9.281); released affinity/mascot/version bytes are not M9 changes.
// Test-only exact outer inverse. Runtime never loads this module.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/m9-polish-delta.json'));
assert.equal(hash(bytes),'4e15d9856e9fb4e08a176eb3f848999f727b7b2e48f294bcac50076f353d1b3c','authored polish delta only');
const delta=JSON.parse(bytes);
assert.equal(delta.base,'43eda9e2e3f69115c3569f585506904965c26c18');
function restore(source,file){
  const row=delta.files.find(r=>r.file===file);assert.ok(row,file);
  assert.equal(hash(source),row.afterSha256,'exact post-polish input: '+file);
  for(const r of row.replacements.slice().reverse()){
    assert.notEqual(r.before,r.after);
    assert.equal(source.split(r.after).length-1,1,'unique inverse: '+file);
    source=source.replace(r.after,()=>r.before);
  }
  assert.equal(hash(source),row.beforeSha256,'exact pre-polish bytes restored: '+file);return source;
}
module.exports={delta,hash,restore};
