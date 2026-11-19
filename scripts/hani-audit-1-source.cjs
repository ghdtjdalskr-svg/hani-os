require('./hani-release-300-preload.cjs'); // Exact deployed300 metadata precedes audit-1 capture.
// Test-only outer inverse: audit-1 candidate bytes -> fixed main299 bytes.
// Capture disk before release299 and every legacy fs adapter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/audit-1-delta.json'));
assert.equal(hash(bytes),'4a0ca4db399bc95d3ea0d8e88e951c20498e87e810f13284e0f9896b2aea4f01','frozen audit-1 fixture');
const delta=JSON.parse(bytes);assert.equal(delta.schema,1);assert.equal(delta.layer,'audit-1');
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known audit-1 owner');assert.equal(hash(source),row.afterSha256,'exact audit-1 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const e of row.edits.slice().reverse()){
  assert.equal(text.slice(e.start,e.start+e.after.length),e.after,'complete audit-1 hunk '+file);
  text=text.slice(0,e.start)+e.before+text.slice(e.start+e.after.length);
 }
 assert.equal(hash(text),row.beforeSha256,'exact main299 output '+file);return buffer?Buffer.from(text):text;
}
function project(source,file){return delta.files[file]?.afterSha256===hash(source)?restore(source,file):source;}
module.exports={delta,hash,restore,project,readRawFileSync};
