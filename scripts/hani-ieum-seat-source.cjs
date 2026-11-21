require('./hani-release-301-preload.cjs'); // Exact deployed301 metadata precedes seat capture.
// Test-only outer inverse: committed seat swap -> fixed main300 bytes.
// Capture disk before release-300 and every older fs adapter. Never write runtime.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/ieum-seat-layer.json'));
assert.equal(hash(bytes),'05d5e5dfa1ec54d13a94f0bc874be608efd3d76fc2530782fe30e16d814430f8','frozen ieum-seat fixture');
const delta=JSON.parse(bytes);assert.equal(delta.schema,1);assert.equal(delta.layer,'ieum-seat');
function restore(source,file){
 const row=Object.hasOwn(delta.files,file)?delta.files[file]:null;assert.ok(row,'known ieum-seat owner');
 assert.equal(hash(source),row.afterSha256,'exact ieum-seat input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const e of row.edits.toReversed()){
  assert.equal(text.slice(e.start,e.start+e.after.length),e.after,'complete ieum-seat hunk '+file);
  text=text.slice(0,e.start)+e.before+text.slice(e.start+e.after.length);
 }
 assert.equal(hash(text),row.beforeSha256,'exact main300 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(delta.files,file)&&delta.files[file].afterSha256===hash(source)?restore(source,file):source;}
module.exports={delta,hash,restore,project,readRawFileSync};
