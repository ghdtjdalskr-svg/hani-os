// Test-only exact inverse of already merged release 292. No runtime writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/release-292-delta.json'));
assert.equal(hash(bytes),'2cd40f87808f90114e254a2925212c1d1a992db90030ac4137cf9c2ef45e704a','frozen release-292 outer');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known release-292 owner');
 assert.equal(hash(source),row.afterSha256,'exact release-292 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.edits.toReversed()){
  assert.equal(text.split(edit.after).length-1,1,'one complete release-292 edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact pre-release-292 output '+file);
 return buffer?Buffer.from(text):text;
}
module.exports={delta,hash,restore};
