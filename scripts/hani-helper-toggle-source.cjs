// Test-only outer exact inverse: main296 + helper toggle -> exact main296.
// No runtime imports, Git processes or lower-layer assertion changes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/helper-toggle-delta.json'));
assert.equal(hash(bytes),'1589b556e947f7e6a787e7edc9c633d01cbeff6e767e95657ea491996ba3e4d3','frozen helper toggle delta');
const delta=JSON.parse(bytes);
assert.equal(delta.schema,1);assert.equal(delta.base,'7a91982de08a54452f6b9057f906d651f63a65ca');
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known helper toggle owner');
 assert.equal(hash(source),row.afterSha256,'exact helper toggle input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.edits.toReversed()){
  assert.ok(edit.after.length,'nonempty complete helper toggle edit');
  assert.equal(text.split(edit.after).length-1,1,'unique complete helper toggle edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact main296 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return delta.files[file]?.afterSha256===hash(source)?restore(source,file):source;}
module.exports={delta,hash,restore,project,readRawFileSync};
