// Explicit test-only inverse. Runtime and the old preservation oracles stay intact.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/join-ieum-delta.json'));
assert.equal(hash(bytes),'0498b1b8c2afb7ba0f5cd1e92f5185ae277092755ebb4a74132a1f0b101f315f','frozen Ieum delta');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files.find(r=>r.file===file);assert.ok(row,'known Ieum owner');
 assert.equal(hash(source),row.afterSha256,'exact Ieum input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.edits.toReversed()){
  assert.equal(text.split(edit.after).length,2,'one exact Ieum fragment '+file);
  text=text.replace(edit.after,edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact pre-Ieum bytes '+file);
 return buffer?Buffer.from(text):text;
}
module.exports={delta,hash,restore};
