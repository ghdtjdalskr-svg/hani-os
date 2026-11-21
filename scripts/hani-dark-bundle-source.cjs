require('./hani-release-302-preload.cjs'); // Exact released302 metadata before dark-bundle capture.
// Test-only dark inverse. Capture post302 input before 301 and older fs adapters.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/dark-bundle-layer.json'));
assert.equal(hash(bytes),'f6dd835366b30e01d9d335eee8c065721d7e5b48bc9b1ed3657f3f96f6f9ca1c','frozen dark-bundle fixture');
const delta=JSON.parse(bytes);assert.equal(delta.schema,1);assert.equal(delta.layer,'dark-bundle');
function restore(source,file){
 const row=Object.hasOwn(delta.files,file)?delta.files[file]:null;assert.ok(row,'known dark-bundle owner');
 assert.equal(hash(source),row.afterSha256,'exact dark-bundle input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const e of row.edits.toReversed()){
  assert.equal(text.slice(e.start,e.start+e.after.length),e.after,'complete dark-bundle hunk '+file);
  text=text.slice(0,e.start)+e.before+text.slice(e.start+e.after.length);
 }
 assert.equal(hash(text),row.beforeSha256,'exact main301 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(delta.files,file)&&delta.files[file].afterSha256===hash(source)?restore(source,file):source;}
module.exports={delta,hash,restore,project,readRawFileSync};
