// Test-only inverse of approved release 55942f1. Never patch a browser response.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/contrast-291-delta.json'));
assert.equal(hash(bytes),'b4e41a368d08457723db009809730ef526e37c99a5527a924ce807590e3e4aa6','frozen approved contrast-291 delta');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known contrast-291 owner');
 assert.equal(hash(source),row.afterSha256,'exact contrast-291 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.replacements.toReversed()){
  assert.ok(edit.after.length,'nonempty exact contrast edit');
  assert.equal(text.split(edit.after).length-1,1,'unique complete contrast-291 edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact pre-contrast-291 bytes '+file);
 return buffer?Buffer.from(text):text;
}
module.exports={delta,hash,restore};
