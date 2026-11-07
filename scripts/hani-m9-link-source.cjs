// Opt-in, exact inverse for frozen pre-link assertions. Never used by runtime.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/m9-link-delta.json'));
assert.equal(hash(bytes),'4e9e013fbdf802ff225ec446217824a39af419b45e68086ccbc2ddd5e6496c85','authored link delta only');
const delta=JSON.parse(bytes);
assert.equal(delta.base,'2bc93683182728877a6b8e543badb330a3312756');
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
