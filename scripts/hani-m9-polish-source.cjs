// Test-only exact outer inverse. Runtime never loads this module.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/m9-polish-delta.json'));
assert.equal(hash(bytes),'9d7a4fbf35c9ec2718df3d3886c62f0e00d6527199092633afb9e02960dedbb9','authored polish delta only');
const delta=JSON.parse(bytes);
assert.equal(delta.base,'4bdfa54063463a5863503eb7622d069bd4786b8b');
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
